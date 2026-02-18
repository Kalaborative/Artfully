import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { account } from '../lib/appwrite';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Megaphone,
  MessageSquare,
  Eye,
  EyeOff,
} from 'lucide-react';

const ADMIN_IDS = (import.meta.env.VITE_ADMIN_USER_IDS || '').split(',').map((s: string) => s.trim()).filter(Boolean);

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
}

interface FeedbackEntry {
  id: string;
  type: 'bug' | 'feedback' | 'suggestion';
  message: string;
  email: string | null;
  userId: string | null;
  createdAt: string;
  isRead: boolean;
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `p-2 rounded-lg transition-colors ${active ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-100 text-gray-600'}`;

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b bg-gray-50 rounded-t-lg">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}>
        <Bold className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}>
        <Italic className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={btnClass(editor.isActive('underline'))}>
        <UnderlineIcon className="w-4 h-4" />
      </button>

      <div className="w-px bg-gray-300 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))}>
        <Heading1 className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))}>
        <Heading2 className="w-4 h-4" />
      </button>

      <div className="w-px bg-gray-300 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}>
        <List className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))}>
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-px bg-gray-300 mx-1" />

      <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))}>
        <AlignLeft className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))}>
        <AlignCenter className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className={btnClass(editor.isActive({ textAlign: 'right' }))}>
        <AlignRight className="w-4 h-4" />
      </button>

      <div className="w-px bg-gray-300 mx-1" />

      <input
        type="color"
        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        className="w-8 h-8 rounded cursor-pointer border-0"
        title="Text color"
      />
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isAdmin = user && ADMIN_IDS.includes(user.$id);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none',
      },
    },
  });

  const fetchAnnouncements = useCallback(async () => {
    try {
      const jwt = await account.createJWT();
      const serverUrl = import.meta.env.VITE_SERVER_URL || '';
      const res = await fetch(`${serverUrl}/api/announcements`, {
        headers: { Authorization: `Bearer ${jwt.jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements);
      }
    } catch {
      // Silently fail — list is non-critical
    }
  }, []);

  const fetchFeedback = useCallback(async () => {
    try {
      const jwt = await account.createJWT();
      const serverUrl = import.meta.env.VITE_SERVER_URL || '';
      const res = await fetch(`${serverUrl}/api/feedback`, {
        headers: { Authorization: `Bearer ${jwt.jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data.feedback);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const toggleFeedbackRead = async (id: string) => {
    try {
      const jwt = await account.createJWT();
      const serverUrl = import.meta.env.VITE_SERVER_URL || '';
      const res = await fetch(`${serverUrl}/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${jwt.jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbackList((prev) =>
          prev.map((f) => (f.id === id ? { ...f, isRead: data.isRead } : f))
        );
      }
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/', { replace: true });
      return;
    }
    fetchAnnouncements();
    fetchFeedback();
  }, [isAdmin, navigate, fetchAnnouncements, fetchFeedback]);

  const handleSubmit = async () => {
    if (!editor || !title.trim()) return;

    const content = editor.getHTML();
    if (content === '<p></p>' || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const jwt = await account.createJWT();
      const serverUrl = import.meta.env.VITE_SERVER_URL || '';
      const res = await fetch(`${serverUrl}/api/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt.jwt}`,
        },
        body: JSON.stringify({ title: title.trim(), content }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create announcement');
      }

      setTitle('');
      editor.commands.clearContent();
      setSuccess('Announcement sent successfully!');
      fetchAnnouncements();
    } catch (err: any) {
      setError(err.message || 'Failed to send announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
          <Megaphone className="w-6 h-6 text-primary-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500">Compose and manage announcements</p>
        </div>
      </div>

      {/* Compose Announcement */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold mb-4">New Announcement</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title..."
              maxLength={255}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
              <EditorToolbar editor={editor} />
              <EditorContent editor={editor} />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
          )}
          {success && (
            <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">{success}</div>
          )}

          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!title.trim() || isSubmitting}
            leftIcon={<Megaphone className="w-4 h-4" />}
          >
            Send Announcement
          </Button>
        </div>
      </Card>

      {/* Previous Announcements */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Previous Announcements</h2>

        {announcements.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-4">No announcements yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <Card key={a.id} className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{a.title}</h3>
                      {a.isActive && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <div
                      className="prose prose-sm max-w-none text-gray-600"
                      dangerouslySetInnerHTML={{ __html: a.content }}
                    />
                    <p className="text-xs text-gray-400 mt-3">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* User Feedback */}
      <div className="mt-12">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-semibold">User Feedback</h2>
        </div>

        {feedbackList.length === 0 ? (
          <Card>
            <p className="text-gray-500 text-center py-4">No feedback yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {feedbackList.map((f) => (
              <Card
                key={f.id}
                className={`relative ${!f.isRead ? 'border-l-4 border-l-primary-500 bg-primary-50/30' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        f.type === 'bug'
                          ? 'bg-red-100 text-red-700'
                          : f.type === 'suggestion'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {f.type.charAt(0).toUpperCase() + f.type.slice(1)}
                      </span>
                      {!f.isRead && (
                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{f.message}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                      <span>{new Date(f.createdAt).toLocaleString()}</span>
                      {f.userId && <span>User: {f.userId}</span>}
                      {f.email && <span>Email: {f.email}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleFeedbackRead(f.id)}
                    className="shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                    title={f.isRead ? 'Mark as unread' : 'Mark as read'}
                  >
                    {f.isRead ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
