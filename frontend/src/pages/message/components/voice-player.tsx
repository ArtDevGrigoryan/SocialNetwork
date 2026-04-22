import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import type { VoicePlayerProps } from "../types";

export default function VoicePlayer({ url, isMine }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const setAudioData = () => setDuration(audio.duration);
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const onAudioEnded = () => setIsPlaying(false);

    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);
    audio.addEventListener("ended", onAudioEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
      audio.removeEventListener("ended", onAudioEnded);
    };
  }, []);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    isPlaying ? audio.pause() : audio.play();
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || duration === 0) return;
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    audio.currentTime = percent * duration;
    setCurrentTime(audio.currentTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const btnBgColor = isMine
    ? "bg-white text-[#3797F0]"
    : "bg-white/10 text-white";
  const trackBgColor = isMine ? "bg-blue-300/40" : "bg-neutral-600";
  const progressColor = isMine ? "bg-white" : "bg-[#3797F0]";
  const textColor = isMine ? "text-blue-100" : "text-neutral-400";

  return (
    <div
      className="flex items-center gap-3 min-w-[200px] sm:min-w-[240px] py-1 select-none"
      style={{ WebkitTouchCallout: "none" }}
    >
      <button
        onClick={togglePlayPause}
        className={`w-[38px] h-[38px] flex items-center justify-center rounded-full shrink-0 transition-transform active:scale-90 shadow-sm ${btnBgColor}`}
      >
        {isPlaying ? (
          <Pause size={18} className="fill-current" />
        ) : (
          <Play size={18} className="fill-current ml-1" />
        )}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div
          className="flex items-center h-6 cursor-pointer relative group"
          onClick={handleSeek}
        >
          <div
            className={`w-full h-[5px] rounded-full overflow-hidden ${trackBgColor}`}
          >
            <div
              className={`h-full transition-all duration-75 ${progressColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity ${progressColor}`}
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>
        <div
          className={`flex justify-between items-center text-[11px] font-medium tracking-wide ${textColor}`}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <audio ref={audioRef} src={url} className="hidden" preload="metadata" />
    </div>
  );
}
