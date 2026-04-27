import { useEffect } from "react";
import { useSocketStore } from "../store/socket.store";
import { useNotificationStore } from "../store/notification.store";
import type { INotification, IRequest } from "../types/notification";

export const useNotificationSocket = () => {
  const { socket } = useSocketStore();
  const addRealtimeNotification = useNotificationStore(
    (state) => state.addRealtimeNotification,
  );
  const addRealtimeRequest = useNotificationStore(
    (state) => state.addRealtimeRequest,
  );

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: INotification) => {
      addRealtimeNotification(notification);
    };

    const handleNewRequest = (request: IRequest) => {
      addRealtimeRequest(request);
    };

    socket.on("receive_notification", handleNewNotification);
    socket.on("receive_request", handleNewRequest);

    return () => {
      socket.off("receive_notification", handleNewNotification);
      socket.off("receive_request", handleNewRequest);
    };
  }, [socket, addRealtimeNotification, addRealtimeRequest]);
};
