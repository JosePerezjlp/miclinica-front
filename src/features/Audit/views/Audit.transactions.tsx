import React from "react";
import { ChevronDown, AlertCircle, CheckCircle } from "lucide-react";
import type { AuditTransactionsResponse } from "../Audit.types";
import {
  TRANSACTION_KIND_LABELS,
  TRANSACTION_KIND_COLORS,
  PAYMENT_GATEWAY_LABELS,
  ATTEMPT_RESULT_LABELS,
  ATTEMPT_RESULT_COLORS,
  MANUAL_PAYMENT_METHOD_LABELS,
} from "../Audit.constants";

interface Props {
  data: AuditTransactionsResponse;
}

const AuditTransactionsView: React.FC<Props> = ({ data }) => {
  const [expandedRows, setExpandedRows] = React.useState<Set<number>>(
    new Set(),
  );

  const toggleRow = (id: number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (data.data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="text-center text-slate-600">
          <p>
            No hay transacciones registradas para los filtros seleccionados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border-b border-slate-200">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-slate-600 font-semibold">
            Total de Transacciones
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {data.total}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-3">
          <div className="text-xs text-red-700 font-semibold">Débitos</div>
          <div className="text-2xl font-bold text-red-700 mt-1">
            {data.data.filter((t) => t.kind.startsWith("DEBIT")).length}
          </div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3">
          <div className="text-xs text-emerald-700 font-semibold">Créditos</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {data.data.filter((t) => t.kind.startsWith("CREDIT")).length}
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-xs text-orange-700 font-semibold">
            Intentos Fallidos
          </div>
          <div className="text-2xl font-bold text-orange-700 mt-1">
            {
              data.data.filter(
                (t) =>
                  t.chargeAttempts &&
                  t.chargeAttempts.some((a) => a.result.startsWith("FAILED")),
              ).length
            }
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700 w-8" />
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">
                Fecha
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">
                Grupo
              </th>
              <th className="px-4 py-3 text-left text-xs font-bold text-slate-700">
                Tipo de Movimiento
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                Monto Capital
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold text-slate-700">
                Monto Interés
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.data.map((transaction) => {
              const isExpanded = expandedRows.has(transaction.id);
              const hasDetails =
                transaction.billingPeriod ||
                transaction.manualPayment ||
                transaction.discount ||
                transaction.chargeAttempts;

              return (
                <React.Fragment key={transaction.id}>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      {hasDetails && (
                        <button
                          type="button"
                          onClick={() => toggleRow(transaction.id)}
                          className="text-slate-600 hover:text-slate-900"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {formatDate(transaction.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-semibold text-slate-900">
                        {transaction.familiarGroup.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {transaction.familiarGroup.holderFullName}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-semibold ${
                          TRANSACTION_KIND_COLORS[transaction.kind] ||
                          "text-slate-600"
                        }`}
                      >
                        {TRANSACTION_KIND_LABELS[transaction.kind] ||
                          transaction.kind}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          parseFloat(transaction.amountCapital) > 0
                            ? "text-red-600 font-semibold"
                            : "text-emerald-600 font-semibold"
                        }
                      >
                        {formatCurrency(transaction.amountCapital)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          parseFloat(transaction.amountInterest) > 0
                            ? "text-red-600 font-semibold"
                            : "text-emerald-600 font-semibold"
                        }
                      >
                        {formatCurrency(transaction.amountInterest)}
                      </span>
                    </td>
                  </tr>

                  {/* Expanded Details */}
                  {isExpanded && hasDetails && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 bg-slate-50">
                        <div className="space-y-4">
                          {/* Billing Period */}
                          {transaction.billingPeriod && (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="text-xs font-bold text-slate-700 mb-2">
                                PERÍODO DE FACTURACIÓN
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-slate-600">Mes:</span>
                                  <div className="font-semibold text-slate-900">
                                    {transaction.billingPeriod.month}/
                                    {transaction.billingPeriod.year}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-600">
                                    Monto Debido:
                                  </span>
                                  <div className="font-semibold text-slate-900">
                                    {formatCurrency(
                                      transaction.billingPeriod.amountDue,
                                    )}
                                  </div>
                                </div>
                                <div className="sm:col-span-2">
                                  <span className="text-slate-600">
                                    Estado:
                                  </span>
                                  <div className="font-semibold text-slate-900">
                                    {transaction.billingPeriod.status}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Manual Payment */}
                          {transaction.manualPayment && (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="text-xs font-bold text-slate-700 mb-2">
                                PAGO MANUAL
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-slate-600">
                                    Método:
                                  </span>
                                  <div className="font-semibold text-slate-900">
                                    {MANUAL_PAYMENT_METHOD_LABELS[
                                      transaction.manualPayment.method
                                    ] || transaction.manualPayment.method}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-600">Monto:</span>
                                  <div className="font-semibold text-slate-900">
                                    {formatCurrency(
                                      transaction.manualPayment.amount,
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-600">
                                    Registrado por:
                                  </span>
                                  <div className="font-semibold text-slate-900">
                                    {transaction.manualPayment.createdBy}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-600">Fecha:</span>
                                  <div className="font-semibold text-slate-900">
                                    {formatDate(
                                      transaction.manualPayment.paidAt,
                                    )}
                                  </div>
                                </div>
                              </div>
                              {transaction.manualPayment.reference && (
                                <div className="mt-2 text-sm">
                                  <span className="text-slate-600">
                                    Referencia:
                                  </span>
                                  <div className="font-mono text-slate-900">
                                    {transaction.manualPayment.reference}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {transaction.discount && (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="text-xs font-bold text-slate-700 mb-2">
                                BONIFICACIÓN
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="text-slate-600">Tipo:</span>
                                  <div className="font-semibold text-slate-900">
                                    {transaction.discount.type}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-600">Monto:</span>
                                  <div className="font-semibold text-slate-900">
                                    {formatCurrency(
                                      transaction.discount.amount,
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-600">
                                    Aplicó:
                                  </span>
                                  <div className="font-semibold text-slate-900">
                                    {transaction.discount.appliedBy}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-slate-600">Fecha:</span>
                                  <div className="font-semibold text-slate-900">
                                    {formatDate(transaction.discount.createdAt)}
                                  </div>
                                </div>
                              </div>
                              {transaction.discount.reason && (
                                <div className="mt-2 text-sm">
                                  <span className="text-slate-600">
                                    Motivo:
                                  </span>
                                  <div className="text-slate-900">
                                    {transaction.discount.reason}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Charge Attempts */}
                          {transaction.chargeAttempts &&
                            transaction.chargeAttempts.length > 0 && (
                              <div className="bg-white rounded-lg p-3 border border-slate-200">
                                <div className="text-xs font-bold text-slate-700 mb-3">
                                  INTENTOS DE COBRO (
                                  {transaction.chargeAttempts.length})
                                </div>
                                <div className="space-y-2">
                                  {transaction.chargeAttempts.map((attempt) => {
                                    const isSuccess =
                                      attempt.result === "SUCCESS";
                                    return (
                                      <div
                                        key={attempt.id}
                                        className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm p-2 bg-slate-50 rounded border border-slate-200"
                                      >
                                        <div className="flex items-center gap-2">
                                          {isSuccess ? (
                                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                                          ) : (
                                            <AlertCircle className="w-4 h-4 text-red-600" />
                                          )}
                                          <span className="font-semibold">
                                            Intento {attempt.attemptNumber}
                                          </span>
                                        </div>
                                        <span className="text-slate-600">
                                          {PAYMENT_GATEWAY_LABELS[
                                            attempt.gateway
                                          ] || attempt.gateway}
                                        </span>
                                        <span
                                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                            ATTEMPT_RESULT_COLORS[
                                              attempt.result
                                            ] || "bg-slate-100"
                                          }`}
                                        >
                                          {ATTEMPT_RESULT_LABELS[
                                            attempt.result
                                          ] || attempt.result}
                                        </span>
                                        {attempt.amountCharged && (
                                          <span className="ml-auto text-slate-900 font-semibold">
                                            {formatCurrency(
                                              attempt.amountCharged,
                                            )}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          {transaction.description && (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="text-xs font-bold text-slate-700 mb-2">
                                DESCRIPCIÓN
                              </div>
                              <p className="text-sm text-slate-900">
                                {transaction.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditTransactionsView;
