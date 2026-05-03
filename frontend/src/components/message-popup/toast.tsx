import { useEffect } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "../../store/notification.store";
import type { StrictNotification } from "../../types/notification";

export function InAppToast() {
  const { activeToast, setActiveToast } = useNotificationStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [activeToast, setActiveToast]);

  if (!activeToast) return null;

  const toast = activeToast;
  const primaryUser =
    toast.fromUser && typeof toast.fromUser === "object"
      ? toast.fromUser
      : toast.meta?.users?.[0];

  if (!primaryUser && toast.type !== "SYSTEM") return null;

  const handleClick = () => {
    let href = "/notifications";

    switch (toast.type) {
      case "LIKE":
        if (toast.entityModel === "Story") {
          if (primaryUser) href = `/profile/${primaryUser._id}`;
        } else if (toast.entityModel === "Post") {
          href = `/explore?postId=${typeof toast.entity === "string" ? toast.entity : (toast.entity as any)._id}`;
        }
        break;
      case "COMMENT":
        href = `/explore?postId=${typeof toast.entity === "string" ? toast.entity : (toast.entity as any).post || (toast.entity as any)._id}`;
        break;
      case "FOLLOW":
      case "REQUEST":
      case "ACCEPTED":
      case "DECLINED":
      case "UNFOLLOW":
      case "CANCELLED":
      case "NEW_STORY":
        if (primaryUser) href = `/profile/${primaryUser._id}`;
        break;
      case "MESSAGE":
        href = `/messages/${typeof toast.entity === "string" ? toast.entity : (toast.entity as any).chat || (toast.entity as any)._id}`;
        break;
      case "NEW_POST":
        href = `/explore?postId=${typeof toast.entity === "string" ? toast.entity : (toast.entity as any)._id}`;
        break;
      case "NEW_GROUP":
        href = `/messages/${typeof toast.entity === "string" ? toast.entity : (toast.entity as any)._id}`;
        break;
      case "SYSTEM":
      case "GROUP_DISJOIN":
      case "GROUP_REMOVED":
      case "PARTICIPANT_REMOVED":
      case "PARTICIPANT_REMOVED_NOTICE":
        href = "/notifications";
        break;
    }

    setActiveToast(null);
    if (href) {
      navigate(href);
    }
  };

  let text = "sent you a notification.";

  switch (toast.type) {
    case "LIKE":
      text = `liked your ${toast.entityModel === "Story" ? "story" : "post"}.`;
      break;
    case "COMMENT":
      text = "commented on your post.";
      break;
    case "FOLLOW":
      text = "started following you.";
      break;
    case "UNFOLLOW":
      text = "unfollowed you.";
      break;
    case "REQUEST":
      text = "requested to follow you.";
      break;
    case "CANCELLED":
      text = "cancelled their follow request.";
      break;
    case "DECLINED":
      text = "declined your follow request.";
      break;
    case "ACCEPTED":
      text = "accepted your follow request.";
      break;
    case "MESSAGE":
      text = "sent you a message.";
      break;
    case "NEW_POST":
      text = "shared a new post.";
      break;
    case "NEW_STORY":
      text = "added a new story.";
      break;
    case "NEW_GROUP":
      text = `added you to a new group: ${typeof toast.entity === "object" && toast.entity !== null && "groupName" in toast.entity ? toast.entity.groupName : "Chat"}.`;
      break;
    case "GROUP_REMOVED":
      text = "deleted the group.";
      break;
    case "PARTICIPANT_REMOVED":
      text = "removed you from the group.";
      break;
    case "PARTICIPANT_REMOVED_NOTICE":
      text = "was removed from the group.";
      break;
    case "GROUP_DISJOIN":
      text = "left the group.";
      break;
    case "SYSTEM":
      text = toast.meta?.message || "sent a system alert.";
      break;
  }

  const username = primaryUser?.username || "System";
  const avatarUrl = primaryUser?.avatar || "/default-avatar.png";

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-5 fade-in duration-300 w-[90%] max-w-sm">
      <div
        onClick={handleClick}
        className="bg-neutral-900 border border-neutral-800 shadow-2xl rounded-2xl p-3 flex items-center justify-between gap-3 backdrop-blur-md bg-opacity-95 cursor-pointer hover:bg-neutral-800/80 transition-colors"
      >
        <img
          src={avatarUrl}
          className="w-10 h-10 rounded-full object-cover border border-neutral-700 shrink-0"
          alt={username}
        />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-semibold text-white truncate">
            {username}
          </span>
          <span className="text-xs text-neutral-400 truncate">{text}</span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveToast(null);
          }}
          className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-700 rounded-full transition-colors shrink-0 outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
