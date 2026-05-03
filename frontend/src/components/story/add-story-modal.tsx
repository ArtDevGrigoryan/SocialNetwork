import { useRef, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
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
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { useStoryStore } from "../../store/story.store";
import type { MusicTrack } from "../../types/story.types";

import { DraggableOverlay } from "./draggable-overlay";
import {
  StoryTextEditor,
  StoryLocationEditor,
  StoryAdjustEditor,
  StoryStickersEditor,
  StoryFiltersEditor,
} from "./story-editor";
import { StoryMusicLibrary, StoryMusicTrimmer } from "./story-music";
import getCroppedImg from "../../lib/crop";

export type EditorMode =
  | "none"
  | "music"
  | "filters"
  | "trim"
  | "stickers"
  | "text"
  | "adjust"
  | "location";

export default function CreateStoryModal() {
  const { user } = useAuthStore();
  const store = useStoryStore();

  const [editorMode, setEditorMode] = useState<EditorMode>("none");
  const [croppedPixels, setCroppedPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    window.dispatchEvent(new Event("story:opened"));

    const handleTimeUpdate = () => {
      if (store.selectedMusic && editorMode !== "music") {
        if (audio.currentTime >= store.musicStartTime + store.musicDuration) {
          audio.currentTime = store.musicStartTime;
          audio.play().catch(() => {});
        }
      }
    };
    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      window.dispatchEvent(new Event("story:closed"));
    };
  }, [
    store.musicStartTime,
    store.musicDuration,
    store.selectedMusic,
    editorMode,
  ]);

  useEffect(() => {
    if (store.selectedMusic && audioRef.current) {
      audioRef.current.currentTime = store.musicStartTime;
      audioRef.current.play().catch(() => {});
    }
  }, [store.musicStartTime, store.selectedMusic]);

  useEffect(() => {
    if (!store.isCreateModalOpen) {
      if (audioRef.current) audioRef.current.pause();
      setEditorMode("none");
    }
  }, [store.isCreateModalOpen]);

  if (!store.isCreateModalOpen) return null;

  const handleSelectMusic = (music: MusicTrack) => {
    store.setSelectedMusic(music);
    store.setMusicStartTime(0);
    if (audioRef.current) {
      audioRef.current.src = music.url;
      audioRef.current.play();
    }
    store.setPlayingMusicId(music.id);
    setEditorMode("trim");
  };

  const closeEditor = () => setEditorMode("none");

  // Նոր ֆունկցիա՝ հենց Adjust-ն ավարտում ենք, ֆիզիկապես կտրում է
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
          // State-ը թարմացնում ենք անմիջապես, առանց ջնջելու ստիկերները
          useStoryStore.setState({
            draftFile: croppedFile,
            draftPreview: URL.createObjectURL(croppedFile),
            mediaTransform: { scale: 1, x: 0, y: 0 },
          });
          URL.revokeObjectURL(oldPreview); // Ջնջում ենք հին URL-ը հիշողությունից
        }
      } catch (error) {
        console.error("Failed to apply crop:", error);
      } finally {
        setIsProcessingCrop(false);
        setEditorMode("none");
      }
    } else {
      setEditorMode("none");
    }
  };

  const handleShareStory = async () => {
    // Քանի որ մենք արդեն նկարը կտրում ենք Adjust-ի ժամանակ,
    // այստեղ պարզապես ապահովագրում ենք այն դեպքը, եթե user-ը առանց Adjust մտնելու Share տա։
    if (store.draftType === "image" && croppedPixels && store.draftPreview) {
      try {
        setIsProcessing(true);
        const croppedFile = await getCroppedImg(
          store.draftPreview,
          croppedPixels,
          "cropped-story.jpeg",
        );

        if (croppedFile) {
          await store.uploadStory(user?._id, croppedFile);
          return;
        }
      } catch (error) {
        console.error("Failed to crop image:", error);
      } finally {
        setIsProcessing(false);
      }
    }

    await store.uploadStory(user?._id);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 sm:p-4 animate-in fade-in duration-200">
      <button
        onClick={() => store.setCreateModalOpen(false)}
        className="absolute top-6 right-6 text-white hover:scale-110 transition z-[160] bg-black/40 p-2.5 rounded-full backdrop-blur-md hidden sm:block shadow-lg"
      >
        <X size={24} strokeWidth={2.5} />
      </button>

      <div className="relative bg-black w-full h-[100dvh] sm:h-auto sm:aspect-[9/16] sm:max-h-[90vh] sm:rounded-2xl overflow-hidden flex flex-col sm:shadow-2xl">
        <audio ref={audioRef} loop={editorMode !== "trim"} />

        {!store.draftFile ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-neutral-900">
            <button
              onClick={() => store.setCreateModalOpen(false)}
              className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 text-white p-2 sm:hidden bg-black/40 rounded-full"
            >
              <X size={24} />
            </button>
            <div className="w-24 h-24 bg-neutral-800 rounded-full flex items-center justify-center mb-6 shadow-xl">
              <ImageIcon size={48} className="text-white" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Add to Story</h2>
            <p className="text-[15px] text-neutral-400 mb-8 max-w-[260px]">
              Share a photo or video with your friends and followers.
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
              onChange={(e) => store.setDraftFile(e.target.files?.[0] || null)}
            />
          </div>
        ) : (
          <div className="relative w-full h-full flex flex-col bg-black overflow-hidden">
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
                crop={{ x: store.mediaTransform.x, y: store.mediaTransform.y }}
                zoom={store.mediaTransform.scale}
                aspect={9 / 16}
                onCropChange={(crop) => {
                  if (editorMode === "adjust") {
                    store.setMediaTransform({
                      ...store.mediaTransform,
                      x: crop.x,
                      y: crop.y,
                    });
                  }
                }}
                onZoomChange={(zoom) => {
                  if (editorMode === "adjust") {
                    store.setMediaTransform({
                      ...store.mediaTransform,
                      scale: zoom,
                    });
                  }
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
                        ? "1px solid rgba(255,255,255,0.5)"
                        : "none",
                    boxShadow: editorMode === "adjust" ? undefined : "none", // Թաքցնում է background-ի մութ մասերը կտրելուց հետո
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

            {/* Draggable Overlays */}
            <div className="absolute inset-0 z-20 pointer-events-none">
              {store.storyLocation && (
                <DraggableOverlay
                  item={{ id: "location", ...store.storyLocation }}
                  onUpdate={(_, updates) =>
                    store.updateLocation(updates as any)
                  }
                  onRemove={() => store.setStoryLocation(null)}
                >
                  <div className="bg-white/95 text-black px-4 py-2 rounded-xl font-bold text-[15px] flex items-center gap-1.5 shadow-xl whitespace-nowrap">
                    <MapPin size={18} className="text-[#0095F6]" />{" "}
                    {store.storyLocation.name}
                  </div>
                </DraggableOverlay>
              )}

              {store.stickers.map((s) => (
                <DraggableOverlay
                  key={s.id}
                  item={s}
                  onUpdate={store.updateSticker}
                  onRemove={store.removeSticker}
                >
                  <span className="text-7xl drop-shadow-2xl">{s.emoji}</span>
                </DraggableOverlay>
              ))}

              {store.texts.map((t) => (
                <DraggableOverlay
                  key={t.id}
                  item={t}
                  onUpdate={store.updateText}
                  onRemove={store.removeText}
                >
                  <span
                    className="text-4xl font-bold whitespace-pre-wrap drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] px-2"
                    style={{ color: t.color, fontFamily: t.fontFamily }}
                  >
                    {t.content}
                  </span>
                </DraggableOverlay>
              ))}
            </div>

            {/* Top Toolbar */}
            {editorMode === "none" && (
              <div className="absolute top-0 left-0 right-0 pt-[max(1rem,env(safe-area-inset-top))] pb-6 px-4 md:px-6 flex justify-between items-start z-30 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-none">
                <button
                  onClick={() => store.setDraftFile(null)}
                  className="w-11 h-11 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition active:scale-95 pointer-events-auto"
                >
                  <ChevronLeft size={28} />
                </button>
                <div className="flex flex-col gap-3 pointer-events-auto">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setEditorMode("adjust")}
                      className="w-11 h-11 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition active:scale-95 shadow-md"
                    >
                      <Maximize size={22} />
                    </button>
                    <button
                      onClick={() => setEditorMode("location")}
                      className="w-11 h-11 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition active:scale-95 shadow-md"
                    >
                      <MapPin size={22} />
                    </button>
                    <button
                      onClick={() => setEditorMode("text")}
                      className="w-11 h-11 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition active:scale-95 shadow-md"
                    >
                      <Type size={22} />
                    </button>
                    <button
                      onClick={() => setEditorMode("stickers")}
                      className="w-11 h-11 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition active:scale-95 shadow-md"
                    >
                      <Smile size={22} />
                    </button>
                    <button
                      onClick={() => setEditorMode("filters")}
                      className="w-11 h-11 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition active:scale-95 shadow-md"
                    >
                      <Wand2 size={22} />
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      setEditorMode(store.selectedMusic ? "trim" : "music")
                    }
                    className={`flex items-center self-end gap-2 px-4 h-11 rounded-full backdrop-blur-md transition active:scale-95 shadow-lg ${
                      store.selectedMusic
                        ? "bg-white text-black font-bold"
                        : "bg-black/40 text-white hover:bg-black/60 font-semibold"
                    }`}
                  >
                    <Music size={20} />
                    <span className="text-[15px] truncate max-w-[100px]">
                      {store.selectedMusic
                        ? store.selectedMusic.title
                        : "Music"}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Sharing Bar */}
            {editorMode === "none" && (
              <div className="absolute bottom-0 left-0 right-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-12 px-4 md:px-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-30 pointer-events-none flex justify-end items-end">
                <button
                  onClick={handleShareStory}
                  disabled={store.isUploading || isProcessing}
                  className="bg-white text-black px-6 py-3.5 rounded-full font-bold text-[15px] hover:bg-neutral-200 transition flex justify-center items-center gap-2 disabled:opacity-70 pointer-events-auto shadow-2xl active:scale-[0.96]"
                >
                  {(store.isUploading || isProcessing) && (
                    <Loader2 size={20} className="animate-spin" />
                  )}
                  {store.isUploading || isProcessing
                    ? "Sharing..."
                    : "Your Story"}
                  <ChevronLeft size={20} className="rotate-180" />
                </button>
              </div>
            )}

            {/* Editor Modes */}
            {editorMode === "text" && <StoryTextEditor onClose={closeEditor} />}
            {editorMode === "location" && (
              <StoryLocationEditor onClose={closeEditor} />
            )}
            {editorMode === "adjust" && (
              <StoryAdjustEditor
                onClose={handleApplyCrop}
                isProcessing={isProcessingCrop}
              />
            )}
            {editorMode === "stickers" && (
              <StoryStickersEditor onClose={closeEditor} />
            )}
            {editorMode === "filters" && (
              <StoryFiltersEditor onClose={closeEditor} />
            )}
            {editorMode === "music" && (
              <StoryMusicLibrary
                onClose={closeEditor}
                onSelectMusic={handleSelectMusic}
              />
            )}
            {editorMode === "trim" && (
              <StoryMusicTrimmer
                onClose={closeEditor}
                onBackToLibrary={() => setEditorMode("music")}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
