export type AlertType = "success" | "error" | "info" | "warning";

interface AlertProps {
  type?: AlertType;
  message: string;
  ttl?: number;
  onClose?: () => void;
}

const typeStyles: Record<AlertType, string> = {
  success: "bg-green-500/10 text-green-400 border-green-500/30",
  error: "bg-red-500/10 text-red-400 border-red-500/30",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
};

export const Alert = ({ type = "info", message }: AlertProps) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]">
      <div
        className={`rounded-xl border px-4 py-2 text-sm backdrop-blur shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${typeStyles[type]}`}
      >
        <span className="text-base">
          {type === "success" && "✔"}
          {type === "error" && "✖"}
          {type === "info" && "i"}
          {type === "warning" && "⚠"}
        </span>

        <span>{message}</span>
      </div>
    </div>
  );
};
