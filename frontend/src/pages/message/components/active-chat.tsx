import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, Send, ChevronDown, Users } from "lucide-react";
import { useChatStore } from "../../../store/chat.store";
import { useAuthStore } from "../../../store/auth.store";
import MessageBubble from "./message-bubble";
import MessageInput from "./message-input";
import ChatHeader from "./chat-header";
import ChatDetails from "./chat-details";
import PinnedTab from "./chat-pinned-tab";
import type { IMessage } from "../types";
import { useChatSocket } from "../../../hooks/useChatSocket";
import TypingIndicator from "./typing-indicator";
import { useSocketStore } from "../../../store/socket.store";

export default function ActiveChat() {
  const { chatId } = useParams<{ chatId: string }>();
  const {
    chats,
    messages,
    loadingMessages,
    sending,
    sendMessage,
    editMessage,
  } = useChatStore();
  const { user: currentUser } = useAuthStore();
  useChatSocket(chatId);
  const typingData = useSocketStore((state) => state.typingData);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<IMessage | null>(null);
  const [replyingMessage, setReplyingMessage] = useState<IMessage | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { socket, leaveChat, joinChat } = useSocketStore();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialScroll = useRef(true);

  const chat = chats.find((c) => c._id === chatId);
  const participants = chat?.participants || [];
  const activeUser =
    participants.find((p) => p.user._id !== currentUser?._id)?.user || null;
  const myParticipantId = participants.find(
    (p) => p.user._id === currentUser?._id,
  )?._id;

  const lastPinnedMessage = chat?.pinned?.[chat?.pinned.length - 1];
  const chatTheme = chat?.theme || "default";

  useEffect(() => {
    isInitialScroll.current = true;
    setIsDetailsOpen(false);
    if (socket && chatId) {
      joinChat(chatId);
      socket.on("connect", () => joinChat(chatId));
      socket.on("disconnect", () => leaveChat(chatId));
      return () => {
        leaveChat(chatId);
        socket.off("connect");
        socket.off("disconnect");
      };
    }
  }, [chatId, socket]);

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
  }, [messages, isDetailsOpen]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollButton(distanceToBottom > 200);
  };

  const scrollToMessage = (msgId: string) => {
    setTimeout(() => {
      const el = document.getElementById(`message-${msgId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.style.transition = "background-color 0.5s ease";
        el.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        setTimeout(() => {
          el.style.backgroundColor = "transparent";
        }, 1000);
      }
    }, 150);
  };

  if (!chatId || !chat) {
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

  const themeClasses: Record<string, string> = {
    default: "bg-black",
    ocean: "bg-gradient-to-br from-black via-blue-950/40 to-black",
    sunset: "bg-gradient-to-br from-black via-rose-950/40 to-black",
    forest: "bg-gradient-to-br from-black via-emerald-950/40 to-black",
  };
  const currentThemeClass = themeClasses[chatTheme] || themeClasses.default;

  return (
    <div
      className={`flex-1 flex flex-row h-full relative w-full overflow-hidden transition-colors duration-500 ${currentThemeClass}`}
    >
      <div
        className={`flex-1 flex flex-col min-w-0 h-full relative transition-all duration-300 ${isDetailsOpen ? "hidden md:flex" : "flex"}`}
      >
        <div className="bg-black/50 backdrop-blur-md z-30 border-b border-neutral-800">
          <ChatHeader
            chat={chat}
            activeUser={activeUser}
            onHeaderClick={() => setIsDetailsOpen(!isDetailsOpen)}
          />
        </div>

        {lastPinnedMessage && (
          <PinnedTab message={lastPinnedMessage} onScrollTo={scrollToMessage} />
        )}

        <div className="flex-1 relative flex flex-col min-h-0">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overflow-x-hidden p-4 custom-scrollbar flex flex-col"
            onClick={() => setActiveMenuId(null)}
          >
            {loadingMessages ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-[#3797F0] w-8 h-8" />
              </div>
            ) : (
              <div className="flex flex-col flex-1 justify-end max-w-2xl mx-auto w-full pb-2">
                <div className="flex flex-col items-center py-10 animate-in fade-in zoom-in-95 duration-300 mt-auto">
                  {chat.type === "group" ? (
                    chat.groupAvatar ? (
                      <img
                        src={chat.groupAvatar}
                        className="w-24 h-24 rounded-full object-cover mb-3 border-2 border-neutral-800 shadow-lg"
                        alt={chat.groupName}
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-neutral-900 border-2 border-neutral-800 flex items-center justify-center mb-3 shadow-lg">
                        <Users size={40} className="text-neutral-500" />
                      </div>
                    )
                  ) : activeUser?.avatar ? (
                    <img
                      src={activeUser.avatar}
                      className="w-24 h-24 rounded-full object-cover mb-3 border-2 border-neutral-800 shadow-lg"
                      alt={activeUser.username}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-neutral-900 border-2 border-neutral-800 flex items-center justify-center mb-3 shadow-lg">
                      <span className="text-4xl font-bold text-neutral-500">
                        {activeUser?.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <h2 className="text-white font-bold text-xl">
                    {chat.type === "group"
                      ? chat.groupName
                      : activeUser?.username}
                  </h2>
                  <p className="text-neutral-500 text-sm mt-1 mb-4">
                    {chat.type === "group"
                      ? `${participants.length} members`
                      : "Bardiner-Social"}
                  </p>
                </div>

                {messages.map((msg, index) => {
                  const isMe = msg.sender._id === currentUser?._id;
                  const nextMsg = messages[index + 1];
                  const prevMsg = messages[index - 1];

                  const isNextSameRaw = nextMsg?.sender._id === msg.sender._id;
                  const isPrevSameRaw = prevMsg?.sender._id === msg.sender._id;

                  const showName =
                    !isMe && !isPrevSameRaw && chat.type === "group";

                  const showAvatar = !isMe && !isNextSameRaw;

                  const isLastMessage = index === messages.length - 1;

                  const otherParticipant = participants.find(
                    (p) => p.user._id !== currentUser?._id,
                  );
                  const isSeen =
                    isLastMessage &&
                    isMe &&
                    otherParticipant?.unreadCount === 0;

                  const isPinned = chat?.pinned?.some((p) => {
                    if (typeof p === "string") return p === msg._id;
                    return p._id === msg._id;
                  });

                  return (
                    <MessageBubble
                      key={msg._id || index}
                      msg={msg}
                      isMine={isMe}
                      showAvatar={showAvatar}
                      showName={showName}
                      participantId={myParticipantId || null}
                      chatParticipants={participants}
                      isSequenceMatch={isNextSameRaw}
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
                      isPinned={isPinned}
                    />
                  );
                })}
              </div>
            )}
            <div ref={messagesEndRef} className="h-1" />
          </div>

          {showScrollButton && (
            <button
              onClick={() =>
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
              }
              className="absolute right-4 bottom-4 bg-neutral-800 border border-neutral-700 text-white rounded-full p-2.5 shadow-2xl hover:bg-neutral-700 transition-all z-30 flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <ChevronDown size={24} />
            </button>
          )}
        </div>

        {typingData[chatId] && (
          <div className="max-w-2xl mx-auto w-full px-4">
            <TypingIndicator
              state={typingData[chatId].isRecording ? "recording" : "typing"}
            />
          </div>
        )}

        <div className="bg-black/50 backdrop-blur-md">
          <MessageInput
            onSendMessage={(text, files, type, replyToId) => {
              if (chatId && myParticipantId) {
                sendMessage(
                  chatId,
                  myParticipantId,
                  text,
                  files,
                  type,
                  replyToId,
                );
              }
            }}
            sending={sending}
            editingMessage={editingMessage}
            replyingMessage={replyingMessage}
            onCancelEdit={() => setEditingMessage(null)}
            onCancelReply={() => setReplyingMessage(null)}
            onEditMessage={(text) => {
              if (editingMessage?._id) editMessage(editingMessage._id, text);
              setEditingMessage(null);
            }}
          />
        </div>
      </div>

      {isDetailsOpen && (
        <div className="absolute inset-0 z-50 md:relative md:inset-auto md:w-[350px] lg:w-[400px] border-l border-neutral-800 bg-black flex flex-col animate-in slide-in-from-right-2 md:animate-none shadow-2xl md:shadow-none">
          <ChatDetails
            onClose={() => setIsDetailsOpen(false)}
            onPinnedMessageClick={scrollToMessage}
          />
        </div>
      )}
    </div>
  );
}
