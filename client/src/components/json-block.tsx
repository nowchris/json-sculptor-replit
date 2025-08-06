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
}

export default function JsonBlock({
  name,
  value,
  onChange,
  onDelete,
}: JsonBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isRawMode, setIsRawMode] = useState(false);
  const [rawContent, setRawContent] = useState(JSON.stringify(value, null, 2));
  const { validate, validationError } = useJsonValidation();

  const getValueType = (val: any): string => {
    if (val === null) return "null";
    if (Array.isArray(val)) return "Array";
    return typeof val === "object" ? "Object" : typeof val;
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
      onChange([...value, ""]);
    } else if (typeof value === "object" && value !== null) {
      const newKey = `new_field_${Object.keys(value).length}`;
      onChange({ ...value, [newKey]: "" });
    }
  };

  const handleRawChange = (newRaw: string) => {
    setRawContent(newRaw);
  };

  const handleRawSave = () => {
    const validation = validate(rawContent);

    if (validation.valid) {
      try {
        const parsed = JSON.parse(rawContent);
        onChange(parsed);
        setIsRawMode(false);
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
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-slate-900">{name}</h3>
            <Badge className={getTypeColor(valueType)}>{valueType}</Badge>
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
                    onClick={() => setIsRawMode(true)}
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
                  onClick={onDelete}
                  className="text-red-500 hover:text-red-700"
                  title="Delete block"
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
                    /* Complex array - render individual blocks with smart names */
                    <>
                      {value.map((item, index) => {
                        // Try to find a suitable display name for the object
                        let displayName = `[${index}]`;
                        if (typeof item === "object" && item !== null) {
                          // Look for common name fields in order of preference
                          const nameFields = [
                            "name",
                            "Name", 
                            "title",
                            "Title",
                            "username",
                            "email",
                            "id",
                            "key",
                          ];
                          for (const field of nameFields) {
                            if (
                              item[field] !== undefined &&
                              item[field] !== null &&
                              item[field] !== ""
                            ) {
                              displayName = `${item[field]}`;
                              break;
                            }
                          }
                        }

                        return (
                          <JsonBlock
                            key={index}
                            name={displayName}
                            value={item}
                            onChange={(newValue) =>
                              handleFieldChange(index.toString(), newValue)
                            }
                            onDelete={() => handleFieldDelete(index.toString())}
                          />
                        );
                      })}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddField}
                        className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
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

                  {/* Add Field button after simple fields */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddField}
                    className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Field
                  </Button>

                  {/* Then render complex nested objects */}
                  {Object.entries(value).map(([key, fieldValue]) => {
                    if (typeof fieldValue === "object" && fieldValue !== null) {
                      return (
                        <JsonBlock
                          key={key}
                          name={key}
                          value={fieldValue}
                          onChange={(newValue) =>
                            handleFieldChange(key, newValue)
                          }
                          onDelete={() => handleFieldDelete(key)}
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
