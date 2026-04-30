import { useCallback, useRef, useState } from "react";

export function useLongPress(
  onLongPress: () => void,
  onClick: () => void,
  { shouldPreventDefault = true, delay = 500 } = {},
) {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const target = useRef<EventTarget | null>(null);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (shouldPreventDefault && event.target) {
        event.target.addEventListener("touchend", preventDefault, {
          passive: false,
        });
        target.current = event.target;
      }
      setLongPressTriggered(false);
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        onLongPress();
        setLongPressTriggered(true);
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault],
  );

  const clear = useCallback(
    (_: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
      if (timeout.current) clearTimeout(timeout.current);
      shouldTriggerClick && !longPressTriggered && onClick();
      setLongPressTriggered(false);
      if (shouldPreventDefault && target.current) {
        target.current.removeEventListener("touchend", preventDefault);
      }
    },
    [onClick, longPressTriggered, shouldPreventDefault],
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
  };
}

const preventDefault = (event: Event) => {
  if (!("touches" in event)) return;
  if ((event as TouchEvent).touches.length < 2 && event.preventDefault) {
    event.preventDefault();
  }
};
