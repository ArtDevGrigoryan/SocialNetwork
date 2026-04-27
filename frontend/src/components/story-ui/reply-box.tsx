import { useState, useEffect } from "react";
import { Heart, Send } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";

interface StoryReplyBoxProps {
  username: string;
  storyId: string;
  targetUserId: string;
  setIsPaused: (val: boolean) => void;
  initialReaction?: string | null;
  onReactionSuccess?: (storyId: string, reaction: string | null) => void;
}

const QUICK_REACTIONS = ["😂", "😮", "😍", "😢", "👏", "🔥"];

export const StoryReplyBox = ({
  username,
  storyId,
  targetUserId,
  setIsPaused,
  initialReaction = null,
  onReactionSuccess,
}: StoryReplyBoxProps) => {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [currentReaction, setCurrentReaction] = useState<string | null>(
    initialReaction,
  );
  const [isInputFocused, setIsInputFocused] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    setCurrentReaction(initialReaction);
  }, [initialReaction]);

  const handleSendReply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text.trim() || isSending) return;

    try {
      setIsSending(true);
      const key = [targetUserId, user?._id].sort().join(":");
      const { data } = await api.get(`chats/key?key=${key}`);
      const myParticipant = data.payload.participants.find(
        (p: any) => p.user._id === user?._id,
      );

      await api.post(`/messages/${data.payload._id}/share`, {
        participantId: myParticipant._id,
        type: "SHARE_STORY",
        sharedId: storyId,
        text,
      });

      setText("");
      setIsInputFocused(false);
      setIsPaused(false);
    } catch (err) {
      console.error("Failed to send story reply:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleReaction = async (
    e: React.MouseEvent | React.TouchEvent,
    reactionValue: string,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Եթե նույն բանի վրա ենք սեղմում, ապա ջնջում ենք reaction-ը (unlike)
    const isRemoving = currentReaction === reactionValue;
    const newReaction = isRemoving ? null : reactionValue;

    // Optimistic UI Update
    setCurrentReaction(newReaction);
    setIsInputFocused(false); // Թաքցնում ենք էմոջիները ընտրելուց հետո
    setIsPaused(false);

    try {
      await api.patch(`/stories/${storyId}`, { reaction: newReaction });
      if (onReactionSuccess) {
        onReactionSuccess(storyId, newReaction);
      }
    } catch (err) {
      console.error(err);
      // Եթե API-ը fail եղավ, հետ ենք բերում հին վիճակը
      setCurrentReaction(currentReaction);
    }
  };

  const isLiked = currentReaction === "like";

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
      <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-24 pb-4 px-4 flex flex-col justify-end gap-3 pointer-events-auto">
        {/* Quick Reactions Emojis */}
        <div
          className={`flex justify-center items-center gap-3 sm:gap-5 transition-all duration-300 ease-out origin-bottom
            ${
              isInputFocused
                ? "opacity-100 translate-y-0 scale-100"
                : "opacity-0 translate-y-8 scale-95 pointer-events-none"
            }
          `}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onMouseDown={(e) => handleReaction(e, emoji)}
              onTouchStart={(e) => handleReaction(e, emoji)}
              className={`text-3xl sm:text-4xl hover:scale-125 transition-transform drop-shadow-2xl ${
                currentReaction === emoji ? "scale-125 -translate-y-2" : ""
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Input & Actions */}
        <div className="flex items-center gap-3 w-full">
          <div
            className="flex-1 border border-neutral-500/80 rounded-full px-4 py-2.5 flex items-center bg-black/40 backdrop-blur-md cursor-text transition-colors focus-within:border-neutral-300 focus-within:bg-black/60"
            onClick={(e) => {
              e.stopPropagation();
              setIsPaused(true);
            }}
          >
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Reply to ${username}...`}
              className="bg-transparent text-sm text-white w-full outline-none placeholder:text-neutral-300"
              onFocus={() => {
                setIsInputFocused(true);
                setIsPaused(true);
              }}
              onBlur={() => {
                // Փոքր delay, որպեսզի click-ը հասցնի գրանցվի էմոջիի վրա
                setTimeout(() => setIsInputFocused(false), 150);
                if (!text.trim()) {
                  setIsPaused(false);
                }
              }}
            />
          </div>

          {text.trim().length > 0 ? (
            <button
              onClick={handleSendReply}
              disabled={isSending}
              className="p-2 text-white hover:text-blue-500 transition hover:scale-110 drop-shadow-lg disabled:opacity-50"
            >
              <Send size={26} />
            </button>
          ) : (
            <button
              onClick={(e) => handleReaction(e, "like")}
              className={`p-2 transition hover:scale-110 drop-shadow-lg ${
                isLiked ? "text-red-500" : "text-white hover:text-red-500"
              }`}
            >
              <Heart
                size={28}
                className={isLiked ? "fill-red-500 text-red-500" : ""}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
