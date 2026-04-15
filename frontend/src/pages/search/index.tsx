import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { api } from "../../lib/axios.config";
import type { IUser } from "../../types/user.types";

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<IUser[]>([]);
  const [startingChatId, setStartingChatId] = useState<string | null>(null);

  const fetchUsers = async (value: string) => {
    const trimmed = value.trim();
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

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      await fetchUsers(query);
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const refreshSearch = () => {
      if (query.trim()) {
        fetchUsers(query);
      }
    };
    window.addEventListener("requests:changed", refreshSearch);
    window.addEventListener("focus", refreshSearch);
    return () => {
      window.removeEventListener("requests:changed", refreshSearch);
      window.removeEventListener("focus", refreshSearch);
    };
  }, [query]);

  const handleStartChat = async (userId: string) => {
    setStartingChatId(userId);
    try {
      const { data } = await api.post("/chats/dm", { userId });
      if (data?.payload?._id) {
        navigate(`/messages/${data.payload._id}`);
      } else {
        navigate("/messages");
      }
    } catch (error) {
      console.error("Failed to start chat", error);
    } finally {
      setStartingChatId(null);
    }
  };

  return (
    <div className="max-w-[600px] mx-auto px-4 md:px-0 py-6">
      <div className="relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
        />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search users..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
        />
      </div>

      <div className="mt-5 border border-neutral-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-4 text-sm text-neutral-400">Searching...</div>
        ) : results.length ? (
          results.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-neutral-900 transition-colors border-b border-neutral-800 last:border-b-0"
            >
              <Link to={`/profile/${user._id}`} className="flex items-center gap-3 min-w-0">
                <img
                  src={user.avatar || "/default-avatar.png"}
                  className="w-10 h-10 rounded-full object-cover"
                  alt={user.username}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                  <p className="text-xs text-neutral-400 truncate">
                    {user.bio || "No bio yet"}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => handleStartChat(user._id)}
                disabled={startingChatId === user._id}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-60 text-xs font-semibold text-white"
              >
                Message
              </button>
            </div>
          ))
        ) : (
          <div className="p-4 text-sm text-neutral-500">
            Start typing to search for users.
          </div>
        )}
      </div>
    </div>
  );
}
