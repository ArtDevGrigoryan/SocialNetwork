import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, Settings, UserPlus, MessageCircle, Lock } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import { useStoryStore } from "../../store/story.store";
import type { IUser, IPost } from "../../types/user.types";
import { InteractiveAvatar } from "../../components/ui/interactive-avatar";
import { HighlightsBar } from "../../components/profile/highlights-bar";
import ConnectionsModal from "../../components/profile/connections-modal";
import PostGrid from "../../components/post/post-grid";
import { PostModal } from "../../components/post/post-modal";
import StoryViewer from "../../components/story/story-viewer";
import AvatarModal from "../../components/profile/avatar-modal";
import toast from "react-hot-toast";

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { myStoriesCount, hasUnseenMyStory, otherStories, fetchFeed } =
    useStoryStore();

  const [profileUser, setProfileUser] = useState<
    (IUser & { isFollowing?: boolean; requestStatus?: string | null }) | null
  >(null);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeStoryUserId, setActiveStoryUserId] = useState<string | null>(
    null,
  );
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const [connectionsModal, setConnectionsModal] = useState<{
    isOpen: boolean;
    type: "followers" | "followings";
    title: string;
  }>({
    isOpen: false,
    type: "followers",
    title: "Followers",
  });
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(
    null,
  );

  const isOwner = currentUser?._id === id;

  useEffect(() => {
    if (id) {
      fetchUserProfile();
      fetchUserPosts();
      fetchFeed(id);
    }
  }, [id, fetchFeed]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users/${id}`);
      setProfileUser(data.payload);
    } catch (error) {
      toast.error("User not found");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    setPostsLoading(true);
    try {
      const { data } = await api.get(`/posts?author=${id}&limit=50`);
      setPosts(data.payload || []);
    } catch (error) {
      console.error(error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profileUser) return;
    try {
      if (profileUser.isFollowing) {
        await api.post(`/friends/unfollow/${id}`);
        setProfileUser({
          ...profileUser,
          isFollowing: false,
          followersCount: Math.max(0, profileUser.followersCount - 1),
        });
      } else {
        await api.post(`/friends/follow/${id}`);
        setProfileUser({
          ...profileUser,
          isFollowing: true,
          followersCount: profileUser.followersCount + 1,
        });
      }
    } catch (error) {
      toast.error("Failed to update follow status");
    }
  };

  const handleMessageClick = async () => {
    try {
      const { data } = await api.post("/chats/dm", { userId: id });
      navigate(`/messages/${data.payload._id}`);
    } catch (error) {
      toast.error("Could not start a chat");
    }
  };

  const handleAvatarClick = () => {
    const hasStory = isOwner
      ? myStoriesCount > 0
      : otherStories.some((g) => g.user._id === id);
    if (hasStory) {
      setActiveStoryUserId(id!);
    } else {
      setIsAvatarModalOpen(true);
    }
  };

  const isPrivateAndNotFollowing =
    !isOwner &&
    profileUser?.settings?.profileVisibility === "PRIVATE" &&
    !profileUser.isFollowing;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-neutral-500 w-8 h-8" />
      </div>
    );
  }

  if (!profileUser) return null;

  return (
    <div className="max-w-[935px] mx-auto pb-20 pt-6 px-4 animate-in fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-10">
        <div className="shrink-0 mx-auto md:mx-0 md:ml-8 md:mr-16">
          <InteractiveAvatar
            avatarUrl={profileUser.avatar || "/default-avatar.png"}
            username={profileUser.username}
            onClick={handleAvatarClick}
            onLongPress={() => setIsAvatarModalOpen(true)}
            hasUnseenStory={
              isOwner
                ? hasUnseenMyStory
                : otherStories.some((g) => g.user._id === id && g.hasUnseen)
            }
            className="w-24 h-24 md:w-36 md:h-36"
          />
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h1 className="text-xl text-white font-semibold">
              {profileUser.username}
            </h1>
            <div className="flex items-center gap-2">
              {isOwner ? (
                <>
                  <button
                    onClick={() => navigate("/settings/edit-profile")}
                    className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition"
                  >
                    Edit profile
                  </button>
                  <button
                    onClick={() => navigate("/settings")}
                    className="p-1.5 text-white hover:bg-neutral-800 rounded-lg transition"
                  >
                    <Settings size={24} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleFollowToggle}
                    className={`px-6 py-1.5 rounded-lg text-sm font-semibold transition ${profileUser.isFollowing ? "bg-neutral-800 text-white hover:bg-neutral-700" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                  >
                    {profileUser.isFollowing ? "Following" : "Follow"}
                  </button>
                  {profileUser.isFollowing && (
                    <button
                      onClick={handleMessageClick}
                      className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition"
                    >
                      Message
                    </button>
                  )}
                  <button className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition">
                    <UserPlus size={18} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-6 text-white text-sm">
            <span>
              <span className="font-semibold">{posts.length}</span> posts
            </span>
            <button
              onClick={() =>
                setConnectionsModal({
                  isOpen: true,
                  type: "followers",
                  title: "Followers",
                })
              }
              className="hover:text-neutral-300"
            >
              <span className="font-semibold">
                {profileUser.followersCount}
              </span>{" "}
              followers
            </button>
            <button
              onClick={() =>
                setConnectionsModal({
                  isOpen: true,
                  type: "followings",
                  title: "Following",
                })
              }
              className="hover:text-neutral-300"
            >
              <span className="font-semibold">
                {profileUser.followingCount}
              </span>{" "}
              following
            </button>
          </div>

          <div className="text-sm">
            <p className="text-white font-semibold">{profileUser.fullName}</p>
            {profileUser.bio && (
              <p className="text-neutral-200 whitespace-pre-wrap">
                {profileUser.bio}
              </p>
            )}
            {profileUser.website && (
              <a
                href={profileUser.website}
                target="_blank"
                rel="noreferrer"
                className="text-blue-300 hover:underline font-medium block mt-1"
              >
                {profileUser.website}
              </a>
            )}
          </div>
        </div>
      </div>

      <HighlightsBar userId={id!} isOwner={isOwner} />

      <div className="border-t border-neutral-800 mt-6 pt-4">
        {isPrivateAndNotFollowing ? (
          <div className="flex flex-col items-center justify-center py-20 text-neutral-500 text-center">
            <div className="w-16 h-16 rounded-full border border-neutral-700 flex items-center justify-center mb-4">
              <Lock size={32} className="text-neutral-400" />
            </div>
            <h2 className="text-white font-bold text-lg mb-2">
              This Account is Private
            </h2>
            <p className="text-sm max-w-xs">
              Follow this account to see their photos and videos.
            </p>
          </div>
        ) : postsLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-neutral-500 w-8 h-8" />
          </div>
        ) : (
          <PostGrid
            posts={posts as any}
            onPostClick={(post) =>
              setSelectedPostIndex(posts.findIndex((p) => p._id === post._id))
            }
          />
        )}
      </div>

      <ConnectionsModal
        isOpen={connectionsModal.isOpen}
        onClose={() =>
          setConnectionsModal({ ...connectionsModal, isOpen: false })
        }
        userId={id!}
        type={connectionsModal.type}
        title={connectionsModal.title}
      />

      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        avatarUrl={profileUser.avatar || "/default-avatar.png"}
        username={profileUser.username}
      />

      {activeStoryUserId && (
        <StoryViewer
          userId={activeStoryUserId}
          onClose={() => setActiveStoryUserId(null)}
        />
      )}

      {selectedPostIndex !== null && (
        <PostModal
          posts={posts}
          initialIndex={selectedPostIndex}
          onClose={() => setSelectedPostIndex(null)}
        />
      )}
    </div>
  );
}
