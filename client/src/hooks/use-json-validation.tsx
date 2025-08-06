import { useState, useCallback } from "react";

interface ValidationResult {
  valid: boolean;
  error?: string;
  line?: number;
  column?: number;
}

export function useJsonValidation() {
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = useCallback((jsonString: string): ValidationResult => {
    try {
      JSON.parse(jsonString);
      setValidationError(null);
      return { valid: true };
    } catch (error) {
      if (error instanceof SyntaxError) {
        const match = error.message.match(/at position (\d+)/);
        let line = 1;
        let column = 1;
        
        if (match) {
          const position = parseInt(match[1]);
          const lines = jsonString.substring(0, position).split('\n');
          line = lines.length;
          column = lines[lines.length - 1].length + 1;
        }
        
        const errorMessage = `${error.message} (line ${line}, column ${column})`;
        setValidationError(errorMessage);
        
        return {
          valid: false,
          error: errorMessage,
          line,
          column,
        };
      }
      
      const errorMessage = 'Unknown JSON parsing error';
      setValidationError(errorMessage);
      
      return {
        valid: false,
        error: errorMessage,
      };
    }
  }, []);

  return { validate, validationError };
}
