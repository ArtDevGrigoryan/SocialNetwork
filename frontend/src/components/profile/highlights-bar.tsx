import { useEffect, useState, useRef } from "react";
import { Plus, Loader2, Edit3, Trash2, MoreVertical } from "lucide-react";
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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

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
    if (menuOpenId === highlight._id) return;
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

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this highlight?")) {
      try {
        await deleteHighlight(id);
        toast.success("Highlight deleted");
      } catch (error) {
        toast.error("Failed to delete highlight");
      }
    }
    setMenuOpenId(null);
  };

  if (!loading && highlights.length === 0 && !isOwner) return null;

  return (
    <>
      <style>{`.hide-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div
        ref={scrollRef}
        onWheel={handleScroll}
        className="px-4 md:px-0 py-4 flex gap-4 overflow-x-auto hide-scroll snap-x border-b border-neutral-800 items-start relative"
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
              className="relative flex flex-col items-center gap-1.5 shrink-0 snap-start"
            >
              <div
                onClick={() => openHighlight(highlight)}
                className="w-[66px] h-[66px] rounded-full bg-neutral-800 border border-neutral-600 p-[2px] hover:border-neutral-400 transition-colors cursor-pointer"
              >
                <img
                  src={highlight.cover || "/default-avatar.png"}
                  className="w-full h-full rounded-full object-cover bg-black"
                  alt={highlight.title}
                />
              </div>
              <span className="text-xs font-semibold text-white truncate w-16 text-center">
                {highlight.title}
              </span>

              {isOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(
                      menuOpenId === highlight._id ? null : highlight._id,
                    );
                  }}
                  className="absolute -top-1 -right-1 bg-black/80 rounded-full p-1 text-white hover:text-gray-300"
                >
                  <MoreVertical size={14} />
                </button>
              )}

              {menuOpenId === highlight._id && (
                <div className="absolute top-10 right-0 z-50 bg-[#262626] border border-neutral-700 rounded-lg shadow-xl w-32 overflow-hidden flex flex-col">
                  <button
                    onClick={() => {
                      setCreateModalOpen(true, highlight._id);
                      setMenuOpenId(null);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-white hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(highlight._id)}
                    className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
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
          isOwner={isOwner}
        />
      )}
      {isOwner && <CreateHighlightModal />}
    </>
  );
};
