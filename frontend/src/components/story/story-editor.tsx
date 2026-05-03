import { useState } from "react";
import { X, MapPin, Loader2 } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useStoryStore } from "../../store/story.store";
import { TEXT_COLORS, FILTERS, FONTS } from "./constants";
import type { EditorProps } from "../../types/story.types";

export const StoryTextEditor = ({ onClose }: EditorProps) => {
  const store = useStoryStore();
  const [inputText, setInputText] = useState("");
  const [textColor, setTextColor] = useState(TEXT_COLORS[0]);
  const [fontFamily, setFontFamily] = useState(FONTS[0]);

  const handleAddText = () => {
    if (inputText.trim()) {
      store.addText({
        content: inputText,
        color: textColor,
        fontFamily: fontFamily,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
      });
    }
    onClose();
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
      <button
        onClick={onClose}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 text-white p-2.5 bg-black/40 rounded-full backdrop-blur-md"
      >
        <X size={24} />
      </button>
      <button
        onClick={handleAddText}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 text-black font-bold text-[15px] px-5 py-2 bg-white rounded-full hover:bg-neutral-200 transition-colors"
      >
        Done
      </button>

      <textarea
        autoFocus
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="bg-transparent text-center text-4xl md:text-5xl font-bold w-full outline-none resize-none overflow-hidden placeholder:text-white/30 drop-shadow-xl leading-tight"
        style={{ color: textColor, fontFamily: fontFamily }}
        placeholder="Type something..."
        rows={4}
      />

      <div className="absolute bottom-[120px] flex gap-3 overflow-x-auto max-w-full px-6 w-full justify-center custom-scrollbar pb-2">
        {FONTS.map((font, idx) => (
          <button
            key={idx}
            onClick={() => setFontFamily(font)}
            className={`px-4 py-2 rounded-full border-2 shrink-0 text-white text-[15px] whitespace-nowrap transition-all ${
              fontFamily === font
                ? "border-white bg-white/20"
                : "border-transparent bg-black/60"
            }`}
            style={{ fontFamily: font }}
          >
            Aa Font
          </button>
        ))}
      </div>

      <div className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] flex gap-4 overflow-x-auto max-w-full px-6 w-full justify-center custom-scrollbar pb-2">
        {TEXT_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setTextColor(c)}
            className={`w-10 h-10 rounded-full border-2 shrink-0 transition-transform ${
              textColor === c
                ? "border-white scale-125"
                : "border-transparent hover:scale-110"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
    </div>
  );
};

export const StoryLocationEditor = ({ onClose }: EditorProps) => {
  const store = useStoryStore();
  const [locationInput, setLocationInput] = useState("");

  const handleSetLocation = () => {
    if (locationInput.trim()) {
      store.setStoryLocation({
        name: locationInput,
        x: 0,
        y: -100,
        scale: 1,
        rotation: 0,
      });
    } else {
      store.setStoryLocation(null);
    }
    onClose();
  };

  return (
    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl pt-5 pb-[max(2rem,env(safe-area-inset-bottom))] px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-40 animate-in slide-in-from-bottom-full duration-300">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-white font-bold text-lg">Location</h3>
        <button
          onClick={handleSetLocation}
          className="text-[#0095F6] font-bold text-[15px]"
        >
          Done
        </button>
      </div>
      <div className="relative">
        <MapPin
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          placeholder="Search location..."
          className="w-full bg-black border border-neutral-800 text-white rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-neutral-600 transition-colors text-[15px]"
          autoFocus
        />
      </div>
      {store.storyLocation && (
        <button
          onClick={() => {
            store.setStoryLocation(null);
            onClose();
          }}
          className="w-full mt-4 py-3.5 bg-red-500/10 text-red-500 rounded-xl font-bold text-[15px] hover:bg-red-500/20 transition-colors"
        >
          Remove Location
        </button>
      )}
    </div>
  );
};

// Ավելացված է isProcessing աջակցությունը հենց այս կոմպոնենտում
export const StoryAdjustEditor = ({ onClose, isProcessing }: any) => {
  const store = useStoryStore();

  return (
    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl pt-5 pb-[max(2rem,env(safe-area-inset-bottom))] px-6 shadow-2xl z-40 animate-in slide-in-from-bottom-full duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-bold text-lg">Zoom & Crop</h3>
        <button
          onClick={onClose}
          disabled={isProcessing}
          className="text-[#0095F6] font-bold text-[15px] flex items-center gap-2 disabled:opacity-50"
        >
          {isProcessing && <Loader2 size={16} className="animate-spin" />}
          Done
        </button>
      </div>
      <input
        type="range"
        min="1"
        max="3"
        step="0.05"
        value={store.mediaTransform.scale}
        onChange={(e) =>
          store.setMediaTransform({
            ...store.mediaTransform,
            scale: parseFloat(e.target.value),
          })
        }
        className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#0095F6]"
      />
    </div>
  );
};

export const StoryStickersEditor = ({ onClose }: EditorProps) => {
  const store = useStoryStore();

  return (
    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl pt-5 pb-0 shadow-2xl z-40 h-[65%] flex flex-col overflow-hidden animate-in slide-in-from-bottom-full duration-300">
      <div className="flex justify-between items-center mb-3 px-6 shrink-0">
        <h3 className="text-white font-bold text-lg">Stickers</h3>
        <button
          onClick={onClose}
          className="p-1.5 bg-neutral-800 text-neutral-400 hover:text-white rounded-full transition"
        >
          <X size={20} />
        </button>
      </div>
      <div className="flex-1 w-full bg-transparent [&_.EmojiPickerReact]:!bg-transparent [&_.EmojiPickerReact]:!border-none [&_.EmojiPickerReact]:!w-full [&_.EmojiPickerReact]:!h-full">
        <EmojiPicker
          theme={Theme.DARK}
          onEmojiClick={(emojiData) => {
            store.addSticker(emojiData.emoji);
            onClose();
          }}
          searchPlaceHolder="Search emojis..."
          lazyLoadEmojis={true}
        />
      </div>
    </div>
  );
};

export const StoryFiltersEditor = ({ onClose }: EditorProps) => {
  const store = useStoryStore();

  return (
    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl pt-5 pb-[max(2rem,env(safe-area-inset-bottom))] px-2 shadow-2xl z-40 animate-in slide-in-from-bottom-full duration-300">
      <div className="flex justify-between items-center mb-5 px-4">
        <h3 className="text-white font-bold text-lg">Filters</h3>
        <button
          onClick={onClose}
          className="text-[#0095F6] font-bold text-[15px]"
        >
          Done
        </button>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-4 custom-scrollbar px-4 snap-x">
        {FILTERS.map((f) => (
          <div
            key={f.name}
            onClick={() => store.setSelectedFilter(f.value)}
            className="flex flex-col items-center gap-2 cursor-pointer snap-start group"
          >
            <div
              className={`w-20 h-20 rounded-full overflow-hidden border-2 transition-all duration-200 ${
                store.selectedFilter === f.value
                  ? "border-[#0095F6] scale-110"
                  : "border-transparent group-hover:border-neutral-600"
              }`}
            >
              <img
                src={store.draftPreview || ""}
                alt={f.name}
                style={{ filter: f.value !== "none" ? f.value : undefined }}
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className={`text-[12px] font-semibold transition-colors ${
                store.selectedFilter === f.value
                  ? "text-white"
                  : "text-neutral-500 group-hover:text-neutral-300"
              }`}
            >
              {f.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
