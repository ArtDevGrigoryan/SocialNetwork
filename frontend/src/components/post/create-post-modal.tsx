import { useState, useRef } from "react";
import { X, Image as ImageIcon, Loader2 } from "lucide-react";
import { api } from "../../lib/axios.config";

export default function CreatePostModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUpload = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("content", content);
    if (file) formData.append("post", file);

    try {
      await api.post("/posts", formData);
      onClose();
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-neutral-900 w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[80vh]">
        <div className="w-full md:w-1/2 aspect-square bg-black flex items-center justify-center border-r border-neutral-800 relative">
          {preview ? (
            <img src={preview} className="w-full h-full object-cover" />
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center text-neutral-500 gap-2"
            >
              <ImageIcon size={48} strokeWidth={1} />
              <span className="text-sm">Select from computer</span>
            </button>
          )}
          <input
            type="file"
            ref={inputRef}
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFile(f);
                setPreview(URL.createObjectURL(f));
              }
            }}
          />
        </div>

        <div className="flex-1 p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Create New Post</h3>
            <button
              onClick={handleUpload}
              disabled={loading}
              className="text-blue-500 font-bold hover:text-white disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Share"}
            </button>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a caption..."
            className="w-full flex-1 bg-transparent border-none focus:ring-0 text-sm resize-none custom-scrollbar"
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white md:hidden"
          >
            <X />
          </button>
        </div>
      </div>
    </div>
  );
}
