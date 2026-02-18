import { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Megaphone } from 'lucide-react';

const DISMISSED_KEY = 'dismissed_announcement_id';

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export default function AnnouncementModal() {
  const [announcement, setAnnouncement] = useState<AnnouncementData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const serverUrl = import.meta.env.VITE_SERVER_URL || '';
        const res = await fetch(`${serverUrl}/api/announcements/latest`);
        if (!res.ok) return;

        const data = await res.json();
        if (!data.announcement) return;

        const dismissed = localStorage.getItem(DISMISSED_KEY);
        if (dismissed === data.announcement.id) return;

        setAnnouncement(data.announcement);
        setIsOpen(true);
      } catch {
        // Silently fail — announcements are non-critical
      }
    };

    fetchLatest();
  }, []);

  const handleClose = () => {
    if (announcement) {
      localStorage.setItem(DISMISSED_KEY, announcement.id);
    }
    setIsOpen(false);
  };

  if (!announcement) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <div className="text-center mb-4">
        <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Megaphone className="w-7 h-7 text-primary-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{announcement.title}</h2>
        <p className="text-sm text-gray-400 mt-1">
          {new Date(announcement.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div
        className="prose prose-sm max-w-none mb-6"
        dangerouslySetInnerHTML={{ __html: announcement.content }}
      />

      <Button onClick={handleClose} className="w-full">
        Got it!
      </Button>
    </Modal>
  );
}
