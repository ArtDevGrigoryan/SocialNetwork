import { useState, useEffect } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../lib/axios.config";
import type { IUser } from "../../types/user.types";
import { useAuthStore } from "../../store/auth.store";
import toast from "react-hot-toast";

interface ConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "followings";
  title: string;
}

export default function ConnectionsModal({
  isOpen,
  onClose,
  userId,
  type,
  title,
}: ConnectionsModalProps) {
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<(IUser & { isFollowing?: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setUsers([]);
      return;
    }
    document.body.style.overflow = "hidden";

    const fetchConnections = async () => {
      try {
        setLoading(true);
        const endpoint = search.trim()
          ? `/friends/${type}/${userId}?search=${search}`
          : `/friends/${type}/${userId}?page=1&limit=50`;
        const { data } = await api.get(endpoint);

        // Populate isFollowing state manually if not returned by backend
        const results = await Promise.all(
          data.payload.map(async (item: any) => {
            const u = item.follower || item.following || item;
            try {
              const userDetail = await api.get(`/users/${u._id}`);
              return { ...u, isFollowing: userDetail.data.payload.isFollowing };
            } catch (e) {
              return { ...u, isFollowing: false };
            }
          }),
        );
        setUsers(results);
      } catch (error) {
        console.error("Failed to fetch connections", error);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    };

    const timer = setTimeout(
      () => {
        fetchConnections();
      },
      search.trim() ? 400 : 0,
    );
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, userId, type, search]);

  const handleToggleFollow = async (
    targetUser: IUser & { isFollowing?: boolean },
  ) => {
    try {
      if (targetUser.isFollowing) {
        await api.post(`/friends/unfollow/${targetUser._id}`);
        setUsers(
          users.map((u) =>
            u._id === targetUser._id ? { ...u, isFollowing: false } : u,
          ),
        );
      } else {
        await api.post(`/friends/follow/${targetUser._id}`);
        setUsers(
          users.map((u) =>
            u._id === targetUser._id ? { ...u, isFollowing: true } : u,
          ),
        );
      }
    } catch (error) {
      toast.error("Failed to toggle follow status");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#262626] w-full sm:max-w-md h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom-full sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-neutral-600 rounded-full mx-auto mt-3 mb-2 sm:hidden" />
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 shrink-0">
          <div className="w-8" />
          <h2 className="font-semibold text-white text-[16px]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-3 border-b border-neutral-800 shrink-0 relative">
          <Search
            size={18}
            className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsSearching(true);
            }}
            placeholder="Search..."
            className="w-full bg-black text-white text-sm rounded-xl py-2.5 pl-10 pr-4 outline-none border border-transparent focus:border-neutral-600 transition"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {loading || isSearching ? (
            <div className="flex justify-center mt-10">
              <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center text-neutral-500 mt-10">
              <p className="text-white font-semibold">No users found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {users.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center justify-between group"
                >
                  <Link
                    to={`/profile/${u._id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 min-w-0"
                  >
                    <img
                      src={u.avatar || "/default-avatar.png"}
                      className="w-12 h-12 rounded-full object-cover border border-neutral-700 bg-black shrink-0"
                      alt="avatar"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-[14px] text-white hover:text-neutral-300 truncate">
                        {u.username}
                      </span>
                      {u.bio && (
                        <span className="text-neutral-400 text-[12px] truncate max-w-[150px]">
                          {u.bio}
                        </span>
                      )}
                    </div>
                  </Link>
                  {currentUser?._id !== u._id && (
                    <button
                      onClick={() => handleToggleFollow(u)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${u.isFollowing ? "bg-neutral-800 text-white hover:bg-neutral-700" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                    >
                      {u.isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
