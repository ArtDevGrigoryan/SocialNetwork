import { X, Volume2, VolumeX } from "lucide-react";

interface StoryHeaderProps {
  avatar?: string;
  username: string;
  timeText: string;
  hasAudio?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
  onClose: () => void;
}

export const StoryHeader = ({
  avatar,
  username,
  timeText,
  hasAudio,
  isMuted,
  onToggleMute,
  onClose,
}: StoryHeaderProps) => (
  <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4 pt-2 pointer-events-none">
    <div className="flex items-center gap-2 drop-shadow-md pointer-events-auto">
      <img
        src={avatar || "/default-avatar.png"}
        alt={username}
        className="w-8 h-8 rounded-full object-cover border border-neutral-700"
      />
      <div className="flex flex-col">
        <span className="text-white font-semibold text-sm drop-shadow-lg">
          {username}
        </span>
        <span className="text-neutral-200 text-xs drop-shadow-lg font-medium">
          {timeText}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-2 pointer-events-auto">
      {hasAudio && onToggleMute && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleMute();
          }}
          className="text-white p-1.5 drop-shadow-md hover:bg-white/20 rounded-full transition"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}
      <button
        onClick={onClose}
        className="text-white sm:hidden p-1 drop-shadow-md"
      >
        <X size={24} />
      </button>
    </div>
  </div>
);
