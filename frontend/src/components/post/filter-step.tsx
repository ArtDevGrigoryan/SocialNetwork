import type { Dispatch, SetStateAction } from "react";

export const FILTERS = [
  { name: "Normal", value: "none" },
  { name: "Clarendon", value: "contrast(1.2) saturate(1.35)" },
  { name: "Gingham", value: "brightness(1.05) hue-rotate(-10deg)" },
  { name: "Moon", value: "grayscale(1) contrast(1.1) brightness(1.1)" },
  { name: "Lark", value: "contrast(0.9) brightness(1.2) saturate(1.1)" },
  { name: "Juno", value: "saturate(1.4) contrast(1.1) hue-rotate(-4deg)" },
];

interface FilterStepProps {
  previews: string[];
  currentIndex: number;
  selectedFilters: Record<number, string>;
  setSelectedFilters: Dispatch<SetStateAction<Record<number, string>>>;
}

export default function FilterStep({
  previews,
  currentIndex,
  selectedFilters,
  setSelectedFilters,
}: FilterStepProps) {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
      <h3 className="text-white font-semibold mb-4 text-sm">Filters</h3>
      <div className="grid grid-cols-3 gap-3">
        {FILTERS.map((f) => (
          <div
            key={f.name}
            onClick={() =>
              setSelectedFilters((prev) => ({
                ...prev,
                [currentIndex]: f.value,
              }))
            }
            className="flex flex-col items-center gap-2 cursor-pointer group"
          >
            <div
              className={`w-full aspect-square rounded-md overflow-hidden border-2 transition-all ${
                selectedFilters[currentIndex] === f.value
                  ? "border-[#0095F6]"
                  : "border-transparent group-hover:border-neutral-500"
              }`}
            >
              <img
                src={previews[currentIndex]}
                style={{ filter: f.value !== "none" ? f.value : undefined }}
                className="w-full h-full object-cover"
                alt={f.name}
              />
            </div>
            <span
              className={`text-[12px] ${
                selectedFilters[currentIndex] === f.value
                  ? "text-[#0095F6] font-semibold"
                  : "text-neutral-400 font-medium"
              }`}
            >
              {f.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
