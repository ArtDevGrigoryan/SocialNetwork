import { useState, useEffect, useRef, useMemo, FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import { useSocketStore } from "../../store/socket.store";
import {
  Send,
  Image as ImageIcon,
  Info,
  PlusCircle,
  ArrowLeft,
} from "lucide-react";
import type { IUser } from "../../types/user.types";

interface IChatParticipant {
  _id: string;
  user: IUser;
  unreadCount?: number;
}

interface IChat {
  _id: string;
  participants: IChatParticipant[];
  lastMessage?: {
    text: string;
    createdAt: string;
  };
}

interface IMessage {
  _id: string;
  chatId: string;
  sender: IUser;
  text: string;
  createdAt: string;
}

export default function Messages() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { socket, joinChat } = useSocketStore();

  const [chats, setChats] = useState<IChat[]>([]);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await api.get("/chats");
        setChats(data.payload?.chats || data.payload || []);
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, []);

  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data } = await api.get(`/messages/${chatId}`);
        const normalized = (data.payload || [])
          .map((message: IMessage) => ({
            ...message,
            chatId,
          }))
          .sort(
            (a: IMessage, b: IMessage) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        setMessages(normalized);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    const markRead = async () => {
      try {
        await api.patch(`/chats/read/${chatId}`);
        window.dispatchEvent(new Event("messages:changed"));
      } catch (error) {
        console.error("Failed to mark chat as read", error);
      }
    };
    markRead();
  }, [chatId]);

  useEffect(() => {
    if (!socket) return;
    if (chatId) {
      joinChat(chatId);
    }

    socket.on("receive_message", (message: IMessage) => {
      if (message.chatId === chatId) {
        setMessages((prev) => {
          const isExist = prev.some((m) => m._id === message._id);
          const isOptimistic = prev.some(
            (m) => m._id.startsWith("temp_") && m.text === message.text,
          );

          if (isExist) return prev;
          if (isOptimistic) {
            return prev.map((m) =>
              m._id.startsWith("temp_") && m.text === message.text
                ? message
                : m,
            );
          }
          return [...prev, message].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        });
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat._id === message.chatId
            ? {
                ...chat,
                lastMessage: {
                  text: message.text,
                  createdAt: message.createdAt,
                },
              }
            : chat,
        ),
      );
      if (message.chatId === chatId) {
        window.dispatchEvent(new Event("messages:changed"));
      }
    });

    return () => {
      socket.off("receive_message");
    };
  }, [socket, chatId, joinChat]);

  // 4. Ավտոմատ սքրոլ դեպի ներքև նոր նամակ ստանալիս
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 5. Նամակի ուղարկում
  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    const text = newMessage.trim();
    setNewMessage(""); // Մաքրում ենք input-ը միանգամից

    // Optimistic UI - Ավելացնել էկրանին մինչև server հասնելը
    const tempMessage: IMessage = {
      _id: `temp_${Date.now()}`,
      chatId,
      sender: currentUser as IUser,
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const activeParticipant = activeChat?.participants.find(
        (participant) => participant.user?._id === currentUser?._id,
      );
      if (!activeParticipant?._id) {
        throw new Error("Missing chat participant id");
      }

      const { data } = await api.post(`/messages/${chatId}`, {
        text,
        participantId: activeParticipant._id,
      });
      // Սերվերից ստացած տվյալներով թարմացում, եթե կոդը չի վստահում socket.io-ին
      // Բայց քանի որ 'receive_message' socket-ի մեջ ունենք լոգիկա, այստեղից կարելի է հանել։
      // Եթե socket-ով չի աշխատում, կարող ես վերականգնել հետևյալ տողերը.
      // if (data.payload) {
      //   setMessages((prev) => prev.map((m) => m._id === tempMessage._id ? data.payload : m));
      // }
    } catch (error) {
      console.error("Error sending message:", error);
      // Սխալի դեպքում հեռացնել չուղարկված նամակը
      setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
    }
  };

  // Որոշել խոսակցին (մյուս մասնակցին) ցանկի էլեմենտի համար
  const getOtherParticipant = (participants: IChatParticipant[]) => {
    return (
      participants.find((p) => p.user?._id !== currentUser?._id)?.user ||
      participants[0]?.user
    );
  };

  const activeChat = useMemo(
    () => chats.find((c) => c._id === chatId),
    [chats, chatId],
  );
  const activeUser = useMemo(
    () => (activeChat ? getOtherParticipant(activeChat.participants) : null),
    [activeChat, currentUser],
  );

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] w-full bg-black border-l border-neutral-800 rounded-none overflow-hidden animate-in fade-in duration-300">
      {/* ՁԱԽ ՀԱՏՎԱԾ: Չաթերի Ցանկ */}
      <div
        className={`${chatId ? "hidden md:flex" : "flex"} flex-col w-full md:w-[360px] border-r border-neutral-800 bg-black`}
      >
        <div className="h-20 px-6 flex items-center justify-between border-b border-neutral-800">
          <h1 className="text-xl font-bold text-white tracking-wide">
            {currentUser?.username}
          </h1>
          <button className="text-white hover:text-neutral-400 transition-colors">
            <PlusCircle size={26} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto instagram-scrollbar">
          {loadingChats ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-full bg-neutral-900 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-900 rounded w-1/2 animate-pulse" />
                    <div className="h-3 bg-neutral-900 rounded w-3/4 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="p-10 text-center text-neutral-500">
              Զրույցներ չկան:
            </div>
          ) : (
            chats.map((chat) => {
              const otherUser = getOtherParticipant(chat.participants);
              const isActive = chat._id === chatId;
              const participant = chat.participants.find(
                (p) => p.user?._id === currentUser?._id,
              );
              const unreadCount = participant?.unreadCount || 0;

              return (
                <Link
                  key={chat._id}
                  to={`/messages/${chat._id}`}
                  className={`flex items-center gap-3.5 p-4 pl-5 cursor-pointer hover:bg-neutral-900/50 transition-colors ${isActive ? "bg-neutral-900" : ""}`}
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-800 flex-shrink-0">
                    <img
                      src={otherUser?.avatar || "/default-avatar.png"}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3
                      className={`font-medium ${isActive || unreadCount ? "text-white" : "text-neutral-200"} ${unreadCount ? "font-semibold" : ""}`}
                    >
                      {otherUser?.username}
                    </h3>
                    {chat.lastMessage && (
                      <p
                        className={`text-sm truncate ${isActive || unreadCount ? "text-neutral-300" : "text-neutral-500"} ${unreadCount ? "font-semibold" : ""}`}
                      >
                        {chat.lastMessage.text}
                      </p>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-blue-500 text-[11px] text-white leading-5 text-center font-semibold">
                      {Math.min(unreadCount, 99)}
                    </span>
                  )}
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* ԱՋ ՀԱՏՎԱԾ: Բուն Նամակագրություն */}
      <div
        className={`${!chatId ? "hidden md:flex" : "flex"} flex-col flex-1 bg-black`}
      >
        {!chatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-black">
            <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-6">
              <Send size={44} className="text-white ml-2" />
            </div>
            <h2 className="text-2xl font-semibold text-white tracking-wide">
              Ձեր Նամակները
            </h2>
            <p className="text-neutral-500 mt-2.5 max-w-sm text-center">
              Ընտրեք զրույց կամ սկսեք նորը:
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-20 px-4 flex items-center justify-between border-b border-neutral-800 bg-black">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => navigate("/messages")}
                  className="md:hidden text-white mr-2.5 hover:text-neutral-400"
                >
                  <ArrowLeft size={24} />
                </button>
                <Link
                  to={`/profile/${activeUser?._id}`}
                  className="w-10 h-10 rounded-full overflow-hidden bg-neutral-800"
                >
                  <img
                    src={activeUser?.avatar || "/default-avatar.png"}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="flex flex-col">
                  <Link
                    to={`/profile/${activeUser?._id}`}
                    className="font-semibold text-white hover:underline text-base"
                  >
                    {activeUser?.username || "Օգտատեր"}
                  </Link>
                  <span className="text-xs text-neutral-500">Ակտիվ</span>
                </div>
              </div>
              <button className="text-white hover:text-neutral-400 transition-colors p-2">
                <Info size={24} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 instagram-scrollbar bg-black flex flex-col">
              {loadingMessages ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-neutral-500 border-t-white rounded-full animate-spin" />
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender?._id === currentUser?._id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-1`}
                    >
                      <div
                        className={`max-w-[70%] px-4.5 py-2.5 rounded-3xl text-sm ${
                          isMine
                            ? "bg-blue-600/90 text-white rounded-br-sm"
                            : "bg-neutral-800/80 text-white rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} className="pb-1" />
            </div>

            {/* Chat Input */}
            <div className="p-4 pb-5 bg-black">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 rounded-full px-4.5 py-1.5"
              >
                <button
                  type="button"
                  className="text-white hover:text-neutral-400 transition-colors p-2.5 pl-2"
                >
                  <ImageIcon size={24} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    socket?.emit("typeing", { chatId });
                  }}
                  placeholder="Գրել նամակ..."
                  className="flex-1 bg-transparent border-none text-white focus:outline-none px-2 placeholder-neutral-500 text-sm"
                  autoComplete="off"
                />
                {newMessage.trim() && (
                  <button
                    type="submit"
                    className="text-blue-500 font-semibold hover:text-blue-400 transition-colors px-3 p-1.5"
                  >
                    Ուղարկել
                  </button>
                )}
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
