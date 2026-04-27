import { UserPlus, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSuggestionStore } from "../../store/suggestion.store";
import { useAuthStore } from "../../store/auth.store";
import { api } from "../../lib/axios.config";

export default function RightPanel() {
  const { suggestions, loading, fetchSuggestions, removeSuggestion } =
    useSuggestionStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchSuggestions();
    }
  }, [user]);

  const handleFollow = async (e: React.MouseEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();

    removeSuggestion(targetId);

    try {
      await api.post(`/friends/follow/${targetId}`);
    } catch (error) {
      console.error("Failed to follow from suggestions", error);
    }
  };

  return (
    <div className="hidden lg:flex w-80 flex-col gap-6 sticky top-0 h-screen pt-4 pr-4">
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-200">
            Suggested for you
          </h3>
          <span
            className="text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer transition"
            onClick={() => fetchSuggestions()}
          >
            Refresh
          </span>
        </div>

        <div className="flex flex-col gap-2 min-h-[150px]">
          {loading ? (
            <div className="flex items-center justify-center h-full w-full py-6">
              <Loader2 className="animate-spin text-neutral-500 w-6 h-6" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-xs text-neutral-500 text-center py-6">
              No new suggestions.
            </div>
          ) : (
            suggestions.map((suggestedUser) => (
              <div
                key={suggestedUser._id}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-800/60 transition group"
              >
                <Link
                  to={`/profile/${suggestedUser._id}`}
                  className="flex items-center gap-3 min-w-0"
                >
                  <img
                    src={suggestedUser.avatar || "/default-avatar.png"}
                    alt={suggestedUser.username}
                    className="w-10 h-10 rounded-full object-cover border border-neutral-700 shrink-0 bg-neutral-800"
                  />
                  <div className="min-w-0 flex flex-col">
                    <span className="text-[13px] font-semibold text-white truncate">
                      {suggestedUser.username}
                    </span>
                    <span className="text-[11px] text-neutral-500 truncate">
                      {suggestedUser.mutualCount > 0
                        ? `${suggestedUser.mutualCount} mutual connections`
                        : "Suggested for you"}
                    </span>
                  </div>
                </Link>

                <button
                  onClick={(e) => handleFollow(e, suggestedUser._id)}
                  className="flex items-center gap-1 text-xs text-blue-400 font-semibold hover:text-white transition shrink-0 bg-blue-500/10 hover:bg-blue-500 rounded-lg px-3 py-1.5 opacity-100 lg:opacity-0 group-hover:opacity-100"
                >
                  <UserPlus size={14} strokeWidth={2.5} />
                  Follow
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="text-xs text-neutral-500 px-2 leading-relaxed">
        <div className="hover:text-neutral-400 transition cursor-pointer">
          © 2026 Bardiner Social
        </div>
        <div className="mt-1">Built for performance & simplicity</div>
      </div>
    </div>
  );
}
