import { useLongPress } from "../../hooks/use-long-press";
import { cn } from "../../lib/utils";

interface InteractiveAvatarProps {
  avatarUrl: string;
  username: string;
  onClick: () => void;
  onLongPress: () => void;
  className?: string;
  hasUnseenStory?: boolean;
}

export function InteractiveAvatar({
  avatarUrl,
  username,
  onClick,
  onLongPress,
  className,
  hasUnseenStory,
}: InteractiveAvatarProps) {
  const longPressHandlers = useLongPress(onLongPress, onClick);

  return (
    <div
      {...longPressHandlers}
      className={cn(
        "relative rounded-full cursor-pointer transition-transform hover:scale-[1.02] overflow-hidden",
        hasUnseenStory
          ? "p-[3px] bg-gradient-to-tr from-yellow-400 via-rose-500 to-fuchsia-600"
          : "border border-neutral-800",
        className,
      )}
    >
      <img
        src={avatarUrl || "/default-avatar.png"}
        alt={username}
        className={cn(
          "w-full h-full rounded-full object-cover bg-neutral-900 border-2 border-black",
          !hasUnseenStory && "border-none",
        )}
      />
    </div>
  );
}
