import { useRef, useEffect, useState, useCallback } from 'react';
import { useChatStore, ChatItem } from '../../store/chatStore';
import Card from '../ui/Card';
import { Send, MessageCircle, Smile } from 'lucide-react';

interface ChatBoxProps {
  isDrawer: boolean;
  hasGuessed: boolean;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀', '😂', '😍', '🤩', '😎', '🥳', '😭', '😱', '🤔', '😴', '🙄', '😏'],
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '💪', '👋', '🫡', '🤷', '🙏'],
  },
  {
    name: 'Fun',
    emojis: ['🎨', '🎉', '🔥', '💯', '⭐', '❤️', '💀', '👀', '🧠', '🏆', '✅', '❌'],
  },
];

export default function ChatBox({ isDrawer, hasGuessed }: ChatBoxProps) {
  const { messages, sendGuess, sendMessage } = useChatStore();
  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageColorsRef = useRef<Map<string, string>>(new Map());
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node) &&
        emojiButtonRef.current && !emojiButtonRef.current.contains(e.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (isDrawer || hasGuessed) {
      sendMessage(input);
    } else {
      sendGuess(input);
    }

    setInput('');
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = useCallback((emoji: string) => {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  }, []);

  return (
    <Card padding="none" className="h-[500px] flex flex-col">
      <div className="p-3 border-b flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold">Chat</h3>
      </div>

      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((item) => {
          if (!messageColorsRef.current.has(item.data.id)) {
            messageColorsRef.current.set(item.data.id, getRandomColor());
          }
          return (
            <ChatMessage key={item.data.id} item={item} color={messageColorsRef.current.get(item.data.id)!} />
          );
        })}
      </div>

      <div className="relative">
        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full left-0 right-0 mx-3 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10"
          >
            {EMOJI_CATEGORIES.map((category) => (
              <div key={category.name} className="mb-1 last:mb-0">
                <div className="text-xs text-gray-400 font-medium px-1 mb-1">{category.name}</div>
                <div className="grid grid-cols-6 gap-1">
                  {category.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleEmojiClick(emoji)}
                      className="text-xl p-1 rounded hover:bg-gray-100 transition-colors leading-none"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-3 border-t">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isDrawer ? "Chat..." : hasGuessed ? "Chat with other guessers..." : "Type your guess..."}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              maxLength={200}
            />
            <button
              ref={emojiButtonRef}
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className={`p-2 rounded-lg transition-colors ${showEmojiPicker ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="submit"
              className="p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </Card>
  );
}

const CHAT_COLORS = [
  'text-red-500',
  'text-orange-500',
  'text-yellow-500',
  'text-green-500',
  'text-blue-500',
  'text-indigo-500',
  'text-violet-500',
  'text-pink-500',
];

function getRandomColor(): string {
  return CHAT_COLORS[Math.floor(Math.random() * CHAT_COLORS.length)];
}

function ChatMessage({ item, color }: { item: ChatItem; color: string }) {
  switch (item.type) {
    case 'message':
      return (
        <div className="flex gap-2 text-sm">
          <span className="font-semibold text-gray-700">{item.data.username}:</span>
          <span className={color}>{item.data.message}</span>
        </div>
      );

    case 'guess':
      return (
        <div className="flex gap-2 text-sm">
          <span className="font-semibold text-gray-700">{item.data.username}:</span>
          <span className={color}>{item.data.guess}</span>
        </div>
      );

    case 'correct_guess':
      return (
        <div className="bg-green-100 text-green-700 p-2 rounded-lg text-sm">
          <span className="font-bold">{item.data.username}</span> guessed correctly!
          {item.data.isFirst && <span className="ml-1">First guess! </span>}
          <span className="text-green-600">+{item.data.points} points</span>
        </div>
      );

    case 'system':
      return (
        <div className="text-center text-xs text-gray-400 italic">
          {item.data.message}
        </div>
      );

    default:
      return null;
  }
}
