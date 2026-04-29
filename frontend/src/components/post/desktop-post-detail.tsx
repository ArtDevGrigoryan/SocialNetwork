import { useEffect, useState, useRef } from "react";
import { useAuthStore } from "../../store/auth.store";
import { useSocketStore } from "../../store/socket.store";
import type { IPost, IUser } from "../../types/user.types";
import { api } from "../../lib/axios.config";
import toast from "react-hot-toast";
import {
  ArchiveRestore,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat,
  Send,
  Trash2,
  ShieldOff,
  ShieldCheck,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useShallow } from "zustand/shallow";
import LikesModal from "../../components/post/likes-modal";
import ShareModal from "./share-modal";
import { useMusicStore } from "../../store/music.setting.store";
import { AnimatedHeart } from "./animated-hearth";

export interface IComment {
  _id: string;
  text: string;
  author: IUser;
  createdAt: string;
}
interface DesktopPostDetailProps {
  post: IPost & {
    isLiked?: boolean;
    isSaved?: boolean;
    isReposted?: boolean;
    likesCount?: number;
    commentsCount?: number;
  };
}
export const DesktopPostDetail = ({ post }: DesktopPostDetailProps) => {
  const currentUser = useAuthStore((state) => state.user);
  const { socket, joinPost, leavePost } = useSocketStore(
    useShallow((state) => ({
      socket: state.socket,
      joinPost: state.joinPost,
      leavePost: state.leavePost,
    })),
  );

  const { isMuted, toggleMute, activePostId, setActivePost } = useMusicStore();

  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [likesCount, setLikesCount] = useState(post.likes ?? 0);
  const [isSaved, setIsSaved] = useState(post.isSaved ?? false);
  const [isReposted, setIsReposted] = useState(post.isReposted ?? false);
  const [showMenu, setShowMenu] = useState(false);
  const [accessRepost, setAccessRepost] = useState(post.accessRepost ?? true);
  const [isLikesModalOpen, setIsLikesModalOpen] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  const author =
    typeof post.author === "object" ? (post.author as IUser) : null;
  const isOwner = currentUser?._id === author?._id;
  const hasMultipleImages = post.images?.length > 1;

  const audioRef = useRef<HTMLAudioElement>(null);

  // Mount լինելուց սարքում ենք ակտիվ պոստ
  useEffect(() => {
    setActivePost(post._id);
    return () => {
      // Որպեսզի unmount լինելուց մաքրենք, եթե հենց ինքն էր ակտիվ
      if (useMusicStore.getState().activePostId === post._id) {
        useMusicStore.getState().setActivePost(null);
      }
    };
  }, [post._id, setActivePost]);

  // Կառավարում ենք երգը ըստ activePostId-ի
  useEffect(() => {
    if (!audioRef.current || !post.music?.url) return;

    const audioEl = audioRef.current;
    audioEl.currentTime = post.music.startTime || 0;
    audioEl.muted = isMuted;

    if (activePostId === post._id) {
      audioEl.play().catch(() => console.log("Autoplay prevented by browser"));
    } else {
      audioEl.pause();
    }
  }, [activePostId, post._id, isMuted, post.music]);

  useEffect(() => {
    fetchComments();
    if (!socket) return;
    joinPost(post._id);

    const handleIncomingComment = (comment: IComment & { postId?: string }) => {
      if (comment.postId && comment.postId !== post._id) return;
      setComments((prev) => {
        const isDuplicate = prev.some(
          (c) =>
            c._id === comment._id ||
            (c._id.startsWith("temp_") && c.text === comment.text),
        );
        if (isDuplicate) return prev;
        return [comment as IComment, ...prev];
      });
    };

    socket.on("comment:new", handleIncomingComment);
    return () => {
      socket.off("comment:new", handleIncomingComment);
      leavePost(post._id);
    };
  }, [post._id, socket, joinPost, leavePost]);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const { data } = await api.get(`/comments/${post._id}`);
      setComments(data.payload || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

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
      toast.error("Failed to like the post");
      setIsLiked(!nextLiked);
      setLikesCount((prev) => prev + (!nextLiked ? 1 : -1));
    }
  };

  const handleSave = async () => {
    const next = !isSaved;
    setIsSaved(next);
    try {
      if (next) await api.post(`/saves/${post._id}`);
      else await api.delete(`/saves/${post._id}`);
    } catch {
      toast.error("Action failed");
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

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    const text = newComment.trim();
    setNewComment("");
    const tempId = `temp_${Date.now()}`;

    setComments((prev) => [
      {
        _id: tempId,
        text,
        author: currentUser as IUser,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    try {
      setSubmitting(true);
      const { data } = await api.post(`/comments/${post._id}`, { text });
      if (data.payload) {
        setComments((prev) =>
          prev.map((c) => (c._id === tempId ? data.payload : c)),
        );
      }
    } catch {
      toast.error("Could not post comment");
      setComments((prev) => prev.filter((c) => c._id !== tempId));
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    const prevComments = [...comments];
    setComments((prev) => prev.filter((c) => c._id !== commentId));
    try {
      await api.delete(`/comments/${commentId}`);
    } catch {
      toast.error("Failed to delete comment");
      setComments(prevComments);
    } finally {
      setDeletingId(null);
    }
  };
  const handleDoubleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
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
  };
  const currentImageObj =
    typeof post.images[currentMediaIndex] === "object"
      ? post.images[currentMediaIndex]
      : { url: post.images[currentMediaIndex], filter: "none" };

  return (
    <>
      <div className="flex w-full max-w-[1200px] h-[85vh] bg-black border border-neutral-800 rounded-md overflow-hidden shadow-2xl relative">
        <div
          className="w-[55%] lg:w-[65%] relative bg-neutral-950 flex items-center justify-center border-r border-neutral-800 select-none group"
          onDoubleClick={handleDoubleClick}
        >
          {post.music?.url && (
            <audio ref={audioRef} src={post.music.url} loop />
          )}
          <img
            src={currentImageObj.url}
            style={{
              filter:
                currentImageObj.filter !== "none"
                  ? currentImageObj.filter
                  : undefined,
            }}
            className="w-full h-full object-contain"
            alt="Post media"
          />
          {floatingHearts.map((heart) => (
            <AnimatedHeart
              key={heart.id}
              x={heart.x}
              y={heart.y}
              onComplete={() =>
                setFloatingHearts((prev) =>
                  prev.filter((h) => h.id !== heart.id),
                )
              }
            />
          ))}

          {hasMultipleImages && (
            <>
              {currentMediaIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMediaIndex((p) => p - 1);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              {currentMediaIndex < post.images.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMediaIndex((p) => p + 1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight size={24} />
                </button>
              )}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {post.images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentMediaIndex ? "w-1.5 bg-blue-500" : "w-1.5 bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}
          {post.music && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="absolute bottom-6 right-6 bg-black/60 p-2.5 rounded-full text-white z-20 hover:scale-110 transition-transform backdrop-blur-sm"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          )}
        </div>

        <div className="w-[45%] lg:w-[35%] flex flex-col bg-black h-full relative">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${author?._id}`}>
                <img
                  src={author?.avatar || "/default-avatar.png"}
                  className="w-8 h-8 rounded-full object-cover border border-neutral-800"
                  alt="avatar"
                />
              </Link>
              <Link
                to={`/profile/${author?._id}`}
                className="text-sm font-semibold text-white hover:opacity-80"
              >
                {author?.username || "user"}
              </Link>
            </div>
            <div className="relative">
              <MoreHorizontal
                size={20}
                className="text-white cursor-pointer hover:text-neutral-400 transition"
                onClick={() => setShowMenu(!showMenu)}
              />
              {showMenu && isOwner && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-8 w-48 bg-[#262626] border border-neutral-700 rounded-md shadow-xl z-50 overflow-hidden">
                    <button
                      onClick={toggleAccessRepost}
                      className="w-full text-left px-4 py-3 text-sm text-white hover:bg-neutral-800 font-bold flex items-center gap-2 transition"
                    >
                      {accessRepost ? (
                        <ShieldOff size={16} />
                      ) : (
                        <ShieldCheck size={16} />
                      )}
                      {accessRepost ? "Disable Reposting" : "Enable Reposting"}
                    </button>
                    <button className="w-full text-left px-4 py-3 text-sm text-white hover:bg-neutral-800 font-bold flex items-center gap-2 transition">
                      <ArchiveRestore size={16} /> Archive
                    </button>
                    <button className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-neutral-800 font-bold flex items-center gap-2 transition">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
            {post.content && (
              <div className="flex gap-3 items-start">
                <img
                  src={author?.avatar || "/default-avatar.png"}
                  className="w-8 h-8 rounded-full flex-shrink-0"
                  alt="avatar"
                />
                <div className="flex-1 text-sm mt-0.5">
                  <span className="font-semibold text-white mr-2">
                    {author?.username}
                  </span>
                  <span className="text-white break-words">{post.content}</span>
                  <div className="text-neutral-500 text-[11px] mt-2 uppercase font-medium">
                    {new Date(
                      post.createdAt || Date.now(),
                    ).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {loadingComments ? (
              <div className="flex justify-center mt-6">
                <div className="w-6 h-6 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-neutral-500 mt-10">
                <p className="text-lg font-semibold text-white mb-1">
                  No comments yet.
                </p>
                <p className="text-sm">Start the conversation.</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} className="flex gap-3 items-start group">
                  <Link to={`/profile/${comment.author?._id}`}>
                    <img
                      src={comment.author?.avatar || "/default-avatar.png"}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-neutral-800"
                      alt="avatar"
                    />
                  </Link>
                  <div className="flex-1 text-sm mt-0.5">
                    <span className="font-semibold text-white mr-2 hover:text-neutral-300">
                      <Link to={`/profile/${comment.author?._id}`}>
                        {comment.author?.username}
                      </Link>
                    </span>
                    <span className="text-neutral-200 break-words">
                      {comment.text}
                    </span>
                    <div className="text-neutral-500 text-[11px] mt-1.5 flex items-center gap-3 font-medium">
                      <span>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                      {(comment.author?._id === currentUser?._id ||
                        isOwner) && (
                        <button
                          disabled={deletingId === comment._id}
                          onClick={() => deleteComment(comment._id)}
                          className="font-semibold text-neutral-600 hover:text-red-500 disabled:opacity-50 opacity-0 group-hover:opacity-100 transition-opacity"
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

          <div className="border-t border-neutral-800 p-4 bg-black">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <button
                  onMouseDown={handleLikeTouchStart}
                  onMouseUp={handleLikeTouchEnd}
                  onMouseLeave={handleLikeTouchEnd}
                  onClick={handleLikeClick}
                  className="focus:outline-none hover:scale-110 active:scale-95 transition-transform"
                >
                  <Heart
                    className={cn(
                      isLiked ? "text-red-500 fill-red-500" : "text-white",
                    )}
                    size={26}
                  />
                </button>
                <MessageCircle
                  size={26}
                  className="text-white hover:opacity-70 cursor-pointer hover:scale-110 transition-transform"
                />
                <button
                  onClick={handleRepost}
                  disabled={!accessRepost}
                  className="focus:outline-none hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
                >
                  <Repeat
                    size={26}
                    className={cn(isReposted ? "text-green-500" : "text-white")}
                  />
                </button>
                <Send
                  onClick={() => setIsShareModalOpen(true)}
                  size={26}
                  className="text-white hover:opacity-70 cursor-pointer hover:scale-110 transition-transform"
                />
              </div>
              <Bookmark
                onClick={handleSave}
                size={26}
                className={cn(
                  "cursor-pointer hover:opacity-70 hover:scale-110 active:scale-95 transition-all",
                  isSaved ? "fill-white text-white" : "text-white",
                )}
              />
            </div>

            <div
              className="text-sm font-semibold text-white mb-1 cursor-pointer w-max hover:text-neutral-300"
              onClick={() => setIsLikesModalOpen(true)}
            >
              {likesCount.toLocaleString()} likes
            </div>

            <div className="text-[10px] text-neutral-500 uppercase tracking-wide mb-4 font-medium">
              {new Date(post.createdAt || Date.now()).toLocaleDateString()}
            </div>

            <form
              onSubmit={submitComment}
              className="flex items-center gap-3 relative border-t border-neutral-800 pt-4"
            >
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
                className="text-[#0095F6] font-semibold text-sm hover:text-white disabled:opacity-40 transition-colors"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </div>

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
    </>
  );
};
