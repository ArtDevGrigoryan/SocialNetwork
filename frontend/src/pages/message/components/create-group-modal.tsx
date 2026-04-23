import { useState, useEffect } from "react";
import { X, Search, Loader2, Users, Check } from "lucide-react";
import { api } from "../../../lib/axios.config";
import { useNavigate } from "react-router-dom";
import type { IUser } from "../../../types/user.types";
import { useAuthStore } from "../../../store/auth.store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: Props) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchFollowings = async () => {
      try {
        const { data } = await api.get(
          `/friends/followings/${user?._id}?limit=20`,
        );
        setResults(data.payload || []);
      } catch (err) {
        console.error(err);
      }
    };
    if (!query) fetchFollowings();
  }, [isOpen, query, user?._id]);

  useEffect(() => {
    if (!query) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/friends/search?search=${query}`);
        setResults(data.payload || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const toggleUser = (user: IUser) => {
    if (selectedUsers.find((u) => u._id === user._id)) {
      setSelectedUsers((prev) => prev.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleCreateGroup = async () => {
    if (selectedUsers.length < 1) return;
    setCreating(true);
    try {
      const { data } = await api.post("/chats/group", {
        userIds: selectedUsers.map((u) => u._id),
        groupName: groupName || "New Group",
      });
      navigate(`/messages/${data.payload._id}`);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-800 w-full max-w-md rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="w-8" />
          <h2 className="text-lg font-bold text-white">Նոր Խումբ</h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white transition rounded-full hover:bg-neutral-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-neutral-800">
          <input
            type="text"
            placeholder="Խմբի անունը (ոչ պարտադիր)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-neutral-500 mb-3"
          />
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Փնտրել մարդկանց..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-black border border-neutral-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm outline-none focus:border-neutral-500"
            />
          </div>
        </div>

        <div className="flex-1 max-h-[300px] overflow-y-auto custom-scrollbar p-2">
          {loading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="animate-spin text-neutral-500" />
            </div>
          ) : (
            results.map((u) => {
              const isSelected = selectedUsers.some(
                (selected) => selected._id === u._id,
              );
              return (
                <div
                  key={u._id}
                  onClick={() => toggleUser(u)}
                  className="flex items-center justify-between p-3 hover:bg-neutral-800/50 rounded-xl cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar || "/default-avatar.png"}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-800"
                    />
                    <p className="text-white text-[15px] font-medium">
                      {u.username}
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-blue-500 border-blue-500" : "border-neutral-600"}`}
                  >
                    {isSelected && (
                      <Check size={12} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-neutral-800">
          <button
            disabled={selectedUsers.length === 0 || creating}
            onClick={handleCreateGroup}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {creating ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              `Ստեղծել խումբ (${selectedUsers.length})`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
