import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Grid, Bookmark, Settings, Repeat } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import { useStoryStore } from "../../store/story.store";
import { useLongPress } from "../../hooks/use-long-press";

import { HighlightsBar } from "../../components/profile/highlights-bar";
import AvatarModal from "../../components/profile/avatar-modal";
import ConnectionsModal from "../../components/profile/connections-modal";
import PostGrid from "../../components/post/post-grid";
import { PostModal } from "../../components/post/post-modal";
import type { IUser, IPost } from "../../types/user.types";

type TabType = "posts" | "saved" | "reposts";

export default function ProfilePage() {
  const { id } = useParams();
  const currentUser = useAuthStore((state) => state.user);
  const { setViewingUserId } = useStoryStore();

  const [profileUser, setProfileUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveStory, setHasActiveStory] = useState(false);

  // Պոստերի State
  const [posts, setPosts] = useState<IPost[]>([]);
  const [savedPosts, setSavedPosts] = useState<IPost[]>([]);
  const [reposts, setReposts] = useState<IPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(
    null,
  );

  // Մոդալների State
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [connectionsConfig, setConnectionsConfig] = useState<{
    isOpen: boolean;
    type: "followers" | "followings";
    title: string;
  }>({
    isOpen: false,
    type: "followers",
    title: "",
  });

  const isOwner = currentUser?._id === id;

  useEffect(() => {
    const fetchProfileAndPosts = async () => {
      if (!id) return;
      try {
        setLoading(true);

        // 1. Profile Data
        const { data: userData } = await api.get(`/users/${id}`);
        setProfileUser(userData.payload);

        // 2. Active Stories Check
        const { data: storiesData } = await api.get(`/stories/user/${id}`);
        setHasActiveStory((storiesData.payload || []).length > 0);

        // 3. User Posts
        setLoadingPosts(true);
        const { data: postsData } = await api.get(
          `/posts?author=${id}&limit=50`,
        );
        setPosts(postsData.payload || []);

        // 4. Reposts Data
        const { data: repostsData } = await api.get(`/reposts/${id}?limit=50`);
        setReposts(
          (repostsData.payload || [])
            .map((r: any) => ({ ...r.post, isReposted: true }))
            .filter((p: any) => p && p._id),
        );

        // 5. Saved Posts (Միայն եթե owner-ն է)
        if (currentUser?._id === id) {
          const { data: savedData } = await api.get("/saves?limit=50");
          setSavedPosts(
            (savedData.payload || []).map((s: any) => s.post).filter(Boolean),
          );
        }
      } catch (error) {
        console.error("Failed to load profile data", error);
      } finally {
        setLoading(false);
        setLoadingPosts(false);
      }
    };

    fetchProfileAndPosts();
  }, [id, currentUser?._id]);

  // Avatar Click Handlers
  const handleAvatarClick = () => {
    if (hasActiveStory) {
      setViewingUserId(id || null);
    } else {
      setShowAvatarModal(true);
    }
  };

  const handleAvatarLongPress = () => {
    setShowAvatarModal(true);
  };

  const avatarLongPressProps = useLongPress(
    handleAvatarLongPress,
    handleAvatarClick,
    { delay: 400 },
  );

  // Post Click Handler
  const handlePostClick = (post: any) => {
    const currentList =
      activeTab === "posts"
        ? posts
        : activeTab === "saved"
          ? savedPosts
          : reposts;
    const index = currentList.findIndex((p) => p._id === post._id);
    if (index !== -1) {
      setSelectedPostIndex(index);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
      </div>
    );
  }

  if (!profileUser)
    return <div className="text-center text-white mt-10">User not found</div>;

  const currentPostsList =
    activeTab === "posts"
      ? posts
      : activeTab === "saved"
        ? savedPosts
        : reposts;

  return (
    <div className="w-full max-w-[935px] mx-auto pt-6 px-4 pb-20 animate-in fade-in">
      {/* ԳԼԽԱՎՈՐ ԻՆՖՈՐՄԱՑԻԱ */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-20 mb-10">
        {/* AVATAR */}
        <div className="flex-shrink-0 mx-auto md:mx-0">
          <div
            {...avatarLongPressProps}
            className={`relative rounded-full cursor-pointer transition-transform active:scale-95 ${
              hasActiveStory
                ? "p-[3px] bg-gradient-to-tr from-yellow-400 via-rose-500 to-fuchsia-600"
                : "p-[1px] border border-neutral-700"
            }`}
          >
            <div className="bg-black rounded-full p-[3px] w-24 h-24 md:w-36 md:h-36">
              <img
                src={profileUser.avatar || "/default-avatar.png"}
                alt="Profile"
                className="w-full h-full rounded-full object-cover bg-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* DETAILS */}
        <div className="flex-1 flex flex-col gap-4 items-center md:items-start w-full">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <h1 className="text-xl text-white font-medium">
              {profileUser.username}
            </h1>
            {isOwner ? (
              <div className="flex gap-2 items-center mt-2 md:mt-0">
                <Link
                  to="/settings/edit-profile"
                  className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-semibold transition"
                >
                  Edit Profile
                </Link>
                <Link
                  to="/settings/archive"
                  className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-semibold transition"
                >
                  View Archive
                </Link>
                <Link
                  to="/settings"
                  className="p-1.5 hover:bg-neutral-800 rounded-lg transition"
                >
                  <Settings size={24} />
                </Link>
              </div>
            ) : (
              <div className="flex gap-2 items-center mt-2 md:mt-0">
                <button className="px-6 py-1.5 bg-[#0095f6] hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition">
                  Follow
                </button>
                <button className="px-6 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-sm font-semibold transition">
                  Message
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-8 text-white w-full justify-center md:justify-start py-2 border-y border-neutral-800 md:border-none">
            <div className="flex flex-col md:flex-row items-center gap-1">
              <span className="font-bold">
                {profileUser.postsCount || posts.length}
              </span>
              <span className="text-neutral-400 md:text-white">posts</span>
            </div>

            <div
              className="flex flex-col md:flex-row items-center gap-1 cursor-pointer hover:text-neutral-300 transition-colors"
              onClick={() =>
                setConnectionsConfig({
                  isOpen: true,
                  type: "followers",
                  title: "Followers",
                })
              }
            >
              <span className="font-bold">{profileUser.followersCount}</span>
              <span className="text-neutral-400 md:text-white">followers</span>
            </div>

            <div
              className="flex flex-col md:flex-row items-center gap-1 cursor-pointer hover:text-neutral-300 transition-colors"
              onClick={() =>
                setConnectionsConfig({
                  isOpen: true,
                  type: "followings",
                  title: "Following",
                })
              }
            >
              <span className="font-bold">{profileUser.followingCount}</span>
              <span className="text-neutral-400 md:text-white">following</span>
            </div>
          </div>

          <div className="text-sm text-white mt-1 text-center md:text-left">
            <p className="font-semibold">
              {profileUser.fullName || profileUser.username}
            </p>
            <p className="whitespace-pre-wrap mt-1 text-neutral-200">
              {profileUser.bio}
            </p>
          </div>
        </div>
      </div>

      {/* HIGHLIGHTS BAR */}
      {id && <HighlightsBar userId={id} isOwner={isOwner} />}

      {/* TABS (Posts / Reposts / Saved) */}
      <div className="flex justify-center gap-10 border-t border-neutral-800 mt-6">
        <button
          onClick={() => setActiveTab("posts")}
          className={`flex items-center gap-2 py-4 text-xs font-semibold uppercase tracking-widest border-t-2 transition-colors ${activeTab === "posts" ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
        >
          <Grid size={14} /> Posts
        </button>
        <button
          onClick={() => setActiveTab("reposts")}
          className={`flex items-center gap-2 py-4 text-xs font-semibold uppercase tracking-widest border-t-2 transition-colors ${activeTab === "reposts" ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
        >
          <Repeat size={14} /> Reposts
        </button>
        {isOwner && (
          <button
            onClick={() => setActiveTab("saved")}
            className={`flex items-center gap-2 py-4 text-xs font-semibold uppercase tracking-widest border-t-2 transition-colors ${activeTab === "saved" ? "border-white text-white" : "border-transparent text-neutral-500 hover:text-neutral-300"}`}
          >
            <Bookmark size={14} /> Saved
          </button>
        )}
      </div>

      {/* POSTS GRID */}
      {loadingPosts ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
        </div>
      ) : (
        <PostGrid
          posts={currentPostsList as any}
          onPostClick={handlePostClick}
        />
      )}

      {/* MODALS */}
      <AvatarModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        avatarUrl={profileUser.avatar || "/default-avatar.png"}
        username={profileUser.username}
      />

      {id && (
        <ConnectionsModal
          isOpen={connectionsConfig.isOpen}
          onClose={() =>
            setConnectionsConfig((prev) => ({ ...prev, isOpen: false }))
          }
          userId={id}
          type={connectionsConfig.type}
          title={connectionsConfig.title}
        />
      )}

      {/* POST VIEWER MODAL */}
      {selectedPostIndex !== null && currentPostsList.length > 0 && (
        <PostModal
          posts={currentPostsList}
          initialIndex={selectedPostIndex}
          onClose={() => setSelectedPostIndex(null)}
        />
      )}
    </div>
  );
}
