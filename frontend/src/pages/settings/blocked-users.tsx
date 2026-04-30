import { useState, useEffect } from "react";
import { ChevronLeft, Loader2, UserMinus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/axios.config";
import toast from "react-hot-toast";

export default function BlockedUsersSettings() {
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBlockedUsers = async () => {
    try {
      const { data } = await api.get("/friends/blocks?page=1&limit=50");
      setBlockedUsers(data.payload || []);
    } catch (error) {
      toast.error("Failed to load blocked users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const handleUnblock = async (userId: string) => {
    try {
      await api.post(`/friends/block/${userId}`);
      setBlockedUsers((prev) =>
        prev.filter((item) => item.blocked._id !== userId),
      );
      toast.success("User unblocked");
    } catch (error) {
      toast.error("Failed to unblock user");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex items-center gap-3 mb-6 md:hidden">
        <button onClick={() => navigate(-1)} className="text-white">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold">Blocked Accounts</h1>
      </div>

      <h2 className="text-2xl font-bold text-white hidden md:block">
        Blocked Accounts
      </h2>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-neutral-500" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="p-10 text-center text-neutral-500">
            <p>You haven't blocked anyone yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {blockedUsers.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={item.blocked.avatar || "/default-avatar.png"}
                    className="w-10 h-10 rounded-full object-cover border border-neutral-700"
                    alt=""
                  />
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {item.blocked.username}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {item.blocked.bio || "No bio"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblock(item.blocked._id)}
                  className="bg-neutral-800 hover:bg-red-500/10 hover:text-red-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                >
                  <UserMinus size={14} />
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
