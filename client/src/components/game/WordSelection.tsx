import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import Card from '../ui/Card';
import type { WordChoice } from '@artfully/shared';
import { Sparkles, Star, Zap } from 'lucide-react';

interface WordSelectionProps {
  choices: WordChoice[];
}

const difficultyConfig = {
  easy: {
    icon: <Star className="w-6 h-6" />,
    color: 'text-green-500',
    bgColor: 'bg-green-50 hover:bg-green-100 border-green-200',
    label: 'Easy',
    points: '60%',
  },
  medium: {
    icon: <Sparkles className="w-6 h-6" />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
    label: 'Medium',
    points: '80%',
  },
  hard: {
    icon: <Zap className="w-6 h-6" />,
    color: 'text-red-500',
    bgColor: 'bg-red-50 hover:bg-red-100 border-red-200',
    label: 'Hard',
    points: '100%',
  },
};

export default function WordSelection({ choices }: WordSelectionProps) {
  const { selectWord, wordSelectionTimeLimit } = useGameStore();
  const [timeLeft, setTimeLeft] = useState(wordSelectionTimeLimit);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          // Auto-select a random word when time runs out
          const randomIndex = Math.floor(Math.random() * choices.length);
          selectWord(randomIndex);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [choices.length, selectWord]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-2xl w-full text-center p-8">
        <h2 className="text-2xl font-bold mb-2">Choose a Word</h2>
        <p className="text-gray-500 mb-6">
          You have <span className="font-bold text-primary-500">{timeLeft}s</span> to choose
        </p>

        <div className="grid gap-4">
          {choices.map((choice, index) => {
            const config = difficultyConfig[choice.difficulty];

            return (
              <button
                key={index}
                onClick={() => selectWord(index)}
                className={`
                  p-6 rounded-xl border-2 transition-all
                  ${config.bgColor}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={config.color}>{config.icon}</span>
                    <div className="text-left">
                      <div className="text-xl font-bold">{choice.word}</div>
                      <div className="text-sm text-gray-500">{choice.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${config.color}`}>{config.label}</div>
                    <div className="text-sm text-gray-500">{config.points} points</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
