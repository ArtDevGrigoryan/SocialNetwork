import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import toast from "react-hot-toast";
import type { IUser } from "../../types/user.types";

export default function FollowingsSettings() {
  const { user } = useAuthStore();
  const [followings, setFollowings] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    const fetchFollowings = async () => {
      try {
        const { data } = await api.get(
          `/friends/followings/${user._id}?page=1&limit=50`,
        );
        setFollowings((data.payload || []).map((item: any) => item.following));
      } catch (error) {
        console.error("Failed to load followings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFollowings();
  }, [user?._id]);

  const handleUnfollow = async (targetId: string) => {
    try {
      await api.post(`/friends/unfollow/${targetId}`);
      setFollowings((prev) => prev.filter((u) => u._id !== targetId));
      toast.success("Unfollowed");
    } catch (error) {
      toast.error("Failed to unfollow");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold text-white hidden md:block mb-6">
        Following
      </h2>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-neutral-500" />
          </div>
        ) : followings.length === 0 ? (
          <div className="p-10 text-center text-neutral-500">
            <p>You aren't following anyone yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {followings.map((u) => (
              <div
                key={u._id}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition"
              >
                <Link
                  to={`/profile/${u._id}`}
                  className="flex items-center gap-3"
                >
                  <img
                    src={u.avatar || "/default-avatar.png"}
                    className="w-12 h-12 rounded-full object-cover border border-neutral-700 bg-black"
                    alt="Avatar"
                  />
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {u.username}
                    </p>
                    {u.bio && (
                      <p className="text-xs text-neutral-500 truncate max-w-[200px]">
                        {u.bio}
                      </p>
                    )}
                  </div>
                </Link>
                <button
                  onClick={() => handleUnfollow(u._id)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
                >
                  Unfollow
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
