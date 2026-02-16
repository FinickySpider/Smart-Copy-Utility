import { app, safeStorage } from 'electron';
import fs from 'fs/promises';
import path from 'path';

type SettingsFile = {
  openaiApiKeyEncrypted?: string;
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
