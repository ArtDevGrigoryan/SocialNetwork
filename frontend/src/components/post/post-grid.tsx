import { Heart, MessageCircle, Music, Repeat, Copy } from "lucide-react";
import type { IPost } from "../../types/user.types";

interface FeedPost extends IPost {
  isReposted?: boolean;
  likesCount?: number;
  commentsCount?: number;
}

interface PostGridProps {
  posts: FeedPost[];
  onPostClick: (post: FeedPost) => void;
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
    <div className="grid grid-cols-3 gap-[1px] px-0">
      {posts.map((post) => {
        // SAFEGUARD: Եթե post-ի data-ն վնասված է, բաց ենք թողնում որ չտրաքի
        if (!post || !post.images || post.images.length === 0) return null;

        return (
          <div
            key={post._id}
            onClick={() => onPostClick(post)}
            className="relative aspect-square cursor-pointer group bg-neutral-900 overflow-hidden rounded-sm transition-all active:scale-95"
          >
            <img
              src={post.images[0]?.url || (post.images[0] as unknown as string)}
              alt="post thumbnail"
              style={{
                filter:
                  post.images[0]?.filter !== "none"
                    ? post.images[0]?.filter
                    : undefined,
              }}
              className="w-full h-full object-cover"
            />

            <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
              {post.isReposted && (
                <Repeat size={16} className="text-white drop-shadow-md" />
              )}
              {post.images?.length > 1 && (
                <Copy size={16} className="text-white drop-shadow-md" />
              )}
              {post.music?.url && (
                <Music size={16} className="text-white drop-shadow-md" />
              )}
            </div>

            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 md:gap-8 z-20">
              <div className="flex items-center text-white font-bold gap-2">
                <Heart fill="white" size={22} />
                <span>{post.likesCount ?? post.likes ?? 0}</span>
              </div>
              <div className="flex items-center text-white font-bold gap-2">
                <MessageCircle fill="white" size={22} />
                <span>{post.commentsCount ?? post.comments ?? 0}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PostGrid;
