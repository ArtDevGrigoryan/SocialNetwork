import { ChevronRight } from "lucide-react";
import { cn } from "../../../lib/utils";
import type { IRequest } from "../../../types/notification";

interface RequestsBannerProps {
  requests: IRequest[];
  onClick: () => void;
}

export function RequestsBanner({ requests, onClick }: RequestsBannerProps) {
  if (requests.length === 0) return null;

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-neutral-900 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 flex items-center justify-center">
          {requests.slice(0, 2).map((req, i) => (
            <img
              key={req._id}
              src={req.sender?.avatar || "/default-avatar.png"}
              className={cn(
                "absolute w-9 h-9 rounded-full border-2 border-black object-cover",
                i === 0 ? "left-0 z-10" : "right-0 z-0",
              )}
              alt="Avatar"
            />
          ))}
          {requests.length > 2 && (
            <span className="absolute -bottom-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full z-20">
              +{requests.length - 2}
            </span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Follow requests</p>
          <p className="text-sm text-neutral-400">
            {requests[0]?.sender?.username}{" "}
            {requests.length > 1 ? `+ ${requests.length - 1} others` : ""}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        <ChevronRight className="w-5 h-5 text-neutral-500" />
      </div>
    </div>
  );
}
