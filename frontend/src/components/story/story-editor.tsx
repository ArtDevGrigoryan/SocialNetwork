import { useState } from "react";
import { X, MapPin, Loader2, Link as LinkIcon, AtSign } from "lucide-react";
import EmojiPicker, { Theme } from "emoji-picker-react";
import { useStoryStore } from "../../store/story.store";
import { TEXT_COLORS, FILTERS, FONTS } from "./constants";
import type { EditorProps } from "../../types/story.types";
import { useEffect } from "react";
import { api } from "../../lib/axios.config";

export const StoryTextEditor = ({ onClose }: EditorProps) => {
  const store = useStoryStore();
  const editingText = store.editingTextId
    ? store.texts.find((t) => t.id === store.editingTextId)
    : null;

  const [inputText, setInputText] = useState(editingText?.content || "");
  const [textColor, setTextColor] = useState(
    editingText?.color || TEXT_COLORS[0],
  );
  const [fontFamily, setFontFamily] = useState(
    editingText?.fontFamily || FONTS[0],
  );

  const handleSaveText = () => {
    if (inputText.trim()) {
      if (editingText) {
        store.updateText(editingText.id, {
          content: inputText,
          color: textColor,
          fontFamily,
        });
      } else {
        store.addText({
          content: inputText,
          color: textColor,
          fontFamily,
          x: 0,
          y: 0,
          scale: 1,
          rotation: 0,
        });
      }
    } else if (editingText) {
      store.removeText(editingText.id);
    }
    store.setEditingTextId(null);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-200 touch-none">
      <button
        onClick={() => {
          store.setEditingTextId(null);
          onClose();
        }}
        className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 text-white p-2.5 bg-black/40 rounded-full"
      >
        <X size={24} />
      </button>
      <button
        onClick={handleSaveText}
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
            className={`px-4 py-2 rounded-full border-2 shrink-0 text-white text-[15px] whitespace-nowrap transition-all ${fontFamily === font ? "border-white bg-white/20" : "border-transparent bg-black/60"}`}
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
            className={`w-10 h-10 rounded-full border-2 shrink-0 transition-transform ${textColor === c ? "border-white scale-125" : "border-transparent hover:scale-110"}`}
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

export const StoryLinkEditor = ({ onClose }: EditorProps) => {
  const store = useStoryStore();
  const [url, setUrl] = useState(store.linkSticker?.url || "");
  const [text, setText] = useState(store.linkSticker?.text || "");

  const handleSave = () => {
    if (url.trim()) {
      let formattedUrl = url;
      if (!/^https?:\/\//i.test(url)) formattedUrl = "https://" + url;
      store.setLinkSticker({
        url: formattedUrl,
        text: text.trim() || formattedUrl.replace(/^https?:\/\//i, ""),
        x: 0,
        y: -50,
        scale: 1,
        rotation: 0,
      });
    } else {
      store.setLinkSticker(null);
    }
    onClose();
  };

  return (
    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl pt-5 pb-[max(2rem,env(safe-area-inset-bottom))] px-6 shadow-2xl z-40 animate-in slide-in-from-bottom-full duration-300">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white font-bold text-lg">Add Link</h3>
        <button
          onClick={handleSave}
          className="text-[#0095F6] font-bold text-[15px]"
        >
          Done
        </button>
      </div>
      <div className="flex flex-col gap-4">
        <div className="relative">
          <LinkIcon
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL (e.g. youtube.com)"
            className="w-full bg-black border border-neutral-800 text-white rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-neutral-600 transition-colors text-[15px]"
            autoFocus
          />
        </div>
        <div className="relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Sticker text (optional)"
            className="w-full bg-black border border-neutral-800 text-white rounded-xl py-3.5 px-4 outline-none focus:border-neutral-600 transition-colors text-[15px]"
          />
        </div>
      </div>
      {store.linkSticker && (
        <button
          onClick={() => {
            store.setLinkSticker(null);
            onClose();
          }}
          className="w-full mt-4 py-3.5 bg-red-500/10 text-red-500 rounded-xl font-bold text-[15px] hover:bg-red-500/20 transition-colors"
        >
          Remove Link
        </button>
      )}
    </div>
  );
};

export const StoryAdjustEditor = ({
  onClose,
  isProcessing,
}: {
  onClose: () => void;
  isProcessing: boolean;
}) => {
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
          {isProcessing && <Loader2 size={16} className="animate-spin" />} Done
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
              className={`w-20 h-20 rounded-full overflow-hidden border-2 transition-all duration-200 ${store.selectedFilter === f.value ? "border-[#0095F6] scale-110" : "border-transparent group-hover:border-neutral-600"}`}
            >
              <img
                src={store.draftPreview || ""}
                alt={f.name}
                style={{ filter: f.value !== "none" ? f.value : undefined }}
                className="w-full h-full object-cover"
              />
            </div>
            <span
              className={`text-[12px] font-semibold transition-colors ${store.selectedFilter === f.value ? "text-white" : "text-neutral-500 group-hover:text-neutral-300"}`}
            >
              {f.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StoryMentionEditor = ({ onClose }: { onClose: () => void }) => {
  const store = useStoryStore();
  const [mentionInput, setMentionInput] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchUsers = async () => {
      if (mentionInput.trim().length < 1) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get(`/friends/search?search=${mentionInput}`);
        setResults(data.payload || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [mentionInput]);

  return (
    <div className="absolute inset-x-0 bottom-0 bg-neutral-900/95 backdrop-blur-xl rounded-t-3xl pt-5 pb-[max(2rem,env(safe-area-inset-bottom))] px-6 shadow-2xl z-[200] animate-in slide-in-from-bottom-full">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-white font-bold text-lg">Mention User</h3>
        <button onClick={onClose} className="text-neutral-400 p-1">
          <X size={20} />
        </button>
      </div>

      <div className="relative mb-4">
        <AtSign
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          value={mentionInput}
          onChange={(e) => setMentionInput(e.target.value)}
          placeholder="Search username..."
          className="w-full bg-black border border-neutral-800 text-white rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-neutral-600 transition-colors"
          autoFocus
        />
      </div>

      <div className="max-h-[200px] overflow-y-auto space-y-2 custom-scrollbar">
        {loading && (
          <div className="text-center py-2">
            <Loader2 className="animate-spin inline text-neutral-500" />
          </div>
        )}
        {results.map((u) => (
          <div
            key={u._id}
            onClick={() => {
              store.addMention(u._id, u.username);
              onClose();
            }}
            className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer transition"
          >
            <img
              src={u.avatar || "/default-avatar.png"}
              className="w-10 h-10 rounded-full object-cover"
              alt=""
            />
            <span className="text-white font-medium">@{u.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
