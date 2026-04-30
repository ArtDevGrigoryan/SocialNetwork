import { useEffect, useState, useCallback, useRef } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { IPost } from "../../types/user.types";
import { DesktopPostDetail } from "./desktop-post-detail";
import { MobilePostDetail } from "./mobile-post-detail";

interface PostModalProps {
  posts: IPost[];
  initialIndex: number;
  onClose: () => void;
}

export const PostModal = ({ posts, initialIndex, onClose }: PostModalProps) => {
  console.log(posts[initialIndex])
  const [desktopIndex, setDesktopIndex] = useState(initialIndex);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const goToNext = useCallback(() => {
    if (desktopIndex < posts.length - 1) setDesktopIndex((prev) => prev + 1);
  }, [desktopIndex, posts.length]);

  const goToPrev = useCallback(() => {
    if (desktopIndex > 0) setDesktopIndex((prev) => prev - 1);
  }, [desktopIndex]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev, onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (isMobile && scrollContainerRef.current) {
      const element = scrollContainerRef.current.children[
        initialIndex
      ] as HTMLElement;
      if (element) element.scrollIntoView({ behavior: "instant" });
    }
  }, [initialIndex, isMobile]);

  if (!posts || posts.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] w-full h-[100dvh] bg-black md:bg-black/90 md:backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
      <button
        onClick={onClose}
        className="fixed top-6 left-4 z-[110] text-white hover:scale-110 transition p-2 bg-black/40 rounded-full md:top-6 md:right-6 md:left-auto drop-shadow-xl backdrop-blur-md"
      >
        <X size={26} strokeWidth={2.5} />
      </button>

      {isMobile ? (
        <div
          ref={scrollContainerRef}
          className="w-full h-[100dvh] overflow-y-auto overflow-x-hidden snap-y snap-mandatory flex flex-col no-scrollbar"
        >
          {posts.map((post) => (
            <MobilePostDetail key={post._id} post={post as any} />
          ))}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center relative px-12 lg:px-24">
          {desktopIndex > 0 && (
            <button
              onClick={goToPrev}
              className="absolute left-4 lg:left-10 text-white hover:scale-110 transition p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md z-50"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          <DesktopPostDetail
            key={posts[desktopIndex]._id}
            post={posts[desktopIndex]}
          />

          {desktopIndex < posts.length - 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 lg:right-10 text-white hover:scale-110 transition p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md z-50"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
