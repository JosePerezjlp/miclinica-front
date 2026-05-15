import React from 'react';
import { Bell, Search, UserCog } from 'lucide-react';

const DashboardTopbar: React.FC = () => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-6 flex items-center gap-4">
      <button className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500">
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

      <button type="button" className="relative p-2 rounded-lg hover:bg-slate-100 ml-auto">
        <Bell className="w-5 h-5 text-slate-600" />
        <span className="absolute top-1 right-1 block w-2.5 h-2.5 rounded-full bg-red-500" />
      </button>
    </header>
  );
};

export default DashboardTopbar;
