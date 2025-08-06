import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loadFileSchema, saveFileSchema, validateJsonSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // List all JSON files
  app.get("/api/files", async (req, res) => {
    try {
      const files = await storage.listJsonFiles();
      res.json({ files });
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

  const httpServer = createServer(app);
  return httpServer;
}
