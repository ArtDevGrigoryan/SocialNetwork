import { Volume2, VolumeX, X } from "lucide-react";
import type { StoryHeaderProps } from "../../types/story.types";

export const StoryHeader = ({
  avatar,
  username,
  timeText,
  hasAudio,
  isMuted,
  onToggleMute,
  onClose,
}: StoryHeaderProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 pt-6 px-4 pb-12 bg-gradient-to-b from-black/80 to-transparent z-50 flex justify-between items-start pointer-events-none">
      <div className="flex items-center gap-2.5 pointer-events-auto">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border border-white/20">
          <img
            src={avatar || "/default-avatar.png"}
            alt={username}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex items-center gap-2 drop-shadow-md">
          <span className="text-white font-semibold text-[14px]">
            {username}
          </span>
          <span className="text-white/60 text-[13px]">{timeText}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 pointer-events-auto">
        {hasAudio && onToggleMute && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="text-white hover:text-neutral-300 drop-shadow-md transition-colors"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-white hover:text-neutral-300 drop-shadow-md transition-colors sm:hidden"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};
