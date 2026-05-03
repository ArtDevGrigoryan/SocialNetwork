import { useEffect, useState } from "react";
import { Clock, Grid, Loader2 } from "lucide-react";
import { useArchiveStore } from "../../store/archive.store";
import ArchiveStoryViewer from "../../components/story/archive-story-viewer";
import { PostGrid } from "../../components/post/post-grid";
import { PostModal } from "../../components/post/post-modal";

export default function ArchiveSettings() {
  const {
    archives,
    loading,
    fetchArchives,
    archivedPosts,
    loadingPosts,
    fetchArchivedPosts,
  } = useArchiveStore();

  const [activeTab, setActiveTab] = useState<"stories" | "posts">("stories");
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(
    null,
  );
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    fetchArchives(true);
    fetchArchivedPosts(1);
  }, [fetchArchives, fetchArchivedPosts]);

  return (
    <div className="max-w-[935px] mx-auto animate-in fade-in pb-20 pt-4 md:pt-0">
      <h2 className="text-2xl font-bold text-white mb-6 hidden md:block px-4">
        Archive
      </h2>

      {/* Tabs */}
      <div className="flex justify-center border-b border-neutral-800 mb-2">
        <div className="flex items-center gap-12">
          <button
            onClick={() => setActiveTab("stories")}
            className={`flex items-center gap-2 py-4 border-t-2 transition-colors ${
              activeTab === "stories"
                ? "border-white text-white"
                : "border-transparent text-neutral-500 hover:text-white"
            }`}
          >
            <Clock size={16} />
            <span className="text-xs font-semibold tracking-widest uppercase">
              Stories
            </span>
          </button>

          <button
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-2 py-4 border-t-2 transition-colors ${
              activeTab === "posts"
                ? "border-white text-white"
                : "border-transparent text-neutral-500 hover:text-white"
            }`}
          >
            <Grid size={16} />
            <span className="text-xs font-semibold tracking-widest uppercase">
              Posts
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-1 md:px-0">
        {activeTab === "stories" && (
          <>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
              </div>
            ) : archives.length === 0 ? (
              <div className="text-center py-20 text-neutral-500">
                <Clock size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-bold text-white mb-2">
                  No Archived Stories
                </p>
                <p className="text-sm">
                  Your expired stories will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-[2px]">
                {archives.map((story, index) => (
                  <div
                    key={story._id}
                    onClick={() => setSelectedStoryIndex(index)}
                    className="relative aspect-[9/16] bg-neutral-900 cursor-pointer group overflow-hidden"
                  >
                    {story.media.type === "video" ? (
                      <video
                        src={story.media.url}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={story.media.thumbnail || story.media.url}
                        alt="Archive"
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded">
                      {new Date(story.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "posts" && (
          <>
            {loadingPosts ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-500" />
              </div>
            ) : archivedPosts.length === 0 ? (
              <div className="text-center py-20 text-neutral-500">
                <Grid size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-bold text-white mb-2">
                  No Archived Posts
                </p>
                <p className="text-sm">Posts you archive will appear here.</p>
              </div>
            ) : (
              <PostGrid
                posts={archivedPosts}
                onPostClick={(post) => {
                  const idx = archivedPosts.findIndex(
                    (p) => p._id === post._id,
                  );
                  setSelectedPostIndex(idx !== -1 ? idx : 0);
                }}
              />
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {selectedStoryIndex !== null && (
        <ArchiveStoryViewer
          archives={archives}
          isOwner={true}
          initialIndex={selectedStoryIndex}
          onClose={() => setSelectedStoryIndex(null)}
        />
      )}

      {selectedPostIndex !== null && (
        <PostModal
          posts={archivedPosts}
          initialIndex={selectedPostIndex}
          onClose={() => setSelectedPostIndex(null)}
        />
      )}
    </div>
  );
}
