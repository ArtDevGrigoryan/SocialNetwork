import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Disc3, Link as LinkIcon, AtSign } from "lucide-react";
import type {
  StoryMediaProps,
  StoryLocation,
  LinkSticker,
  Sticker,
  StoryText,
  MusicWidget,
  MentionSticker,
} from "../../types/story.types";

const parseJSON = <T,>(data: string | T | undefined | null, fallback: T): T => {
  if (!data) return fallback;
  if (typeof data === "string") {
    try {
      return JSON.parse(data) as T;
    } catch {
      return fallback;
    }
  }
  return data;
};

export const StoryMedia = ({
  media,
  isMuted,
  videoRef,
  setIsPaused,
  setIsHolding,
  onPrev,
  onNext,
}: StoryMediaProps) => {
  const navigate = useNavigate();
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    startX.current = e.clientX;
    startY.current = e.clientY;

    pressTimer.current = setTimeout(() => {
      setIsPaused(true);
      if (setIsHolding) setIsHolding(true);
      isDraggingRef.current = true;
    }, 200);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (
      Math.abs(e.clientX - startX.current) > 10 ||
      Math.abs(e.clientY - startY.current) > 10
    ) {
      isDraggingRef.current = true;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    setIsPaused(false);
    if (setIsHolding) setIsHolding(false);

    // 🛑 Ստուգում ենք՝ արդյոք click-ը sticker-ի վրա է, որ story-ն չթերթվի
    const target = e.target as HTMLElement;
    if (target.closest(".story-clickable-sticker")) {
      return;
    }

    if (!isDraggingRef.current) {
      const clickX = e.clientX;
      const screenWidth = window.innerWidth;

      if (clickX < screenWidth * 0.3) {
        onPrev();
      } else {
        onNext();
      }
    }

    isDraggingRef.current = false;
  };

  const handlePointerLeave = (_: React.PointerEvent) => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setIsPaused(false);
    if (setIsHolding) setIsHolding(false);
    isDraggingRef.current = false;
  };

  const locationObj = parseJSON<StoryLocation | null>(media.location, null);
  const stickersArr = parseJSON<Sticker[]>(media.stickers, []);
  const textsArr = parseJSON<StoryText[]>(media.texts, []);
  const mentionStickersArr = parseJSON<MentionSticker[]>(
    media.mentionStickers,
    [],
  );
  const musicWidgetObj = parseJSON<MusicWidget | null>(media.musicWidget, null);
  const linkStickerObj = parseJSON<LinkSticker | null>(media.linkSticker, null);

  return (
    <div
      className="relative flex-1 w-full h-full bg-black touch-none overflow-hidden"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      <div
        className="absolute inset-0 transition-transform"
        style={{
          transform: media.transform
            ? `scale(${media.transform.scale}) translate(${media.transform.x}px, ${media.transform.y}px)`
            : "none",
          filter: media.filter !== "none" ? media.filter : "none",
        }}
      >
        {media.type === "image" ? (
          <img
            src={media.url}
            className="w-full h-full object-cover select-none pointer-events-none"
            alt="story"
          />
        ) : (
          <video
            ref={videoRef}
            src={media.url}
            className="w-full h-full object-cover select-none pointer-events-none"
            muted={isMuted}
            playsInline
            autoPlay
            loop={false}
          />
        )}
      </div>

      <div className="absolute inset-0 z-[100] pointer-events-none overflow-hidden">
        {locationObj && (
          <div
            className="absolute drop-shadow-xl pointer-events-auto story-clickable-sticker"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${locationObj.x || 0}px), calc(-50% + ${locationObj.y || 0}px)) scale(${locationObj.scale || 1}) rotate(${locationObj.rotation || 0}deg)`,
            }}
          >
            <div className="bg-white/95 text-black px-5 py-2.5 rounded-xl font-bold text-[16px] shadow-2xl flex items-center gap-2">
              <MapPin size={20} className="text-[#0095F6]" />
              {locationObj.name}
            </div>
          </div>
        )}

        {mentionStickersArr.map((m) => (
          <div
            key={m.id}
            className="absolute drop-shadow-2xl pointer-events-auto story-clickable-sticker cursor-pointer active:scale-95 transition-transform"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${m.x || 0}px), calc(-50% + ${m.y || 0}px)) scale(${m.scale || 1}) rotate(${m.rotation || 0}deg)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${m.username}`);
            }}
          >
            <div className="bg-gradient-to-tr from-fuchsia-600 to-orange-500 text-white px-3 py-1.5 rounded-full font-bold text-[13px] shadow-lg flex items-center gap-1">
              <AtSign size={14} strokeWidth={3} />
              {m.username}
            </div>
          </div>
        ))}

        {linkStickerObj && (
          <div
            className="absolute pointer-events-auto story-clickable-sticker"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${linkStickerObj.x || 0}px), calc(-50% + ${linkStickerObj.y || 0}px)) scale(${linkStickerObj.scale || 1}) rotate(${linkStickerObj.rotation || 0}deg)`,
            }}
          >
            <a
              href={linkStickerObj.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/95 text-black px-5 py-2.5 rounded-xl font-bold text-[16px] flex items-center gap-2 shadow-2xl hover:bg-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <LinkIcon size={20} className="text-blue-600 shrink-0" />
              <span className="text-blue-600 max-w-[150px] truncate">
                {linkStickerObj.text || linkStickerObj.url}
              </span>
            </a>
          </div>
        )}

        {stickersArr.map((sticker) => (
          <div
            key={sticker.id}
            className="absolute text-[80px] drop-shadow-2xl leading-none"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${sticker.x || 0}px), calc(-50% + ${sticker.y || 0}px)) scale(${sticker.scale || 1}) rotate(${sticker.rotation || 0}deg)`,
            }}
          >
            {sticker.emoji}
          </div>
        ))}

        {textsArr.map((text) => (
          <div
            key={text.id}
            className="absolute text-4xl md:text-5xl font-bold whitespace-pre-wrap text-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] leading-tight px-4"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${text.x || 0}px), calc(-50% + ${text.y || 0}px)) scale(${text.scale || 1}) rotate(${text.rotation || 0}deg)`,
              color: text.color,
              fontFamily: text.fontFamily,
            }}
          >
            {text.content}
          </div>
        ))}

        {media.musicUrl &&
          musicWidgetObj &&
          media.musicCover &&
          !musicWidgetObj.isHidden && (
            <div
              className="absolute drop-shadow-2xl pointer-events-auto story-clickable-sticker"
              style={{
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${musicWidgetObj.x || 0}px), calc(-50% + ${musicWidgetObj.y || 0}px)) scale(${musicWidgetObj.scale || 1}) rotate(${musicWidgetObj.rotation || 0}deg)`,
              }}
            >
              <div className="bg-black/40 backdrop-blur-xl border border-white/20 p-2.5 rounded-2xl flex items-center gap-3 shadow-2xl">
                <img
                  src={media.musicCover}
                  className="w-12 h-12 rounded-xl shadow-md object-cover"
                  alt="cover"
                />
                <div className="flex flex-col pr-5 text-left">
                  <span className="text-white text-[14px] font-bold leading-tight">
                    {media.musicTitle}
                  </span>
                  <span className="text-white/70 text-[12px] leading-tight flex items-center gap-1.5 mt-0.5">
                    <Disc3 size={12} className="animate-spin-slow" /> Instagram
                    Music
                  </span>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};
