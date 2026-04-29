import type { ChangeEvent, RefObject } from "react";
import { Image as ImageIcon } from "lucide-react";

interface SelectStepProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: ChangeEvent<HTMLInputElement>) => void;
}

export default function SelectStep({
  fileInputRef,
  handleFileSelect,
}: SelectStepProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <ImageIcon size={60} className="text-neutral-300 mb-4" strokeWidth={1} />
      <p className="text-xl text-white mb-6">Drag photos and videos here</p>
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
  );
}
