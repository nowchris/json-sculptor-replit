import { useState } from "react";
import { ChevronUp, ChevronDown, Code, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import JsonField from "./json-field";
import RawEditor from "./raw-editor";
import { useJsonValidation } from "@/hooks/use-json-validation";

interface JsonBlockProps {
  name: string;
  value: any;
  onChange: (newValue: any) => void;
  onDelete: () => void;
  // Delete marking system props
  path?: string;
  isMarked?: boolean;
  onToggleMark?: (path: string) => void;
  markedForDeletion?: Set<string>;
  // Auto-expand for object-only files
  defaultExpanded?: boolean;
}

export default function JsonBlock({
  name,
  value,
  onChange,
  onDelete,
  path = "",
  isMarked = false,
  onToggleMark,
  markedForDeletion,
  defaultExpanded = false,
}: JsonBlockProps) {
  // Auto-expand Content arrays, Root Array, and defaultExpanded items
  const [isCollapsed, setIsCollapsed] = useState(
    name !== "Content" && name !== "Root Array" && !defaultExpanded
  );
  const [isRawMode, setIsRawMode] = useState(false);
  const [rawContent, setRawContent] = useState(JSON.stringify(value, null, 2));
  const { validate, validationError } = useJsonValidation();

  const getValueType = (val: any): string => {
    if (val === null) return "null";
    if (Array.isArray(val)) return "Array";
    return typeof val === "object" ? "Object" : typeof val;
  };

  // Check if this array should be protected from deletion
  const isProtectedArray = () => {
    return Array.isArray(value) && (name === "Content" || name === "Root Array");
  };

  // Handle delete button click - mark for deletion or delete immediately
  const handleDeleteClick = () => {
    if (onToggleMark && path) {
      // Use marking system if available
      onToggleMark(path);
    } else {
      // Fallback to immediate deletion
      onDelete();
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Object":
        return "bg-blue-100 text-blue-600";
      case "Array":
        return "bg-green-100 text-green-600";
      case "string":
        return "bg-purple-100 text-purple-600";
      case "number":
        return "bg-orange-100 text-orange-600";
      case "boolean":
        return "bg-pink-100 text-pink-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const handleFieldChange = (key: string, newValue: any) => {
    if (Array.isArray(value)) {
      const newArray = [...value];
      newArray[parseInt(key)] = newValue;
      onChange(newArray);
    } else if (typeof value === "object" && value !== null) {
      onChange({ ...value, [key]: newValue });
    }
  };

  const handleFieldDelete = (key: string) => {
    if (Array.isArray(value)) {
      const newArray = value.filter((_, index) => index.toString() !== key);
      onChange(newArray);
    } else if (typeof value === "object" && value !== null) {
      const newObj = { ...value };
      delete newObj[key];
      onChange(newObj);
    }
  };

  const handleAddField = () => {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        // If array is empty, add a simple empty string
        onChange([""])
      } else {
        // Check if this is a complex object array
        const lastItem = value[value.length - 1];
        if (typeof lastItem === "object" && lastItem !== null && !Array.isArray(lastItem)) {
          // Copy the structure of the last item with empty/default values
          const emptyItem = Object.keys(lastItem).reduce((acc, key) => {
            const originalValue = lastItem[key];
            if (typeof originalValue === "string") {
              acc[key] = "";
            } else if (typeof originalValue === "number") {
              acc[key] = 0;
            } else if (typeof originalValue === "boolean") {
              acc[key] = false;
            } else if (Array.isArray(originalValue)) {
              acc[key] = [];
            } else if (typeof originalValue === "object" && originalValue !== null) {
              acc[key] = {};
            } else {
              acc[key] = null;
            }
            return acc;
          }, {} as any);
          
          // Add the new item to the beginning of the array for visual purposes
          onChange([emptyItem, ...value]);
        } else {
          // For simple arrays, add the same type as the last item
          if (typeof lastItem === "string") {
            onChange(["", ...value]);
          } else if (typeof lastItem === "number") {
            onChange([0, ...value]);
          } else if (typeof lastItem === "boolean") {
            onChange([false, ...value]);
          } else {
            onChange([lastItem, ...value]);
          }
        }
      }
    } else if (typeof value === "object" && value !== null) {
      const newKey = `new_field_${Object.keys(value).length}`;
      onChange({ ...value, [newKey]: "" });
    }
  };

  const handleRawChange = (newRaw: string) => {
    setRawContent(newRaw);
    // Clear validation error when user starts typing
    if (validationError) {
      validate(newRaw); // This will clear the error if content is now valid
    }
  };

  const handleRawSave = () => {
    const validation = validate(rawContent);

    if (validation.valid) {
      try {
        const parsed = JSON.parse(rawContent);
        onChange(parsed);
        setIsRawMode(false);
        // Update the raw content to match parsed data to prevent drift
        setRawContent(JSON.stringify(parsed, null, 2));
      } catch {
        // Should not happen if validation passed
      }
    }
  };

  const handleRawCancel = () => {
    setRawContent(JSON.stringify(value, null, 2));
    // Clear any validation errors when canceling
    const validation = validate(JSON.stringify(value, null, 2));
    setIsRawMode(false);
  };

  const valueType = getValueType(value);
  const canEdit = typeof value === "object" && value !== null;

  return (
    <Card className={`shadow-sm ${
      isMarked 
        ? "border-red-500 bg-red-50" 
        : "border-slate-200 bg-white"
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className={`font-semibold ${
              isMarked ? "text-red-900 line-through" : "text-slate-900"
            }`}>{name}</h3>
            <Badge className={
              isMarked 
                ? "bg-red-100 text-red-600 border-red-300"
                : getTypeColor(valueType)
            }>{valueType}</Badge>
            {isRawMode && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-600 border-amber-200"
              >
                Raw Edit Mode
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isRawMode ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRawSave}
                  disabled={!!validationError}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRawCancel}
                  className="text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsRawMode(true);
                      setIsCollapsed(false); // Auto-expand when entering raw mode
                    }}
                    title="Edit raw JSON"
                  >
                    <Code className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  title={isCollapsed ? "Expand" : "Collapse"}
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteClick}
                  disabled={isProtectedArray()}
                  className={
                    isProtectedArray() 
                      ? "text-gray-400 cursor-not-allowed"
                      : isMarked 
                        ? "text-red-700 hover:text-red-900 bg-red-100"
                        : "text-red-500 hover:text-red-700"
                  }
                  title={
                    isProtectedArray() 
                      ? "Cannot delete protected arrays (Content, Root Array)"
                      : isMarked 
                        ? "Unmark for deletion" 
                        : "Mark for deletion"
                  }
                  data-testid={`button-delete-${name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="pt-0">
          {isRawMode ? (
            <RawEditor
              content={rawContent}
              onChange={handleRawChange}
              validationError={validationError}
              compact
            />
          ) : canEdit ? (
            <div className="space-y-4">
              {Array.isArray(value) ? (
                <>
                  {/* Check if this is a simple array (strings, numbers, booleans) */}
                  {value.every(
                    (item) => typeof item !== "object" || item === null,
                  ) ? (
                    /* Simple array - render as list without indices */
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-sm text-slate-600 mb-3">
                        Array with {value.length} item
                        {value.length !== 1 ? "s" : ""}
                      </div>
                      <div className="space-y-2">
                        {value.map((item, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <JsonField
                              fieldKey={index.toString()}
                              value={item}
                              onChange={handleFieldChange}
                              onDelete={handleFieldDelete}
                              isArrayItem
                            />
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddField}
                        className="w-full mt-3 text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  ) : (
                    /* Complex array - render individual blocks with smart names, sorted alphabetically by Name */
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddField}
                        className="w-full mb-4 text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                      
                      {value
                        .map((item, index) => ({ item, index }))
                        .map(({ item, index }) => {
                        // Try to find a suitable display name for the object
                        let displayName = `[${index}]`;
                        if (typeof item === "object" && item !== null) {
                          // Look for common name fields in order of preference, prioritizing name fields over IDs
                          const nameFields = [
                            "Name",
                            "name", 
                            "Title",
                            "title",
                            "username",
                            "email",
                            "label",
                            "displayName",
                            "key"
                          ];
                          for (const field of nameFields) {
                            if (
                              item[field] !== undefined &&
                              item[field] !== null &&
                              item[field] !== "" &&
                              typeof item[field] === "string"
                            ) {
                              displayName = `${item[field]}`;
                              break;
                            }
                          }
                          // Only use ID as last resort if no name field found
                          if (displayName === `[${index}]` && item.id !== undefined) {
                            displayName = `ID: ${item.id}`;
                          }
                        }

                        return (
                          <JsonBlock
                            key={index}
                            name={displayName}
                            value={item}
                            path={`${path}[${index}]`}
                            isMarked={markedForDeletion?.has(`${path}[${index}]`) || false}
                            onToggleMark={onToggleMark}
                            markedForDeletion={markedForDeletion || undefined}
                            onChange={(newValue) =>
                              handleFieldChange(index.toString(), newValue)
                            }
                            onDelete={() => {
                              if (onToggleMark) {
                                onToggleMark(`${path}[${index}]`);
                              } else {
                                handleFieldDelete(index.toString());
                              }
                            }}
                          />
                        );
                      })}
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Render simple fields first */}
                  {Object.entries(value).map(([key, fieldValue]) => {
                    if (typeof fieldValue !== "object" || fieldValue === null) {
                      return (
                        <JsonField
                          key={key}
                          fieldKey={key}
                          value={fieldValue}
                          onChange={handleFieldChange}
                          onDelete={handleFieldDelete}
                        />
                      );
                    }
                    return null;
                  })}


                  {/* Then render complex nested objects */}
                  {Object.entries(value).map(([key, fieldValue]) => {
                    if (typeof fieldValue === "object" && fieldValue !== null) {
                      return (
                        <JsonBlock
                          key={key}
                          name={key}
                          value={fieldValue}
                          path={`${path}.${key}`}
                          isMarked={markedForDeletion?.has(`${path}.${key}`) || false}
                          onToggleMark={onToggleMark}
                          markedForDeletion={markedForDeletion || undefined}
                          onChange={(newValue) =>
                            handleFieldChange(key, newValue)
                          }
                          onDelete={() => {
                            if (onToggleMark) {
                              onToggleMark(`${path}.${key}`);
                            } else {
                              handleFieldDelete(key);
                            }
                          }}
                        />
                      );
                    }
                    return null;
                  })}
                </>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded-md font-mono text-sm">
              {JSON.stringify(value)}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
