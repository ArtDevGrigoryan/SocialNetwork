import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { api } from "../../lib/axios.config";
import { StoryMedia } from "../story-ui/media-renderer";
import { StoryHeader } from "../story-ui/header";
import { StoryProgressBar } from "../story-ui/progess-bar";
import { ViewersDrawer } from "../story-ui/viewers-drawer";
import type {
  ArchiveStoryViewerProps,
  ViewerReaction,
} from "../../types/story.types";

export default function ArchiveStoryViewer({
  archives,
  initialIndex,
  onClose,
  isOwner = false,
}: ArchiveStoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);

  const [isPaused, setIsPaused] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
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
        const vidStart = currentStory.media.videoStartTime || 0;
        const actualDur =
          currentStory.media.videoDuration || videoRef.current.duration;
        const vidDur = actualDur > 0 ? actualDur : 15;
        const curr = videoRef.current.currentTime;

        if (curr >= vidStart + vidDur || curr >= videoRef.current.duration) {
          progressRef.current = 100;
        } else {
          progressRef.current = Math.max(
            0,
            Math.min(100, ((curr - vidStart) / vidDur) * 100),
          );
        }
      }

      if (progressRef.current >= 100) handleNext();
      else {
        setProgress(progressRef.current);
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentStory?._id, handleNext]);

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
      if (videoRef.current)
        videoRef.current.currentTime = currentStory.media.videoStartTime || 0;
    }
  }, [currentStory?._id]);

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

  useEffect(() => {
    if (isDrawerOpen && currentStory && isOwner) {
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
  }, [isDrawerOpen, currentStory?._id, isOwner]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleTouchStart = (e: React.TouchEvent) =>
    setTouchStartY(e.targetTouches[0].clientY);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartY) return;
    const diff = touchStartY - e.targetTouches[0].clientY;
    if (diff > 50) {
      if (isOwner && !isDrawerOpen) {
        setIsDrawerOpen(true);
        setIsPaused(true);
      }
      setTouchStartY(null);
    } else if (diff < -50) {
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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black sm:bg-black/95"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <audio ref={audioRef} loop muted={isMuted} />
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

      <div className="relative w-full h-[100dvh] sm:h-[85vh] sm:w-[calc(85vh*9/16)] sm:min-w-[340px] sm:max-w-[480px] bg-neutral-900 sm:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl sm:border-[8px] sm:border-neutral-950 shrink-0">
        <div
          className={`transition-opacity duration-300 z-50 ${isHolding ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <StoryProgressBar
            total={archives.length}
            currentIndex={currentIndex}
            progress={progress}
          />
          <StoryHeader
            avatar={currentStory.user?.avatar || "/default-avatar.png"}
            username={currentStory.user?.username || "Memory"}
            timeText={formatDate(currentStory.createdAt)}
            hasAudio={Boolean(hasAudio)}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
            onClose={onClose}
          />
        </div>

        <StoryMedia
          media={currentStory.media}
          isMuted={isMuted}
          videoRef={videoRef}
          setIsPaused={handleSetIsPaused}
          setIsHolding={handleSetIsHolding}
          onPrev={handlePrev}
          onNext={handleNext}
        />

        <div
          className={`transition-opacity duration-300 z-[70] ${isHolding ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          {isOwner && (
            <ViewersDrawer
              isOpen={isDrawerOpen}
              setIsOpen={(val) => {
                setIsDrawerOpen(val);
                setIsPaused(val);
              }}
              viewsCount={currentStory.viewsCount}
              viewers={viewers}
              loadingViewers={loadingViewers}
            />
          )}
        </div>
      </div>
    </div>
  );
}
