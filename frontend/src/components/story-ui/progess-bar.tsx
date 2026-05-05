import type { StoryProgressBarProps } from "../../types/story.types";

export const StoryProgressBar = ({
  total,
  currentIndex,
  progress,
}: StoryProgressBarProps) => {
  return (
    <div className="absolute top-2 left-2 right-2 flex gap-1 z-[60] drop-shadow-md">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-0.5 sm:h-1 rounded-full bg-white/30 overflow-hidden flex-1 backdrop-blur-sm"
        >
          <div
            className="h-full bg-white"
            style={{
              width:
                i < currentIndex
                  ? "100%"
                  : i === currentIndex
                    ? `${progress}%`
                    : "0%",
              transition: i === currentIndex ? "none" : "width 0.2s ease",
            }}
          />
        </div>
      ))}
    </div>
  );
};
