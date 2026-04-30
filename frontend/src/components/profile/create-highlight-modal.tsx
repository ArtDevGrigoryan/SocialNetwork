import { useEffect, useState } from "react";
import { X, Check, Loader2, ChevronLeft } from "lucide-react";
import { useArchiveStore } from "../../store/archive.store";
import { useHighlightStore } from "../../store/highlight.store";
import toast from "react-hot-toast";

export const CreateHighlightModal = () => {
  const {
    archives,
    fetchArchives,
    loading: archivesLoading,
  } = useArchiveStore();
  const { isCreateModalOpen, setCreateModalOpen, createHighlight } =
    useHighlightStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [title, setTitle] = useState("Highlights");
  const [step, setStep] = useState<"select" | "details">("select");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isCreateModalOpen) {
      fetchArchives(true);
      setSelectedIds([]);
      setTitle("Highlights");
      setStep("select");
    }
  }, [isCreateModalOpen, fetchArchives]);

  if (!isCreateModalOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleNext = () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one story");
      return;
    }
    setStep("details");
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    setIsSubmitting(true);
    try {
      const coverArchive = archives.find((a) => a._id === selectedIds[0]);
      const coverUrl =
        coverArchive?.media?.thumbnail || coverArchive?.media?.url || "";

      await createHighlight(title, String(coverUrl), selectedIds);
      toast.success("Highlight created successfully!");
      setCreateModalOpen(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to create highlight",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedArchivePreview = archives.find((a) => a._id === selectedIds[0]);
  const previewUrl =
    selectedArchivePreview?.media?.thumbnail ||
    selectedArchivePreview?.media?.url;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#262626] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[70vh] sm:h-[600px] animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            {step === "details" ? (
              <button
                onClick={() => setStep("select")}
                className="text-white hover:text-neutral-400 transition"
              >
                <ChevronLeft size={28} />
              </button>
            ) : (
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-white hover:text-neutral-400 transition"
              >
                <X size={28} />
              </button>
            )}
            <h2 className="text-white font-bold text-lg">
              {step === "select" ? "New Highlight" : "Title"}
            </h2>
          </div>

          {step === "select" ? (
            <button
              onClick={handleNext}
              className="text-[#0095f6] font-semibold text-[15px] hover:text-white transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={isSubmitting}
              className="text-[#0095f6] font-semibold text-[15px] hover:text-white transition disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Add"
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/20">
          {step === "select" ? (
            archivesLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-neutral-500 w-8 h-8" />
              </div>
            ) : archives.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-500 gap-2">
                <span className="text-4xl">📭</span>
                <p className="font-medium">No archived stories found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-[2px]">
                {archives.map((archive) => {
                  const isSelected = selectedIds.includes(archive._id);
                  return (
                    <div
                      key={archive._id}
                      onClick={() => toggleSelect(archive._id)}
                      className="relative aspect-[9/16] bg-neutral-900 overflow-hidden cursor-pointer group"
                    >
                      {archive.media.type === "video" ? (
                        <video
                          src={archive.media.url}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={archive.media.thumbnail || archive.media.url}
                          className="w-full h-full object-cover"
                          alt="archive"
                        />
                      )}

                      <div
                        className={`absolute inset-0 transition-all ${isSelected ? "bg-white/30" : "group-hover:bg-black/20"}`}
                      />

                      <div
                        className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-[#0095f6] border-[#0095f6]" : "border-white/70 bg-black/20"}`}
                      >
                        {isSelected && (
                          <Check
                            size={14}
                            className="text-white"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center py-10 px-6">
              <div className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-neutral-700 overflow-hidden mb-6 p-1">
                <div className="w-full h-full rounded-full overflow-hidden">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      className="w-full h-full object-cover bg-black"
                      alt="cover preview"
                    />
                  )}
                </div>
              </div>

              <div className="w-full relative">
                <input
                  type="text"
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Highlight Name"
                  className="w-full bg-transparent border-b-2 border-neutral-600 focus:border-white px-2 py-2 text-white outline-none text-center font-medium text-lg transition-colors placeholder:text-neutral-600"
                  maxLength={15}
                />
                <span className="absolute right-0 bottom-3 text-xs text-neutral-500">
                  {title.length}/15
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
