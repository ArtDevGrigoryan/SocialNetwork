interface PostGridProps {
  posts: any[];
}

export const PostGrid = ({ posts }: PostGridProps) => {
  if (!posts.length) {
    return <div className="text-center py-10 text-neutral-500">No posts yet. Create one!</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2 mt-1">
      {posts.map((post, idx) => (
        <div key={idx} className="aspect-square bg-neutral-900 group relative cursor-pointer overflow-hidden">
          <div className="w-full h-full bg-neutral-800/50 group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <span className="text-white font-bold">❤️ 120</span>
            <span className="text-white font-bold">💬 14</span>
          </div>
        </div>
      ))}
    </div>
  );
};