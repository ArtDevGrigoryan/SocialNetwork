import { Settings, Check, UserPlus } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/axios.config";
import type { IUser } from "../../types/user.types";
import { ProfileStats } from "./profile-stats";

interface ProfileHeaderProps {
  user: IUser | null;
  isOwner: boolean;
  postsCount: number;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export const ProfileHeader = ({
  user,
  isOwner,
  postsCount,
  onFollowersClick,
  onFollowingClick,
}: ProfileHeaderProps) => {
  const navigate = useNavigate();
  const [relationship, setRelationship] = useState<
    "FOLLOWING" | "REQUESTED" | "NONE"
  >(user?.isFollowing ? "FOLLOWING" : "NONE");
  const [followersCount, setFollowersCount] = useState(user?.followersCount || 0);
  const [loading, setLoading] = useState(false);

  const toggleFollow = async () => {
    if (!user) return;
    setLoading(true);
    const prevRelation = relationship;
    const wasFollowing = prevRelation === "FOLLOWING";
    if (prevRelation === "FOLLOWING") {
      setRelationship("NONE");
      setFollowersCount((count) => Math.max(0, count - 1));
    } else {
      setRelationship("FOLLOWING");
      setFollowersCount((count) => count + 1);
    }
    try {
      const { data } = await api.post(
        `/friends/${wasFollowing ? "unfollow" : "follow"}/${user._id}`,
      );
      if (!wasFollowing && data?.payload === "FOLLOW_REQUEST") {
        setRelationship("REQUESTED");
      } else if (!wasFollowing) {
        setRelationship("FOLLOWING");
      }
    } catch {
      setRelationship(prevRelation);
      if (prevRelation === "FOLLOWING") {
        setFollowersCount(user.followersCount || 0);
      } else {
        setFollowersCount(user.followersCount || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-start gap-8 md:gap-24 py-8 px-4 md:px-2 border-b border-neutral-900">
      <div className="w-24 h-24 md:w-[150px] md:h-[150px] rounded-full p-1 bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-600 mx-auto md:mx-0">
        <div className="w-full h-full rounded-full bg-black p-1">
          <img
            src={user?.avatar || "/default.png"}
            className="w-full h-full rounded-full object-cover"
            loading="lazy"
          />
        </div>
      </div>

      <div className="flex-1 space-y-5 text-center md:text-left w-full">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
          <h2 className="text-[22px] font-normal">{user?.username}</h2>
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
                className={`px-8 py-1.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 ${relationship === "FOLLOWING" ? "bg-neutral-800" : relationship === "REQUESTED" ? "bg-neutral-700" : "bg-blue-500 hover:bg-blue-600"}`}
              >
                {relationship === "FOLLOWING" ? (
                  <>
                    <Check size={16} /> Following
                  </>
                ) : relationship === "REQUESTED" ? (
                  <>Requested</>
                ) : (
                  <>
                    <UserPlus size={16} /> Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <ProfileStats
          postsCount={postsCount}
          followersCount={followersCount}
          followingCount={user?.followingCount || 0}
          onFollowersClick={onFollowersClick}
          onFollowingClick={onFollowingClick}
        />

        <div>
          <h1 className="font-bold">{user?.fullName}</h1>
          <p className="text-sm mt-1 whitespace-pre-wrap">{user?.bio}</p>
        </div>
      </div>
    </div>
  );
};
