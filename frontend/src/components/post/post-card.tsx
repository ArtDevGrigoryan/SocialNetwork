import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { api } from "../../lib/axios.config";
import type { IPost, IUser } from "../../types/user.types";
import CommentModal from "./comment-modal";

interface FeedPost extends IPost {
  isLiked?: boolean;
  isSaved?: boolean;
  likesCount?: number;
  commentsCount?: number;
}

export default function PostCard({ post }: { post: FeedPost }) {
  const author = useMemo(
    () => (typeof post.author === "object" ? (post.author as IUser) : null),
    [post.author],
  );
  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
  const [isSaved, setIsSaved] = useState(Boolean(post.isSaved));
  const [likesCount, setLikesCount] = useState(post.likesCount ?? post.likes ?? 0);
  const [commentsCount, setCommentsCount] = useState(
    post.commentsCount ?? post.comments ?? 0,
  );
  const [animateLike, setAnimateLike] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [expandedCaption, setExpandedCaption] = useState(false);
  const caption = post.content || "";
  const shouldTruncateCaption = caption.length > 110;
  const visibleCaption =
    shouldTruncateCaption && !expandedCaption
      ? `${caption.slice(0, 110)}...`
      : caption;

  const handleLike = async () => {
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
      console.error("Like request failed", error);
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
      } else {
        await api.delete(`/saves/${post._id}`);
      }
    } catch (error) {
      console.error("Save request failed", error);
      setIsSaved(previous);
    }
  };

  return (
    <div className="w-full max-w-[470px] mx-auto border-b border-neutral-800 bg-black pb-6 mb-4">
      <div className="flex items-center justify-between py-3 px-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1.5px]">
            <img
              src={author?.avatar || "/default-avatar.png"}
              className="w-full h-full rounded-full object-cover border border-black"
              loading="lazy"
            />
          </div>
          <Link
            to={`/profile/${author?._id}`}
            className="text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            {author?.username || "user"}
          </Link>
        </div>
        <MoreHorizontal size={18} className="text-neutral-400 cursor-pointer" />
      </div>

      <div
        className="relative w-full aspect-square bg-neutral-900 rounded-md overflow-hidden select-none"
        onDoubleClick={handleLike}
      >
        <img
          src={post.images[0]}
          className="w-full h-full object-cover"
          loading="lazy"
          alt="Post media"
        />
        {animateLike && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              size={86}
              className="text-white fill-white opacity-90 animate-in zoom-in-50 fade-in duration-300"
            />
          </div>
        )}
      </div>

      <div className="pt-3 px-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart
              onClick={handleLike}
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
            <Send
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

        <p className="text-xs text-neutral-400 uppercase tracking-wide">Just now</p>

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
    </div>
  );
}
