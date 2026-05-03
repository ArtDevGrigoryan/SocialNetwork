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
      Math.min(4, item.scale + (e.deltaY > 0 ? -0.1 : 0.1)),
    );
    onUpdate(item.id, { scale: newScale });
  };

  return (
    <div
      className={`absolute cursor-move select-none group z-20 touch-none ${isDragging ? "scale-105 opacity-90" : "transition-transform"}`}
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
          className="remove-btn absolute -top-5 -right-5 bg-black/80 backdrop-blur border border-neutral-700 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition shadow-xl pointer-events-auto hover:bg-red-500 hover:border-red-500"
        >
          <X size={16} strokeWidth={3} />
        </button>
      )}
    </div>
  );
};
