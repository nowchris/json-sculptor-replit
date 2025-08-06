import { RefreshCw, Save, FileCode, History, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { JsonFile } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

interface FileSidebarProps {
  files: JsonFile[];
  selectedFile: JsonFile | null;
  onFileSelect: (file: JsonFile) => void;
  onSave: () => void;
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export default function FileSidebar({
  files,
  selectedFile,
  onFileSelect,
  onSave,
  isLoading,
  isSaving,
  hasUnsavedChanges,
}: FileSidebarProps) {
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/files"] });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatLastModified = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return "Modified just now";
    if (diffInHours < 24) return `Modified ${Math.floor(diffInHours)} hours ago`;
    if (diffInHours < 48) return "Modified 1 day ago";
    return `Modified ${Math.floor(diffInHours / 24)} days ago`;
  };

  const getDisplayName = (file: any) => {
    // Try to extract JSONTitle from the file content if available
    if (file.content) {
      try {
        const content = typeof file.content === 'string' ? JSON.parse(file.content) : file.content;
        if (content.JSONTitle) return content.JSONTitle;
        if (content.Content?.JSONTitle) return content.Content.JSONTitle;
      } catch {
        // If JSON parsing fails, fall back to filename
      }
    }
    return file.name;
  };

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <FileCode className="h-5 w-5 text-blue-600" />
          JSON Editor
        </h1>
        <p className="text-sm text-slate-500 mt-1">Visual JSON file editor</p>
      </div>

      {/* File List */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-slate-700">Available Files</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700 px-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <ScrollArea className="flex-1 max-h-full">
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-sm text-slate-500 text-center py-4">
                Loading files...
              </div>
            ) : files.length === 0 ? (
              <div className="text-sm text-slate-500 text-center py-4">
                No JSON files found
              </div>
            ) : (
              files.map((file) => (
                <div
                  key={file.name}
                  onClick={() => onFileSelect(file)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedFile?.name === file.name
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <FileCode
                    className={`h-4 w-4 mr-3 ${
                      selectedFile?.name === file.name
                        ? "text-blue-600"
                        : "text-slate-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-medium truncate ${
                        selectedFile?.name === file.name
                          ? "text-slate-900"
                          : "text-slate-700"
                      }`}
                    >
                      {getDisplayName(file)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatLastModified(file.lastModified)}
                    </div>
                  </div>
                  {selectedFile?.name === file.name && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-slate-200 space-y-3">
        <Button
          onClick={onSave}
          disabled={!selectedFile || !hasUnsavedChanges || isSaving}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" disabled>
            <History className="h-4 w-4 mr-1" />
            Backups
          </Button>
          <Button variant="outline" size="sm" className="flex-1" disabled>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
    </div>
  );
}
