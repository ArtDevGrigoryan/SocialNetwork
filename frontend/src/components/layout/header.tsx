import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <div className="md:hidden sticky top-0 z-40 bg-black/85 backdrop-blur-md border-b border-neutral-900 px-4 py-3 flex items-center justify-between">
      <h2 className="text-[30px] leading-none font-serif italic tracking-tight">
        Bardiner
      </h2>
      <Link to="/messages" className="text-white" aria-label="Open messages">
        <MessageCircle size={24} />
      </Link>
    </div>
  );
}
