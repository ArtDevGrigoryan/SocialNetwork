import { Settings, Check, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/axios.config";

export const ProfileHeader = ({ user, isOwner, postsCount }: any) => {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(user?.isFollowing || false);
  const [loading, setLoading] = useState(false);

  const toggleFollow = async () => {
    setLoading(true);
    const prev = following;
    setFollowing(!prev);
    try {
      await api.post(`/friends/${prev ? "unfollow" : "follow"}/${user._id}`);
    } catch {
      setFollowing(prev);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-20 py-8 px-4 border-b border-neutral-900 md:border-none">
      <div className="w-24 h-24 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-yellow-500 to-purple-600">
        <div className="w-full h-full rounded-full bg-black p-1">
          <img
            src={user?.avatar || "/default.png"}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
      </div>

      <div className="flex-1 space-y-6 text-center md:text-left">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <h2 className="text-xl font-light">{user?.username}</h2>
          <div className="flex gap-2">
            {isOwner ? (
              <>
                <button
                  onClick={() => navigate("/settings")}
                  className="bg-neutral-800 hover:bg-neutral-700 px-4 py-1.5 rounded-lg text-sm font-semibold transition"
                >
                  Edit Profile
                </button>
                <Settings size={22} className="cursor-pointer" />
              </>
            ) : (
              <button
                onClick={toggleFollow}
                disabled={loading}
                className={`px-8 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${following ? "bg-neutral-800" : "bg-blue-500 hover:bg-blue-600"}`}
              >
                {following ? (
                  <>
                    <Check size={16} /> Following
                  </>
                ) : (
                  <>
                    <UserPlus size={16} /> Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center md:justify-start gap-10">
          <div className="flex flex-col md:flex-row gap-1 items-center">
            <span className="font-bold">{postsCount}</span>{" "}
            <span className="text-neutral-400">posts</span>
          </div>
          <div className="flex flex-col md:flex-row gap-1 items-center">
            <span className="font-bold">{user?.followersCount || 0}</span>{" "}
            <span className="text-neutral-400">followers</span>
          </div>
          <div className="flex flex-col md:flex-row gap-1 items-center">
            <span className="font-bold">{user?.followingCount || 0}</span>{" "}
            <span className="text-neutral-400">following</span>
          </div>
        </div>

        <div>
          <h1 className="font-bold">{user?.fullName}</h1>
          <p className="text-sm mt-1 whitespace-pre-wrap">{user?.bio}</p>
        </div>
      </div>
    </div>
  );
};
