import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import { useSocketStore } from "../../store/socket.store";
import { Send, Image as ImageIcon, Info } from "lucide-react";
import type { IUser } from "../../types/user.types";

interface IChat {
  _id: string;
  participants: IUser[];
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

  // 1. Ստանալ բոլոր զրույցների ցանկը
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await api.get("/chats");
        const payload = data.payload;
        setChats(payload?.chats || payload || []);
      } catch (error) {
        console.error("Error fetching chats:", error);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, []);

  // 2. Ստանալ ընտրված չաթի նամակները
  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const { data } = await api.get(`/messages/${chatId}`);
        setMessages(data.payload || []);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [chatId]);

  // 3. Իրական ժամանակի Socket.io իրադարձություններ (Real-time events)
  useEffect(() => {
    if (!socket) return;
    if (chatId) {
      joinChat(chatId);
    }

    socket.on("receive_message", (message: IMessage) => {
      if (message.chatId === chatId) {
        setMessages((prev) => {
          const withoutOptimistic = prev.filter(
            (m) => !(m._id.startsWith("temp_") && m.text === message.text),
          );
          return [...withoutOptimistic, message];
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
  const handleSendMessage = async (e: React.FormEvent) => {
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
      const { data } = await api.post(`/messages/${chatId}`, { text });

      // Socket-ով ուղարկելը կարող է կատարվել backend-ից,
      // կամ եթե ձեր backend-ը սպասում է client-ից:
      // socket.emit("send_message", data.payload);

      // Թարմացնել իսկական ID-ով
      if (data.payload) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempMessage._id ? data.payload : m)),
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Սխալի դեպքում հեռացնել չուղարկված նամակը
      setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
    }
  };

  // Որոշել խոսակցին (մյուս մասնակցին) ցանկի էլեմենտի համար
  const getOtherParticipant = (participants: IUser[]) => {
    return (
      participants.find((p) => p._id !== currentUser?._id) || participants[0]
    );
  };

  const activeChat = chats.find((c) => c._id === chatId);
  const activeUser = activeChat
    ? getOtherParticipant(activeChat.participants)
    : null;

  return (
    <div className="flex h-[calc(100vh-theme(spacing.20))] md:h-screen w-full bg-black border border-neutral-800 rounded-lg md:rounded-none overflow-hidden animate-in fade-in duration-300">
      {/* ՁԱԽ ՀԱՏՎԱԾ: Չաթերի Ցանկ */}
      <div
        className={`${chatId ? "hidden md:flex" : "flex"} flex-col w-full md:w-[350px] border-r border-neutral-800 bg-black`}
      >
        <div className="px-4 py-6 border-b border-neutral-800">
          <h1 className="text-xl font-bold text-white">
            {currentUser?.username}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loadingChats ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-900 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-neutral-900 rounded w-1/2 animate-pulse" />
                    <div className="h-3 bg-neutral-900 rounded w-3/4 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-neutral-500 mt-10">
              Զրույցներ չկան: Սկսեք նոր նամակագրություն:
            </div>
          ) : (
            chats.map((chat) => {
              const otherUser = getOtherParticipant(chat.participants);
              const isActive = chat._id === chatId;

              return (
                <Link
                  key={chat._id}
                  to={`/messages/${chat._id}`}
                  className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-neutral-900 transition-colors ${isActive ? "bg-neutral-900" : ""}`}
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
                      className={`font-semibold text-sm ${isActive ? "text-white" : "text-neutral-200"}`}
                    >
                      {otherUser?.username}
                    </h3>
                    {chat.lastMessage && (
                      <p
                        className={`text-sm truncate ${isActive ? "text-neutral-300" : "text-neutral-500"}`}
                      >
                        {chat.lastMessage.text}
                      </p>
                    )}
                  </div>
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
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <div className="w-24 h-24 rounded-full border-2 border-white flex items-center justify-center mb-4">
              <Send size={40} className="text-white ml-2" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Ձեր Նամակները</h2>
            <p className="text-neutral-500 mt-2">
              Ընտրեք զրույց՝ նամակագրությունը սկսելու համար
            </p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 px-4 border-b border-neutral-800 flex items-center justify-between bg-black">
              <div className="flex items-center gap-3">
                {/* Mobile Back Button */}
                <button
                  onClick={() => navigate("/messages")}
                  className="md:hidden text-white mr-2"
                >
                  <svg
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <line x1="19" x2="5" y1="12" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </button>
                <Link
                  to={`/profile/${activeUser?._id}`}
                  className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800"
                >
                  <img
                    src={activeUser?.avatar || "/default-avatar.png"}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <Link
                  to={`/profile/${activeUser?._id}`}
                  className="font-semibold text-white hover:underline"
                >
                  {activeUser?.username || "Օգտատեր"}
                </Link>
              </div>
              <button className="text-white hover:text-neutral-400 transition-colors">
                <Info size={24} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar flex flex-col">
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
                      className={`flex ${isMine ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                          isMine
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-neutral-800 text-white rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-black">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center bg-neutral-900 border border-neutral-800 rounded-full px-4 py-2"
              >
                <button
                  type="button"
                  className="text-white hover:text-neutral-400 transition-colors p-2"
                >
                  <ImageIcon size={24} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Գրել նամակ..."
                  className="flex-1 bg-transparent border-none text-white focus:outline-none px-2 placeholder-neutral-500 text-sm"
                  autoComplete="off"
                />
                {newMessage.trim() && (
                  <button
                    type="submit"
                    className="text-blue-500 font-semibold hover:text-blue-400 transition-colors px-2"
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
