import { useEffect, useState } from "react";
import { api } from "../../lib/axios.config";
import { useParams } from "react-router-dom";
import { ProfileHeader } from "./profile-header";
import { ProfileTabs } from "./profile-tabs";
import { PostGrid } from "./post-grid";

export const Profile = () => {
  const { id } = useParams();
  const [posts, setPosts] = useState<any[]>([]);
  const [reposts, setReposts] = useState<any[]>([]);
  const fetchPosts = async () => {
    try {
      const params = new URLSearchParams();
      params.append("author", id || "");
      const [{ data: postData }, { data: repostData }] = await Promise.all([
        api.get(`/posts?${params.toString()}`),
        api.get(`/reposts/`),
      ]);
      setPosts(postData.payload);
      setReposts(repostData.payload);
    } catch (error) {
      console.error("Failed to fetch posts", error);
    }
  };

  useEffect(() => {
    if (id) fetchPosts();
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto w-full pb-12">
      <ProfileHeader />
      <ProfileTabs />
      <PostGrid posts={posts} />
    </div>
  );
};

export default Profile;
