import { X } from "lucide-react";

export const AvatarModal = ({ isOpen, onClose, avatarUrl }: any) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-6 backdrop-blur-sm transition-all animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={avatarUrl}
          className="max-h-[70vh] max-w-full rounded-full border-4 border-white shadow-2xl object-cover aspect-square"
          alt="profile"
        />
        <button
          onClick={onClose}
          className="absolute -top-10 -right-10 text-white hover:opacity-70 transition"
        >
          <X size={32} />
        </button>
      </div>
    </div>
  );
};

export default AvatarModal;