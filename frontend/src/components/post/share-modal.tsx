import { useState, useEffect } from "react";
import { Search, Check, Loader2, X } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import toast from "react-hot-toast";

interface ShareModalProps {
  entityId: string;
  type: "post" | "story" | "account";
  isOpen: boolean;
  onClose: () => void;
}

interface IChatFormatted {
  _id: string;
  displayTitle: string;
  displayAvatar: string;
  myParticipantId: string;
}

const typeMapping = {
  post: "SHARE_POST",
  story: "SHARE_STORY",
  account: "SHARE_PROFILE",
};

export default function ShareModal({
  entityId,
  type,
  isOpen,
  onClose,
}: ShareModalProps) {
  const { user } = useAuthStore();

  const [chats, setChats] = useState<IChatFormatted[]>([]);
  const [filteredChats, setFilteredChats] = useState<IChatFormatted[]>([]);
  const [selectedChats, setSelectedChats] = useState<IChatFormatted[]>([]);

  const [search, setSearch] = useState("");
  const [messageText, setMessageText] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchChats();
    } else {
      setSearch("");
      setMessageText("");
      setSelectedChats([]);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredChats(chats);
    } else {
      setFilteredChats(
        chats.filter((c) =>
          c.displayTitle.toLowerCase().includes(search.toLowerCase()),
        ),
      );
    }
  }, [search, chats]);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/chats?limit=50");
      const fetchedChats = res.data?.payload?.chats || res.data?.chats || [];
      const formatted = fetchedChats.map((chat: any) => {
        const me = chat.participants.find((p: any) => p.user._id === user?._id);
        const others = chat.participants.filter(
          (p: any) => p.user._id !== user?._id,
        );

        let displayTitle = chat.groupName || "Group";
        let displayAvatar = chat.groupAvatar || "/default-avatar.png";

        if (chat.type === "dm" && others.length > 0) {
          displayTitle = others[0].user.username;
          displayAvatar = others[0].user.avatar || "/default-avatar.png";
        }

        return {
          _id: chat._id,
          displayTitle,
          displayAvatar,
          myParticipantId: me?._id,
        };
      });

      setChats(formatted);
      setFilteredChats(formatted);
    } catch (error) {
      console.error("Failed to fetch chats", error);
      toast.error("Failed to load chats");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelect = (chat: IChatFormatted) => {
    setSelectedChats((prev) => {
      const isSelected = prev.find((c) => c._id === chat._id);
      if (isSelected) {
        return prev.filter((c) => c._id !== chat._id);
      } else {
        return [...prev, chat];
      }
    });
  };

  const handleShare = async () => {
    if (selectedChats.length === 0) return;

    setIsSending(true);
    const backendType = typeMapping[type];

    try {
      const sharePromises = selectedChats.map((chat) =>
        api.post(`/messages/${chat._id}/share`, {
          participantId: chat.myParticipantId,
          type: backendType,
          sharedId: entityId,
          text: messageText.trim() ? messageText : undefined,
        }),
      );

      await Promise.all(sharePromises);
      toast.success("Sent successfully");
      onClose();
    } catch (error) {
      console.error("Share error:", error);
      toast.error("An error occurred while sending");
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[#1a1a1a] w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="text-lg font-semibold text-white">Share</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-full transition text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-neutral-800">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search friends or groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-800 rounded-xl py-2.5 pl-10 pr-4 outline-none text-sm text-white focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[300px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center text-neutral-500 mt-10">
              No chats found
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isSelected = selectedChats.some((c) => c._id === chat._id);
              return (
                <div
                  key={chat._id}
                  onClick={() => toggleSelect(chat)}
                  className="flex items-center justify-between p-3 hover:bg-neutral-800 rounded-xl cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={chat.displayAvatar}
                      alt={chat.displayTitle}
                      className="w-12 h-12 rounded-full object-cover border border-neutral-700"
                    />
                    <span className="font-medium text-sm text-gray-200">
                      {chat.displayTitle}
                    </span>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-blue-500 border-blue-500"
                        : "border-neutral-600"
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {selectedChats.length > 0 && (
          <div className="p-4 border-t border-neutral-800 bg-neutral-900">
            <input
              type="text"
              placeholder="Add a message (optional)"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-neutral-800 rounded-xl py-2.5 px-4 outline-none text-sm text-white border border-neutral-700 focus:border-blue-500 mb-3"
            />
            <button
              onClick={handleShare}
              disabled={isSending}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-70 text-white font-semibold py-3 rounded-xl transition flex justify-center items-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                `Send (${selectedChats.length})`
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
