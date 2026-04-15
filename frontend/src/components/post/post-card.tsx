import { Link } from "react-router-dom";
import type { IPost, IUser } from "../../types/user.types";

interface PostCardProps {
  post: IPost;
}

export default function PostCard({ post }: PostCardProps) {
  const author =
    typeof post.author === "object" ? (post.author as IUser) : null;

  return (
    <article className="w-full max-w-[470px] mx-auto bg-black text-white border-b border-neutral-800 pb-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <Link
          to={`/profile/${author?._id}`}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700">
            {author?.avatar ? (
              <img
                src={author.avatar}
                alt="avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-neutral-700" />
            )}
          </div>
          <span className="font-semibold text-sm hover:text-neutral-300 transition-colors">
            {author?.username || "unknown_user"}
          </span>
        </Link>
        <button className="text-neutral-400 hover:text-white p-2">
          {/* Options Icon (...) */}
          <svg
            aria-label="More options"
            fill="currentColor"
            height="24"
            role="img"
            viewBox="0 0 24 24"
            width="24"
          >
            <circle cx="12" cy="12" r="1.5"></circle>
            <circle cx="6" cy="12" r="1.5"></circle>
            <circle cx="18" cy="12" r="1.5"></circle>
          </svg>
        </button>
      </div>

      {/* Media (Images) */}
      <div className="w-full bg-neutral-900 border border-neutral-800 rounded-sm overflow-hidden aspect-square flex items-center justify-center">
        {post.images && post.images.length > 0 ? (
          <img
            src={post.images[0]}
            alt="Post content"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-neutral-500">No Image</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between px-3 py-2 mt-1">
        <div className="flex items-center gap-4">
          <button className="hover:opacity-60 transition-opacity">
            {/* Heart Icon */}
            <svg
              aria-label="Like"
              fill="currentColor"
              height="24"
              role="img"
              viewBox="0 0 24 24"
              width="24"
            >
              <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.297-2.163-1.51-4.324-3.722C5.188 14.161 2.5 12.28 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.543 1.117 1.543s.277-.368 1.116-1.543a4.21 4.21 0 0 1 3.676-1.941v.001ZM3.423 9.122c0 2.4 2.158 4.095 4.542 6.223 1.93 1.728 3.518 2.915 4.035 3.267.518-.351 2.106-1.54 4.036-3.268 2.383-2.127 4.542-3.822 4.542-6.222a3.99 3.99 0 0 0-3.766-4.17 3.25 3.25 0 0 0-2.844 1.48c-.628.88-1.042 1.52-1.96 1.52-.919 0-1.332-.64-1.961-1.52a3.25 3.25 0 0 0-2.844-1.48 3.99 3.99 0 0 0-3.766 4.17Z"></path>
            </svg>
          </button>
          <button className="hover:opacity-60 transition-opacity">
            {/* Comment Icon */}
            <svg
              aria-label="Comment"
              fill="currentColor"
              height="24"
              role="img"
              viewBox="0 0 24 24"
              width="24"
            >
              <path
                d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
                fill="none"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="2"
              ></path>
            </svg>
          </button>
          <button className="hover:opacity-60 transition-opacity">
            {/* Share Icon */}
            <svg
              aria-label="Share Post"
              fill="currentColor"
              height="24"
              role="img"
              viewBox="0 0 24 24"
              width="24"
            >
              <line
                fill="none"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="2"
                x1="22"
                x2="9.218"
                y1="3"
                y2="10.083"
              ></line>
              <polygon
                fill="none"
                points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"
                stroke="currentColor"
                strokeLinejoin="round"
                strokeWidth="2"
              ></polygon>
            </svg>
          </button>
        </div>
        <button className="hover:opacity-60 transition-opacity">
          {/* Save Icon */}
          <svg
            aria-label="Save"
            fill="currentColor"
            height="24"
            role="img"
            viewBox="0 0 24 24"
            width="24"
          >
            <polygon
              fill="none"
              points="20 21 12 13.44 4 21 4 3 20 3 20 21"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            ></polygon>
          </svg>
        </button>
      </div>

      {/* Info */}
      <div className="px-3 text-sm">
        <span className="font-semibold block mb-1">{post.likes} likes</span>
        <div className="space-x-1">
          <span className="font-semibold">{author?.username}</span>
          <span>{post.content}</span>
        </div>
        {post.comments > 0 && (
          <button className="text-neutral-500 mt-1 hover:text-neutral-400">
            View all {post.comments} comments
          </button>
        )}
      </div>
    </article>
  );
}
