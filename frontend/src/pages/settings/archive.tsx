import { useEffect, useRef, useCallback, useState } from "react";
import { Loader2, Play, Eye, Trash2 } from "lucide-react";
import { useArchiveStore } from "../../store/archive.store";
import ArchiveStoryViewer from "../../components/story/archive-story-viewer";

export default function ArchivePage() {
  const {
    archives,
    loading,
    loadingMore,
    hasMore,
    fetchArchives,
    deleteArchive,
  } = useArchiveStore();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchArchives(true);
  }, [fetchArchives]);

  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading || loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchArchives();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [loading, loadingMore, hasMore, fetchArchives],
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (
      window.confirm(
        "Are you sure you want to delete this story from your archive?",
      )
    ) {
      deleteArchive(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full animate-in fade-in">
      <div className="hidden md:flex mb-6 border-b border-neutral-800 pb-4 items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Story Archive</h1>
          <p className="text-sm text-neutral-400 mt-1">
            Only you can see your memories and archived stories.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-neutral-500 w-8 h-8" />
        </div>
      ) : archives.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/40 rounded-2xl border border-neutral-800 border-dashed">
          <div className="text-neutral-400 text-sm">No archived stories</div>
          <div className="text-neutral-500 text-xs mt-1">
            Stories you post will appear here after 24 hours.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 md:gap-3">
          {archives.map((item, index) => {
            const isLast = index === archives.length - 1;
            const bgImage =
              item.media.type === "video" && item.media.thumbnail
                ? item.media.thumbnail
                : item.media.url;

            return (
              <div
                key={item._id}
                ref={isLast ? lastElementRef : null}
                className="relative group aspect-[9/16] bg-neutral-800 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setViewerIndex(index)}
              >
                <img
                  src={bgImage?.toString() || "/default-bg.png"}
                  alt="Story Archive"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />

                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 opacity-80" />

                <span className="absolute top-2 left-2 text-white text-[11px] font-bold drop-shadow-md bg-black/30 px-1.5 py-0.5 rounded">
                  {formatDate(item.createdAt)}
                </span>

                {item.media.type === "video" && (
                  <Play className="absolute top-2 right-2 text-white w-4 h-4 drop-shadow-md fill-white" />
                )}

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-white text-[12px] font-medium drop-shadow-md">
                    <Eye className="w-3.5 h-3.5" />
                    {item.viewsCount}
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, item._id)}
                    className="p-1.5 bg-black/50 hover:bg-red-500/80 rounded-full text-white transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {viewerIndex !== null && (
        <ArchiveStoryViewer
          archives={archives as any}
          initialIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
      {loadingMore && (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-neutral-500 w-6 h-6" />
        </div>
      )}
    </div>
  );
}
