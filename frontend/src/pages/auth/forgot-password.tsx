import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { api } from "../../lib/axios.config";
import { Alert, type AlertType } from "../../components/message-popup/alert";

import type { IForgotPasswordStep1Dto, IForgotPasswordStep2Dto } from "./types";
import { useNavigate } from "react-router-dom";

import { Eye, EyeOff, Mail, KeyRound } from "lucide-react";

/** SAME RULES AS BACKEND ZOD */
const passwordRules = {
  upper: /[A-Z]/,
  lower: /[a-z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
  length: (v: string) => v?.length >= 8 && v?.length <= 128,
};

export const ForgotPassword = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [alert, setAlert] = useState(false);
  const [type, setType] = useState<AlertType>("info");
  const [message, setMessage] = useState("");

  const timeoutRef = useRef<number | null>(null);
  const navigate = useNavigate();

  const showAlert = (t: AlertType, msg: string) => {
    setType(t);
    setMessage(msg);
    setAlert(true);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = window.setTimeout(() => {
      setAlert(false);
    }, 2000);
  };

  const {
    register: registerStep1,
    handleSubmit: handleSubmitStep1,
    formState: { errors: errors1, isSubmitting: loading1 },
  } = useForm<IForgotPasswordStep1Dto>();

  const {
    register: registerStep2,
    handleSubmit: handleSubmitStep2,
    watch,
    formState: { errors: errors2, isSubmitting: loading2 },
  } = useForm<IForgotPasswordStep2Dto>();

  const newPassword = watch("newPassword");
  const confirmPassword = watch("confirmPassword");

  const checks = {
    upper: passwordRules.upper.test(newPassword || ""),
    lower: passwordRules.lower.test(newPassword || ""),
    number: passwordRules.number.test(newPassword || ""),
    special: passwordRules.special.test(newPassword || ""),
    length: passwordRules.length(newPassword || ""),
  };

  const score = Object.values(checks).filter(Boolean).length;

  const strength = {
    0: { width: "0%", color: "bg-neutral-700" },
    1: { width: "20%", color: "bg-red-500" },
    2: { width: "40%", color: "bg-orange-500" },
    3: { width: "60%", color: "bg-yellow-500" },
    4: { width: "80%", color: "bg-lime-500" },
    5: { width: "100%", color: "bg-green-500" },
  }[score];

  const onSendEmail = async (data: IForgotPasswordStep1Dto) => {
    try {
      await api.post("/auth/forgot-password", data);

      setEmail(data.email);
      showAlert("success", "Code sent to your email");

      setTimeout(() => setStep(2), 200);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showAlert(
          "error",
          err.response?.data?.message || "Failed to send code",
        );
      }
    }
  };

  const onResetPassword = async (data: IForgotPasswordStep2Dto) => {
    if (score < 5) {
      showAlert("error", "Password is too weak");
      return;
    }

    if (data.newPassword !== data.confirmPassword) {
      showAlert("error", "Passwords do not match");
      return;
    }

    try {
      await api.post("/auth/reset-password", {
        email,
        code: data.code,
        newPassword: data.newPassword,
      });

      showAlert("success", "Password updated successfully");

      setTimeout(() => navigate("/"), 700);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        showAlert("error", err.response?.data?.message || "Reset failed");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-4">
      {alert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[360px]">
          <Alert type={type} message={message} />
        </div>
      )}

      <div className="w-full max-w-sm flex flex-col gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-xl">
          <h1 className="text-3xl mb-6 text-center font-[Grand_Hotel]">
            Bardiner-Social
          </h1>

          {/* STEP 1 */}
          {step === 1 && (
            <form
              onSubmit={handleSubmitStep1(onSendEmail)}
              className="flex flex-col gap-3"
            >
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                <input
                  placeholder="Enter your email"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-neutral-500"
                  {...registerStep1("email", {
                    required: "Email is required",
                  })}
                />
              </div>

              {errors1.email && (
                <p className="text-xs text-red-400">{errors1.email.message}</p>
              )}

              <button
                type="submit"
                disabled={loading1}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading1 ? "Sending..." : "Send code"}
              </button>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form
              onSubmit={handleSubmitStep2(onResetPassword)}
              className="flex flex-col gap-3"
            >
              {/* PASSWORD */}
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-10 py-2 text-sm outline-none focus:border-neutral-500"
                  {...registerStep2("newPassword", {
                    required: "New password is required",
                    validate: () => score === 5 || "Password must be strong",
                  })}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* STRENGTH BAR */}
              <div className="h-1 bg-neutral-700 rounded overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength?.color}`}
                  style={{ width: strength?.width }}
                />
              </div>

              <div className="text-[11px] flex justify-between text-neutral-400">
                <span>
                  {score <= 1 && "Weak"}
                  {score === 2 && "Fair"}
                  {score === 3 && "Good"}
                  {score === 4 && "Strong"}
                  {score === 5 && "Perfect"}
                </span>
                <span>{score}/5</span>
              </div>

              {/* CODE */}
              <input
                placeholder="Verification code"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-500"
                {...registerStep2("code", {
                  required: "Code is required",
                })}
              />

              {errors2.code && (
                <p className="text-xs text-red-400">{errors2.code.message}</p>
              )}

              {/* CONFIRM PASSWORD */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pr-10 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                  {...registerStep2("confirmPassword", {
                    required: "Confirm password is required",
                    validate: (value) =>
                      value === newPassword || "Passwords do not match",
                  })}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-400">Passwords do not match</p>
              )}

              <button
                type="submit"
                disabled={loading2}
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
              >
                {loading2 ? "Updating..." : "Reset password"}
              </button>
            </form>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center text-sm">
          <span className="text-neutral-400">
            Already remember your password?
          </span>{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-blue-400 hover:underline cursor-pointer font-medium"
          >
            Log in
          </span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
