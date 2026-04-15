import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/axios.config";
import type { IPost } from "../../types/user.types";
import PostCard from "../../components/post/post-card";
import StoryBar from "../../components/story/story-bar";
import type { IResponse } from "../../types/api.types";

export default function HomeFeed() {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchPosts = useCallback(async (pageToLoad: number, append = false) => {
    try {
      const { data } = await api.get<IResponse<IPost[]>>("/posts", {
        params: { page: pageToLoad, limit: 10 },
      });

      const incoming = data.payload || [];
      setPosts((prev) => (append ? [...prev, ...incoming] : incoming));
      setHasMore(incoming.length === 10);
      setPage(pageToLoad);
    } catch (error) {
      console.error("Error loading feed:", error);
      if (!append) {
        setPosts([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPosts(1, false);
  }, [fetchPosts]);

  useEffect(() => {
    const handlePostCreated = () => {
      fetchPosts(1, false);
    };
    window.addEventListener("posts:created", handlePostCreated);
    return () => window.removeEventListener("posts:created", handlePostCreated);
  }, [fetchPosts]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry.isIntersecting || loading || loadingMore) return;
        setLoadingMore(true);
        fetchPosts(page + 1, true);
      },
      { threshold: 0.6 },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [fetchPosts, hasMore, loading, loadingMore, page]);

  return (
    <div className="flex flex-col items-center pt-4 w-full max-w-[470px] mx-auto animate-in fade-in duration-500 pb-20 md:pb-0 bg-black">
      <StoryBar />

      {loading ? (
        <div className="flex flex-col items-center gap-8 pt-4 w-full">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="w-full space-y-2">
              <div className="h-10 bg-neutral-900 rounded animate-pulse" />
              <div className="aspect-square bg-neutral-900 rounded animate-pulse" />
              <div className="h-16 bg-neutral-900 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : posts.length > 0 ? (
        <>
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
          <div ref={sentinelRef} className="h-8 w-full" />
          {loadingMore && (
            <div className="py-4 text-sm text-neutral-500">Loading more...</div>
          )}
        </>
      ) : (
        <div className="text-neutral-500 mt-10">Feed is empty.</div>
      )}
    </div>
  );
}
