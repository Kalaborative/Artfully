import { User } from 'lucide-react';

export type AvatarFrame = 'gold-frame' | 'rainbow-frame' | null;

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  frame?: AvatarFrame;
}

const sizeStyles = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

const framePadding = {
  sm: 'p-[2px]',
  md: 'p-[3px]',
  lg: 'p-[3px]',
  xl: 'p-[4px]',
};

const frameStyles: Record<string, string> = {
  'gold-frame': 'animate-gold-frame-spin shadow-lg shadow-yellow-500/40',
  'rainbow-frame': 'bg-gradient-to-br from-red-500 via-green-500 to-blue-500 shadow-lg shadow-purple-500/30',
};

export default function Avatar({ src, alt, size = 'md', className = '', frame }: AvatarProps) {
  const avatar = (
    <div
      className={`
        rounded-full overflow-hidden bg-gray-200 flex items-center justify-center
        ${sizeStyles[size]}
        ${!frame ? className : ''}
      `}
    >
      {src ? (
        <img src={src} alt={alt || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <User className={`text-gray-400 ${iconSizes[size]}`} />
      )}
    </div>
  );

  if (frame && frameStyles[frame]) {
    return (
      <div className={`inline-flex rounded-full ${framePadding[size]} ${frameStyles[frame]} ${className}`}>
        {avatar}
      </div>
    );
  }

  return avatar;
}
