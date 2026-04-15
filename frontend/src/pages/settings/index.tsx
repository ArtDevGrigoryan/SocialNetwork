import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Mail, Shield, User } from "lucide-react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import { cn } from "../../lib/utils";

type TabId = "profile" | "password" | "twofa" | "email";

type Status = {
  type: "success" | "error";
  message: string;
} | null;

interface TwoFactorSetupResponse {
  qrCode: string;
  secret: string;
}

interface ApiResponse<T> {
  payload: T;
}

const tabs: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Edit Profile", icon: User },
  { id: "password", label: "Change Password", icon: Shield },
  { id: "twofa", label: "Two-Factor Authentication", icon: Shield },
  { id: "email", label: "Email Verification", icon: Mail },
];

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { data?: { message?: string } } }).response
      ?.data?.message === "string"
  ) {
    return (error as { response?: { data?: { message?: string } } }).response!
      .data!.message!;
  }
  return fallback;
};

export default function Settings() {
  const { user, patchUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [mobileTab, setMobileTab] = useState<TabId | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "/default.png");

  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    Boolean(user?.twoFactorEnabled),
  );
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorSetupResponse | null>(
    null,
  );
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [disableTwoFactorCode, setDisableTwoFactorCode] = useState("");

  const [emailVerified, setEmailVerified] = useState(Boolean(user?.emailVerified));
  const [emailCode, setEmailCode] = useState("");

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  if (!user) {
    return null;
  }

  const currentTab = mobileTab || activeTab;

  const onAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    patchUser({ avatar: previewUrl });
    setStatus({
      type: "success",
      message: "Avatar preview updated instantly.",
    });
  };

  const submitProfile = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    if (!username.trim()) {
      setStatus({ type: "error", message: "Username is required." });
      return;
    }

    setLoadingKey("profile");
    try {
      await api.patch("/auth/update-profile", { name: username.trim() });
      patchUser({ username: username.trim(), bio });
      setStatus({ type: "success", message: "Profile updated successfully." });
    } catch (error) {
      setStatus({
        type: "error",
        message: getErrorMessage(error, "Could not update profile."),
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    setPasswordError("");
    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }
    if (passwords.newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("Password confirmation does not match.");
      return;
    }

    setLoadingKey("password");
    try {
      await api.post("/auth/change-password", {
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setStatus({ type: "success", message: "Password changed successfully." });
    } catch (error) {
      setStatus({
        type: "error",
        message: getErrorMessage(error, "Could not change password."),
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const setupTwoFactor = async () => {
    setStatus(null);
    setLoadingKey("twofa-setup");
    try {
      const { data } = await api.post<ApiResponse<TwoFactorSetupResponse>>("/auth/2fa/setup");
      setTwoFactorData(data.payload);
      setStatus({
        type: "success",
        message: "Scan QR and enter 6-digit code to enable 2FA.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: getErrorMessage(error, "Could not setup 2FA."),
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const verifyTwoFactor = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    if (!/^\d{6}$/.test(twoFactorCode)) {
      setStatus({ type: "error", message: "Enter a valid 6-digit code." });
      return;
    }
    setLoadingKey("twofa-verify");
    try {
      await api.post("/auth/2fa/verify", { token: twoFactorCode });
      setTwoFactorEnabled(true);
      patchUser({ twoFactorEnabled: true });
      setTwoFactorData(null);
      setTwoFactorCode("");
      setStatus({ type: "success", message: "Two-factor authentication enabled." });
    } catch (error) {
      setStatus({
        type: "error",
        message: getErrorMessage(error, "Invalid 2FA code."),
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const disableTwoFactor = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    if (!/^\d{6}$/.test(disableTwoFactorCode)) {
      setStatus({ type: "error", message: "Enter a valid 6-digit code." });
      return;
    }
    setLoadingKey("twofa-disable");
    try {
      await api.post("/auth/2fa/disable", { token: disableTwoFactorCode });
      setTwoFactorEnabled(false);
      patchUser({ twoFactorEnabled: false });
      setDisableTwoFactorCode("");
      setStatus({ type: "success", message: "Two-factor authentication disabled." });
    } catch (error) {
      setStatus({
        type: "error",
        message: getErrorMessage(error, "Could not disable 2FA."),
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const sendVerificationCode = async () => {
    setStatus(null);
    setLoadingKey("email-send");
    try {
      await api.post("/auth/resend-verification", { email: user.email });
      setStatus({
        type: "success",
        message: "Verification code sent to your email.",
      });
    } catch (error) {
      setStatus({
        type: "error",
        message: getErrorMessage(error, "Could not send verification code."),
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const verifyEmail = async (event: FormEvent) => {
    event.preventDefault();
    setStatus(null);
    if (!emailCode.trim()) {
      setStatus({ type: "error", message: "Verification code is required." });
      return;
    }
    setLoadingKey("email-verify");
    try {
      await api.post("/auth/verify-email", { code: emailCode.trim() });
      setEmailVerified(true);
      patchUser({ emailVerified: true });
      setEmailCode("");
      setStatus({ type: "success", message: "Email verified successfully." });
    } catch (error) {
      setStatus({
        type: "error",
        message: getErrorMessage(error, "Invalid verification code."),
      });
    } finally {
      setLoadingKey(null);
    }
  };

  const renderTabContent = () => {
    if (currentTab === "profile") {
      return (
        <form onSubmit={submitProfile} className="space-y-6">
          <div className="flex items-center gap-4 border border-neutral-800 rounded-2xl p-4 bg-black">
            <img
              src={avatarPreview}
              alt="avatar"
              className="w-16 h-16 rounded-full object-cover border border-neutral-800"
            />
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold truncate">{user.username}</p>
              <p className="text-sm text-neutral-400 truncate">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-sm font-semibold"
            >
              Change photo
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className="hidden"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">Username</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neutral-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">Bio</label>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              maxLength={160}
              className="w-full h-28 rounded-xl border border-neutral-800 bg-black px-4 py-3 text-white resize-none focus:outline-none focus:ring-2 focus:ring-neutral-600"
            />
            <p className="text-xs text-neutral-400 text-right">{bio.length}/160</p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loadingKey === "profile"}
              className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold inline-flex items-center gap-2"
            >
              {loadingKey === "profile" && <Loader2 size={16} className="animate-spin" />}
              Save
            </button>
          </div>
        </form>
      );
    }

    if (currentTab === "password") {
      return (
        <form onSubmit={submitPassword} className="space-y-5">
          {[
            { key: "oldPassword", label: "Current Password" },
            { key: "newPassword", label: "New Password" },
            { key: "confirmPassword", label: "Confirm New Password" },
          ].map((field) => (
            <div key={field.key} className="space-y-2">
              <label className="text-sm font-semibold text-white">{field.label}</label>
              <input
                type="password"
                value={passwords[field.key as keyof typeof passwords]}
                onChange={(event) =>
                  setPasswords((prev) => ({
                    ...prev,
                    [field.key]: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neutral-600"
              />
            </div>
          ))}
          {passwordError ? <p className="text-sm text-red-400">{passwordError}</p> : null}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loadingKey === "password"}
              className="px-6 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-white font-semibold inline-flex items-center gap-2"
            >
              {loadingKey === "password" && <Loader2 size={16} className="animate-spin" />}
              Update password
            </button>
          </div>
        </form>
      );
    }

    if (currentTab === "twofa") {
      return (
        <div className="space-y-6">
          <div className="border border-neutral-800 rounded-2xl p-4 bg-black">
            <p className="text-white font-semibold mb-1">Two-Factor Authentication</p>
            <p className="text-sm text-neutral-400 mb-4">
              Protect your account with a 6-digit authenticator code.
            </p>
            <div className="flex items-center justify-between gap-4">
              <p className={cn("text-sm", twoFactorEnabled ? "text-emerald-400" : "text-neutral-400")}>
                {twoFactorEnabled ? "Active" : "Not active"}
              </p>
              {!twoFactorEnabled ? (
                <button
                  type="button"
                  onClick={setupTwoFactor}
                  disabled={loadingKey === "twofa-setup"}
                  className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-sm font-semibold text-white inline-flex items-center gap-2"
                >
                  {loadingKey === "twofa-setup" && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  Enable 2FA
                </button>
              ) : null}
            </div>
          </div>

          {twoFactorData && !twoFactorEnabled ? (
            <form onSubmit={verifyTwoFactor} className="border border-neutral-800 rounded-2xl p-4 bg-black space-y-4">
              <img
                src={twoFactorData.qrCode}
                alt="QR code"
                className="w-52 h-52 rounded-lg bg-white p-2"
              />
              <p className="text-xs text-neutral-400 break-all">
                Secret key: {twoFactorData.secret}
              </p>
              <input
                value={twoFactorCode}
                onChange={(event) => setTwoFactorCode(event.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neutral-600"
              />
              <button
                type="submit"
                disabled={loadingKey === "twofa-verify"}
                className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-sm font-semibold text-white inline-flex items-center gap-2"
              >
                {loadingKey === "twofa-verify" && <Loader2 size={14} className="animate-spin" />}
                Verify and activate
              </button>
            </form>
          ) : null}

          {twoFactorEnabled ? (
            <form onSubmit={disableTwoFactor} className="border border-neutral-800 rounded-2xl p-4 bg-black space-y-4">
              <p className="text-sm text-neutral-400">
                Enter authenticator code to disable 2FA.
              </p>
              <input
                value={disableTwoFactorCode}
                onChange={(event) => setDisableTwoFactorCode(event.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neutral-600"
              />
              <button
                type="submit"
                disabled={loadingKey === "twofa-disable"}
                className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-60 text-sm font-semibold text-white inline-flex items-center gap-2"
              >
                {loadingKey === "twofa-disable" && <Loader2 size={14} className="animate-spin" />}
                Disable 2FA
              </button>
            </form>
          ) : null}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="border border-neutral-800 rounded-2xl p-4 bg-black">
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={18}
              className={emailVerified ? "text-emerald-400" : "text-neutral-500"}
            />
            <p className="text-white font-semibold">
              {emailVerified ? "Email verified" : "Email unverified"}
            </p>
          </div>
          <p className="text-sm text-neutral-400 mt-2">{user.email}</p>
        </div>

        {!emailVerified ? (
          <>
            <button
              type="button"
              onClick={sendVerificationCode}
              disabled={loadingKey === "email-send"}
              className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-sm font-semibold text-white inline-flex items-center gap-2"
            >
              {loadingKey === "email-send" && <Loader2 size={14} className="animate-spin" />}
              Send verification code
            </button>

            <form onSubmit={verifyEmail} className="space-y-4">
              <input
                value={emailCode}
                onChange={(event) => setEmailCode(event.target.value)}
                placeholder="Enter verification code"
                className="w-full rounded-xl border border-neutral-800 bg-black px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-neutral-600"
              />
              <button
                type="submit"
                disabled={loadingKey === "email-verify"}
                className="px-5 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-60 text-sm font-semibold text-white inline-flex items-center gap-2"
              >
                {loadingKey === "email-verify" && (
                  <Loader2 size={14} className="animate-spin" />
                )}
                Verify email
              </button>
            </form>
          </>
        ) : null}
      </div>
    );
  };

  return (
    <div className="max-w-[935px] mx-auto w-full px-0 md:px-4 py-2 md:py-6">
      <div className="bg-black border border-neutral-800 rounded-none md:rounded-sm min-h-[640px] flex flex-col md:flex-row">
        <aside
          className={cn(
            "w-full md:w-[290px] border-b md:border-b-0 md:border-r border-neutral-800",
            mobileTab ? "hidden md:block" : "block",
          )}
        >
          <h1 className="hidden md:block px-6 py-6 text-xl font-semibold text-white">
            Settings
          </h1>
          <div className="flex flex-col">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMobileTab(tab.id);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-6 py-4 text-sm border-l-2 transition-colors",
                    isActive
                      ? "border-white bg-neutral-900/70 text-white font-semibold"
                      : "border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/40",
                  )}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </aside>

        <section className={cn("flex-1 p-4 md:p-8", mobileTab ? "block" : "hidden md:block")}>
          <div className="md:hidden mb-5">
            <button
              type="button"
              onClick={() => setMobileTab(null)}
              className="inline-flex items-center gap-2 text-white text-sm"
            >
              <ArrowLeft size={16} />
              Back to settings
            </button>
          </div>

          <h2 className="text-xl font-semibold text-white mb-6">
            {tabs.find((tab) => tab.id === currentTab)?.label}
          </h2>

          {status ? (
            <div
              className={cn(
                "mb-5 rounded-xl border px-4 py-3 text-sm",
                status.type === "success"
                  ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/10"
                  : "border-red-500/30 text-red-300 bg-red-500/10",
              )}
            >
              {status.message}
            </div>
          ) : null}

          {renderTabContent()}
        </section>
      </div>
    </div>
  );
}
