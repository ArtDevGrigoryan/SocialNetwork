import { X, Volume2, VolumeX } from "lucide-react";
import type { StoryHeaderProps } from "../../types/story.types";

export const StoryHeader = ({
  avatar,
  username,
  timeText,
  hasAudio,
  isMuted,
  onToggleMute,
  onClose,
}: StoryHeaderProps) => (
  <div className="absolute top-4 left-0 right-0 z-[60] flex items-center justify-between px-4 pt-2 pointer-events-none">
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
    <div className="flex items-center gap-2 pointer-events-auto relative z-[70]">
      {hasAudio && onToggleMute && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleMute();
          }}
          className="text-white p-2 sm:p-1.5 drop-shadow-md bg-black/30 hover:bg-black/50 rounded-full transition pointer-events-auto"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      )}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        className="text-white sm:hidden p-2 drop-shadow-md bg-black/30 rounded-full ml-1"
      >
        <X size={20} />
      </button>
    </div>
  </div>
);
