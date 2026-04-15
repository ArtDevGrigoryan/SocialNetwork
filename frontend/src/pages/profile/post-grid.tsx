import { Heart, MessageCircle } from "lucide-react";
import type { IPost } from "../../types/user.types";

interface PostGridProps {
  posts: IPost[];
  onPostClick: (post: IPost) => void;
}

export const PostGrid = ({ posts, onPostClick }: PostGridProps) => {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
        <div className="p-4 border-2 border-neutral-700 rounded-full mb-4 text-neutral-700">
          <Heart size={48} strokeWidth={1} />
        </div>
        <p className="text-xl font-bold">No Posts Yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2 lg:gap-4 px-1 md:px-0">
      {posts.map((post) => (
        <div
          key={post._id}
          onClick={() => onPostClick(post)}
          className="relative aspect-square cursor-pointer group bg-neutral-900 overflow-hidden rounded-sm transition-all active:scale-95"
        >
          <img
            src={post.images[0]}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Instagram style overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 md:gap-8">
            <div className="flex items-center text-white font-bold gap-2">
              <Heart fill="white" size={22} />
              <span>{post.likesCount || 0}</span>
            </div>
            <div className="flex items-center text-white font-bold gap-2">
              <MessageCircle fill="white" size={22} />
              <span>{post.commentsCount || 0}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostGrid;
