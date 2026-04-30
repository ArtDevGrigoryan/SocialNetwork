import { useState, useEffect } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../lib/axios.config";
import type { IUser } from "../../types/user.types";

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
  const [users, setUsers] = useState<IUser[]>([]);
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
        // Եթե search դաշտը դատարկ է, բերում ենք հիմնական ցուցակը
        const endpoint = search.trim()
          ? `/friends/${type}/${userId}?search=${search}`
          : `/friends/${type}/${userId}?page=1&limit=50`;

        const { data } = await api.get(endpoint);
        // backend-ը վերադարձնում է կամ օգտատերերի array կամ follow օբյեկտների array
        const results = data.payload.map(
          (item: any) => item.follower || item.following || item,
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
    ); // Debounce search-ի համար

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, userId, type, search]);

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
        {/* Mobile handle & Header */}
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

        {/* Search Input */}
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

        {/* List */}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
