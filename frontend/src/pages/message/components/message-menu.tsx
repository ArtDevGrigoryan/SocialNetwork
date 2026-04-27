import { useRef, useEffect } from "react";
import { Reply, Copy, Trash2, Edit2, Pin } from "lucide-react";
import type { MessageMenuProps } from "../types";
import { useChatStore } from "../../../store/chat.store";
import { useAuthStore } from "../../../store/auth.store";
import { useParams } from "react-router-dom";

const EMOJIS = ["❤️", "😂", "😮", "😢", "😠", "👍"];

export default function MessageMenu({
  msg,
  isMine,
  onReaction,
  onSetReply,
  onSetEdit,
  onUnsend,
  setActiveMenuId,
  isPinned,
}: MessageMenuProps) {
  const { togglePinMessage, chats } = useChatStore();
  const { user } = useAuthStore();
  const { chatId } = useParams();

  const menuRef = useRef<HTMLDivElement>(null);

  const activeChat = chats.find((c) => c._id === chatId);
  const myParticipantId = activeChat?.participants?.find(
    (p) => p.user._id === user?._id,
  )?._id;

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 80) {
        menuRef.current.style.top = "auto";
        menuRef.current.style.bottom = "100%";
        menuRef.current.style.marginBottom = "8px";
        menuRef.current.style.marginTop = "0";
        menuRef.current.style.transformOrigin = "bottom";
      }
    }
  }, []);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (msg.text) navigator.clipboard.writeText(msg.text);
    setActiveMenuId(null);
  };

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (chatId && myParticipantId && msg._id) {
      togglePinMessage(chatId, myParticipantId, msg._id);
    }
    setActiveMenuId(null);
  };

  return (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      className={`absolute ${isMine ? "right-0" : "left-0"} top-full mt-1 bg-[#1a1a1a] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-[9999] min-w-[200px] flex flex-col py-1.5 animate-in zoom-in-95`}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800/50 bg-neutral-900/50">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation();
              onReaction(emoji);
            }}
            className="hover:scale-125 transition-transform text-lg p-1"
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="flex flex-col p-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetReply?.(msg);
            setActiveMenuId(null);
          }}
          className="flex items-center gap-3 px-3 py-2 text-[15px] text-white hover:bg-neutral-800 rounded-xl transition-colors font-medium"
        >
          <Reply size={18} className="text-neutral-400" /> Reply
        </button>

        <button
          onClick={handleTogglePin}
          className="flex items-center gap-3 px-3 py-2 text-[15px] text-white hover:bg-neutral-800 rounded-xl transition-colors font-medium"
        >
          <Pin size={18} className="text-neutral-400" />{" "}
          {isPinned ? "Unpin message" : "Pin message"}
        </button>

        {msg.type === "TEXT" && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-3 px-3 py-2 text-[15px] text-white hover:bg-neutral-800 rounded-xl transition-colors font-medium"
          >
            <Copy size={18} className="text-neutral-400" /> Copy
          </button>
        )}

        {isMine && msg.type === "TEXT" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSetEdit?.(msg);
              setActiveMenuId(null);
            }}
            className="flex items-center gap-3 px-3 py-2 text-[15px] text-white hover:bg-neutral-800 rounded-xl transition-colors font-medium"
          >
            <Edit2 size={18} className="text-neutral-400" /> Edit
          </button>
        )}

        {isMine && (
          <>
            <div className="h-px bg-neutral-800 my-1 mx-2" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnsend();
              }}
              className="flex items-center gap-3 px-3 py-2 text-[15px] text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-medium"
            >
              <Trash2 size={18} /> Unsend
            </button>
          </>
        )}
      </div>
    </div>
  );
}
