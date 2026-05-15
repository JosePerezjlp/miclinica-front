import React from "react";
import { Menu } from "lucide-react";

const AffiliateGroupsTopbar: React.FC = () => {
  return (
    <header className="h-12 bg-blue-600 text-white px-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Menu className="w-5 h-5" />
        <span className="font-semibold text-[35px]">Gestion</span>
      </div>

      <div className="flex items-center gap-5">
        <span className="text-[27px] font-semibold">
          Usuario: AdminRootClinica
        </span>
        <button
          type="button"
          className="bg-blue-500 hover:bg-blue-400 border border-blue-400 px-4 py-1 rounded-md text-[26px] font-semibold"
        >
          DESCO
        </button>
      </div>
    </header>
  );
};

export default AffiliateGroupsTopbar;
