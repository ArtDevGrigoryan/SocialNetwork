import { useState, useEffect, useRef, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import { StoryProgressBar } from "../story-ui/progess-bar";
import { StoryMedia } from "../story-ui/media-renderer";
import { ViewersDrawer } from "../story-ui/viewers-drawer";
import { StoryReplyBox } from "../story-ui/reply-box";
import { StoryHeader } from "../story-ui/header";
import { FloatingReactions } from "../story-ui/floating-reactions";
import type {
  IStoryData,
  StoryViewerProps,
  ViewerReaction,
} from "../../types/story.types";

export default function StoryViewer({
  userId,
  onClose,
  onNextUser,
  onPrevUser,
}: StoryViewerProps) {
  const { user: authUser } = useAuthStore();
  const [stories, setStories] = useState<IStoryData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [viewers, setViewers] = useState<ViewerReaction[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const isOwner = currentStory?.user._id === authUser?._id;

  useEffect(() => {
    if (!currentStory) return;
    if (!currentStory.viewer?.seen) {
      api.get(`/stories/${currentStory._id}`).catch(console.error);
      setStories((prev) =>
        prev.map((s, idx) =>
          idx === currentIndex
            ? { ...s, viewer: { ...s.viewer, seen: true } }
            : s,
        ),
      );
    }
  }, [currentIndex, currentStory]);

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsDrawerOpen(false);
    } else if (onNextUser) {
      onNextUser();
      setIsDrawerOpen(false);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onNextUser, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsDrawerOpen(false);
    } else if (onPrevUser) {
      onPrevUser();
      setIsDrawerOpen(false);
    }
  }, [currentIndex, onPrevUser]);

  // Handle Delete Modal Logic
  const handleDeleteClick = useCallback(() => {
    setIsPaused(true);
    setShowDeleteConfirm(true);
  }, []);

  const cancelDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setIsPaused(false);
  }, []);

  const confirmDelete = async () => {
    if (!currentStory) return;

    setIsDeleting(true);
    try {
      await api.delete(`/stories/${currentStory._id}`);

      const updatedStories = stories.filter((s) => s._id !== currentStory._id);

      setShowDeleteConfirm(false);
      setIsDeleting(false);

      if (updatedStories.length === 0) {
        onClose();
      } else {
        setStories(updatedStories);
        setIsDrawerOpen(false);
        setIsPaused(false);
        if (currentIndex >= updatedStories.length) {
          setCurrentIndex(updatedStories.length - 1);
        }
      }
    } catch (error) {
      console.error("Failed to delete story:", error);
      setIsDeleting(false);
      setIsPaused(false);
    }
  };

  // Story Progress Animation
  useEffect(() => {
    if (loading || !currentStory) return;

    progressRef.current = 0;
    setProgress(0);
    lastTimeRef.current = performance.now();

    const hasValidMusic =
      currentStory.media.musicUrl && currentStory.media.musicUrl !== "none";

    const mediaDuration =
      currentStory.media.type === "image" &&
      hasValidMusic &&
      currentStory.media.musicDuration
        ? currentStory.media.musicDuration * 1000
        : 5000;

    const animate = (time: number) => {
      if (isPaused || isDrawerOpen || showDeleteConfirm) {
        lastTimeRef.current = time;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = time - (lastTimeRef.current || time);
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
  }, [
    currentIndex,
    loading,
    currentStory,
    isPaused,
    isDrawerOpen,
    showDeleteConfirm,
    handleNext,
  ]);

  // Audio / Video Setup
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (!currentStory || isPaused || isDrawerOpen || showDeleteConfirm) {
      videoRef.current?.pause();
      audioRef.current?.pause();
      return;
    }

    if (currentStory.media.type === "video") {
      videoRef.current?.play().catch(console.error);
    }

    const hasValidMusic =
      currentStory.media.musicUrl &&
      currentStory.media.musicUrl !== "none" &&
      currentStory.media.musicUrl.startsWith("http");

    if (hasValidMusic && audioRef.current) {
      audioRef.current.src = String(currentStory.media.musicUrl);
      audioRef.current.currentTime = currentStory.media.musicStartTime || 0;
      audioRef.current.muted = isMuted;
      audioRef.current.play().catch((e) => console.log("Audio skipped:", e));
    }
  }, [
    currentIndex,
    currentStory,
    isPaused,
    isMuted,
    isDrawerOpen,
    showDeleteConfirm,
  ]);

  // Audio Trimmer Loop Mechanism
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
  }, [currentStory]);

  useEffect(() => {
    if (isDrawerOpen && currentStory && isOwner) {
      const fetchViewers = async () => {
        setLoadingViewers(true);
        try {
          const { data } = await api.get(
            `/stories/${currentStory._id}/viewers`,
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
  }, [isDrawerOpen, currentStory, isOwner]);

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
    (currentStory.media.musicUrl && currentStory.media.musicUrl !== "none");

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
        <StoryProgressBar
          total={stories.length}
          currentIndex={currentIndex}
          progress={progress}
        />

        <StoryHeader
          avatar={currentStory.user.avatar}
          username={currentStory.user.username}
          timeText={getRelativeTime(currentStory.createdAt)}
          hasAudio={Boolean(hasAudio)}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
          onClose={onClose}
        />

        <StoryMedia
          media={currentStory.media}
          isMuted={isMuted}
          videoRef={videoRef}
          setIsPaused={setIsPaused}
          onPrev={handlePrev}
          onNext={handleNext}
        />

        <FloatingReactions
          reaction={currentStory.viewer?.reaction}
          liked={currentStory.viewer?.liked}
          storyId={currentStory._id}
        />

        {isOwner ? (
          <ViewersDrawer
            isOpen={isDrawerOpen}
            setIsOpen={setIsDrawerOpen}
            viewsCount={currentStory.viewsCount}
            viewers={viewers}
            loadingViewers={loadingViewers}
            onDelete={handleDeleteClick}
          />
        ) : (
          <StoryReplyBox
            targetUserId={currentStory.user._id}
            username={currentStory.user.username}
            storyId={currentStory._id}
            setIsPaused={setIsPaused}
            initialReaction={currentStory.viewer?.reaction}
            initialLiked={currentStory.viewer?.liked}
            onStateUpdate={(storyId, newReaction, newLiked) => {
              setStories((prev) =>
                prev.map((s) =>
                  s._id === storyId
                    ? {
                        ...s,
                        viewer: {
                          ...s.viewer,
                          reaction: newReaction,
                          liked: newLiked,
                        },
                      }
                    : s,
                ),
              );
            }}
          />
        )}

        {/* Custom Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-[280px] p-5 flex flex-col items-center text-center shadow-2xl">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <AlertCircle className="text-red-500" size={24} />
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">
                Delete Story?
              </h3>
              <p className="text-neutral-400 text-sm mb-6">
                This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-white font-medium hover:bg-neutral-700 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition flex justify-center items-center disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
