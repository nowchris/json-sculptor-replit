import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Settings, Save, RefreshCw, AlertCircle } from "lucide-react";
import type { Settings as SettingsType, JsonFile } from "@shared/schema";

interface SettingsModalProps {
  files: JsonFile[];
}

// Create zod schema for form validation
const createSettingsFormSchema = (filenames: string[]) => {
  const schemaObject: Record<string, any> = {};
  
  filenames.forEach(filename => {
    schemaObject[`${filename}_title`] = z.string().optional();
    schemaObject[`${filename}_url`] = z.string()
      .optional()
      .refine((val) => {
        if (!val || val.trim() === '') return true;
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      }, "Please enter a valid URL (e.g., https://example.com)");
  });
  
  return z.object(schemaObject);
};

type SettingsFormData = Record<string, string | undefined>;

export default function SettingsModal({ files }: SettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Create form schema based on available files
  const formSchema = createSettingsFormSchema(files.map(f => f.name));
  
  // Initialize form
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  // Load settings
  const { data: settingsData, isLoading: settingsLoading, error: settingsError } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/settings");
      if (!response.ok) {
        throw new Error('Failed to load settings');
      }
      return response.json() as Promise<{ settings: SettingsType }>;
    },
    enabled: isOpen,
    retry: 2,
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: SettingsType) => {
      const response = await apiRequest("POST", "/api/settings", { settings });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "File titles and URLs have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Initialize form data when settings load
  useEffect(() => {
    if (settingsData?.settings) {
      const formData: SettingsFormData = {};
      
      // Initialize all files with empty values
      files.forEach(file => {
        formData[`${file.name}_title`] = '';
        formData[`${file.name}_url`] = '';
      });
      
      // Override with existing settings
      settingsData.settings.entries.forEach(entry => {
        if (files.find(f => f.name === entry.filename)) {
          formData[`${entry.filename}_title`] = entry.title || '';
          formData[`${entry.filename}_url`] = entry.url || '';
        }
      });
      
      form.reset(formData);
    }
  }, [settingsData, files, form]);

  const onSubmit = (data: SettingsFormData) => {
    const entries = files
      .map(file => ({
        filename: file.name,
        title: data[`${file.name}_title`]?.trim() || undefined,
        url: data[`${file.name}_url`]?.trim() || undefined,
      }))
      .filter(entry => entry.title || entry.url); // Only save entries with at least one field set

    saveSettingsMutation.mutate({ entries });
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset form when closing
      form.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full"
          data-testid="button-settings"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>File Settings</DialogTitle>
          <DialogDescription>
            Configure custom titles and URLs for your JSON files. These will be displayed in the sidebar and editor.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            {settingsError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load settings: {settingsError.message}
                </AlertDescription>
              </Alert>
            )}
            
            {settingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                Loading settings...
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No JSON files found
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {files.map((file) => (
                    <div 
                      key={file.name} 
                      className="border rounded-lg p-4 space-y-4"
                      data-testid={`settings-file-${file.name}`}
                    >
                      <div className="font-medium text-sm text-muted-foreground">
                        {file.name}
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          control={form.control}
                          name={`${file.name}_title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Display Title</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter a custom title for this file"
                                  data-testid={`input-title-${file.name}`}
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name={`${file.name}_url`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Live Page URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter the live page URL (https://example.com)"
                                  data-testid={`input-url-${file.name}`}
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </form>
              </Form>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            data-testid="button-cancel-settings"
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={saveSettingsMutation.isPending || settingsLoading}
            data-testid="button-save-settings"
          >
            {saveSettingsMutation.isPending ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}