import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  MoreHorizontal,
  UserMinus,
  Shield,
  ShieldOff,
  LogOut,
  UserPlus,
} from "lucide-react";
import type { MemberTabProps } from "../types";
import { useChatStore } from "../../../store/chat.store";
import { useAuthStore } from "../../../store/auth.store";
import { useChatDetailsStore } from "../../../store/chat-details.store";
import { api } from "../../../lib/axios.config";

export default function ChatMembersTab({ onLeaveGroup }: MemberTabProps) {
  const { chatId } = useParams();
  const { chats, setChats } = useChatStore();
  const { user } = useAuthStore();
  const store = useChatDetailsStore();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const chat = chats.find((c) => c._id === chatId);
  if (!chat) return null;

  const participants = chat.participants;
  const myParticipant = participants.find((p) => p.user._id === user?._id);
  const isAdmin = myParticipant?.role === "admin";

  const handleRoleChange = async (
    participantId: string,
    newRole: "admin" | "member",
  ) => {
    try {
      await api.patch(`/chats/${chatId}/participant/${participantId}`, {
        role: newRole,
      });
      setChats(
        chats.map((c) =>
          c._id === chatId
            ? {
                ...c,
                participants: c.participants.map((p) =>
                  p._id === participantId ? { ...p, role: newRole } : p,
                ),
              }
            : c,
        ),
      );
      setActiveMenuId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveMember = async (participantId: string) => {
    try {
      await api.delete(`/chats/${chatId}/participant`, {
        data: { participantId, removerId: myParticipant?._id },
      });
      setChats(
        chats.map((c) =>
          c._id === chatId
            ? {
                ...c,
                participants: c.participants.filter(
                  (p) => p._id !== participantId,
                ),
              }
            : c,
        ),
      );
      setActiveMenuId(null);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-4 flex flex-col animate-in fade-in slide-in-from-right-2 duration-200 pb-20">
      {isAdmin && (
        <button
          onClick={() => store.setIsAddMemberOpen(true)}
          className="flex items-center gap-3 mb-4 p-3 bg-neutral-900/80 hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-800"
        >
          <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center">
            <UserPlus size={20} className="text-white" />
          </div>
          <span className="text-white font-medium text-[15px]">Add People</span>
        </button>
      )}

      {participants.map((p) => (
        <div
          key={p._id}
          className="flex items-center justify-between py-2 group relative"
        >
          <div className="flex items-center gap-3">
            <img
              src={p.user.avatar || "/default-avatar.png"}
              className="w-12 h-12 rounded-full object-cover"
              alt={p.user.username}
            />
            <div className="flex flex-col">
              <span className="text-white font-medium text-[15px] flex items-center gap-2">
                {p.participantName || p.user.username}
                {p.role === "admin" && (
                  <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded-md uppercase tracking-wider font-bold">
                    Admin
                  </span>
                )}
              </span>
              {p.participantName && (
                <span className="text-neutral-500 text-[13px]">
                  {p.user.username}
                </span>
              )}
            </div>
          </div>

          {isAdmin && p.user._id !== user?._id && (
            <div className="relative">
              <button
                onClick={() =>
                  setActiveMenuId(activeMenuId === p._id ? null : p._id)
                }
                className="p-2 text-neutral-500 hover:text-white transition rounded-full hover:bg-neutral-800"
              >
                <MoreHorizontal size={20} />
              </button>

              {activeMenuId === p._id && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setActiveMenuId(null)}
                  />
                  <div className="absolute right-0 top-full mt-1 bg-[#1a1a1a] border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden min-w-[200px] flex flex-col py-1 animate-in fade-in zoom-in-95 duration-200">
                    <button
                      onClick={() =>
                        handleRoleChange(
                          p._id,
                          p.role === "admin" ? "member" : "admin",
                        )
                      }
                      className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-white hover:bg-neutral-800 transition w-full text-left"
                    >
                      {p.role === "admin" ? (
                        <>
                          <ShieldOff size={16} className="text-neutral-400" />{" "}
                          Remove Admin
                        </>
                      ) : (
                        <>
                          <Shield size={16} className="text-neutral-400" /> Make
                          Admin
                        </>
                      )}
                    </button>
                    <div className="h-px bg-neutral-800 my-1 mx-2" />
                    <button
                      onClick={() => handleRemoveMember(p._id)}
                      className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-red-500 hover:bg-red-500/10 transition w-full text-left"
                    >
                      <UserMinus size={16} /> Remove from group
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={onLeaveGroup}
        className="flex items-center gap-3 mt-4 p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-medium justify-center border border-red-500/20"
      >
        <LogOut size={18} />
        Leave Chat
      </button>
    </div>
  );
}
