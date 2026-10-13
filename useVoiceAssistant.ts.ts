import { useState, useCallback } from 'react';
import { VoiceState, VoiceSettings, MoodType } from '../types';
import { speechService } from '../services/speechService';

export function useVoiceAssistant(
  voiceSettings: VoiceSettings,
  onSpeechRecognized: (text: string) => void,
  onMoodChange: (mood: MoodType) => void
) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');

  const startListening = useCallback(() => {
    if (!speechService.isRecognitionSupported()) {
      alert('Speech recognition is not supported in this browser. Please use text chat.');
      return;
    }

    speechService.stopSpeaking();
    setVoiceState('listening');
    onMoodChange('listening');

    speechService.listen(
      (transcript) => {
        setVoiceState('processing');
        onMoodChange('thinking');
        onSpeechRecognized(transcript);
      },
      (error) => {
        console.warn('Speech error:', error);
        setVoiceState('idle');
      },
      () => {
        setVoiceState(prev => prev === 'listening' ? 'idle' : prev);
      }
    );
  }, [onSpeechRecognized, onMoodChange]);

  const stopListening = useCallback(() => {
    speechService.stopListening();
    setVoiceState('idle');
  }, []);

  const speakText = useCallback((text: string, mood: MoodType) => {
    if (!voiceSettings.ttsEnabled) {
      onMoodChange(mood);
      return;
    }

    setVoiceState('speaking');
    onMoodChange(mood);

    speechService.speak(
      text,
      voiceSettings,
      () => {
        setVoiceState('speaking');
      },
      () => {
        setVoiceState('idle');
      },
      () => {
        setVoiceState('idle');
      }
    );
  }, [voiceSettings, onMoodChange]);

  const toggleVoiceMode = useCallback(() => {
    if (voiceState === 'listening' || voiceState === 'speaking') {
      speechService.stopSpeaking();
      stopListening();
    } else {
      startListening();
    }
  }, [voiceState, startListening, stopListening]);

  return {
    voiceState,
    startListening,
    stopListening,
    speakText,
    toggleVoiceMode,
  };
}