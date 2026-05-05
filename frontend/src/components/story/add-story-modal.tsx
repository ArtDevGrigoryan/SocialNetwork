import { useRef, useState, useEffect } from "react";
import Cropper from "react-easy-crop";
import { toBlob } from "html-to-image";
import {
  X,
  Music,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Maximize,
  Type,
  Smile,
  Wand2,
  ChevronLeft,
  Volume2,
  VolumeX,
  Trash2,
  Scissors,
  Link as LinkIcon,
  MoreVertical,
  AtSign,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { useStoryStore } from "../../store/story.store";
import type { MusicTrack } from "../../types/story.types";

import { StoryCanvasEditor } from "./canvas-editor";
import { DesktopToolbarButton, MobileToolbarButton } from "./toolbars";
import {
  StoryTextEditor,
  StoryLocationEditor,
  StoryAdjustEditor,
  StoryStickersEditor,
  StoryFiltersEditor,
  StoryLinkEditor,
  StoryMentionEditor,
} from "./story-editor";
import { StoryMusicLibrary, StoryMusicTrimmer } from "./story-music";
import getCroppedImg from "../../lib/crop";
import { StoryVideoTrimmer } from "./video-trimmer";

export type EditorMode =
  | "none"
  | "music"
  | "filters"
  | "trim"
  | "stickers"
  | "text"
  | "adjust"
  | "location"
  | "videoTrim"
  | "link"
  | "mention";

export default function CreateStoryModal() {
  const { user } = useAuthStore();
  const store = useStoryStore();

  const [editorMode, setEditorMode] = useState<EditorMode>("none");
  const [croppedPixels, setCroppedPixels] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [partThumbnails, setPartThumbnails] = useState<string[]>([]);
  const [activePartIndex, setActivePartIndex] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTrimDuration = store.videoTrim.end - store.videoTrim.start;
  const partsCount =
    store.draftType === "video" ? Math.ceil(currentTrimDuration / 30) : 1;

  useEffect(() => {
    if (store.draftType !== "video" || !store.draftPreview || partsCount <= 1) {
      setPartThumbnails([]);
      setActivePartIndex(0);
      return;
    }
    const video = document.createElement("video");
    video.src = store.draftPreview;
    video.muted = true;

    video.onloadedmetadata = async () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 100;
      canvas.height = 178;
      const thumbs: string[] = [];

      for (let i = 0; i < partsCount; i++) {
        const chunkStart = store.videoTrim.start + i * 30;
        video.currentTime = chunkStart;
        await new Promise((resolve) => {
          video.onseeked = () => {
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              thumbs.push(canvas.toDataURL("image/jpeg", 0.5));
            }
            resolve(null);
          };
        });
      }
      setPartThumbnails(thumbs);
    };
  }, [
    store.draftPreview,
    store.draftType,
    store.videoTrim.start,
    store.videoTrim.end,
    partsCount,
  ]);

  useEffect(() => {
    if (store.draftType !== "video" || !store.isCreateModalOpen) return;
    const interval = setInterval(() => {
      const videoElement = document.querySelector("video");
      if (videoElement) {
        const partStart = store.videoTrim.start + activePartIndex * 30;
        const partEnd = Math.min(partStart + 30, store.videoTrim.end);

        if (
          videoElement.currentTime >= partEnd ||
          videoElement.currentTime < partStart
        ) {
          videoElement.currentTime = partStart;
          videoElement.play().catch(() => {});
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [
    store.draftType,
    store.isCreateModalOpen,
    store.videoTrim.start,
    store.videoTrim.end,
    activePartIndex,
  ]);

  useEffect(() => {
    if (store.draftType === "video") {
      const videos = document.querySelectorAll("video");
      videos.forEach((vid) => {
        vid.muted = store.isVideoMuted;
      });
    }
  }, [store.isVideoMuted, store.draftPreview, store.draftType, editorMode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleTimeUpdate = () => {
      if (store.selectedMusic && editorMode !== "music") {
        if (audio.currentTime >= store.musicStartTime + store.musicDuration) {
          audio.currentTime = store.musicStartTime;
          audio.play().catch(() => {});
        }
      }
    };
    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, [
    store.musicStartTime,
    store.musicDuration,
    store.selectedMusic,
    editorMode,
  ]);

  if (!store.isCreateModalOpen) return null;

  const handleSelectMusic = (music: MusicTrack) => {
    store.setSelectedMusic(music);
    if (audioRef.current) {
      audioRef.current.src = music.url;
      audioRef.current.play();
    }
    store.setPlayingMusicId(music.id);
    setEditorMode("trim");
  };

  const handleApplyCrop = async () => {
    if (store.draftType === "image" && croppedPixels && store.draftPreview) {
      try {
        setIsProcessingCrop(true);
        const croppedFile = await getCroppedImg(
          store.draftPreview,
          croppedPixels,
          "cropped-story.jpeg",
        );
        if (croppedFile) {
          const oldPreview = store.draftPreview;
          useStoryStore.setState({
            draftFile: croppedFile,
            draftPreview: URL.createObjectURL(croppedFile),
            mediaTransform: { scale: 1, x: 0, y: 0 },
          });
          URL.revokeObjectURL(oldPreview);
        }
      } catch (error) {
        console.error("Failed to crop:", error);
      } finally {
        setIsProcessingCrop(false);
        setEditorMode("none");
      }
    } else {
      setEditorMode("none");
    }
  };

  const handleShareStory = async () => {
    setIsProcessing(true);
    try {
      if (store.draftType === "image") {
        const frameNode = document.getElementById("story-capture-frame");
        if (frameNode) {
          const blob = await toBlob(frameNode, {
            quality: 0.9,
            pixelRatio: 2,
            filter: (node) => {
              if (
                node instanceof HTMLElement &&
                node.dataset.interactive === "true"
              )
                return false;
              return true;
            },
          });

          if (blob) {
            const flattenedFile = new File([blob], "flattened-story.jpg", {
              type: "image/jpeg",
            });
            useStoryStore.setState({
              texts: [],
              stickers: [],
              mentions: [],
              selectedFilter: "none",
              mediaTransform: { scale: 1, x: 0, y: 0 },
            });
            await store.uploadStory(user?._id, flattenedFile);
            return;
          }
        }
      }
      await store.uploadStory(user?._id);
    } catch (error) {
      console.error("Share error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditor = (mode: EditorMode) => {
    setEditorMode(mode);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black sm:bg-neutral-900/90 sm:backdrop-blur-sm sm:p-6 animate-in fade-in duration-200">
      <button
        onClick={() => store.setCreateModalOpen(false)}
        className="absolute top-6 right-6 text-white hover:bg-white/20 transition z-[160] bg-white/10 p-3 rounded-full backdrop-blur-md hidden sm:block shadow-xl border border-white/20"
      >
        <X size={24} strokeWidth={2.5} />
      </button>

      <div className="relative flex items-center justify-center gap-6 w-full max-w-full h-full">
        <div
          id="story-capture-frame"
          className="relative w-full h-[100dvh] sm:h-[85vh] sm:w-[calc(85vh*9/16)] sm:min-w-[340px] sm:max-w-[480px] bg-black sm:rounded-[2.5rem] overflow-hidden flex flex-col sm:shadow-[0_0_50px_rgba(0,0,0,0.5)] border-0 sm:border-[8px] sm:border-neutral-950 shrink-0"
        >
          <audio ref={audioRef} loop={editorMode !== "trim"} />

          {!store.draftFile ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-neutral-900">
              <button
                onClick={() => store.setCreateModalOpen(false)}
                className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 text-white p-2 sm:hidden bg-black/40 rounded-full"
              >
                <X size={24} />
              </button>
              <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center mb-6 shadow-xl border border-neutral-700">
                <ImageIcon size={48} className="text-white" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Create Story
              </h2>
              <p className="text-[14px] text-neutral-400 mb-8 max-w-[260px]">
                Share a photo or video with your followers. Desktop & Mobile
                optimized.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#0095F6] hover:bg-blue-600 active:scale-95 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
              >
                Select from device
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={(e) =>
                  store.setDraftFile(e.target.files?.[0] || null)
                }
              />
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col bg-black pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <div className="absolute inset-0 z-10">
                <Cropper
                  image={
                    store.draftType === "image"
                      ? store.draftPreview || undefined
                      : undefined
                  }
                  video={
                    store.draftType === "video"
                      ? store.draftPreview || undefined
                      : undefined
                  }
                  crop={{
                    x: store.mediaTransform.x,
                    y: store.mediaTransform.y,
                  }}
                  zoom={store.mediaTransform.scale}
                  aspect={9 / 16}
                  onCropChange={(crop) => {
                    if (editorMode === "adjust")
                      store.setMediaTransform({
                        ...store.mediaTransform,
                        x: crop.x,
                        y: crop.y,
                      });
                  }}
                  onZoomChange={(zoom) => {
                    if (editorMode === "adjust")
                      store.setMediaTransform({
                        ...store.mediaTransform,
                        scale: zoom,
                      });
                  }}
                  onCropComplete={(_, croppedAreaPixels) =>
                    setCroppedPixels(croppedAreaPixels)
                  }
                  showGrid={editorMode === "adjust"}
                  classes={{ containerClassName: "w-full h-full" }}
                  style={{
                    containerStyle: {
                      background: "transparent",
                      pointerEvents: editorMode === "adjust" ? "auto" : "none",
                    },
                    cropAreaStyle: {
                      border:
                        editorMode === "adjust"
                          ? "1.5px solid rgba(255,255,255,0.8)"
                          : "none",
                      boxShadow: "none",
                    },
                    mediaStyle: {
                      filter:
                        store.selectedFilter !== "none"
                          ? store.selectedFilter
                          : undefined,
                    },
                  }}
                />
              </div>

              <div
                className={`absolute inset-0 overflow-hidden ${editorMode === "none" ? "z-20" : "z-0 pointer-events-none"}`}
              >
                <StoryCanvasEditor />
              </div>

              <div
                data-interactive="true"
                className={`absolute bottom-10 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-black/60 border border-red-500/50 backdrop-blur-md flex items-center justify-center transition-all duration-300 z-50 ${store.isDraggingItem ? "opacity-100 scale-100 shadow-[0_0_30px_rgba(239,68,68,0.4)]" : "opacity-0 scale-50 pointer-events-none"}`}
              >
                <Trash2 className="text-red-500" size={28} />
              </div>

              {editorMode === "none" && (
                <div
                  data-interactive="true"
                  className="absolute top-0 left-0 right-0 pt-[max(1.5rem,env(safe-area-inset-top))] px-4 flex justify-between items-start z-30 pointer-events-none sm:hidden"
                >
                  <button
                    onClick={() => store.setDraftFile(null)}
                    className="w-10 h-10 shrink-0 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition active:scale-95 pointer-events-auto shadow-lg"
                  >
                    <ChevronLeft size={28} />
                  </button>

                  <div className="flex flex-col items-center gap-2 pointer-events-auto">
                    <button
                      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      className={`w-10 h-10 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition-all active:scale-95 shadow-lg ${isMobileMenuOpen ? "bg-white/20" : ""}`}
                    >
                      <MoreVertical
                        size={24}
                        className={`transition-transform duration-300 ${isMobileMenuOpen ? "rotate-90" : "rotate-0"}`}
                      />
                    </button>

                    <div
                      className={`flex flex-col items-center gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-full shadow-lg max-h-[60vh] overflow-y-auto transition-all duration-300 ease-out origin-top ${isMobileMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-4 pointer-events-none"}`}
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                    >
                      {store.draftType === "video" && (
                        <>
                          <MobileToolbarButton
                            icon={Scissors}
                            onClick={() => openEditor("videoTrim")}
                          />
                          <MobileToolbarButton
                            icon={store.isVideoMuted ? VolumeX : Volume2}
                            onClick={() =>
                              store.setIsVideoMuted(!store.isVideoMuted)
                            }
                            active={store.isVideoMuted}
                          />
                          <div className="w-5 h-px bg-white/20 my-1" />
                        </>
                      )}
                      <MobileToolbarButton
                        icon={AtSign}
                        onClick={() => openEditor("mention")}
                      />
                      <MobileToolbarButton
                        icon={Type}
                        onClick={() => openEditor("text")}
                      />
                      <MobileToolbarButton
                        icon={Smile}
                        onClick={() => openEditor("stickers")}
                      />
                      <MobileToolbarButton
                        icon={MapPin}
                        onClick={() => openEditor("location")}
                      />
                      <MobileToolbarButton
                        icon={LinkIcon}
                        onClick={() => openEditor("link")}
                      />
                      <MobileToolbarButton
                        icon={Wand2}
                        onClick={() => openEditor("filters")}
                      />
                      <MobileToolbarButton
                        icon={Maximize}
                        onClick={() => openEditor("adjust")}
                      />
                      <div className="w-5 h-px bg-white/20 my-1" />
                      <MobileToolbarButton
                        icon={Music}
                        onClick={() =>
                          openEditor(store.selectedMusic ? "trim" : "music")
                        }
                        active={!!store.selectedMusic}
                      />
                    </div>
                  </div>
                </div>
              )}

              {editorMode === "none" &&
                partsCount > 1 &&
                partThumbnails.length > 0 && (
                  <div
                    data-interactive="true"
                    className="absolute bottom-24 left-0 right-0 px-4 flex gap-3 overflow-x-auto custom-scrollbar z-30 pointer-events-auto snap-x"
                  >
                    {partThumbnails.map((thumb, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActivePartIndex(idx)}
                        className={`relative w-14 h-24 rounded-lg overflow-hidden shrink-0 snap-start transition-all cursor-pointer ${activePartIndex === idx ? "border-[2px] border-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.4)]" : "border border-white/20 opacity-60"}`}
                      >
                        <img
                          src={thumb}
                          className="w-full h-full object-cover"
                          alt={`Part ${idx + 1}`}
                        />
                        <div className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white font-bold backdrop-blur-sm">
                          Part {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              {editorMode === "none" && (
                <div
                  data-interactive="true"
                  className="absolute bottom-0 left-0 right-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 px-4 bg-gradient-to-t from-black/95 to-transparent z-30 pointer-events-none flex justify-between items-end"
                >
                  <button
                    onClick={() => store.setDraftFile(null)}
                    className="hidden sm:flex w-12 h-12 items-center justify-center bg-white/20 rounded-full text-white backdrop-blur-md hover:bg-white/30 transition active:scale-95 pointer-events-auto shadow-lg"
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    onClick={handleShareStory}
                    disabled={store.isUploading || isProcessing}
                    className="ml-auto bg-white text-black pl-5 pr-6 py-3.5 rounded-full font-bold text-[15px] hover:bg-neutral-200 transition flex justify-center items-center gap-2 disabled:opacity-70 pointer-events-auto shadow-[0_10px_20px_rgba(0,0,0,0.5)] active:scale-95"
                  >
                    {(store.isUploading || isProcessing) && (
                      <Loader2 size={20} className="animate-spin text-black" />
                    )}
                    {partsCount > 1 && !store.isUploading && !isProcessing && (
                      <span className="bg-neutral-200 text-black px-2 py-0.5 rounded-md text-xs font-bold mr-1">
                        {partsCount} Parts
                      </span>
                    )}
                    {store.isUploading || isProcessing
                      ? "Sharing..."
                      : "Share Story"}
                    <ChevronLeft
                      size={20}
                      className="rotate-180"
                      strokeWidth={3}
                    />
                  </button>
                </div>
              )}

              {editorMode === "text" && (
                <StoryTextEditor onClose={() => setEditorMode("none")} />
              )}
              {editorMode === "location" && (
                <StoryLocationEditor onClose={() => setEditorMode("none")} />
              )}
              {editorMode === "link" && (
                <StoryLinkEditor onClose={() => setEditorMode("none")} />
              )}
              {editorMode === "adjust" && (
                <StoryAdjustEditor
                  onClose={handleApplyCrop}
                  isProcessing={isProcessingCrop}
                />
              )}
              {editorMode === "mention" && (
                <StoryMentionEditor onClose={() => setEditorMode("none")} />
              )}
              {editorMode === "stickers" && (
                <StoryStickersEditor onClose={() => setEditorMode("none")} />
              )}
              {editorMode === "filters" && (
                <StoryFiltersEditor onClose={() => setEditorMode("none")} />
              )}
              {editorMode === "music" && (
                <StoryMusicLibrary
                  onClose={() => setEditorMode("none")}
                  onSelectMusic={handleSelectMusic}
                />
              )}
              {editorMode === "trim" && (
                <StoryMusicTrimmer
                  onClose={() => setEditorMode("none")}
                  onBackToLibrary={() => setEditorMode("music")}
                />
              )}
              {editorMode === "videoTrim" && (
                <StoryVideoTrimmer onClose={() => setEditorMode("none")} />
              )}
            </div>
          )}
        </div>

        {store.draftFile && editorMode === "none" && (
          <div className="hidden sm:flex flex-col gap-3 z-40 bg-neutral-900/80 backdrop-blur-xl p-3 rounded-3xl border border-white/10 shadow-2xl shrink-0 animate-in fade-in slide-in-from-left-4">
            {store.draftType === "video" && (
              <>
                <DesktopToolbarButton
                  icon={Scissors}
                  label="Trim"
                  onClick={() => setEditorMode("videoTrim")}
                />
                <DesktopToolbarButton
                  icon={store.isVideoMuted ? VolumeX : Volume2}
                  label="Sound"
                  active={store.isVideoMuted}
                  onClick={() => store.setIsVideoMuted(!store.isVideoMuted)}
                />
                <div className="w-10 h-px bg-white/10 mx-auto my-1" />
              </>
            )}
            <DesktopToolbarButton
              icon={AtSign}
              label="Mention"
              onClick={() => setEditorMode("mention")}
            />
            <DesktopToolbarButton
              icon={Type}
              label="Text"
              onClick={() => setEditorMode("text")}
            />
            <DesktopToolbarButton
              icon={Smile}
              label="Stickers"
              onClick={() => setEditorMode("stickers")}
            />
            <DesktopToolbarButton
              icon={MapPin}
              label="Location"
              onClick={() => setEditorMode("location")}
            />
            <DesktopToolbarButton
              icon={LinkIcon}
              label="Link"
              onClick={() => setEditorMode("link")}
            />
            <DesktopToolbarButton
              icon={Wand2}
              label="Filters"
              onClick={() => setEditorMode("filters")}
            />
            <DesktopToolbarButton
              icon={Maximize}
              label="Adjust"
              onClick={() => setEditorMode("adjust")}
            />
            <div className="w-10 h-px bg-white/10 mx-auto my-1" />
            <button
              onClick={() =>
                setEditorMode(store.selectedMusic ? "trim" : "music")
              }
              className={`flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all active:scale-95 ${store.selectedMusic ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]" : "bg-white/5 text-white hover:bg-white/10"}`}
            >
              <Music size={22} />
              <span className="text-[10px] font-medium truncate w-14 text-center">
                {store.selectedMusic ? "Edit Audio" : "Music"}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
