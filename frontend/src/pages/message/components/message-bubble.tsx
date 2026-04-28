import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { IReaction, MessageBubbleProps } from "../types";
import { Reply, MoreHorizontal, Pin, PlayCircle } from "lucide-react";
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

function MessageBubble({
  msg,
  isMine,
  showAvatar,
  showName,
  isSequenceMatch,
  participantId,
  chatParticipants,
  onSetEdit,
  onSetReply,
  isLastMessage,
  isSeen,
  activeMenuId,
  setActiveMenuId,
  isPinned,
}: MessageBubbleProps) {
  const showMenu = activeMenuId === msg._id;
  const { user } = useAuthStore();
  const navigate = useNavigate();
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

  const senderParticipant = chatParticipants.find(
    (p) => p.user._id === msg.sender?._id,
  );
  const displayName =
    senderParticipant?.participantName || msg.sender?.username || "User";

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
        if (data?.payload?._id)
          setLocalReactions((prev) =>
            prev.map((r) => (r._id === tempId ? data.payload : r)),
          );
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
      )
        window.navigator.vibrate(30);
      lastClickTime.current = 0;
    } else {
      if (window.innerWidth < 768)
        setActiveMenuId(showMenu ? null : msg._id || null);
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
      )
        window.navigator.vibrate(50);
    }, 500);
  };

  const handleBadgeTouchEnd = () => {
    if (badgePressTimer.current) clearTimeout(badgePressTimer.current);
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
      if (myReactionObj)
        handleToggleReaction(myReactionObj.type || myReactionObj.reaction!);
    }
  };

  const isMediaOnly = msg.type === "IMAGE" || msg.type === "MEDIA";
  const isShareType =
    msg.type === "SHARE_POST" ||
    msg.type === "SHARE_PROFILE" ||
    msg.type === "SHARE_STORY";

  const bgColor = isMine
    ? isMediaOnly
      ? ""
      : isShareType
        ? "bg-[#3797F0]/10 text-white border border-[#3797F0]/30"
        : "bg-[#3797F0] text-white shadow-md shadow-blue-900/20"
    : isMediaOnly
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
  const hasReactions = localReactions.length > 0;

  let marginClass = "mb-[2px]";
  if (isSequenceMatch) {
    marginClass = hasReactions ? "mb-[18px]" : "mb-[2px]";
  } else {
    marginClass = hasReactions ? "mb-7" : "mb-4";
  }

  // Renderers for Shared Content
  const renderSharedPost = () => {
    const post = msg.sharedPost;
    if (!post) return null;
    return (
      <div
        onClick={() => navigate(`/post/${post._id}`)}
        className="w-[240px] flex flex-col bg-black/40 rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:bg-black/60 transition-colors"
      >
        <div className="flex items-center gap-2 p-3 pb-2">
          {post.author.avatar ? (
            <img
              src={post.author.avatar}
              alt="author"
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] font-bold text-white">
              {post.author.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-semibold text-white">
            {post.author.username}
          </span>
        </div>
        {post.images && post.images.length > 0 ? (
          <div className="w-full aspect-square bg-neutral-900 relative">
            <img
              src={post.images[0]}
              alt="Post preview"
              className="w-full h-full object-cover"
            />
            {post.images.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/60 px-2 py-0.5 rounded-full text-xs text-white backdrop-blur-md">
                1/{post.images.length}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 text-sm text-neutral-300 italic">
            "{post.content?.substring(0, 50)}..."
          </div>
        )}
        <div className="p-3 bg-neutral-900/50 text-center text-sm font-medium text-white border-t border-white/5">
          View Post
        </div>
      </div>
    );
  };

  const renderSharedProfile = () => {
    const profile = msg.sharedProfile;
    if (!profile) return null;
    return (
      <div
        onClick={() => navigate(`/profile/${profile._id}`)}
        className="w-[220px] flex flex-col items-center p-4 bg-black/40 rounded-xl border border-white/10 cursor-pointer hover:bg-black/60 transition-colors"
      >
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt="profile"
            className="w-16 h-16 rounded-full object-cover mb-3 ring-2 ring-neutral-800"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-xl font-bold text-white mb-3">
            {profile.username.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-base font-semibold text-white">
          {profile.username}
        </span>
        {profile.bio && (
          <span className="text-xs text-neutral-400 mt-1 line-clamp-1">
            {profile.bio}
          </span>
        )}
        <div className="mt-3 w-full py-1.5 bg-white text-black text-center text-sm font-semibold rounded-lg">
          View Profile
        </div>
      </div>
    );
  };

  const renderSharedStory = () => {
    const story = msg.sharedStory;
    if (!story || !story.media) return null;

    return (
      <div
        onClick={() => navigate(`/stories/${story.user?._id}`)}
        className="w-[200px] h-[300px] relative rounded-xl overflow-hidden cursor-pointer group bg-neutral-900"
      >
        {story.media.type === "video" ? (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <video
              src={story.media.url}
              className="w-full h-full object-cover opacity-80"
            />
            <PlayCircle
              size={40}
              className="absolute text-white/80 drop-shadow-lg"
            />
          </div>
        ) : (
          <img
            src={story.media.url}
            alt="Story"
            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
          />
        )}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 px-2 py-1 rounded-full backdrop-blur-md">
          {story.user?.avatar ? (
            <img
              src={story.user?.avatar}
              alt="author"
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center text-[10px] text-white">
              {story.user?.username.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-xs font-medium text-white">
            {story.user?.username}
          </span>
        </div>
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <span className="text-xs font-medium text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">
            View Story
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        id={`message-${msg._id}`}
        className={`flex w-full ${isMine ? "justify-end" : "justify-start"} ${marginClass} relative`}
        style={{ WebkitTouchCallout: "none", zIndex: showMenu ? 9999 : "auto" }}
      >
        {!isMine && (
          <div className="w-8 shrink-0 mr-2 flex items-end pb-1">
            {showAvatar &&
              (msg.sender?.avatar ? (
                <img
                  src={msg.sender.avatar}
                  className="w-7 h-7 rounded-full object-cover bg-neutral-800"
                  alt="avatar"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-neutral-800 flex items-center justify-center text-[11px] font-bold text-neutral-400">
                  {msg.sender?.username?.charAt(0).toUpperCase()}
                </div>
              ))}
          </div>
        )}

        <div
          className={`flex flex-col ${isMine ? "items-end" : "items-start"} max-w-[calc(100%-2.5rem)]`}
        >
          {showName && (
            <span className="text-[12px] text-neutral-400 ml-1 mb-1 font-medium select-none">
              {displayName}
            </span>
          )}

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
                {msg.replyTo.text ||
                  `Sent a ${msg.replyTo.type?.toLowerCase()}`}
              </div>
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
            {isSwiping && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-neutral-800 transition-all duration-150 ${translateX ? "opacity-100" : "opacity-0"} ${isMine ? "-left-12" : "-right-12"}`}
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
              onClick={handleSmartClick}
              className={`relative max-w-[320px] md:max-w-[400px] ${isMediaOnly ? "bg-transparent p-0" : isShareType ? "p-1.5" : "px-3.5 py-2"} text-[15px] leading-5 break-words select-none transition-transform active:scale-[0.98] ${bgColor} text-white ${radiusClass}`}
            >
              {isPinned && (
                <div
                  className={`absolute ${isMine ? "-left-5" : "-right-5"} top-1/2 -translate-y-1/2 text-neutral-500`}
                >
                  <Pin size={14} className="fill-current text-[#3797F0]" />
                </div>
              )}

              <MessageMedia msg={msg} />

              {msg.type === "VOICE" && (
                <VoicePlayer url={msg.voice?.url || ""} isMine={isMine} />
              )}

              {msg.type === "SHARE_POST" && renderSharedPost()}
              {msg.type === "SHARE_PROFILE" && renderSharedProfile()}
              {msg.type === "SHARE_STORY" && renderSharedStory()}

              {msg.type === "TEXT" && (
                <div className="flex flex-col">
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                </div>
              )}

              {isShareType && msg.text && (
                <div className="px-3 py-2 mt-1 whitespace-pre-wrap text-[15px]">
                  {msg.text}
                </div>
              )}

              {uniqueReactions.length > 0 && (
                <div
                  onTouchStart={handleBadgeTouchStart}
                  onTouchEnd={handleBadgeTouchEnd}
                  onClick={handleBadgeClick}
                  className={`absolute -bottom-3.5 ${isMine ? "left-2" : "right-2"} bg-[#1a1a1a] border ${hasMyReaction ? "border-neutral-600 ring-1 ring-neutral-700/50" : "border-neutral-800"} rounded-full px-2 py-0.5 shadow-xl z-40 flex items-center justify-center text-[13px] gap-1 animate-in slide-in-from-bottom-2 zoom-in-95 duration-200 cursor-pointer hover:bg-neutral-800 transition-colors select-none`}
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
                  isPinned={isPinned}
                  onReaction={handleToggleReaction}
                  onSetReply={onSetReply}
                  onSetEdit={onSetEdit}
                  onUnsend={handleUnsend}
                  setActiveMenuId={setActiveMenuId}
                />
              )}
            </div>
          </div>

          {isLastMessage && (
            <div
              className={`text-[11px] text-neutral-500 mt-2 animate-in fade-in select-none ${isMine ? "text-right pr-1" : "text-left pl-1"}`}
            >
              {isMine
                ? isSeen
                  ? `Seen ${formatTimeAgo(msg.createdAt)}`
                  : `Sent ${formatTimeAgo(msg.createdAt)}`
                : formatTimeAgo(msg.createdAt)}
            </div>
          )}
        </div>
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

export default React.memo(MessageBubble, (prev, next) => {
  return (
    prev.msg._id === next.msg._id &&
    prev.msg.text === next.msg.text &&
    prev.msg.reactions?.length === next.msg.reactions?.length &&
    prev.isPinned === next.isPinned &&
    prev.activeMenuId === next.activeMenuId
  );
});
