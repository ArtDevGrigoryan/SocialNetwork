import { useRef } from "react";
import { useParams } from "react-router-dom";
import { useChatStore } from "../../../store/chat.store";
import { useAuthStore } from "../../../store/auth.store";
import { useChatDetailsStore } from "../../../store/chat-details.store";
import { api } from "../../../lib/axios.config";
import {
  Camera,
  UserPlus,
  Bell,
  BellOff,
  MoreHorizontal,
  Palette,
  ChevronRight,
  Users,
  AtSign,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import ChatMediaTab from "./chat-media-tab";
import ChatSharedTab from "./chat-shared-tab";
import ChatLinksTab from "./chat-links-tab";
import ChatPinnedTab from "./chat-pinned-tab";
import type { IChat } from "../types";

export default function ChatDetailsMain({
  onPinnedMessageClick,
}: {
  onPinnedMessageClick?: (id: string) => void;
}) {
  const { chatId } = useParams();
  const { chats, setChats, togglePinMessage } = useChatStore();
  const { user } = useAuthStore();
  const store = useChatDetailsStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const chat = chats.find((c) => c._id === chatId);
  if (!chat) return null;

  const isGroup = chat.type === "group";
  const myParticipant = chat.participants.find((p) => p.user._id === user?._id);
  const isMuted = myParticipant?.isMuted || false;

  const activeUser = chat.participants.find(
    (p) => p.user._id !== user?._id,
  )?.user;
  const title = isGroup
    ? store.isEditingGroup
      ? store.groupNameInput
      : chat.groupName
    : activeUser?.username;
  const avatar = isGroup ? store.groupAvatarLocal : activeUser?.avatar;

  const handleUnpin = async (msgId: string) => {
    if (!chatId || !myParticipant?._id) return;

    setChats(
      chats.map((c) => {
        if (c._id === chatId) {
          const newPinned = (c.pinned || []).filter((p) => {
            const pId = typeof p === "string" ? p : p._id;
            return pId !== msgId;
          });
          return { ...c, pinned: newPinned };
        }
        return c;
      }),
    );

    try {
      await togglePinMessage(chatId, myParticipant._id, msgId);
    } catch (error) {
      console.error("Failed to unpin message", error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) store.setGroupAvatarLocal(URL.createObjectURL(file));
  };

  const handleToggleMute = async () => {
    if (!myParticipant?._id) return;
    try {
      await api.patch(`/chats/${chatId}/participant/${myParticipant._id}`, {
        isMuted: !isMuted,
      });
      setChats(
        chats.map((c) =>
          c._id === chatId
            ? {
                ...c,
                participants: c.participants.map((p) =>
                  p._id === myParticipant._id ? { ...p, isMuted: !isMuted } : p,
                ),
              }
            : c,
        ),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenMedia = (index: number) => {
    const items = store.sharedData.media.map((m) => ({
      url: m.url,
      mediaType: m.type === "VIDEO" ? ("VIDEO" as const) : ("IMAGE" as const),
    }));
    store.setViewerData({ items, initialIndex: index });
  };

  const getThemeName = () => {
    switch ((chat as IChat).theme) {
      case "ocean":
        return "Ocean Depth";
      case "sunset":
        return "Sunset Vibe";
      case "forest":
        return "Mystic Forest";
      default:
        return "Default";
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-200">
      <div className="flex flex-col items-center pt-8 pb-6 border-b border-neutral-800">
        <div
          className="relative mb-3 group cursor-pointer"
          onClick={() => store.isEditingGroup && fileInputRef.current?.click()}
        >
          {avatar ? (
            <img
              src={avatar}
              className={`w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full object-cover border border-neutral-800 shadow-lg ${store.isEditingGroup ? "opacity-50" : ""}`}
              alt={title}
            />
          ) : (
            <div className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-full bg-[#1a1a1a] border border-neutral-800 flex items-center justify-center">
              <span className="text-4xl font-bold text-[#f5c32c]">
                {title?.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          {store.isEditingGroup && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
              <Camera size={28} className="text-white" />
            </div>
          )}
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept="image/*"
            onChange={handleAvatarChange}
          />
        </div>

        {store.isEditingGroup ? (
          <input
            autoFocus
            value={store.groupNameInput}
            onChange={(e) => store.setGroupNameInput(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 text-white text-center font-bold text-[22px] rounded-lg px-3 py-1 outline-none max-w-[250px]"
          />
        ) : (
          <h3 className="text-white font-bold text-[22px] md:text-[24px]">
            {title}
          </h3>
        )}

        <div className="flex justify-center gap-6 mt-6 w-full px-4">
          {isGroup && (
            <button
              onClick={() => store.setIsAddMemberOpen(true)}
              className="flex flex-col items-center gap-1.5 hover:opacity-80 transition active:scale-95"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-neutral-900 border border-neutral-800 text-white">
                <UserPlus size={24} />
              </div>
              <span className="text-[12px] font-medium text-neutral-300">
                Add
              </span>
            </button>
          )}
          <button
            onClick={handleToggleMute}
            className="flex flex-col items-center gap-1.5 hover:opacity-80 transition active:scale-95"
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center border border-neutral-800 ${isMuted ? "bg-white text-black" : "bg-neutral-900 text-white"}`}
            >
              {isMuted ? <BellOff size={24} /> : <Bell size={24} />}
            </div>
            <span className="text-[12px] font-medium text-neutral-300">
              {isMuted ? "Unmute" : "Mute"}
            </span>
          </button>
          {isGroup && (
            <button
              onClick={() => store.setView("options")}
              className="flex flex-col items-center gap-1.5 hover:opacity-80 transition active:scale-95"
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-neutral-900 border border-neutral-800 text-white">
                <MoreHorizontal size={24} />
              </div>
              <span className="text-[12px] font-medium text-neutral-300">
                Options
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col p-2 space-y-1 mt-2">
        <div
          onClick={() => store.setView("theme")}
          className="flex items-center justify-between p-3.5 hover:bg-neutral-900 rounded-xl cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Palette size={24} className="text-white" />
            <div className="flex flex-col">
              <span className="text-white text-[16px] font-medium">Theme</span>
              <span className="text-neutral-500 text-[13px]">
                {getThemeName()}
              </span>
            </div>
          </div>
          <ChevronRight size={20} className="text-neutral-500" />
        </div>

        {isGroup && (
          <div
            onClick={() => store.setView("members")}
            className="flex items-center justify-between p-3.5 hover:bg-neutral-900 rounded-xl cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <Users size={24} className="text-white" />
              <span className="text-white text-[16px] font-medium">People</span>
            </div>
            <ChevronRight size={20} className="text-neutral-500" />
          </div>
        )}

        <div
          onClick={() => store.setView("nicknames")}
          className="flex items-center justify-between p-3.5 hover:bg-neutral-900 rounded-xl cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <AtSign size={24} className="text-white" />
            <span className="text-white text-[16px] font-medium">
              Nicknames
            </span>
          </div>
          <ChevronRight size={20} className="text-neutral-500" />
        </div>

        <div
          onClick={() => store.setView("privacy")}
          className="flex items-center justify-between p-3.5 hover:bg-neutral-900 rounded-xl cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert size={24} className="text-white" />
            <span className="text-white text-[16px] font-medium">
              Privacy & Safety
            </span>
          </div>
          <ChevronRight size={20} className="text-neutral-500" />
        </div>
      </div>

      <div className="mt-4 border-t border-neutral-800">
        <div className="flex border-b border-neutral-800">
          <button
            onClick={() => store.setActiveTab("media")}
            className={`flex-1 py-3 text-[14px] font-semibold transition ${store.activeTab === "media" ? "text-white border-b-2 border-white" : "text-neutral-500"}`}
          >
            Media
          </button>
          <button
            onClick={() => store.setActiveTab("shared")}
            className={`flex-1 py-3 text-[14px] font-semibold transition ${store.activeTab === "shared" ? "text-white border-b-2 border-white" : "text-neutral-500"}`}
          >
            Posts
          </button>
          <button
            onClick={() => store.setActiveTab("links")}
            className={`flex-1 py-3 text-[14px] font-semibold transition ${store.activeTab === "links" ? "text-white border-b-2 border-white" : "text-neutral-500"}`}
          >
            Links
          </button>
          <button
            onClick={() => store.setActiveTab("pinned")}
            className={`flex-1 py-3 text-[14px] font-semibold transition ${store.activeTab === "pinned" ? "text-white border-b-2 border-white" : "text-neutral-500"}`}
          >
            Pinned
          </button>
        </div>
        <div className="p-1 min-h-[200px]">
          {store.loadingShared ? (
            <Loader2 className="animate-spin text-neutral-500 w-8 h-8 mx-auto mt-10" />
          ) : (
            <>
              {store.activeTab === "media" && (
                <ChatMediaTab
                  media={store.sharedData.media}
                  onOpenMedia={handleOpenMedia}
                />
              )}
              {store.activeTab === "shared" && (
                <ChatSharedTab shared={store.sharedData.shared} />
              )}
              {store.activeTab === "links" && (
                <ChatLinksTab links={store.sharedData.links} />
              )}
              {store.activeTab === "pinned" &&
                chat.pinned?.map((p) => {
                  const pKey = typeof p === "string" ? p : p._id;
                  return (
                    <ChatPinnedTab
                      key={pKey}
                      message={p}
                      onScrollTo={
                        onPinnedMessageClick || ((_: string) => undefined)
                      }
                      onUnpin={handleUnpin}
                    />
                  );
                })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
