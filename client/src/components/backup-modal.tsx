import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { History, RotateCcw, Clock, FileText, X, Eye, Copy } from "lucide-react";
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
  const [previewBackup, setPreviewBackup] = useState<string | null>(null);
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

  // Fetch backup preview
  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ["/api/backups/preview", selectedFileName, previewBackup],
    enabled: !!selectedFileName && !!previewBackup,
    queryFn: async () => {
      if (!selectedFileName || !previewBackup) return null;
      const response = await apiRequest("GET", `/api/backups/${selectedFileName}/${previewBackup}/preview`);
      return response.json() as Promise<{ filename: string, raw: string, size: number, createdAt: string }>;
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
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied to clipboard",
        description: "Backup content has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) setPreviewBackup(null); // Reset preview when main modal closes
    }}>
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
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Backups for {selectedFileName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-slate-500">Loading backups...</div>
            </div>
          ) : (
            <ScrollArea className="h-full">
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
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => setPreviewBackup(backup.name)}
                        data-testid={`backup-preview-${backup.name}`}
                      >
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
                          <Badge variant="outline" className="text-xs text-blue-600">
                            <Eye className="h-3 w-3 mr-1" />
                            Click to preview
                          </Badge>
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
                        data-testid={`button-restore-${backup.name}`}
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

      {/* Backup Preview Dialog */}
      <Dialog open={!!previewBackup} onOpenChange={() => setPreviewBackup(null)}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview: {previewBackup}
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 min-h-0">
            {previewLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-500">Loading backup content...</div>
              </div>
            ) : previewData ? (
              <div className="h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-slate-500">
                    {formatFileSize(previewData.size)} • {formatDate(previewData.createdAt)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(previewData.raw)}
                    data-testid="button-copy-backup"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <ScrollArea className="flex-1 border rounded-lg">
                  <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                    {previewData.raw}
                  </pre>
                </ScrollArea>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Failed to load backup content
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setPreviewBackup(null)}>
              Close Preview
            </Button>
            {previewData && previewBackup && (
              <Button
                onClick={() => {
                  restoreMutation.mutate(previewBackup);
                  setPreviewBackup(null);
                }}
                disabled={restoreMutation.isPending}
                data-testid="button-restore-from-preview"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {restoreMutation.isPending ? "Restoring..." : "Restore This Backup"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}