import { Link, useNavigate } from "react-router-dom";
import { useNotificationStore } from "../../../store/notification.store";
import { cn } from "../../../lib/utils";
import type { StrictNotification } from "../../../types/notification";
import { Trash2 } from "lucide-react";

const getTimeAgo = (dateString: string) => {
  if (!dateString) return "";
  const diff = Math.floor(
    (new Date().getTime() - new Date(dateString).getTime()) / 1000,
  );
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 86400)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / 604800)}w`;
};

export function NotificationItem({ item }: { item: StrictNotification }) {
  const navigate = useNavigate();
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const deleteNotification = useNotificationStore(
    (state) => state.deleteNotification,
  );

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNotification(item._id);
  };

  const primaryUser =
    item.fromUser && typeof item.fromUser === "object"
      ? item.fromUser
      : item.meta?.users?.[0];

  if (!primaryUser && item.type !== "SYSTEM") return null;

  const count = item.meta?.count || 1;
  const additional = count > 1 ? ` and ${count - 1} others` : "";

  let text = "";
  let rightSide: React.ReactNode = null;
  const username = primaryUser?.username || "System";
  const avatarUrl = primaryUser?.avatar || "/default-avatar.png";

  switch (item.type) {
    case "LIKE": {
      const isStory = item.entityModel === "Story";
      text = `liked your ${isStory ? "story" : "post"}${additional}.`;

      let imageUrl = "";
      if (
        item.entityModel === "Post" &&
        "images" in item.entity &&
        item.entity.images?.length > 0
      ) {
        imageUrl =
          typeof item.entity.images[0] === "string"
            ? item.entity.images[0]
            : (item.entity.images[0] as any).url;
      } else if (
        item.entityModel === "Story" &&
        "media" in item.entity &&
        item.entity.media?.url
      ) {
        imageUrl = item.entity.media.url;
      }

      if (imageUrl) {
        rightSide = (
          <img
            src={imageUrl}
            className="w-11 h-11 object-cover rounded border border-neutral-800"
            alt={isStory ? "Story" : "Post"}
          />
        );
      }
      break;
    }
    case "MENTION": {
      text = `mentioned you in a post${additional}.`;
      let imageUrl = "";
      if (
        item.entityModel === "Post" &&
        "images" in item.entity &&
        item.entity.images?.length > 0
      ) {
        imageUrl =
          typeof item.entity.images[0] === "string"
            ? item.entity.images[0]
            : (item.entity.images[0] as any).url;
      }

      if (imageUrl) {
        rightSide = (
          <img
            src={imageUrl}
            className="w-11 h-11 object-cover rounded border border-neutral-800"
            alt="Post"
          />
        );
      }
      break;
    }
    case "COMMENT": {
      text = `commented: ${item.entity?.text || "on your post"}${additional}`;
      if (item.meta?.users?.length) {
        rightSide = (
          <img
            src={item.meta.users[0].avatar || "/default-avatar.png"}
            className="w-11 h-11 object-cover rounded border border-neutral-800"
            alt="Commenter"
          />
        );
      }
      break;
    }
    case "FOLLOW": {
      text = `started following you${additional}.`;
      rightSide = (
        <button className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-[13px] font-semibold rounded-lg transition-colors">
          Following
        </button>
      );
      break;
    }
    case "UNFOLLOW": {
      text = `unfollowed you.`;
      break;
    }
    case "REQUEST": {
      text = `requested to follow you.`;
      rightSide = (
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 bg-[#0095F6] hover:bg-blue-600 text-white text-[13px] font-semibold rounded-lg transition-colors">
            Confirm
          </button>
          <button className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-[13px] font-semibold rounded-lg transition-colors">
            Delete
          </button>
        </div>
      );
      break;
    }
    case "CANCELLED": {
      text = `cancelled their follow request.`;
      break;
    }
    case "DECLINED": {
      text = `declined your follow request.`;
      break;
    }
    case "ACCEPTED": {
      text = `accepted your follow request.`;
      break;
    }
    case "MESSAGE": {
      text = `sent you a message${additional}${item.entity?.text ? `: ${item.entity.text}` : "."}`;
      break;
    }
    case "NEW_GROUP": {
      text = `added you to a new group: ${(item.entity as any)?.groupName || "Chat"}.`;
      break;
    }
    case "GROUP_REMOVED": {
      text = `deleted the group.`;
      break;
    }
    case "PARTICIPANT_REMOVED": {
      text = `removed you from the group.`;
      break;
    }
    case "PARTICIPANT_REMOVED_NOTICE": {
      text = `was removed from the group.`;
      break;
    }
    case "GROUP_DISJOIN": {
      text = `left the group.`;
      break;
    }
    case "NEW_POST": {
      text = `shared a new post.`;
      break;
    }
    case "NEW_STORY": {
      text = `added a new story.`;
      break;
    }
    case "SYSTEM": {
      text = item.meta?.message || `sent a system alert.`;
      break;
    }
    default: {
      text = `sent a notification.`;
      break;
    }
  }

  const handleRowClick = () => {
    markAsRead(item._id, item.isRead);

    if (!primaryUser && item.type !== "SYSTEM") return;

    let href = "";

    switch (item.type) {
      case "LIKE":
        if (item.entityModel === "Story") {
          href = `/profile/${primaryUser?._id}`;
        } else {
          href = `/explore?postId=${typeof item.entity === "string" ? item.entity : item.entity._id}`;
        }
        break;
      case "COMMENT":
        href = `/explore?postId=${typeof item.entity === "string" ? item.entity : (item.entity as any).post || item.entity._id}`;
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
        href = `/messages/${(item.entity as any).chat}`;
        break;
      case "NEW_POST":
        href = `/explore?postId=${(item.entity as any)._id}`;
        break;
      case "NEW_GROUP":
        href = `/messages/${(item.entity as any)._id}`;
        break;
    }

    if (href) {
      navigate(href);
    }
  };

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        "group flex items-center justify-between px-4 py-3 cursor-pointer transition-colors w-full",
        !item.isRead
          ? "bg-blue-500/5 hover:bg-blue-500/10"
          : "bg-black hover:bg-neutral-900/50",
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Link
          to={primaryUser ? `/profile/${primaryUser._id}` : "#"}
          className="shrink-0 relative"
          onClick={(e) => {
            e.stopPropagation();
            if (!primaryUser) e.preventDefault();
          }}
        >
          <img
            src={avatarUrl}
            className="w-11 h-11 rounded-full object-cover border border-neutral-800"
            alt={username}
          />
          {!item.isRead && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-[#0095F6] rounded-full border-2 border-black" />
          )}
        </Link>

        <div className="text-[13px] text-neutral-200 leading-[18px] pr-2 truncate whitespace-normal break-words line-clamp-2">
          {primaryUser ? (
            <Link
              to={`/profile/${primaryUser._id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-white hover:text-neutral-300 mr-1 transition-colors"
            >
              {username}
            </Link>
          ) : (
            <span className="font-semibold text-white mr-1">{username}</span>
          )}
          <span className="text-neutral-300">{text}</span>
          <span className="text-neutral-500 ml-1.5 text-[13px] whitespace-nowrap">
            {getTimeAgo(item.createdAt)}
          </span>
        </div>
      </div>
      <div className="flex items-center shrink-0 ml-3 gap-2">
        {rightSide && (
          <div onClick={(e) => e.stopPropagation()}>{rightSide}</div>
        )}

        <button
          onClick={handleDelete}
          className="p-1.5 text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
          title="Delete notification"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
