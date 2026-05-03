import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import { useSocketStore } from "../../store/socket.store";
import { useShallow } from "zustand/react/shallow";
import type { IPost, IUser } from "../../types/user.types";
import toast from "react-hot-toast";
import { X } from "lucide-react";

export interface IComment {
  _id: string;
  text: string;
  author: IUser;
  createdAt: string;
}

interface CommentModalProps {
  post: IPost;
  isOpen: boolean;
  onClose: () => void;
  onCommentsCountChange?: (nextCount: number) => void;
}

export default function CommentModal({
  post,
  isOpen,
  onClose,
  onCommentsCountChange,
}: CommentModalProps) {
  const currentUser = useAuthStore((state) => state.user);
  const { socket, joinPost, leavePost } = useSocketStore(
    useShallow((state) => ({
      socket: state.socket,
      joinPost: state.joinPost,
      leavePost: state.leavePost,
    })),
  );
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetchComments();
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, post._id]);

  useEffect(() => {
    if (!isOpen || !socket) return;

    joinPost(post._id);
    const handleIncomingComment = (comment: IComment & { postId?: string }) => {
      if (comment.postId && comment.postId !== post._id) return;
      setComments((prev) => {
        const duplicateIndex = prev.findIndex(
          (item) =>
            item._id === comment._id ||
            (item._id.startsWith("temp_") &&
              item.text === comment.text &&
              item.author?._id === comment.author?._id),
        );
        if (duplicateIndex >= 0) {
          return prev.map((item, index) =>
            index === duplicateIndex ? comment : item,
          );
        }
        return [comment, ...prev];
      });
    };

    socket.on("comment:new", handleIncomingComment);
    return () => {
      socket.off("comment:new", handleIncomingComment);
      leavePost(post._id);
    };
  }, [isOpen, joinPost, leavePost, post._id, socket]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/comments/${post._id}`);
      const list = data.payload || [];
      setComments(list);
      onCommentsCountChange?.(list.length);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    const commentText = newComment.trim();
    setNewComment("");

    const tempId = `temp_${Date.now()}`;
    const optimisticComment: IComment = {
      _id: tempId,
      text: commentText,
      author: currentUser as IUser,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [optimisticComment, ...prev]);

    try {
      setSubmitting(true);
      const { data } = await api.post(`/comments/${post._id}`, {
        text: commentText,
      });

      if (data.payload) {
        setComments((prev) => {
          const next = prev.map((c) => (c._id === tempId ? data.payload : c));
          onCommentsCountChange?.(next.length);
          return next;
        });
      }
    } catch (error) {
      toast.error("Could not post comment");
      setComments((prev) => prev.filter((c) => c._id !== tempId));
      onCommentsCountChange?.(Math.max(0, comments.length - 1));
    } finally {
      setSubmitting(false);
    }
  };

  const postAuthorId =
    typeof post.author === "object" ? post.author?._id : post.author;

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    const previous = comments;

    setComments((prev) => prev.filter((comment) => comment._id !== commentId));
    onCommentsCountChange?.(Math.max(0, comments.length - 1));

    try {
      await api.delete(`/comments/${commentId}`);
      toast.success("Comment deleted");
    } catch (error) {
      toast.error("Failed to delete comment");
      setComments(previous);
      onCommentsCountChange?.(previous.length);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex sm:items-center items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a1a1a] w-full sm:max-w-md h-[70vh] sm:h-[600px] rounded-t-3xl sm:rounded-xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300"
      >
        <div className="w-12 h-1.5 bg-neutral-600 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="w-8" />
          <h2 className="font-semibold text-white text-[15px]">Comments</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center mt-10">
              <div className="w-6 h-6 border-2 border-neutral-500 border-t-white rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-neutral-500 mt-10 flex flex-col items-center">
              <span className="text-3xl mb-3">💬</span>
              <p className="text-white font-semibold">No comments yet.</p>
              <p className="text-sm mt-1">Start the conversation.</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment._id}
                className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2"
              >
                <Link to={`/profile/${comment.author?._id}`}>
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                    {comment.author?.avatar ? (
                      <img
                        src={comment.author.avatar}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-700" />
                    )}
                  </div>
                </Link>
                <div className="flex-1 text-sm mt-0.5">
                  <span className="font-semibold mr-2 text-white hover:text-neutral-300">
                    <Link to={`/profile/${comment.author?._id}`}>
                      {comment.author?.username}
                    </Link>
                  </span>
                  <span className="text-neutral-200 break-words leading-tight">
                    {comment.text}
                  </span>
                  <div className="text-neutral-500 text-[11px] mt-1.5 flex items-center gap-3 font-medium">
                    <span>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                    {(comment.author?._id === currentUser?._id ||
                      currentUser?._id === postAuthorId) && (
                      <button
                        disabled={deletingId === comment._id}
                        onClick={() => handleDeleteComment(comment._id)}
                        className="hover:text-red-400 transition-colors disabled:opacity-60"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-neutral-800 bg-[#1a1a1a]">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 relative"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt="me"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-700" />
              )}
            </div>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent border-none text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-0"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="text-[#0095F6] font-semibold text-sm hover:text-white disabled:opacity-40 transition-colors mr-1"
            >
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
