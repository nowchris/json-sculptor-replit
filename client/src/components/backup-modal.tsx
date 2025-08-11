import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { History, RotateCcw, Clock, FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface BackupFile {
  name: string;
  originalFile: string;
  path: string;
  size: number;
  createdAt: string;
}

interface BackupModalProps {
  selectedFileName: string | null;
  onRestore?: () => void;
}

export default function BackupModal({ selectedFileName, onRestore }: BackupModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  // Fetch backups for the selected file
  const { data: backupsData, isLoading } = useQuery({
    queryKey: ["/api/backups", selectedFileName],
    enabled: !!selectedFileName && isOpen,
    queryFn: async () => {
      if (!selectedFileName) return { backups: [] };
      const response = await apiRequest("GET", `/api/backups/${selectedFileName}`);
      return response.json() as Promise<{ backups: BackupFile[] }>;
    },
  });

  // Restore backup mutation
  const restoreMutation = useMutation({
    mutationFn: async (backupFilename: string) => {
      if (!selectedFileName) throw new Error("No file selected");
      const response = await apiRequest("POST", "/api/backups/restore", {
        filename: selectedFileName,
        backupFilename,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Backup restored successfully",
        description: "The file has been restored from the backup.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/files/load", selectedFileName] });
      setIsOpen(false);
      onRestore?.();
    },
    onError: (error) => {
      toast({
        title: "Restore failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString.replace(/-/g, ':'));
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString.replace(/-/g, ':'));
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 1) return "Less than an hour ago";
      if (diffInHours < 24) return `${Math.floor(diffInHours)} hours ago`;
      if (diffInHours < 48) return "1 day ago";
      return `${Math.floor(diffInHours / 24)} days ago`;
    } catch {
      return "Unknown time";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1" 
          disabled={!selectedFileName}
        >
          <History className="h-4 w-4 mr-1" />
          Backups
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Backups for {selectedFileName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-slate-500">Loading backups...</div>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {backupsData?.backups.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                    <p>No backups found for this file</p>
                    <p className="text-sm">Backups are created automatically when you save changes</p>
                  </div>
                ) : (
                  backupsData?.backups.map((backup, index) => (
                    <div
                      key={backup.name}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span className="font-medium text-slate-900">
                            {formatDate(backup.createdAt)}
                          </span>
                          {index === 0 && (
                            <Badge variant="outline" className="text-xs">
                              Latest
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">
                          {getRelativeTime(backup.createdAt)} • {formatFileSize(backup.size)}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {backup.name}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreMutation.mutate(backup.name)}
                        disabled={restoreMutation.isPending}
                        className="ml-4"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}