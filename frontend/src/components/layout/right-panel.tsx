import { UserPlus } from "lucide-react";

export default function RightPanel() {
  return (
    <div className="hidden lg:flex w-80 flex-col gap-6 sticky top-0 h-screen pt-4 pr-4">
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-4 backdrop-blur">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-neutral-200">
            Suggestions
          </h3>
          <span className="text-xs text-neutral-500 hover:text-neutral-300 cursor-pointer transition">
            See all
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {["user1", "user2", "user3"].map((user) => (
            <div
              key={user}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-800/60 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{user}</p>
                  <p className="text-xs text-neutral-500">Suggested</p>
                </div>
              </div>

              <button className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition shrink-0">
                <UserPlus size={14} />
                Follow
              </button>
            </div>
          ))}
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
