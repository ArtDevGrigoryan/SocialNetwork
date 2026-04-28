import { useRef, useEffect, useState } from "react";
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDraggingBg = useRef(false);
  const startBgPos = useRef({ x: 0, y: 0 });

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

  // Background drag logic
  const handleBgPointerDown = (e: React.PointerEvent) => {
    if (editorMode !== "none" && editorMode !== "adjust") return;
    isDraggingBg.current = true;
    startBgPos.current = {
      x: e.clientX - store.mediaTransform.x,
      y: e.clientY - store.mediaTransform.y,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBgPointerMove = (e: React.PointerEvent) => {
    if (!isDraggingBg.current) return;
    const newX = e.clientX - startBgPos.current.x;
    const newY = e.clientY - startBgPos.current.y;
    store.setMediaTransform({ x: newX, y: newY });
  };

  const handleBgPointerUp = (e: React.PointerEvent) => {
    isDraggingBg.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <button
        onClick={() => store.setCreateModalOpen(false)}
        className="absolute top-4 right-4 text-white hover:scale-110 transition z-[110]"
      >
        <X size={30} />
      </button>

      <div className="relative bg-neutral-950 w-full max-w-[450px] aspect-[9/16] max-h-[90vh] rounded-xl overflow-hidden border border-neutral-800 flex flex-col shadow-2xl">
        <audio ref={audioRef} loop={editorMode !== "trim"} />

        {!store.draftFile ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-4">
              <ImageIcon size={40} className="text-neutral-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Create Story
            </h2>
            <p className="text-sm text-neutral-400 mb-6">
              Share a photo or video to your story.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition"
            >
              Select from computer
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
          <div className="relative w-full h-full flex flex-col bg-neutral-900 overflow-hidden">
            {/* Main Media Preview with Drag Support */}
            <div
              className="absolute inset-0 flex items-center justify-center overflow-hidden cursor-move touch-none"
              onPointerDown={handleBgPointerDown}
              onPointerMove={handleBgPointerMove}
              onPointerUp={handleBgPointerUp}
              onPointerCancel={handleBgPointerUp}
            >
              {store.draftType === "image" ? (
                <img
                  src={store.draftPreview || ""}
                  alt="Preview"
                  style={{
                    filter:
                      store.selectedFilter !== "none"
                        ? store.selectedFilter
                        : undefined,
                    transform: `scale(${store.mediaTransform.scale}) translate(${store.mediaTransform.x}px, ${store.mediaTransform.y}px)`,
                  }}
                  className="w-full h-full object-cover pointer-events-none transition-transform duration-75"
                />
              ) : (
                <video
                  src={store.draftPreview || ""}
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{
                    filter:
                      store.selectedFilter !== "none"
                        ? store.selectedFilter
                        : undefined,
                    transform: `scale(${store.mediaTransform.scale}) translate(${store.mediaTransform.x}px, ${store.mediaTransform.y}px)`,
                  }}
                  className="w-full h-full object-cover pointer-events-none transition-transform duration-75"
                />
              )}
            </div>

            {/* Draggable Overlays */}
            {store.storyLocation && (
              <DraggableOverlay
                item={{ id: "location", ...store.storyLocation }}
                onUpdate={(_, updates) => store.updateLocation(updates as any)}
                onRemove={() => store.setStoryLocation(null)}
              >
                <div className="bg-white/90 text-black px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1.5 shadow-xl whitespace-nowrap">
                  <MapPin size={16} className="text-blue-500" />{" "}
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
                <span className="text-6xl drop-shadow-xl">{s.emoji}</span>
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
                  className="text-3xl font-bold whitespace-pre-wrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  style={{ color: t.color, fontFamily: t.fontFamily }}
                >
                  {t.content}
                </span>
              </DraggableOverlay>
            ))}

            {/* Top Toolbar */}
            {editorMode === "none" && (
              <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-30 bg-gradient-to-b from-black/60 to-transparent">
                <button
                  onClick={() => store.setDraftFile(null)}
                  className="w-8 h-8 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-md"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditorMode("adjust")}
                    className="w-9 h-9 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition"
                  >
                    <Maximize size={18} />
                  </button>
                  <button
                    onClick={() => setEditorMode("location")}
                    className="w-9 h-9 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition"
                  >
                    <MapPin size={18} />
                  </button>
                  <button
                    onClick={() => setEditorMode("text")}
                    className="w-9 h-9 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition"
                  >
                    <Type size={18} />
                  </button>
                  <button
                    onClick={() => setEditorMode("stickers")}
                    className="w-9 h-9 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition"
                  >
                    <Smile size={18} />
                  </button>
                  <button
                    onClick={() => setEditorMode("filters")}
                    className="w-9 h-9 flex items-center justify-center bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition"
                  >
                    <Wand2 size={18} />
                  </button>
                  <button
                    onClick={() =>
                      setEditorMode(store.selectedMusic ? "trim" : "music")
                    }
                    className={`flex items-center gap-2 px-3 h-9 rounded-full backdrop-blur-md transition ${store.selectedMusic ? "bg-white text-black" : "bg-black/40 text-white hover:bg-black/60"}`}
                  >
                    <Music size={16} />
                    <span className="text-sm font-semibold truncate max-w-[80px]">
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
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-30 pointer-events-none flex gap-2">
                <button
                  onClick={() => store.uploadStory(user?._id)}
                  disabled={store.isUploading}
                  className="flex-1 bg-white text-black py-3 rounded-full font-semibold text-sm hover:bg-neutral-200 transition flex justify-center items-center gap-2 disabled:opacity-70 pointer-events-auto shadow-lg"
                >
                  {store.isUploading && (
                    <Loader2 size={18} className="animate-spin" />
                  )}
                  {store.isUploading ? "Sharing..." : "Share to Story"}
                </button>
              </div>
            )}

            {/* Render Active Editor Mode */}
            {editorMode === "text" && <StoryTextEditor onClose={closeEditor} />}
            {editorMode === "location" && (
              <StoryLocationEditor onClose={closeEditor} />
            )}
            {editorMode === "adjust" && (
              <StoryAdjustEditor onClose={closeEditor} />
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
