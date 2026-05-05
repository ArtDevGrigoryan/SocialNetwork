// ==================== ./frontend/src/components/story/story-music.tsx ====================
import { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  Loader2,
  CheckCircle2,
  SlidersHorizontal,
  Play,
  Pause,
  Plus,
} from "lucide-react";
import { useStoryStore } from "../../store/story.store";
import type {
  MusicTrack,
  MusicLibraryProps,
  MusicTrimmerProps,
} from "../../types/story.types";

export const StoryMusicLibrary = ({
  onClose,
  onSelectMusic,
}: MusicLibraryProps) => {
  const store = useStoryStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) store.searchMusic(searchQuery);
      else store.searchMusic("trending hits");
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handlePreview = (e: React.MouseEvent, music: MusicTrack) => {
    e.stopPropagation();
    if (previewId === music.id) {
      audioRef.current?.pause();
      setPreviewId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = music.url;
        audioRef.current.play().catch(() => {});
      }
      setPreviewId(music.id);
    }
  };

  const handleSelect = (music: MusicTrack) => {
    audioRef.current?.pause();
    setPreviewId(null);
    onSelectMusic(music);
  };

  return (
    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl pt-4 pb-6 px-4 shadow-2xl z-40 flex flex-col h-[70%]">
      <audio ref={audioRef} />
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-white font-semibold">Music Library</h3>
        <button
          onClick={() => {
            audioRef.current?.pause();
            onClose();
          }}
          className="text-neutral-400 p-1"
        >
          <X size={20} />
        </button>
      </div>
      <div className="relative mb-4 shrink-0">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search music..."
          className="w-full bg-neutral-800 text-white text-sm rounded-xl py-2.5 pl-9 pr-4 outline-none"
        />
      </div>

      <div className="relative flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
        {store.isSearchingMusic && store.musicResults.length > 0 && (
          <div className="absolute top-0 left-0 right-0 flex justify-center py-2 z-10 bg-gradient-to-b from-neutral-900/80 to-transparent pointer-events-none">
            <Loader2 size={16} className="text-neutral-400 animate-spin" />
          </div>
        )}
        {store.isSearchingMusic && store.musicResults.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="text-neutral-500 animate-spin" />
          </div>
        ) : (
          store.musicResults.map((music) => (
            <div
              key={music.id}
              className="flex items-center justify-between p-2 hover:bg-neutral-800 rounded-xl transition group"
            >
              <div
                className="flex items-center gap-3 cursor-pointer flex-1"
                onClick={(e) => handlePreview(e, music)}
              >
                <div className="relative w-11 h-11 rounded-md overflow-hidden shrink-0">
                  <img
                    src={music.coverArt}
                    className="w-full h-full object-cover"
                    alt="cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    {previewId === music.id ? (
                      <Pause size={20} className="text-white" />
                    ) : (
                      <Play size={20} className="text-white" />
                    )}
                  </div>
                  {previewId === music.id && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Pause size={20} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="truncate pr-2">
                  <p
                    className={`text-[13px] font-semibold truncate ${previewId === music.id ? "text-blue-500" : "text-white"}`}
                  >
                    {music.title}
                  </p>
                  <p className="text-neutral-400 text-[11px] truncate">
                    {music.artist}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSelect(music)}
                className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-white hover:bg-blue-500 hover:scale-110 transition shrink-0"
              >
                <Plus size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const StoryMusicTrimmer = ({
  onClose,
  onBackToLibrary,
}: MusicTrimmerProps) => {
  const store = useStoryStore();

  if (!store.selectedMusic) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl pt-4 pb-8 px-5 shadow-2xl z-40">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img
            src={store.selectedMusic.coverArt}
            className="w-10 h-10 rounded-md"
            alt="cover"
          />
          <div className="flex flex-col">
            <span className="text-white text-sm font-semibold">
              {store.selectedMusic.title}
            </span>
            <span className="text-neutral-400 text-[11px]">
              {store.selectedMusic.artist}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              store.setSelectedMusic(null);
              onBackToLibrary();
            }}
            className="text-neutral-400 p-2 bg-neutral-800 rounded-full"
          >
            <X size={16} />
          </button>
          <button
            onClick={onClose}
            className="text-white p-2 bg-blue-500 rounded-full"
          >
            <CheckCircle2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-neutral-400 text-xs font-medium">
          <SlidersHorizontal size={14} className="inline mr-1" /> Duration
        </span>
        <div className="flex gap-2 bg-neutral-800 p-1 rounded-lg">
          {[5, 10, 15, 30].map((dur) => (
            <button
              key={dur}
              onClick={() => store.setMusicDuration(dur)}
              className={`px-3 py-1 rounded-md text-xs font-medium ${store.musicDuration === dur ? "bg-neutral-600 text-white" : "text-neutral-400"}`}
            >
              {dur}s
            </button>
          ))}
        </div>
      </div>

      <div className="relative w-full h-12 bg-neutral-800 rounded-lg overflow-hidden flex items-center px-1 mb-2">
        <input
          type="range"
          min={0}
          max={30 - store.musicDuration}
          value={store.musicStartTime}
          onChange={(e) => store.setMusicStartTime(Number(e.target.value))}
          className="w-full h-full z-10 opacity-0 cursor-pointer"
        />
        <div
          className="absolute h-full border-2 border-white bg-white/10 rounded-md pointer-events-none"
          style={{
            left: `${(store.musicStartTime / 30) * 100}%`,
            width: `${(store.musicDuration / 30) * 100}%`,
          }}
        />
      </div>

      {/* 🔥 ՆՈՐ: STICKER TOGGLE */}
      {store.musicWidget && (
        <div className="flex items-center justify-between mt-6 bg-neutral-800/50 p-3 rounded-xl border border-neutral-800">
          <span className="text-white text-sm font-medium">
            Show Sticker on Story
          </span>
          <button
            onClick={() =>
              store.setMusicWidget({
                ...store.musicWidget!,
                isHidden: !store.musicWidget?.isHidden,
              })
            }
            className={`w-11 h-6 rounded-full transition-colors relative ${!store.musicWidget?.isHidden ? "bg-[#0095F6]" : "bg-neutral-600"}`}
          >
            <div
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${!store.musicWidget?.isHidden ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      )}
    </div>
  );
};
