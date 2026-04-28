import { ChevronUp, Eye, Heart, Loader2, X } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ViewersDrawerProps } from "../../types/story.types";

export const ViewersDrawer = ({
  isOpen,
  setIsOpen,
  viewsCount,
  viewers,
  loadingViewers,
}: ViewersDrawerProps) => (
  <>
    <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
      <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12 pb-4 px-4 flex justify-center pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className="flex flex-col items-center gap-1 text-white hover:text-gray-300 transition"
        >
          <ChevronUp size={20} className="animate-bounce drop-shadow-lg" />
          <div className="flex items-center gap-1.5 text-sm font-medium drop-shadow-lg">
            <Eye size={16} />
            <span>{viewsCount} Viewers</span>
          </div>
        </button>
      </div>
    </div>
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 bg-neutral-900 rounded-t-2xl transition-transform duration-300 z-40 flex flex-col pointer-events-auto",
        isOpen ? "translate-y-0 h-[60%]" : "translate-y-full h-[60%]",
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        <div className="flex items-center gap-2 text-white font-semibold">
          <Eye size={18} />
          <span>{viewsCount} Views</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="text-neutral-400 hover:text-white p-1"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loadingViewers ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="animate-spin text-neutral-500 w-6 h-6" />
          </div>
        ) : viewers.length === 0 ? (
          <div className="text-center text-neutral-500 text-sm mt-10">
            No viewers yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {viewers.map((v, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={v.viewer.avatar || "/default-avatar.png"}
                    alt={v.viewer.username}
                    className="w-10 h-10 rounded-full object-cover border border-neutral-700"
                  />
                  <span className="text-sm font-semibold text-white">
                    {v.viewer.username}
                  </span>
                </div>
                {(v.reaction || v.liked) && (
                  <div className="flex items-center gap-1.5 text-xl">
                    {v.liked && (
                      <Heart className="text-red-500 fill-red-500" size={20} />
                    )}
                    {v.reaction && <span>{v.reaction}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </>
);
