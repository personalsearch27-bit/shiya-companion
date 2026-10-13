export type MoodType = 
  | 'happy' 
  | 'shy' 
  | 'thinking' 
  | 'listening' 
  | 'speaking' 
  | 'curious' 
  | 'sleepy' 
  | 'sad';

export interface Message {
  id: string;
  sender: 'user' | 'shiya';
  text: string;
  mood?: MoodType;
  timestamp: number;
  isError?: boolean;
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
}

export interface CharacterProfile {
  name: string;
  personality: string;
  formality: 'casual' | 'balanced' | 'polite';
  playfulness: number; // 1 to 5
  replyLength: 'concise' | 'normal' | 'detailed';
  preferredLanguage: string;
  customAvatarUrl?: string;
  accentColor: string;
  animationIntensity: number; // 0.5 to 1.5
}

export type VoiceState = 
  | 'idle'
  | 'requesting_permission'
  | 'connecting'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'reconnecting'
  | 'error';

export interface VoiceSettings {
  ttsEnabled: boolean;
  rate: number;
  pitch: number;
  voiceURI: string;
}