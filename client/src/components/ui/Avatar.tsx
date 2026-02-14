import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
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

export default function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  return (
    <div
      className={`
        rounded-full overflow-hidden bg-gray-200 flex items-center justify-center
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {src ? (
        <img src={src} alt={alt || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <User className={`text-gray-400 ${iconSizes[size]}`} />
      )}
    </div>
  );
}
