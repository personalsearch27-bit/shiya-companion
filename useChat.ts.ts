import { useState, useEffect } from 'react';
import { Message, ConversationSession, CharacterProfile, MoodType } from '../types';
import { sendChatMessage } from '../services/geminiService';
import { saveSession, getAllSessions, deleteSession, clearAllSessions } from '../services/storageService';

export function useChat(profile: CharacterProfile, onNewBotReply?: (text: string, mood: MoodType) => void) {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isThinking, setIsThinking] = useState(false);

  // Initialize from IndexedDB
  useEffect(() => {
    (async () => {
      const stored = await getAllSessions();
      if (stored.length > 0) {
        setSessions(stored);
        setCurrentSessionId(stored[0].id);
      } else {
        createNewSession();
      }
    })();
  }, []);

  const activeSession = sessions.find(s => s.id === currentSessionId);
  const messages = activeSession ? activeSession.messages : [];

  const createNewSession = () => {
    const newSession: ConversationSession = {
      id: 'session_' + Date.now(),
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        {
          id: 'welcome_' + Date.now(),
          sender: 'shiya',
          text: `Hi there! I'm ${profile.name}. It feels nice to spend time with you. How is your day going so far?`,
          mood: 'happy',
          timestamp: Date.now()
        }
      ]
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    saveSession(newSession);
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || !activeSession || isThinking) return;

    const userMessage: Message = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    const updatedSessionMessages = [...activeSession.messages, userMessage];
    const sessionTitle = activeSession.title === 'New Chat' ? userText.slice(0, 24) : activeSession.title;

    const updatedSession: ConversationSession = {
      ...activeSession,
      title: sessionTitle,
      messages: updatedSessionMessages,
      updatedAt: Date.now(),
    };

    setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
    saveSession(updatedSession);

    setIsThinking(true);

    try {
      const result = await sendChatMessage(userText, updatedSessionMessages, profile);

      const botMessage: Message = {
        id: 'reply_' + Date.now(),
        sender: 'shiya',
        text: result.reply,
        mood: result.extractedMood,
        timestamp: Date.now(),
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, botMessage],
        updatedAt: Date.now(),
      };

      setSessions(prev => prev.map(s => s.id === finalSession.id ? finalSession : s));
      saveSession(finalSession);

      if (onNewBotReply) {
        onNewBotReply(result.reply, result.extractedMood);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsThinking(false);
    }
  };

  const removeSession = async (id: string) => {
    await deleteSession(id);
    const remaining = sessions.filter(s => s.id !== id);
    setSessions(remaining);
    if (remaining.length > 0) {
      setCurrentSessionId(remaining[0].id);
    } else {
      createNewSession();
    }
  };

  const clearAll = async () => {
    await clearAllSessions();
    setSessions([]);
    createNewSession();
  };

  return {
    sessions,
    currentSessionId,
    setCurrentSessionId,
    messages,
    isThinking,
    sendMessage: handleSendMessage,
    createNewSession,
    removeSession,
    clearAll,
  };
}