interface StoryProgressBarProps {
  total: number;
  currentIndex: number;
  progress: number;
}

export const StoryProgressBar = ({
  total,
  currentIndex,
  progress,
}: StoryProgressBarProps) => (
  <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 bg-gradient-to-b from-black/60 to-transparent">
    {Array.from({ length: total }).map((_, idx) => (
      <div
        key={idx}
        className="h-[2px] flex-1 bg-white/30 rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-white transition-none"
          style={{
            width:
              idx === currentIndex
                ? `${progress}%`
                : idx < currentIndex
                  ? "100%"
                  : "0%",
          }}
        />
      </div>
    ))}
  </div>
);
