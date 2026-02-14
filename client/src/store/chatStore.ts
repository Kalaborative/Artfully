import { create } from 'zustand';
import { getSocket } from '../lib/socket';
import type {
  ChatMessagePayload,
  ChatGuessPayload,
  ChatCorrectGuessPayload
} from '@artfully/shared';
import { CHAT_CONFIG } from '@artfully/shared';

export type ChatItem =
  | { type: 'message'; data: ChatMessagePayload }
  | { type: 'guess'; data: ChatGuessPayload }
  | { type: 'correct_guess'; data: ChatCorrectGuessPayload }
  | { type: 'system'; data: { id: string; message: string; timestamp: number } };

interface ChatStoreState {
  messages: ChatItem[];

  sendMessage: (message: string) => void;
  sendGuess: (guess: string) => void;
  addSystemMessage: (message: string) => void;
  setupListeners: () => () => void;
  reset: () => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messages: [],

  sendMessage: (message: string) => {
    const trimmed = message.trim().slice(0, CHAT_CONFIG.MAX_MESSAGE_LENGTH);
    if (!trimmed) return;

    const socket = getSocket();
    socket.emit('chat:message', trimmed);
  },

  sendGuess: (guess: string) => {
    const trimmed = guess.trim().slice(0, CHAT_CONFIG.MAX_MESSAGE_LENGTH);
    if (!trimmed) return;

    const socket = getSocket();
    socket.emit('chat:guess', trimmed);
  },

  addSystemMessage: (message: string) => {
    const { messages } = get();
    const newMessages: ChatItem[] = [
      ...messages,
      {
        type: 'system',
        data: {
          id: `system_${Date.now()}`,
          message,
          timestamp: Date.now()
        }
      }
    ].slice(-CHAT_CONFIG.MESSAGES_TO_KEEP);

    set({ messages: newMessages });
  },

  setupListeners: () => {
    const socket = getSocket();

    const handleMessage = (data: ChatMessagePayload) => {
      const { messages } = get();
      const newMessages: ChatItem[] = [
        ...messages,
        { type: 'message', data }
      ].slice(-CHAT_CONFIG.MESSAGES_TO_KEEP);

      set({ messages: newMessages });
    };

    const handleGuess = (data: ChatGuessPayload) => {
      const { messages } = get();
      const newMessages: ChatItem[] = [
        ...messages,
        { type: 'guess', data }
      ].slice(-CHAT_CONFIG.MESSAGES_TO_KEEP);

      set({ messages: newMessages });
    };

    const handleCorrectGuess = (data: ChatCorrectGuessPayload) => {
      const { messages } = get();
      const newMessages: ChatItem[] = [
        ...messages,
        { type: 'correct_guess', data }
      ].slice(-CHAT_CONFIG.MESSAGES_TO_KEEP);

      set({ messages: newMessages });
    };

    socket.on('chat:message', handleMessage);
    socket.on('chat:guess', handleGuess);
    socket.on('chat:correct_guess', handleCorrectGuess);

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:guess', handleGuess);
      socket.off('chat:correct_guess', handleCorrectGuess);
    };
  },

  reset: () => {
    set({ messages: [] });
  }
}));
