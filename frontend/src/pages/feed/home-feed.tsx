import { useEffect, useState, useRef, useCallback } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { api } from "../../lib/axios.config";
import type { IPost } from "../../types/user.types";
import PostCard from "../../components/post/post-card";
import StoryBar from "../../components/story/story-bar";

export interface FeedPost extends IPost {
  isLiked?: boolean;
  isSaved?: boolean;
  viewer?: {
    isLiked: boolean;
    isSaved: boolean;
  };
}

interface PostsResponse {
  payload: FeedPost[];
}

export default function HomeFeed() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const observer = useRef<IntersectionObserver | null>(null);

  const lastPostElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore],
  );

  const fetchFeed = async (pageNumber: number) => {
    try {
      if (pageNumber === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const { data } = await api.get<PostsResponse>(
        `/posts?page=${pageNumber}&limit=10`,
      );
      const newPosts = data.payload || [];

      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) =>
          pageNumber === 1 ? newPosts : [...prev, ...newPosts],
        );
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFeed(page);
  }, [page]);

  useEffect(() => {
    const handlePostCreated = () => {
      setPage(1);
      setHasMore(true);
      fetchFeed(1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handlePostDeleted = (e: Event) => {
      const customEvent = e as CustomEvent<{ postId: string }>;
      if (customEvent.detail?.postId) {
        setPosts((prev) =>
          prev.filter((p) => p._id !== customEvent.detail.postId),
        );
      }
    };

    window.addEventListener("post:created", handlePostCreated);
    window.addEventListener("post:deleted", handlePostDeleted as EventListener);

    return () => {
      window.removeEventListener("post:created", handlePostCreated);
      window.removeEventListener(
        "post:deleted",
        handlePostDeleted as EventListener,
      );
    };
  }, []);

  if (loading && page === 1) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="max-w-[470px] mx-auto w-full pb-20 pt-4">
      <div className="mb-6">
        <StoryBar />
      </div>

      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map((post, index) => (
            <div
              key={post._id}
              ref={index === posts.length - 1 ? lastPostElementRef : null}
            >
              <PostCard post={post} />
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500 animate-in fade-in duration-500">
            <CheckCircle2 size={48} className="mb-4 text-neutral-700" />
            <p className="text-xl font-semibold text-white">
              You are all caught up
            </p>
            <p className="text-sm mt-2 text-center max-w-[250px]">
              You have seen all new posts from the accounts you follow.
            </p>
          </div>
        )}
      </div>

      {loadingMore && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
        </div>
      )}
    </div>
  );
}
