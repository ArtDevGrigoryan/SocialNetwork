import { useState, useEffect } from "react";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import type { AlertType } from "../../components/message-popup/alert";
import { useOutletContext } from "react-router-dom";

export default function VerifyEmail() {
  const { showAlert } = useOutletContext<{
    showAlert: (type: AlertType, message: string) => void;
  }>();
  const { user } = useAuthStore();
  const [code, setCode] = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [step, setStep] = useState<"idle" | "verify">("idle");
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [fetchingConfig, setFetchingConfig] = useState(true);

  useEffect(() => {
    const fetchUserConfig = async () => {
      try {
        const { data } = await api.get("/users/config");
        setIsVerified(!!data.payload?.isVerified);
      } catch (err) {
        console.error("Failed to fetch user config", err);
        setIsVerified(false);
      } finally {
        setFetchingConfig(false);
      }
    };
    fetchUserConfig();
  }, []);

  const handleResend = async () => {
    if (!user?.email) return;
    setLoadingResend(true);
    try {
      await api.post("/auth/resend-verification", { email: user.email });
      showAlert?.("success", "Verification code sent to your email.");
      setStep("verify");
    } catch (err: any) {
      showAlert?.(
        "error",
        err.response?.data?.message || "Failed to send code.",
      );
    } finally {
      setLoadingResend(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoadingVerify(true);
    try {
      await api.post("/auth/verify-email", { code });
      showAlert?.("success", "Email verified successfully.");
      setIsVerified(true);
      setCode("");
      setStep("idle");
    } catch (err: any) {
      showAlert?.(
        "error",
        err.response?.data?.message || "Invalid verification code.",
      );
    } finally {
      setLoadingVerify(false);
    }
  };

  if (fetchingConfig) {
    return (
      <div className="max-w-2xl mx-auto flex justify-center py-20 animate-in fade-in">
        <Loader2 size={32} className="animate-spin text-neutral-500" />
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-bold text-white hidden md:block">
          Email Verification
        </h2>
        <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-neutral-900 border border-neutral-800 rounded-3xl text-center shadow-sm">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
            Email is Verified
          </h3>
          <p className="text-neutral-400 text-[15px] max-w-[300px] leading-relaxed">
            Your email address{" "}
            <span className="text-white font-medium">{user?.email}</span> is
            verified and secure.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-300">
      <div className="hidden md:block">
        <h2 className="text-2xl font-bold text-white mb-2">Verify Email</h2>
        <p className="text-sm text-neutral-400 leading-relaxed max-w-lg">
          Verify your email address to secure your account and recover it if you
          lose access.
        </p>
      </div>

      {step === "idle" ? (
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200 shadow-sm">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-5">
            <Mail size={28} className="text-neutral-300" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">
            Unverified Email
          </h3>
          <p className="text-[15px] text-neutral-400 mb-8 max-w-[320px] leading-relaxed">
            Click the button below to send a verification code to{" "}
            <strong className="text-neutral-200">{user?.email}</strong>.
          </p>
          <button
            onClick={handleResend}
            disabled={loadingResend}
            className="w-full sm:w-auto bg-[#0095f6] hover:bg-[#1877f2] active:scale-95 text-white font-semibold py-3.5 px-10 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingResend ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              "Send Verification Code"
            )}
          </button>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 p-8 rounded-3xl animate-in zoom-in-95 duration-200 shadow-sm max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-white mb-3">Enter Code</h3>
            <p className="text-[15px] text-neutral-400 leading-relaxed">
              We sent a verification code to{" "}
              <strong className="text-neutral-200">{user?.email}</strong>.
            </p>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col gap-5">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Verification code"
              className="w-full text-center tracking-[0.4em] font-mono bg-black border border-neutral-700 rounded-xl px-4 py-4 text-white text-lg placeholder-neutral-600 focus:outline-none focus:border-neutral-400 transition"
            />
            <button
              type="submit"
              disabled={loadingVerify || !code.trim()}
              className="w-full bg-[#0095f6] hover:bg-[#1877f2] active:scale-95 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loadingVerify ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                "Verify Email"
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep("idle")}
              disabled={loadingVerify}
              className="mt-3 text-sm font-semibold text-neutral-400 hover:text-white transition"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
