import type { Dispatch, SetStateAction, RefObject, ChangeEvent } from "react";
import { MapPin, Smile, ChevronRight, SlidersHorizontal } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import type { MusicTrack } from "../../types/story.types";

interface DetailsStepProps {
  user: any;
  caption: string;
  setCaption: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: Dispatch<SetStateAction<boolean>>;
  selectedMusic: MusicTrack | null;
  setShowMusicSearch: Dispatch<SetStateAction<boolean>>;
  musicStartTime: number;
  audioDuration: number;
  handleAudioTimeChange: (e: ChangeEvent<HTMLInputElement>) => void;
  captionRef: RefObject<HTMLTextAreaElement | null>;
}

export default function DetailsStep({
  user,
  caption,
  setCaption,
  location,
  setLocation,
  showEmojiPicker,
  setShowEmojiPicker,
  selectedMusic,
  setShowMusicSearch,
  musicStartTime,
  audioDuration,
  handleAudioTimeChange,
  captionRef,
}: DetailsStepProps) {
  const handleEmojiClick = (emojiObj: any) => {
    const cursorPosition = captionRef.current?.selectionStart || caption.length;
    const textBeforeCursor = caption.slice(0, cursorPosition);
    const textAfterCursor = caption.slice(cursorPosition);
    setCaption(textBeforeCursor + emojiObj.emoji + textAfterCursor);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
      <div className="flex items-center gap-3 p-4">
        <img
          src={user?.avatar || "/default-avatar.png"}
          alt="user"
          className="w-7 h-7 rounded-full object-cover"
        />
        <span className="text-white text-sm font-semibold">
          {user?.username}
        </span>
      </div>

      <div className="px-4 relative">
        <textarea
          ref={captionRef}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption... mention friends with @username"
          className="w-full bg-transparent text-white resize-none outline-none text-sm min-h-[120px]"
          maxLength={2200}
        />
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            <Smile size={20} />
          </button>
          <span className="text-xs text-neutral-500">
            {caption.length}/2200
          </span>
        </div>

        {showEmojiPicker && (
          <div className="absolute top-full left-4 z-50 shadow-2xl rounded-lg overflow-hidden border border-neutral-700">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={Theme.DARK}
              lazyLoadEmojis
              searchDisabled
              skinTonesDisabled
              width={300}
              height={300}
            />
          </div>
        )}
      </div>

      <div className="p-2 border-y border-neutral-800 relative">
        <input
          type="text"
          placeholder="Add location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full bg-transparent text-white text-sm px-2 py-2 outline-none"
        />
        <MapPin
          size={18}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400"
        />
      </div>

      <div
        className="p-4 border-b border-neutral-800 flex justify-between items-center cursor-pointer hover:bg-neutral-800/50 transition"
        onClick={() => setShowMusicSearch(true)}
      >
        <span className="text-white text-sm font-medium">
          {selectedMusic ? "Change Audio" : "Add Background Music"}
        </span>
        <ChevronRight size={20} className="text-neutral-500" />
      </div>

      {selectedMusic && (
        <div className="p-4 border-b border-neutral-800 space-y-4 bg-neutral-900/30">
          <div className="flex items-center gap-3">
            <SlidersHorizontal size={18} className="text-white" />
            <span className="text-white text-sm font-semibold">
              Audio Position
            </span>
          </div>
          <div className="text-xs text-neutral-400 flex justify-between">
            <span>0:00</span>
            <span>Select exact start time</span>
            <span>
              0:{Math.floor(audioDuration).toString().padStart(2, "0")}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(0, audioDuration - 1)}
            step={0.5}
            value={musicStartTime}
            onChange={handleAudioTimeChange}
            className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#0095F6]"
          />
          <div className="text-center text-xs text-[#0095F6] font-medium">
            Starts at 0:{Math.floor(musicStartTime).toString().padStart(2, "0")}
          </div>
        </div>
      )}
    </div>
  );
}
