import { Reply, Edit2, Trash2 } from "lucide-react";
import type { MessageMenuProps } from "../types";

const EMOJIS = ["❤️", "😂", "😮", "😢", "🙏", "👍"];

export default function MessageMenu({
  msg,
  isMine,
  onReaction,
  onSetReply,
  onSetEdit,
  onUnsend,
  setActiveMenuId,
}: MessageMenuProps) {
  return (
    <div
      className={`absolute bottom-full mb-2 bg-neutral-800 border border-neutral-700 rounded-2xl p-2 flex flex-col gap-1 shadow-xl z-20 animate-in zoom-in-95 min-w-[140px] ${isMine ? "right-0" : "left-0"}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center px-1 pb-1 border-b border-neutral-700 mb-1">
        {EMOJIS.slice(0, 4).map((emoji) => (
          <button
            key={emoji}
            onClick={() => onReaction(emoji)}
            className="hover:scale-125 transition-transform text-lg"
          >
            {emoji}
          </button>
        ))}
      </div>

      {onSetReply && (
        <button
          onClick={() => {
            onSetReply(msg);
            setActiveMenuId(null);
          }}
          className="flex items-center gap-2 text-white hover:bg-neutral-700 p-2 rounded-lg text-sm font-medium transition"
        >
          <Reply size={16} /> Reply
        </button>
      )}

      {isMine && msg.type === "TEXT" && onSetEdit && (
        <button
          onClick={() => {
            onSetEdit(msg);
            setActiveMenuId(null);
          }}
          className="flex items-center gap-2 text-white hover:bg-neutral-700 p-2 rounded-lg text-sm font-medium transition"
        >
          <Edit2 size={16} /> Edit
        </button>
      )}

      {isMine && (
        <button
          onClick={onUnsend}
          className="flex items-center gap-2 text-red-500 hover:bg-neutral-700 p-2 rounded-lg text-sm font-medium transition"
        >
          <Trash2 size={16} /> Unsend
        </button>
      )}
    </div>
  );
}
