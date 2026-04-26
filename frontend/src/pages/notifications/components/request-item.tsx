import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import {
  type IRequest,
  useNotificationStore,
} from "../../../store/notification.store";

interface FollowRequestItemProps {
  request: IRequest;
}

export function FollowRequestItem({ request }: FollowRequestItemProps) {
  const handleRequestAction = useNotificationStore(
    (state) => state.handleRequestAction,
  );
  const [loadingAction, setLoadingAction] = useState<
    "accept" | "decline" | null
  >(null);

  const onActionClick = async (
    e: React.MouseEvent,
    action: "accept" | "decline",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (loadingAction) return;

    setLoadingAction(action);
    try {
      await handleRequestAction(request, action);
    } catch (error) {
      console.error("Action failed", error);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-neutral-900 transition-colors">
      <Link
        to={`/profile/${request.sender?._id}`}
        className="flex items-center gap-3 min-w-0"
      >
        <img
          src={request.sender?.avatar || "/default-avatar.png"}
          className="w-11 h-11 rounded-full object-cover"
          alt="avatar"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">
            {request.sender?.username}
          </p>
          <p className="text-[13px] text-neutral-400 truncate">
            Requested to follow you
          </p>
        </div>
      </Link>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <button
          disabled={!!loadingAction}
          onClick={(e) => onActionClick(e, "accept")}
          className="px-4 py-1.5 bg-[#0095F6] hover:bg-[#1877F2] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
        >
          {loadingAction === "accept" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Confirm"
          )}
        </button>
        <button
          disabled={!!loadingAction}
          onClick={(e) => onActionClick(e, "decline")}
          className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
        >
          {loadingAction === "decline" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Delete"
          )}
        </button>
      </div>
    </div>
  );
}
