import { CheckCircle, XCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useRef, useState } from "react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  const lineCount = content.split("\n").length;
  const charCount = content.length;

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

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

      <div className="relative flex">
        {/* Line numbers */}
        <div 
          className="flex-shrink-0 p-4 pr-2 bg-slate-100 border-r border-slate-200 text-right overflow-hidden"
          style={{ height: compact ? '12rem' : '24rem' }}
        >
          <div 
            className="font-mono text-xs text-slate-500 leading-6"
            style={{
              transform: `translateY(-${scrollTop}px)`,
              transition: 'none'
            }}
          >
            {content.split('\n').map((_, index) => (
              <div key={index}>{index + 1}</div>
            ))}
          </div>
        </div>
        
        {/* Text area */}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          className={`flex-1 font-mono text-sm border-0 resize-none focus:ring-0 focus:outline-none bg-slate-50 leading-6 ${
            compact ? "h-48" : "h-96"
          }`}
          placeholder="Enter JSON content here..."
          style={{ paddingLeft: '12px' }}
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
