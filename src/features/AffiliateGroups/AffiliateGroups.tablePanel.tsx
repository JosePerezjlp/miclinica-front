import React from "react";
import { Minus, Plus, Search } from "lucide-react";
import type { AffiliateGroupsRow } from "./AffiliateGroups.types";

interface AffiliateGroupsTablePanelProps {
  actionButtons: string[];
  rowData: AffiliateGroupsRow;
  year: number;
}

const AffiliateGroupsTablePanel: React.FC<AffiliateGroupsTablePanelProps> = ({
  actionButtons,
  rowData,
  year,
}) => {
  return (
    <div className="flex-1 bg-slate-100 px-6 py-6">
      <div className="flex items-center justify-center gap-24 mb-6">
        {actionButtons.map((label) => (
          <button
            key={label}
            type="button"
            className="h-10 px-6 bg-teal-500 hover:bg-teal-400 text-white font-semibold text-[13px] rounded shadow"
          >
            {label.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-300 rounded-md overflow-hidden">
        <div className="px-8 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-8 text-[16px] text-slate-600">
            <span>Filtro Medio de Pago</span>
            <div className="w-12 h-6 rounded-full bg-slate-300 relative">
              <span className="absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white border border-slate-300" />
            </div>
            <span className="text-slate-900">Desplegar Grupos</span>
          </div>

          <div className="flex items-center gap-5 text-[15px]">
            <span>Año de pagos:</span>
            <button type="button" className="text-slate-900">
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-semibold">{year}</span>
            <button type="button" className="text-slate-900">
              <Plus className="w-4 h-4" />
            </button>
            <div className="ml-6 flex items-center gap-2 text-slate-500">
              <span>Buscar</span>
              <Search className="w-4 h-4" />
            </div>
          </div>
        </div>

        <table className="w-full text-left">
          <thead>
            <tr className="text-[13px] border-t border-slate-200 border-b border-slate-200">
              <th className="py-3 px-4">Tipo</th>
              <th className="py-3 px-4">Nombre Completo</th>
              <th className="py-3 px-4">Fecha de Inscripcion</th>
              <th className="py-3 px-4">DNI</th>
              <th className="py-3 px-4">Telefono</th>
              <th className="py-3 px-4">Plan</th>
              <th className="py-3 px-4">Cobro</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-slate-100 text-[15px]">
              <td className="py-3 px-4 font-semibold italic">Grupo</td>
              <td className="py-3 px-4 font-semibold italic">
                {rowData.titular}
              </td>
              <td className="py-3 px-4 font-semibold italic">
                {rowData.inscriptionDate}
              </td>
              <td className="py-3 px-4">{rowData.dni}</td>
              <td className="py-3 px-4">{rowData.phone}</td>
              <td className="py-3 px-4">{rowData.plan}</td>
              <td className="py-3 px-4">
                <div className="inline-flex overflow-hidden rounded-md border border-red-300">
                  {rowData.paidMonths.map((month: string) => (
                    <span
                      key={month}
                      className="px-2 py-1 text-[11px] font-semibold bg-red-200 border-r border-red-300 last:border-r-0"
                    >
                      {month}
                    </span>
                  ))}
                </div>
              </td>
              <td className="py-3 px-4 text-right">
                <button
                  type="button"
                  className="h-8 px-3 bg-slate-100 border border-slate-300 rounded text-[12px] font-semibold"
                >
                  CONSULTAR
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="h-[360px] border-t border-slate-200" />
        <div className="px-4 py-3 border-t border-slate-200 flex justify-end text-[12px] text-slate-600">
          Filas por página: 7 &nbsp;&nbsp; 1-1 de 1
        </div>
      </div>
    </div>
  );
};

export default AffiliateGroupsTablePanel;
