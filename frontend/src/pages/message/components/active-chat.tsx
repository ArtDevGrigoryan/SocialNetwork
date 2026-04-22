import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Send, ChevronDown } from "lucide-react";
import type { IMessage, ActiveChatProps, ISocketTypingPayload } from "../types";
import { useSocketStore } from "../../../store/socket.store";
import MessageBubble from "./message-bubble";
import MessageInput from "./message-input";
import ChatHeader from "./chat-header";
import TypingIndicator from "./typing-indicator";

const formatBatchTimestamp = (dateInput?: string) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  const now = new Date();

  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isSameDay) return timeStr;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return `Yesterday ${timeStr}`;

  if (diffDays < 7) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${days[date.getDay()]} ${timeStr}`;
  }

  if (date.getFullYear() === now.getFullYear()) {
    return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${timeStr}`;
  }

  return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, ${timeStr}`;
};

export default function ActiveChat({
  chatId,
  activeUser,
  currentUser,
  participants,
  messages,
  loading,
  sending,
  onSendMessage,
  onEditMessage,
}: ActiveChatProps) {
  const [typingState, setTypingState] = useState<"typing" | "recording" | null>(
    null,
  );
  const [editingMessage, setEditingMessage] = useState<IMessage | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<IMessage | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialScroll = useRef(true);

  const socket = useSocketStore((state) => state.socket);

  useEffect(() => {
    isInitialScroll.current = true;
  }, [chatId]);

  useEffect(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceToBottom < 200;

    if (isInitialScroll.current && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialScroll.current = false;
    } else if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, typingState]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;

    setShowScrollButton(distanceToBottom > 200);
  };

  const handleScrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!socket || !currentUser?._id || !chatId) return;
    let typingTimeout: ReturnType<typeof setTimeout>;

    const handleTyping = (
      data: { chatId: string; _id: string },
      type: "typing" | "recording",
    ) => {
      if (data.chatId === chatId && data._id !== currentUser._id) {
        setTypingState(type);
        if (typingTimeout) clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => setTypingState(null), 3000);
      }
    };

    const onText = (data: ISocketTypingPayload) => handleTyping(data, "typing");
    const onVoice = (data: ISocketTypingPayload) =>
      handleTyping(data, "recording");

    socket.on("typing", onText);
    socket.on("voice", onVoice);

    return () => {
      socket.off("typing", onText);
      socket.off("voice", onVoice);
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [socket, currentUser?._id, chatId]);

  if (!chatId) {
    return (
      <div className="hidden md:flex flex-1 items-center justify-center bg-black flex-col animate-in fade-in">
        <div className="w-24 h-24 rounded-full border-2 border-neutral-800 flex items-center justify-center mb-4 bg-neutral-900/50">
          <Send size={48} className="text-white -ml-2" strokeWidth={1} />
        </div>
        <h2 className="text-xl font-medium text-white mb-2">Your Messages</h2>
        <p className="text-neutral-500 text-sm">
          Send private photos and messages to a friend.
        </p>
      </div>
    );
  }

  const otherParticipant = participants.find(
    (p) => p.user._id !== currentUser?._id,
  );

  return (
    <div
      className={`flex-1 flex flex-col h-full bg-black relative ${!chatId ? "hidden md:flex" : "flex"}`}
    >
      <ChatHeader activeUser={activeUser} />

      <div className="flex-1 relative flex flex-col min-h-0">
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar flex flex-col"
          onClick={() => setActiveMenuId(null)}
        >
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="animate-spin text-[#3797F0] w-8 h-8" />
            </div>
          ) : (
            <div className="flex flex-col flex-1 justify-end max-w-4xl mx-auto w-full">
              <div className="flex flex-col items-center py-10 animate-in fade-in zoom-in-95 duration-300">
                <img
                  src={activeUser?.avatar || "/default-avatar.png"}
                  className="w-24 h-24 rounded-full object-cover mb-3 border-2 border-neutral-800 shadow-lg"
                  alt={activeUser?.username}
                />
                <h2 className="text-white font-bold text-xl">
                  {activeUser?.username}
                </h2>
                <p className="text-neutral-500 text-sm mt-1 mb-4">
                  Bardiner-Social
                </p>
                <Link
                  to={`/profile/${activeUser?._id}`}
                  className="px-4 py-1.5 bg-neutral-800 rounded-lg text-white font-semibold text-sm hover:bg-neutral-700 hover:scale-105 transition-all"
                >
                  View Profile
                </Link>
              </div>

              {messages.map((msg, index) => {
                const isMe = msg.sender._id === currentUser?._id;
                const nextMsg = messages[index + 1];
                const prevMsg = messages[index - 1];

                let showTimeDivider = false;
                if (index === 0) {
                  showTimeDivider = true;
                } else if (msg.createdAt && prevMsg?.createdAt) {
                  const currentDt = new Date(msg.createdAt).getTime();
                  const prevDt = new Date(prevMsg.createdAt).getTime();
                  const diffMinutes = (currentDt - prevDt) / (1000 * 60);
                  if (diffMinutes > 10) {
                    showTimeDivider = true;
                  }
                }

                let nextHasTimeDivider = false;
                if (nextMsg?.createdAt && msg.createdAt) {
                  const nextDt = new Date(nextMsg.createdAt).getTime();
                  const currentDt = new Date(msg.createdAt).getTime();
                  if ((nextDt - currentDt) / (1000 * 60) > 10) {
                    nextHasTimeDivider = true;
                  }
                }

                const isPrevSame =
                  prevMsg?.sender._id === msg.sender._id && !showTimeDivider;
                const isNextSameRaw = nextMsg?.sender._id === msg.sender._id;
                const finalIsNextSame = isNextSameRaw && !nextHasTimeDivider;

                const finalIsSequenceMatch = finalIsNextSame || isPrevSame;
                const showAvatar = !isMe && !finalIsNextSame;

                const isLastMessage = index === messages.length - 1;
                const isSeen =
                  isLastMessage && isMe && otherParticipant?.unreadCount === 0;

                return (
                  <div key={msg._id || index} className="flex flex-col">
                    {showTimeDivider && msg.createdAt && (
                      <div className="flex justify-center my-4 select-none animate-in fade-in">
                        <span className="text-[12px] font-medium text-neutral-500 bg-black px-2">
                          {formatBatchTimestamp(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    <div className={!finalIsNextSame ? "mb-4" : "mb-[2px]"}>
                      <MessageBubble
                        msg={msg}
                        isMine={isMe}
                        showAvatar={showAvatar}
                        participantId={
                          participants.find(
                            (p) => p.user._id === currentUser?._id,
                          )?._id || null
                        }
                        chatParticipants={participants}
                        isSequenceMatch={finalIsSequenceMatch}
                        activeMenuId={activeMenuId}
                        setActiveMenuId={setActiveMenuId}
                        onSetEdit={(m) => {
                          setEditingMessage(m);
                          setReplyingMessage(null);
                        }}
                        onSetReply={(m) => {
                          setReplyingMessage(m);
                          setEditingMessage(null);
                        }}
                        isLastMessage={isLastMessage}
                        isSeen={isSeen}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <TypingIndicator state={typingState} />
          <div ref={messagesEndRef} className="h-1" />
        </div>

        {showScrollButton && (
          <button
            onClick={handleScrollToBottom}
            className="absolute right-4 bottom-4 bg-neutral-800 border border-neutral-700 text-white rounded-full p-2.5 shadow-2xl hover:bg-neutral-700 transition-all z-30 flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-200"
          >
            <ChevronDown size={24} />
          </button>
        )}
      </div>

      <MessageInput
        onSendMessage={onSendMessage}
        sending={sending}
        editingMessage={editingMessage}
        replyingMessage={replyingMessage}
        onCancelEdit={() => setEditingMessage(null)}
        onCancelReply={() => setReplyingMessage(null)}
        onEditMessage={(text) => {
          if (editingMessage?._id) {
            onEditMessage(editingMessage._id, text);
            setEditingMessage(null);
          }
        }}
      />
    </div>
  );
}
