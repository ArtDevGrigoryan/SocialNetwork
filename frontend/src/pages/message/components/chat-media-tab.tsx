import type { MediaTabProps } from "../types";

export default function ChatMediaTab({ media, onOpenMedia }: MediaTabProps) {
  if (media.length === 0) {
    return (
      <p className="text-neutral-500 col-span-3 text-center mt-10 text-sm">
        No shared media
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {media.map((item, i) => (
        <div
          key={item._id || i}
          onClick={() => onOpenMedia(i)}
          className="aspect-square bg-neutral-900 overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity"
        >
          {item.type === "VIDEO" ? (
            <video
              src={item.url}
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <img
              src={item.url}
              className="w-full h-full object-cover"
              alt="Shared media"
            />
          )}
        </div>
      ))}
    </div>
  );
}
