import { useState, useRef, useEffect, type ChangeEvent } from "react";
import {
  X,
  Music,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Play,
  Pause,
} from "lucide-react";
import { api } from "../../lib/axios.config";

const MUSIC_LIBRARY = [
  {
    id: "1",
    title: "Summer Walk",
    artist: "Olexy",
    url: "https://cdn.pixabay.com/audio/2022/08/04/audio_2dde668d05.mp3",
  },
  {
    id: "2",
    title: "Lofi Study",
    artist: "FASSounds",
    url: "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3",
  },
  {
    id: "3",
    title: "Good Night",
    artist: "FASSounds",
    url: "https://cdn.pixabay.com/audio/2022/04/27/audio_4f61f77d3a.mp3",
  },
  {
    id: "4",
    title: "Cinematic Chill",
    artist: "Lexin_Music",
    url: "https://cdn.pixabay.com/audio/2022/08/02/audio_884fe92c21.mp3",
  },
];

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateStoryModal({
  isOpen,
  onClose,
}: CreateStoryModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [type, setType] = useState<"image" | "video">("image");
  const [selectedMusic, setSelectedMusic] = useState<
    (typeof MUSIC_LIBRARY)[0] | null
  >(null);
  const [showMusicList, setShowMusicList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setPreview("");
      setSelectedMusic(null);
      setShowMusicList(false);
      setPlayingId(null);
      if (audioRef.current) audioRef.current.pause();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setType(selected.type.startsWith("video/") ? "video" : "image");
    setPreview(URL.createObjectURL(selected));
  };

  const togglePlay = (
    music: (typeof MUSIC_LIBRARY)[0],
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();
    if (playingId === music.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = music.url;
        audioRef.current.play();
      }
      setPlayingId(music.id);
    }
  };

  const handleSelectMusic = (music: (typeof MUSIC_LIBRARY)[0]) => {
    setSelectedMusic(music);
    setShowMusicList(false);
    if (audioRef.current) {
      audioRef.current.src = music.url;
      audioRef.current.play();
    }
    setPlayingId(music.id);
  };

  const handleSubmit = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("story", file);
      formData.append("type", type);
      // Zod schema requires non-empty string, so we send "none" if no music is selected
      formData.append("musicUrl", selectedMusic ? selectedMusic.url : "none");

      await api.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      window.dispatchEvent(new Event("story:created")); // Refresh stories
      onClose();
    } catch (error) {
      console.error("Error uploading story:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:scale-110 transition z-[110]"
      >
        <X size={30} />
      </button>

      <div className="relative bg-neutral-950 w-full max-w-[450px] aspect-[9/16] max-h-[90vh] rounded-xl overflow-hidden border border-neutral-800 flex flex-col shadow-2xl">
        <audio ref={audioRef} loop />

        {!file ? (
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
            {/* Top Controls Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
              <button
                onClick={() => setFile(null)}
                className="text-white text-sm font-medium hover:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowMusicList(!showMusicList)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md transition ${selectedMusic ? "bg-white text-black" : "bg-black/50 text-white border border-white/20"}`}
              >
                <Music size={16} />
                <span className="text-sm font-semibold">
                  {selectedMusic ? selectedMusic.title : "Add Music"}
                </span>
              </button>
            </div>

            {/* Media Preview */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              {type === "image" ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={preview}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Music Selection Bottom Sheet */}
            {showMusicList && (
              <div className="absolute inset-x-0 bottom-16 bg-neutral-900 rounded-t-2xl p-4 shadow-xl border-t border-neutral-800 animate-in slide-in-from-bottom-10 z-20">
                <div className="w-12 h-1 bg-neutral-700 rounded-full mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-4 text-center">
                  Music Library
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {MUSIC_LIBRARY.map((music) => (
                    <div
                      key={music.id}
                      onClick={() => handleSelectMusic(music)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${selectedMusic?.id === music.id ? "bg-neutral-800" : "hover:bg-neutral-800/50"}`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => togglePlay(music, e)}
                          className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-white hover:bg-neutral-600 transition"
                        >
                          {playingId === music.id ? (
                            <Pause size={18} />
                          ) : (
                            <Play size={18} className="ml-1" />
                          )}
                        </button>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {music.title}
                          </p>
                          <p className="text-neutral-400 text-xs">
                            {music.artist}
                          </p>
                        </div>
                      </div>
                      {selectedMusic?.id === music.id && (
                        <CheckCircle2 size={20} className="text-blue-500" />
                      )}
                    </div>
                  ))}

                  {/* Remove Music Option */}
                  <div
                    onClick={() => {
                      setSelectedMusic(null);
                      setShowMusicList(false);
                      setPlayingId(null);
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

            {/* Submit Button Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-white text-black py-3 rounded-full font-semibold text-sm hover:bg-neutral-200 transition flex justify-center items-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                {loading ? "Sharing..." : "Share to Story"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
