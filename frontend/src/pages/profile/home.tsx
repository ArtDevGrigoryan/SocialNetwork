import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import { ProfileHeader } from "./profile-header";
import { ProfileTabs } from "./profile-tabs";
import { PostGrid } from "./post-grid";
import { PostModal } from "./post-modal";
import { UsersModal } from "./users-modal";
import type { IPost, IUser } from "../../types/user.types";

export const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuthStore();

  const [targetUser, setTargetUser] = useState<IUser | null>(null);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);

  // MODALS STATE
  const [selectedPost, setSelectedPost] = useState<IPost | null>(null);
  const [usersModal, setUsersModal] = useState<{
    open: boolean;
    title: string;
    type: "followers" | "followings";
    data: any[];
    loading: boolean;
  }>({
    open: false,
    title: "",
    type: "followers",
    data: [],
    loading: false,
  });

  const [activeTab, setActiveTab] = useState("posts");
  const isOwner = currentUser?._id === id;

  const fetchData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [userRes, postsRes] = await Promise.all([
        api.get(`/users/${id}`),
        api.get(`/posts?author=${id}`),
      ]);
      setTargetUser(userRes.data.payload);
      setPosts(postsRes.data.payload);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // FOLLOWERS / FOLLOWING FETCH LOGIC
  const handleFetchUsers = async (type: "followers" | "followings") => {
    setUsersModal((prev) => ({
      ...prev,
      open: true,
      title: type === "followers" ? "Followers" : "Following",
      type,
      loading: true,
    }));
    try {
      const { data } = await api.get(`/friends/${type}/${id}`);
      setUsersModal((prev) => ({
        ...prev,
        data: data.payload || [],
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsersModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="max-w-[935px] mx-auto w-full pb-12 animate-in fade-in duration-500">
      <ProfileHeader
        user={isOwner ? currentUser : targetUser}
        isOwner={isOwner}
        postsCount={posts.length}
        onFollowersClick={() => handleFetchUsers("followers")}
        onFollowingClick={() => handleFetchUsers("followings")}
        refreshData={fetchData}
      />

      <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-4 px-px md:px-0">
        {loading ? (
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square bg-neutral-900 animate-pulse rounded-sm"
              />
            ))}
          </div>
        ) : (
          <PostGrid
            posts={posts}
            onPostClick={(post) => setSelectedPost(post)}
          />
        )}
      </div>

      {/* 1. POST DETAIL MODAL */}
      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}

      {/* 2. FOLLOWERS / FOLLOWING MODAL */}
      <UsersModal
        isOpen={usersModal.open}
        onClose={() => setUsersModal((prev) => ({ ...prev, open: false }))}
        title={usersModal.title}
        users={usersModal.data}
        type={usersModal.type}
        loading={usersModal.loading}
      />
    </div>
  );
};

export default Profile;
