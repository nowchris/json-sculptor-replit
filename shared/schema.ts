import { z } from "zod";

// JSON file metadata
export const jsonFileSchema = z.object({
  name: z.string(),
  path: z.string(),
  size: z.number(),
  lastModified: z.string(),
  displayName: z.string().optional(),
  url: z.string().optional(),
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

// Settings schemas for file metadata
export const settingsEntrySchema = z.object({
  filename: z.string(),
  title: z.string().optional(),
  url: z.string().optional(),
});

export const settingsSchema = z.object({
  entries: z.array(settingsEntrySchema),
});

export const settingsResponseSchema = z.object({
  settings: settingsSchema,
});

export const saveSettingsSchema = z.object({
  settings: settingsSchema,
});

// Backup schemas
export const backupFileSchema = z.object({
  filename: z.string(),
  size: z.number(),
  createdAt: z.string(), // ISO date string
});

export const backupListResponseSchema = z.object({
  backups: z.array(backupFileSchema),
});

export const backupPreviewResponseSchema = z.object({
  filename: z.string(),
  raw: z.string(),
  size: z.number(),
  createdAt: z.string(),
});

export const restoreBackupSchema = z.object({
  filename: z.string(),
  backupFilename: z.string(),
});

export const backupPreviewParamsSchema = z.object({
  filename: z.string().min(1).regex(/^[a-zA-Z0-9._-]+\.json$/, "Invalid filename format"),
  backupFilename: z.string().min(1).regex(/^[a-zA-Z0-9._-]+\.json$/, "Invalid backup filename format"),
});

// Settings types
export type SettingsEntry = z.infer<typeof settingsEntrySchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type SettingsResponse = z.infer<typeof settingsResponseSchema>;
export type SaveSettingsRequest = z.infer<typeof saveSettingsSchema>;

// Backup types
export type BackupFile = z.infer<typeof backupFileSchema>;
export type BackupListResponse = z.infer<typeof backupListResponseSchema>;
export type BackupPreviewResponse = z.infer<typeof backupPreviewResponseSchema>;
export type RestoreBackupRequest = z.infer<typeof restoreBackupSchema>;
export type BackupPreviewParams = z.infer<typeof backupPreviewParamsSchema>;
