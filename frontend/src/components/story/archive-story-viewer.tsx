import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Eye,
  Heart,
  Loader2,
  ChevronUp,
} from "lucide-react";
import { api } from "../../lib/axios.config";
import type { ArchiveItem } from "../../store/archive.store";
import { cn } from "../../lib/utils";

interface ArchiveStoryViewerProps {
  archives: ArchiveItem[];
  initialIndex: number;
  onClose: () => void;
}

interface ViewerReaction {
  viewer: {
    _id: string;
    username: string;
    avatar: string;
  };
  reaction?: string;
  viewedAt: string;
}

export default function ArchiveStoryViewer({
  archives,
  initialIndex,
  onClose,
}: ArchiveStoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewers, setViewers] = useState<ViewerReaction[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressRef = useRef(0);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const currentStory = archives[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < archives.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsDrawerOpen(false);
    } else {
      onClose();
    }
  }, [currentIndex, archives.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsDrawerOpen(false);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!currentStory) return;

    progressRef.current = 0;
    setProgress(0);
    lastTimeRef.current = performance.now();

    const duration = currentStory.media.duration || 5000;

    const animate = (time: number) => {
      if (isPaused || isDrawerOpen) {
        lastTimeRef.current = time;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = time - (lastTimeRef.current || time);
      lastTimeRef.current = time;

      if (currentStory.media.type === "image") {
        progressRef.current += (deltaTime / duration) * 100;
      } else if (videoRef.current && videoRef.current.duration) {
        progressRef.current =
          (videoRef.current.currentTime / videoRef.current.duration) * 100;
      }

      if (progressRef.current >= 100) {
        handleNext();
      } else {
        setProgress(progressRef.current);
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentIndex, currentStory, isPaused, isDrawerOpen, handleNext]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (!currentStory || isPaused || isDrawerOpen) {
      videoRef.current?.pause();
      audioRef.current?.pause();
      return;
    }

    if (currentStory.media.type === "video") {
      videoRef.current?.play().catch(console.error);
    }

    const hasValidMusic =
      currentStory.media.backgroundMusic &&
      currentStory.media.backgroundMusic !== "none" &&
      currentStory.media.backgroundMusic.startsWith("http");

    if (hasValidMusic && audioRef.current) {
      audioRef.current.src = String(currentStory?.media?.backgroundMusic || "");
      audioRef.current.muted = isMuted;
      audioRef.current.play().catch((e) => console.log("Audio skipped:", e));
    }
  }, [currentIndex, currentStory, isPaused, isDrawerOpen, isMuted]);

  useEffect(() => {
    if (isDrawerOpen && currentStory) {
      const fetchViewers = async () => {
        setLoadingViewers(true);
        try {
          const { data } = await api.get(
            `/archives/${currentStory._id}/viewers`,
          );
          setViewers(data.payload || []);
        } catch (error) {
          console.error("Failed to fetch viewers", error);
        } finally {
          setLoadingViewers(false);
        }
      };
      fetchViewers();
    }
  }, [isDrawerOpen, currentStory]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (!currentStory) return null;

  const hasAudio =
    currentStory.media.type === "video" ||
    (currentStory.media.backgroundMusic &&
      currentStory.media.backgroundMusic !== "none");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95">
      <audio ref={audioRef} loop muted={isMuted} />

      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white z-50 p-2 hover:bg-neutral-800 rounded-full transition hidden sm:block"
      >
        <ChevronLeft size={30} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white z-50 p-2 hover:bg-neutral-800 rounded-full transition hidden sm:block"
      >
        <ChevronRight size={30} />
      </button>

      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white z-50 p-2 hover:bg-neutral-800 rounded-full transition hidden sm:block"
      >
        <X size={30} />
      </button>

      <div className="relative w-full h-full sm:w-[400px] sm:h-[90vh] bg-neutral-900 sm:rounded-xl overflow-hidden flex flex-col shadow-2xl">
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 bg-gradient-to-b from-black/60 to-transparent">
          {archives.map((archived, idx) => (
            <div
              key={archived._id}
              className="h-[2px] flex-1 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-none"
                style={{
                  width:
                    idx === currentIndex
                      ? `${progress}%`
                      : idx < currentIndex
                        ? "100%"
                        : "0%",
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4 pt-2">
          <div className="flex items-center gap-2 drop-shadow-md">
            <div className="flex flex-col">
              <span className="text-white font-semibold text-sm drop-shadow-lg">
                Memory
              </span>
              <span className="text-neutral-200 text-xs drop-shadow-lg font-medium">
                {formatDate(currentStory.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasAudio && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
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

        <div
          className="relative flex-1 flex items-center justify-center bg-black cursor-pointer select-none"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {currentStory.media.type === "image" ? (
            <img
              src={currentStory.media.url}
              alt="Archive"
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <video
              ref={videoRef}
              src={currentStory.media.url}
              playsInline
              muted={isMuted}
              className="w-full h-full object-cover pointer-events-none"
              onEnded={handleNext}
            />
          )}

          <div
            className="absolute inset-y-0 left-0 w-1/3 z-10"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
          />
          <div
            className="absolute inset-y-0 right-0 w-1/3 z-10"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
          />
        </div>

        {/* Ներքևի Swipe Up / Viewers Section */}
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10 pb-4 px-4 flex justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDrawerOpen(true);
              }}
              className="flex flex-col items-center gap-1 text-white hover:text-gray-300 transition"
            >
              <ChevronUp size={20} className="animate-bounce" />
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Eye size={16} />
                <span>{currentStory.viewsCount} Viewers</span>
              </div>
            </button>
          </div>
        </div>

        {/* Viewers & Reactions Drawer (Ներքևից բացվող) */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl transition-transform duration-300 z-40 flex flex-col",
            isDrawerOpen ? "translate-y-0 h-[60%]" : "translate-y-full h-[60%]",
          )}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Eye size={18} />
              <span>{currentStory.viewsCount} Views</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDrawerOpen(false);
              }}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Viewers List */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loadingViewers ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-neutral-500 w-6 h-6" />
              </div>
            ) : viewers.length === 0 ? (
              <div className="text-center text-neutral-500 text-sm mt-10">
                No viewers yet.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {viewers.map((v, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={v.viewer.avatar || "/default-avatar.png"}
                        alt={v.viewer.username}
                        className="w-10 h-10 rounded-full object-cover border border-neutral-700"
                      />
                      <span className="text-sm font-semibold text-white">
                        {v.viewer.username}
                      </span>
                    </div>

                    {/* Եթե Reaction է դրել, ցույց ենք տալիս */}
                    {v.reaction && (
                      <div className="text-lg">
                        {v.reaction === "like" ? (
                          <Heart
                            className="text-red-500 fill-red-500"
                            size={20}
                          />
                        ) : (
                          v.reaction
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
