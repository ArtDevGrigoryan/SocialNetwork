import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import { useSocketStore } from "../../store/socket.store";
import { useShallow } from "zustand/react/shallow";
import type { IPost, IUser } from "../../types/user.types";

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
}

export default function CommentModal({
  post,
  isOpen,
  onClose,
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"; // Կանխում է հետին պլանի սքրոլը
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
            index === duplicateIndex ? (comment as IComment) : item,
          );
        }
        return [comment as IComment, ...prev];
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
      // Հիմնված schemas/comment.schema.js-ի վրա (getCommentsSchema)
      const { data } = await api.get(`/comments/${post._id}`);
      setComments(data.payload || []);
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
    setNewComment(""); // Մաքրում ենք input-ը անմիջապես

    // 1. Optimistic UI - Ավելացնում ենք էկրանին միանգամից
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
      // 2. Ուղարկում ենք backend
      // Նշում: Ըստ schema-ի params-ում պետք է լինի postId, իսկ body-ում' text
      const { data } = await api.post(`/comments/${post._id}`, {
        text: commentText,
      });

      // 3. Փոխարինում ենք temp մեկնաբանությունը իրականով (որն ունի ճիշտ _id բազայից)
      if (data.payload) {
        setComments((prev) =>
          prev.map((c) => (c._id === tempId ? data.payload : c)),
        );
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      // Սխալի դեպքում ջնջում ենք optimistic մեկնաբանությունը
      setComments((prev) => prev.filter((c) => c._id !== tempId));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 w-full max-w-md h-[80vh] md:h-[600px] md:rounded-xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="w-8" /> {/* Բալանսավորման համար */}
          <h2 className="font-semibold text-white">Մեկնաբանություններ</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
          >
            <svg fill="white" height="24" viewBox="0 0 24 24" width="24">
              <line
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                x1="21"
                x2="3"
                y1="3"
                y2="21"
              ></line>
              <line
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                x1="21"
                x2="3"
                y1="21"
                y2="3"
              ></line>
            </svg>
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center mt-10">
              <div className="w-6 h-6 border-2 border-neutral-500 border-t-white rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-neutral-500 mt-10 flex flex-col items-center">
              <span className="text-2xl mb-2">💬</span>
              <p>Դեռ մեկնաբանություններ չկան:</p>
              <p className="text-sm">Եղեք առաջինը:</p>
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
                <div className="flex-1 text-sm">
                  <span className="font-semibold mr-2 text-white hover:text-neutral-300">
                    <Link to={`/profile/${comment.author?._id}`}>
                      {comment.author?.username}
                    </Link>
                  </span>
                  <span className="text-neutral-200 break-words">
                    {comment.text}
                  </span>
                  <div className="text-neutral-500 text-xs mt-1 flex items-center gap-3">
                    <span>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                    <button className="font-semibold hover:text-neutral-300">
                      Պատասխանել
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-900">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 relative"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
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
              placeholder="Ավելացնել մեկնաբանություն..."
              className="flex-1 bg-transparent border-none text-sm text-white placeholder-neutral-500 focus:outline-none"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="text-blue-500 font-semibold text-sm hover:text-blue-400 disabled:opacity-50 transition-colors mr-1"
            >
              Հրապարակել
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
