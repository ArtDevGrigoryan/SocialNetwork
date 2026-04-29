import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/axios.config";
import type { IUser } from "../../types/user.types";
import { Loader2 } from "lucide-react";

interface LikesModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LikesModal({
  postId,
  isOpen,
  onClose,
}: LikesModalProps) {
  const [users, setUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      fetchLikes(1);
    } else {
      document.body.style.overflow = "unset";
      setUsers([]);
      setPage(1);
      setHasMore(true);
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, postId]);

  const fetchLikes = async (pageNumber: number) => {
    try {
      if (pageNumber === 1) setLoading(true);
      else setFetchingMore(true);

      const { data } = await api.get(`/posts/${postId}/like`, {
        params: { page: pageNumber, limit: 15 },
      });

      const newUsers = data.payload || data || [];

      if (newUsers.length < 15) {
        setHasMore(false);
      }

      if (pageNumber === 1) {
        setUsers(newUsers);
      } else {
        setUsers((prev) => [...prev, ...newUsers]);
      }

      setPage(pageNumber);
    } catch (error) {
      console.error("Failed to fetch likes:", error);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex sm:items-center items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a1a1a] w-full sm:max-w-md h-[65vh] sm:h-[500px] rounded-t-3xl sm:rounded-xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-300"
      >
        {/* Drag Handle */}
        <div className="w-12 h-1.5 bg-neutral-600 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
          <div className="w-8" />
          <h2 className="font-semibold text-white text-[16px]">Likes</h2>
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
              />
              <line
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                x1="21"
                x2="3"
                y1="21"
                y2="3"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center mt-10">
              <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-neutral-500 mt-10">
              <p className="text-white font-semibold text-lg">No likes yet</p>
            </div>
          ) : (
            <>
              {users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Link to={`/profile/${user._id}`}>
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800 border border-neutral-700">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-neutral-700" />
                        )}
                      </div>
                    </Link>
                    <div className="flex flex-col">
                      <Link
                        to={`/profile/${user._id}`}
                        className="font-semibold text-[14px] text-white hover:text-neutral-300"
                      >
                        {user.username}
                      </Link>
                      <span className="text-neutral-400 text-[12px] truncate max-w-[150px]">
                        {user.bio || "No bio yet"}
                      </span>
                    </div>
                  </div>
                  <Link to={`/profile/${user._id}`}>
                    <button className="bg-[#262626] hover:bg-[#333] text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors">
                      View
                    </button>
                  </Link>
                </div>
              ))}

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => fetchLikes(page + 1)}
                    disabled={fetchingMore}
                    className="text-blue-500 text-sm font-semibold hover:text-white disabled:opacity-50 flex items-center gap-2"
                  >
                    {fetchingMore && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
