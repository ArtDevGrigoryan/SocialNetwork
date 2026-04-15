import { useState, useRef } from "react";
import { X, Upload, Music, Image as ImageIcon, Video } from "lucide-react";
import { api } from "../../lib/axios.config";

interface AddStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddStoryModal({ isOpen, onClose }: AddStoryModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "video">("image");
  const [musicUrl, setMusicUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      // Որոշել ֆայլի տեսակը
      setFileType(file.type.startsWith("video/") ? "video" : "image");
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !musicUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      // 'story' դաշտը համապատասխանում է backend-ի upload.single("story")-ին
      formData.append("story", selectedFile);
      // 'type' և 'musicUrl' համապատասխանում են addStorySchema-ին
      formData.append("type", fileType);
      formData.append("musicUrl", musicUrl);

      await api.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      handleClose();
      window.location.reload(); // Պարզության համար թարմացնում ենք էջը՝ նոր սթորին տեսնելու համար
    } catch (error) {
      console.error("Error uploading story:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSelectedFile(null);
    setPreviewUrl(null);
    setMusicUrl("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-neutral-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 hover:text-neutral-300 transition-colors text-white"
          >
            <X size={24} />
          </button>
          <h2 className="font-semibold text-white">Ավելացնել Սթորի</h2>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || !musicUrl.trim() || isSubmitting}
            className="text-blue-500 font-semibold hover:text-blue-400 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? "Բեռնվում է..." : "Կիսվել"}
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col p-4 gap-4">
          {/* File Preview / Upload Box */}
          <div
            className="w-full aspect-[9/16] bg-black rounded-xl border-2 border-dashed border-neutral-700 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer"
            onClick={() => !previewUrl && fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <>
                {fileType === "video" ? (
                  <video
                    src={previewUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
                <div
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <Upload size={32} className="text-white" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-neutral-500 gap-2">
                <div className="flex gap-2 mb-2">
                  <ImageIcon size={32} />
                  <Video size={32} />
                </div>
                <span>Ընտրեք նկար կամ վիդեո</span>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
          </div>

          {/* Music URL Input */}
          <div className="bg-black rounded-xl p-3 flex items-center gap-3 border border-neutral-800">
            <Music
              size={20}
              className={musicUrl.trim() ? "text-blue-500" : "text-neutral-500"}
            />
            <input
              type="text"
              value={musicUrl}
              onChange={(e) => setMusicUrl(e.target.value)}
              placeholder="Երաժշտության հղում (պարտադիր)"
              className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none placeholder-neutral-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
