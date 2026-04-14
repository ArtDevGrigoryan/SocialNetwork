import { Grid, Bookmark, Contact2 } from "lucide-react";

export const ProfileTabs = () => {
  const tabs = [
    { id: "posts", icon: <Grid size={14} />, label: "Posts" },
    { id: "saved", icon: <Bookmark size={14} />, label: "Saved" },
    { id: "tagged", icon: <Contact2 size={14} />, label: "Tagged" },
  ];

  return (
    <div className="mt-12 border-t border-neutral-800 flex justify-center">
      <div className="flex gap-12 text-xs font-medium uppercase tracking-widest text-neutral-400">
        {tabs.map((tab) => (
          <div key={tab.id} className="flex items-center gap-2 py-4 border-t border-transparent hover:text-white transition cursor-pointer">
            {tab.icon}
            <span className="hidden md:inline">{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};