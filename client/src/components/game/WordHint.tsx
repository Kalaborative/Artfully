interface WordHintProps {
  maskedWord: string;
  isDrawer: boolean;
  word: string | null;
}

export default function WordHint({ maskedWord, isDrawer, word }: WordHintProps) {
  if (isDrawer && word) {
    return (
      <div className="mt-1">
        <span className="text-lg font-bold text-primary-500">{word}</span>
        <span className="text-sm text-gray-500 ml-2">(Your word)</span>
      </div>
    );
  }

  return (
    <div className="mt-1 flex items-center gap-1">
      {maskedWord.split('').map((char, i) => (
        <span
          key={i}
          className={`
            inline-flex items-center justify-center w-6 h-8 text-lg font-bold
            ${char === '_' ? 'border-b-2 border-gray-400' : char === ' ' ? 'w-3' : 'text-green-600'}
          `}
        >
          {char !== '_' ? char : ''}
        </span>
      ))}
    </div>
  );
}
