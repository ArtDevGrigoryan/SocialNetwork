import { useState, useRef, useEffect, type ChangeEvent } from "react";
import {
  X,
  Image as ImageIcon,
  ArrowLeft,
  Loader2,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Music,
  Search,
} from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import type { MusicTrack } from "../../types/story.types";

const FILTERS = [
  { name: "Normal", value: "none" },
  { name: "Clarendon", value: "contrast(1.2) saturate(1.35)" },
  { name: "Gingham", value: "brightness(1.05) hue-rotate(-10deg)" },
  { name: "Moon", value: "grayscale(1) contrast(1.1) brightness(1.1)" },
  { name: "Lark", value: "contrast(0.9) brightness(1.2) saturate(1.1)" },
  { name: "Juno", value: "saturate(1.4) contrast(1.1) hue-rotate(-4deg)" },
];

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: () => void;
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated,
}: CreatePostModalProps) {
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"select" | "filter" | "details">("select");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState<
    Record<number, string>
  >({});

  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Music & Search
  const [showMusicSearch, setShowMusicSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [musicResults, setMusicResults] = useState<MusicTrack[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) handleReset();
  }, [isOpen]);

  const handleReset = () => {
    setStep("select");
    setFiles([]);
    previews.forEach((p) => URL.revokeObjectURL(p));
    setPreviews([]);
    setCurrentIndex(0);
    setSelectedFilters({});
    setCaption("");
    setLocation("");
    setSelectedMusic(null);
    setShowMusicSearch(false);
    if (audioRef.current) audioRef.current.pause();
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setPreviews(selectedFiles.map((file) => URL.createObjectURL(file)));
      const initialFilters: Record<number, string> = {};
      selectedFiles.forEach((_, idx) => (initialFilters[idx] = "none"));
      setSelectedFilters(initialFilters);
      setStep("filter");
    }
  };

  useEffect(() => {
    if (showMusicSearch) {
      const delay = setTimeout(async () => {
        setIsSearchingMusic(true);
        try {
          const q = searchQuery.trim() ? searchQuery : "trending hits";
          const res = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=15`,
          );
          const data = await res.json();
          setMusicResults(
            data.results
              .filter((t: any) => t.previewUrl)
              .map((t: any) => ({
                id: t.trackId.toString(),
                title: t.trackName,
                artist: t.artistName,
                url: t.previewUrl,
                coverArt: t.artworkUrl100,
              })),
          );
        } catch (e) {
        } finally {
          setIsSearchingMusic(false);
        }
      }, 500);
      return () => clearTimeout(delay);
    }
  }, [searchQuery, showMusicSearch]);

  const handleSelectMusic = (music: MusicTrack) => {
    setSelectedMusic(music);
    setShowMusicSearch(false);
    if (audioRef.current) {
      audioRef.current.src = music.url;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleShare = async () => {
    if (files.length === 0) return;
    try {
      setIsUploading(true);
      const formData = new FormData();
      files.forEach((file) => formData.append("media", file));
      formData.append("caption", caption);
      if (location) formData.append("location", location);
      formData.append(
        "filters",
        JSON.stringify(files.map((_, idx) => selectedFilters[idx] || "none")),
      );

      // Extract mentions using Regex (e.g. @username) -> Real app should match with backend users ID.
      // Պարզության համար ուղարկում ենք դատարկ զանգված, քանի որ ID-ներ են պետք։
      formData.append("mentions", JSON.stringify([]));

      if (selectedMusic) {
        formData.append("musicUrl", selectedMusic.url);
        formData.append("musicTitle", selectedMusic.title);
      }

      await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (onPostCreated) onPostCreated();
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <audio ref={audioRef} loop />
      <div
        className={`bg-[#262626] rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${step === "select" ? "w-[400px] h-[450px]" : "w-[850px] max-w-full h-[600px]"}`}
      >
        {/* Header */}
        <div className="h-12 border-b border-neutral-800 flex items-center justify-between px-4 shrink-0">
          {step === "select" ? (
            <button onClick={onClose} className="text-white">
              <X size={24} />
            </button>
          ) : (
            <button
              onClick={() => setStep(step === "details" ? "filter" : "select")}
              className="text-white"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <h2 className="text-white font-semibold text-sm">
            {step === "select"
              ? "Create new post"
              : step === "filter"
                ? "Edit"
                : "New post"}
          </h2>
          {step === "select" ? (
            <div className="w-6" />
          ) : step === "filter" ? (
            <button
              onClick={() => setStep("details")}
              className="text-[#0095F6] font-semibold text-sm"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleShare}
              disabled={isUploading}
              className="text-[#0095F6] font-semibold text-sm flex items-center gap-2"
            >
              {isUploading && <Loader2 size={16} className="animate-spin" />}{" "}
              Share
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 flex overflow-hidden">
          {step === "select" && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <ImageIcon
                size={60}
                className="text-neutral-300 mb-4"
                strokeWidth={1}
              />
              <p className="text-xl text-white mb-6">
                Drag photos and videos here
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0095F6] hover:bg-[#1877F2] text-white px-4 py-1.5 rounded-lg font-semibold text-sm transition"
              >
                Select from computer
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                multiple
                onChange={handleFileSelect}
              />
            </div>
          )}

          {(step === "filter" || step === "details") && (
            <div className="flex w-full h-full relative">
              {/* Preview Side */}
              <div className="relative bg-black flex flex-col items-center justify-center w-[60%] border-r border-neutral-800">
                {files[currentIndex].type.startsWith("video/") ? (
                  <video
                    src={previews[currentIndex]}
                    autoPlay
                    loop
                    muted
                    style={{
                      filter:
                        selectedFilters[currentIndex] !== "none"
                          ? selectedFilters[currentIndex]
                          : undefined,
                    }}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={previews[currentIndex]}
                    style={{
                      filter:
                        selectedFilters[currentIndex] !== "none"
                          ? selectedFilters[currentIndex]
                          : undefined,
                    }}
                    className="w-full h-full object-contain transition-all duration-300"
                    alt="Preview"
                  />
                )}

                {previews.length > 1 && (
                  <>
                    {currentIndex > 0 && (
                      <button
                        onClick={() => setCurrentIndex((prev) => prev - 1)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
                      >
                        <ChevronLeft size={20} />
                      </button>
                    )}
                    {currentIndex < previews.length - 1 && (
                      <button
                        onClick={() => setCurrentIndex((prev) => prev + 1)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
                      >
                        <ChevronRight size={20} />
                      </button>
                    )}
                    <div className="absolute bottom-4 flex gap-1.5">
                      {previews.map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full ${idx === currentIndex ? "bg-[#0095F6]" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  </>
                )}

                {selectedMusic && (
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                    <Music size={14} className="text-white" />
                    <span className="text-white text-[12px] font-medium">
                      {selectedMusic.title}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedMusic(null);
                        if (audioRef.current) audioRef.current.pause();
                      }}
                      className="ml-1 text-neutral-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="w-[40%] bg-[#262626] flex flex-col h-full relative overflow-hidden">
                {step === "filter" ? (
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    <h3 className="text-white font-semibold mb-4 text-sm">
                      Filters
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {FILTERS.map((f) => (
                        <div
                          key={f.name}
                          onClick={() =>
                            setSelectedFilters((prev) => ({
                              ...prev,
                              [currentIndex]: f.value,
                            }))
                          }
                          className="flex flex-col items-center gap-2 cursor-pointer group"
                        >
                          <div
                            className={`w-full aspect-square rounded-md overflow-hidden border-2 transition-all ${selectedFilters[currentIndex] === f.value ? "border-[#0095F6]" : "border-transparent group-hover:border-neutral-500"}`}
                          >
                            <img
                              src={previews[currentIndex]}
                              style={{
                                filter:
                                  f.value !== "none" ? f.value : undefined,
                              }}
                              className="w-full h-full object-cover"
                              alt={f.name}
                            />
                          </div>
                          <span
                            className={`text-[12px] ${selectedFilters[currentIndex] === f.value ? "text-[#0095F6] font-semibold" : "text-neutral-400 font-medium"}`}
                          >
                            {f.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar relative">
                    <div className="flex items-center gap-3 p-4">
                      <img
                        src={user?.avatar || "/default-avatar.png"}
                        alt="user"
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <span className="text-white text-sm font-semibold">
                        {user?.username}
                      </span>
                    </div>
                    <div className="px-4">
                      <textarea
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="Write a caption... mention friends with @username"
                        className="w-full bg-transparent text-white resize-none outline-none text-sm min-h-[120px]"
                        maxLength={2200}
                      />
                    </div>
                    <div className="p-2 border-y border-neutral-800 relative">
                      <input
                        type="text"
                        placeholder="Add location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-transparent text-white text-sm px-2 py-2 outline-none"
                      />
                      <MapPin
                        size={18}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400"
                      />
                    </div>
                    <div
                      className="p-4 border-b border-neutral-800 flex justify-between items-center cursor-pointer hover:bg-neutral-800/50 transition"
                      onClick={() => setShowMusicSearch(true)}
                    >
                      <span className="text-white text-sm">
                        Add Background Music
                      </span>
                      <ChevronRight size={20} className="text-neutral-500" />
                    </div>

                    {/* Music Slide */}
                    <div
                      className={`absolute inset-0 bg-[#262626] z-10 flex flex-col transition-transform duration-300 ${showMusicSearch ? "translate-x-0" : "translate-x-full"}`}
                    >
                      <div className="p-4 border-b border-neutral-800 flex items-center gap-3">
                        <button
                          onClick={() => setShowMusicSearch(false)}
                          className="text-white"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <span className="text-white font-semibold">
                          Search Music
                        </span>
                      </div>
                      <div className="p-3 relative border-b border-neutral-800">
                        <Search
                          size={16}
                          className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400"
                        />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search for tracks..."
                          className="w-full bg-neutral-900 text-white text-sm rounded-lg py-2 pl-9 pr-4 outline-none border border-transparent focus:border-neutral-600"
                        />
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {isSearchingMusic ? (
                          <div className="flex justify-center p-6">
                            <Loader2
                              size={24}
                              className="text-neutral-500 animate-spin"
                            />
                          </div>
                        ) : musicResults.length === 0 ? (
                          <div className="text-center p-6 text-neutral-500 text-sm">
                            No results
                          </div>
                        ) : (
                          musicResults.map((music) => (
                            <div
                              key={music.id}
                              onClick={() => handleSelectMusic(music)}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 cursor-pointer transition"
                            >
                              <img
                                src={music.coverArt}
                                className="w-11 h-11 rounded-md object-cover"
                                alt="cover"
                              />
                              <div className="flex flex-col">
                                <span className="text-white text-[13px] font-semibold">
                                  {music.title}
                                </span>
                                <span className="text-neutral-400 text-[11px]">
                                  {music.artist}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
