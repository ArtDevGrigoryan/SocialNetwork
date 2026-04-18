import { useState, useEffect } from "react";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import type { AlertType } from "../../components/message-popup/alert";

interface Props {
  showAlert: (type: AlertType, message: string) => void;
}

export default function VerifyEmail({ showAlert }: Props) {
  const { user } = useAuthStore();

  // States
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
      showAlert("success", "Verification code sent to your email.");
      setStep("verify");
    } catch (err: any) {
      showAlert("error", err.response?.data?.message || "Failed to send code.");
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
      showAlert("success", "Email verified successfully.");

      // Backend-ում հաստատվելուց հետո թարմացնում ենք local state-ը
      setIsVerified(true);
      setCode("");
      setStep("idle");
    } catch (err: any) {
      showAlert(
        "error",
        err.response?.data?.message || "Invalid verification code.",
      );
    } finally {
      setLoadingVerify(false);
    }
  };

  // Քանի դեռ backend-ից ստուգում է config-ը, ցույց ենք տալիս loader
  if (fetchingConfig) {
    return (
      <div className="max-w-lg space-y-8 animate-in fade-in flex justify-center py-20">
        <Loader2 size={32} className="animate-spin text-neutral-500" />
      </div>
    );
  }

  // Եթե backend-ի userConfig-ն ասում է, որ արդեն հաստատված է
  if (isVerified) {
    return (
      <div className="max-w-lg space-y-8 animate-in fade-in zoom-in-95 duration-300">
        <h2 className="text-2xl font-bold text-white hidden md:block">
          Email Verification
        </h2>
        <div className="flex flex-col items-center justify-center p-8 md:p-10 bg-neutral-900/30 border border-neutral-800 rounded-2xl text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Email is Verified
          </h3>
          <p className="text-neutral-400 text-sm max-w-[250px] leading-relaxed">
            Your email address{" "}
            <span className="text-white font-medium">{user?.email}</span> is
            verified and secure.
          </p>
        </div>
      </div>
    );
  }

  // Եթե դեռ հաստատված չէ՝ ցույց ենք տալիս ստանդարտ հաստատման flow-ն
  return (
    <div className="max-w-lg space-y-8 animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-white hidden md:block">
        Verify Email
      </h2>
      <p className="text-sm text-neutral-400 leading-relaxed">
        Verify your email address to secure your account and recover it if you
        lose access.
      </p>

      {step === "idle" ? (
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200 shadow-sm">
          <div className="w-14 h-14 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
            <Mail size={24} className="text-neutral-300" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            Unverified Email
          </h3>
          <p className="text-sm text-neutral-400 mb-6 max-w-sm">
            Click the button below to send a verification code to{" "}
            <strong className="text-neutral-200">{user?.email}</strong>.
          </p>
          <button
            onClick={handleResend}
            disabled={loadingResend}
            className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 px-8 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingResend ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Send Verification Code"
            )}
          </button>
        </div>
      ) : (
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl animate-in zoom-in-95 duration-200 shadow-sm">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-white mb-2">Enter Code</h3>
            <p className="text-sm text-neutral-400">
              We sent a verification code to{" "}
              <strong className="text-neutral-200">{user?.email}</strong>.
            </p>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Verification code"
              className="w-full text-center tracking-[0.3em] font-mono bg-black border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400 transition"
            />
            <button
              type="submit"
              disabled={loadingVerify || !code.trim()}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loadingVerify ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                "Verify Email"
              )}
            </button>
            <button
              type="button"
              onClick={() => setStep("idle")}
              disabled={loadingVerify}
              className="mt-2 text-sm font-semibold text-neutral-400 hover:text-white transition"
            >
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
