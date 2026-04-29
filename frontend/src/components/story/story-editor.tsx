import { useState } from "react";
import { X, MapPin } from "lucide-react";
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
    <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <button
        onClick={onClose}
        className="absolute top-4 left-4 text-white p-2"
      >
        <X size={24} />
      </button>
      <button
        onClick={handleAddText}
        className="absolute top-4 right-4 text-white font-bold p-2 bg-blue-500 px-4 py-1.5 rounded-full"
      >
        Done
      </button>
      <textarea
        autoFocus
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        className="bg-transparent text-center text-3xl font-bold w-full outline-none resize-none overflow-hidden placeholder:text-white/30"
        style={{ color: textColor, fontFamily: fontFamily }}
        placeholder="Type something..."
        rows={3}
      />
      <div className="absolute bottom-20 flex gap-2 overflow-x-auto max-w-full px-4 pb-2 w-full justify-center">
        {FONTS.map((font, idx) => (
          <button
            key={idx}
            onClick={() => setFontFamily(font)}
            className={`px-3 py-1.5 rounded-full border-2 shrink-0 text-white text-sm whitespace-nowrap ${
              fontFamily === font
                ? "border-white bg-white/20"
                : "border-transparent bg-black/50"
            }`}
            style={{ fontFamily: font }}
          >
            Aa Font
          </button>
        ))}
      </div>
      <div className="absolute bottom-6 flex gap-3 overflow-x-auto max-w-full px-4 pb-2">
        {TEXT_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setTextColor(c)}
            className={`w-8 h-8 rounded-full border-2 shrink-0 ${
              textColor === c ? "border-white scale-110" : "border-transparent"
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
    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl pt-2 pb-8 px-4 shadow-2xl z-40 animate-in slide-in-from-bottom-10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">Location</h3>
        <button
          onClick={handleSetLocation}
          className="text-blue-500 font-semibold text-sm"
        >
          Done
        </button>
      </div>
      <div className="relative">
        <MapPin
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
          placeholder="Search location..."
          className="w-full bg-neutral-800 text-white rounded-xl py-3 pl-10 pr-4 outline-none"
          autoFocus
        />
      </div>
      {store.storyLocation && (
        <button
          onClick={() => {
            store.setStoryLocation(null);
            onClose();
          }}
          className="w-full mt-4 py-3 bg-red-500/20 text-red-500 rounded-xl font-medium"
        >
          Remove Location
        </button>
      )}
    </div>
  );
};

export const StoryAdjustEditor = ({ onClose }: EditorProps) => {
  const store = useStoryStore();

  return (
    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl pt-4 pb-8 px-6 shadow-2xl z-40">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-semibold">Zoom Media</h3>
        <button
          onClick={onClose}
          className="text-blue-500 font-semibold text-sm"
        >
          Done
        </button>
      </div>
      <input
        type="range"
        min="0.5"
        max="3"
        step="0.05"
        value={store.mediaTransform.scale}
        onChange={(e) =>
          store.setMediaTransform({
            ...store.mediaTransform,
            scale: parseFloat(e.target.value),
          })
        }
        className="w-full"
      />
    </div>
  );
};

export const StoryStickersEditor = ({ onClose }: EditorProps) => {
  const store = useStoryStore();

  return (
    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl pt-4 pb-0 shadow-2xl z-40 h-[60%] flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-2 px-4 shrink-0">
        <h3 className="text-white font-semibold">Stickers</h3>
        <button
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-white transition"
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
    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl pt-4 pb-8 px-4 shadow-2xl z-40">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-white font-semibold">Filters</h3>
        <button
          onClick={onClose}
          className="text-blue-500 font-semibold text-sm"
        >
          Done
        </button>
      </div>
      <div className="flex overflow-x-auto gap-3 pb-2 custom-scrollbar px-2 snap-x">
        {FILTERS.map((f) => (
          <div
            key={f.name}
            onClick={() => store.setSelectedFilter(f.value)}
            className="flex flex-col items-center gap-2 cursor-pointer snap-start"
          >
            <div
              className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                store.selectedFilter === f.value
                  ? "border-blue-500 scale-105"
                  : "border-transparent"
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
              className={`text-[11px] font-medium ${
                store.selectedFilter === f.value
                  ? "text-white"
                  : "text-neutral-400"
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
