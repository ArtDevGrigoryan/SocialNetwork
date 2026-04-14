import { useForm } from "react-hook-form";
import { useState } from "react";
import type { ILoginDto } from "./types";
import { api } from "../../lib/axios.config";
import type { ILoginResponse, IResponse } from "../../types/api.types";
import { useNavigate } from "react-router-dom";

import { Eye, EyeOff, Mail, KeyRound } from "lucide-react";

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ILoginDto>();

  const onSubmit = async (body: ILoginDto) => {
    const { data } = await api.post<IResponse<ILoginResponse>>(
      "/auth/login",
      body,
    );

    localStorage.setItem("accessToken", data.payload.accessToken);
    localStorage.setItem("refreshToken", data.payload.refreshToken);

    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white px-4">
      <div className="w-full max-w-sm flex flex-col gap-4">
        {/* CARD */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
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
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                {...register("email", {
                  required: "Email is required",
                })}
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
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg pl-9 pr-10 py-2 text-sm outline-none focus:border-neutral-500"
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
              <p className="text-xs text-red-400">{errors.password.message}</p>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 rounded-lg transition disabled:opacity-50"
            >
              {isSubmitting ? "Logging in..." : "Log in"}
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
            className="text-xs text-neutral-400 hover:text-white cursor-pointer text-center"
          >
            Forgot password?
          </p>
        </div>

        {/* SIGNUP */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-center text-sm">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            className="text-blue-400 hover:underline cursor-pointer"
          >
            Sign up
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
