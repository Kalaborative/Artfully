import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useCanvasStore } from '../../store/canvasStore';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import DrawingCanvas from '../canvas/DrawingCanvas';
import CanvasToolbar from '../canvas/CanvasToolbar';
import ColorPalette from '../canvas/ColorPalette';
import BrushSettings from '../canvas/BrushSettings';
import ChatBox from '../chat/ChatBox';
import GameLeaderboard from './GameLeaderboard';
import WordHint from './WordHint';
import Timer from './Timer';
import WordSelection from './WordSelection';
import GameResults from './GameResults';
import Card from '../ui/Card';
import { Loader2 } from 'lucide-react';

export default function GameRoom() {
  const { game, results, wordChoices, isStarting, startingCountdown } = useGameStore();
  const { setupListeners: setupCanvasListeners, reset: resetCanvas } = useCanvasStore();
  const { setupListeners: setupChatListeners, reset: resetChat } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const unsubCanvas = setupCanvasListeners();
    const unsubChat = setupChatListeners();

    return () => {
      unsubCanvas();
      unsubChat();
      resetCanvas();
      resetChat();
    };
  }, [setupCanvasListeners, setupChatListeners, resetCanvas, resetChat]);

  // Show results if game ended
  if (results) {
    return <GameResults results={results} />;
  }

  // Show starting countdown
  if (isStarting) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="text-center p-12">
          <div className="text-6xl font-bold text-primary-500 mb-4">
            {startingCountdown}
          </div>
          <p className="text-xl text-gray-600">Game starting...</p>
        </Card>
      </div>
    );
  }

  // Show loading if no game
  if (!game) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
      </div>
    );
  }

  const isDrawer = game.currentDrawerId === user?.$id;
  const roundPhase = game.roundState?.phase;

  // Show word selection for drawer
  if (roundPhase === 'word_selection' && isDrawer && wordChoices) {
    return <WordSelection choices={wordChoices} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="grid grid-cols-12 gap-4">
        {/* Left sidebar - Leaderboard */}
        <div className="col-span-12 lg:col-span-2">
          <GameLeaderboard players={game.players} currentDrawerId={game.currentDrawerId} />
        </div>

        {/* Main content - Canvas */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          {/* Header */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-500">
                  Round {game.currentRound} / {game.totalRounds}
                </span>
                {game.roundState && (
                  <WordHint
                    maskedWord={game.roundState.maskedWord}
                    isDrawer={isDrawer}
                    word={isDrawer ? game.roundState.word : null}
                  />
                )}
              </div>
              {game.roundState && (
                <Timer
                  timeRemaining={game.roundState.timeRemaining}
                  totalTime={game.roundState.totalTime}
                />
              )}
            </div>
          </Card>

          {/* Canvas */}
          <DrawingCanvas isDrawer={isDrawer} />

          {/* Toolbar (only for drawer) */}
          {isDrawer && (
            <div className="flex gap-4">
              <CanvasToolbar />
              <ColorPalette />
              <BrushSettings />
            </div>
          )}
        </div>

        {/* Right sidebar - Chat */}
        <div className="col-span-12 lg:col-span-3">
          <ChatBox isDrawer={isDrawer} hasGuessed={game.players.find(p => p.userId === user?.$id)?.hasGuessedCorrectly || false} />
        </div>
      </div>
    </div>
  );
}
