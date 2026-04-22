import { Info, Phone, Video, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import type { ChatHeaderProps } from "../types";

export default function ChatHeader({ activeUser }: ChatHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="h-[75px] px-2 md:px-6 border-b border-neutral-800 flex items-center justify-between bg-black shrink-0 z-30 sticky top-0">
      <div className="flex items-center gap-1 md:gap-4">
        <button
          onClick={() => navigate(-1)}
          className="md:hidden text-white hover:bg-neutral-800 transition p-2 rounded-full flex items-center justify-center"
        >
          <ChevronLeft size={30} />
        </button>
        <Link
          to={`/profile/${activeUser?._id}`}
          className="flex items-center gap-3 active:opacity-70 transition-opacity ml-1 md:ml-0"
        >
          <img
            src={activeUser?.avatar || "/default-avatar.png"}
            className="w-10 h-10 md:w-11 md:h-11 rounded-full object-cover bg-neutral-900 border border-neutral-800"
            alt={activeUser?.username}
          />
          <div className="flex flex-col">
            <span className="font-semibold text-white text-[15px] md:text-[16px] leading-tight">
              {activeUser?.username}
            </span>
            <span className="text-xs text-neutral-500 mt-0.5 font-medium">
              Active now
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-1 md:gap-3 text-white pr-2 md:pr-0">
        <button className="hover:bg-neutral-800 transition p-2.5 rounded-full">
          <Phone size={24} strokeWidth={1.8} />
        </button>
        <button className="hover:bg-neutral-800 transition p-2.5 rounded-full">
          <Video size={25} strokeWidth={1.8} />
        </button>
        <button className="hover:bg-neutral-800 transition p-2.5 rounded-full hidden md:flex">
          <Info size={24} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  );
}
