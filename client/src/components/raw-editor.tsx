import { CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Editor from "@monaco-editor/react";

interface RawEditorProps {
  content: string;
  onChange: (content: string) => void;
  validationError?: string | null;
  compact?: boolean;
}

export default function RawEditor({
  content,
  onChange,
  validationError,
  compact = false,
}: RawEditorProps) {
  const lineCount = content.split("\n").length;
  const charCount = content.length;

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      {!compact && (
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Raw JSON Editor</h3>
          <Badge variant="outline" className="text-xs">
            JSON
          </Badge>
        </div>
      )}

      <div className="border border-slate-200 rounded-md overflow-hidden">
        <Editor
          height={compact ? "12rem" : "24rem"}
          defaultLanguage="json"
          value={content}
          onChange={(value) => onChange(value || "")}
          theme="vs-light"
          options={{
            minimap: { enabled: false },
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            fontSize: 13,
            fontFamily: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            lineHeight: 20,
            padding: { top: 16, bottom: 16 },
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center gap-2 text-sm">
          {validationError ? (
            <>
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-600">{validationError}</span>
            </>
          ) : (
            <span className="text-slate-600">JSON Editor - Save to validate</span>
          )}
        </div>
        <div className="text-xs text-slate-500">
          Lines: {lineCount}, Characters: {charCount}
        </div>
      </div>
    </div>
  );
}
