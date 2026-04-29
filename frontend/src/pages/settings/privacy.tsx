import { useState, useEffect } from "react";
import { Loader2, Globe, EyeOff } from "lucide-react";
import { api } from "../../lib/axios.config";
import type { AlertType } from "../../components/message-popup/alert";
import { useOutletContext } from "react-router-dom";

export default function PrivacySettings() {
  const { showAlert } = useOutletContext<{
    showAlert: (type: AlertType, message: string) => void;
  }>();
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showTyping, setShowTyping] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.get("/settings");
        if (data.payload) {
          setIsPrivate(data.payload.privacy?.profileVisibility === "PRIVATE");
          setShowTyping(data.payload.privacy?.showTyping ?? true);
        }
      } catch (err) {
        console.error("Failed to fetch privacy settings", err);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const toggleVisibility = async () => {
    setLoadingType("visibility");
    try {
      const { data } = await api.patch("/settings/privacy/profile-visibility");
      setIsPrivate(data.payload.toLowerCase().includes("private"));
    } catch (err: any) {
      showAlert?.("error", err.response?.data?.message || "An error occurred.");
    } finally {
      setLoadingType(null);
    }
  };

  const toggleTyping = async () => {
    setLoadingType("typing");
    try {
      const { data } = await api.patch("/settings/privacy/show-typing");
      setShowTyping(data.payload.showTyping);
    } catch (err: any) {
      showAlert?.("error", err.response?.data?.message || "An error occurred.");
    } finally {
      setLoadingType(null);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-neutral-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in fade-in">
      <h2 className="text-2xl font-bold text-white hidden md:block">
        Privacy and Security
      </h2>

      <div className="space-y-4 md:space-y-6">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-sm flex items-center justify-between gap-6">
          <div className="flex gap-4">
            <div className="mt-1 shrink-0">
              {isPrivate ? (
                <EyeOff className="text-neutral-400 w-6 h-6" />
              ) : (
                <Globe className="text-[#0095f6] w-6 h-6" />
              )}
            </div>
            <div>
              <p className="font-semibold text-white text-base">
                Private Account
              </p>
              <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed max-w-[400px]">
                When your account is private, only people you approve can see
                your photos and videos.
              </p>
            </div>
          </div>
          <button
            disabled={loadingType === "visibility"}
            onClick={toggleVisibility}
            className={`w-12 h-7 flex items-center rounded-full px-1 transition-colors shrink-0 outline-none ${
              isPrivate ? "bg-[#0095f6]" : "bg-neutral-700"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${isPrivate ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 md:p-6 shadow-sm flex items-center justify-between gap-6">
          <div className="flex gap-4">
            <div className="mt-1.5 shrink-0">
              <div className="w-6 h-6 flex items-center justify-center space-x-0.5">
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-75" />
                <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce delay-150" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-white text-base">
                Show Activity Status
              </p>
              <p className="text-sm text-neutral-400 mt-1.5 leading-relaxed max-w-[400px]">
                Allow accounts you follow and anyone you message to see when you
                are active or typing.
              </p>
            </div>
          </div>
          <button
            disabled={loadingType === "typing"}
            onClick={toggleTyping}
            className={`w-12 h-7 flex items-center rounded-full px-1 transition-colors shrink-0 outline-none ${
              showTyping ? "bg-[#0095f6]" : "bg-neutral-700"
            }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${showTyping ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
