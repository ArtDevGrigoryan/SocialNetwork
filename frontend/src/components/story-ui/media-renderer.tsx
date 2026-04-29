import { MapPin } from "lucide-react";
import type { StoryMediaProps } from "../../types/story.types";

export const StoryMedia = ({
  media,
  isMuted,
  videoRef,
  setIsPaused,
  setIsHolding, // Ավելացված է
  onPrev,
  onNext,
}: StoryMediaProps) => {
  const transform = media.transform || { scale: 1, x: 0, y: 0 };
  const stickers = media.stickers || [];
  const texts = media.texts || [];
  const location = media.location;

  return (
    <div
      className="relative flex-1 flex items-center justify-center bg-black cursor-pointer select-none overflow-hidden touch-none"
      onPointerDown={() => {
        setIsPaused(true);
        if (setIsHolding) setIsHolding(true);
      }}
      onPointerUp={() => {
        setIsPaused(false);
        if (setIsHolding) setIsHolding(false);
      }}
      onPointerCancel={() => {
        setIsPaused(false);
        if (setIsHolding) setIsHolding(false);
      }}
    >
      {media.type === "image" ? (
        <img
          src={media.url}
          alt="Story"
          style={{
            filter: media.filter !== "none" ? media.filter : undefined,
            transform: `scale(${transform.scale}) translate(${transform.x}px, ${transform.y}px)`,
          }}
          className="w-full h-full object-cover pointer-events-none transition-transform duration-200"
        />
      ) : (
        <video
          ref={videoRef as React.LegacyRef<HTMLVideoElement>}
          src={media.url}
          playsInline
          muted={isMuted}
          style={{
            filter: media.filter !== "none" ? media.filter : undefined,
            transform: `scale(${transform.scale}) translate(${transform.x}px, ${transform.y}px)`,
          }}
          className="w-full h-full object-cover pointer-events-none transition-transform duration-200"
          onEnded={onNext}
        />
      )}

      {location && (
        <div
          className="absolute pointer-events-none drop-shadow-xl z-20"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${location.x}px), calc(-50% + ${location.y}px)) scale(${location.scale}) rotate(${location.rotation}deg)`,
          }}
        >
          <div className="bg-white/90 text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1.5 shadow-xl whitespace-nowrap">
            <MapPin size={16} className="text-blue-500" /> {location.name}
          </div>
        </div>
      )}

      {stickers.map((s, idx) => (
        <div
          key={s.id || idx}
          className="absolute pointer-events-none drop-shadow-xl z-20"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${s.x}px), calc(-50% + ${s.y}px)) scale(${s.scale}) rotate(${s.rotation}deg)`,
          }}
        >
          <span className="text-6xl">{s.emoji}</span>
        </div>
      ))}

      {texts.map((t, idx) => (
        <div
          key={t.id || idx}
          className="absolute pointer-events-none z-20"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(calc(-50% + ${t.x}px), calc(-50% + ${t.y}px)) scale(${t.scale}) rotate(${t.rotation}deg)`,
          }}
        >
          <span
            className="text-3xl font-bold whitespace-pre-wrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-center block"
            style={{ color: t.color, fontFamily: t.fontFamily }}
          >
            {t.content}
          </span>
        </div>
      ))}

      <div
        className="absolute inset-y-0 left-0 w-1/3 z-30"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-1/3 z-30"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
      />
    </div>
  );
};
