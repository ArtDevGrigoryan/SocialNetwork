import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  useCallback,
} from "react";
import { X, ArrowLeft, Loader2 } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import type { MusicTrack } from "../../types/story.types";
import getCroppedImg from "../../lib/crop";

import SelectStep from "./select-step";
import CropStep from "./crop-step";
import PreviewSide from "./preview-side";
import FilterStep from "./filter-step";
import DetailsStep from "./details-step";
import MusicSidebar from "./music-sidebar";

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);

  const [step, setStep] = useState<"select" | "crop" | "filter" | "details">(
    "select",
  );
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState<
    Record<number, string>
  >({});

  const [crops, setCrops] = useState<Record<number, { x: number; y: number }>>(
    {},
  );
  const [zooms, setZooms] = useState<Record<number, number>>({});
  const [croppedPixels, setCroppedPixels] = useState<Record<number, any>>({});
  const [aspect, setAspect] = useState<number>(1);
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);

  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [showMusicSearch, setShowMusicSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [musicResults, setMusicResults] = useState<MusicTrack[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [musicStartTime, setMusicStartTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(30);

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
    setCrops({});
    setZooms({});
    setCroppedPixels({});
    setAspect(1);
    setCaption("");
    setLocation("");
    setSelectedMusic(null);
    setShowMusicSearch(false);
    setShowEmojiPicker(false);
    setMusicStartTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setPreviews(selectedFiles.map((file) => URL.createObjectURL(file)));
      const initialFilters: Record<number, string> = {};
      const initialCrops: Record<number, { x: number; y: number }> = {};
      const initialZooms: Record<number, number> = {};

      selectedFiles.forEach((_, idx) => {
        initialFilters[idx] = "none";
        initialCrops[idx] = { x: 0, y: 0 };
        initialZooms[idx] = 1;
      });

      setSelectedFilters(initialFilters);
      setCrops(initialCrops);
      setZooms(initialZooms);
      setStep("crop");
    }
  };

  const onCropComplete = useCallback(
    (idx: number, _: any, croppedAreaPixels: any) => {
      setCroppedPixels((prev) => ({ ...prev, [idx]: croppedAreaPixels }));
    },
    [],
  );

  const handleApplyCropsAndNext = async () => {
    setIsProcessingCrop(true);
    try {
      const newFiles = [...files];
      const newPreviews = [...previews];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("video/") && croppedPixels[i]) {
          const croppedFile = await getCroppedImg(
            previews[i],
            croppedPixels[i],
            file.name,
          );
          if (croppedFile) {
            newFiles[i] = croppedFile;
            URL.revokeObjectURL(newPreviews[i]);
            newPreviews[i] = URL.createObjectURL(croppedFile);
          }
        }
      }
      setFiles(newFiles);
      setPreviews(newPreviews);
      setStep("filter");
    } catch (e) {
      console.error("Error cropping", e);
    } finally {
      setIsProcessingCrop(false);
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
    setMusicStartTime(0);
    if (audioRef.current) {
      audioRef.current.src = music.url;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleAudioTimeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setMusicStartTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleShare = async () => {
    if (files.length === 0) return;
    try {
      setIsUploading(true);
      const formData = new FormData();
      files.forEach((file) => formData.append("post", file));
      formData.append("content", caption);
      formData.append("location", location);
      formData.append(
        "filters",
        JSON.stringify(Object.values(selectedFilters)),
      );

      if (selectedMusic) {
        formData.append("musicUrl", selectedMusic.url);
        formData.append("musicTitle", selectedMusic.title);
        formData.append("musicStartTime", musicStartTime.toString());
      }

      await api.post("/posts", formData);
      onPostCreated?.();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  const currentFile = files[currentIndex];
  const isVideo = currentFile?.type.startsWith("video/");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm sm:p-4 animate-in fade-in duration-200">
      <audio
        ref={audioRef}
        loop
        onLoadedMetadata={() => {
          if (audioRef.current)
            setAudioDuration(audioRef.current.duration || 30);
        }}
      />
      <div
        className={`bg-[#262626] w-full sm:rounded-xl shadow-2xl flex flex-col transition-all duration-300 relative overflow-hidden ${
          step === "select"
            ? "max-w-[400px] h-[100dvh] sm:h-[450px]"
            : "max-w-[850px] h-[100dvh] sm:h-[600px]"
        }`}
      >
        <div className="h-12 border-b border-neutral-800 flex items-center justify-between px-4 shrink-0 rounded-t-xl overflow-hidden">
          {step === "select" ? (
            <button onClick={onClose} className="text-white">
              <X size={24} />
            </button>
          ) : (
            <button
              onClick={() => {
                if (step === "details") setStep("filter");
                else if (step === "filter") setStep("crop");
                else if (step === "crop") handleReset();
              }}
              className="text-white"
            >
              <ArrowLeft size={24} />
            </button>
          )}

          <h2 className="text-white font-semibold text-sm">
            {step === "select"
              ? "Create new post"
              : step === "crop"
                ? "Crop"
                : step === "filter"
                  ? "Edit"
                  : "New post"}
          </h2>

          {step === "select" ? (
            <div className="w-6" />
          ) : step === "crop" ? (
            <button
              onClick={handleApplyCropsAndNext}
              disabled={isProcessingCrop}
              className="text-[#0095F6] font-semibold text-sm flex items-center gap-2"
            >
              {isProcessingCrop && (
                <Loader2 size={16} className="animate-spin" />
              )}{" "}
              Next
            </button>
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

        {/* Body content based on step */}
        <div className="flex-1 flex overflow-hidden rounded-b-xl relative">
          {step === "select" && (
            <SelectStep
              fileInputRef={fileInputRef}
              handleFileSelect={handleFileSelect}
            />
          )}

          {step === "crop" && (
            <CropStep
              previews={previews}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              crops={crops}
              setCrops={setCrops}
              zooms={zooms}
              setZooms={setZooms}
              aspect={aspect}
              setAspect={setAspect}
              onCropComplete={onCropComplete}
              isVideo={isVideo}
            />
          )}

          {(step === "filter" || step === "details") && (
            <div className="flex w-full h-full relative">
              <PreviewSide
                previews={previews}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
                selectedFilters={selectedFilters}
                selectedMusic={selectedMusic}
                setSelectedMusic={setSelectedMusic}
                audioRef={audioRef}
                isVideo={isVideo}
              />

              <div className="w-[40%] bg-[#262626] flex flex-col h-full relative overflow-hidden">
                {step === "filter" ? (
                  <FilterStep
                    previews={previews}
                    currentIndex={currentIndex}
                    selectedFilters={selectedFilters}
                    setSelectedFilters={setSelectedFilters}
                  />
                ) : (
                  <>
                    <DetailsStep
                      user={user}
                      caption={caption}
                      setCaption={setCaption}
                      location={location}
                      setLocation={setLocation}
                      showEmojiPicker={showEmojiPicker}
                      setShowEmojiPicker={setShowEmojiPicker}
                      selectedMusic={selectedMusic}
                      setShowMusicSearch={setShowMusicSearch}
                      musicStartTime={musicStartTime}
                      audioDuration={audioDuration}
                      handleAudioTimeChange={handleAudioTimeChange}
                      captionRef={captionRef}
                    />
                    <MusicSidebar
                      showMusicSearch={showMusicSearch}
                      setShowMusicSearch={setShowMusicSearch}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      isSearchingMusic={isSearchingMusic}
                      musicResults={musicResults}
                      handleSelectMusic={handleSelectMusic}
                    />
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
