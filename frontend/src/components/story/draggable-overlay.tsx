import React, { useRef, useState, useEffect } from "react";
import { useStoryStore } from "../../store/story.store";

interface DraggableOverlayProps {
  item: { id: string; x: number; y: number; scale: number; rotation: number };
  onUpdate: (
    id: string,
    updates: Partial<DraggableOverlayProps["item"]>,
  ) => void;
  onRemove: (id: string) => void;
  onEdit?: (id: string) => void;
  children: React.ReactNode;
}

export const DraggableOverlay = ({
  item,
  onUpdate,
  onRemove,
  onEdit,
  children,
}: DraggableOverlayProps) => {
  const setIsDraggingItem = useStoryStore((s) => s.setIsDraggingItem);
  const [transform, setTransform] = useState({
    x: item.x,
    y: item.y,
    scale: item.scale || 1,
    rotation: item.rotation || 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [showGuides, setShowGuides] = useState({ v: false, h: false });

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastTap = useRef<number>(0);

  useEffect(() => {
    if (!isDragging)
      setTransform({
        x: item.x,
        y: item.y,
        scale: item.scale,
        rotation: item.rotation,
      });
  }, [item, isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const now = Date.now();
    if (now - lastTap.current < 250 && onEdit) {
      onEdit(item.id);
      return;
    }
    lastTap.current = now;

    if (pointers.current.size === 1) {
      setIsDragging(true);
      setIsDraggingItem(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    e.stopPropagation();

    const prevPointer = pointers.current.get(e.pointerId)!;
    const deltaX = e.clientX - prevPointer.x;
    const deltaY = e.clientY - prevPointer.y;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 1) {
      let newX = transform.x + deltaX;
      let newY = transform.y + deltaY;

      // Smart Snapping (Canva style)
      const snapThreshold = 15;
      const snappedX = Math.abs(newX) < snapThreshold ? 0 : newX;
      const snappedY = Math.abs(newY) < snapThreshold ? 0 : newY;

      setShowGuides({ v: snappedX === 0, h: snappedY === 0 });
      setTransform((prev) => ({ ...prev, x: snappedX, y: snappedY }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.releasePointerCapture(e.pointerId);
    pointers.current.delete(e.pointerId);

    if (pointers.current.size === 0) {
      setIsDragging(false);
      setIsDraggingItem(false);
      setShowGuides({ v: false, h: false });

      // Check if dropped near the bottom trash area
      const isTrashed = e.clientY > window.innerHeight - 150;
      if (isTrashed) onRemove(item.id);
      else onUpdate(item.id, transform);
    }
  };

  return (
    <>
      {showGuides.v && (
        <div className="absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-[#0095F6] z-40 transform -translate-x-1/2 pointer-events-none shadow-[0_0_10px_#0095F6]" />
      )}
      {showGuides.h && (
        <div className="absolute left-0 right-0 top-1/2 h-[1.5px] bg-[#0095F6] z-40 transform -translate-y-1/2 pointer-events-none shadow-[0_0_10px_#0095F6]" />
      )}

      <div
        className={`absolute origin-center cursor-grab active:cursor-grabbing touch-none z-50 will-change-transform flex items-center justify-center transition-shadow duration-200 ${isDragging ? "shadow-[0_0_0_3px_rgba(255,255,255,0.8),0_10px_30px_rgba(0,0,0,0.5)] rounded-2xl" : ""}`}
        style={{
          transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale}) rotate(${transform.rotation}deg)`,
          left: "50%",
          top: "50%",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {children}

        {isDragging && (
          <>
            <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
            <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
            <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
            <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white rounded-full shadow-md" />
          </>
        )}
      </div>
    </>
  );
};
