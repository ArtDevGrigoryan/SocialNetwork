import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { api } from "../../lib/axios.config";

export interface IStoryData {
  _id: string;
  createdAt: string;
  expiresAt: string;
  updatedAt: string;
  viewsCount: number;
  media: {
    url: string;
    key: string;
    backgroundMusic: string;
    type: "image" | "video";
  };
  user: {
    _id: string;
    username: string;
    avatar: string;
  };
  viewer: {
    seen: boolean;
  };
}

interface StoryViewerProps {
  userId: string;
  onClose: () => void;
  onNextUser?: () => void;
  onPrevUser?: () => void;
}

export default function StoryViewer({
  userId,
  onClose,
  onNextUser,
  onPrevUser,
}: StoryViewerProps) {
  const [stories, setStories] = useState<IStoryData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressRef = useRef(0);
  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    const fetchUserStories = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/stories/user/${userId}`);
        const fetchedStories: IStoryData[] = data.payload || [];
        setStories(fetchedStories);

        if (fetchedStories.length > 0) {
          const firstUnseenIndex = fetchedStories.findIndex(
            (s) => !s.viewer?.seen,
          );
          setCurrentIndex(firstUnseenIndex !== -1 ? firstUnseenIndex : 0);
        }
      } catch (error) {
        console.error("Error fetching stories:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserStories();
  }, [userId]);

  const currentStory = stories[currentIndex];

  useEffect(() => {
    if (!currentStory) return;

    if (!currentStory.viewer?.seen) {
      api.get(`/stories/${currentStory._id}`).catch(console.error);

      setStories((prev) =>
        prev.map((s, idx) =>
          idx === currentIndex ? { ...s, viewer: { seen: true } } : s,
        ),
      );
    }
  }, [currentIndex, currentStory]);

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (onNextUser) {
      onNextUser();
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onNextUser, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else if (onPrevUser) {
      onPrevUser();
    }
  }, [currentIndex, onPrevUser]);

  useEffect(() => {
    if (loading || !currentStory) return;

    progressRef.current = 0;
    setProgress(0);
    lastTimeRef.current = performance.now();

    const duration = 5000;

    const animate = (time: number) => {
      if (isPaused) {
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
  }, [currentIndex, loading, currentStory, isPaused, handleNext]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (!currentStory || isPaused) {
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
      audioRef.current.src = currentStory.media.backgroundMusic;
      audioRef.current.muted = isMuted;
      audioRef.current.play().catch((e) => console.log("Audio skipped:", e));
    }
  }, [currentIndex, currentStory, isPaused, isMuted]);

  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours > 0 ? `${hours}h` : "1m";
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95">
        <Loader2 className="w-10 h-10 animate-spin text-white" />
      </div>
    );
  }

  if (stories.length === 0) {
    onClose();
    return null;
  }

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
          {stories.map((_, idx) => (
            <div
              key={idx}
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
            <img
              src={currentStory.user.avatar || "/default-avatar.png"}
              alt={currentStory.user.username}
              className="w-8 h-8 rounded-full object-cover border border-neutral-700"
            />
            <span className="text-white font-semibold text-sm drop-shadow-lg">
              {currentStory.user.username}
            </span>
            <span className="text-neutral-200 text-xs drop-shadow-lg font-medium">
              {getRelativeTime(currentStory.createdAt)}
            </span>
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
              alt="Story"
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
      </div>
    </div>
  );
}
