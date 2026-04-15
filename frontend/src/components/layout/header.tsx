import { Bell, MessageCircle } from "lucide-react";

export default function Header() {
  return (
    <div className="md:hidden sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-neutral-900 px-4 py-2 flex items-center justify-between">
      <h2 className="text-2xl font-bold italic font-serif tracking-tighter">
        B-Social
      </h2>
      <div className="flex items-center gap-4">
        <div className="relative cursor-pointer">
          <Bell size={24} />
          <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full border-2 border-black" />
        </div>
        <MessageCircle size={24} />
      </div>
    </div>
  );
}
