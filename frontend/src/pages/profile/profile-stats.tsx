interface ProfileStatsProps {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

export const ProfileStats = ({
  postsCount,
  followersCount,
  followingCount,
  onFollowersClick,
  onFollowingClick,
}: ProfileStatsProps) => {
  const stats = [
    { label: "posts", value: postsCount, onClick: undefined },
    { label: "followers", value: followersCount, onClick: onFollowersClick },
    { label: "following", value: followingCount, onClick: onFollowingClick },
  ];

  return (
    <div className="flex gap-8 md:gap-12 mb-4 md:mb-6 text-sm md:text-base">
      {stats.map((stat) => (
        <button
          type="button"
          key={stat.label}
          onClick={stat.onClick}
          className={`flex flex-col md:flex-row md:gap-1 items-center transition-opacity ${
            stat.onClick
              ? "cursor-pointer hover:opacity-80"
              : "cursor-default pointer-events-none"
          }`}
        >
          <span className="font-semibold text-white">{stat.value || 0}</span>
          <span className="text-neutral-400">{stat.label}</span>
        </button>
      ))}
    </div>
  );
};

export default ProfileStats;