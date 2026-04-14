import { Bell, Search } from "lucide-react";
import { useState } from "react";

export default function Header() {
  return (
    <div className="sticky top-0 z-20 backdrop-blur-xl bg-neutral-950/70 border-b border-neutral-800/60">
      <div className="flex items-center justify-between px-4 md:px-8 py-3">
        {/* TITLE */}
        <h2 className="font-semibold text-lg tracking-tight">Feed</h2>

        {/* RIGHT ACTIONS */}
        <div className="flex items-center gap-3">
          {/* NOTIFICATION BUTTON */}
          <button className="relative bg-neutral-800 hover:bg-neutral-700 px-3 py-2 rounded-xl transition">
            <Bell size={18} />

            {/* badge */}
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
        </div>
      </div>
    </div>
  );
}
