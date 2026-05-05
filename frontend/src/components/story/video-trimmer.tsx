import { useState, useEffect, useRef } from "react";
import { Scissors, Loader2, Info, GripVertical } from "lucide-react";
import { useStoryStore } from "../../store/story.store";

interface VideoTrimmerProps {
  onClose: () => void;
}

export const StoryVideoTrimmer = ({ onClose }: VideoTrimmerProps) => {
  const store = useStoryStore();
  const [frames, setFrames] = useState<string[]>([]);
  const [duration, setDuration] = useState(0);
  const [isExtracting, setIsExtracting] = useState(true);

  // Custom Dragging State
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeDrag, setActiveDrag] = useState<
    "start" | "end" | "window" | null
  >(null);
  const startXRef = useRef(0);
  const initialStartRef = useRef(0);
  const initialEndRef = useRef(0);

  const MIN_GAP = 1; // Minimum 1 second video
  const MAX_GAP = store.videoTrim.maxDuration; // Typically 90s

  useEffect(() => {
    if (store.draftType !== "video" || !store.draftPreview) return;
    const video = document.createElement("video");
    video.src = store.draftPreview;
    video.muted = true;

    video.onloadedmetadata = async () => {
      const dur = video.duration;
      setDuration(dur);

      if (store.videoTrim.end > dur || dur < MAX_GAP) {
        store.setVideoTrim(0, Math.min(dur, MAX_GAP));
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const frameCount = 12;
      const extractedFrames: string[] = [];

      canvas.width = 60;
      canvas.height = 100;
      for (let i = 0; i < frameCount; i++) {
        video.currentTime = (dur / frameCount) * i;
        await new Promise((resolve) => {
          video.onseeked = () => {
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              extractedFrames.push(canvas.toDataURL("image/jpeg", 0.3));
            }
            resolve(null);
          };
        });
      }
      setFrames(extractedFrames);
      setIsExtracting(false);
    };
  }, [store.draftPreview, store.draftType]);

  // Pointer Event Logic for Custom Smooth Slider
  const handlePointerDown = (
    e: React.PointerEvent,
    type: "start" | "end" | "window",
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveDrag(type);
    startXRef.current = e.clientX;
    initialStartRef.current = store.videoTrim.start;
    initialEndRef.current = store.videoTrim.end;
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!activeDrag || !trackRef.current || !duration) return;

      const rect = trackRef.current.getBoundingClientRect();
      const deltaX = e.clientX - startXRef.current;
      const deltaTime = (deltaX / rect.width) * duration;

      let newStart = initialStartRef.current;
      let newEnd = initialEndRef.current;

      if (activeDrag === "start") {
        newStart += deltaTime;
        if (newStart < 0) newStart = 0;
        if (newStart > newEnd - MIN_GAP) newStart = newEnd - MIN_GAP;
        if (newEnd - newStart > MAX_GAP) newStart = newEnd - MAX_GAP;
      } else if (activeDrag === "end") {
        newEnd += deltaTime;
        if (newEnd > duration) newEnd = duration;
        if (newEnd < newStart + MIN_GAP) newEnd = newStart + MIN_GAP;
        if (newEnd - newStart > MAX_GAP) newEnd = newStart + MAX_GAP;
      } else if (activeDrag === "window") {
        const windowDuration = newEnd - newStart;
        newStart += deltaTime;
        newEnd += deltaTime;

        if (newStart < 0) {
          newStart = 0;
          newEnd = windowDuration;
        }
        if (newEnd > duration) {
          newEnd = duration;
          newStart = duration - windowDuration;
        }
      }

      store.setVideoTrim(newStart, newEnd);
    };

    const handlePointerUp = () => {
      setActiveDrag(null);
    };

    if (activeDrag) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeDrag, duration, store]);

  const startPercent = duration ? (store.videoTrim.start / duration) * 100 : 0;
  const endPercent = duration ? (store.videoTrim.end / duration) * 100 : 100;
  const currentTrimDuration = store.videoTrim.end - store.videoTrim.start;
  const partsCount = Math.ceil(currentTrimDuration / 30);

  return (
    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/95 backdrop-blur-2xl rounded-t-[2rem] pt-6 pb-[max(2rem,env(safe-area-inset-bottom))] px-6 shadow-[0_-10px_50px_rgba(0,0,0,0.8)] z-40 border-t border-white/10 animate-in slide-in-from-bottom-full duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Scissors size={20} className="text-blue-500" />
          </div>
          <h3 className="text-white font-bold text-[18px]">Trim Video</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white bg-[#0095F6] px-6 py-2.5 rounded-full font-bold text-[14px] hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
        >
          Done
        </button>
      </div>

      {/* Warning for long videos */}
      {partsCount > 1 && (
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white p-3.5 rounded-2xl mb-5 text-[13px] font-medium border border-white/10 shadow-inner">
          <Info size={18} className="shrink-0 text-blue-400" />
          <span>
            Will be automatically split into{" "}
            <b className="text-blue-400">{partsCount} parts</b> (max 30s each).
          </span>
        </div>
      )}

      {/* Custom Draggable Timeline */}
      <div
        ref={trackRef}
        className="relative w-full h-[70px] bg-black rounded-2xl select-none overflow-hidden touch-none flex items-center border-[1.5px] border-neutral-800 shadow-inner cursor-pointer"
      >
        {isExtracting ? (
          <div className="w-full flex justify-center items-center h-full">
            <Loader2 size={24} className="text-neutral-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Background Frames (Inactive / Grayscale) */}
            <div className="absolute inset-0 flex w-full h-full opacity-40 grayscale pointer-events-none">
              {frames.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  className="flex-1 h-full object-cover"
                  alt="frame"
                />
              ))}
            </div>

            {/* Active Highlighted Area (Window) */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "window")}
              className={`absolute top-0 bottom-0 border-y-[4px] border-white shadow-[0_0_30px_rgba(255,255,255,0.2)] bg-white/10 cursor-grab active:cursor-grabbing z-10 transition-shadow ${activeDrag === "window" ? "shadow-[0_0_20px_#0095F6] border-[#0095F6]" : ""}`}
              style={{
                left: `${startPercent}%`,
                width: `${endPercent - startPercent}%`,
              }}
            >
              {/* Highlighted Full Color Frames */}
              <div className="absolute inset-0 flex w-full h-full overflow-hidden pointer-events-none">
                <div
                  className="flex h-full relative"
                  style={{
                    width: `${(100 / (endPercent - startPercent)) * 100}%`,
                    left: `-${(startPercent / (endPercent - startPercent)) * 100}%`,
                  }}
                >
                  {frames.map((src, i) => (
                    <img
                      key={`active-${i}`}
                      src={src}
                      className="flex-1 h-full object-cover"
                      alt="active"
                    />
                  ))}
                </div>
              </div>

              {/* Visual Splitter Lines for 30s Chunks */}
              {partsCount > 1 &&
                Array.from({ length: partsCount - 1 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10 shadow-[0_0_8px_red]"
                    style={{
                      left: `${(30 / currentTrimDuration) * 100 * (idx + 1)}%`,
                    }}
                  />
                ))}
            </div>

            {/* Left Handle (Start) */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "start")}
              className={`absolute top-0 bottom-0 w-6 bg-white rounded-l-[12px] flex items-center justify-center cursor-ew-resize z-20 transform -translate-x-full shadow-2xl transition-colors ${activeDrag === "start" ? "bg-neutral-200" : ""}`}
              style={{ left: `${startPercent}%` }}
            >
              <GripVertical size={14} className="text-neutral-500" />
            </div>

            {/* Right Handle (End) */}
            <div
              onPointerDown={(e) => handlePointerDown(e, "end")}
              className={`absolute top-0 bottom-0 w-6 bg-white rounded-r-[12px] flex items-center justify-center cursor-ew-resize z-20 shadow-2xl transition-colors ${activeDrag === "end" ? "bg-neutral-200" : ""}`}
              style={{ left: `${endPercent}%` }}
            >
              <GripVertical size={14} className="text-neutral-500" />
            </div>

            {/* Dark Overlay for inactive parts */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-black/60 pointer-events-none"
              style={{ width: `${startPercent}%` }}
            />
            <div
              className="absolute top-0 bottom-0 right-0 bg-black/60 pointer-events-none"
              style={{ width: `${100 - endPercent}%` }}
            />
          </>
        )}
      </div>

      <div className="text-center mt-4 text-neutral-400 font-semibold text-[14px]">
        {currentTrimDuration.toFixed(1)}s selected{" "}
        {duration > 0 && `(Total: ${duration.toFixed(1)}s)`}
      </div>
    </div>
  );
};
