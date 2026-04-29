import { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ChevronLeft,
  Copy,
  CheckCircle2,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import type { AlertType } from "../../components/message-popup/alert";
import { useNavigate, useOutletContext } from "react-router-dom";

export default function TwoFactorAuth() {
  const { showAlert } = useOutletContext<{
    showAlert: (type: AlertType, message: string) => void;
  }>();
  const navigate = useNavigate();
  const { user, patchUser } = useAuthStore();

  const [step, setStep] = useState<"idle" | "setup" | "enabled">(
    user?.twoFactorEnabled ? "enabled" : "idle",
  );

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");

  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/2fa/setup");
      setQr(data.payload.qrCode);
      setSecret(data.payload.secret);
      setStep("setup");
    } catch (error: any) {
      showAlert(
        "error",
        error.response?.data?.message || "Failed to initiate 2FA setup.",
      );
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length < 6) return;

    setLoading(true);
    try {
      await api.post("/auth/2fa/verify", { token });
      showAlert("success", "Two-factor authentication successfully enabled.");

      const { data } = await api.post("/auth/2fa/backup-codes");
      setBackupCodes(data.payload || []);

      patchUser({ twoFactorEnabled: true });
      setStep("enabled");
      setToken("");
    } catch (error: any) {
      showAlert("error", error.response?.data?.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length < 6) return;

    setLoading(true);
    try {
      await api.post("/auth/2fa/disable", { token });
      showAlert("success", "Two-factor authentication disabled.");
      patchUser({ twoFactorEnabled: false });
      setStep("idle");
      setToken("");
      setBackupCodes([]);
      setShowDisableModal(false);
    } catch (error: any) {
      showAlert("error", error.response?.data?.message || "Invalid code.");
    } finally {
      setLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.post("/auth/2fa/backup-codes/regenerate");
      setBackupCodes(data.payload || []);
      showAlert("success", "New backup codes generated.");
    } catch (error: any) {
      showAlert(
        "error",
        error.response?.data?.message || "Failed to regenerate codes.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const copyCodes = () => {
    const codesText = backupCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
    showAlert("info", "Backup codes copied to clipboard.");
  };

  return (
    <div className="flex flex-col h-full bg-black text-white w-full mx-auto md:border-x md:border-neutral-900 min-h-[100dvh] md:min-h-[auto] relative animate-in fade-in duration-300">
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-black/90 backdrop-blur-md border-b border-neutral-900">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-white hover:opacity-70 transition-opacity"
          >
            <ChevronLeft size={28} strokeWidth={2} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">
            Two-Factor Authentication
          </h1>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto pb-10 custom-scrollbar">
        {step === "idle" && (
          <div className="flex flex-col h-full mt-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-24 h-24 rounded-full border border-neutral-800 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                <Shield size={48} className="text-white" strokeWidth={1} />
              </div>
              <h2 className="text-xl font-bold mb-2">Extra Security</h2>
              <p className="text-sm text-neutral-400 max-w-[280px] mx-auto leading-relaxed">
                Protect your account using an authentication app (e.g., Google
                Authenticator or Authy).
              </p>
            </div>
            <div className="mt-auto pt-10">
              <button
                onClick={startSetup}
                disabled={loading}
                className="w-full bg-[#0095f6] hover:bg-[#1877f2] active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-blue-500/20"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  "Get Started"
                )}
              </button>
            </div>
          </div>
        )}

        {step === "setup" && (
          <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl mb-6 shadow-sm">
              <p className="text-sm text-neutral-300 text-center mb-6 font-medium">
                1. Scan this QR code with your Authenticator app.
              </p>
              <div className="bg-white p-4 w-max mx-auto rounded-2xl mb-6 shadow-sm">
                <img
                  src={qr}
                  alt="QR Code"
                  className="w-[180px] h-[180px] object-contain"
                />
              </div>
              <p className="text-xs text-neutral-500 text-center mb-3 uppercase tracking-wider font-bold">
                Or enter key manually
              </p>
              <div className="bg-black border border-neutral-800 p-3.5 rounded-xl flex items-center justify-between">
                <code className="text-white font-mono text-sm tracking-widest">
                  {secret}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(secret);
                    showAlert("info", "Key copied to clipboard.");
                  }}
                  className="text-neutral-400 hover:text-white transition p-1"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            <form
              onSubmit={verifySetup}
              className="flex flex-col gap-4 mt-auto"
            >
              <p className="text-sm text-neutral-300 text-center font-medium mb-1">
                2. Enter the 6-digit code from the app.
              </p>
              <input
                type="text"
                value={token}
                onChange={(e) =>
                  setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="w-full text-center tracking-[0.5em] font-mono bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-4 text-white text-2xl placeholder-neutral-700 focus:outline-none focus:border-neutral-500 transition-colors"
              />
              <button
                type="submit"
                disabled={loading || token.length < 6}
                className="w-full bg-[#0095f6] hover:bg-[#1877f2] active:scale-[0.98] text-white font-semibold py-3.5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center mt-2"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  "Verify & Enable"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("idle");
                  setToken("");
                }}
                disabled={loading}
                className="w-full text-neutral-400 hover:text-white font-semibold py-3 text-sm transition"
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {step === "enabled" && !showDisableModal && (
          <div className="flex flex-col gap-6 mt-4 animate-in fade-in duration-300">
            <div className="flex items-center justify-between p-5 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <ShieldCheck
                    size={24}
                    className="text-green-500"
                    strokeWidth={1.5}
                  />
                </div>
                <div>
                  <p className="font-semibold text-white text-[15px]">
                    2FA is Enabled
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Your account is highly secure
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDisableModal(true)}
                className="px-5 py-2 bg-neutral-800 hover:bg-neutral-700 active:scale-95 rounded-xl text-white font-semibold text-sm transition-all"
              >
                Disable
              </button>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white text-[15px] mb-1">
                    Backup Codes
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed max-w-[240px]">
                    Use these to log in if you lose your phone. Each code can
                    only be used once.
                  </p>
                </div>
                {backupCodes.length > 0 && (
                  <button
                    onClick={copyCodes}
                    className="text-[#0095f6] hover:text-white transition flex items-center gap-1.5 text-sm font-semibold bg-blue-500/10 px-3 py-1.5 rounded-lg"
                  >
                    {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                )}
              </div>

              {backupCodes.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 mt-5">
                  {backupCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="bg-black border border-neutral-800 p-3 rounded-xl text-center font-mono text-sm tracking-[0.2em] text-neutral-200"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-black border border-neutral-800 p-6 rounded-xl text-center mt-5">
                  <AlertTriangle
                    size={24}
                    className="text-yellow-500 mx-auto mb-3"
                  />
                  <p className="text-sm text-neutral-300 font-medium mb-1">
                    Codes are hidden
                  </p>
                  <p className="text-xs text-neutral-500 mb-4">
                    Generate new codes if you lost the old ones.
                  </p>
                  <button
                    onClick={regenerateBackupCodes}
                    disabled={actionLoading}
                    className="text-[#0095f6] hover:text-white text-sm font-semibold flex items-center justify-center gap-2 mx-auto transition"
                  >
                    {actionLoading ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                    Get New Codes
                  </button>
                </div>
              )}

              {backupCodes.length > 0 && (
                <button
                  onClick={regenerateBackupCodes}
                  disabled={actionLoading}
                  className="mt-6 w-full text-[#0095f6] hover:text-[#1877f2] text-sm font-semibold flex items-center justify-center gap-2 transition"
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  Regenerate Codes
                </button>
              )}
            </div>
          </div>
        )}

        {showDisableModal && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 w-full max-w-sm flex flex-col items-center animate-in zoom-in-95 duration-200 shadow-2xl">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
                <Shield size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Disable 2FA?
              </h3>
              <p className="text-sm text-neutral-400 text-center mb-6 leading-relaxed">
                Your account will be much less secure. Enter your authenticator
                code to confirm.
              </p>

              <form
                onSubmit={disable2FA}
                className="w-full flex flex-col gap-3"
              >
                <input
                  type="text"
                  value={token}
                  onChange={(e) =>
                    setToken(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  className="w-full text-center tracking-[0.5em] font-mono bg-black border border-neutral-800 rounded-xl px-4 py-3.5 text-white text-xl placeholder-neutral-700 focus:outline-none focus:border-red-500/50 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading || token.length < 6}
                  className="w-full bg-[#ed4956] hover:bg-[#ed4956]/90 active:scale-[0.98] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50 transition-all flex items-center justify-center mt-2"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    "Turn Off"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDisableModal(false);
                    setToken("");
                  }}
                  disabled={loading}
                  className="w-full text-neutral-400 hover:text-white font-semibold py-2.5 text-sm transition mt-1"
                >
                  Cancel
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
