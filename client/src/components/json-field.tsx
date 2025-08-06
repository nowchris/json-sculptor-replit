import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface JsonFieldProps {
  fieldKey: string;
  value: any;
  onChange: (key: string, newValue: any) => void;
  onDelete: (key: string) => void;
  isArrayItem?: boolean;
}

export default function JsonField({
  fieldKey,
  value,
  onChange,
  onDelete,
  isArrayItem = false,
}: JsonFieldProps) {
  const [editingKey, setEditingKey] = useState(false);
  const [keyValue, setKeyValue] = useState(fieldKey);

  const handleKeyChange = (newKey: string) => {
    setKeyValue(newKey);
  };

  const handleKeyBlur = () => {
    if (keyValue !== fieldKey && !isArrayItem) {
      // Handle key rename by notifying parent to restructure
      // This would need more complex logic in a real implementation
    }
    setEditingKey(false);
  };

  const handleValueChange = (newValue: any) => {
    onChange(fieldKey, newValue);
  };

  const getInputType = (val: any) => {
    if (typeof val === "boolean") return "boolean";
    if (typeof val === "number") return "number";
    if (typeof val === "string" && val.length > 50) return "textarea";
    return "text";
  };

  const renderValueInput = () => {
    // Handle nested objects and arrays differently
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value)) {
        return (
          <div className="col-span-2 p-3 bg-slate-50 border rounded-md">
            <div className="text-sm text-slate-600 mb-2">
              Array with {value.length} item{value.length !== 1 ? 's' : ''}
            </div>
            <div className="text-xs font-mono text-slate-500 max-h-20 overflow-y-auto">
              {JSON.stringify(value, null, 2)}
            </div>
          </div>
        );
      } else {
        return (
          <div className="col-span-2 p-3 bg-slate-50 border rounded-md">
            <div className="text-sm text-slate-600 mb-2">
              Object with {Object.keys(value).length} field{Object.keys(value).length !== 1 ? 's' : ''}
            </div>
            <div className="text-xs font-mono text-slate-500 max-h-20 overflow-y-auto">
              {JSON.stringify(value, null, 2)}
            </div>
          </div>
        );
      }
    }

    const inputType = getInputType(value);

    switch (inputType) {
      case "boolean":
        return (
          <Switch
            checked={Boolean(value)}
            onCheckedChange={(checked) => handleValueChange(checked)}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={value || 0}
            onChange={(e) => handleValueChange(Number(e.target.value))}
            className="col-span-2"
          />
        );

      case "textarea":
        return (
          <Textarea
            value={value || ""}
            onChange={(e) => handleValueChange(e.target.value)}
            className="col-span-2 min-h-[100px]"
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value || ""}
            onChange={(e) => {
              const val = e.target.value;
              // Try to parse as number if it looks like one
              const numValue = Number(val);
              if (val !== "" && !isNaN(numValue) && val === numValue.toString()) {
                handleValueChange(numValue);
              } else {
                handleValueChange(val);
              }
            }}
            className="col-span-2"
          />
        );
    }
  };

  return (
    <div className={`${isArrayItem ? "flex items-center gap-2" : "grid grid-cols-4 gap-4 items-center"} group`}>
      {!isArrayItem && (
        <div className="flex items-center gap-2">
          {editingKey ? (
            <Input
              value={keyValue}
              onChange={(e) => handleKeyChange(e.target.value)}
              onBlur={handleKeyBlur}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleKeyBlur();
                if (e.key === "Escape") {
                  setKeyValue(fieldKey);
                  setEditingKey(false);
                }
              }}
              className="text-sm font-medium"
              autoFocus
            />
          ) : (
            <Label
              className="text-sm font-medium text-slate-700 cursor-pointer"
              onClick={() => setEditingKey(true)}
            >
              {fieldKey}
            </Label>
          )}
        </div>
      )}

      <div className={`${isArrayItem ? "flex-1" : "col-span-2"} flex items-center gap-2`}>
        {renderValueInput()}
      </div>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(fieldKey)}
          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
