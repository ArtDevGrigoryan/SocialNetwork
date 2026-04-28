import { useState, useEffect } from "react";
import { Search, Loader2, Play, Heart, MessageCircle } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useNavigate } from "react-router-dom";

interface ExploreItem {
  _id: string;
  type: "image" | "video";
  mediaUrl: string;
  likesCount: number;
  commentsCount: number;
}

interface UserResult {
  _id: string;
  username: string;
  fullName?: string;
  avatar?: string;
}

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState<UserResult[]>([]);

  const [explorePosts, setExplorePosts] = useState<ExploreItem[]>([]);
  const [loadingExplore, setLoadingExplore] = useState(true);

  useEffect(() => {
    const fetchExplore = async () => {
      setLoadingExplore(true);
      try {
        const { data } = await api.get("/posts/explore");
        setExplorePosts(data.payload || []);
      } catch (error) {
        console.error("Failed to fetch explore feed", error);
      } finally {
        setLoadingExplore(false);
      }
    };
    fetchExplore();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true);
        try {
          const { data } = await api.get(
            `/users/search?q=${encodeURIComponent(query)}`,
          );
          setUsers(data.payload || []);
        } catch (error) {
          console.error("Search error", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setUsers([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="max-w-[935px] mx-auto pt-6 pb-20 w-full h-full flex flex-col">
      {/* Search Input */}
      <div className="px-4 mb-6">
        <div className="relative w-full max-w-[400px] mx-auto md:mx-0">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={18} className="text-neutral-500" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-[#262626] text-white text-sm rounded-lg py-2.5 pl-10 pr-4 outline-none border border-transparent focus:border-neutral-600 transition"
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <Loader2 size={16} className="text-neutral-400 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Results or Explore Grid */}
      {query.trim().length > 0 ? (
        <div className="flex-1 px-4 overflow-y-auto custom-scrollbar">
          {users.length > 0 ? (
            <div className="flex flex-col gap-3">
              {users.map((u) => (
                <div
                  key={u._id}
                  onClick={() => navigate(`/profile/${u._id}`)}
                  className="flex items-center gap-3 p-2 hover:bg-neutral-900 rounded-lg cursor-pointer transition"
                >
                  <img
                    src={u.avatar || "/default-avatar.png"}
                    alt="avatar"
                    className="w-12 h-12 rounded-full object-cover border border-neutral-800"
                  />
                  <div className="flex flex-col">
                    <span className="text-white text-sm font-semibold">
                      {u.username}
                    </span>
                    {u.fullName && (
                      <span className="text-neutral-500 text-sm">
                        {u.fullName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !isSearching && (
              <div className="text-center text-neutral-500 mt-10">
                No users found.
              </div>
            )
          )}
        </div>
      ) : (
        <div className="flex-1 px-2 md:px-0">
          {loadingExplore ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 size={32} className="text-neutral-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 md:gap-2 auto-rows-[120px] md:auto-rows-[300px]">
              {explorePosts.map((post, index) => {
                // Ամեն 5-րդ element-ը դարձնում ենք մեծ (2x2 grid span) եթե վիդեո է
                const isLarge = post.type === "video" && index % 5 === 0;

                return (
                  <div
                    key={post._id}
                    onClick={() => navigate(`/post/${post._id}`)}
                    className={`relative bg-neutral-900 group cursor-pointer overflow-hidden ${isLarge ? "col-span-2 row-span-2" : "col-span-1 row-span-1"}`}
                  >
                    {post.type === "video" ? (
                      <>
                        <video
                          src={post.mediaUrl}
                          className="w-full h-full object-cover"
                          loop
                          muted
                          playsInline
                        />
                        <div className="absolute top-2 right-2 bg-black/40 rounded-full p-1 backdrop-blur-sm">
                          <Play size={16} className="text-white fill-current" />
                        </div>
                      </>
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt="Explore"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-6">
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <Heart size={20} className="fill-current" />
                        <span>{post.likesCount}</span>
                      </div>
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <MessageCircle size={20} className="fill-current" />
                        <span>{post.commentsCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
