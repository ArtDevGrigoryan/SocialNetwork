import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useChatStore } from "../../store/chat.store";
import { useChatSocket } from "../../hooks/useChatSocket";
import ChatList from "./components/chat-list";
import ActiveChat from "./components/active-chat";
import { useSocketStore } from "../../store/socket.store";

export default function MessagePage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { fetchChats, fetchMessages, setChats } = useChatStore();
  useChatSocket(chatId);
  const typingData = useSocketStore((state) => state.typingData);

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (!chatId) return;

    fetchMessages(chatId);

    setChats((prev) =>
      prev.map((c) => {
        if (c._id === chatId) {
          const participants = c.participants.map((p) => ({
            ...p,
            unreadCount: 0,
          }));
          return { ...c, participants };
        }
        return c;
      }),
    );
  }, [chatId, fetchMessages, setChats]);

  return (
    <div className="flex w-full h-[100dvh] bg-black overflow-hidden relative m-0 p-0 overscroll-none">
      <div
        className={`w-full md:w-[350px] lg:w-[398px] flex-shrink-0 h-full border-r border-neutral-800 flex-col ${chatId ? "hidden md:flex" : "flex"}`}
      >
        <ChatList typingData={typingData} />
      </div>

      <div
        className={`flex-1 flex-col min-w-0 h-full relative ${!chatId ? "hidden md:flex" : "flex"}`}
      >
        <ActiveChat />
      </div>
    </div>
  );
}
