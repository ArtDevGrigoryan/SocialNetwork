import { useState, useRef, useEffect, type FormEvent } from "react";
import {
  Image as ImageIcon,
  Mic,
  X,
  Loader2,
  Heart,
  Trash2,
  Send,
  Edit3,
  Smile,
  Reply,
} from "lucide-react";
import { useSocketStore } from "../../../store/socket.store";
import { useParams } from "react-router-dom";
import type { MessageInputProps } from "../types";

const POPULAR_EMOJIS = [
  "😂",
  "❤️",
  "😍",
  "🤣",
  "😊",
  "🙏",
  "💕",
  "😭",
  "😘",
  "👍",
  "😅",
  "👏",
  "😁",
  "🔥",
  "💔",
  "💖",
  "💙",
  "😢",
  "🤔",
  "😆",
  "🙄",
  "💪",
  "😉",
  "☺️",
  "👌",
  "🤗",
  "💜",
  "😔",
  "😎",
  "😇",
  "🌹",
  "🤦",
  "🎉",
  "💞",
  "✌️",
  "✨",
  "🤷",
  "😱",
  "😌",
  "🌸",
  "🙌",
  "😋",
  "💯",
  "🤪",
  "😑",
  "🤢",
  "🤮",
  "🥳",
];

export default function MessageInput({
  onSendMessage,
  onEditMessage,
  editingMessage,
  replyingMessage,
  onCancelReply,
  onCancelEdit,
  sending,
}: MessageInputProps) {
  const { chatId } = useParams();
  const [text, setText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const { sendTyping, sendVoice, socket } = useSocketStore();

  useEffect(() => {
    if (!socket || !chatId) return;

    let joinTimer: ReturnType<typeof setTimeout>;

    const handleJoin = () => {
      joinTimer = setTimeout(() => {
        socket.emit("join_chat", { chatId });
      }, 300);
    };

    if (socket.connected) {
      handleJoin();
    }

    socket.on("connect", handleJoin);

    return () => {
      clearTimeout(joinTimer);

      socket.off("connect", handleJoin);
      socket.emit("leave_chat", { chatId });

      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [socket, chatId]);

  useEffect(() => {
    if (editingMessage?.text) {
      setText(editingMessage.text);
    } else {
      setText("");
    }
  }, [editingMessage]);

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && mediaFiles.length === 0) || sending) return;

    if (editingMessage && onEditMessage) {
      onEditMessage(text);
      setText("");
      setShowEmojiPicker(false);
      return;
    }

    const replyId =
      typeof replyingMessage === "string"
        ? replyingMessage
        : replyingMessage?._id;

    if (mediaFiles.length > 0) {
      onSendMessage(text, mediaFiles, "MEDIA", replyId);
      setMediaFiles([]);
    } else {
      onSendMessage(text, undefined, "TEXT", replyId);
    }
    setText("");
    setShowEmojiPicker(false);
    if (onCancelReply) onCancelReply();
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setMediaFiles((prev) => [...prev, ...newFiles].slice(0, 10));
      setShowEmojiPicker(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeMedia = (indexToRemove: number) => {
    setMediaFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleLike = () => {
    if (sending) return;
    onSendMessage("❤️");
  };

  const handleAddEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    if (inputRef.current) inputRef.current.focus();
  };

  const startRecording = async () => {
    try {
      sendVoice(chatId || "");
      setShowEmojiPicker(false);
      isCancelledRef.current = false;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      const ext = mimeType === "audio/mp4" ? "m4a" : "webm";
      const file = new File([audioBlob], `voice-message.${ext}`, {
        type: mimeType,
      });

      if (!isCancelledRef.current && audioChunksRef.current.length > 0) {
        const replyId =
          typeof replyingMessage === "string"
            ? replyingMessage
            : replyingMessage?._id;
        onSendMessage("", [file], "VOICE", replyId);
        if (onCancelReply) onCancelReply();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const file = new File([audioBlob], "voice-message.webm", {
          type: "audio/webm",
        });
        if (!isCancelledRef.current && audioChunksRef.current.length > 0) {
          const replyId =
            typeof replyingMessage === "string"
              ? replyingMessage
              : replyingMessage?._id;
          onSendMessage("", [file], "VOICE", replyId);
          if (onCancelReply) onCancelReply();
        }
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      if (socket && chatId)
        socket.emit("typing:start", { chatId, isRecording: true });

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Microphone access denied or failed", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);

      if (socket && chatId) socket.emit("typing:stop", { chatId });
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      isCancelledRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);

      if (socket && chatId) socket.emit("typing:stop", { chatId });
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="p-2 md:p-4 bg-black flex flex-col shrink-0 w-full mb-0 relative z-20 pb-[calc(env(safe-area-inset-bottom)+8px)] md:pb-4 border-t border-neutral-900 md:border-none">
      {editingMessage && (
        <div className="flex items-center justify-between bg-neutral-900 px-4 py-2 rounded-t-xl max-w-4xl mx-auto w-full border-b border-neutral-800 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 text-[#3797F0] text-sm font-medium">
            <Edit3 size={16} />
            <span>Editing message</span>
          </div>
          <button
            onClick={onCancelEdit}
            className="text-neutral-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {replyingMessage && !editingMessage && (
        <div className="flex items-center justify-between bg-neutral-900 px-4 py-3 rounded-t-xl max-w-4xl mx-auto w-full border-b border-neutral-800 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <Reply size={16} className="text-neutral-400 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-white text-xs font-semibold">
                Replying to{" "}
                {typeof replyingMessage !== "string"
                  ? replyingMessage.sender?.username
                  : "message"}
              </span>
              <span className="text-neutral-400 text-xs truncate">
                {typeof replyingMessage !== "string"
                  ? replyingMessage.type === "TEXT"
                    ? replyingMessage.text
                    : `Sent a ${replyingMessage.type?.toLowerCase()}`
                  : "..."}
              </span>
            </div>
          </div>
          <button
            onClick={onCancelReply}
            className="text-neutral-400 hover:text-white transition shrink-0 ml-2 p-1"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex items-center max-w-4xl mx-auto w-full relative">
        {showEmojiPicker && (
          <div className="absolute bottom-full left-2 md:left-12 mb-3 bg-[#1a1a1a] border border-neutral-800 p-3 rounded-2xl shadow-2xl z-50 w-[280px] md:w-[320px] animate-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-2 pb-2 border-b border-neutral-800">
              <span className="text-sm font-medium text-neutral-400">
                Emojis
              </span>
              <button
                type="button"
                onClick={() => setShowEmojiPicker(false)}
                className="text-neutral-500 hover:text-white transition"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar p-1">
              {POPULAR_EMOJIS.map((emoji, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddEmoji(emoji)}
                  className="text-xl md:text-2xl hover:scale-125 hover:bg-neutral-800 rounded-lg p-1 transition-all active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {mediaFiles.length > 0 && (
          <div className="absolute bottom-full left-0 mb-3 bg-neutral-900 border border-neutral-800 p-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-2 w-full max-w-4xl mx-auto overflow-x-auto flex gap-3 custom-scrollbar">
            {mediaFiles.map((file, idx) => {
              const isVideo = file.type.startsWith("video/");
              const previewUrl = URL.createObjectURL(file);
              return (
                <div key={idx} className="relative shrink-0">
                  {isVideo ? (
                    <video
                      src={previewUrl}
                      className="h-24 w-auto rounded-xl object-cover bg-black"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      className="h-24 w-auto rounded-xl object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(idx)}
                    className="absolute -top-2 -right-2 bg-neutral-800 text-white rounded-full p-1 border border-neutral-700 hover:bg-neutral-700"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={`flex-1 flex items-center gap-1.5 md:gap-2 bg-[#262626] md:bg-neutral-900 border ${isRecording ? "border-red-500/50" : "border-transparent md:border-neutral-800"} ${editingMessage || replyingMessage ? "rounded-b-xl rounded-t-none" : "rounded-full"} pl-2 md:pl-4 pr-1.5 md:pr-3 py-1 md:py-1.5 transition-colors`}
        >
          {isRecording ? (
            <div className="flex-1 flex items-center justify-between pl-2">
              <div className="flex items-center gap-2 md:gap-3 text-red-500">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm font-medium tabular-nums">
                  {formatTime(recordingTime)}
                </span>
              </div>
              <div className="flex items-center gap-1 md:gap-2 pr-1">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="p-2 md:p-2.5 text-neutral-400 hover:text-white transition rounded-full hover:bg-neutral-800"
                >
                  <Trash2 size={20} />
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-8 h-8 md:w-9 md:h-9 text-white bg-[#3797F0] hover:bg-blue-600 transition rounded-full flex items-center justify-center"
                >
                  <Send size={16} className="ml-0.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 shrink-0 bg-[#3797F0] text-white rounded-full hidden md:flex items-center justify-center w-8 h-8 hover:bg-blue-600 transition"
              >
                <ImageIcon size={16} />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                hidden
                multiple
                accept="image/*,video/*"
                onChange={handleMediaChange}
              />

              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  sendTyping(chatId || "");
                }}
                placeholder="Message..."
                className="flex-1 min-w-0 bg-transparent border-none text-white focus:outline-none placeholder-neutral-500 text-[16px] px-2 md:px-2 py-1.5"
                autoComplete="off"
              />

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`p-1.5 md:p-2 shrink-0 transition-colors rounded-full ${showEmojiPicker ? "text-white bg-neutral-800" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}`}
              >
                <Smile size={22} strokeWidth={1.5} />
              </button>

              {!text.trim() && mediaFiles.length === 0 ? (
                <div className="flex items-center text-white shrink-0">
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-2 md:p-2.5 hover:opacity-70 transition active:scale-95"
                  >
                    <Mic size={24} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    className="p-2 md:p-2.5 hover:opacity-70 transition active:scale-95 md:hidden"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon size={24} strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={handleLike}
                    className="p-2 md:p-2.5 hover:opacity-70 transition active:scale-95 hidden md:block"
                  >
                    <Heart size={24} strokeWidth={1.5} />
                  </button>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={sending}
                  className="text-[#3797F0] font-semibold hover:text-white transition-colors text-[15px] shrink-0 disabled:opacity-50 px-3 py-1.5 active:scale-95"
                >
                  {sending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : editingMessage ? (
                    "Save"
                  ) : (
                    "Send"
                  )}
                </button>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
