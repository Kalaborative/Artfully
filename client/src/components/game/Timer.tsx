import { Clock } from 'lucide-react';

interface TimerProps {
  timeRemaining: number;
  totalTime: number;
}

export default function Timer({ timeRemaining, totalTime }: TimerProps) {
  const percentage = (timeRemaining / totalTime) * 100;
  const isLow = timeRemaining <= 10;
  const isCritical = timeRemaining <= 5;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`
            absolute inset-y-0 left-0 transition-all duration-1000
            ${isCritical ? 'bg-red-500' : isLow ? 'bg-yellow-500' : 'bg-green-500'}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div
        className={`
          flex items-center gap-1 font-bold text-lg
          ${isCritical ? 'text-red-500 animate-pulse' : isLow ? 'text-yellow-600' : 'text-gray-700'}
        `}
      >
        <Clock className="w-5 h-5" />
        <span>{timeRemaining}s</span>
      </div>
    </div>
  );
}
