import { useState, useEffect } from "react";
import { X, Search, Loader2, Check } from "lucide-react";
import { api } from "../../../lib/axios.config";
import type { IUser } from "../../../types/user.types";
import { useUIStore } from "../../../store/ui.store";
import type { AddMemberModalProps } from "../types";

export default function AddMemberModal({
  isOpen,
  onClose,
  chatId,
  existingParticipants,
  onMemberAdded,
}: AddMemberModalProps) {
  const { addToast } = useUIStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchSuggestions = async () => {
      try {
        const { data } = await api.get(`/friends/suggestions?limit=20`);
        const filtered = (data.payload || []).filter(
          (u: IUser) => !existingParticipants.includes(u._id),
        );
        setResults(filtered);
      } catch (err) {
        console.error(err);
      }
    };
    if (!query) fetchSuggestions();
  }, [isOpen, query, existingParticipants]);

  useEffect(() => {
    if (!query) return;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/friends/search?search=${query}`);
        const filtered = (data.payload || []).filter(
          (u: IUser) => !existingParticipants.includes(u._id),
        );
        setResults(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, existingParticipants]);

  const toggleUser = (user: IUser) => {
    if (selectedUsers.find((u) => u._id === user._id)) {
      setSelectedUsers((prev) => prev.filter((u) => u._id !== user._id));
    } else {
      setSelectedUsers((prev) => [...prev, user]);
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    setAdding(true);
    try {
      const { data } = await api.post(`/chats/${chatId}/participant`, {
        userIds: selectedUsers.map((u) => u._id),
      });

      onMemberAdded(data.payload);
      addToast("Members added successfully");
      onClose();
    } catch (err) {
      console.error(err);
      addToast("Failed to add members");
    } finally {
      setAdding(false);
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
          <h2 className="text-lg font-bold text-white">Add People</h2>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white transition rounded-full hover:bg-neutral-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-neutral-800">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
              size={18}
            />
            <input
              type="text"
              placeholder="Search people..."
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
          ) : results.length === 0 ? (
            <div className="text-center text-neutral-500 py-6 text-sm">
              No users found
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
                      alt={u.username}
                    />
                    <p className="text-white text-[15px] font-medium">
                      {u.username}
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "bg-[#3797F0] border-[#3797F0]" : "border-neutral-600"}`}
                  >
                    {isSelected && (
                      <Check size={14} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-900">
          <button
            disabled={selectedUsers.length === 0 || adding}
            onClick={handleAddMembers}
            className="w-full bg-[#3797F0] hover:bg-blue-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {adding ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              `Add ${selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
