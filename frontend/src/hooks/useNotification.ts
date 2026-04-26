import { useEffect } from "react";
import { useSocketStore } from "../store/socket.store";
import { useNotificationStore } from "../store/notification.store";
import { type INotification } from "../types/notification";

export const useNotificationSocket = () => {
  const { socket } = useSocketStore();
  const addNotification = useNotificationStore(
    (state) => state.addNotification,
  );

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: INotification) => {
      addNotification(notification);
    };

    socket.on("receive_notification", handleNewNotification);

    return () => {
      socket.off("receive_notification", handleNewNotification);
    };
  }, [socket, addNotification]);
};
