import { useCallback } from "react";

export const useNativePush = () => {
  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }, []);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!("Notification" in window) || Notification.permission !== "granted")
        return;

      if (document.visibilityState === "hidden") {
        const notification = new Notification(title, {
          icon: "/default.png",
          badge: "/default.png",
          ...options,
        });

        notification.onclick = function (event) {
          event.preventDefault();
          window.focus();
          notification.close();
        };
      }
    },
    [],
  );

  return { requestPermission, showNotification };
};
