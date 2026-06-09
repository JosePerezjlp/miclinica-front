import React from "react";
import { X } from "lucide-react";
import type { GroupDetailData } from "../AffiliateGroups.detail.types";

interface BillingModalProps {
  groupData: GroupDetailData;
  onClose: () => void;
}

interface BillingContentProps {
  groupData: GroupDetailData;
  onPayRemaining?: (payment: UnifiedPaymentEntry) => void;
}

export type UnifiedPaymentEntry = {
  id: number;
  source: "PAYMENT" | "MANUAL_PAYMENT";
  billingPeriodId: number | null;
  amount: number;
  month: number;
  year: number;
  status: string;
  channel: string;
  eventDate: string;
  createdAt: string;
  gatewayTransactionId: string | null;
  reference: string | null;
  notes: string | null;
  amountDue: number | null;
  discountAmount: number;
  netAmountDue: number | null;
  remainingAmount: number | null;
};

const buildBillingPeriodKey = (month: number, year: number) =>
  `${year}-${month}`;

export const BillingContent: React.FC<BillingContentProps> = ({
  groupData,
  onPayRemaining,
}) => {
  const billingPeriodById = new Map(
    (groupData.billingPeriods || []).map((period) => [period.id, period]),
  );
  const paidByPeriodKey = new Map<string, number>();
  const discountsByPeriodKey = new Map<string, number>();

  for (const payment of groupData.payments || []) {
    const key = buildBillingPeriodKey(payment.month, payment.year);
    paidByPeriodKey.set(
      key,
      (paidByPeriodKey.get(key) ?? 0) + Number(payment.amount || 0),
    );
  }

  for (const payment of groupData.manualPayments || []) {
    const key = buildBillingPeriodKey(payment.month, payment.year);
    paidByPeriodKey.set(
      key,
      (paidByPeriodKey.get(key) ?? 0) + Number(payment.amount || 0),
    );
  }

  for (const discount of groupData.discounts || []) {
    const relatedPeriod = discount.billingPeriodId
      ? billingPeriodById.get(discount.billingPeriodId)
      : (groupData.billingPeriods || []).find(
          (period) => period.id === discount.billingPeriodId,
        );

    if (!relatedPeriod) {
      continue;
    }

    const key = buildBillingPeriodKey(relatedPeriod.month, relatedPeriod.year);
    discountsByPeriodKey.set(
      key,
      (discountsByPeriodKey.get(key) ?? 0) + Number(discount.amount || 0),
    );
  }

  const unifiedPayments: UnifiedPaymentEntry[] = [
    ...(groupData.payments || []).map((payment) => {
      const relatedPeriod = payment.billingPeriodId
        ? billingPeriodById.get(payment.billingPeriodId)
        : (groupData.billingPeriods || []).find(
            (period) =>
              period.month === payment.month && period.year === payment.year,
          );
      const amountDue = relatedPeriod
        ? Number(relatedPeriod.amountDue || 0)
        : null;
      const discountAmount =
        discountsByPeriodKey.get(
          buildBillingPeriodKey(payment.month, payment.year),
        ) ?? 0;
      const netAmountDue =
        amountDue !== null ? Math.max(amountDue - discountAmount, 0) : null;
      const periodPaid =
        paidByPeriodKey.get(
          buildBillingPeriodKey(payment.month, payment.year),
        ) ?? Number(payment.amount || 0);

      return {
        id: payment.id,
        source: "PAYMENT" as const,
        billingPeriodId: payment.billingPeriodId ?? relatedPeriod?.id ?? null,
        amount: Number(payment.amount || 0),
        month: payment.month,
        year: payment.year,
        status: payment.status,
        channel: payment.gateway,
        eventDate: payment.createdAt,
        createdAt: payment.createdAt,
        gatewayTransactionId: payment.gatewayTransactionId,
        reference: null,
        notes: null,
        amountDue,
        discountAmount,
        netAmountDue,
        remainingAmount:
          netAmountDue !== null ? Math.max(netAmountDue - periodPaid, 0) : null,
      };
    }),
    ...(groupData.manualPayments || []).map((payment) => {
      const relatedPeriod = payment.billingPeriodId
        ? billingPeriodById.get(payment.billingPeriodId)
        : (groupData.billingPeriods || []).find(
            (period) =>
              period.month === payment.month && period.year === payment.year,
          );

      const amountDue = relatedPeriod
        ? Number(relatedPeriod.amountDue || 0)
        : null;
      const discountAmount =
        discountsByPeriodKey.get(
          buildBillingPeriodKey(payment.month, payment.year),
        ) ?? 0;
      const netAmountDue =
        amountDue !== null ? Math.max(amountDue - discountAmount, 0) : null;
      const periodPaid =
        paidByPeriodKey.get(
          buildBillingPeriodKey(payment.month, payment.year),
        ) ?? Number(payment.amount || 0);

      return {
        id: payment.id,
        source: "MANUAL_PAYMENT" as const,
        billingPeriodId: payment.billingPeriodId ?? relatedPeriod?.id ?? null,
        amount: Number(payment.amount || 0),
        month: payment.month,
        year: payment.year,
        status: relatedPeriod?.status ?? "PAID",
        channel: payment.method,
        eventDate: payment.paidAt || payment.createdAt,
        createdAt: payment.createdAt,
        gatewayTransactionId: null,
        reference: payment.reference,
        notes: payment.notes,
        amountDue,
        discountAmount,
        netAmountDue,
        remainingAmount:
          netAmountDue !== null ? Math.max(netAmountDue - periodPaid, 0) : null,
      };
    }),
  ].sort((left, right) => {
    if (right.year !== left.year) return right.year - left.year;
    if (right.month !== left.month) return right.month - left.month;
    return (
      new Date(right.eventDate).getTime() - new Date(left.eventDate).getTime()
    );
  });

  const totalPaid = unifiedPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0,
  );
  const paidCount = unifiedPayments.filter(
    (payment) => payment.status === "PAID",
  ).length;
  const failedCount = unifiedPayments.filter(
    (payment) => payment.status === "FAILED",
  ).length;
  const payableEntryKeys = new Set<string>();

  for (const payment of unifiedPayments) {
    const periodKey = buildBillingPeriodKey(payment.month, payment.year);
    if (
      payment.remainingAmount !== null &&
      payment.remainingAmount > 0 &&
      !Array.from(payableEntryKeys).some((entryKey) =>
        entryKey.endsWith(`-${periodKey}`),
      )
    ) {
      payableEntryKeys.add(`${payment.source}-${payment.id}-${periodKey}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs uppercase text-blue-600 font-semibold">
            Total Pagos
          </p>
          <p className="text-2xl font-bold text-blue-900 mt-2">
            ${totalPaid.toFixed(2)}
          </p>
        </div>
        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-xs uppercase text-emerald-600 font-semibold">
            Pagados
          </p>
          <p className="text-2xl font-bold text-emerald-900 mt-2">
            {paidCount}
          </p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs uppercase text-red-600 font-semibold">
            Fallidos
          </p>
          <p className="text-2xl font-bold text-red-900 mt-2">{failedCount}</p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Historial Unificado de Pagos
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                <th className="px-4 py-3 text-left">Período</th>
                <th className="px-4 py-3 text-left">Origen</th>
                <th className="px-4 py-3 text-left">Monto</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Canal</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                {onPayRemaining && (
                  <th className="px-4 py-3 text-left">Acción</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unifiedPayments.length > 0 ? (
                unifiedPayments.map((payment) => {
                  const periodKey = buildBillingPeriodKey(
                    payment.month,
                    payment.year,
                  );
                  const canPayRemaining =
                    Boolean(onPayRemaining) &&
                    payment.billingPeriodId !== null &&
                    payment.remainingAmount !== null &&
                    payment.remainingAmount > 0 &&
                    payableEntryKeys.has(
                      `${payment.source}-${payment.id}-${periodKey}`,
                    );

                  return (
                    <tr
                      key={`${payment.source}-${payment.id}`}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {String(payment.month).padStart(2, "0")}/{payment.year}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs font-semibold">
                        {payment.source === "MANUAL_PAYMENT"
                          ? "Manual"
                          : "Automático"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        ${payment.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            payment.status === "PAID"
                              ? "bg-emerald-100 text-emerald-700"
                              : payment.status === "PARTIAL"
                                ? "bg-orange-100 text-orange-700"
                                : payment.status === "FAILED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs font-mono">
                        {payment.channel}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {new Date(payment.eventDate).toLocaleDateString(
                          "es-AR",
                        )}
                      </td>
                      {onPayRemaining && (
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          {canPayRemaining ? (
                            <button
                              type="button"
                              onClick={() => onPayRemaining(payment)}
                              className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                            >
                              Pagar
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={onPayRemaining ? 7 : 6}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    No hay pagos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {unifiedPayments.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            Detalle de Pagos
          </h3>
          <div className="space-y-3">
            {unifiedPayments.map((payment) => (
              <div
                key={`${payment.source}-${payment.id}`}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Pago #{payment.id} -{" "}
                      {String(payment.month).padStart(2, "0")}/{payment.year}
                    </p>
                    <p className="text-xs text-slate-500">
                      {payment.source === "MANUAL_PAYMENT"
                        ? "Pago manual"
                        : "Pago automático"}{" "}
                      •{" "}
                      {new Date(payment.eventDate).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">
                      ${payment.amount.toFixed(2)}
                    </p>
                    {payment.remainingAmount !== null &&
                      payment.remainingAmount > 0 && (
                        <p className="mt-1 text-xs font-semibold text-amber-700">
                          Pendiente: ${payment.remainingAmount.toFixed(2)}
                        </p>
                      )}
                    <span
                      className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${
                        payment.status === "PAID"
                          ? "bg-emerald-100 text-emerald-700"
                          : payment.status === "PARTIAL"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 pt-3 border-t border-slate-200">
                  <div>
                    <p className="text-slate-500">Cuota del período</p>
                    <p>
                      {payment.amountDue !== null
                        ? `$${payment.amountDue.toFixed(2)}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Bonificación aplicada</p>
                    <p>${payment.discountAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Cuota neta</p>
                    <p>
                      {payment.netAmountDue !== null
                        ? `$${payment.netAmountDue.toFixed(2)}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Saldo pendiente</p>
                    <p>
                      {payment.remainingAmount !== null
                        ? `$${payment.remainingAmount.toFixed(2)}`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Canal</p>
                    <p className="font-mono">{payment.channel}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Referencia</p>
                    <p className="font-mono">
                      {payment.reference || payment.gatewayTransactionId || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Origen</p>
                    <p>
                      {payment.source === "MANUAL_PAYMENT"
                        ? "Manual"
                        : "Automático"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Notas</p>
                    <p>{payment.notes || "—"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const BillingModal: React.FC<BillingModalProps> = ({ groupData, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-slate-900">
            Historial de Facturación y Pagos
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <BillingContent groupData={groupData} />

          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillingModal;
