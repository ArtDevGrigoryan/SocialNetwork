import { Pin, X } from "lucide-react";
import type { PinnedTabProps } from "../types";

export default function PinnedTab({
  message,
  onScrollTo,
  onUnpin,
}: PinnedTabProps) {
  if (!message) return null;

  const msgId = typeof message === "string" ? message : message._id;
  const displayText =
    typeof message === "string"
      ? "Pinned message"
      : message.text || "Media message";

  return (
    <div
      className="flex items-center gap-3 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 px-4 py-2 shadow-sm cursor-pointer hover:bg-neutral-800 transition z-20 group"
      onClick={() => msgId && onScrollTo(msgId)}
    >
      <Pin size={16} className="text-[#3797F0] shrink-0" />
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[12px] text-[#3797F0] font-semibold tracking-wide leading-tight">
          Pinned Message
        </span>
        <span className="text-[13px] text-white truncate leading-tight mt-0.5">
          {displayText}
        </span>
      </div>

      {onUnpin && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (msgId) onUnpin(msgId);
          }}
          className="p-1.5 opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-white hover:bg-neutral-700 rounded-full transition-all"
          title="Unpin message"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
