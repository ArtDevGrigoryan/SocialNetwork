import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Repeat,
  Send,
  Bookmark,
  MoreHorizontal,
  ArchiveRestore,
  Trash2,
  ShieldOff,
  ShieldCheck,
  Volume2,
  VolumeX,
  Music,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "../../lib/utils";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import { useMusicStore } from "../../store/music.setting.store";
import type { IPost, IUser } from "../../types/user.types";
import CommentModal from "./comment-modal";
import LikesModal from "./likes-modal";
import ShareModal from "./share-modal";
import { AnimatedHeart } from "./animated-hearth";

interface MobilePostDetailProps {
  post: IPost & {
    isLiked?: boolean;
    isSaved?: boolean;
    isReposted?: boolean;
    likesCount?: number;
    commentsCount?: number;
  };
}

export const MobilePostDetail = ({
  post: initialPost,
}: MobilePostDetailProps) => {
  const { user: currentUser } = useAuthStore();
  const { isMuted, toggleMute, activePostId, setActivePost } = useMusicStore();
  const [post, _] = useState(initialPost);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const author =
    typeof post.author === "object" ? (post.author as IUser) : null;
  const isOwner = currentUser?._id === author?._id;

  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  const [isReposted, setIsReposted] = useState(Boolean(post.isReposted));
  const [likesCount, setLikesCount] = useState(
    post.likesCount ?? post.likes ?? 0,
  );
  const [commentsCount, setCommentsCount] = useState(
    post.commentsCount ?? post.comments ?? 0,
  );
  const [accessRepost, setAccessRepost] = useState(post.accessRepost ?? true);

  const [showMenu, setShowMenu] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);
  const [isArchived, setIsArchived] = useState(Boolean(post.isArchived));

  const [floatingHearts, setFloatingHearts] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLongPressTriggered, setIsLongPressTriggered] = useState(false);

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

  const handleLikeClick = async () => {
    if (isLongPressTriggered) return;

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => prev + (nextLiked ? 1 : -1));
    try {
      await api.patch(`/posts/${post._id}/like`);
    } catch {
      toast.error("Failed to like");
      setIsLiked(!nextLiked);
      setLikesCount((prev) => prev + (!nextLiked ? 1 : -1));
    }
  };

  const lastTap = useRef<number>(0);

  const handleImageTap = async (e: React.MouseEvent<HTMLDivElement>) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setFloatingHearts((prev) => [...prev, { id, x, y }]);

      if (!isLiked) {
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);
        try {
          await api.patch(`/posts/${post._id}/like`);
        } catch {
          setIsLiked(false);
          setLikesCount((prev) => prev - 1);
          toast.error("Failed to like the post");
        }
      }
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActivePost(post._id);
          }
        });
      },
      { threshold: 0.6 },
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [post._id, setActivePost]);

  // Կառավարում ենք երգը ըստ activePostId-ի
  useEffect(() => {
    if (!audioRef.current || !post.music?.url) return;
    audioRef.current.muted = isMuted;

    if (activePostId === post._id) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [activePostId, post._id, isMuted, post.music]);

  const handleSave = async () => {
    const next = !isSaved;
    setIsSaved(next);
    try {
      if (next) await api.post(`/saves/${post._id}`);
      else await api.delete(`/saves/${post._id}`);
    } catch {
      toast.error("Failed to save");
      setIsSaved(!next);
    }
  };

  const handleRepost = async () => {
    if (!accessRepost) {
      toast.error("Reposting is disabled by the author");
      return;
    }
    const previous = isReposted;
    setIsReposted(!previous);
    try {
      const { data } = await api.post(`/reposts/${post._id}`);
      toast.success(
        data.payload.action === "created" ? "Post reposted" : "Repost removed",
      );
    } catch {
      toast.error("Failed to repost");
      setIsReposted(previous);
    }
  };

  const toggleAccessRepost = async () => {
    try {
      await api.patch(`/posts/${post._id}/repost-access`);
      setAccessRepost(!accessRepost);
      toast.success(`Reposting ${!accessRepost ? "enabled" : "disabled"}`);
      setShowMenu(false);
    } catch {
      toast.error("Failed to update access");
    }
  };

  const handleArchive = async () => {
    try {
      await api.patch(`/posts/${post._id}/archive`);
      setIsArchived(true);
      toast.success("Post archived");
    } catch {
      toast.error("Failed to archive");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post._id}`);
      setIsDeleted(true);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  if (isDeleted || isArchived) return null;

  const caption = post.content || "";
  const visibleCaption =
    caption.length > 60 && !expandedCaption
      ? `${caption.slice(0, 60)}...`
      : caption;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[100dvh] snap-start snap-always bg-black flex-shrink-0 overflow-hidden group"
    >
      {post.music?.url && <audio ref={audioRef} src={post.music.url} loop />}

      <div
        className="absolute inset-0 w-full h-full cursor-pointer overflow-hidden"
        onClick={handleImageTap}
      >
        <img
          src={post.images[0]?.url || (post.images[0] as unknown as string)}
          style={{
            filter:
              post.images[0]?.filter !== "none"
                ? post.images[0]?.filter
                : undefined,
          }}
          className="w-full h-full object-cover"
          alt="post media"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

        {floatingHearts.map((heart) => (
          <AnimatedHeart
            key={heart.id}
            x={heart.x}
            y={heart.y}
            onComplete={() =>
              setFloatingHearts((prev) => prev.filter((h) => h.id !== heart.id))
            }
          />
        ))}
      </div>

      {showMenu && isOwner && (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={() => setShowMenu(false)}
        >
          <div
            className="w-full bg-[#262626] rounded-t-3xl p-4 flex flex-col pb-8 animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-neutral-600 rounded-full mx-auto mb-4" />
            <button
              onClick={toggleAccessRepost}
              className="w-full text-left p-4 text-white hover:bg-white/10 rounded-xl font-semibold flex items-center gap-3 transition"
            >
              {accessRepost ? (
                <ShieldOff size={22} />
              ) : (
                <ShieldCheck size={22} />
              )}
              {accessRepost ? "Disable Reposting" : "Enable Reposting"}
            </button>
            <button
              onClick={handleArchive}
              className="w-full text-left p-4 text-white hover:bg-white/10 rounded-xl font-semibold flex items-center gap-3 transition"
            >
              <ArchiveRestore size={22} /> Archive
            </button>
            <button
              onClick={handleDelete}
              className="w-full text-left p-4 text-red-500 hover:bg-white/10 rounded-xl font-semibold flex items-center gap-3 transition"
            >
              <Trash2 size={22} /> Delete
            </button>
          </div>
        </div>
      )}

      <div className="absolute right-3 bottom-24 flex flex-col items-center gap-6 z-20">
        <div className="flex flex-col items-center gap-1">
          <button
            onMouseDown={handleLikeTouchStart}
            onMouseUp={handleLikeTouchEnd}
            onMouseLeave={handleLikeTouchEnd}
            onTouchStart={handleLikeTouchStart}
            onTouchEnd={handleLikeTouchEnd}
            onClick={handleLikeClick}
            className="active:scale-90 transition-transform"
          >
            <Heart
              size={34}
              strokeWidth={2}
              className={cn(
                isLiked
                  ? "text-red-500 fill-red-500"
                  : "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
              )}
            />
          </button>
          <span
            onClick={() => setIsLikesModalOpen(true)}
            className="text-white text-xs font-semibold drop-shadow-md cursor-pointer hover:underline"
          >
            {likesCount}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={() => setIsCommentModalOpen(true)}
            className="active:scale-90 transition-transform"
          >
            <MessageCircle
              size={34}
              strokeWidth={2}
              className="text-white fill-white/20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            />
          </button>
          <span className="text-white text-xs font-semibold drop-shadow-md">
            {commentsCount}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleRepost}
            disabled={!accessRepost}
            className="active:scale-90 transition-transform disabled:opacity-50"
          >
            <Repeat
              size={34}
              strokeWidth={2}
              className={cn(
                isReposted
                  ? "text-green-500"
                  : "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
              )}
            />
          </button>
          <span className="text-white text-xs font-semibold drop-shadow-md">
            Repost
          </span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <button
            onClick={handleSave}
            className="active:scale-90 transition-transform"
          >
            <Bookmark
              size={34}
              strokeWidth={2}
              className={cn(
                isSaved
                  ? "fill-white text-white"
                  : "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]",
              )}
            />
          </button>
        </div>

        <button
          onClick={() => setIsShareModalOpen(true)}
          className="active:scale-90 transition-transform"
        >
          <Send
            size={34}
            strokeWidth={2}
            className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          />
        </button>

        {isOwner && (
          <button
            onClick={() => setShowMenu(true)}
            className="active:scale-90 transition-transform mt-2"
          >
            <MoreHorizontal
              size={28}
              className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            />
          </button>
        )}
      </div>

      <div className="absolute left-4 bottom-8 right-20 z-20 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Link
            to={`/profile/${author?._id}`}
            className="w-10 h-10 rounded-full border-[1.5px] border-white overflow-hidden shadow-lg flex-shrink-0"
          >
            <img
              src={author?.avatar || "/default-avatar.png"}
              className="w-full h-full object-cover"
              alt="avatar"
            />
          </Link>
          <Link
            to={`/profile/${author?._id}`}
            className="text-white font-bold text-[16px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] hover:opacity-80"
          >
            {author?.username}
          </Link>
          {!isOwner && (
            <button className="border border-white text-white text-xs font-bold px-3 py-1 rounded-md backdrop-blur-sm active:scale-95 transition-transform">
              Follow
            </button>
          )}
        </div>

        {caption && (
          <div className="text-white text-[14px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-medium leading-tight max-w-[90%]">
            <span>{visibleCaption}</span>
            {caption.length > 60 && !expandedCaption && (
              <button
                onClick={() => setExpandedCaption(true)}
                className="text-neutral-300 ml-1 font-bold hover:text-white"
              >
                more
              </button>
            )}
          </div>
        )}

        {post.music?.title && (
          <div className="flex items-center gap-2 mt-1 bg-black/20 rounded-full pl-2 pr-4 py-1 w-max backdrop-blur-sm border border-white/10">
            <Music size={14} className="text-white" />
            <div className="overflow-hidden whitespace-nowrap w-40">
              <span className="text-white text-xs font-medium inline-block animate-[marquee_5s_linear_infinite]">
                {post.music.title} • Original Audio
              </span>
            </div>
          </div>
        )}
      </div>

      {post.music && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="absolute top-6 right-4 p-2 rounded-full bg-black/30 border border-white/20 backdrop-blur-md z-20"
        >
          {isMuted ? (
            <VolumeX size={18} className="text-white" />
          ) : (
            <Volume2 size={18} className="text-white" />
          )}
        </button>
      )}

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
        entityId={post._id}
        type="post"
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
};
