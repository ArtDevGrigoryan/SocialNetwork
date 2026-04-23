import { useState } from "react";
import type { IMessage, IMedia, IMediaItem } from "../types";
import MediaViewer from "./media-viewer";
import { Play } from "lucide-react";

export default function MessageMedia({ msg }: { msg: IMessage }) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [clickedIndex, setClickedIndex] = useState<number>(0);

  const visualMedia: IMedia[] =
    msg.media?.filter(
      (m) => m.mediaType === "IMAGE" || m.mediaType === "VIDEO",
    ) || [];

  if (visualMedia.length === 0) return null;

  const handleMediaClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setClickedIndex(index);
    setIsViewerOpen(true);
  };

  const gridClass =
    visualMedia.length === 1
      ? "grid-cols-1"
      : visualMedia.length === 2
        ? "grid-cols-2"
        : "grid-cols-2";

  return (
    <>
      <div
        className={`grid gap-[2px] ${gridClass} overflow-hidden rounded-[18px] bg-neutral-900/50`}
      >
        {visualMedia.map((item, index) => {
          const isFullWidthInGrid3 = visualMedia.length === 3 && index === 0;

          return (
            <div
              key={index}
              className={`relative cursor-pointer group bg-neutral-800 ${
                isFullWidthInGrid3
                  ? "col-span-2 aspect-[16/9]"
                  : "aspect-square"
              } w-full overflow-hidden`}
              onClick={(e) => handleMediaClick(e, index)}
            >
              {item.mediaType === "VIDEO" ? (
                <div className="relative w-full h-full">
                  <video
                    src={item.url}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 pointer-events-none"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/30 transition-colors duration-300">
                    <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm shadow-lg">
                      <Play fill="white" size={18} className="ml-1" />
                    </div>
                  </div>
                </div>
              ) : (
                <img
                  src={item.url}
                  alt="chat media"
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 pointer-events-none"
                  loading="lazy"
                />
              )}
            </div>
          );
        })}
      </div>

      {msg.text && (
        <div className="px-3 py-2 text-[15px] leading-5 text-white break-words">
          {msg.text}
        </div>
      )}

      <MediaViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        media={visualMedia as IMediaItem[]}
        initialIndex={clickedIndex}
      />
    </>
  );
}
