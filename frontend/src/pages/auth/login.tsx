import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  KeyRound,
  ShieldCheck,
  Loader2,
  Key,
} from "lucide-react";
import axios from "axios";

import type { ILoginDto } from "./types";
import { api } from "../../lib/axios.config";
import type { ILoginResponse, IResponse } from "../../types/api.types";
import { useAuthStore } from "../../store/auth.store";

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  // --- 2FA State ---
  const [step, setStep] = useState<"login" | "2fa">("login");
  const [twoFaUserId, setTwoFaUserId] = useState<string | null>(null);
  const [twoFaToken, setTwoFaToken] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [loading2FA, setLoading2FA] = useState(false);
  const [error2FA, setError2FA] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<ILoginDto>();

  const onSubmit = async (body: ILoginDto) => {
    try {
      const { data } = await api.post<IResponse<ILoginResponse>>(
        "/auth/login",
        body,
      );

      if (data.payload.twoFactorCredintals) {
        // Եթե 2FA ակտիվ է, պահում ենք ID-ն ու անցնում հաջորդ քայլին
        setTwoFaUserId(data.payload.userId as string);
        setStep("2fa");
      } else {
        // Եթե 2FA չկա, միանգամից մտնում ենք համակարգ
        setAuth(
          data.payload.user!,
          data.payload.accessToken!,
          data.payload.refreshToken!,
        );
        navigate("/");
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setFormError("root", {
          message: err.response?.data?.message || "Invalid email or password",
        });
      }
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFaToken.trim()) return;

    setLoading2FA(true);
    setError2FA("");

    try {
      const payload = useBackupCode
        ? { userId: twoFaUserId, backupCode: twoFaToken }
        : { userId: twoFaUserId, token: twoFaToken };

      const { data } = await api.post<IResponse<ILoginResponse>>(
        "/auth/2fa/login",
        payload,
      );

      setAuth(
        data.payload.user!,
        data.payload.accessToken!,
        data.payload.refreshToken!,
      );
      navigate("/");
    } catch (err: any) {
      setError2FA(
        err.response?.data?.message || "Invalid code. Please try again.",
      );
    } finally {
      setLoading2FA(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-4">
      <div className="w-full max-w-sm flex flex-col gap-4 relative overflow-hidden">
        {/* LOGIN STEP */}
        {step === "login" && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 animate-in fade-in duration-300 shadow-xl">
            <h1
              className="text-4xl mb-6 text-center"
              style={{ fontFamily: "Grand Hotel, cursive" }}
            >
              Bardiner-Social
            </h1>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex flex-col gap-3"
            >
              {/* EMAIL */}
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                <input
                  placeholder="Email"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 px-3 py-2 text-sm outline-none focus:border-neutral-500 transition-colors"
                  {...register("email", { required: "Email is required" })}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}

              {/* PASSWORD */}
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-10 py-2 text-sm outline-none focus:border-neutral-500 transition-colors"
                  {...register("password", {
                    required: "Password is required",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400">
                  {errors.password.message}
                </p>
              )}

              {errors.root && (
                <p className="text-xs text-red-400 text-center">
                  {errors.root.message}
                </p>
              )}

              {/* BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 bg-[#0095f6] hover:bg-[#1877f2] active:scale-[0.98] text-white font-semibold py-2 rounded-lg transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={20} className="animate-spin mx-auto" />
                ) : (
                  "Log in"
                )}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="flex items-center gap-3 my-5 text-neutral-500 text-xs">
              <div className="flex-1 h-px bg-neutral-700" />
              OR
              <div className="flex-1 h-px bg-neutral-700" />
            </div>

            <p
              onClick={() => navigate("/forgot-password")}
              className="text-xs text-[#0095f6] hover:text-white cursor-pointer text-center transition-colors"
            >
              Forgot password?
            </p>
          </div>
        )}

        {/* 2FA VERIFICATION STEP */}
        {step === "2fa" && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 animate-in slide-in-from-right-8 duration-300 shadow-xl">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full border-2 border-neutral-800 flex items-center justify-center mb-4">
                <ShieldCheck
                  size={32}
                  className="text-white"
                  strokeWidth={1.5}
                />
              </div>
              <h2 className="text-xl font-bold mb-2">
                Two-Factor Authentication
              </h2>
              <p className="text-xs text-neutral-400">
                {useBackupCode
                  ? "Enter one of your 8-character backup codes to continue."
                  : "Enter the 6-digit code from your authentication app."}
              </p>
            </div>

            <form onSubmit={handle2FASubmit} className="flex flex-col gap-4">
              <input
                type="text"
                value={twoFaToken}
                onChange={(e) => {
                  if (useBackupCode) {
                    setTwoFaToken(e.target.value.slice(0, 8)); // Backup code: usually 8 chars
                  } else {
                    setTwoFaToken(
                      e.target.value.replace(/\D/g, "").slice(0, 6),
                    ); // Authenticator: 6 numbers
                  }
                }}
                placeholder={useBackupCode ? "Backup Code" : "000000"}
                className={`w-full text-center font-mono bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors ${
                  useBackupCode
                    ? "text-lg tracking-widest"
                    : "text-2xl tracking-[0.4em]"
                }`}
              />

              {error2FA && (
                <p className="text-xs text-red-400 text-center">{error2FA}</p>
              )}

              <button
                type="submit"
                disabled={
                  loading2FA ||
                  (!useBackupCode && twoFaToken.length < 6) ||
                  (useBackupCode && twoFaToken.length < 8)
                }
                className="w-full bg-[#0095f6] hover:bg-[#1877f2] active:scale-[0.98] text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 flex justify-center items-center"
              >
                {loading2FA ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  "Confirm"
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-neutral-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setTwoFaToken("");
                  setError2FA("");
                }}
                className="text-xs text-[#0095f6] font-semibold hover:text-white transition-colors"
              >
                {useBackupCode
                  ? "Use Authenticator App instead"
                  : "Try another way (Backup codes)"}
              </button>
            </div>

            <button
              onClick={() => setStep("login")}
              className="absolute top-4 left-4 text-neutral-500 hover:text-white transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {/* SIGNUP LINK - Only show in login step */}
        {step === "login" && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center text-sm">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="text-[#0095f6] font-semibold hover:underline cursor-pointer transition-colors"
            >
              Sign up
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
