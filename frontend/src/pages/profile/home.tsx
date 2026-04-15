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

  // Օգտատիրոջ տվյալների վիճակ (State)
  const [targetUser, setTargetUser] = useState<IUser | null>(null);

  // Ներդիրների (Tabs) վիճակ (State)
  const [activeTab, setActiveTab] = useState("posts");
  const [tabData, setTabData] = useState<IPost[]>([]);
  const [loadingTab, setLoadingTab] = useState(true);

  // Մոդալների վիճակ (Modals State)
  const [selectedPost, setSelectedPost] = useState<IPost | null>(null);
  const [usersModal, setUsersModal] = useState({
    open: false,
    title: "",
    type: "followers" as "followers" | "followings",
    data: [],
    loading: false,
  });

  const isOwner = currentUser?._id === id;

  // 1. Բեռնում ենք միայն պրոֆիլի սեփականատիրոջ տվյալները
  const fetchUser = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/users/${id}`);
      setTargetUser(data.payload);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // 2. Դինամիկ բեռնում ենք Գրիդի (Grid) տվյալները՝ ըստ ակտիվ ներդիրի
  useEffect(() => {
    const fetchTabData = async () => {
      if (!id) return;

      setLoadingTab(true);
      setTabData([]); // Մաքրում ենք նախորդ գրիդը անիմացիայի համար

      try {
        let res;

        // Հիմնված api.js-ի վրա
        if (activeTab === "posts") {
          res = await api.get(`/posts?author=${id}`);
          setTabData(res.data.payload || []);
        } else if (activeTab === "saved" && isOwner) {
          res = await api.get(`/saves`);
          // Ենթադրելով, որ save ռոութը վերադարձնում է մոդելներ՝ populate արված post դաշտով
          const extractedPosts = (res.data.payload || []).map(
            (item: any) => item.post || item,
          );
          setTabData(extractedPosts);
        } else if (activeTab === "reposts") {
          res = await api.get(`/reposts?user=${id}`);
          // Նույն տրամաբանությունը repost-ների համար
          const extractedPosts = (res.data.payload || []).map(
            (item: any) => item.post || item,
          );
          setTabData(extractedPosts);
        }
      } catch (error) {
        console.error(`Error fetching ${activeTab}:`, error);
        setTabData([]);
      } finally {
        setLoadingTab(false);
      }
    };

    fetchTabData();
  }, [activeTab, id, isOwner]);

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
        postsCount={targetUser?.postsCount || 0}
        onFollowersClick={() => handleFetchUsers("followers")}
        onFollowingClick={() => handleFetchUsers("followings")}
        refreshData={fetchUser}
      />

      <ProfileTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOwner={isOwner}
      />

      {/* Grid Բեռնման Վիճակ */}
      <div className="mt-4 px-px md:px-0 min-h-[300px]">
        {loadingTab ? (
          <div className="grid grid-cols-3 gap-1 md:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square bg-neutral-900 animate-pulse rounded-sm"
              />
            ))}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PostGrid
              posts={tabData}
              onPostClick={(post) => setSelectedPost(post)}
            />
          </div>
        )}
      </div>

      {selectedPost && (
        <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}

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
