interface ProfileStatsProps {
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export const ProfileStats = ({
  postsCount,
  followersCount,
  followingCount,
}: ProfileStatsProps) => {
  const stats = [
    { label: "posts", value: postsCount },
    { label: "followers", value: followersCount },
    { label: "following", value: followingCount },
  ];

  return (
    <div className="flex gap-6 md:gap-10 mb-4 md:mb-6 text-sm md:text-base">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col md:flex-row md:gap-1 items-center cursor-pointer"
        >
          <span className="font-semibold text-white">{stat.value || 0}</span>
          <span className="text-neutral-400">{stat.label}</span>
        </div>
      ))}
    </div>
  );
};
