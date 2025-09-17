import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loadFileSchema, saveFileSchema, validateJsonSchema, saveSettingsSchema, restoreBackupSchema, backupPreviewParamsSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // List all JSON files
  app.get("/api/files", async (req, res) => {
    try {
      const files = await storage.listJsonFiles();
      const settings = await storage.getSettings();
      
      // Enhanced file listing with settings-based titles
      const filesWithTitles = files.map((file) => {
        const settingsEntry = settings.entries.find(entry => entry.filename === file.name);
        return { 
          ...file, 
          displayName: settingsEntry?.title || file.name,
          url: settingsEntry?.url
        };
      });
      
      res.json({ files: filesWithTitles });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to list files" 
      });
    }
  });

  // Load a specific JSON file
  app.post("/api/files/load", async (req, res) => {
    try {
      const { filename } = loadFileSchema.parse(req.body);
      const fileContent = await storage.loadJsonFile(filename);
      res.json(fileContent);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to load file" 
      });
    }
  });

  // Save a JSON file
  app.post("/api/files/save", async (req, res) => {
    try {
      const { filename, content } = saveFileSchema.parse(req.body);
      const result = await storage.saveJsonFile(filename, content);
      res.json(result);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to save file" 
      });
    }
  });

  // Validate JSON content
  app.post("/api/validate", async (req, res) => {
    try {
      const { content } = validateJsonSchema.parse(req.body);
      const validation = await storage.validateJson(content);
      res.json(validation);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to validate JSON" 
      });
    }
  });

  // List backup files for a specific JSON file
  app.get("/api/backups/:filename", async (req, res) => {
    try {
      const { filename } = req.params;
      const backups = await storage.listBackups(filename);
      res.json({ backups });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to list backups" 
      });
    }
  });

  // Restore a backup file
  app.post("/api/backups/restore", async (req, res) => {
    try {
      const { filename, backupFilename } = restoreBackupSchema.parse(req.body);
      const result = await storage.restoreBackup(filename, backupFilename);
      res.json(result);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to restore backup" 
      });
    }
  });

  // Get backup preview
  app.get("/api/backups/:filename/:backupFilename/preview", async (req, res) => {
    try {
      const { filename, backupFilename } = backupPreviewParamsSchema.parse(req.params);
      const preview = await storage.getBackupPreview(filename, backupFilename);
      res.json(preview);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to get backup preview" 
      });
    }
  });

  // Get settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({ settings });
    } catch (error) {
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get settings" 
      });
    }
  });

  // Save settings
  app.post("/api/settings", async (req, res) => {
    try {
      const { settings } = saveSettingsSchema.parse(req.body);
      const result = await storage.saveSettings(settings);
      res.json(result);
    } catch (error) {
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to save settings" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
