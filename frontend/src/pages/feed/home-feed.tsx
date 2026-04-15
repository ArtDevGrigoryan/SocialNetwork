import { useEffect, useState } from "react";
import { api } from "../../lib/axios.config";
import type { IPost } from "../../types/user.types";
import PostCard from "../../components/post/post-card";
import StoryBar from "../../components/story/story-bar"; // <--- Ներմուծում

export default function HomeFeed() {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);

  // ... (useEffect-ը մնում է նույնը) ...

  return (
    <div className="flex flex-col items-center pt-4 w-full max-w-[470px] mx-auto animate-in fade-in duration-500 pb-20 md:pb-0">
      {/* ԱՎԵԼԱՑՎԱԾ ՍԹՈՐԻՆԵՐԻ ՎԱՀԱՆԱԿ */}
      <StoryBar />

      {loading ? (
        <div className="flex flex-col items-center gap-8 pt-4 w-full">
          {/* ... loading skeletons ... */}
        </div>
      ) : posts.length > 0 ? (
        posts.map((post) => <PostCard key={post._id} post={post} />)
      ) : (
        <div className="text-neutral-500 mt-10">Լրահոսը դատարկ է:</div>
      )}
    </div>
  );
}
