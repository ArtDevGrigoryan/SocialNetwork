import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import type { MediaViewerProps } from "../types";

export default function MediaViewer({
  isOpen,
  onClose,
  mediaList,
  initialIndex,
}: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  if (!isOpen || !mediaList || mediaList.length === 0) return null;

  const handleNext = () => {
    if (currentIndex < mediaList.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (touchStartX.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) handleNext();
    if (diff < -50) handlePrev();

    touchStartX.current = null;
  };

  const currentItem = mediaList[currentIndex];

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center bg-black/98 overscroll-none touch-none"
      onClick={onClose}
    >
      <div
        className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-[1000000] bg-gradient-to-b from-black/80 to-transparent"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-white text-sm font-medium tracking-wide bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
          {currentIndex + 1} / {mediaList.length}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={currentItem.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-white/80 hover:text-white p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
            title="Download"
          >
            <Download size={22} />
          </a>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white/80 hover:text-white p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all"
            title="Close"
          >
            <X size={26} />
          </button>
        </div>
      </div>

      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-2 md:left-6 z-[1000000] text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md hidden md:flex"
        >
          <ChevronLeft size={36} />
        </button>
      )}

      {currentIndex < mediaList.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-2 md:right-6 z-[1000000] text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md hidden md:flex"
        >
          <ChevronRight size={36} />
        </button>
      )}

      <div
        className="relative w-full h-[100dvh] flex items-center justify-center p-0 md:p-12 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {currentItem.mediaType === "VIDEO" ? (
          <video
            key={currentItem.url}
            src={currentItem.url}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-[100vh] md:max-h-[85vh] object-contain md:rounded-md"
          />
        ) : (
          <img
            key={currentItem.url}
            src={currentItem.url}
            alt={`Media ${currentIndex + 1}`}
            className="max-w-full max-h-[100vh] md:max-h-[85vh] object-contain md:rounded-md select-none"
            draggable={false}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
