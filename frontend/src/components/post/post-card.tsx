// ./components/post/post-card.tsx
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

export default function PostCard({ post }: any) {
  const [isLiked, setIsLiked] = useState(false); // Should come from API/Initial state
  const [animateLike, setAnimateLike] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setAnimateLike(true);
    setTimeout(() => setAnimateLike(false), 1000);
    // Call API here without refreshing
  };

  return (
    <div className="w-full max-w-[470px] mx-auto border-b border-neutral-900 pb-6 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between py-3 px-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-purple-600 p-[1.5px]">
            <img
              src={post.author?.avatar}
              className="w-full h-full rounded-full object-cover border border-black"
            />
          </div>
          <span className="text-sm font-semibold">{post.author?.username}</span>
        </div>
        <MoreHorizontal size={18} className="text-neutral-400 cursor-pointer" />
      </div>

      {/* Media */}
      <div
        className="relative aspect-square bg-neutral-900 rounded-md overflow-hidden"
        onDoubleClick={handleLike}
      >
        <img src={post.images[0]} className="w-full h-full object-cover" />
        {animateLike && (
          <div className="absolute inset-0 flex items-center justify-center animate-ping">
            <Heart size={80} className="text-white fill-white opacity-80" />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-3 px-1 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Heart
              onClick={handleLike}
              className={cn(
                "cursor-pointer transition-all active:scale-125",
                isLiked
                  ? "text-red-500 fill-red-500"
                  : "hover:text-neutral-500",
              )}
              size={24}
            />
            <MessageCircle
              size={24}
              className="hover:text-neutral-500 cursor-pointer"
            />
            <Send size={24} className="hover:text-neutral-500 cursor-pointer" />
          </div>
          <Bookmark
            size={24}
            className="hover:text-neutral-500 cursor-pointer"
          />
        </div>

        <div className="text-sm font-semibold">
          {post.likesCount || 0} likes
        </div>

        <div className="text-sm leading-relaxed">
          <span className="font-semibold mr-2">{post.author?.username}</span>
          <span className="text-neutral-300">{post.content}</span>
        </div>

        <button className="text-neutral-500 text-sm hover:underline p-0">
          View all {post.commentsCount} comments
        </button>
      </div>
    </div>
  );
}
