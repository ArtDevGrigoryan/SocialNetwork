import type { Dispatch, SetStateAction } from "react";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import type { MusicTrack } from "../../types/story.types";

interface MusicSidebarProps {
  showMusicSearch: boolean;
  setShowMusicSearch: Dispatch<SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  isSearchingMusic: boolean;
  musicResults: MusicTrack[];
  handleSelectMusic: (music: MusicTrack) => void;
}

export default function MusicSidebar({
  showMusicSearch,
  setShowMusicSearch,
  searchQuery,
  setSearchQuery,
  isSearchingMusic,
  musicResults,
  handleSelectMusic,
}: MusicSidebarProps) {
  return (
    <div
      className={`absolute inset-0 bg-[#262626] z-40 flex flex-col transition-transform duration-300 ${
        showMusicSearch ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-4 border-b border-neutral-800 flex items-center gap-3">
        <button
          onClick={() => setShowMusicSearch(false)}
          className="text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-white font-semibold">Search Music</span>
      </div>
      <div className="p-3 relative border-b border-neutral-800">
        <Search
          size={16}
          className="absolute left-6 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for tracks..."
          className="w-full bg-neutral-900 text-white text-sm rounded-lg py-2 pl-9 pr-4 outline-none border border-transparent focus:border-neutral-600"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {isSearchingMusic ? (
          <div className="flex justify-center p-6">
            <Loader2 size={24} className="text-neutral-500 animate-spin" />
          </div>
        ) : musicResults.length === 0 ? (
          <div className="text-center p-6 text-neutral-500 text-sm">
            No results
          </div>
        ) : (
          musicResults.map((music) => (
            <div
              key={music.id}
              onClick={() => handleSelectMusic(music)}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 cursor-pointer transition"
            >
              <img
                src={music.coverArt}
                className="w-11 h-11 rounded-md object-cover"
                alt="cover"
              />
              <div className="flex flex-col">
                <span className="text-white text-[13px] font-semibold">
                  {music.title}
                </span>
                <span className="text-neutral-400 text-[11px]">
                  {music.artist}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
