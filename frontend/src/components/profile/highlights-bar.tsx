import { useEffect, useState, useRef } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useHighlightStore } from "../../store/highlight.store";
import { api } from "../../lib/axios.config";
import ArchiveStoryViewer from "../story/archive-story-viewer";
import { CreateHighlightModal } from "./create-highlight-modal";
import toast from "react-hot-toast";

interface HighlightsBarProps {
  userId: string;
  isOwner: boolean;
}

export const HighlightsBar = ({ userId, isOwner }: HighlightsBarProps) => {
  const {
    highlights,
    loading,
    fetchUserHighlights,
    setCreateModalOpen,
    deleteHighlight,
  } = useHighlightStore();
  const [activeArchives, setActiveArchives] = useState<any[]>([]);
  const [viewingLoading, setViewingLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserHighlights(userId);
  }, [userId, fetchUserHighlights]);

  const handleScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const openHighlight = async (highlight: any) => {
    setViewingLoading(true);
    try {
      const { data } = await api.get(`/highlights/${highlight._id}`);
      setActiveArchives(data.payload.archives);
    } catch (error) {
      toast.error("Failed to load highlight");
    } finally {
      setViewingLoading(false);
    }
  };

  const handleContextMenu = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (isOwner && window.confirm("Delete this highlight?")) {
      try {
        await deleteHighlight(id);
        toast.success("Highlight deleted");
      } catch (error) {
        toast.error("Failed to delete highlight");
      }
    }
  };

  if (!loading && highlights.length === 0 && !isOwner) {
    return null;
  }

  return (
    <>
      <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>

      <div
        ref={scrollRef}
        onWheel={handleScroll}
        className="px-4 md:px-0 py-4 flex gap-4 overflow-x-auto hide-scroll snap-x border-b border-neutral-800 items-start"
      >
        {isOwner && (
          <div
            onClick={() => setCreateModalOpen(true)}
            className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group snap-start"
          >
            <div className="w-[66px] h-[66px] rounded-full border border-neutral-600 flex items-center justify-center group-hover:border-white transition-colors bg-neutral-900">
              <Plus
                size={28}
                className="text-neutral-400 group-hover:text-white transition-colors"
              />
            </div>
            <span className="text-xs font-semibold text-white">New</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="w-[66px] h-[66px] rounded-full bg-neutral-800 animate-pulse" />
                <div className="w-12 h-2 bg-neutral-800 rounded animate-pulse mt-1" />
              </div>
            ))}
          </div>
        ) : (
          highlights.map((highlight) => (
            <div
              key={highlight._id}
              onClick={() => openHighlight(highlight)}
              onContextMenu={(e) => handleContextMenu(e, highlight._id)}
              className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer snap-start transition-transform hover:scale-[1.02]"
            >
              <div className="w-[66px] h-[66px] rounded-full bg-neutral-800 border border-neutral-600 p-[2px] hover:border-neutral-400 transition-colors">
                <img
                  src={highlight.cover || "/default-avatar.png"}
                  className="w-full h-full rounded-full object-cover bg-black"
                  alt={highlight.title}
                />
              </div>
              <span className="text-xs font-semibold text-white truncate w-16 text-center">
                {highlight.title}
              </span>
            </div>
          ))
        )}
      </div>

      {viewingLoading && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
        </div>
      )}

      {activeArchives.length > 0 && (
        <ArchiveStoryViewer
          archives={activeArchives}
          initialIndex={0}
          onClose={() => setActiveArchives([])}
          isOwner={isOwner} // <--- Սա պարտադիր է
        />
      )}

      {isOwner && <CreateHighlightModal />}
    </>
  );
};
