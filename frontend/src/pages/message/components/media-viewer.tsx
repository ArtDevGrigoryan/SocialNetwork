import { X, Download, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import type { MediaViewerProps } from "../types";

export default function MediaViewer({
  isOpen,
  onClose,
  media,
  initialIndex,
}: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"x" | "y" | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const thumbnailsRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (thumbnailsRef.current && isOpen) {
      const activeThumbnail = thumbnailsRef.current.children[
        currentIndex
      ] as HTMLElement;
      if (activeThumbnail) {
        activeThumbnail.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentIndex, isOpen]);

  if (!isOpen || !media || media.length === 0) return null;

  const handleNext = () => {
    if (currentIndex < media.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setIsDragging(true);
    setSwipeDirection(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = e.touches[0].clientY - touchStartRef.current.y;

    if (!swipeDirection) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 5) {
        setSwipeDirection("x");
      } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 5) {
        setSwipeDirection("y");
      }
    } else if (swipeDirection === "x") {
      setDragX(deltaX);
    } else if (swipeDirection === "y") {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (swipeDirection === "y" && Math.abs(dragY) > 100) {
      onClose();
    } else if (swipeDirection === "x" && Math.abs(dragX) > 60) {
      if (dragX > 0) handlePrev();
      else handleNext();
    }

    setDragX(0);
    setDragY(0);
    touchStartRef.current = null;
    setSwipeDirection(null);
  };

  const currentItem = media[currentIndex];

  const isDismissing = swipeDirection === "y";
  const scale = isDismissing ? Math.max(0.7, 1 - Math.abs(dragY) / 1000) : 1;
  const bgOpacity = isDismissing
    ? Math.max(0, 0.98 - Math.abs(dragY) / 500)
    : 0.98;
  const uiOpacity = isDismissing ? Math.max(0, 1 - Math.abs(dragY) / 100) : 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex flex-col items-center justify-center overscroll-none touch-none"
      style={{ backgroundColor: `rgba(0, 0, 0, ${bgOpacity})` }}
      onClick={onClose}
    >
      <div
        className="absolute top-0 left-0 w-full p-4 flex items-center justify-between z-[1000000] bg-gradient-to-b from-black/80 to-transparent transition-opacity"
        style={{
          opacity: uiOpacity,
          transitionDuration: isDragging ? "0ms" : "250ms",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-white text-sm font-medium tracking-wide bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
          {currentIndex + 1} / {media.length}
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
          style={{
            opacity: uiOpacity,
            transitionDuration: isDragging ? "0ms" : "250ms",
          }}
          className="absolute left-2 md:left-6 z-[1000000] text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md hidden md:flex"
        >
          <ChevronLeft size={36} />
        </button>
      )}

      {currentIndex < media.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          style={{
            opacity: uiOpacity,
            transitionDuration: isDragging ? "0ms" : "250ms",
          }}
          className="absolute right-2 md:right-6 z-[1000000] text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md hidden md:flex"
        >
          <ChevronRight size={36} />
        </button>
      )}

      <div
        className="relative w-full h-[100dvh] flex items-center justify-center p-4 md:p-12 animate-in zoom-in-95 duration-200 overflow-hidden pb-24 md:pb-32"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="w-full h-full flex items-center justify-center transition-transform"
          style={{
            transform: `translate3d(${dragX}px, ${dragY}px, 0) scale(${scale})`,
            transitionDuration: isDragging ? "0ms" : "250ms",
            transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        >
          {currentItem.mediaType === "VIDEO" ? (
            <video
              key={currentItem.url}
              src={currentItem.url}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-full object-contain rounded-md"
            />
          ) : (
            <img
              key={currentItem.url}
              src={currentItem.url}
              alt={`Media ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-md select-none pointer-events-none"
              draggable={false}
            />
          )}
        </div>
      </div>

      {/* THUMBNAILS PREVIEW BAR */}
      {media.length > 1 && (
        <div
          className="absolute bottom-6 md:bottom-8 left-0 w-full px-4 flex justify-center z-[1000000] transition-opacity"
          style={{
            opacity: uiOpacity,
            transitionDuration: isDragging ? "0ms" : "250ms",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            ref={thumbnailsRef}
            className="flex items-center gap-2 overflow-x-auto custom-scrollbar max-w-full md:max-w-[70vw] scroll-smooth px-2 pb-2"
          >
            {media.map((item, idx) => {
              const isActive = currentIndex === idx;
              return (
                <button
                  key={item.url + idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-lg overflow-hidden transition-all duration-300 ${
                    isActive
                      ? "ring-2 ring-white opacity-100 scale-110 z-10 shadow-lg shadow-black/50"
                      : "opacity-40 hover:opacity-100 ring-1 ring-white/20"
                  }`}
                >
                  {item.mediaType === "VIDEO" ? (
                    <video
                      src={item.url}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={`preview-${idx}`}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  )}

                  {item.mediaType === "VIDEO" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play
                        size={16}
                        fill="white"
                        className="text-white drop-shadow-md ml-0.5"
                      />
                    </div>
                  )}

                  {!isActive && (
                    <div className="absolute inset-0 bg-black/20 hover:bg-transparent transition-colors" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
