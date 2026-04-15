import { useEffect, useState } from "react";
import { api } from "../../lib/axios.config";
import type { IPost } from "../../types/user.types";
import PostCard from "../../components/post/post-card";

export default function HomeFeed() {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data } = await api.get("/posts");
        setPosts(data.payload || []);
      } catch (error) {
        console.error("Error fetching feed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-8 pt-4 w-full max-w-[470px] mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full flex flex-col gap-3">
            <div className="flex items-center gap-3 px-3">
              <div className="w-8 h-8 rounded-full bg-neutral-900 animate-pulse" />
              <div className="w-24 h-4 rounded bg-neutral-900 animate-pulse" />
            </div>
            <div className="w-full aspect-square bg-neutral-900 animate-pulse rounded-sm" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-4 w-full mx-auto animate-in fade-in duration-500 pb-20 md:pb-0">
      {posts.length > 0 ? (
        posts.map((post) => <PostCard key={post._id} post={post} />)
      ) : (
        <div className="text-neutral-500 mt-10">Լրահոսը դատարկ է:</div>
      )}
    </div>
  );
}
