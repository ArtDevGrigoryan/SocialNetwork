import { useCallback, useRef } from "react";

export const useLongPress = (
  onLongPress: (e: React.MouseEvent | React.TouchEvent) => void,
  onClick: (e: React.MouseEvent | React.TouchEvent) => void,
  { shouldPreventDefault = true, delay = 500 } = {},
) => {
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const target = useRef<EventTarget>(null);
  const longPressTriggered = useRef(false);

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (shouldPreventDefault && event.target) {
        event.target.addEventListener(
          "touchend",
          preventDefault as EventListener,
          { passive: false },
        );
        target.current = event.target;
      }
      longPressTriggered.current = false;
      timeout.current = setTimeout(() => {
        longPressTriggered.current = true;
        onLongPress(event);
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault],
  );

  const clear = useCallback(
    (event: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
      timeout.current && clearTimeout(timeout.current);
      if (shouldTriggerClick && !longPressTriggered.current) {
        onClick(event);
      }
      longPressTriggered.current = false;
      if (shouldPreventDefault && target.current) {
        target.current.removeEventListener(
          "touchend",
          preventDefault as EventListener,
        );
      }
    },
    [shouldPreventDefault, onClick],
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
  };
};

const preventDefault = (e: Event) => {
  if (e.cancelable) {
    e.preventDefault();
  }
};
