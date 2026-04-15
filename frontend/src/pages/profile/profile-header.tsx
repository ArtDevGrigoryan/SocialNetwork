import { Settings, Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/axios.config";
import { AvatarModal } from "./avatar-modal";

export const ProfileHeader = ({
  user,
  isOwner,
  postsCount,
  onFollowersClick,
  onFollowingClick,
  refreshData,
}: any) => {
  const navigate = useNavigate();
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const handleFollowAction = async () => {
    setIsFollowLoading(true);
    try {
      await api.post(`/friends/follow/${user._id}`);
      refreshData();
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  return (
    <header className="px-4 py-6 md:py-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-20">
      <div
        onClick={() => user?.avatar && setIsAvatarOpen(true)}
        className="relative shrink-0 w-20 h-20 md:w-36 md:h-36 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 cursor-pointer"
      >
        <div className="w-full h-full rounded-full bg-black p-[2px]">
          <img
            src={user?.avatar || "/default-avatar.png"}
            className="w-full h-full rounded-full object-cover border border-neutral-900"
          />
        </div>
      </div>

      <div className="flex-1 w-full space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <h2 className="text-xl font-normal text-white">{user?.username}</h2>

          <div className="flex items-center gap-2">
            {isOwner ? (
              <>
                <button
                  onClick={() => navigate("/settings/profile")}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => navigate("/settings")}
                  className="hidden md:block text-white"
                >
                  <Settings size={24} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleFollowAction}
                  disabled={isFollowLoading}
                  className={`${user?.isFollowing ? "bg-neutral-800" : "bg-blue-500"} text-white px-6 py-1.5 rounded-lg text-sm font-semibold transition min-w-[100px]`}
                >
                  {isFollowLoading
                    ? "..."
                    : user?.isFollowing
                      ? "Following"
                      : "Follow"}
                </button>
                <button className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition">
                  Message
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-around md:justify-start md:gap-10 border-y md:border-none border-neutral-900 py-3 md:py-0">
          <div className="flex flex-col md:flex-row items-center gap-1">
            <span className="font-semibold">{postsCount}</span>{" "}
            <span className="text-neutral-400 md:text-white">posts</span>
          </div>
          <div
            onClick={onFollowersClick}
            className="flex flex-col md:flex-row items-center gap-1 cursor-pointer"
          >
            <span className="font-semibold">{user?.followersCount || 0}</span>{" "}
            <span className="text-neutral-400 md:text-white">followers</span>
          </div>
          <div
            onClick={onFollowingClick}
            className="flex flex-col md:flex-row items-center gap-1 cursor-pointer"
          >
            <span className="font-semibold">{user?.followingCount || 0}</span>{" "}
            <span className="text-neutral-400 md:text-white">following</span>
          </div>
        </div>

        <div className="text-sm text-center md:text-left">
          <h1 className="font-semibold text-white">{user?.username}</h1>
          <p className="text-neutral-300 mt-1 whitespace-pre-wrap">
            {user?.bio || "No bio yet."}
          </p>
        </div>
      </div>

      <AvatarModal
        isOpen={isAvatarOpen}
        onClose={() => setIsAvatarOpen(false)}
        avatarUrl={user?.avatar}
      />
    </header>
  );
};

export default ProfileHeader;
