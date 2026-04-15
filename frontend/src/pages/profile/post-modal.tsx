import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { X, Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import type { IPost } from "../../types/user.types";
import type { IResponse } from "../../types/api.types";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";

interface CommentItem {
  _id: string;
  text: string;
  createdAt: string;
  author?: { _id: string; username: string; avatar?: string };
}

export const PostModal = ({
  post,
  onClose,
}: {
  post: IPost;
  onClose: () => void;
}) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const author = useMemo(
    () => (typeof post.author === "object" ? post.author : null),
    [post.author],
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const fetchComments = async () => {
      try {
        const { data } = await api.get<IResponse<CommentItem[]>>(
          `/comments/${post._id}`,
        );
        setComments(data.payload || []);
      } catch (error) {
        console.error("Failed to load comments", error);
      }
    };
    fetchComments();
    return () => {
      document.body.style.overflow = "";
    };
  }, [post._id]);

  const handleAddComment = async (event: FormEvent) => {
    event.preventDefault();
    const text = commentText.trim();
    if (!text || sending) return;

    const optimistic: CommentItem = {
      _id: `tmp_${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      author: user
        ? { _id: user._id, username: user.username, avatar: user.avatar }
        : undefined,
    };
    setCommentText("");
    setComments((prev) => [optimistic, ...prev]);
    setSending(true);
    try {
      const { data } = await api.post<IResponse<CommentItem>>(`/comments/${post._id}`, {
        text,
      });
      setComments((prev) =>
        prev.map((item) => (item._id === optimistic._id ? data.payload : item)),
      );
    } catch (error) {
      console.error("Failed to submit comment", error);
      setComments((prev) => prev.filter((item) => item._id !== optimistic._id));
    } finally {
      setSending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const previous = comments;
    setDeletingId(commentId);
    setComments((prev) => prev.filter((item) => item._id !== commentId));
    try {
      await api.delete(`/comments/${commentId}`);
    } catch (error) {
      console.error("Failed to delete comment", error);
      setComments(previous);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-8">
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
      <div className="relative bg-black w-full max-w-[1200px] h-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden rounded-sm shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="basis-0 md:basis-[60%] grow bg-black flex items-center justify-center relative border-r border-neutral-900">
          <img
            src={post.images[0]}
            className="w-full h-full object-contain"
            alt="post"
          />
        </div>

        <div className="basis-0 md:basis-[40%] md:max-w-[440px] grow flex flex-col bg-black min-w-0">
          <div className="h-16 px-4 border-b border-neutral-900 flex items-center gap-3 shrink-0">
            <img
              src={author?.avatar || "/default.png"}
              className="w-8 h-8 rounded-full"
              alt=""
            />
            <span className="font-bold text-sm hover:underline cursor-pointer">
              {author?.username}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar min-h-0">
            <div className="flex gap-3">
              <img
                src={author?.avatar || "/default.png"}
                className="w-8 h-8 rounded-full shrink-0"
                alt=""
              />
              <div className="text-sm">
                <span className="font-bold mr-2">{author?.username}</span>
                <span className="text-neutral-300 leading-relaxed">
                  {post.content}
                </span>
              </div>
            </div>

            {comments.map((comment) => (
              <div key={comment._id} className="flex gap-3">
                <img
                  src={comment.author?.avatar || "/default-avatar.png"}
                  className="w-8 h-8 rounded-full shrink-0"
                  alt=""
                />
                <div className="text-sm">
                  <span className="font-semibold mr-2">
                    {comment.author?.username || "user"}
                  </span>
                  <span className="text-neutral-300">{comment.text}</span>
                  {(comment.author?._id === user?._id ||
                    author?._id === user?._id) && (
                    <button
                      type="button"
                      disabled={deletingId === comment._id}
                      onClick={() => handleDeleteComment(comment._id)}
                      className="ml-2 text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      {deletingId === comment._id ? "..." : "Delete"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-neutral-900 space-y-3 shrink-0">
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

            <p className="font-bold text-sm">
              {(post.likesCount ?? post.likes ?? 0).toLocaleString()} likes
            </p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-tight">
              2 Hours Ago
            </p>
          </div>

          <form
            className="h-16 px-4 border-t border-neutral-900 flex items-center gap-3 shrink-0"
            onSubmit={handleAddComment}
          >
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="bg-transparent text-sm w-full outline-none focus:ring-0"
            />
            <button
              disabled={!commentText.trim() || sending}
              className="text-blue-500 font-bold text-sm disabled:opacity-50"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
