import { Grid, Bookmark, Repeat } from "lucide-react";

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (id: string) => void;
}

export const ProfileTabs = ({ activeTab, onTabChange }: ProfileTabsProps) => {
  const tabs = [
    { id: "posts", icon: <Grid size={16} />, label: "Posts" },
    { id: "saved", icon: <Bookmark size={16} />, label: "Saved" },
    { id: "reposts", icon: <Repeat size={16} />, label: "Reposts" },
  ];

  return (
    <div className="mt-12 border-t border-neutral-800 flex justify-center">
      <div className="flex gap-12 text-xs font-medium uppercase tracking-widest">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-4 border-t-2 transition-all duration-300 -mt-px ${
                isActive
                  ? "border-white text-white"
                  : "border-transparent text-neutral-500 hover:text-neutral-200"
              }`}
            >
              {tab.icon}
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileTabs;

