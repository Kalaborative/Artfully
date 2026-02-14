import { useState, useRef } from 'react';
import { storage, BUCKETS, ID } from '../../lib/appwrite';
import { Camera, Loader2, X } from 'lucide-react';

interface AvatarUploaderProps {
  currentAvatarUrl?: string;
  currentFileId?: string;
  onUpload: (fileId: string, fileUrl: string) => Promise<void>;
  size?: 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32',
};

const iconSizes = {
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
};

export default function AvatarUploader({
  currentAvatarUrl,
  currentFileId,
  onUpload,
  size = 'xl',
}: AvatarUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a JPG, PNG, or WebP image');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Delete old avatar if exists
      if (currentFileId) {
        try {
          await storage.deleteFile(BUCKETS.AVATARS, currentFileId);
        } catch (err) {
          // Ignore error if file doesn't exist
          console.warn('Could not delete old avatar:', err);
        }
      }

      // Upload new file
      const uploadedFile = await storage.createFile(
        BUCKETS.AVATARS,
        ID.unique(),
        file
      );

      // Get file URL (using getFileView instead of getFilePreview to avoid transformation limits)
      const fileUrl = storage.getFileView(
        BUCKETS.AVATARS,
        uploadedFile.$id
      );

      // Call onUpload callback
      await onUpload(uploadedFile.$id, fileUrl.toString());

      setPreviewUrl(null);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload image');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={isUploading}
        className={`
          relative rounded-full overflow-hidden bg-gray-200
          ${sizeClasses[size]}
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          transition-all duration-200
          ${isUploading ? 'cursor-wait' : 'cursor-pointer'}
        `}
      >
        {/* Avatar Image or Default */}
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg
              className={`text-gray-400 ${iconSizes[size]}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}

        {/* Hover Overlay */}
        <div
          className={`
            absolute inset-0 bg-black/50 flex items-center justify-center
            transition-opacity duration-200
            ${isHovering && !isUploading ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <Camera className="w-8 h-8 text-white" />
        </div>

        {/* Loading Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-red-100 text-red-600 text-xs p-2 rounded-lg text-center">
          {error}
          <button
            onClick={() => setError(null)}
            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-400 text-center mt-2">
        Click to upload
      </p>
    </div>
  );
}
