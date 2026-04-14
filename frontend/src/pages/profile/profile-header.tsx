import { Settings } from "lucide-react";
import { ProfileStats } from "./profile-stats";
import { useAuthStore } from "../../store/auth.store";

export const ProfileHeader = () => {
  const { user } = useAuthStore();
  const postsCount = 1500;
  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 px-4 pt-8">
      {/* AVATAR SECTION */}
      <div className="shrink-0">
        <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-1">
          <div className="w-full h-full rounded-full bg-neutral-900 border-4 border-neutral-950 flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-neutral-500 uppercase">
                {user?.username?.[0] || "?"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* INFO SECTION */}
      <div className="flex-1 w-full flex flex-col items-center md:items-start">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-4 md:mb-6 w-full md:w-auto">
          <h2 className="text-xl font-medium">
            {user?.username || "loading..."}
          </h2>
          <div className="flex items-center gap-2">
            <button className="bg-neutral-100 text-neutral-900 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-neutral-200 transition">
              Edit profile
            </button>
            <button className="bg-neutral-800 p-1.5 rounded-lg text-neutral-100 hover:bg-neutral-700 transition">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* STATS COMPONENT */}
        <ProfileStats
          postsCount={postsCount}
          followersCount={user?.followersCount || 0}
          followingCount={user?.followingCount || 0}
        />

        {/* BIO SECTION */}
        <div className="text-sm md:text-base text-center md:text-left">
          <p className="font-semibold">{user?.username}</p>
          <p className="text-neutral-300 mt-1">{user?.bio}</p>
        </div>
      </div>
    </div>
  );
};
