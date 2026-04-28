import type { StoryMediaProps } from "../../types/story.types";

export const StoryMedia = ({
  media,
  isMuted,
  videoRef,
  setIsPaused,
  onPrev,
  onNext,
}: StoryMediaProps) => (
  <div
    className="relative flex-1 flex items-center justify-center bg-black cursor-pointer select-none"
    onMouseDown={() => setIsPaused(true)}
    onMouseUp={() => setIsPaused(false)}
    onMouseLeave={() => setIsPaused(false)}
    onTouchStart={() => setIsPaused(true)}
    onTouchEnd={() => setIsPaused(false)}
  >
    {media.type === "image" ? (
      <img
        src={media.url}
        alt="Story"
        className="w-full h-full object-cover pointer-events-none"
      />
    ) : (
      <video
        ref={videoRef as React.LegacyRef<HTMLVideoElement>}
        src={media.url}
        playsInline
        muted={isMuted}
        className="w-full h-full object-cover pointer-events-none"
        onEnded={onNext}
      />
    )}
    <div
      className="absolute inset-y-0 left-0 w-1/3 z-10"
      onClick={(e) => {
        e.stopPropagation();
        onPrev();
      }}
    />
    <div
      className="absolute inset-y-0 right-0 w-1/3 z-10"
      onClick={(e) => {
        e.stopPropagation();
        onNext();
      }}
    />
  </div>
);
