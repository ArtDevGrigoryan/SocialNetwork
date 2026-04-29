import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Volume2,
  VolumeX,
  Repeat,
  ArchiveRestore,
} from "lucide-react";
import { useMemo, useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { cn } from "../../lib/utils";
import { api } from "../../lib/axios.config";
import type { IPost, IUser } from "../../types/user.types";
import CommentModal from "./comment-modal";
import { useAuthStore } from "../../store/auth.store";
import { useMusicStore } from "../../store/music.setting.store";
import ShareModal from "./share-modal";
import LikesModal from "./likes-modal";

interface FeedPost extends IPost {
  isLiked?: boolean;
  isSaved?: boolean;
  isReposted?: boolean;
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
}

export default function PostCard({
  post,
  isModalOpen = false,
  onClick,
}: {
  onClick?: (index: number) => void;
  post: FeedPost;
  isModalOpen?: boolean;
}) {
  const { user } = useAuthStore();
  const { isMuted, toggleMute, activePostId, setActivePost } = useMusicStore();
  const author = useMemo(
    () => (typeof post.author === "object" ? (post.author as IUser) : null),
    [post.author],
  );

  const cardRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isLiked, setIsLiked] = useState<boolean>(Boolean(post.isLiked));
  const [isSaved, setIsSaved] = useState<boolean>(Boolean(post.isSaved));
  const [isReposted, setIsReposted] = useState<boolean>(
    Boolean(post.isReposted),
  );
  const [openShareModal, setOpenShareModal] = useState<boolean>(false);
  const [likesCount, setLikesCount] = useState(
    post.likesCount ?? post.likes ?? 0,
  );
  const [commentsCount, setCommentsCount] = useState(
    post.commentsCount ?? post.comments ?? 0,
  );

  const [animateLike, setAnimateLike] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isArchived, setIsArchived] = useState(Boolean(post.isArchived));
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [isLongPressTriggered, setIsLongPressTriggered] = useState(false);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (audioRef.current && post.music?.startTime) {
      audioRef.current.currentTime = post.music.startTime;
    }
  }, [post.music]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isModalOpen) {
            setActivePost(post._id);
          }
        });
      },
      { threshold: 0.6 },
    );

    if (cardRef.current) observer.observe(cardRef.current);

    return () => observer.disconnect();
  }, [post._id, isModalOpen, setActivePost]);

  useEffect(() => {
    if (!audioRef.current || !post.music?.url) return;
    audioRef.current.muted = isMuted;

    if (activePostId === post._id && !isModalOpen) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [activePostId, post._id, isMuted, post.music, isModalOpen]);

  const caption = post.content || "";
  const shouldTruncateCaption = caption.length > 110;
  const visibleCaption =
    shouldTruncateCaption && !expandedCaption
      ? `${caption.slice(0, 110)}...`
      : caption;

  const currentImageObj =
    typeof post.images[currentMediaIndex] === "object"
      ? post.images[currentMediaIndex]
      : { url: post.images[currentMediaIndex], filter: "none" };

  const imageUrl = currentImageObj?.url;
  const imageFilter = currentImageObj?.filter || "none";
  const hasMultipleImages = post.images.length > 1;
  const isOwner = user?._id === author?._id;

  const handleLike = async () => {
    if (isLongPressTriggered) return;

    const previousLiked = isLiked;
    const previousLikesCount = likesCount;
    const nextLiked = !previousLiked;

    setIsLiked(nextLiked);
    setLikesCount((value) => value + (nextLiked ? 1 : -1));
    setAnimateLike(true);
    window.setTimeout(() => setAnimateLike(false), 750);

    try {
      await api.patch(`/posts/${post._id}/like`);
    } catch (error) {
      toast.error("Failed to like the post");
      setIsLiked(previousLiked);
      setLikesCount(previousLikesCount);
    }
  };

  const handleSave = async () => {
    const previous = isSaved;
    const next = !previous;
    setIsSaved(next);
    try {
      if (next) {
        await api.post(`/saves/${post._id}`);
        toast.success("Saved to collections");
      } else {
        await api.delete(`/saves/${post._id}`);
        toast.success("Removed from collections");
      }
    } catch (error) {
      toast.error("Action failed");
      setIsSaved(previous);
    }
  };

  const handleRepost = async () => {
    if (!post.accessRepost) {
      toast.error("Reposting is disabled for this post");
      return;
    }
    const previous = isReposted;
    setIsReposted(!previous);
    try {
      const { data } = await api.post(`/reposts/${post._id}`);
      if (data.payload.action === "created") {
        toast.success("Post reposted");
      } else {
        toast.success("Repost removed");
      }
    } catch (error) {
      toast.error("Failed to repost");
      setIsReposted(previous);
    }
  };

  const handleArchive = async () => {
    try {
      await api.patch(`/posts/${post._id}/archive`);
      setIsArchived(true);
      toast.success("Post archived");
      setShowMenu(false);
    } catch (error) {
      toast.error("Failed to archive post");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success("Post deleted successfully");
      setIsDeleted(true);
    } catch (error) {
      toast.error("Failed to delete post");
    }
  };
  const handleLikeTouchStart = () => {
    setIsLongPressTriggered(false);
    longPressTimer.current = setTimeout(() => {
      setIsLongPressTriggered(true);
      setIsLikesModalOpen(true);
    }, 500);
  };

  const handleLikeTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };
  if (isDeleted || isArchived) return null;

  return (
    <div
      ref={cardRef}
      className="w-full sm:max-w-[470px] mx-auto border-b sm:border-b-0 border-neutral-800 bg-black pb-6 mb-4"
    >
      {post.music?.url && <audio ref={audioRef} src={post.music.url} loop />}

      <div className="flex items-center justify-between py-3 px-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1.5px]">
            <img
              src={author?.avatar || "/default-avatar.png"}
              className="w-full h-full rounded-full object-cover border border-black"
              loading="lazy"
              alt="Avatar"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <Link
              to={`/profile/${author?._id}`}
              className="text-sm font-semibold hover:opacity-80 transition-opacity"
            >
              {author?.username || "user"}
            </Link>
            {post.music?.title && (
              <span className="text-[10px] text-neutral-400 truncate max-w-[150px]">
                ♫ {post.music.title}
              </span>
            )}
          </div>
        </div>

        <div className="relative">
          <MoreHorizontal
            size={18}
            className="text-neutral-400 cursor-pointer hover:text-white transition"
            onClick={() => setShowMenu(!showMenu)}
          />
          {showMenu && isOwner && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-6 w-40 bg-[#262626] border border-neutral-800 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={handleArchive}
                  className="w-full text-left px-4 py-3 text-sm text-white hover:bg-neutral-800 font-bold flex items-center gap-2 transition"
                >
                  <ArchiveRestore size={16} /> Archive
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-neutral-800 font-bold flex items-center gap-2 transition"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div
        className="relative w-full aspect-square bg-neutral-900 sm:rounded-md overflow-hidden select-none group"
        onDoubleClick={handleLike}
      >
        <img
          onClick={() => onClick?.(currentMediaIndex)}
          src={imageUrl}
          style={{ filter: imageFilter !== "none" ? imageFilter : undefined }}
          className="w-full h-full object-cover transition-transform duration-300"
          loading="lazy"
          alt="Post media"
        />

        {hasMultipleImages && (
          <>
            {currentMediaIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex((prev) => prev - 1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            {currentMediaIndex < post.images.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex((prev) => prev + 1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={20} />
              </button>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {post.images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentMediaIndex
                      ? "w-1.5 bg-[#0095f6]"
                      : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {animateLike && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              size={86}
              className="text-white fill-white opacity-90 animate-in zoom-in-50 fade-in duration-300 z-20"
            />
          </div>
        )}

        {post.music && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="absolute bottom-3 right-3 bg-black/60 p-2 rounded-full text-white z-20 hover:scale-110 transition-transform backdrop-blur-sm"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}
      </div>

      <div className="pt-3 px-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart
              onClick={handleLike}
              onMouseDown={handleLikeTouchStart}
              onMouseUp={handleLikeTouchEnd}
              onMouseLeave={handleLikeTouchEnd}
              onTouchStart={handleLikeTouchStart}
              onTouchEnd={handleLikeTouchEnd}
              className={cn(
                "cursor-pointer transition-all duration-200 active:scale-125",
                isLiked
                  ? "text-red-500 fill-red-500"
                  : "hover:text-neutral-500",
              )}
              size={24}
              strokeWidth={1.75}
            />
            <MessageCircle
              onClick={() => setIsCommentModalOpen(true)}
              size={24}
              className="hover:text-neutral-500 cursor-pointer"
              strokeWidth={1.75}
            />
            <Repeat
              onClick={handleRepost}
              size={24}
              className={cn(
                "cursor-pointer transition-all active:scale-125 hover:text-neutral-500",
                isReposted ? "text-green-500" : "text-white",
              )}
              strokeWidth={1.75}
            />
            <Send
              onClick={() => setOpenShareModal(true)}
              size={24}
              className="hover:text-neutral-500 cursor-pointer"
              strokeWidth={1.75}
            />
          </div>
          <Bookmark
            onClick={handleSave}
            size={24}
            className={cn(
              "hover:text-neutral-500 cursor-pointer transition-colors",
              isSaved && "fill-white text-white",
            )}
            strokeWidth={1.75}
          />
        </div>
        <div className="text-sm font-semibold">
          {likesCount.toLocaleString()} likes
        </div>
        <div className="text-sm leading-relaxed">
          <span className="font-semibold mr-2">{author?.username}</span>
          <span className="text-white">{visibleCaption}</span>
          {shouldTruncateCaption && !expandedCaption && (
            <button
              type="button"
              onClick={() => setExpandedCaption(true)}
              className="ml-1 text-neutral-400 hover:text-neutral-300"
            >
              more
            </button>
          )}
        </div>
        <p className="text-xs text-neutral-400 uppercase tracking-wide">
          {new Date(post.createdAt || Date.now()).toLocaleDateString()}
        </p>
        <button
          onClick={() => setIsCommentModalOpen(true)}
          className="text-neutral-500 text-sm hover:underline p-0"
        >
          View all {commentsCount} comments
        </button>
      </div>
      <CommentModal
        post={post}
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        onCommentsCountChange={setCommentsCount}
      />
      <LikesModal
        postId={post._id}
        isOpen={isLikesModalOpen}
        onClose={() => setIsLikesModalOpen(false)}
      />
      <ShareModal
        isOpen={openShareModal}
        entityId={post._id}
        type="post"
        onClose={() => setOpenShareModal(false)}
      />
    </div>
  );
}
