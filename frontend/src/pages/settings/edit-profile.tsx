import { useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import type { AlertType } from "../../components/message-popup/alert";

interface Props {
  showAlert: (type: AlertType, message: string) => void;
}

export default function EditProfile({ showAlert }: Props) {
  const { user, patchUser } = useAuthStore();

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

      if (data.payload) {
        patchUser({
          username: data.payload.username,
          bio: data.payload.bio,
          avatar: data.payload.avatar,
        });
      }

      showAlert("success", "Profile updated successfully.");
    } catch (err: any) {
      showAlert("error", err.response?.data?.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const hasChanges =
    name !== user?.username || bio !== (user?.bio || "") || avatarFile !== null;

  return (
    <div className="max-w-lg">
      <h2 className="text-2xl mb-8 text-white">Edit Profile</h2>

      <div className="flex items-center justify-between bg-neutral-900 rounded-xl p-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-[50px] h-[50px] rounded-full overflow-hidden bg-neutral-800 shrink-0">
            <img
              src={avatarPreview || user?.avatar || "/default-avatar.png"}
              className="w-full h-full object-cover"
              alt="avatar"
            />
          </div>
          <div>
            <p className="font-semibold text-white">{user?.username}</p>
            <p className="text-neutral-400 text-sm">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition"
        >
          Change Photo
        </button>
        <input
          type="file"
          ref={fileInputRef}
          hidden
          accept="image/png, image/jpeg, image/jpg, image/webp"
          onChange={handleFileChange}
        />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-white">Username</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-black border border-neutral-700 rounded text-sm text-white px-3 py-2.5 outline-none focus:border-neutral-500 transition"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Help people discover your account by using the name you're known by.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-white">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Write something about yourself..."
            className="w-full bg-black border border-neutral-700 rounded text-sm text-white px-3 py-2.5 outline-none focus:border-neutral-500 transition resize-none custom-scrollbar"
          />
        </div>

        <button
          disabled={loading || !hasChanges || name.trim() === ""}
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 px-6 font-semibold text-sm w-fit disabled:opacity-50 transition"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin mx-auto" />
          ) : (
            "Submit"
          )}
        </button>
      </form>
    </div>
  );
}
