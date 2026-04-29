import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  ChevronUp,
} from "lucide-react";
import { api } from "../../lib/axios.config";
import { cn } from "../../lib/utils";
import { StoryMedia } from "../story-ui/media-renderer";
import { StoryHeader } from "../story-ui/header";
import { StoryProgressBar } from "../story-ui/progess-bar";
import type {
  ArchiveStoryViewerProps,
  ViewerReaction,
} from "../../types/story.types";

export default function ArchiveStoryViewer({
  archives,
  initialIndex,
  onClose,
}: ArchiveStoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const [isPaused, setIsPaused] = useState(false);
  const [isHolding, setIsHolding] = useState(false); // UI թաքցնելու վիճակը
  const [isMuted, setIsMuted] = useState(false);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewers, setViewers] = useState<ViewerReaction[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressRef = useRef(0);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Refs անիմացիայի loop-ի համար, որ pause-ից չռեստարտվի
  const isPausedRef = useRef(isPaused);
  const isDrawerOpenRef = useRef(isDrawerOpen);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  useEffect(() => {
    isDrawerOpenRef.current = isDrawerOpen;
  }, [isDrawerOpen]);

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

  // 1. Progress Animation
  useEffect(() => {
    if (!currentStory) return;

    progressRef.current = 0;
    setProgress(0);
    lastTimeRef.current = performance.now();

    const musicSrc =
      currentStory.media.musicUrl || currentStory.media.backgroundMusic;
    const hasValidMusic = musicSrc && musicSrc !== "none";

    const mediaDuration =
      currentStory.media.type === "image" && hasValidMusic
        ? (currentStory.media.musicDuration || 15) * 1000
        : 5000;

    const animate = (time: number) => {
      if (isPausedRef.current || isDrawerOpenRef.current) {
        lastTimeRef.current = time;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (currentStory.media.type === "image") {
        progressRef.current += (deltaTime / mediaDuration) * 100;
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
  }, [currentStory?._id, handleNext]);

  // 2. Initial Audio/Video Load
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    if (currentStory) {
      const musicSrc =
        currentStory.media.musicUrl || currentStory.media.backgroundMusic;
      const hasValidMusic =
        musicSrc && musicSrc !== "none" && musicSrc.startsWith("http");

      if (hasValidMusic && audioRef.current) {
        audioRef.current.src = String(musicSrc);
        audioRef.current.currentTime = currentStory.media.musicStartTime || 0;
      }
      if (videoRef.current) videoRef.current.currentTime = 0;
    }
  }, [currentStory?._id]);

  // 3. Play/Pause Controller
  useEffect(() => {
    if (!currentStory) return;
    const shouldPause = isPaused || isDrawerOpen;

    if (shouldPause) {
      videoRef.current?.pause();
      audioRef.current?.pause();
    } else {
      if (currentStory.media.type === "video")
        videoRef.current?.play().catch(() => {});
      const musicSrc =
        currentStory.media.musicUrl || currentStory.media.backgroundMusic;
      const hasValidMusic =
        musicSrc && musicSrc !== "none" && musicSrc.startsWith("http");

      if (hasValidMusic && audioRef.current) {
        audioRef.current.muted = isMuted;
        audioRef.current.play().catch((e) => console.log("Audio skipped:", e));
      }
    }
  }, [isPaused, isDrawerOpen, isMuted, currentStory?._id]);

  // 4. Music Trimmer Loop
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentStory) return;
    const handleTimeUpdate = () => {
      const startTime = currentStory.media.musicStartTime || 0;
      const duration = currentStory.media.musicDuration || 15;
      if (audio.currentTime >= startTime + duration) {
        audio.currentTime = startTime;
        audio.play().catch(() => {});
      }
    };
    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [currentStory?._id]);

  // Viewers Fetch
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
  }, [isDrawerOpen, currentStory?._id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Swipe Up / Down Handlers
  const handleTouchStart = (e: React.TouchEvent) =>
    setTouchStartY(e.targetTouches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartY) return;
    const diff = touchStartY - e.targetTouches[0].clientY;

    if (diff > 50) {
      // Swipe Up
      if (!isDrawerOpen) {
        setIsDrawerOpen(true);
        setIsPaused(true);
      }
      setTouchStartY(null);
    } else if (diff < -50) {
      // Swipe Down
      if (isDrawerOpen) {
        setIsDrawerOpen(false);
        setIsPaused(false);
      } else {
        onClose();
      }
      setTouchStartY(null);
    }
  };
  const handleTouchEnd = () => setTouchStartY(null);

  const handleSetIsPaused = (val: boolean) => {
    if (isDrawerOpenRef.current) return;
    setIsPaused(val);
  };

  const handleSetIsHolding = (val: boolean) => {
    if (isDrawerOpenRef.current) return;
    setIsHolding(val);
  };

  if (!currentStory) return null;

  const musicSrc =
    currentStory.media.musicUrl || currentStory.media.backgroundMusic;
  const hasAudio =
    currentStory.media.type === "video" || (musicSrc && musicSrc !== "none");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <audio ref={audioRef} loop muted={isMuted} />

      {/* Navigation Buttons (Hidden on hold) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        className={`absolute left-4 top-1/2 -translate-y-1/2 text-white z-50 p-2 hover:bg-neutral-800 rounded-full transition-opacity duration-300 hidden sm:block ${isHolding ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <ChevronLeft size={30} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        className={`absolute right-4 top-1/2 -translate-y-1/2 text-white z-50 p-2 hover:bg-neutral-800 rounded-full transition-opacity duration-300 hidden sm:block ${isHolding ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <ChevronRight size={30} />
      </button>

      <button
        onClick={onClose}
        className={`absolute top-6 right-6 text-white z-50 p-2 hover:bg-neutral-800 rounded-full transition-opacity duration-300 hidden sm:block ${isHolding ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        <X size={30} />
      </button>

      <div className="relative w-full h-full sm:w-[400px] sm:h-[90vh] bg-neutral-900 sm:rounded-xl overflow-hidden flex flex-col shadow-2xl">
        {/* Header & Progress (Hidden on hold) */}
        <div
          className={`transition-opacity duration-300 z-50 ${isHolding ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <StoryProgressBar
            total={archives.length}
            currentIndex={currentIndex}
            progress={progress}
          />
          <StoryHeader
            avatar="/default-avatar.png"
            username="Memory"
            timeText={formatDate(currentStory.createdAt)}
            hasAudio={Boolean(hasAudio)}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            onClose={onClose}
          />
        </div>

        {/* Media Container */}
        <StoryMedia
          media={currentStory.media}
          isMuted={isMuted}
          videoRef={videoRef}
          setIsPaused={handleSetIsPaused}
          setIsHolding={handleSetIsHolding}
          onPrev={handlePrev}
          onNext={handleNext}
        />

        {/* Viewers Trigger Button (Hidden on hold) */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${isHolding ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-10 pb-4 px-4 flex justify-center">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDrawerOpen(true);
                setIsPaused(true);
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

        {/* Viewers Drawer */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl transition-transform duration-300 z-40 flex flex-col pointer-events-auto",
            isDrawerOpen ? "translate-y-0 h-[60%]" : "translate-y-full h-[60%]",
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Eye size={18} />
              <span>{currentStory.viewsCount} Views</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDrawerOpen(false);
                setIsPaused(false);
              }}
              className="text-neutral-400 hover:text-white p-1"
            >
              <X size={20} />
            </button>
          </div>

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

                    {(v.reaction || v.liked) && (
                      <div className="flex items-center gap-1.5 text-xl">
                        {v.reaction && <span>{v.reaction}</span>}
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
