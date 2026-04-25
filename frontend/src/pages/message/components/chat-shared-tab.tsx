import type { SharedTabProps } from "../types";

export default function ChatSharedTab({ shared }: SharedTabProps) {
  if (shared.length === 0) {
    return (
      <p className="text-neutral-500 col-span-3 text-center mt-10 text-sm">
        No shared posts
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5">
      {shared.map((item, i) =>
        item.sharedPost?.images?.[0] ? (
          <div
            key={item._id || i}
            className="aspect-square bg-neutral-900 overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity"
          >
            <img
              src={item.sharedPost.images[0]}
              className="w-full h-full object-cover"
              alt="Shared post preview"
            />
          </div>
        ) : null,
      )}
    </div>
  );
}
