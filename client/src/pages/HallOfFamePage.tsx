import { useState, useEffect } from 'react';
import { Award, Play, Palette, X, Trash2, Heart } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { account } from '../lib/appwrite';
import { HallOfFameEntry, Stroke, FillAction } from '@artfully/shared';
import ReplayOverlay from '../components/canvas/ReplayOverlay';

const ADJECTIVES = ['Lovely', 'Magical', 'Mysterious', 'Vibrant', 'Silent', 'Golden', 'Hidden', 'Radiant', 'Ancient', 'Crimson', 'Azure', 'Cosmic', 'Playful', 'Serene', 'Wild', 'Electric', 'Sweet', 'Secret'];
const NOUNS = ['Solitude', 'Dream', 'Journey', 'Symphony', 'Illusion', 'Echo', 'Horizon', 'Mystery', 'Garden', 'Ocean', 'Galaxy', 'Whisper', 'Shadow', 'Adventure', 'Fantasy', 'Miracle', 'Canvas', 'Spirit'];

function generateTitle(id: string) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Convert to unsigned 32-bit integer to guarantee it's positive
    const unsignedHash = hash >>> 0;
    const adj = ADJECTIVES[unsignedHash % ADJECTIVES.length];
    const nounHash = Math.floor(unsignedHash / ADJECTIVES.length);
    const noun = NOUNS[nounHash % NOUNS.length];
    return `${adj} ${noun}`;
}

export default function HallOfFamePage() {
    const [entries, setEntries] = useState<HallOfFameEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [replayData, setReplayData] = useState<{ strokes: Stroke[]; fillActions: FillAction[] } | null>(null);
    const [loadingReplayId, setLoadingReplayId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [likedEntryIds, setLikedEntryIds] = useState<Set<string>>(new Set());
    const [likingId, setLikingId] = useState<string | null>(null);

    const { user } = useAuthStore();
    const ADMIN_IDS = (import.meta.env.VITE_ADMIN_USER_IDS || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const isAdmin = user && ADMIN_IDS.includes(user.$id);

    useEffect(() => {
        // Load liked entries from local storage
        const storedLikes = localStorage.getItem('wonder_hall_likes');
        if (storedLikes) {
            try {
                setLikedEntryIds(new Set(JSON.parse(storedLikes)));
            } catch (e) {
                console.error('Failed to parse liked entries', e);
            }
        }
        fetchHallOfFame();
    }, []);

    const fetchHallOfFame = async () => {
        try {
            setIsLoading(true);
            const serverUrl = import.meta.env.VITE_SERVER_URL || '';
            const res = await fetch(`${serverUrl}/api/hall-of-fame`);

            if (!res.ok) throw new Error('Failed to fetch Wonder Hall entries');

            const data = await res.json();
            setEntries(data.hallOfFame || []);
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReplay = async (entry: HallOfFameEntry) => {
        if (!entry.replayData) return;
        setLoadingReplayId(entry.id);
        try {
            const decodedJson = atob(entry.replayData);
            const data = JSON.parse(decodedJson);
            setReplayData({ strokes: data.strokes, fillActions: data.fillActions });
        } catch (err) {
            console.error('Failed to load replay:', err);
        } finally {
            setLoadingReplayId(null);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to remove this drawing from the Wonder Hall?')) return;
        setDeletingId(id);
        try {
            const serverUrl = import.meta.env.VITE_SERVER_URL || '';
            const jwt = await account.createJWT();

            const res = await fetch(`${serverUrl}/api/hall-of-fame/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${jwt.jwt}`,
                },
            });

            if (!res.ok) throw new Error('Failed to delete');

            setEntries(prev => prev.filter(entry => entry.id !== id));
        } catch (err) {
            console.error('Failed to delete entry:', err);
            alert('Failed to remove from Wonder Hall');
        } finally {
            setDeletingId(null);
        }
    };

    const handleLike = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (likedEntryIds.has(id)) return; // Already liked

        setLikingId(id);

        // Optimistically update the UI
        setEntries(prev => prev.map(entry =>
            entry.id === id ? { ...entry, likesCount: entry.likesCount + 1 } : entry
        ));

        const newLikedEntryIds = new Set(likedEntryIds);
        newLikedEntryIds.add(id);
        setLikedEntryIds(newLikedEntryIds);
        localStorage.setItem('wonder_hall_likes', JSON.stringify(Array.from(newLikedEntryIds)));

        try {
            const serverUrl = import.meta.env.VITE_SERVER_URL || '';
            const res = await fetch(`${serverUrl}/api/hall-of-fame/${id}/like`, {
                method: 'POST',
            });

            if (!res.ok) throw new Error('Failed to like entry');
        } catch (err) {
            console.error('Failed to like entry:', err);
            // Revert changes on failure
            setEntries(prev => prev.map(entry =>
                entry.id === id ? { ...entry, likesCount: Math.max(0, entry.likesCount - 1) } : entry
            ));
            newLikedEntryIds.delete(id);
            setLikedEntryIds(newLikedEntryIds);
            localStorage.setItem('wonder_hall_likes', JSON.stringify(Array.from(newLikedEntryIds)));
        } finally {
            setLikingId(null);
        }
    };

    const expandedDrawing = expandedId ? entries.find(e => e.id === expandedId) : null;

    return (
        <div className="min-h-[80vh] py-12 px-4 max-w-7xl mx-auto">
            <div className="text-center mb-12">
                <Award className="w-16 h-16 text-primary-500 mx-auto mb-4" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-transparent bg-clip-text">
                    Wonder Hall
                </h1>
                <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
                    A curated collection of the most legendary masterpieces created in Artfully!
                </p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : error ? (
                <div className="text-center py-12 text-red-500 bg-red-50 rounded-lg">
                    <p>{error}</p>
                </div>
            ) : entries.length === 0 ? (
                <div className="text-center py-20 text-gray-400 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <Palette className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">No masterpieces found yet. Check back later!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {entries.map((entry) => (
                        <div
                            key={entry.id}
                            className="group relative bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-transparent hover:border-yellow-400 transition-all hover:-translate-y-1"
                        >
                            <div
                                className="aspect-[4/3] bg-gray-50 border-b border-gray-100 cursor-pointer overflow-hidden p-4 relative"
                                onClick={() => setExpandedId(entry.id)}
                            >
                                <img
                                    src={entry.imageUrl}
                                    alt="Masterpiece"
                                    className="w-full h-full object-contain filter drop-shadow-md"
                                />

                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                    <span className="text-white font-medium px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">View Full Screen</span>
                                </div>

                                {isAdmin && (
                                    <button
                                        onClick={(e) => handleDelete(entry.id, e)}
                                        disabled={deletingId === entry.id}
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all disabled:opacity-50 pointer-events-auto"
                                        title="Remove from Wonder Hall"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="p-5">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900 line-clamp-1">{generateTitle(entry.id)}</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            by {entry.artistName}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <button
                                            onClick={(e) => handleLike(entry.id, e)}
                                            disabled={likingId === entry.id || likedEntryIds.has(entry.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${likedEntryIds.has(entry.id)
                                                ? 'bg-red-50 text-red-500 border border-red-100'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-transparent'
                                                } disabled:opacity-75`}
                                        >
                                            <Heart className={`w-4 h-4 ${likedEntryIds.has(entry.id) ? 'fill-current' : ''}`} />
                                            {entry.likesCount}
                                        </button>

                                        {entry.replayData && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleReplay(entry); }}
                                                disabled={loadingReplayId === entry.id}
                                                className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                <Play className="w-4 h-4" />
                                                Replay
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Expanded view modal */}
            {expandedDrawing && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setExpandedId(null)}
                >
                    <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setExpandedId(null)}
                            className="absolute -top-4 -right-4 z-10 w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center hover:bg-gray-100 shadow-xl transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl p-6">
                            <img
                                src={expandedDrawing.imageUrl}
                                alt="Masterpiece"
                                className="w-full h-auto max-h-[75vh] object-contain"
                            />
                            <div className="mt-6 text-center space-y-4">
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-red-500 text-transparent bg-clip-text inline-block">
                                    {generateTitle(expandedDrawing.id)} by {expandedDrawing.artistName}
                                </h3>

                                <div className="flex items-center justify-center gap-4">
                                    <button
                                        onClick={(e) => handleLike(expandedDrawing.id, e)}
                                        disabled={likingId === expandedDrawing.id || likedEntryIds.has(expandedDrawing.id)}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-lg transition-transform hover:scale-105 active:scale-95 ${likedEntryIds.has(expandedDrawing.id)
                                            ? 'bg-red-50 text-red-500 border-2 border-red-100'
                                            : 'bg-white text-gray-700 hover:text-red-500 hover:border-red-200 border-2 border-gray-100 shadow-sm'
                                            }`}
                                    >
                                        <Heart className={`w-6 h-6 ${likedEntryIds.has(expandedDrawing.id) ? 'fill-current animate-pulse' : ''}`} />
                                        {expandedDrawing.likesCount}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Replay overlay */}
            {replayData && (
                <ReplayOverlay
                    strokes={replayData.strokes as any}
                    fillActions={replayData.fillActions as any}
                    onClose={() => setReplayData(null)}
                />
            )}
        </div>
    );
}
