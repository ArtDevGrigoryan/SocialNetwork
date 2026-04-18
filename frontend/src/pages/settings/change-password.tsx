import { useState } from "react";
import { Loader2 } from "lucide-react";
import { api } from "../../lib/axios.config";
import type { AlertType } from "../../components/message-popup/alert";

interface Props {
  showAlert: (type: AlertType, message: string) => void;
}

export default function ChangePassword({ showAlert }: Props) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return;

    setLoading(true);
    try {
      await api.post("/auth/change-password", { oldPassword, newPassword });
      showAlert("success", "Password changed successfully.");
      setOldPassword("");
      setNewPassword("");
    } catch (error: any) {
      showAlert(
        "error",
        error.response?.data?.message || "Password update failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-8 animate-in fade-in">
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold text-white mb-2">Change password</h2>
        <p className="text-sm text-neutral-400">
          Your password must be at least 8 characters and should include a
          combination of numbers, letters and special characters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            placeholder="Current password"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition"
          />
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition"
          />
        </div>

        <button
          disabled={loading || !oldPassword || !newPassword}
          type="submit"
          className="mt-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-3 px-6 font-semibold text-sm w-fit disabled:opacity-50 transition"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin mx-auto" />
          ) : (
            "Change password"
          )}
        </button>
      </form>

      <div className="pt-4">
        <button className="text-blue-500 hover:text-white font-semibold text-sm transition">
          Forgot password?
        </button>
      </div>
    </div>
  );
}
