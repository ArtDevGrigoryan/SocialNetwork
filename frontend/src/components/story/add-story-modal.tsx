import { useRef, useEffect, useState, type ChangeEvent } from "react";
import {
  X,
  Music,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Play,
  Pause,
  Search,
} from "lucide-react";
import { useAuthStore } from "../../store/auth.store";
import { useStoryStore } from "../../store/story.store";
import type { MusicTrack } from "../../types/story.types";

export default function CreateStoryModal() {
  const { user } = useAuthStore();
  const {
    isCreateModalOpen,
    setCreateModalOpen,
    draftFile,
    draftPreview,
    draftType,
    selectedMusic,
    showMusicList,
    playingMusicId,
    musicResults,
    isSearchingMusic,
    isUploading,
    setDraftFile,
    setSelectedMusic,
    setShowMusicList,
    setPlayingMusicId,
    searchMusic,
    uploadStory,
  } = useStoryStore();

  const [searchQuery, setSearchQuery] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showMusicList) return;

    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        searchMusic(searchQuery);
      } else {
        searchMusic("trending pop");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, showMusicList, searchMusic]);

  useEffect(() => {
    if (!isCreateModalOpen) {
      if (audioRef.current) audioRef.current.pause();
      setSearchQuery("");
    }
  }, [isCreateModalOpen]);

  if (!isCreateModalOpen) return null;

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setDraftFile(selected);
    }
  };

  const togglePlay = (music: MusicTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingMusicId === music.id) {
      audioRef.current?.pause();
      setPlayingMusicId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = music.url;
        audioRef.current.play();
      }
      setPlayingMusicId(music.id);
    }
  };

  const handleSelectMusic = (music: MusicTrack) => {
    setSelectedMusic(music);
    setShowMusicList(false);
    if (audioRef.current) {
      audioRef.current.src = music.url;
      audioRef.current.play();
    }
    setPlayingMusicId(music.id);
  };

  const handleSubmit = async () => {
    await uploadStory(user?._id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <button
        onClick={() => setCreateModalOpen(false)}
        className="absolute top-4 right-4 text-white hover:scale-110 transition z-[110]"
      >
        <X size={30} />
      </button>

      <div className="relative bg-neutral-950 w-full max-w-[450px] aspect-[9/16] max-h-[90vh] rounded-xl overflow-hidden border border-neutral-800 flex flex-col shadow-2xl">
        <audio ref={audioRef} loop />

        {!draftFile ? (
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
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className="relative w-full h-full flex flex-col bg-black">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
              <button
                onClick={() => setDraftFile(null)}
                className="text-white text-sm font-medium hover:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowMusicList(!showMusicList)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md transition ${
                  selectedMusic
                    ? "bg-white text-black"
                    : "bg-black/50 text-white border border-white/20"
                }`}
              >
                <Music size={16} />
                <span className="text-sm font-semibold truncate max-w-[120px]">
                  {selectedMusic ? selectedMusic.title : "Add Music"}
                </span>
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center overflow-hidden">
              {draftType === "image" ? (
                <img
                  src={draftPreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={draftPreview}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Music Library Bottom Sheet */}
            {showMusicList && (
              <div className="absolute inset-x-0 bottom-16 bg-neutral-900 rounded-t-2xl p-4 shadow-xl border-t border-neutral-800 animate-in slide-in-from-bottom-10 z-20 flex flex-col max-h-[60%]">
                <div className="w-12 h-1 bg-neutral-700 rounded-full mx-auto mb-4 shrink-0" />

                {/* Search Input */}
                <div className="relative mb-4 shrink-0">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search size={18} className="text-neutral-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search music..."
                    className="w-full bg-neutral-800 text-white text-sm rounded-xl py-2.5 pl-10 pr-4 outline-none border border-transparent focus:border-neutral-600 transition"
                  />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                  {isSearchingMusic ? (
                    <div className="flex justify-center items-center py-8">
                      <Loader2
                        size={24}
                        className="text-neutral-500 animate-spin"
                      />
                    </div>
                  ) : musicResults.length === 0 ? (
                    <div className="text-center text-neutral-500 text-sm py-8">
                      No music found.
                    </div>
                  ) : (
                    musicResults.map((music) => (
                      <div
                        key={music.id}
                        onClick={() => handleSelectMusic(music)}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                          selectedMusic?.id === music.id
                            ? "bg-neutral-800"
                            : "hover:bg-neutral-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-neutral-800 group">
                            {music.coverArt && (
                              <img
                                src={music.coverArt}
                                alt={music.title}
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition"
                              />
                            )}
                            <button
                              onClick={(e) => togglePlay(music, e)}
                              className="absolute inset-0 flex items-center justify-center text-white"
                            >
                              {playingMusicId === music.id ? (
                                <Pause size={20} className="drop-shadow-md" />
                              ) : (
                                <Play
                                  size={20}
                                  className="ml-1 drop-shadow-md"
                                />
                              )}
                            </button>
                          </div>
                          <div className="truncate">
                            <p className="text-white text-sm font-medium truncate">
                              {music.title}
                            </p>
                            <p className="text-neutral-400 text-xs truncate">
                              {music.artist}
                            </p>
                          </div>
                        </div>
                        {selectedMusic?.id === music.id && (
                          <CheckCircle2
                            size={20}
                            className="text-blue-500 shrink-0 ml-2"
                          />
                        )}
                      </div>
                    ))
                  )}

                  <div
                    onClick={() => {
                      setSelectedMusic(null);
                      setShowMusicList(false);
                      setPlayingMusicId(null);
                      audioRef.current?.pause();
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-neutral-800/50 transition mt-2 border-t border-neutral-800"
                  >
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                      <X size={18} />
                    </div>
                    <p className="text-white text-sm font-medium">No Music</p>
                  </div>
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none">
              <button
                onClick={handleSubmit}
                disabled={isUploading}
                className="w-full bg-white text-black py-3 rounded-full font-semibold text-sm hover:bg-neutral-200 transition flex justify-center items-center gap-2 disabled:opacity-70 pointer-events-auto"
              >
                {isUploading && <Loader2 size={18} className="animate-spin" />}
                {isUploading ? "Sharing..." : "Share to Story"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
