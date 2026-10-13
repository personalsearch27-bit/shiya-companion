import { Message, CharacterProfile, MoodType } from '../types';

interface SendMessageResponse {
  reply: string;
  extractedMood: MoodType;
  isDemo: boolean;
}

export async function sendChatMessage(
  message: string,
  history: Message[],
  profile: CharacterProfile
): Promise<SendMessageResponse> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: history.slice(-8), // Send recent context window
        profile
      })
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      throw new Error(errorJson.details || errorJson.error || `Server responded with ${res.status}`);
    }

    const data = await res.json();
    return {
      reply: data.reply,
      extractedMood: data.extractedMood || 'happy',
      isDemo: Boolean(data.isDemo)
    };
  } catch (error: any) {
    console.warn('API error, falling back to local fallback response:', error);
    // Graceful offline/error recovery response
    return {
      reply: "I'm having a little trouble connecting to my thoughts right now. Could you check if the server is running, or say that once more for me? [mood:sad]",
      extractedMood: 'sad',
      isDemo: true
    };
  }
}

export async function checkServerStatus(): Promise<{ status: string; hasApiKey: boolean; engine: string }> {
  try {
    const res = await fetch('/api/status');
    if (res.ok) {
      return await res.json();
    }
    return { status: 'offline', hasApiKey: false, engine: 'Disconnected' };
  } catch {
    return { status: 'offline', hasApiKey: false, engine: 'Disconnected' };
  }
}