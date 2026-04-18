import { useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import type { AlertType } from "../../components/message-popup/alert";

interface Props {
  showAlert: (type: AlertType, message: string) => void;
}

export default function ChangeUsername({ showAlert }: Props) {
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [loading, setLoading] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      const formData = new FormData();
      if (name !== user?.username) formData.append("name", name);
      if (bio !== user?.bio) formData.append("bio", bio);
      if (avatarFile) formData.append("avatar", avatarFile);

      const { data } = await api.patch("/auth/update-profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser({
        ...user,
        username: data.payload.username,
        bio: data.payload.bio,
        avatar: data.payload.avatar,
      } as any);

      showAlert("success", "Profile updated successfully.");
    } catch (error: any) {
      showAlert(
        "error",
        error.response?.data?.message || "Failed to update profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Ստուգում ենք, որ գոնե մի բան փոխված լինի
  const hasChanges =
    name !== user?.username || bio !== (user?.bio || "") || avatarFile !== null;

  return (
    <div className="max-w-lg space-y-8 animate-in fade-in">
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold text-white mb-2">Edit profile</h2>
      </div>

      <div className="bg-neutral-900 p-6 rounded-2xl flex items-center gap-4">
        <img
          src={avatarPreview || user?.avatar || "/default-avatar.png"}
          alt="Profile"
          className="w-16 h-16 rounded-full object-cover border border-neutral-700"
        />
        <div>
          <p className="font-semibold text-white text-lg">{user?.username}</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-500 text-sm font-semibold hover:text-white transition"
          >
            Change profile photo
          </button>
          <input
            type="file"
            ref={fileInputRef}
            hidden
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={handleFileChange}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-white font-semibold text-sm">
            Username / Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Help people discover your account by using the name you're known by.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-white font-semibold text-sm">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Write something about yourself..."
            className="w-full bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400 transition resize-none custom-scrollbar"
          />
        </div>

        <button
          disabled={loading || !hasChanges || name.trim() === ""}
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 px-6 font-semibold text-sm w-fit disabled:opacity-50 transition"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin mx-auto" />
          ) : (
            "Submit"
          )}
        </button>
      </form>
    </div>
  );
}
