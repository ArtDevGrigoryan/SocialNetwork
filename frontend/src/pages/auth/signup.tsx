import { useState } from "react";
import { useForm } from "react-hook-form";
import type { SignupDto } from "./types";
import { useNavigate } from "react-router-dom";

import { Eye, EyeOff, Mail, User, KeyRound } from "lucide-react";
import axios from "axios";
import { api } from "../../lib/axios.config";
import type { ILoginResponse, IResponse } from "../../types/api.types";
import { Alert, type AlertType } from "../../components/message-popup/alert";
import { useAuthStore } from "../../store/auth.store";

const passwordRules = {
  upper: /[A-Z]/,
  lower: /[a-z]/,
  number: /[0-9]/,
  special: /[^A-Za-z0-9]/,
  length: (v: string) => v?.length >= 8 && v?.length <= 128,
};

export const Signup = () => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignupDto>();
  const [type, setType] = useState<AlertType>("info");
  const [message, setMessage] = useState<string>("");
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  const checks = {
    upper: passwordRules.upper.test(password || ""),
    lower: passwordRules.lower.test(password || ""),
    number: passwordRules.number.test(password || ""),
    special: passwordRules.special.test(password || ""),
    length: passwordRules.length(password || ""),
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

  const onSubmit = async (body: SignupDto) => {
    try {
      const { data } = await api.post<IResponse<ILoginResponse>>(
        "/auth/register",
        body,
      );
      await setAuth(
        data.payload.user,
        data.payload.accessToken,
        data.payload.refreshToken,
      );
      setMessage("");
      navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setMessage(err.response?.data.message || "Something went wrong");
        setType("error");
      } else {
        setMessage("Something went wrong");
        setType("error");
      }
      setTimeout(() => setMessage(""), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-4">
      <div className="w-full max-w-sm flex flex-col gap-4">
        {message.length ? <Alert type={type} message={message} /> : ""}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <h1 className="text-3xl mb-6 text-center font-[Grand_Hotel]">
            Bardiner-Social
          </h1>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                placeholder="Email"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email",
                  },
                })}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-400">{errors.email.message}</p>
            )}

            {/* USERNAME */}
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                placeholder="Username"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                {...register("name", {
                  required: "Username is required",
                })}
              />
            </div>
            {errors.name && (
              <p className="text-xs text-red-400">{errors.name.message}</p>
            )}

            {/* PASSWORD */}
            <div className="relative">
              <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />

              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-10 py-2 text-sm outline-none focus:border-neutral-500"
                {...register("password", {
                  required: "Password is required",
                  validate: () =>
                    score === 5 || "Password is not strong enough",
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
            <div className="h-1 w-full bg-neutral-700 rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strength?.color}`}
                style={{ width: strength?.width }}
              />
            </div>

            {/* STRENGTH TEXT */}
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

            {/* CHECKLIST */}
            <div className="text-[11px] grid grid-cols-2 gap-1 text-neutral-500">
              <p className={checks.length ? "text-green-400" : ""}>
                • 8-128 chars
              </p>
              <p className={checks.upper ? "text-green-400" : ""}>
                • Uppercase
              </p>
              <p className={checks.lower ? "text-green-400" : ""}>
                • Lowercase
              </p>
              <p className={checks.number ? "text-green-400" : ""}>• Number</p>
              <p className={checks.special ? "text-green-400" : ""}>
                • Special
              </p>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 pr-10 text-sm outline-none focus:border-neutral-500"
                {...register("confirmPassword", {
                  required: "Confirm your password",
                  validate: (value) =>
                    value === password || "Passwords do not match",
                })}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((p) => !p)}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-400">Passwords do not match</p>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isSubmitting || score !== 5}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
            >
              {isSubmitting ? "Creating account..." : "Sign up"}
            </button>
          </form>

          {/* FOOTER */}
          <div className="text-center text-sm text-neutral-400 mt-4">
            Already have an account?{" "}
            <span
              onClick={() => navigate("/login")}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              Log in
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
