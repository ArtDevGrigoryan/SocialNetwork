import { X, Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import type { IPost } from "../../types/user.types";

export const PostModal = ({
  post,
  onClose,
}: {
  post: IPost;
  onClose: () => void;
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white z-[110] hover:scale-110 transition"
      >
        <X size={30} />
      </button>

      {/* Modal Container */}
      <div className="relative bg-black w-full max-w-6xl h-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden rounded-sm shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Left Side: Image */}
        <div className="flex-[1.5] bg-neutral-950 flex items-center justify-center relative border-r border-neutral-900">
          <img
            src={post.images[0]}
            className="w-full h-full object-contain"
            alt="post"
          />
        </div>

        {/* Right Side: Details */}
        <div className="flex-1 flex flex-col bg-black min-w-[350px]">
          {/* Header */}
          <div className="p-4 border-b border-neutral-900 flex items-center gap-3">
            <img
              src={post.author?.avatar || "/default.png"}
              className="w-8 h-8 rounded-full"
              alt=""
            />
            <span className="font-bold text-sm hover:underline cursor-pointer">
              {post.author?.username}
            </span>
          </div>

          {/* Comments Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <div className="flex gap-3">
              <img
                src={post.author?.avatar || "/default.png"}
                className="w-8 h-8 rounded-full shrink-0"
                alt=""
              />
              <div className="text-sm">
                <span className="font-bold mr-2">{post.author?.username}</span>
                <span className="text-neutral-300 leading-relaxed">
                  {post.content}
                </span>
              </div>
            </div>
            {/* Այստեղ կավելացնես քո comments.map-ը */}
          </div>

          {/* Actions & Input */}
          <div className="p-4 border-t border-neutral-900 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Heart
                  size={26}
                  className="hover:text-neutral-500 cursor-pointer transition"
                />
                <MessageCircle
                  size={26}
                  className="hover:text-neutral-500 cursor-pointer transition"
                />
                <Send
                  size={26}
                  className="hover:text-neutral-500 cursor-pointer transition"
                />
              </div>
              <Bookmark
                size={26}
                className="hover:text-neutral-500 cursor-pointer transition"
              />
            </div>

            <p className="font-bold text-sm">{post.likesCount || 0} likes</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-tight">
              2 Hours Ago
            </p>
          </div>

          {/* Comment Input */}
          <div className="p-4 border-t border-neutral-900 flex items-center gap-3">
            <input
              type="text"
              placeholder="Add a comment..."
              className="bg-transparent text-sm w-full outline-none focus:ring-0"
            />
            <button className="text-blue-500 font-bold text-sm disabled:opacity-50">
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
