import { useState, useRef, useEffect } from "react";
import type { IReaction, MessageBubbleProps } from "../types";
import { Reply, MoreHorizontal, ExternalLink } from "lucide-react";
import { api } from "../../../lib/axios.config";
import { useAuthStore } from "../../../store/auth.store";
import VoicePlayer from "./voice-player";
import MessageMedia from "./message-media";
import MessageMenu from "./message-menu";
import ReactionModal from "./reaction-modal";

export const formatTimeAgo = (dateInput?: string) => {
  if (!dateInput) return "just now";
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

export default function MessageBubble({
  msg,
  isMine,
  isSequenceMatch,
  participantId,
  chatParticipants,
  onSetEdit,
  onSetReply,
  isLastMessage,
  isSeen,
  activeMenuId,
  setActiveMenuId,
}: MessageBubbleProps) {
  const showMenu = activeMenuId === msg._id;
  const { user } = useAuthStore();
  const [localReactions, setLocalReactions] = useState<IReaction[]>(
    msg.reactions || [],
  );
  const [isReactionModalOpen, setIsReactionModalOpen] = useState(false);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const replyTriggeredRef = useRef(false);
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const lastClickTime = useRef<number>(0);
  const isRequestPending = useRef(false);
  const badgePressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBadgeLongPressTriggered = useRef(false);

  useEffect(() => {
    setLocalReactions(msg.reactions || []);
  }, [msg.reactions]);

  const handleReplyClick = (replyId?: string) => {
    if (!replyId) return;
    const element = document.getElementById(`message-${replyId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      const originalBg = element.style.backgroundColor;
      element.style.transition = "background-color 0.5s ease";
      element.style.backgroundColor = "rgba(255, 255, 255, 0.1)";

      setTimeout(() => {
        element.style.backgroundColor = originalBg;
      }, 1000);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    replyTriggeredRef.current = false;
    touchTimer.current = setTimeout(() => {
      if (!isSwiping && msg._id) {
        setActiveMenuId(msg._id);
        if (
          typeof window !== "undefined" &&
          window.navigator &&
          window.navigator.vibrate
        ) {
          window.navigator.vibrate(50);
        }
      }
    }, 600);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (showMenu || !touchStartRef.current) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = currentY - touchStartRef.current.y;
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      if (touchTimer.current) clearTimeout(touchTimer.current);
    }
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 15) {
      setIsSwiping(true);
      let allowedDelta = 0;
      if (isMine && deltaX < 0) allowedDelta = deltaX;
      if (!isMine && deltaX > 0) allowedDelta = deltaX;
      const damp = allowedDelta * 0.4;
      if (Math.abs(damp) < 60) setTranslateX(damp);
      if (Math.abs(damp) >= 40 && !replyTriggeredRef.current) {
        replyTriggeredRef.current = true;
        if (
          typeof window !== "undefined" &&
          window.navigator &&
          window.navigator.vibrate
        ) {
          window.navigator.vibrate(50);
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    if (replyTriggeredRef.current && onSetReply) onSetReply(msg);
    setIsSwiping(false);
    setTranslateX(0);
    touchStartRef.current = null;
    replyTriggeredRef.current = false;
  };

  const handleToggleReaction = async (emoji: string) => {
    setActiveMenuId(null);
    if (!msg._id || !user || !participantId || isRequestPending.current) return;
    const existingReaction = localReactions.find(
      (r) => r.participant === participantId,
    );
    const isRemoving =
      existingReaction &&
      (existingReaction.type === emoji || existingReaction.reaction === emoji);
    isRequestPending.current = true;
    try {
      if (isRemoving) {
        setLocalReactions((prev) =>
          prev.filter((r) => r.participant !== participantId),
        );
        await api.delete(`/messages/${existingReaction._id}/reaction`, {
          data: { participantId },
        });
      } else {
        const tempId = `temp_${Date.now()}`;
        const tempReaction = {
          _id: tempId,
          type: emoji,
          reaction: emoji,
          participant: participantId,
          message: msg._id,
        } as IReaction;
        setLocalReactions((prev) => [
          ...prev.filter((r) => r.participant !== participantId),
          tempReaction,
        ]);
        const { data } = await api.post(`/messages/${msg._id}/reaction`, {
          reaction: emoji,
          type: emoji,
          participantId: participantId,
        });
        if (data?.payload?._id) {
          setLocalReactions((prev) =>
            prev.map((r) => (r._id === tempId ? data.payload : r)),
          );
        }
      }
    } catch (error) {
      console.error("Failed to toggle reaction", error);
      setLocalReactions(msg.reactions || []);
    } finally {
      isRequestPending.current = false;
    }
  };

  const handleUnsend = async () => {
    try {
      if (msg._id) await api.delete(`/messages/${msg._id}`);
      setActiveMenuId(null);
    } catch (error) {
      console.error("Failed to unsend", error);
    }
  };

  const handleSmartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    const timeDiff = now - lastClickTime.current;
    if (timeDiff < 300) {
      handleToggleReaction("❤️");
      setActiveMenuId(null);
      if (
        typeof window !== "undefined" &&
        window.navigator &&
        window.navigator.vibrate
      ) {
        window.navigator.vibrate(30);
      }
      lastClickTime.current = 0;
    } else {
      if (window.innerWidth < 768) {
        setActiveMenuId(showMenu ? null : msg._id || null);
      }
      lastClickTime.current = now;
    }
  };

  const handleBadgeTouchStart = () => {
    isBadgeLongPressTriggered.current = false;
    badgePressTimer.current = setTimeout(() => {
      isBadgeLongPressTriggered.current = true;
      setIsReactionModalOpen(true);
      if (
        typeof window !== "undefined" &&
        window.navigator &&
        window.navigator.vibrate
      ) {
        window.navigator.vibrate(50);
      }
    }, 500);
  };

  const handleBadgeTouchEnd = () => {
    if (badgePressTimer.current) {
      clearTimeout(badgePressTimer.current);
    }
  };

  const handleBadgeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBadgeLongPressTriggered.current) return;
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!isTouch) {
      setIsReactionModalOpen(true);
    } else {
      const myReactionObj = localReactions.find(
        (r) => r.participant === participantId,
      );
      if (myReactionObj) {
        handleToggleReaction(myReactionObj.type || myReactionObj.reaction!);
      }
    }
  };

  const bgColor = isMine
    ? msg.type === "IMAGE" || msg.type === "MEDIA"
      ? ""
      : "bg-[#3797F0] text-white shadow-md shadow-blue-900/20"
    : msg.type === "IMAGE" || msg.type === "MEDIA"
      ? ""
      : "bg-[#262626] text-neutral-100 shadow-sm border border-neutral-800/50";
  const radiusClass = isMine
    ? isSequenceMatch
      ? "rounded-[22px] rounded-tr-[5px] rounded-br-[5px]"
      : "rounded-[22px] rounded-br-[5px]"
    : isSequenceMatch
      ? "rounded-[22px] rounded-tl-[5px] rounded-bl-[5px]"
      : "rounded-[22px] rounded-bl-[5px]";
  const uniqueReactions = Array.from(
    new Set(
      localReactions
        .map((r: IReaction) => r.type || r.reaction)
        .filter(Boolean),
    ),
  );
  const hasMyReaction = localReactions.some(
    (r) => r.participant === participantId,
  );

  return (
    <>
      <div
        id={`message-${msg._id}`}
        className={`flex flex-col w-full ${isMine ? "items-end" : "items-start"} mb-[2px] relative`}
        style={{ WebkitTouchCallout: "none" }}
      >
        {msg.replyTo && (
          <div
            onClick={() => handleReplyClick(msg.replyTo?._id)}
            className={`flex flex-col mb-1 max-w-[280px] md:max-w-[360px] cursor-pointer hover:opacity-80 transition-opacity ${isMine ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 mb-0.5 px-2">
              <Reply size={12} className={isMine ? "rotate-180" : ""} />
              <span>Replied to {msg.replyTo.sender?.username || "user"}</span>
            </div>
            <div
              className={`text-xs px-3 py-1.5 rounded-xl opacity-70 truncate max-w-full ${isMine ? "bg-neutral-800 text-neutral-300 mr-2" : "bg-neutral-800 text-neutral-300 ml-2 border border-neutral-700/50"}`}
            >
              {msg.replyTo.text || `Sent a ${msg.replyTo.type?.toLowerCase()}`}
            </div>
          </div>
        )}
        {isSwiping && (
          <div
            className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800 transition-all duration-150 ${translateX ? "opacity-100" : "opacity-0"} ${isMine ? "right-4" : "left-4"}`}
            style={{
              zIndex: 0,
              transform: `scale(${Math.min(Math.abs(translateX) / 40, 1.1)})`,
            }}
          >
            <Reply
              size={16}
              className={`text-white ${isMine ? "rotate-180" : ""}`}
            />
          </div>
        )}
        <div
          className={`flex w-full ${isMine ? "justify-end" : "justify-start"} group relative items-center transition-transform ${isSwiping ? "duration-0" : "duration-200 ease-out"}`}
          style={{
            transform: `translateX(${translateX}px)`,
            zIndex: 10,
            WebkitTouchCallout: "none",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div
            onClick={handleSmartClick}
            className={`relative max-w-[320px] md:max-w-[400px] ${msg.type === "IMAGE" || msg.type === "MEDIA" ? "bg-transparent p-0" : "px-4 py-[10px]"} text-[15px] leading-5 break-words select-none transition-transform active:scale-[0.98] ${bgColor} text-white ${radiusClass}`}
          >
            <MessageMedia msg={msg} />
            {msg.type === "VOICE" && (
              <VoicePlayer url={msg.voice?.url || ""} isMine={isMine} />
            )}
            {msg.type === "TEXT" && (
              <div className="flex flex-col">
                <span className="whitespace-pre-wrap">{msg.text}</span>
                {msg.media &&
                  msg.media[0]?.mediaType === "LINK" &&
                  (() => {
                    const linkMedia = msg.media[0];

                    const extractValidLink = (text: string) => {
                      if (!text) return "";
                      const match = text.match(
                        /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/,
                      );
                      return match ? match[0] : "";
                    };

                    const targetUrl = extractValidLink(msg.text || "");
                    if (!targetUrl) return null;

                    const validHref = targetUrl.startsWith("http")
                      ? targetUrl
                      : `https://${targetUrl}`;
                    const domainName = validHref
                      .replace(/^https?:\/\//, "")
                      .split("/")[0];

                    return (
                      <div
                        className={`mt-2 flex flex-col overflow-hidden rounded-xl border ${
                          isMine
                            ? "border-white/10 bg-black/10 hover:bg-black/20"
                            : "border-neutral-700/50 bg-neutral-900 hover:bg-neutral-800"
                        } max-w-[260px] md:max-w-[300px] select-none group/link relative transition-colors`}
                      >
                        {linkMedia.url && (
                          <div className="relative w-full h-[140px] bg-black overflow-hidden shrink-0 border-b border-white/5">
                            <img
                              src={linkMedia.url}
                              alt="Link preview"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <a
                              href={validHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              onTouchStart={(e) => e.stopPropagation()}
                              onTouchEnd={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                              className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 bg-black/40 hover:bg-black/70 backdrop-blur-md text-white rounded-full transition-all duration-200 opacity-80 hover:opacity-100 hover:scale-105 shadow-lg z-50 cursor-pointer"
                              title="Open link"
                            >
                              <ExternalLink size={16} />
                            </a>
                          </div>
                        )}
                        <div className="p-3 flex flex-col gap-1 relative">
                          <div className="text-[13px] font-semibold text-white line-clamp-1 pr-6">
                            {linkMedia.title || domainName}
                          </div>
                          {linkMedia.description && (
                            <div className="text-[11px] text-neutral-300 line-clamp-2 opacity-80 leading-tight">
                              {linkMedia.description}
                            </div>
                          )}
                          <div className="text-[10px] text-neutral-400 mt-1 flex items-center justify-between opacity-70 uppercase tracking-wider font-semibold">
                            <span className="truncate">{domainName}</span>

                            {/* Եթե հանկարծ նկար չկա, կոճակը կհայտնվի ներքևում */}
                            {!linkMedia.url && (
                              <a
                                href={validHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                onTouchEnd={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white z-50 cursor-pointer"
                                title="Open link"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            )}

            {uniqueReactions.length > 0 && (
              <div
                onTouchStart={handleBadgeTouchStart}
                onTouchEnd={handleBadgeTouchEnd}
                onClick={handleBadgeClick}
                className={`absolute -bottom-3.5 ${isMine ? "left-2" : "right-2"} bg-[#1a1a1a] border ${hasMyReaction ? "border-neutral-600 ring-1 ring-neutral-700/50" : "border-neutral-800"} rounded-full px-2 py-0.5 shadow-xl z-10 flex items-center justify-center text-[13px] gap-1 animate-in slide-in-from-bottom-2 zoom-in-95 duration-200 cursor-pointer hover:bg-neutral-800 transition-colors select-none`}
              >
                <div className="flex items-center gap-0.5 pointer-events-none">
                  {uniqueReactions.map((emoji, idx) => (
                    <span key={idx} className="drop-shadow-md">
                      {emoji}
                    </span>
                  ))}
                </div>
                {localReactions.length > 1 && (
                  <span className="text-neutral-300 font-semibold text-[11px] px-0.5 pointer-events-none">
                    {localReactions.length}
                  </span>
                )}
              </div>
            )}
          </div>
          <div
            className={`flex items-center ml-2 relative transition-opacity ${showMenu ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"}`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(showMenu ? null : msg._id || null);
              }}
              className="p-1.5 text-neutral-500 hover:text-white transition-colors rounded-full hover:bg-neutral-800 hidden md:flex"
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <MessageMenu
                msg={msg}
                isMine={isMine}
                onReaction={handleToggleReaction}
                onSetReply={onSetReply}
                onSetEdit={onSetEdit}
                onUnsend={handleUnsend}
                setActiveMenuId={setActiveMenuId}
              />
            )}
          </div>
        </div>
        {isLastMessage && isMine && (
          <div className="text-[11px] text-neutral-500 mt-2 text-right animate-in fade-in select-none pr-1">
            {isSeen
              ? `Seen ${formatTimeAgo(msg.createdAt)}`
              : `Sent ${formatTimeAgo(msg.createdAt)}`}
          </div>
        )}
        {isLastMessage && !isMine && (
          <div className="text-[11px] text-neutral-500 mt-2 text-left animate-in fade-in select-none pl-1">
            {formatTimeAgo(msg.createdAt)}
          </div>
        )}
      </div>

      <ReactionModal
        isOpen={isReactionModalOpen}
        onClose={() => setIsReactionModalOpen(false)}
        reactions={localReactions}
        chatParticipants={chatParticipants}
        currentParticipantId={participantId}
        onRemoveReaction={handleToggleReaction}
      />
    </>
  );
}
