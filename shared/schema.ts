import { z } from "zod";

// JSON file metadata
export const jsonFileSchema = z.object({
  name: z.string(),
  path: z.string(),
  size: z.number(),
  lastModified: z.string(),
});

// JSON content operations
export const loadFileSchema = z.object({
  filename: z.string(),
});

export const saveFileSchema = z.object({
  filename: z.string(),
  content: z.string(),
});

export const validateJsonSchema = z.object({
  content: z.string(),
});

// Response schemas
export const fileListResponseSchema = z.object({
  files: z.array(jsonFileSchema),
});

export const fileContentResponseSchema = z.object({
  filename: z.string(),
  content: z.any(), // JSON content can be any valid JSON
  raw: z.string(),
});

export const saveResponseSchema = z.object({
  success: z.boolean(),
  filename: z.string(),
  backupPath: z.string(),
});

export const validationResponseSchema = z.object({
  valid: z.boolean(),
  error: z.string().optional(),
  line: z.number().optional(),
  column: z.number().optional(),
});

// Types
export type JsonFile = z.infer<typeof jsonFileSchema>;
export type LoadFileRequest = z.infer<typeof loadFileSchema>;
export type SaveFileRequest = z.infer<typeof saveFileSchema>;
export type ValidateJsonRequest = z.infer<typeof validateJsonSchema>;
export type FileListResponse = z.infer<typeof fileListResponseSchema>;
export type FileContentResponse = z.infer<typeof fileContentResponseSchema>;
export type SaveResponse = z.infer<typeof saveResponseSchema>;
export type ValidationResponse = z.infer<typeof validationResponseSchema>;
