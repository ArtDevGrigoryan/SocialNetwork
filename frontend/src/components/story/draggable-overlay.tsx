import { useRef, useState } from "react";
import { X } from "lucide-react";
import type { DraggableOverlayProps } from "../../types/story.types";

export const DraggableOverlay = ({
  item,
  onUpdate,
  onRemove,
  children,
}: DraggableOverlayProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const itemPos = useRef({ x: item.x, y: item.y });

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest(".remove-btn")) return;

    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    itemPos.current = { x: item.x, y: item.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    onUpdate(item.id, { x: itemPos.current.x + dx, y: itemPos.current.y + dy });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleWheel = (e: React.WheelEvent) => {
    const newScale = Math.max(
      0.5,
      Math.min(3, item.scale + (e.deltaY > 0 ? -0.1 : 0.1)),
    );
    onUpdate(item.id, { scale: newScale });
  };

  return (
    <div
      className="absolute cursor-move touch-none select-none group z-20"
      style={{
        left: "50%",
        top: "50%",
        transform: `translate(calc(-50% + ${item.x}px), calc(-50% + ${item.y}px)) scale(${item.scale}) rotate(${item.rotation}deg)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}
    >
      {children}
      {onRemove && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(item.id);
          }}
          className="remove-btn absolute -top-4 -right-4 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg pointer-events-auto"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
