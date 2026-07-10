import React from "react";
import { Bell, Search, UserCog, LogOut, Menu } from "lucide-react";
import { clearAuthTokens } from "../../api/tokenStorage";

interface DashboardTopbarProps {
  onMenuClick?: () => void;
}

const DashboardTopbar: React.FC<DashboardTopbarProps> = ({ onMenuClick }) => {
  const handleLogOut = () => {
    clearAuthTokens();
    window.location.href = "/login";
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center gap-4">
      {/* Hamburger — solo visible en mobile */}
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500"
      >
        <Menu className="w-4 h-4" />
      </button>

      <button className="hidden lg:flex h-8 w-8 rounded-lg border border-slate-200 items-center justify-center text-slate-500">
        <UserCog className="w-4 h-4" />
      </button>

      <div className="relative flex-1 max-w-xl">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar afiliados, planes, transacciones..."
          className="w-full bg-slate-100 rounded-xl h-10 pl-10 pr-4 text-sm text-slate-700 border border-slate-200 outline-none"
        />
      </div>

      <button
        type="button"
        className="relative p-2 rounded-lg hover:bg-slate-100"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        <span className="absolute top-1 right-1 block w-2.5 h-2.5 rounded-full bg-red-500" />
      </button>

      <button
        type="button"
        className="relative p-2 rounded-lg hover:bg-slate-100 ml-auto"
      >
        <LogOut className="w-5 h-5 text-red-600" onClick={handleLogOut} />
      </button>
    </header>
  );
};

export default DashboardTopbar;
