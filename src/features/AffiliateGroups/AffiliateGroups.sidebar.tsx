import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import type { DashboardSideSection } from "../Dashboard/Dashboard.types";

interface AffiliateGroupsSidebarProps {
  sections: DashboardSideSection[];
}

const AffiliateGroupsSidebar: React.FC<AffiliateGroupsSidebarProps> = ({
  sections,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-[280px] bg-slate-100 border-r border-slate-300 h-screen overflow-hidden">
      <div className="h-11 border-b border-slate-300 flex items-center justify-center text-slate-500">
        Menu
      </div>

      <div className="h-[calc(100vh-44px)] overflow-y-auto px-0 py-2">
        {sections.map((section) => (
          <div key={section.title}>
            {section.items.map(
              (item: DashboardSideSection["items"][number]) => {
                const Icon = item.icon;
                const isActive = item.path
                  ? location.pathname === item.path
                  : item.active;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => item.path && navigate(item.path)}
                    className={`w-full text-left px-4 py-2 border-l-2 transition-colors ${
                      isActive
                        ? "bg-slate-200 border-l-blue-600"
                        : "border-l-transparent hover:bg-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-slate-900" />
                      <div>
                        <p className="text-[30px] font-medium text-slate-900">
                          {item.label}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              },
            )}
          </div>
        ))}

        <div className="px-4 py-3 text-[24px] font-bold uppercase text-slate-700 flex items-center justify-between">
          <span>Operaciones</span>
          <ChevronDown className="w-4 h-4" />
        </div>

        <div className="px-4 py-3 text-[24px] font-bold uppercase text-slate-700 flex items-center justify-between">
          <span>Administracion</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </aside>
  );
};

export default AffiliateGroupsSidebar;
