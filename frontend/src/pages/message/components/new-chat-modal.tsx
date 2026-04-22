import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../../lib/axios.config";
import type { IUser } from "../../../types/user.types";
import type { NewChatModalProps } from "../types";

export default function NewChatModal({ onClose }: NewChatModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const trimmed = query.trim();
      if (!trimmed) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get("/friends/search", {
          params: { search: trimmed },
        });
        setResults(data.payload || []);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleStartChat = async (userId: string) => {
    if (creating) return;
    setCreating(true);
    try {
      const { data } = await api.post("/chats/dm", { userId });
      if (data?.payload?._id) {
        onClose();
        navigate(`/messages/${data.payload._id}`);
      }
    } catch (error) {
      console.error("Failed to start chat", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 w-full max-w-[400px] h-[70vh] min-h-[400px] rounded-2xl flex flex-col border border-neutral-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="w-6" />
          <h2 className="text-base font-bold text-white">New message</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-3 border-b border-neutral-800 flex items-center gap-3">
          <span className="font-semibold text-white px-1">To:</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent border-none text-white focus:outline-none placeholder-neutral-500 text-[15px]"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-neutral-500" />
            </div>
          ) : results.length > 0 ? (
            results.map((user) => (
              <div
                key={user._id}
                onClick={() => handleStartChat(user._id)}
                className="flex items-center gap-3 p-3 hover:bg-neutral-800/60 rounded-xl cursor-pointer transition-colors"
              >
                <img
                  src={user.avatar || "/default-avatar.png"}
                  className="w-12 h-12 rounded-full object-cover bg-neutral-800"
                  alt="avatar"
                />
                <div className="flex flex-col flex-1">
                  <span className="text-sm font-semibold text-white">
                    {user.username}
                  </span>
                  <span className="text-[13px] text-neutral-500 truncate">
                    {user.bio || "No bio"}
                  </span>
                </div>
              </div>
            ))
          ) : query.trim() ? (
            <div className="text-center text-neutral-500 p-6 text-sm">
              No account found.
            </div>
          ) : (
            <div className="text-center text-neutral-500 p-6 text-sm">
              Search for people to start chatting.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
