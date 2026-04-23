import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Edit, ChevronLeft } from "lucide-react";
import type { ChatListProps, IParticipant } from "../types";
import NewChatModal from "./new-chat-modal";

export default function ChatList({
  chats,
  currentUser,
  loading,
  typingData = {},
}: ChatListProps) {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();

  const getOtherParticipant = (participants: IParticipant[]) => {
    return (
      participants?.find((p) => p?.user?._id != currentUser?._id)?.user ||
      participants[0]?.user
    );
  };

  return (
    <>
      <div
        className={`w-full h-full bg-black flex-col shrink-0 border-r border-neutral-800 ${chatId ? "hidden md:flex" : "flex"}`}
      >
        <div className="h-[75px] px-4 md:px-6 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => navigate(-1)}
              className="md:hidden text-white hover:opacity-70 transition p-2 -ml-2 rounded-full"
            >
              <ChevronLeft size={28} />
            </button>
            <h1 className="text-xl font-bold text-white tracking-tight truncate max-w-[200px]">
              {currentUser?.username}
            </h1>
          </div>
          <button
            onClick={() => setIsNewChatOpen(true)}
            className="text-white hover:bg-neutral-800 transition p-2 rounded-full"
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

          {loading ? (
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
                const otherUser = getOtherParticipant(chat?.participants);
                const myParticipantInfo = chat?.participants?.find(
                  (p) => p && p.user?._id === currentUser?._id,
                );
                const unreadCount = myParticipantInfo?.unreadCount || 0;
                const isTyping = typingData[chat._id];
                const hasUnread = unreadCount > 0;

                return (
                  <Link
                    key={chat._id}
                    to={`/messages/${chat._id}`}
                    className={`flex items-center justify-between px-4 md:px-6 py-2.5 hover:bg-neutral-900 transition-colors active:bg-neutral-800 ${chatId === chat._id ? "bg-neutral-900" : ""}`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="relative shrink-0">
                        <img
                          src={otherUser?.avatar || "/default-avatar.png"}
                          className="w-[56px] h-[56px] rounded-full object-cover border border-neutral-800 bg-neutral-900"
                          alt={otherUser?.username}
                          loading="lazy"
                        />
                      </div>
                      <div className="flex flex-col min-w-0 pr-2 flex-1 justify-center">
                        <span
                          className={`text-[15px] truncate ${hasUnread ? "font-bold text-white" : "text-white"}`}
                        >
                          {otherUser?.username}
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
              {chats.length === 0 && !loading && (
                <div className="px-6 py-4 text-sm text-neutral-500 text-center mt-10">
                  No messages found. Start a new chat!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isNewChatOpen && (
        <NewChatModal onClose={() => setIsNewChatOpen(false)} />
      )}
    </>
  );
}
