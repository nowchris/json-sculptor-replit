import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FileSidebar from "@/components/file-sidebar";
import JsonBlock from "@/components/json-block";
import RawEditor from "@/components/raw-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Code, Eye } from "lucide-react";
import type { FileContentResponse, JsonFile, SaveResponse } from "@shared/schema";

export default function JsonEditor() {
  const [selectedFile, setSelectedFile] = useState<JsonFile | null>(null);
  const [isRawMode, setIsRawMode] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [jsonContent, setJsonContent] = useState<any>(null);
  const [rawContent, setRawContent] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load file list
  const { data: filesData, isLoading: filesLoading } = useQuery({
    queryKey: ["/api/files"],
  });

  // Load selected file content
  const { data: fileContent, isLoading: contentLoading } = useQuery({
    queryKey: ["/api/files/load", selectedFile?.name],
    enabled: !!selectedFile,
    queryFn: async () => {
      if (!selectedFile) return null;
      const response = await apiRequest("POST", "/api/files/load", {
        filename: selectedFile.name,
      });
      return response.json() as Promise<FileContentResponse>;
    },
  });

  // Save file mutation
  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedFile) throw new Error("No file selected");
      const response = await apiRequest("POST", "/api/files/save", {
        filename: selectedFile.name,
        content,
      });
      return response.json() as Promise<SaveResponse>;
    },
    onSuccess: (data) => {
      setHasUnsavedChanges(false);
      toast({
        title: "File saved successfully",
        description: `Backup created: ${data.backupPath}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Validate JSON mutation
  const validateMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/validate", { content });
      return response.json();
    },
  });

  // Initialize content when file loads
  useEffect(() => {
    if (fileContent) {
      setJsonContent(fileContent.content);
      setRawContent(fileContent.raw);
      setValidationError(null);
      setHasUnsavedChanges(false);
    }
  }, [fileContent]);

  const handleFileSelect = (file: JsonFile) => {
    if (hasUnsavedChanges) {
      if (!confirm("You have unsaved changes. Continue?")) return;
    }
    setSelectedFile(file);
    setIsRawMode(false);
  };

  const handleJsonChange = (newContent: any) => {
    setJsonContent(newContent);
    setRawContent(JSON.stringify(newContent, null, 2));
    setHasUnsavedChanges(true);
    setValidationError(null);
  };

  const handleRawChange = (newRaw: string) => {
    setRawContent(newRaw);
    setHasUnsavedChanges(true);
    // Clear any existing validation error when user starts typing
    setValidationError(null);
  };

  const handleSave = () => {
    const contentToSave = isRawMode ? rawContent : JSON.stringify(jsonContent, null, 2);
    
    // If in raw mode, validate the JSON before saving
    if (isRawMode) {
      validateMutation.mutate(contentToSave, {
        onSuccess: (validation) => {
          if (validation.valid) {
            try {
              const parsed = JSON.parse(contentToSave);
              setJsonContent(parsed);
              setValidationError(null);
              saveMutation.mutate(contentToSave);
            } catch {
              setValidationError("Failed to parse JSON");
            }
          } else {
            setValidationError(validation.error || "Invalid JSON");
            toast({
              title: "Cannot save file", 
              description: "Please fix JSON validation errors first",
              variant: "destructive",
            });
            // Don't prevent further save attempts - just show the error
          }
        },
      });
    } else {
      // Visual mode - content is already valid
      saveMutation.mutate(contentToSave);
    }
  };

  const toggleMode = (mode: "visual" | "raw") => {
    if (mode === "raw" && validationError) {
      toast({
        title: "Cannot switch to raw mode",
        description: "Please fix JSON validation errors first",
        variant: "destructive",
      });
      return;
    }
    setIsRawMode(mode === "raw");
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <FileSidebar
        files={(filesData as any)?.files || []}
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onSave={handleSave}
        isLoading={filesLoading}
        isSaving={saveMutation.isPending}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <>
            {/* Top Bar */}
            <div className="bg-white border-b border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">
                    {selectedFile.name}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span>
                      Last modified {new Date(selectedFile.lastModified).toLocaleString()}
                    </span>
                  </div>
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      Unsaved changes
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* Mode Toggle */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-1">
                    <Button
                      variant={!isRawMode ? "default" : "ghost"}
                      size="sm"
                      onClick={() => toggleMode("visual")}
                      className="px-3 py-1 text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Visual
                    </Button>
                    <Button
                      variant={isRawMode ? "default" : "ghost"}
                      size="sm"
                      onClick={() => toggleMode("raw")}
                      className="px-3 py-1 text-sm"
                    >
                      <Code className="h-4 w-4 mr-1" />
                      Raw JSON
                    </Button>
                  </div>

                  {/* Validation Status */}
                  <div className="flex items-center gap-2 text-sm">
                    {validationError ? (
                      <>
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span className="text-red-600">Invalid JSON</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-slate-600">Valid JSON</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-auto p-6">
              {contentLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-slate-500">Loading file content...</div>
                </div>
              ) : isRawMode ? (
                <RawEditor
                  content={rawContent}
                  onChange={handleRawChange}
                  validationError={validationError}
                />
              ) : (
                <div className="space-y-6">
                  {jsonContent && jsonContent !== null ? (
                    typeof jsonContent === "object" && !Array.isArray(jsonContent) ? (
                      Object.entries(jsonContent).map(([key, value]) => (
                        <JsonBlock
                          key={key}
                          name={key}
                          value={value}
                          onChange={(newValue) => {
                            const newContent = { ...jsonContent, [key]: newValue };
                            handleJsonChange(newContent);
                          }}
                          onDelete={() => {
                            const newContent = { ...jsonContent };
                            delete newContent[key];
                            handleJsonChange(newContent);
                          }}
                        />
                      ))
                    ) : Array.isArray(jsonContent) ? (
                      <JsonBlock
                        key="root"
                        name="Root Array"
                        value={jsonContent}
                        onChange={handleJsonChange}
                        onDelete={() => handleJsonChange([])}
                      />
                    ) : (
                      <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="font-medium text-slate-900 mb-2">Primitive Value</h3>
                        <div className="font-mono text-sm p-4 bg-white rounded border">
                          {JSON.stringify(jsonContent)}
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      No content to display
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Code className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                Select a JSON file to edit
              </h3>
              <p className="text-slate-500">
                Choose a file from the sidebar to start editing
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
