import {
  CheckCircle2,
  ShieldAlert,
  UserMinus,
  LogOut,
  Trash2,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useChatStore } from "../../../store/chat.store";
import { useChatDetailsStore } from "../../../store/chat-details.store";
import { api } from "../../../lib/axios.config";

export function ThemeView() {
  const { chatId } = useParams();
  const { chats, setChats } = useChatStore();
  const { setView } = useChatDetailsStore();

  const chat = chats.find((c) => c._id === chatId);
  const chatTheme = (chat as any)?.theme || "default";

  const themes = [
    { id: "default", name: "Default (Dark)", color: "bg-neutral-800" },
    { id: "ocean", name: "Ocean Depth", color: "bg-blue-600" },
    { id: "sunset", name: "Sunset Vibe", color: "bg-rose-500" },
    { id: "forest", name: "Mystic Forest", color: "bg-emerald-600" },
  ];

  const handleThemeSync = async (themeId: string) => {
    setView("main");
    setChats(
      chats.map((c) => (c._id === chatId ? { ...c, theme: themeId } : c)),
    );
    try {
      await api.patch(`/chats/${chatId}`, { theme: themeId });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-right-2 duration-200">
      <p className="text-neutral-500 text-sm mb-4 text-center">
        Choose a theme for this chat to make it your own.
      </p>
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => handleThemeSync(t.id)}
          className={`flex items-center gap-4 p-4 rounded-2xl transition-colors border ${chatTheme === t.id ? "border-[#3797F0] bg-neutral-900" : "border-neutral-800 hover:bg-neutral-900/50"}`}
        >
          <div
            className={`w-12 h-12 rounded-full shadow-lg ${t.color} border border-white/10`}
          />
          <span className="text-white font-medium text-[16px] flex-1 text-left">
            {t.name}
          </span>
          {chatTheme === t.id && (
            <CheckCircle2 className="text-[#3797F0]" size={24} />
          )}
        </button>
      ))}
    </div>
  );
}

export function PrivacyView() {
  return (
    <div className="p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-right-2 duration-200">
      <div className="w-20 h-20 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mx-auto mt-4 shadow-lg">
        <ShieldAlert size={40} className="text-[#3797F0]" />
      </div>
      <h3 className="text-white text-[22px] font-bold text-center mt-2">
        Privacy & Safety
      </h3>
      <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl">
        <p className="text-neutral-300 text-[15px] leading-relaxed mb-4">
          Your conversations are private and secure. All personal interactions
          and data shared in this chat are strictly protected. End-to-end
          encryption ensures that only you and the participants can read or
          listen to what is sent.
        </p>
        <p className="text-neutral-300 text-[15px] leading-relaxed">
          Additionally, you have full control over your experience. You can mute
          notifications, manage participants, or block unwanted contacts at any
          time to maintain a safe environment.
        </p>
      </div>
    </div>
  );
}

export function OptionsView({
  onLeave,
  onDelete,
}: {
  onLeave: () => void;
  onDelete: () => void;
}) {
  const { chatId } = useParams();
  const { chats } = useChatStore();
  const { setView } = useChatDetailsStore();
  const chat = chats.find((c) => c._id === chatId);

  return (
    <div className="p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-right-2 duration-200">
      {chat?.type === "group" && (
        <button
          onClick={() => setView("members")}
          className="text-red-500 flex items-center gap-3 p-4 bg-neutral-900/60 rounded-xl hover:bg-neutral-900 transition-colors border border-neutral-800 font-medium"
        >
          <UserMinus size={20} /> Remove Participant
        </button>
      )}
      <button
        onClick={onLeave}
        className="text-red-500 flex items-center gap-3 p-4 bg-neutral-900/60 rounded-xl hover:bg-neutral-900 transition-colors border border-neutral-800 font-medium"
      >
        <LogOut size={20} /> Leave Group
      </button>
      <button
        onClick={onDelete}
        className="text-red-500 flex items-center gap-3 p-4 bg-neutral-900/60 rounded-xl hover:bg-neutral-900 transition-colors border border-neutral-800 font-medium"
      >
        <Trash2 size={20} /> Delete Chat
      </button>
    </div>
  );
}

export function NicknamesView() {
  const { chatId } = useParams();
  const { chats, setChats } = useChatStore();
  const store = useChatDetailsStore();
  const chat = chats.find((c) => c._id === chatId);

  const handleSaveNickname = async (participantId: string) => {
    try {
      await api.patch(`/chats/${chatId}/participant/${participantId}`, {
        participantName: store.nickName,
      });
      setChats(
        chats.map((c) =>
          c._id === chatId
            ? {
                ...c,
                participants: c.participants.map((p) =>
                  p._id === participantId
                    ? { ...p, participantName: store.nickName }
                    : p,
                ),
              }
            : c,
        ),
      );
    } catch (error) {
      console.error(error);
    } finally {
      store.setEditingId(null);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-right-2 duration-200">
      <p className="text-neutral-500 text-sm mb-2 text-center">
        Set nicknames for people in this chat.
      </p>
      {chat?.participants.map((p) => (
        <div
          key={p._id}
          className="flex items-center gap-3 p-3 bg-neutral-900/50 rounded-xl border border-neutral-800/50"
        >
          <img
            src={p.user.avatar || "/default-avatar.png"}
            className="w-12 h-12 rounded-full object-cover"
            alt={p.user.username}
          />
          <div className="flex-1 flex flex-col">
            {store.editingId === p._id ? (
              <input
                autoFocus
                value={store.nickName}
                onChange={(e) => store.setNickName(e.target.value)}
                onBlur={() => handleSaveNickname(p._id)}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleSaveNickname(p._id)
                }
                className="bg-black border border-neutral-700 text-white px-3 py-1.5 rounded-lg text-[14px] outline-none"
              />
            ) : (
              <div
                className="cursor-pointer"
                onClick={() => {
                  store.setEditingId(p._id);
                  store.setNickName(p.participantName || p.user.username);
                }}
              >
                <span className="text-white text-[15px] font-medium">
                  {p.participantName || p.user.username}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
