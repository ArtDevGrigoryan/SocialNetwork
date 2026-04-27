import { useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { api } from "../../../lib/axios.config";
import { useParams, useNavigate } from "react-router-dom";

import { useChatStore } from "../../../store/chat.store";
import { useAuthStore } from "../../../store/auth.store";
import { useChatDetailsStore } from "../../../store/chat-details.store";

import MediaViewer from "./media-viewer";
import AddMemberModal from "./add-member-modal";
import ChatMembersTab from "./chat-members-tab";
import ChatDetailsMain from "./chat-details-main";
import {
  ThemeView,
  PrivacyView,
  OptionsView,
  NicknamesView,
} from "./chat-details-view";
import type { IParticipant, ChatDetailsProps } from "../types";

export default function ChatDetails({
  onClose,
  onPinnedMessageClick,
}: ChatDetailsProps) {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { chats, setChats } = useChatStore();
  const { user } = useAuthStore();

  const store = useChatDetailsStore();
  const activeChat = chats.find((c) => c._id === chatId);

  useEffect(() => {
    if (chatId) {
      store.reset();
      store.fetchSharedData(chatId);
      if (activeChat) {
        store.setGroupNameInput(activeChat.groupName || "");
        store.setGroupAvatarLocal(activeChat.groupAvatar || "");
      }
    }
  }, [chatId]);

  if (!activeChat || !chatId) return null;

  const isGroup = activeChat.type === "group";
  const myParticipant = activeChat.participants.find(
    (p) => p.user._id === user?._id,
  );
  const isAdmin = myParticipant?.role === "admin";

  const handleSaveGroupInfo = async () => {
    try {
      await api.patch(`/chats/${chatId}`, {
        groupName: store.groupNameInput,
        groupAvatar: store.groupAvatarLocal,
      });
      setChats(
        chats.map((c) =>
          c._id === chatId
            ? {
                ...c,
                groupName: store.groupNameInput,
                groupAvatar: store.groupAvatarLocal,
              }
            : c,
        ),
      );
      store.setIsEditingGroup(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteChat = async () => {
    try {
      await api.delete(`/chats/${chatId}`);
      setChats(chats.filter((c) => c._id !== chatId));
      navigate("/messages");
    } catch (error) {
      console.error("Failed to delete chat", error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!myParticipant?._id) return;
    try {
      await api.delete(`/chats/${chatId}/disjoin`, {
        data: { participantId: myParticipant._id },
      });
      setChats(chats.filter((c) => c._id !== chatId));
      navigate("/messages");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-black relative z-40">
      <div className="h-[75px] px-4 border-b border-neutral-800 flex items-center justify-between shrink-0 bg-black">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              store.view === "main" ? onClose() : store.setView("main")
            }
            className="p-2 -ml-2 hover:bg-neutral-800 rounded-full transition"
          >
            <ChevronLeft size={30} className="text-white" />
          </button>
          <h2 className="text-white text-[17px] font-semibold capitalize">
            {store.view === "main"
              ? "Details"
              : store.view === "nicknames"
                ? "Nicknames"
                : store.view}
          </h2>
        </div>
        {isGroup && isAdmin && store.view === "main" && (
          <button
            onClick={
              store.isEditingGroup
                ? handleSaveGroupInfo
                : () => store.setIsEditingGroup(true)
            }
            className="text-[#3797F0] font-semibold text-[15px] px-2"
          >
            {store.isEditingGroup ? "Save" : "Edit"}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        {store.view === "main" && (
          <ChatDetailsMain onPinnedMessageClick={onPinnedMessageClick} />
        )}
        {store.view === "theme" && <ThemeView />}
        {store.view === "privacy" && <PrivacyView />}
        {store.view === "options" && (
          <OptionsView onLeave={handleLeaveGroup} onDelete={handleDeleteChat} />
        )}
        {store.view === "nicknames" && <NicknamesView />}
        {store.view === "members" && (
          <ChatMembersTab onLeaveGroup={handleLeaveGroup} />
        )}
      </div>

      {store.viewerData && (
        <MediaViewer
          isOpen={true}
          media={store.viewerData.items}
          initialIndex={store.viewerData.initialIndex}
          onClose={() => store.setViewerData(null)}
        />
      )}

      {isGroup && (
        <AddMemberModal
          isOpen={store.isAddMemberOpen}
          onClose={() => store.setIsAddMemberOpen(false)}
          chatId={chatId}
          existingParticipants={activeChat.participants.map((p) => p.user._id)}
          onMemberAdded={(newParts: IParticipant[]) => {
            setChats(
              chats.map((c) =>
                c._id === chatId
                  ? { ...c, participants: [...c.participants, ...newParts] }
                  : c,
              ),
            );
            store.setIsAddMemberOpen(false);
          }}
        />
      )}
    </div>
  );
}
