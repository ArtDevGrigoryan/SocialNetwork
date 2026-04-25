import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Edit, ChevronLeft, Users } from "lucide-react";
import { useChatStore } from "../../../store/chat.store";
import { useAuthStore } from "../../../store/auth.store";
import NewChatModal from "./new-chat-modal";
import CreateGroupModal from "./create-group-modal";
import type { IParticipant } from "../types";
import { useSocketStore } from "../../../store/socket.store";

export default function ChatList({
  typingData = {},
}: {
  typingData?: Record<string, { isRecording?: boolean }>;
}) {
  const { chats, loadingChats } = useChatStore();
  const { user: currentUser } = useAuthStore();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const { socket, joinChat, leaveChat } = useSocketStore();

  const getOtherParticipant = (participants: IParticipant[]) => {
    return (
      participants?.find((p) => p?.user?._id !== currentUser?._id)?.user ||
      participants[0]?.user
    );
  };
  useEffect(() => {
    if (!socket) return;
    if (chats.length > 0) {
      chats.forEach((chat) => {
        joinChat(chat._id);
      });
      socket.on("connect", () => chats.forEach((chat) => joinChat(chat._id)));
      socket.on("disconnect", () =>
        chats.forEach((chat) => leaveChat(chat._id)),
      );
      joinChat(chatId || "");
      return () => {
        chats.forEach((chat) => leaveChat(chat._id));
        socket.off("connect");
        socket.off("disconnect");
      };
    } else if (chatId) {
      joinChat(chatId);
      socket.on("connect", () => joinChat(chatId));
      socket.on("disconnect", () => leaveChat(chatId));
      return () => {
        leaveChat(chatId);
        socket.off("connect");
        socket.off("disconnect");
      };
    }
  }, [socket, chatId, chats]);
  return (
    <>
      <div
        className={`w-full h-full bg-black flex-col shrink-0 border-r border-neutral-800 ${chatId ? "hidden md:flex" : "flex"}`}
      >
        <div className="h-[60px] md:h-[75px] pt-[max(0.5rem,env(safe-area-inset-top))] px-4 md:px-6 border-b border-neutral-800 flex items-center justify-between bg-black/90 backdrop-blur-xl shrink-0 z-50 sticky top-0">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="md:hidden text-white hover:opacity-70 transition p-2 -ml-2 rounded-full shrink-0"
            >
              <ChevronLeft size={28} />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight truncate">
              {currentUser?.username}
            </h1>
          </div>
          <button
            onClick={() => setIsNewChatOpen(true)}
            className="text-white hover:bg-neutral-800 transition p-2.5 rounded-full active:scale-95 shrink-0"
          >
            <Edit size={24} strokeWidth={1.8} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 pb-4 overscroll-contain">
          <div className="px-4 md:px-6 py-2 flex justify-between items-center mb-2">
            <h2 className="text-[16px] font-bold text-white">Messages</h2>
            <span className="text-sm font-semibold text-neutral-500 cursor-pointer hover:text-neutral-400 transition-colors">
              Requests
            </span>
          </div>

          {loadingChats ? (
            <div className="space-y-3 px-4 md:px-6 mt-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 animate-pulse py-2"
                >
                  <div className="w-14 h-14 bg-neutral-800 rounded-full shrink-0" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-4 bg-neutral-800 rounded w-1/2" />
                    <div className="h-3 bg-neutral-800 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              {chats.map((chat) => {
                const isGroup = chat.type === "group";
                const otherUser = getOtherParticipant(chat?.participants);
                const title = isGroup
                  ? chat.groupName || "Group Chat"
                  : otherUser?.username;
                const avatar = isGroup ? chat.groupAvatar : otherUser?.avatar;

                const myParticipantInfo = chat?.participants?.find(
                  (p) => p && p.user?._id === currentUser?._id,
                );
                const unreadCount = myParticipantInfo?.unreadCount || 0;
                const isTyping = typingData[chat._id!];
                const hasUnread = unreadCount > 0;

                return (
                  <Link
                    key={chat._id}
                    to={`/messages/${chat._id}`}
                    className={`flex items-center justify-between px-4 md:px-6 py-2.5 hover:bg-neutral-900 transition-colors active:bg-neutral-800 ${chatId === chat._id ? "bg-neutral-900" : ""}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        {avatar ? (
                          <img
                            src={avatar}
                            className="w-[56px] h-[56px] rounded-full object-cover border border-neutral-800 bg-neutral-900"
                            alt={title}
                            loading="lazy"
                          />
                        ) : isGroup ? (
                          <div className="w-[56px] h-[56px] rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center">
                            <Users size={24} className="text-neutral-400" />
                          </div>
                        ) : (
                          <img
                            src="/default-avatar.png"
                            className="w-[56px] h-[56px] rounded-full object-cover border border-neutral-800 bg-neutral-900"
                            alt={title}
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 pr-2 flex-1 justify-center">
                        <span
                          className={`text-[15px] truncate ${hasUnread ? "font-bold text-white" : "text-white"}`}
                        >
                          {title}
                        </span>

                        {isTyping ? (
                          <span className="text-[13px] text-neutral-400 truncate italic">
                            {isTyping.isRecording
                              ? "Recording audio..."
                              : "Typing..."}
                          </span>
                        ) : (
                          <span
                            className={`text-[13px] truncate ${hasUnread ? "font-bold text-white" : "text-neutral-500"}`}
                          >
                            {chat.lastMessage?.type === "TEXT" &&
                              chat.lastMessage.text}
                            {chat.lastMessage?.type === "IMAGE" &&
                              "Sent an image"}
                            {chat.lastMessage?.type === "MEDIA_GROUP" &&
                              "Sent media"}
                            {chat.lastMessage?.type === "VOICE" &&
                              "Sent a voice message"}
                            {!chat.lastMessage && "No messages yet"}
                          </span>
                        )}
                      </div>
                    </div>
                    {hasUnread && (
                      <div className="w-2.5 h-2.5 bg-[#3797F0] rounded-full shrink-0 ml-2 shadow-[0_0_8px_rgba(55,151,240,0.5)]" />
                    )}
                  </Link>
                );
              })}
              {chats.length === 0 && !loadingChats && (
                <div className="px-6 py-4 text-sm text-neutral-500 text-center mt-10">
                  No messages found. Start a new chat!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isNewChatOpen && (
        <NewChatModal
          onClose={() => setIsNewChatOpen(false)}
          onOpenGroup={() => {
            setIsNewChatOpen(false);
            setIsCreateGroupOpen(true);
          }}
        />
      )}

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />
    </>
  );
}
