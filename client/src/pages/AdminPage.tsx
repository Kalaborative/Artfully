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
  CheckSquare,
  Square,
  Plus,
  X,
  Clock,
  ListTodo,
  Newspaper,
  Minus,
  Maximize2,
  Minimize2,
} from 'lucide-react';

const ADMIN_IDS = (import.meta.env.VITE_ADMIN_USER_IDS || '').split(',').map((s: string) => s.trim()).filter(Boolean);

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

const TODO_STORAGE_KEY = 'artfully-admin-todos';

function loadTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(TODO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos: TodoItem[]) {
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
}

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

type WidgetState = 'normal' | 'minimized' | 'maximized' | 'closed';

function Widget({ title, icon, children, className = '', state, onMinimize, onMaximize, onClose }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  state: WidgetState;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}) {
  if (state === 'closed') return null;

  const isMaximized = state === 'maximized';
  const isMinimized = state === 'minimized';

  return (
    <div className={`bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 border border-white/60 overflow-hidden transition-all duration-300 ${isMaximized ? 'fixed inset-4 z-50 !rounded-2xl' : ''} ${className}`}>
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/50 border-b border-gray-200/50">
        <div className="flex items-center gap-2">
          <span className="text-primary-500">{icon}</span>
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onMinimize}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-200/60 transition-colors group"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
          </button>
          <button
            onClick={onMaximize}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-200/60 transition-colors group"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized
              ? <Minimize2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
              : <Maximize2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-700" />
            }
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500 transition-colors group"
            title="Close"
          >
            <X className="w-3.5 h-3.5 text-gray-500 group-hover:text-white" />
          </button>
        </div>
      </div>
      {/* Content */}
      {!isMinimized && (
        <div className={`p-4 ${isMaximized ? 'overflow-y-auto' : ''}`} style={isMaximized ? { maxHeight: 'calc(100vh - 8rem)' } : undefined}>
          {children}
        </div>
      )}
    </div>
  );
}

function TaskbarClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <Clock className="w-4 h-4" />
      <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      <span className="text-gray-400">|</span>
      <span>{time.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
  const [todos, setTodos] = useState<TodoItem[]>(loadTodos);
  const [newTodo, setNewTodo] = useState('');

  const [widgetStates, setWidgetStates] = useState<Record<string, WidgetState>>({
    todo: 'normal',
    compose: 'normal',
    announcements: 'normal',
    feedback: 'normal',
  });

  const setWidgetState = (id: string, state: WidgetState) =>
    setWidgetStates((prev) => ({ ...prev, [id]: state }));

  const toggleMinimize = (id: string) =>
    setWidgetState(id, widgetStates[id] === 'minimized' ? 'normal' : 'minimized');

  const toggleMaximize = (id: string) =>
    setWidgetState(id, widgetStates[id] === 'maximized' ? 'normal' : 'maximized');

  const closeWidget = (id: string) => setWidgetState(id, 'closed');
  const openWidget = (id: string) => setWidgetState(id, 'normal');

  const closedWidgets = Object.entries(widgetStates).filter(([, s]) => s === 'closed');

  const widgetMeta: Record<string, { label: string; icon: React.ReactNode }> = {
    todo: { label: 'To-Do', icon: <ListTodo className="w-4 h-4" /> },
    compose: { label: 'New Announcement', icon: <Megaphone className="w-4 h-4" /> },
    announcements: { label: 'Announcements', icon: <Newspaper className="w-4 h-4" /> },
    feedback: { label: 'Feedback', icon: <MessageSquare className="w-4 h-4" /> },
  };

  const addTodo = () => {
    if (!newTodo.trim()) return;
    const updated = [...todos, { id: Date.now().toString(), text: newTodo.trim(), done: false }];
    setTodos(updated);
    saveTodos(updated);
    setNewTodo('');
  };

  const toggleTodo = (id: string) => {
    const updated = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    setTodos(updated);
    saveTodos(updated);
  };

  const removeTodo = (id: string) => {
    const updated = todos.filter((t) => t.id !== id);
    setTodos(updated);
    saveTodos(updated);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 pb-16">
      {/* Maximized overlay backdrop */}
      {Object.values(widgetStates).includes('maximized') && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />
      )}

      {/* Taskbar Header */}
      <div className="bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-500/10 rounded-lg flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">Admin Dashboard</h1>
              <p className="text-xs text-gray-500">Compose and manage announcements</p>
            </div>
          </div>
          <TaskbarClock />
        </div>
      </div>

      {/* Desktop Grid */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* To-Do Widget */}
            <Widget
              title="To-Do"
              icon={<ListTodo className="w-4 h-4" />}
              state={widgetStates.todo}
              onMinimize={() => toggleMinimize('todo')}
              onMaximize={() => toggleMaximize('todo')}
              onClose={() => closeWidget('todo')}
            >
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                  placeholder="Add a task..."
                  maxLength={200}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white/80"
                />
                <button
                  onClick={addTodo}
                  disabled={!newTodo.trim()}
                  className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {todos.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-2">No tasks yet. Add one above!</p>
              ) : (
                <ul className="space-y-2">
                  {todos.map((todo) => (
                    <li key={todo.id} className="flex items-center gap-3 group">
                      <button onClick={() => toggleTodo(todo.id)} className="shrink-0 text-gray-400 hover:text-primary-500 transition-colors">
                        {todo.done ? <CheckSquare className="w-5 h-5 text-primary-500" /> : <Square className="w-5 h-5" />}
                      </button>
                      <span className={`flex-1 text-sm ${todo.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {todo.text}
                      </span>
                      <button
                        onClick={() => removeTodo(todo.id)}
                        className="shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Widget>

            {/* New Announcement Widget */}
            <Widget
              title="New Announcement"
              icon={<Megaphone className="w-4 h-4" />}
              state={widgetStates.compose}
              onMinimize={() => toggleMinimize('compose')}
              onMaximize={() => toggleMaximize('compose')}
              onClose={() => closeWidget('compose')}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Announcement title..."
                    maxLength={255}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white/80"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white/80">
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
            </Widget>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Previous Announcements Widget */}
            <Widget
              title="Previous Announcements"
              icon={<Newspaper className="w-4 h-4" />}
              state={widgetStates.announcements}
              onMinimize={() => toggleMinimize('announcements')}
              onMaximize={() => toggleMaximize('announcements')}
              onClose={() => closeWidget('announcements')}
            >
              {announcements.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No announcements yet.</p>
              ) : (
                <div className="space-y-4">
                  {announcements.map((a) => (
                    <div key={a.id} className="p-3 bg-white/60 rounded-xl border border-gray-100">
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
                    </div>
                  ))}
                </div>
              )}
            </Widget>

            {/* User Feedback Widget */}
            <Widget
              title="User Feedback"
              icon={<MessageSquare className="w-4 h-4" />}
              state={widgetStates.feedback}
              onMinimize={() => toggleMinimize('feedback')}
              onMaximize={() => toggleMaximize('feedback')}
              onClose={() => closeWidget('feedback')}
            >
              {feedbackList.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No feedback yet.</p>
              ) : (
                <div className="space-y-4">
                  {feedbackList.map((f) => (
                    <div
                      key={f.id}
                      className={`p-3 rounded-xl border ${!f.isRead ? 'border-l-4 border-l-primary-500 bg-primary-50/30 border-gray-100' : 'bg-white/60 border-gray-100'}`}
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
                    </div>
                  ))}
                </div>
              )}
            </Widget>
          </div>
        </div>
      </div>

      {/* Bottom Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/70 backdrop-blur-xl border-t border-white/40 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center gap-1">
          {Object.entries(widgetMeta).map(([id, meta]) => {
            const st = widgetStates[id];
            const isClosed = st === 'closed';
            const isActive = st === 'normal' || st === 'maximized';
            return (
              <button
                key={id}
                onClick={() => {
                  if (isClosed) {
                    openWidget(id);
                  } else if (st === 'minimized') {
                    setWidgetState(id, 'normal');
                  } else {
                    toggleMinimize(id);
                  }
                }}
                title={isClosed ? `Open ${meta.label}` : st === 'minimized' ? `Restore ${meta.label}` : `Minimize ${meta.label}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-primary-500/10 text-primary-600 font-medium border-b-2 border-primary-500'
                    : isClosed
                    ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <span className={isClosed ? 'opacity-50' : ''}>{meta.icon}</span>
                <span className="hidden sm:inline">{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
