import { useState } from "react";
import { api } from "../../lib/axios.config";
import { useAuthStore } from "../../store/auth.store";
import { cn } from "../../lib/utils";
import {
  User,
  ShieldCheck,
  Bell,
  Lock,
  Eye,
  MessageSquare,
  KeyRound,
  Smartphone,
  Loader2,
} from "lucide-react";

// --- REUSABLE UI COMPONENTS ---

const Toggle = ({ isOn, onToggle, disabled }: any) => (
  <button
    onClick={onToggle}
    disabled={disabled}
    type="button"
    className={cn(
      "w-11 h-6 rounded-full transition-colors duration-300 relative flex-shrink-0",
      isOn ? "bg-blue-500" : "bg-neutral-700",
      disabled && "opacity-50 cursor-not-allowed",
    )}
  >
    <div
      className={cn(
        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm",
        isOn && "translate-x-5",
      )}
    />
  </button>
);

const SettingRow = ({ icon: Icon, title, description, children }: any) => (
  <div className="flex items-center justify-between py-5">
    <div className="flex gap-4 pr-4">
      <div className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-xl h-fit shrink-0">
        <Icon size={20} className="text-neutral-400" />
      </div>
      <div className="flex flex-col justify-center">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-neutral-500 mt-1 max-w-[280px] leading-relaxed">
          {description}
        </p>
      </div>
    </div>
    {children}
  </div>
);

const InputField = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
}: any) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-white">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-500 transition-colors"
    />
  </div>
);

// --- MAIN SETTINGS COMPONENT ---

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Profile State
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");

  // Security State
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false); // Should come from user.settings

  const tabs = [
    { id: "profile", label: "Edit Profile", icon: User },
    { id: "security", label: "Security & Password", icon: ShieldCheck },
    { id: "privacy", label: "Privacy & Notifications", icon: Bell },
  ];

  // API Handlers
  const handleUpdateProfile = async () => {
    if (!username.trim()) return;
    setLoadingAction("profile");
    try {
      const { data } = await api.put("/users/profile", { username, bio });
      setUser({
        ...user!,
        username: data.payload.username,
        bio: data.payload.bio,
      });
    } catch (error) {
      console.error("Profile update failed", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwords.new !== passwords.confirm) return; // Add proper UI validation later
    setLoadingAction("password");
    try {
      await api.post("/auth/change-password", {
        currentPassword: passwords.current,
        newPassword: passwords.new,
      });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (error) {
      console.error("Password change failed", error);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleTogglePrivacy = async (type: string, endpoint: string) => {
    setLoadingAction(type);
    try {
      await api.patch(endpoint);
      // Update local state accordingly
    } catch (error) {
      console.error(`Toggle ${type} failed`, error);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="max-w-[935px] mx-auto w-full pt-6 pb-12 px-4 md:px-0 animate-in fade-in duration-500">
      <div className="bg-black md:border border-neutral-900 md:rounded-sm flex flex-col md:flex-row min-h-[600px] overflow-hidden">
        {/* LEFT SIDEBAR (TABS) */}
        <div className="w-full md:w-[280px] border-b md:border-b-0 md:border-r border-neutral-900 bg-black flex-shrink-0">
          <h1 className="text-xl font-bold p-6 hidden md:block text-white">
            Settings
          </h1>
          <div className="flex md:flex-col overflow-x-auto no-scrollbar md:pb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-4 transition-all whitespace-nowrap md:border-l-2",
                    isActive
                      ? "md:border-white md:bg-neutral-900/50 text-white font-semibold border-b-2 md:border-b-0 border-white"
                      : "md:border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/30 border-b-2 md:border-b-0 border-transparent",
                  )}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 p-4 md:p-8 md:max-w-2xl">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-6 p-4 bg-neutral-900/40 border border-neutral-800 rounded-2xl">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-800 shrink-0">
                  <img
                    src={user?.avatar || "/default.png"}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-white">
                    {user?.username}
                  </h2>
                  <p className="text-sm text-neutral-400">{user?.email}</p>
                </div>
                <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold rounded-lg transition-colors">
                  Change Photo
                </button>
              </div>

              <div className="space-y-6">
                <InputField
                  label="Username"
                  value={username}
                  onChange={(e: any) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-white">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write something about yourself..."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-neutral-500 transition-colors resize-none h-28 custom-scrollbar"
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={loadingAction === "profile" || !username.trim()}
                    className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {loadingAction === "profile" && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Change Password Section */}
              <div>
                <h2 className="text-xl font-bold mb-6 text-white">
                  Change Password
                </h2>
                <div className="space-y-5">
                  <InputField
                    label="Current Password"
                    type="password"
                    value={passwords.current}
                    onChange={(e: any) =>
                      setPasswords({ ...passwords, current: e.target.value })
                    }
                    placeholder="Enter current password"
                  />
                  <InputField
                    label="New Password"
                    type="password"
                    value={passwords.new}
                    onChange={(e: any) =>
                      setPasswords({ ...passwords, new: e.target.value })
                    }
                    placeholder="Enter new password"
                  />
                  <InputField
                    label="Confirm New Password"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e: any) =>
                      setPasswords({ ...passwords, confirm: e.target.value })
                    }
                    placeholder="Confirm new password"
                  />
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleUpdatePassword}
                      disabled={loadingAction === "password" || !passwords.new}
                      className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loadingAction === "password" && (
                        <Loader2 size={16} className="animate-spin" />
                      )}
                      Update Password
                    </button>
                  </div>
                </div>
              </div>

              <div className="h-px bg-neutral-900 w-full my-8" />

              {/* 2FA Section */}
              <div>
                <h2 className="text-xl font-bold mb-2 text-white">
                  Two-Factor Authentication
                </h2>
                <p className="text-sm text-neutral-400 mb-6">
                  Protect your account by requiring a code when logging in from
                  a new device.
                </p>

                <div className="p-5 border border-neutral-800 rounded-2xl flex items-center justify-between bg-neutral-900/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                      <Smartphone size={24} className="text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">
                        Authenticator App
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Use an app like Google Authenticator
                      </p>
                    </div>
                  </div>
                  <button
                    className={cn(
                      "px-5 py-2 font-semibold rounded-lg transition-colors text-sm",
                      is2FAEnabled
                        ? "bg-neutral-800 text-white hover:bg-neutral-700"
                        : "bg-blue-500 text-white hover:bg-blue-600",
                    )}
                    onClick={() => setIs2FAEnabled(!is2FAEnabled)}
                  >
                    {is2FAEnabled ? "Manage" : "Set Up"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY & NOTIFICATIONS TAB */}
          {activeTab === "privacy" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <h2 className="text-xl font-bold mb-6 text-white">
                  Account Privacy
                </h2>
                <div className="divide-y divide-neutral-900 border border-neutral-900 rounded-2xl px-6 bg-neutral-900/20">
                  <SettingRow
                    icon={Lock}
                    title="Private Account"
                    description="When your account is public, your profile and posts can be seen by anyone."
                  >
                    <Toggle
                      isOn={user?.settings?.isPrivate}
                      onToggle={() =>
                        handleTogglePrivacy(
                          "privacy",
                          "/settings/privacy/profile-visibility",
                        )
                      }
                      disabled={loadingAction === "privacy"}
                    />
                  </SettingRow>

                  <SettingRow
                    icon={Eye}
                    title="Show Activity Status"
                    description="Allow accounts you follow to see when you were last active or are currently typing."
                  >
                    <Toggle
                      isOn={user?.settings?.showTyping}
                      onToggle={() =>
                        handleTogglePrivacy(
                          "typing",
                          "/settings/privacy/show-typing",
                        )
                      }
                      disabled={loadingAction === "typing"}
                    />
                  </SettingRow>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold mb-6 text-white">
                  Push Notifications
                </h2>
                <div className="divide-y divide-neutral-900 border border-neutral-900 rounded-2xl px-6 bg-neutral-900/20">
                  <SettingRow
                    icon={MessageSquare}
                    title="Direct Messages"
                    description="Receive notifications for new messages and requests."
                  >
                    <Toggle isOn={true} onToggle={() => {}} />
                  </SettingRow>

                  <SettingRow
                    icon={User}
                    title="New Followers"
                    description="Get notified when someone starts following you."
                  >
                    <Toggle isOn={true} onToggle={() => {}} />
                  </SettingRow>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
