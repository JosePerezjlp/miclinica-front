import React from "react";
import { ShieldPlus } from "lucide-react";

interface AffiliateGroupsSearchCardProps {
  dni: string;
  onDniChange: (value: string) => void;
  onBuscar: () => void;
  onLimpiar: () => void;
  logoLabel: string;
  logoCaption: string;
}

const AffiliateGroupsSearchCard: React.FC<AffiliateGroupsSearchCardProps> = ({
  dni,
  onDniChange,
  onBuscar,
  onLimpiar,
  logoLabel,
  logoCaption,
}) => {
  return (
    <div className="flex-1 bg-slate-100 p-8">
      <div className="flex flex-col items-center pt-4">
        <div className="text-blue-600 text-center mb-6">
          <ShieldPlus className="w-10 h-10 mx-auto" />
          <p className="text-[16px] font-bold mt-1">{logoLabel}</p>
          <p className="text-[13px] font-semibold tracking-wide">
            {logoCaption}
          </p>
        </div>

        <div className="w-full max-w-[560px] bg-slate-200 shadow-[0_12px_18px_rgba(0,0,0,0.25)] p-5">
          <input
            type="text"
            value={dni}
            onChange={(e) => onDniChange(e.target.value)}
            placeholder="Numero de DNI *"
            className="w-full h-14 px-4 text-[15px] bg-slate-100 border border-slate-200 outline-none"
          />

          <div className="flex justify-center gap-8 mt-8 pb-1">
            <button
              type="button"
              onClick={onBuscar}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[14px] px-6 h-10 rounded shadow"
            >
              BUSCAR
            </button>
            <button
              type="button"
              onClick={onLimpiar}
              className="text-blue-600 hover:text-blue-500 font-semibold text-[14px]"
            >
              LIMPIAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateGroupsSearchCard;
