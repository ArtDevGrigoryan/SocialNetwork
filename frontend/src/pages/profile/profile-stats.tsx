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
    <div className="flex gap-6 md:gap-10 mb-4 md:mb-6 text-sm md:text-base">
      {stats.map((stat) => (
        <div
          key={stat.label}
          onClick={stat.onClick}
          className={`flex flex-col md:flex-row md:gap-1 items-center ${
            stat.onClick ? "cursor-pointer hover:opacity-80" : "cursor-default"
          }`}
        >
          <span className="font-semibold text-white">{stat.value || 0}</span>
          <span className="text-neutral-400">{stat.label}</span>
        </div>
      ))}
    </div>
  );
};

export default ProfileStats;