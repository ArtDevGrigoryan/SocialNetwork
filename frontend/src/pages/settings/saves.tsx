import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../../lib/axios.config";
import PostGrid from "../../components/post/post-grid";
import { PostModal } from "../../components/post/post-modal";
import type { IPost } from "../../types/user.types";

export default function SavesSettings() {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    const fetchSaves = async () => {
      try {
        const { data } = await api.get("/saves?limit=50");
        setPosts((data.payload || []).map((s: any) => s.post).filter(Boolean));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSaves();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-2xl font-bold text-white hidden md:block mb-6">
        Saved
      </h2>
      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="animate-spin text-neutral-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-neutral-500 py-10">
          No saved posts found.
        </div>
      ) : (
        <PostGrid
          posts={posts as any}
          onPostClick={(post) =>
            setSelectedPostIndex(posts.findIndex((p) => p._id === post._id))
          }
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
