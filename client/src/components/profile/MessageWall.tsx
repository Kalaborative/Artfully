import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Send, Trash2, Reply, Loader2 } from 'lucide-react';
import { account } from '../../lib/appwrite';
import { useAuthStore } from '../../store/authStore';
import Avatar from '../ui/Avatar';
import Card from '../ui/Card';
import type { WallMessage } from '@artfully/shared';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface MessageWallProps {
  profileUserId: string;
  isOwner: boolean;
}

export default function MessageWall({ profileUserId, isOwner }: MessageWallProps) {
  const { isAuthenticated, user } = useAuthStore();
  const [messages, setMessages] = useState<WallMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER_URL}/api/wall/${profileUserId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [profileUserId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handlePost = async () => {
    if (!newMessage.trim() || isPosting) return;
    setIsPosting(true);
    try {
      const jwt = await account.createJWT();
      const res = await fetch(`${SERVER_URL}/api/wall/${profileUserId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt.jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        setNewMessage('');
        await fetchMessages();
      }
    } catch {
      // Silently fail
    } finally {
      setIsPosting(false);
    }
  };

  const handleReply = async (messageId: string) => {
    if (!replyContent.trim() || isReplying) return;
    setIsReplying(true);
    try {
      const jwt = await account.createJWT();
      const res = await fetch(`${SERVER_URL}/api/wall/${profileUserId}/reply/${messageId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${jwt.jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: replyContent.trim() }),
      });
      if (res.ok) {
        setReplyContent('');
        setReplyingTo(null);
        await fetchMessages();
      }
    } catch {
      // Silently fail
    } finally {
      setIsReplying(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      const jwt = await account.createJWT();
      const res = await fetch(`${SERVER_URL}/api/wall/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${jwt.jwt}` },
      });
      if (res.ok) {
        await fetchMessages();
      }
    } catch {
      // Silently fail
    }
  };

  const canDelete = (msg: WallMessage) => {
    if (!user) return false;
    return msg.authorUserId === user.$id || isOwner;
  };

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-primary-500" />
        Message Wall
      </h3>

      {/* Post input */}
      {isAuthenticated && (
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handlePost()}
              placeholder="Write a message..."
              maxLength={500}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handlePost}
              disabled={!newMessage.trim() || isPosting}
              className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPosting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{newMessage.length}/500</p>
        </div>
      )}

      {/* Messages */}
      {isLoading ? (
        <div className="text-center py-6">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : messages.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">
          No messages yet. Be the first to write on this wall!
        </p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              {/* Top-level message */}
              <div className="flex gap-3">
                <Link to={`/player/${msg.authorUsername}`} className="flex-shrink-0">
                  <Avatar src={msg.authorAvatarUrl} alt={msg.authorDisplayName} size="sm" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      to={`/player/${msg.authorUsername}`}
                      className="font-medium text-sm hover:text-primary-500 transition-colors"
                    >
                      {msg.authorDisplayName}
                    </Link>
                    <span className="text-xs text-gray-400">{timeAgo(msg.createdAt)}</span>
                    {canDelete(msg) && (
                      <button
                        onClick={() => handleDelete(msg.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors ml-auto"
                        title="Delete message"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mt-1 break-words">{msg.content}</p>
                  {isAuthenticated && (
                    <button
                      onClick={() => setReplyingTo(replyingTo === msg.id ? null : msg.id)}
                      className="text-xs text-gray-400 hover:text-primary-500 mt-1 flex items-center gap-1 transition-colors"
                    >
                      <Reply className="w-3 h-3" />
                      Reply
                    </button>
                  )}
                </div>
              </div>

              {/* Replies */}
              {msg.replies && msg.replies.length > 0 && (
                <div className="ml-10 mt-3 space-y-3">
                  {msg.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-2">
                      <Link to={`/player/${reply.authorUsername}`} className="flex-shrink-0">
                        <Avatar src={reply.authorAvatarUrl} alt={reply.authorDisplayName} size="sm" />
                      </Link>
                      <div className="flex-1 min-w-0 bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/player/${reply.authorUsername}`}
                            className="font-medium text-xs hover:text-primary-500 transition-colors"
                          >
                            {reply.authorDisplayName}
                          </Link>
                          <span className="text-xs text-gray-400">{timeAgo(reply.createdAt)}</span>
                          {canDelete(reply) && (
                            <button
                              onClick={() => handleDelete(reply.id)}
                              className="text-gray-300 hover:text-red-500 transition-colors ml-auto"
                              title="Delete reply"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 mt-0.5 break-words">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              {replyingTo === msg.id && (
                <div className="ml-10 mt-2 flex gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply(msg.id)}
                    placeholder="Write a reply..."
                    maxLength={500}
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => handleReply(msg.id)}
                    disabled={!replyContent.trim() || isReplying}
                    className="px-2.5 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isReplying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
