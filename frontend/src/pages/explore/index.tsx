import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Loader2, Search, X } from "lucide-react";
import { api } from "../../lib/axios.config";
import { PostGrid } from "../../components/post/post-grid";
import { PostModal } from "../../components/post/post-modal";
import type { IPost, IUser } from "../../types/user.types";

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPostId = searchParams.get("postId");

  // Explore Posts State
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(
    null,
  );

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- 1. Explore Posts Logic ---
  const fetchExplorePosts = useCallback(
    async (pageNum: number) => {
      try {
        if (pageNum === 1) setLoading(true);
        else setFetchingMore(true);

        const { data } = await api.get(
          `/explore/posts?page=${pageNum}&limit=18`,
        );
        let fetchedPosts: IPost[] = data.payload || [];

        if (pageNum === 1 && initialPostId) {
          try {
            const { data: singleData } = await api.get(
              `/posts/${initialPostId}`,
            );
            const targetPost = singleData.payload;
            if (targetPost) {
              fetchedPosts = fetchedPosts.filter(
                (p) => p._id !== targetPost._id,
              );
              fetchedPosts = [targetPost, ...fetchedPosts];
            }
          } catch (err) {
            console.error("Target post not found", err);
          }
        }

        if (fetchedPosts.length < 18) setHasMore(false);

        setPosts((prev) =>
          pageNum === 1 ? fetchedPosts : [...prev, ...fetchedPosts],
        );

        if (pageNum === 1 && initialPostId) {
          setSelectedPostIndex(0);
        }
      } catch (error) {
        console.error("Failed to fetch explore posts", error);
      } finally {
        setLoading(false);
        setFetchingMore(false);
      }
    },
    [initialPostId],
  );

  useEffect(() => {
    fetchExplorePosts(page);
  }, [page, fetchExplorePosts]);

  // Infinite Scroll for Explore
  useEffect(() => {
    if (searchQuery.trim().length > 0) return; // Disable post scroll if searching

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } =
        document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 100) {
        if (hasMore && !fetchingMore && !loading) {
          setPage((p) => p + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, fetchingMore, loading, searchQuery]);

  const handlePostClick = (post: IPost) => {
    const idx = posts.findIndex((p) => p._id === post._id);
    setSelectedPostIndex(idx !== -1 ? idx : 0);
  };

  const handleCloseModal = () => {
    setSelectedPostIndex(null);
    if (initialPostId) {
      searchParams.delete("postId");
      setSearchParams(searchParams, { replace: true });
    }
  };

  // --- 2. Search Logic (Debounced) ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await api.get(`/friends/search?search=${searchQuery}`);
        setSearchResults(data.payload || []);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="w-full max-w-[935px] mx-auto pb-20 pt-4 px-2 md:px-4 animate-in fade-in">
      {/* Search Bar UI */}
      <div className="mb-6 relative w-full max-w-[500px] mx-auto z-10">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-neutral-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for friends..."
          className="w-full bg-neutral-900 border border-neutral-800 text-white rounded-2xl py-3 pl-11 pr-10 outline-none focus:bg-neutral-800 focus:border-neutral-600 transition-colors shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Conditional Rendering: Search Results vs Explore Grid */}
      {searchQuery.trim().length > 0 ? (
        <div className="max-w-[500px] mx-auto mt-2">
          <h2 className="text-white font-semibold mb-4 ml-1">Search Results</h2>
          {isSearching ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-neutral-500 w-8 h-8" />
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center text-neutral-500 py-10">
              No users found for "{searchQuery}"
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {searchResults.map((user) => (
                <Link
                  to={`/profile/${user._id}`}
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar || "/default-avatar.png"}
                      alt={user.username}
                      className="w-12 h-12 rounded-full object-cover border border-neutral-700"
                    />
                    <div className="flex flex-col">
                      <span className="text-white font-semibold text-sm">
                        {user.username}
                      </span>
                      {user.bio && (
                        <span className="text-neutral-400 text-xs truncate max-w-[200px]">
                          {user.bio}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Original Explore Grid */}
          {loading && page === 1 ? (
            <div className="flex justify-center items-center min-h-[50vh]">
              <Loader2 className="animate-spin text-neutral-500 w-8 h-8" />
            </div>
          ) : (
            <>
              <PostGrid posts={posts} onPostClick={handlePostClick} />

              {fetchingMore && (
                <div className="flex justify-center my-6">
                  <Loader2 className="animate-spin text-neutral-500 w-6 h-6" />
                </div>
              )}

              {selectedPostIndex !== null && (
                <PostModal
                  posts={posts}
                  initialIndex={selectedPostIndex}
                  onClose={handleCloseModal}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
