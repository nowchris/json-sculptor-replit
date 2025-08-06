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

export default function JsonBlock({ name, value, onChange, onDelete }: JsonBlockProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
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
      case "Object": return "bg-blue-100 text-blue-600";
      case "Array": return "bg-green-100 text-green-600";
      case "string": return "bg-purple-100 text-purple-600";
      case "number": return "bg-orange-100 text-orange-600";
      case "boolean": return "bg-pink-100 text-pink-600";
      default: return "bg-slate-100 text-slate-600";
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
    const validation = validate(newRaw);
    
    if (validation.valid) {
      try {
        const parsed = JSON.parse(newRaw);
        onChange(parsed);
      } catch {
        // Should not happen if validation passed
      }
    }
  };

  const handleRawSave = () => {
    if (!validationError) {
      setIsRawMode(false);
    }
  };

  const handleRawCancel = () => {
    setRawContent(JSON.stringify(value, null, 2));
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
            <Badge className={getTypeColor(valueType)}>
              {valueType}
            </Badge>
            {isRawMode && (
              <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
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
                value.map((item, index) => (
                  <JsonField
                    key={index}
                    fieldKey={index.toString()}
                    value={item}
                    onChange={handleFieldChange}
                    onDelete={handleFieldDelete}
                    isArrayItem
                  />
                ))
              ) : (
                Object.entries(value).map(([key, fieldValue]) => (
                  <JsonField
                    key={key}
                    fieldKey={key}
                    value={fieldValue}
                    onChange={handleFieldChange}
                    onDelete={handleFieldDelete}
                  />
                ))
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddField}
                className="w-full text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add {Array.isArray(value) ? "Item" : "Field"}
              </Button>
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
