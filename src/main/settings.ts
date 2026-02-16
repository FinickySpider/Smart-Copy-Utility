import { app, safeStorage } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

type SettingsFile = {
  openaiApiKeyEncrypted?: string;
  performance?: {
    robocopyThreads?: number;
    scannerThreads?: number;
  };
  windowBounds?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  lastUsedPaths?: {
    source?: string;
    dest?: string;
  };
};

const DEFAULT_SETTINGS = {
  performance: {
    robocopyThreads: 8,
    scannerThreads: Math.max(1, Math.floor(os.cpus().length / 2)),
  },
};

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

async function readSettings(): Promise<SettingsFile> {
  try {
    const raw = await fs.readFile(getSettingsPath(), 'utf8');
    return JSON.parse(raw) as SettingsFile;
  } catch {
    return {};
  }
}

async function writeSettings(settings: SettingsFile): Promise<void> {
  await fs.mkdir(path.dirname(getSettingsPath()), { recursive: true });
  await fs.writeFile(getSettingsPath(), JSON.stringify(settings, null, 2), 'utf8');
}

export async function hasOpenAIApiKey(): Promise<boolean> {
  const settings = await readSettings();
  return typeof settings.openaiApiKeyEncrypted === 'string' && settings.openaiApiKeyEncrypted.length > 0;
}

export async function setOpenAIApiKey(apiKey: string): Promise<void> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API key is empty');
  }

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available on this system.');
  }

  const encrypted = safeStorage.encryptString(apiKey.trim());
  const settings = await readSettings();
  settings.openaiApiKeyEncrypted = encrypted.toString('base64');
  await writeSettings(settings);
}

export async function clearOpenAIApiKey(): Promise<void> {
  const settings = await readSettings();
  delete settings.openaiApiKeyEncrypted;
  await writeSettings(settings);
}

export async function getOpenAIApiKey(): Promise<string | null> {
  const settings = await readSettings();
  const value = settings.openaiApiKeyEncrypted;
  if (!value) return null;

  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Encryption is not available on this system.');
  }

  const decrypted = safeStorage.decryptString(Buffer.from(value, 'base64'));
  return decrypted;
}

// Performance settings
export async function getRobocopyThreads(): Promise<number> {
  const settings = await readSettings();
  return settings.performance?.robocopyThreads ?? DEFAULT_SETTINGS.performance.robocopyThreads;
}

export async function setRobocopyThreads(threads: number): Promise<void> {
  if (threads < 1 || threads > 128) {
    throw new Error('Robocopy threads must be between 1 and 128');
  }
  const settings = await readSettings();
  if (!settings.performance) {
    settings.performance = {};
  }
  settings.performance.robocopyThreads = threads;
  await writeSettings(settings);
}

export async function getScannerThreads(): Promise<number> {
  const settings = await readSettings();
  return settings.performance?.scannerThreads ?? DEFAULT_SETTINGS.performance.scannerThreads;
}

export async function setScannerThreads(threads: number): Promise<void> {
  if (threads < 1 || threads > 32) {
    throw new Error('Scanner threads must be between 1 and 32');
  }
  const settings = await readSettings();
  if (!settings.performance) {
    settings.performance = {};
  }
  settings.performance.scannerThreads = threads;
  await writeSettings(settings);
}

// Window bounds
export interface WindowBounds {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export async function getWindowBounds(): Promise<WindowBounds | null> {
  const settings = await readSettings();
  return settings.windowBounds ?? null;
}

export async function setWindowBounds(bounds: WindowBounds): Promise<void> {
  const settings = await readSettings();
  settings.windowBounds = bounds;
  await writeSettings(settings);
}

// Last used paths
export async function getLastUsedPaths(): Promise<{ source?: string; dest?: string }> {
  const settings = await readSettings();
  return settings.lastUsedPaths ?? {};
}

export async function setLastUsedPaths(source?: string, dest?: string): Promise<void> {
  const settings = await readSettings();
  if (!settings.lastUsedPaths) {
    settings.lastUsedPaths = {};
  }
  if (source !== undefined) settings.lastUsedPaths.source = source;
  if (dest !== undefined) settings.lastUsedPaths.dest = dest;
  await writeSettings(settings);
}

