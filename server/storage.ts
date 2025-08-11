import { type JsonFile, type FileContentResponse, type SaveResponse, type ValidationResponse } from "@shared/schema";
import { promises as fs } from "fs";
import path from "path";

export interface IStorage {
  listJsonFiles(): Promise<JsonFile[]>;
  loadJsonFile(filename: string): Promise<FileContentResponse>;
  saveJsonFile(filename: string, content: string): Promise<SaveResponse>;
  validateJson(content: string): Promise<ValidationResponse>;
  listBackups(filename: string): Promise<BackupFile[]>;
  restoreBackup(filename: string, backupFilename: string): Promise<SaveResponse>;
}

export interface BackupFile {
  name: string;
  originalFile: string;
  path: string;
  size: number;
  createdAt: string;
}

export class FileSystemStorage implements IStorage {
  private dataPath: string;
  private backupPath: string;

  constructor() {
    this.dataPath = path.resolve(process.cwd(), "jsonapi/public/data");
    this.backupPath = path.resolve(this.dataPath, "backup");
  }

  async ensureDirectories(): Promise<void> {
    try {
      await fs.access(this.dataPath);
    } catch {
      await fs.mkdir(this.dataPath, { recursive: true });
    }
    
    try {
      await fs.access(this.backupPath);
    } catch {
      await fs.mkdir(this.backupPath, { recursive: true });
    }
  }

  async listJsonFiles(): Promise<JsonFile[]> {
    await this.ensureDirectories();
    
    try {
      const files = await fs.readdir(this.dataPath);
      const jsonFiles = files.filter(file => file.endsWith('.json') && file !== 'backup');
      
      const fileDetails = await Promise.all(
        jsonFiles.map(async (filename) => {
          const filePath = path.join(this.dataPath, filename);
          const stats = await fs.stat(filePath);
          
          return {
            name: filename,
            path: filePath,
            size: stats.size,
            lastModified: stats.mtime.toISOString(),
          };
        })
      );
      
      return fileDetails.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    } catch (error) {
      console.error('Error listing JSON files:', error);
      return [];
    }
  }

  async loadJsonFile(filename: string): Promise<FileContentResponse> {
    await this.ensureDirectories();
    
    const filePath = path.join(this.dataPath, filename);
    
    try {
      const rawContent = await fs.readFile(filePath, 'utf-8');
      const parsedContent = JSON.parse(rawContent);
      
      return {
        filename,
        content: parsedContent,
        raw: rawContent,
      };
    } catch (error) {
      throw new Error(`Failed to load file ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveJsonFile(filename: string, content: string): Promise<SaveResponse> {
    await this.ensureDirectories();
    
    const filePath = path.join(this.dataPath, filename);
    
    // First validate the JSON
    const validation = await this.validateJson(content);
    if (!validation.valid) {
      throw new Error(`Invalid JSON: ${validation.error}`);
    }

    // Create backup before saving
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupFilename = `${filename.replace('.json', '')}_${timestamp}.json`;
    const backupFilePath = path.join(this.backupPath, backupFilename);

    try {
      // Check if original file exists for backup
      try {
        const originalContent = await fs.readFile(filePath, 'utf-8');
        await fs.writeFile(backupFilePath, originalContent, 'utf-8');
      } catch {
        // File doesn't exist yet, no backup needed
      }

      // Save the new content
      await fs.writeFile(filePath, content, 'utf-8');

      return {
        success: true,
        filename,
        backupPath: `backup/${backupFilename}`,
      };
    } catch (error) {
      throw new Error(`Failed to save file ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateJson(content: string): Promise<ValidationResponse> {
    try {
      JSON.parse(content);
      return { valid: true };
    } catch (error) {
      if (error instanceof SyntaxError) {
        const match = error.message.match(/at position (\d+)/);
        let line = 1;
        let column = 1;
        
        if (match) {
          const position = parseInt(match[1]);
          const lines = content.substring(0, position).split('\n');
          line = lines.length;
          column = lines[lines.length - 1].length + 1;
        }
        
        return {
          valid: false,
          error: `Line ${line}: ${error.message.replace(/ at position \d+/, '')}`,
          line,
          column,
        };
      }
      
      return {
        valid: false,
        error: 'Unknown JSON parsing error',
      };
    }
  }

  async listBackups(filename: string): Promise<BackupFile[]> {
    await this.ensureDirectories();
    
    try {
      const files = await fs.readdir(this.backupPath);
      const baseFilename = filename.replace('.json', '');
      const backupFiles = files.filter(file => 
        file.startsWith(`${baseFilename}_`) && file.endsWith('.json')
      );
      
      const backupDetails = await Promise.all(
        backupFiles.map(async (backupFilename) => {
          const filePath = path.join(this.backupPath, backupFilename);
          const stats = await fs.stat(filePath);
          
          // Extract timestamp from filename
          const timestampMatch = backupFilename.match(/_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})\.json$/);
          const timestamp = timestampMatch ? timestampMatch[1].replace(/-/g, ':') : stats.mtime.toISOString();
          
          return {
            name: backupFilename,
            originalFile: filename,
            path: filePath,
            size: stats.size,
            createdAt: timestamp,
          };
        })
      );
      
      // Sort by creation date, newest first
      return backupDetails.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error listing backup files:', error);
      return [];
    }
  }

  async restoreBackup(filename: string, backupFilename: string): Promise<SaveResponse> {
    await this.ensureDirectories();
    
    const backupFilePath = path.join(this.backupPath, backupFilename);
    const targetFilePath = path.join(this.dataPath, filename);
    
    try {
      // Read the backup content
      const backupContent = await fs.readFile(backupFilePath, 'utf-8');
      
      // Validate the backup content
      const validation = await this.validateJson(backupContent);
      if (!validation.valid) {
        throw new Error(`Backup file contains invalid JSON: ${validation.error}`);
      }
      
      // Create a backup of the current file before restoring
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const preRestoreBackupFilename = `${filename.replace('.json', '')}_pre-restore_${timestamp}.json`;
      const preRestoreBackupPath = path.join(this.backupPath, preRestoreBackupFilename);
      
      try {
        const currentContent = await fs.readFile(targetFilePath, 'utf-8');
        await fs.writeFile(preRestoreBackupPath, currentContent, 'utf-8');
      } catch {
        // File doesn't exist, no backup needed
      }
      
      // Restore the backup content
      await fs.writeFile(targetFilePath, backupContent, 'utf-8');
      
      return {
        success: true,
        filename,
        backupPath: `backup/${preRestoreBackupFilename}`,
      };
    } catch (error) {
      throw new Error(`Failed to restore backup ${backupFilename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const storage = new FileSystemStorage();
