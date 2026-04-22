import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import { useSocketStore } from "../../store/socket.store";
import ChatList from "./components/chat-list";
import ActiveChat from "./components/active-chat";
import type {
  IChat,
  IMessage,
  ISocketTypingPayload,
  ISocketReactionPayload,
  ISocketRemoveReactionPayload,
  ISocketDeletedMsgPayload,
  ISocketEditedMsgPayload,
  ISocketChatReadPayload,
} from "./types";

export default function MessagePage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { user } = useAuthStore();
  const { socket } = useSocketStore();

  const [chats, setChats] = useState<IChat[]>([]);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingData, setTypingData] = useState<
    Record<string, { isRecording?: boolean }>
  >({});
  const typingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );

  const getParticipants = (chatId: string) => {
    const chat = chats.find((c) => c._id === chatId);
    return chat?.participants || [];
  };

  const activeChat = chats.find((c) => c._id === chatId) || null;
  const activeUser =
    activeChat?.participants?.find((p) => p.user._id !== user?._id)?.user ||
    null;

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await api.get("/chats?limit=50");
        setChats(data.payload?.chats || data.payload || []);
      } catch (error) {
        console.error("Failed to load chats", error);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, []);

  useEffect(() => {
    if (socket && chats.length > 0) {
      chats.forEach((chat) => socket.emit("join_chat", { chatId: chat._id }));
    }
  }, [socket, chats]);

  useEffect(() => {
    if (!socket || !user?._id) return;

    const handleTyping = (data: ISocketTypingPayload) => {
      const targetChatId = data.chatId;
      if (!targetChatId || data._id === user._id) return;

      setTypingData((prev) => ({
        ...prev,
        [targetChatId]: { isRecording: data.isRecording },
      }));

      if (typingTimeouts.current[targetChatId])
        clearTimeout(typingTimeouts.current[targetChatId]);

      typingTimeouts.current[targetChatId] = setTimeout(() => {
        setTypingData((prev) => {
          const newState = { ...prev };
          delete newState[targetChatId];
          return newState;
        });
      }, 3000);
    };

    socket.on("typing", (data: ISocketTypingPayload) =>
      handleTyping({ ...data, isRecording: false }),
    );
    socket.on("voice", (data: ISocketTypingPayload) =>
      handleTyping({ ...data, isRecording: true }),
    );

    return () => {
      socket.off("typing");
      socket.off("voice");
    };
  }, [socket, user?._id]);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data } = await api.get(`/messages/${chatId}`);
        setMessages(data.payload?.reverse() || []);
        await api.patch(`/chats/read/${chatId}`);

        setChats((prev) =>
          prev.map((c) => {
            if (c._id === chatId) {
              const participants = c.participants.map((p) =>
                p.user._id === user?._id ? { ...p, unreadCount: 0 } : p,
              );
              return { ...c, participants };
            }
            return c;
          }),
        );
        window.dispatchEvent(new Event("messages:changed"));
      } catch (error) {
        console.error("Failed to load messages", error);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [chatId, user?._id]);

  useEffect(() => {
    if (!socket || !chatId) return;

    const handleReceiveMessage = (message: IMessage) => {
      if (message.chatId === chatId || message.chat === chatId) {
        setMessages((prev) => [...prev, message]);

        setChats((prev) =>
          prev
            .map((c) => {
              if (c._id === chatId) {
                const participants = c.participants.map((p) =>
                  p.user._id !== user?._id
                    ? { ...p, unreadCount: (p.unreadCount || 0) + 1 }
                    : p,
                );

                return {
                  ...c,
                  lastMessage: message,
                  lastActivityAt: new Date().toISOString(),
                  participants,
                };
              }
              return c;
            })
            .sort(
              (a, b) =>
                new Date(b.lastActivityAt).getTime() -
                new Date(a.lastActivityAt).getTime(),
            ),
        );

        if (message.sender._id !== user?._id) {
          api.patch(`/chats/read/${chatId}`);
        }
      }
    };

    const handleReaction = ({
      messageId,
      reaction,
    }: ISocketReactionPayload) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId) {
            const reactions = msg.reactions ? [...msg.reactions] : [];
            const idx = reactions.findIndex(
              (r) => r.participant === reaction.participant,
            );
            if (idx !== -1) reactions[idx] = reaction;
            else reactions.push(reaction);
            return { ...msg, reactions };
          }
          return msg;
        }),
      );
    };

    const handleRemoveReaction = ({
      messageId,
      participantId,
    }: ISocketRemoveReactionPayload) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId) {
            return {
              ...msg,
              reactions:
                msg.reactions?.filter((r) => r.participant !== participantId) ||
                [],
            };
          }
          return msg;
        }),
      );
    };

    const handleDeletedMessage = ({ messageId }: ISocketDeletedMsgPayload) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    };

    const handleEditedMessage = ({
      messageId,
      text,
    }: ISocketEditedMsgPayload) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === messageId ? { ...msg, text } : msg)),
      );
    };

    const handleChatRead = ({
      chatId: readChatId,
      userId,
    }: ISocketChatReadPayload) => {
      if (chatId === readChatId && userId !== user?._id) {
        setChats((prev) =>
          prev.map((c) => {
            if (c._id === readChatId) {
              const participants = c.participants.map((p) =>
                p.user._id === userId ? { ...p, unreadCount: 0 } : p,
              );
              return { ...c, participants };
            }
            return c;
          }),
        );
      }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message:reaction", handleReaction);
    socket.on("message:remove_reaction", handleRemoveReaction);
    socket.on("message:deleted", handleDeletedMessage);
    socket.on("message:edited", handleEditedMessage);
    socket.on("chat:read", handleChatRead);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message:reaction", handleReaction);
      socket.off("message:remove_reaction", handleRemoveReaction);
      socket.off("message:deleted", handleDeletedMessage);
      socket.off("message:edited", handleEditedMessage);
      socket.off("chat:read", handleChatRead);
    };
  }, [socket, chatId, user?._id]);

  const handleSendMessage = async (
    text: string,
    files?: File[],
    type: "TEXT" | "MEDIA" | "IMAGE" | "VOICE" = "TEXT",
    replyToId?: string,
  ) => {
    if (!chatId || !user) return;
    const myParticipantId = activeChat?.participants?.find(
      (p) => p.user._id === user._id,
    )?._id;
    if (!myParticipantId) return;

    setSending(true);
    try {
      if (type === "TEXT") {
        const payload: Record<string, string> = {
          text,
          participantId: myParticipantId,
        };
        if (replyToId) payload.replyTo = replyToId;
        await api.post(`/messages/${chatId}`, payload);
      } else if (type === "MEDIA" && files && files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("media", file));
        formData.append("participantId", myParticipantId);
        if (text && text.trim()) formData.append("text", text.trim());
        if (replyToId) formData.append("replyTo", replyToId);
        await api.post(`/messages/${chatId}/media`, formData);
      } else if (type === "VOICE" && files && files[0]) {
        const formData = new FormData();
        formData.append("voice", files[0]);
        formData.append("participantId", myParticipantId);
        if (replyToId) formData.append("replyTo", replyToId);
        await api.post(`/messages/${chatId}/voice`, formData);
      }
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async (msgId: string, text: string) => {
    try {
      await api.patch(`/messages/${msgId}`, { text });
    } catch (error) {
      console.error("Failed to edit message", error);
    }
  };

  return (
    <div className="flex w-full h-[100dvh] bg-black overflow-hidden m-0 p-0 overscroll-none">
      <div
        className={`w-full md:w-[350px] lg:w-[398px] flex-shrink-0 h-full border-r border-neutral-800 ${chatId ? "hidden md:block" : "block"}`}
      >
        <ChatList
          chats={chats}
          chatId={chatId}
          currentUser={user!}
          loading={loadingChats}
          typingData={typingData}
        />
      </div>

      <div
        className={`flex-1 flex-col min-w-0 h-full ${!chatId ? "hidden md:flex" : "flex"}`}
      >
        <ActiveChat
          chatId={chatId}
          participants={getParticipants(chatId || "")}
          activeUser={activeUser}
          currentUser={user}
          messages={messages}
          loading={loadingMessages}
          sending={sending}
          onSendMessage={handleSendMessage}
          onEditMessage={handleEditMessage}
        />
      </div>
    </div>
  );
}
