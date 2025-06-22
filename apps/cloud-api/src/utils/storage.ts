import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// Use the mounted volume path - Railway mounts it here
const STORAGE_PATH = process.env.RAILWAY_VOLUME_MOUNT_PATH || '/app/storage';
const DOCUMENTS_PATH = join(STORAGE_PATH, 'documents');

// Ensure documents directory exists
async function ensureStorageExists() {
  if (!existsSync(DOCUMENTS_PATH)) {
    await mkdir(DOCUMENTS_PATH, { recursive: true });
  }
}

export async function saveDocument(fileName: string, content: string): Promise<string> {
  await ensureStorageExists();
  
  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}-${fileName}`;
  const filePath = join(DOCUMENTS_PATH, uniqueFileName);
  
  // If content is base64, decode it
  const buffer = content.startsWith('data:') 
    ? Buffer.from(content.split(',')[1], 'base64')
    : Buffer.from(content);
  
  await writeFile(filePath, buffer);
  
  return uniqueFileName;
}

export async function getDocument(fileName: string): Promise<Buffer> {
  const filePath = join(DOCUMENTS_PATH, fileName);
  return await readFile(filePath);
}

export async function getDocumentPath(fileName: string): string {
  return join(DOCUMENTS_PATH, fileName);
}

export async function documentExists(fileName: string): boolean {
  const filePath = join(DOCUMENTS_PATH, fileName);
  return existsSync(filePath);
}