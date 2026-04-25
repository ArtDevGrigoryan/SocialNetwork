import { Link2 } from "lucide-react";
import type { LinkTabProps } from "../types";

export default function ChatLinksTab({ links }: LinkTabProps) {
  if (links.length === 0) {
    return (
      <p className="text-neutral-500 text-center mt-8 text-sm">
        No shared links
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-2">
      {links.map((link, i) => (
        <a
          key={link._id || i}
          href={link.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-4 p-3 bg-neutral-900 rounded-xl hover:bg-neutral-800 transition-colors"
        >
          <div className="p-3.5 bg-neutral-800 rounded-full shrink-0">
            <Link2 size={20} className="text-white" />
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-blue-400 text-[15px] truncate font-medium">
              {link.url}
            </p>
            <p className="text-neutral-500 text-[13px] truncate mt-0.5">
              {link.text}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}
