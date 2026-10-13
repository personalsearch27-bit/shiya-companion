import { VoiceSettings } from '../types';

export class SpeechService {
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private recognition: any = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';
      }
    }
  }

  public isRecognitionSupported(): boolean {
    return Boolean(this.recognition);
  }

  public isSynthesisSupported(): boolean {
    return Boolean(this.synth);
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    return this.synth.getVoices();
  }

  public speak(
    text: string, 
    settings: VoiceSettings, 
    onStart?: () => void, 
    onEnd?: () => void,
    onError?: (err: any) => void
  ): void {
    if (!this.synth || !settings.ttsEnabled) {
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;

    const voices = this.getVoices();
    if (settings.voiceURI) {
      const chosen = voices.find(v => v.voiceURI === settings.voiceURI);
      if (chosen) utterance.voice = chosen;
    } else {
      // Find a natural sounding female voice if available
      const natural = voices.find(v => (v.name.includes('Natural') || v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Samantha')) && v.lang.startsWith('en'));
      if (natural) utterance.voice = natural;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  public stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public listen(
    onResult: (text: string) => void,
    onError: (error: any) => void,
    onEnd: () => void
  ): void {
    if (!this.recognition) {
      onError(new Error('Speech recognition not supported in this browser.'));
      return;
    }

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    this.recognition.onerror = (event: any) => {
      onError(event.error);
    };

    this.recognition.onend = () => {
      onEnd();
    };

    try {
      this.recognition.start();
    } catch (err) {
      onError(err);
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignored if already stopped
      }
    }
  }
}

export const speechService = new SpeechService();