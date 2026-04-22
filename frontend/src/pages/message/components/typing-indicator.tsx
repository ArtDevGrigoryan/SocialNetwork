import type { TypingIndicatorProps } from "../types";

export default function TypingIndicator({ state }: TypingIndicatorProps) {
  if (!state) return null;

  return (
    <div className="flex items-end gap-2 mb-4 animate-in fade-in duration-300 ml-2">
      <div className="w-8 h-8 rounded-full bg-neutral-800 shrink-0 border border-neutral-700" />
      <div className="bg-[#262626] border border-neutral-800 rounded-[22px] px-4 py-3 rounded-bl-[5px] w-fit flex items-center gap-1.5 h-[42px] shadow-sm">
        {state === "typing" ? (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" />
            <div
              className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[13px] text-neutral-400 font-medium">
              Recording...
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
