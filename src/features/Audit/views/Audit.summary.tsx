import React from "react";
import {
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
} from "lucide-react";
import type { AuditSummary } from "../Audit.types";

interface Props {
  data: AuditSummary;
}

const AuditSummaryView: React.FC<Props> = ({ data }) => {
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(parseFloat(amount.toString()));
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const debitAmount = parseFloat(data.totalDebit);
  const creditAmount = parseFloat(data.totalCredit);
  const netBalance = debitAmount - creditAmount;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Transactions */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-600 uppercase">
                Total de Transacciones
              </div>
              <div className="text-3xl font-bold text-slate-900 mt-1">
                {data.totalTransactions}
              </div>
            </div>
            <Calendar className="w-8 h-8 text-slate-300" />
          </div>
        </div>

        {/* Total Debit */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-red-600 uppercase">
                Total Débitos
              </div>
              <div className="text-3xl font-bold text-red-600 mt-1">
                {formatCurrency(debitAmount)}
              </div>
            </div>
            <TrendingDown className="w-8 h-8 text-red-200" />
          </div>
        </div>

        {/* Total Credit */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-600 uppercase">
                Total Créditos
              </div>
              <div className="text-3xl font-bold text-emerald-600 mt-1">
                {formatCurrency(creditAmount)}
              </div>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-200" />
          </div>
        </div>

        {/* Success Attempts */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-600 uppercase">
                Cobros Exitosos
              </div>
              <div className="text-3xl font-bold text-emerald-600 mt-1">
                {data.successAttempts}
              </div>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-200" />
          </div>
        </div>

        {/* Failed Attempts */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-red-600 uppercase">
                Cobros Fallidos
              </div>
              <div className="text-3xl font-bold text-red-600 mt-1">
                {data.failedAttempts}
              </div>
            </div>
            <AlertCircle className="w-8 h-8 text-red-200" />
          </div>
        </div>

        {/* Net Balance */}
        <div className={`rounded-lg border p-4 ${
          netBalance >= 0
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={`text-xs font-semibold uppercase ${
                netBalance >= 0 ? "text-emerald-600" : "text-red-600"
              }`}>
                Saldo Neto
              </div>
              <div className={`text-3xl font-bold mt-1 ${
                netBalance >= 0 ? "text-emerald-600" : "text-red-600"
              }`}>
                {formatCurrency(Math.abs(netBalance))}
              </div>
              <div className={`text-xs mt-1 ${
                netBalance >= 0 ? "text-emerald-700" : "text-red-700"
              }`}>
                {netBalance >= 0 ? "A favor" : "En contra"}
              </div>
            </div>
            {netBalance >= 0 ? (
              <TrendingUp className="w-8 h-8 text-emerald-200" />
            ) : (
              <TrendingDown className="w-8 h-8 text-red-200" />
            )}
          </div>
        </div>
      </div>

      {/* Period Info */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="text-xs font-bold text-slate-700 mb-3">
          PERÍODO DE COBERTURA
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Desde:</span>
          <span className="font-semibold text-slate-900">
            {formatDate(data.periodStart)}
          </span>
          <span className="text-slate-600">Hasta:</span>
          <span className="font-semibold text-slate-900">
            {formatDate(data.periodEnd)}
          </span>
        </div>
      </div>

      {/* Groups Summary */}
      {data.byFamiliarGroup.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-700 uppercase">
              RESUMEN POR GRUPO FAMILIAR
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">
                    Grupo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">
                    Promotor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-700">
                    Transacciones
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                    Débitos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                    Créditos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.byFamiliarGroup.map((group) => (
                  <tr key={group.familiarGroupId} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {group.familiarGroupName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-600">
                        {group.promoterName || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-1 rounded">
                        {group.transactions}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-red-600 font-semibold">
                        {formatCurrency(group.totalDebit)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-600 font-semibold">
                        {formatCurrency(group.totalCredit)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditSummaryView;
