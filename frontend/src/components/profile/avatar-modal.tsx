import { X } from "lucide-react";

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  avatarUrl: string;
  username: string;
}

export default function AvatarModal({
  isOpen,
  onClose,
  avatarUrl,
  username,
}: AvatarModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white p-2 hover:bg-neutral-800 rounded-full transition-colors z-10"
      >
        <X size={30} />
      </button>

      <div
        className="relative max-w-sm sm:max-w-md w-full aspect-square rounded-full overflow-hidden border-4 border-neutral-800 shadow-2xl animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={avatarUrl}
          alt={username}
          className="w-full h-full object-cover bg-neutral-900"
        />
      </div>
    </div>
  );
}
