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
  // Delete marking system
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<string>>(new Set());
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

  // Delete marking functions
  const markForDeletion = (path: string) => {
    setMarkedForDeletion(prev => {
      const newSet = new Set(prev);
      newSet.add(path);
      return newSet;
    });
  };

  const unmarkForDeletion = (path: string) => {
    setMarkedForDeletion(prev => {
      const newSet = new Set(prev);
      newSet.delete(path);
      return newSet;
    });
  };

  const toggleMarkForDeletion = (path: string) => {
    if (markedForDeletion.has(path)) {
      unmarkForDeletion(path);
    } else {
      markForDeletion(path);
    }
  };

  const clearMarkedForDeletion = () => {
    setMarkedForDeletion(new Set());
  };

  // Clear marked items when file changes
  useEffect(() => {
    clearMarkedForDeletion();
  }, [selectedFile?.name]);

  // Function to recursively sort arrays by Name field
  const sortArraysByName = (obj: any): any => {
    if (Array.isArray(obj)) {
      // Check if this is an array of objects with Name fields
      const hasNameFields = obj.length > 0 && obj.every(item => 
        typeof item === "object" && item !== null && typeof item.Name === "string"
      );
      
      if (hasNameFields) {
        // Sort by Name field alphabetically
        const sorted = [...obj].sort((a, b) => a.Name.localeCompare(b.Name));
        return sorted.map(item => sortArraysByName(item));
      } else {
        // For other arrays, just recursively sort nested structures
        return obj.map(item => sortArraysByName(item));
      }
    } else if (typeof obj === "object" && obj !== null) {
      // For objects, recursively sort nested arrays
      const result: { [key: string]: any } = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = sortArraysByName(value);
      }
      return result;
    }
    return obj;
  };

  // Function to remove marked items from JSON
  const removeMarkedItems = (obj: any, basePath: string = ""): any => {
    if (Array.isArray(obj)) {
      return obj
        .filter((_, index) => !markedForDeletion.has(`${basePath}[${index}]`))
        .map((item, index) => removeMarkedItems(item, `${basePath}[${index}]`));
    } else if (typeof obj === "object" && obj !== null) {
      const result: { [key: string]: any } = {};
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = basePath ? `${basePath}.${key}` : key;
        if (!markedForDeletion.has(currentPath)) {
          result[key] = removeMarkedItems(value, currentPath);
        }
      }
      return result;
    }
    return obj;
  };

  const handleSave = () => {
    // Check if any items are marked for deletion
    if (markedForDeletion.size > 0) {
      const confirmed = window.confirm(
        `Are you sure you'd like to delete ${markedForDeletion.size} object(s)? This is irreversible.`
      );
      if (!confirmed) {
        return;
      }
    }

    // Always use rawContent as the source of truth to preserve JSON structure
    let contentToSave = rawContent;
    
    // Validate the JSON before saving regardless of mode
    validateMutation.mutate(contentToSave, {
      onSuccess: (validation) => {
        if (validation.valid) {
          try {
            let parsed = JSON.parse(contentToSave);
            
            // Remove marked items if any
            if (markedForDeletion.size > 0) {
              parsed = removeMarkedItems(parsed);
              // Clear marked items after deletion
              clearMarkedForDeletion();
            }
            
            // Sort arrays by Name field before saving
            const sortedParsed = sortArraysByName(parsed);
            const sortedContent = JSON.stringify(sortedParsed, null, 2);
            
            setJsonContent(sortedParsed);
            setRawContent(sortedContent);
            setValidationError(null);
            saveMutation.mutate(sortedContent);
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
        }
      },
      onError: () => {
        setValidationError(null); // Clear validation error on request error
      }
    });
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
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      <FileSidebar
        files={(filesData as any)?.files || []}
        selectedFile={selectedFile}
        onFileSelect={handleFileSelect}
        onSave={handleSave}
        isLoading={filesLoading}
        isSaving={saveMutation.isPending}
        hasUnsavedChanges={hasUnsavedChanges}
        onFileRestore={() => {
          // Refresh the current file content after restore
          queryClient.invalidateQueries({ queryKey: ["/api/files/load", selectedFile?.name] });
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
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
            <div className="flex-1 overflow-y-auto p-6">
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
                  {/* Location Link from Settings */}
                  {selectedFile?.url && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="text-sm text-blue-800 font-medium">Live page: </span>
                      <a
                        href={selectedFile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline text-sm"
                        data-testid="link-live-page"
                      >
                        {selectedFile.url}
                      </a>
                    </div>
                  )}

                  {jsonContent && jsonContent !== null ? (
                    typeof jsonContent === "object" && !Array.isArray(jsonContent) ? (
                      // Normal object rendering - no special handling for Content
                      Object.entries(jsonContent)
                        .filter(([key]) => key !== 'JSONTitle' && key !== 'Location')
                        .map(([key, value]) => (
                          <JsonBlock
                            key={key}
                            name={key}
                            value={value}
                            path={key}
                            isMarked={markedForDeletion.has(key)}
                            onToggleMark={toggleMarkForDeletion}
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
                        path="root"
                        isMarked={markedForDeletion.has("root")}
                        onToggleMark={toggleMarkForDeletion}
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
