import { Link } from "react-router-dom";
import {
  type INotification,
  useNotificationStore,
} from "../../../store/notification.store";
import { cn } from "../../../lib/utils";

const getTimeAgo = (dateString: string) => {
  const diff = Math.floor(
    (new Date().getTime() - new Date(dateString).getTime()) / 1000,
  );
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}w`;
};

export function NotificationItem({ item }: { item: INotification }) {
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const primaryUser = item.meta?.users?.[0];

  if (!primaryUser) return null;

  const count = item.meta?.count || 1;
  const additional = count > 1 ? ` and ${count - 1} others` : "";
  let text = "",
    rightSide = null;

  switch (item.type) {
    case "LIKE":
      text = `liked your post${additional}.`;
      if (item.entity?.images?.length > 0) {
        rightSide = (
          <img
            src={item.entity.images[0]}
            className="w-11 h-11 object-cover rounded border border-neutral-800"
            alt="Post"
          />
        );
      }
      break;
    case "COMMENT":
      text = `commented: ${item.entity?.text ? `"${item.entity.text}"` : `on your post`}${additional}`;
      if (item.entity?.images?.length > 0) {
        rightSide = (
          <img
            src={item.entity.images[0]}
            className="w-11 h-11 object-cover rounded border border-neutral-800"
            alt="Post"
          />
        );
      }
      break;
    case "FOLLOW":
      text = `started following you${additional}.`;
      rightSide = (
        <button className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-[13px] font-semibold rounded-lg transition-colors">
          Following
        </button>
      );
      break;
    case "MESSAGE":
      text = `sent you a message${additional}.`;
      break;
    case "NEW_POST":
      text = `shared a new post.`;
      break;
    default:
      text = `sent a notification.`;
  }

  return (
    <div
      onClick={() => markAsRead(item._id, item.isRead)}
      className={cn(
        "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors w-full",
        !item.isRead
          ? "bg-blue-500/5 hover:bg-blue-500/10"
          : "bg-black hover:bg-neutral-900/50",
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Link to={`/profile/${primaryUser._id}`} className="shrink-0 relative">
          <img
            src={primaryUser.avatar || "/default-avatar.png"}
            className="w-11 h-11 rounded-full object-cover border border-neutral-800"
            alt={primaryUser.username}
          />
          {!item.isRead && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-[#0095F6] rounded-full border-2 border-black" />
          )}
        </Link>

        <div className="text-[13px] text-neutral-200 leading-[18px] pr-2 truncate whitespace-normal break-words line-clamp-2">
          <Link
            to={`/profile/${primaryUser._id}`}
            className="font-semibold text-white hover:text-neutral-300 mr-1 transition-colors"
          >
            {primaryUser.username}
          </Link>
          <span className="text-neutral-300">{text}</span>
          <span className="text-neutral-500 ml-1.5 text-[13px]">
            {getTimeAgo(item.createdAt)}
          </span>
        </div>
      </div>

      {rightSide && <div className="shrink-0 ml-3">{rightSide}</div>}
    </div>
  );
}
