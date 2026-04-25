import { Info, Phone, Video, ChevronLeft, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ChatHeaderProps } from "../types";

export default function ChatHeader({
  chat,
  activeUser,
  onHeaderClick,
}: ChatHeaderProps) {
  const navigate = useNavigate();

  const isGroup = chat?.type === "group";
  const title = isGroup ? chat.groupName || "Group Chat" : activeUser?.username;
  const avatar = isGroup ? chat.groupAvatar : activeUser?.avatar;

  return (
    <div className="h-[60px] md:h-[75px] pt-[max(0.5rem,env(safe-area-inset-top))] px-2 md:px-6 border-b border-neutral-800 flex items-center justify-between bg-black/90 backdrop-blur-xl shrink-0 z-50 sticky top-0">
      <div className="flex items-center gap-2 md:gap-4 h-full min-w-0">
        <button
          onClick={() => navigate(-1)}
          className="md:hidden text-white hover:bg-neutral-800 transition p-2 rounded-full flex items-center justify-center -ml-1 shrink-0"
        >
          <ChevronLeft size={30} />
        </button>

        <div
          onClick={onHeaderClick}
          className="flex items-center gap-3 active:opacity-70 transition-opacity cursor-pointer py-2 min-w-0"
        >
          {avatar ? (
            <img
              src={avatar}
              className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover bg-neutral-900 border border-neutral-800 shadow-sm shrink-0"
              alt={title}
            />
          ) : (
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-neutral-800 flex items-center justify-center border border-neutral-700 shadow-sm shrink-0">
              <Users size={20} className="text-neutral-400" />
            </div>
          )}
          <div className="flex flex-col justify-center min-w-0">
            <span className="font-semibold text-white text-[15px] md:text-[16px] leading-tight truncate">
              {title}
            </span>
            <span className="text-[12px] text-neutral-500 font-medium mt-0.5 leading-tight truncate">
              {isGroup
                ? `${chat?.participants?.length || 0} members`
                : "Active now"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-3 text-white shrink-0 pr-1">
        <button className="hover:bg-neutral-800 transition p-2.5 rounded-full active:scale-95">
          <Phone size={24} strokeWidth={1.8} />
        </button>
        <button className="hover:bg-neutral-800 transition p-2.5 rounded-full active:scale-95">
          <Video size={25} strokeWidth={1.8} />
        </button>
        <button
          onClick={onHeaderClick}
          className="hover:bg-neutral-800 transition p-2.5 rounded-full hidden md:flex active:scale-95"
        >
          <Info size={24} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
