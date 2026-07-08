import React, { useState } from "react";
import { X, Pencil } from "lucide-react";
import type { GroupDetailData } from "../AffiliateGroups.detail.types";

const BILLING_STATUS_LABELS: Record<string, string> = {
  PAID: "Pagado",
  PENDING: "Pendiente",
  IN_PROGRESS: "En proceso",
  PARTIAL: "Parcial",
  FAILED: "Fallido",
  EXEMPT: "Eximido",
};

const statusLabel = (status: string) => BILLING_STATUS_LABELS[status] ?? status;

interface BillingModalProps {
  groupData: GroupDetailData;
  onClose: () => void;
}

interface BillingContentProps {
  groupData: GroupDetailData;
  onPayRemaining?: (payment: UnifiedPaymentEntry) => void;
  onCheckStatus?: (payment: UnifiedPaymentEntry) => void;
  onApplyDiscount?: (payment: UnifiedPaymentEntry) => void;
  onEditPayment?: (payment: UnifiedPaymentEntry, fields: { amount?: number; reference?: string; notes?: string }) => Promise<void>;
  chargeLabel?: string;
  chargingPeriodId?: number | null;
  checkingPeriodId?: number | null;
  billingBalance?: number;
  onOpenDebtSettlement?: () => void;
}

export type UnifiedPaymentEntry = {
  id: number;
  source: "PAYMENT" | "MANUAL_PAYMENT" | "BILLING_PERIOD";
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
  failureMessage: string | null;
};

const buildBillingPeriodKey = (month: number, year: number) =>
  `${year}-${month}`;

export const BillingContent: React.FC<BillingContentProps> = ({
  groupData,
  onPayRemaining,
  onCheckStatus,
  onApplyDiscount,
  onEditPayment,
  chargeLabel,
  chargingPeriodId,
  checkingPeriodId,
  billingBalance,
  onOpenDebtSettlement,
}) => {
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editReference, setEditReference] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const startEdit = (payment: UnifiedPaymentEntry) => {
    setEditingPaymentId(payment.id);
    setEditAmount(String(payment.amount));
    setEditReference(payment.reference ?? "");
    setEditNotes(payment.notes ?? "");
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingPaymentId(null);
    setEditError(null);
  };

  const submitEdit = async (payment: UnifiedPaymentEntry) => {
    if (!onEditPayment) return;
    const amount = parseFloat(editAmount);
    if (!editAmount || isNaN(amount) || amount <= 0) {
      setEditError("El monto debe ser mayor a 0");
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      await onEditPayment(payment, {
        amount,
        reference: editReference || undefined,
        notes: editNotes || undefined,
      });
      setEditingPaymentId(null);
    } catch (err: any) {
      setEditError(err?.message || "Error al guardar");
    } finally {
      setEditLoading(false);
    }
  };
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

  const discountsListByPeriodKey = new Map<string, typeof groupData.discounts>();

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
    discountsListByPeriodKey.set(key, [
      ...(discountsListByPeriodKey.get(key) ?? []),
      discount,
    ]);
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
        failureMessage: null,
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
        failureMessage: null,
      };
    }),
  ];

  // Agregar SIEMPRE todos los billing periods como fila base del período
  for (const period of groupData.billingPeriods || []) {
    const key = buildBillingPeriodKey(period.month, period.year);
    const amountDue = Number(period.amountDue || 0);
    const discountAmount = discountsByPeriodKey.get(key) ?? 0;
    const netAmountDue = Math.max(amountDue - discountAmount, 0);
    const periodPaid = paidByPeriodKey.get(key) ?? 0;
    const remainingAmount = Math.max(netAmountDue - periodPaid, 0);

    const lastAttempt = period.attempts?.[0] ?? null;
    unifiedPayments.push({
      id: period.id,
      source: "BILLING_PERIOD",
      billingPeriodId: period.id,
      amount: 0,
      month: period.month,
      year: period.year,
      status: period.status,
      channel: lastAttempt?.gateway ?? "—",
      eventDate: period.dueDate,
      createdAt: period.createdAt,
      gatewayTransactionId: null,
      reference: null,
      notes: null,
      amountDue,
      discountAmount,
      netAmountDue,
      remainingAmount,
      failureMessage: lastAttempt?.failureMessage ?? null,
    });
  }

  unifiedPayments.sort((left, right) => {
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
  // Map de pagos CASH por período para poder editar desde la tabla
  const cashPaymentsByPeriodKey = new Map<string, UnifiedPaymentEntry>();
  for (const p of unifiedPayments) {
    if (p.source === "MANUAL_PAYMENT" && p.channel?.toUpperCase() === "CASH") {
      const key = buildBillingPeriodKey(p.month, p.year);
      if (!cashPaymentsByPeriodKey.has(key)) {
        cashPaymentsByPeriodKey.set(key, p);
      }
    }
  }

  const payableEntryKeys = new Set<string>();

  for (const payment of unifiedPayments.filter((p) => p.source === "BILLING_PERIOD")) {
    const periodKey = buildBillingPeriodKey(payment.month, payment.year);
    if (payment.remainingAmount !== null && payment.remainingAmount > 0) {
      payableEntryKeys.add(`${payment.source}-${payment.id}-${periodKey}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        {billingBalance !== undefined && (
          <button
            type="button"
            onClick={billingBalance > 0 ? onOpenDebtSettlement : undefined}
            disabled={billingBalance <= 0}
            className={`p-4 rounded-lg border text-left transition-colors ${
              billingBalance > 0
                ? "bg-orange-50 border-orange-300 hover:bg-orange-100 cursor-pointer"
                : "bg-slate-50 border-slate-200 cursor-default"
            }`}
          >
            <p className={`text-xs uppercase font-semibold ${billingBalance > 0 ? "text-orange-600" : "text-slate-500"}`}>
              Saldo Pendiente
            </p>
            <p className={`text-2xl font-bold mt-2 ${billingBalance > 0 ? "text-orange-900" : "text-slate-700"}`}>
              ${(billingBalance).toFixed(2)}
            </p>
            {billingBalance > 0 && (
              <p className="text-[10px] text-orange-600 mt-1 font-medium">Click para regularizar</p>
            )}
          </button>
        )}
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
                {(onPayRemaining || onApplyDiscount) && (
                  <th className="px-4 py-3 text-left">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {unifiedPayments.filter((p) => p.source === "BILLING_PERIOD").length > 0 ? (
                unifiedPayments.filter((p) => p.source === "BILLING_PERIOD").map((payment) => {
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
                          : payment.source === "BILLING_PERIOD"
                            ? "Sin cobrar"
                            : "Automático"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {payment.source === "BILLING_PERIOD" ? (
                          <span className="text-amber-700 font-semibold">
                            ${(payment.amountDue ?? 0).toFixed(2)}
                          </span>
                        ) : (
                          `$${payment.amount.toFixed(2)}`
                        )}
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
                          {statusLabel(payment.status)}
                        </span>
                        {payment.status === "FAILED" && payment.failureMessage && (
                          <p className="mt-1 text-xs text-red-600 font-medium leading-tight max-w-[140px]">
                            {payment.failureMessage}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs font-mono">
                        {payment.channel}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {new Date(payment.eventDate).toLocaleDateString(
                          "es-AR",
                        )}
                      </td>
                      {(onPayRemaining || onCheckStatus || onApplyDiscount) && (() => {
                        const isInProgress = payment.status === "IN_PROGRESS";
                        const canDiscount =
                          Boolean(onApplyDiscount) &&
                          payment.billingPeriodId !== null &&
                          payment.remainingAmount !== null &&
                          payment.remainingAmount > 0 &&
                          ["PENDING", "FAILED", "PARTIAL"].includes(payment.status);
                        const isThisChecking = checkingPeriodId !== null && checkingPeriodId === payment.billingPeriodId;
                        const anyChecking = checkingPeriodId !== null;
                        const isThisCharging = chargingPeriodId !== null && chargingPeriodId === payment.billingPeriodId;
                        const anyCharging = chargingPeriodId !== null;
                        const label = chargeLabel ?? (payment.source === "BILLING_PERIOD" ? "Cobrar" : "Pagar");

                        if (isInProgress && onCheckStatus && payment.billingPeriodId !== null) {
                          return (
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  disabled={anyChecking}
                                  onClick={() => !anyChecking && onCheckStatus(payment)}
                                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                    isThisChecking
                                      ? "bg-amber-400 text-white cursor-wait"
                                      : anyChecking
                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                        : "bg-amber-500 hover:bg-amber-600 text-white"
                                  }`}
                                >
                                  {isThisChecking && (
                                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                    </svg>
                                  )}
                                  {isThisChecking ? "Consultando..." : "Consultar"}
                                </button>
                              </div>
                            </td>
                          );
                        }

                        const periodKey = buildBillingPeriodKey(payment.month, payment.year);
                        const cashPayment = cashPaymentsByPeriodKey.get(periodKey);
                        const canEdit = Boolean(onEditPayment) && Boolean(cashPayment) && editingPaymentId !== cashPayment?.id;

                        return (
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {canPayRemaining && onPayRemaining && (
                                <button
                                  type="button"
                                  disabled={anyCharging}
                                  onClick={() => !anyCharging && onPayRemaining(payment)}
                                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors ${
                                    isThisCharging
                                      ? "bg-blue-400 cursor-wait"
                                      : anyCharging
                                        ? "bg-slate-300 cursor-not-allowed text-slate-500"
                                        : "bg-blue-600 hover:bg-blue-700"
                                  }`}
                                >
                                  {isThisCharging && (
                                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                    </svg>
                                  )}
                                  {isThisCharging ? "Procesando..." : label}
                                </button>
                              )}
                              {canDiscount && onApplyDiscount && (
                                <button
                                  type="button"
                                  onClick={() => onApplyDiscount(payment)}
                                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                                >
                                  Bonificar
                                </button>
                              )}
                              {canEdit && cashPayment && (
                                <button
                                  type="button"
                                  onClick={() => startEdit(cashPayment)}
                                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                                >
                                  <Pencil className="w-3 h-3" />
                                  Editar
                                </button>
                              )}
                              {!canPayRemaining && !canDiscount && !canEdit && (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </div>
                          </td>
                        );
                      })()}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={(onPayRemaining || onApplyDiscount) ? 7 : 6}
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
            {unifiedPayments.map((payment) => {
                const isCashManual =
                  payment.source === "MANUAL_PAYMENT" &&
                  payment.channel?.toUpperCase() === "CASH";
                const isEditing = editingPaymentId === payment.id;
                return (
                  <div
                    key={`${payment.source}-${payment.id}`}
                    className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {payment.source === "BILLING_PERIOD" ? "Cuota" : "Pago"} #{payment.id} -{" "}
                      {String(payment.month).padStart(2, "0")}/{payment.year}
                    </p>
                    <p className="text-xs text-slate-500">
                      {payment.source === "MANUAL_PAYMENT"
                        ? "Pago manual"
                        : payment.source === "BILLING_PERIOD"
                          ? "Sin cobrar"
                          : "Pago automático"}{" "}
                      •{" "}
                      {new Date(payment.eventDate).toLocaleDateString("es-AR")}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-lg font-bold text-slate-900">
                      ${payment.amount.toFixed(2)}
                    </p>
                    {payment.remainingAmount !== null &&
                      payment.remainingAmount > 0 && (
                        <p className="text-xs font-semibold text-amber-700">
                          Pendiente: ${payment.remainingAmount.toFixed(2)}
                        </p>
                      )}
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        payment.status === "PAID"
                          ? "bg-emerald-100 text-emerald-700"
                          : payment.status === "PARTIAL"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {payment.status}
                    </span>
                    {isCashManual && onEditPayment && !isEditing && (
                      <button
                        type="button"
                        onClick={() => startEdit(payment)}
                        className="inline-flex items-center gap-1 mt-1 px-2 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <p className="text-xs font-bold text-blue-700 uppercase">Editar pago en efectivo</p>
                    {editError && (
                      <p className="text-xs text-red-600 font-semibold">{editError}</p>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Monto *</label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-full h-8 px-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Referencia</label>
                        <input
                          type="text"
                          value={editReference}
                          onChange={(e) => setEditReference(e.target.value)}
                          className="w-full h-8 px-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Notas</label>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="w-full h-8 px-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={editLoading}
                        onClick={() => submitEdit(payment)}
                        className="h-8 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded transition-colors"
                      >
                        {editLoading ? "Guardando..." : "Guardar"}
                      </button>
                      <button
                        type="button"
                        disabled={editLoading}
                        onClick={cancelEdit}
                        className="h-8 px-4 border border-slate-300 text-slate-600 text-xs font-semibold rounded hover:bg-slate-100 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

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
                    <p className={payment.discountAmount > 0 ? "text-emerald-700 font-semibold" : ""}>
                      ${payment.discountAmount.toFixed(2)}
                    </p>
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

                {/* Detalle de bonificaciones individuales */}
                {(() => {
                  const key = buildBillingPeriodKey(payment.month, payment.year);
                  const periodDiscounts = discountsListByPeriodKey.get(key);
                  if (!periodDiscounts?.length) return null;
                  return (
                    <div className="mt-3 pt-3 border-t border-emerald-100 space-y-2">
                      <p className="text-[10px] font-bold uppercase text-emerald-600 tracking-wide">
                        Bonificaciones
                      </p>
                      {periodDiscounts.map((d) => (
                        <div key={d.id} className="flex items-start justify-between rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-emerald-800">
                              {d.reason || "Sin motivo"}
                            </p>
                            <p className="text-emerald-600">
                              Aplicado por <span className="font-medium">{d.appliedBy}</span>
                              {" · "}{new Date(d.createdAt).toLocaleDateString("es-AR")}
                            </p>
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                              {d.type === "TOTAL" ? "Total" : "Parcial"}
                            </span>
                          </div>
                          <p className="font-bold text-emerald-700 ml-4 whitespace-nowrap">
                            -${Number(d.amount).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
                  </div>
                );
              })}
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
