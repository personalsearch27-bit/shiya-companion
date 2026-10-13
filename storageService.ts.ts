import { openDB, IDBPDatabase } from 'idb';
import { ConversationSession, CharacterProfile, VoiceSettings } from '../types';

const DB_NAME = 'shiya_companion_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('assets')) {
          db.createObjectStore('assets');
        }
      },
    });
  }
  return dbPromise;
}

export const defaultProfile: CharacterProfile = {
  name: 'Shiya',
  personality: 'Warm, playful, subtly romantic, encouraging, and fond of late-night study sessions.',
  formality: 'casual',
  playfulness: 4,
  replyLength: 'concise',
  preferredLanguage: 'English',
  accentColor: '#FF304F',
  animationIntensity: 1.0,
};

export const defaultVoiceSettings: VoiceSettings = {
  ttsEnabled: true,
  rate: 1.05,
  pitch: 1.15,
  voiceURI: '',
};

export async function saveSession(session: ConversationSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function getAllSessions(): Promise<ConversationSession[]> {
  const db = await getDB();
  const sessions = await db.getAll('sessions');
  return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}

export async function clearAllSessions(): Promise<void> {
  const db = await getDB();
  await db.clear('sessions');
}

export async function saveCustomAvatarBlob(blobBase64: string): Promise<void> {
  const db = await getDB();
  await db.put('assets', blobBase64, 'custom_avatar');
}

export async function getCustomAvatarBlob(): Promise<string | null> {
  const db = await getDB();
  return (await db.get('assets', 'custom_avatar')) || null;
}

export async function removeCustomAvatarBlob(): Promise<void> {
  const db = await getDB();
  await db.delete('assets', 'custom_avatar');
}

export function loadProfile(): CharacterProfile {
  const raw = localStorage.getItem('shiya_profile');
  return raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
}

export function saveProfile(profile: CharacterProfile): void {
  localStorage.setItem('shiya_profile', JSON.stringify(profile));
}

export function loadVoiceSettings(): VoiceSettings {
  const raw = localStorage.getItem('shiya_voice');
  return raw ? { ...defaultVoiceSettings, ...JSON.parse(raw) } : defaultVoiceSettings;
}

export function saveVoiceSettings(settings: VoiceSettings): void {
  localStorage.setItem('shiya_voice', JSON.stringify(settings));
}