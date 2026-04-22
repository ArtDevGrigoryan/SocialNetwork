import { X, Trash2 } from "lucide-react";
import type { ReactionModalProps } from "../types";

export default function ReactionModal({
  isOpen,
  onClose,
  reactions,
  chatParticipants,
  currentParticipantId,
  onRemoveReaction,
}: ReactionModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 w-full max-w-sm rounded-2xl flex flex-col border border-neutral-800 shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="w-6" />
          <h2 className="text-base font-bold text-white">Reactions</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col p-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {reactions.map((reaction) => {
            const participant = chatParticipants.find(
              (p) => p._id === reaction.participant,
            );
            const user = participant?.user;
            const isMe = reaction.participant === currentParticipantId;

            if (!user) return null;

            return (
              <div
                key={reaction._id}
                className="flex items-center justify-between p-3 hover:bg-neutral-800/50 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar || "/default-avatar.png"}
                    alt={user.username}
                    className="w-10 h-10 rounded-full object-cover bg-neutral-800 border border-neutral-700"
                  />
                  <span className="text-[15px] font-semibold text-white">
                    {user.username}{" "}
                    {isMe && (
                      <span className="text-neutral-500 font-normal ml-1">
                        (You)
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-2xl drop-shadow-md">
                    {reaction.type || reaction.reaction}
                  </span>

                  {isMe && (
                    <button
                      onClick={() => {
                        onRemoveReaction(reaction.type || reaction.reaction!);
                        if (reactions.length === 1) onClose();
                      }}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors active:scale-95"
                      title="Remove reaction"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
