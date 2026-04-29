import type { Dispatch, SetStateAction, RefObject } from "react";
import { ChevronLeft, ChevronRight, X, Music } from "lucide-react";
import type { MusicTrack } from "../../types/story.types";

interface PreviewSideProps {
  previews: string[];
  currentIndex: number;
  setCurrentIndex: Dispatch<SetStateAction<number>>;
  selectedFilters: Record<number, string>;
  selectedMusic: MusicTrack | null;
  setSelectedMusic: Dispatch<SetStateAction<MusicTrack | null>>;
  audioRef: RefObject<HTMLAudioElement | null>;
  isVideo: boolean;
}

export default function PreviewSide({
  previews,
  currentIndex,
  setCurrentIndex,
  selectedFilters,
  selectedMusic,
  setSelectedMusic,
  audioRef,
  isVideo,
}: PreviewSideProps) {
  return (
    <div className="relative bg-black flex flex-col items-center justify-center w-[60%] border-r border-neutral-800">
      {isVideo ? (
        <video
          src={previews[currentIndex]}
          autoPlay
          loop
          muted
          style={{
            filter:
              selectedFilters[currentIndex] !== "none"
                ? selectedFilters[currentIndex]
                : undefined,
          }}
          className="w-full h-full object-contain"
        />
      ) : (
        <img
          src={previews[currentIndex]}
          style={{
            filter:
              selectedFilters[currentIndex] !== "none"
                ? selectedFilters[currentIndex]
                : undefined,
          }}
          className="w-full h-full object-contain transition-all duration-300"
          alt="Preview"
        />
      )}

      {previews.length > 1 && (
        <>
          {currentIndex > 0 && (
            <button
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {currentIndex < previews.length - 1 && (
            <button
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
            >
              <ChevronRight size={20} />
            </button>
          )}
          <div className="absolute bottom-4 flex gap-1.5">
            {previews.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${idx === currentIndex ? "bg-[#0095F6]" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}

      {selectedMusic && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
          <Music size={14} className="text-white" />
          <span className="text-white text-[12px] font-medium">
            {selectedMusic.title}
          </span>
          <button
            onClick={() => {
              setSelectedMusic(null);
              if (audioRef.current) audioRef.current.pause();
            }}
            className="ml-1 text-neutral-400 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
