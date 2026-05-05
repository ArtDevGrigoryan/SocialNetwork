import { type LucideIcon } from "lucide-react";

interface ToolbarProps {
  icon: LucideIcon;
  label?: string;
  onClick: () => void;
  active?: boolean;
}

export const DesktopToolbarButton = ({
  icon: Icon,
  label,
  onClick,
  active,
}: ToolbarProps) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl transition-all active:scale-95 ${
      active
        ? "bg-[#0095F6] text-white shadow-[0_0_15px_rgba(0,149,246,0.5)]"
        : "bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
    }`}
  >
    <Icon size={22} />
    {label && <span className="text-[10px] font-medium">{label}</span>}
  </button>
);

export const MobileToolbarButton = ({
  icon: Icon,
  onClick,
  active,
}: ToolbarProps) => (
  <button
    onClick={onClick}
    className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 ${
      active ? "bg-[#0095F6] text-white" : "text-white hover:bg-white/20"
    }`}
  >
    <Icon size={20} />
  </button>
);
