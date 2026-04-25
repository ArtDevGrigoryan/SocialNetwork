import { useEffect } from "react";
import { useSocketStore } from "../store/socket.store";
import { useChatStore } from "../store/chat.store";
import type {
  IMessage,
  ISocketRemoveReactionPayload,
  ISocketDeletedMsgPayload,
  ISocketEditedMsgPayload,
} from "../pages/message/types";

export const useChatSocket = (chatId?: string) => {
  const { socket, joinChat, leaveChat } = useSocketStore();

  const {
    addMessage,
    removeMessage,
    updateMessage,
    addReaction,
    removeReaction,
    updateChatLocal,
  } = useChatStore();

  useEffect(() => {
    if (!socket || !chatId) return;

    joinChat(chatId);

    const onReceiveMessage = (message: IMessage) => {
      if (message.chat === chatId || message.chatId === chatId) {
        addMessage(message);
        if (updateChatLocal) {
          updateChatLocal(chatId, {
            lastMessage: message,
            lastActivityAt: new Date().toISOString(),
          });
        }
      }
    };

    const onMessageDeleted = (payload: ISocketDeletedMsgPayload) => {
      removeMessage(payload.messageId);
    };

    const onMessageEdited = (payload: ISocketEditedMsgPayload) => {
      updateMessage(payload.messageId, payload.text);
    };

    const onReactionAdded = (payload: any) => {
      addReaction(payload.messageId, payload.reaction);
    };

    const onReactionRemoved = (payload: ISocketRemoveReactionPayload) => {
      removeReaction(payload.messageId, payload.participantId);
    };

    socket.on("receive_message", onReceiveMessage);
    socket.on("message:deleted", onMessageDeleted);
    socket.on("message:edited", onMessageEdited);
    socket.on("message:reaction", onReactionAdded);
    socket.on("message:remove_reaction", onReactionRemoved);

    return () => {
      leaveChat(chatId);
      socket.off("receive_message", onReceiveMessage);
      socket.off("message:deleted", onMessageDeleted);
      socket.off("message:edited", onMessageEdited);
      socket.off("message:reaction", onReactionAdded);
      socket.off("message:remove_reaction", onReactionRemoved);
    };
  }, [
    socket,
    chatId,
    addMessage,
    removeMessage,
    updateMessage,
    addReaction,
    removeReaction,
    updateChatLocal,
  ]);
};
