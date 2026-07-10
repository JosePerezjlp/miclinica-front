import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import type { DashboardSideSection } from "./Dashboard.types";

interface DashboardSidebarProps {
  sections: DashboardSideSection[];
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const SidebarContent: React.FC<{
  sections: DashboardSideSection[];
  onNavigate?: () => void;
}> = ({ sections, onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <div className="h-20 px-4 flex items-center gap-3 border-b border-slate-200">
        <span className="h-8 w-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
          G
        </span>
        <div>
          <h2 className="text-2xl leading-none font-extrabold tracking-tight">
            GestorPay
          </h2>
          <p className="text-sm text-slate-600 mt-1">Plataforma de Gestion</p>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-2 py-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <div className="flex items-center justify-between px-2 mb-2 text-[14px] font-bold text-slate-700 uppercase tracking-wide">
              <span>{section.title}</span>
              {(section.title === "Operaciones" ||
                section.title === "Administracion") && (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </div>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.path
                  ? location.pathname === item.path
                  : item.active;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      if (item.path) navigate(item.path);
                      onNavigate?.();
                    }}
                    className={`w-full text-left flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold ${
                      isActive
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-slate-700" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="h-20 border-t border-slate-200 px-4 flex items-center gap-3">
        <span className="h-8 w-8 rounded-full bg-slate-200 text-slate-700 text-sm font-bold flex items-center justify-center">
          AD
        </span>
        <div>
          <p className="text-sm font-semibold">Admin</p>
          <p className="text-xs text-slate-500">admin@gestorpay.com</p>
        </div>
      </div>
    </>
  );
};

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  sections,
  mobileOpen = false,
  onMobileClose,
}) => {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-[248px] bg-white border-r border-slate-200 flex-col">
        <SidebarContent sections={sections} />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={onMobileClose}
          />

          {/* Drawer panel */}
          <aside className="relative z-10 w-[280px] max-w-[85vw] bg-white flex flex-col h-full shadow-xl">
            <button
              type="button"
              onClick={onMobileClose}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
            <SidebarContent sections={sections} onNavigate={onMobileClose} />
          </aside>
        </div>
      )}
    </>
  );
};

export default DashboardSidebar;
