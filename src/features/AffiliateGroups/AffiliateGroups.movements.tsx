import React from "react";
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { GroupDetailData } from "./AffiliateGroups.detail.types";

const ATTEMPT_RESULT_LABELS: Record<string, string> = {
  SUCCESS: "Cobro exitoso",
  FAILED_INSUFFICIENT_FUNDS: "Fondos insuficientes",
  FAILED_CARD_EXPIRED: "Tarjeta vencida",
  FAILED_CARD_BLOCKED: "Tarjeta bloqueada",
  FAILED_CBU_INVALID: "CBU inválido",
  FAILED_GATEWAY_TIMEOUT: "Tiempo de espera agotado (gateway)",
  FAILED_GATEWAY_ERROR: "Error del gateway",
  FAILED_TOKEN_INVALID: "Token inválido",
  SKIPPED: "Omitido (día no hábil)",
};

const TRANSACTION_KIND_LABELS: Record<string, string> = {
  DEBIT_CAPITAL: "Deuda generada",
  DEBIT_INTEREST: "Interés generado",
  CREDIT_PAYMENT_AUTO: "Cobro automático acreditado",
  CREDIT_PAYMENT_MANUAL: "Pago manual acreditado",
  CREDIT_ADVANCE: "Adelanto acreditado",
  CREDIT_DISCOUNT: "Bonificación aplicada",
};

const CREDIT_KINDS = new Set([
  "CREDIT_PAYMENT_AUTO",
  "CREDIT_PAYMENT_MANUAL",
  "CREDIT_ADVANCE",
  "CREDIT_DISCOUNT",
]);

type Movement = {
  key: string;
  date: string;
  title: string;
  detail: string | null;
  amount: number | null;
  tone: "success" | "failure" | "neutral" | "credit" | "debit";
};

function formatAmount(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isNaN(n) ? null : n;
}

function buildMovements(groupData: GroupDetailData): Movement[] {
  const movements: Movement[] = [];

  for (const period of groupData.billingPeriods) {
    for (const attempt of period.attempts) {
      const isSuccess = attempt.result === "SUCCESS";
      const isSkipped = attempt.result === "SKIPPED";
      movements.push({
        key: `attempt-${attempt.id}`,
        date: attempt.executedAt ?? attempt.scheduledAt,
        title:
          ATTEMPT_RESULT_LABELS[attempt.result] ?? attempt.result,
        detail: [
          `Cuota ${String(period.month).padStart(2, "0")}/${period.year}`,
          attempt.gateway,
          attempt.failureMessage,
        ]
          .filter(Boolean)
          .join(" • "),
        amount: formatAmount(attempt.amountCharged),
        tone: isSuccess ? "success" : isSkipped ? "neutral" : "failure",
      });
    }
  }

  for (const transaction of groupData.currentAccount?.transactions ?? []) {
    const isCredit = CREDIT_KINDS.has(transaction.kind);
    const amount = formatAmount(transaction.amountCapital) ?? 0;
    const interest = formatAmount(transaction.amountInterest) ?? 0;
    movements.push({
      key: `transaction-${transaction.id}`,
      date: transaction.createdAt,
      title: TRANSACTION_KIND_LABELS[transaction.kind] ?? transaction.kind,
      detail:
        [transaction.description, transaction.createdBy]
          .filter(Boolean)
          .join(" • ") || null,
      amount: amount + interest,
      tone: isCredit ? "credit" : "debit",
    });
  }

  return movements.sort(
    (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
  );
}

const TONE_ICON: Record<Movement["tone"], React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  failure: <XCircle className="w-5 h-5 text-red-600" />,
  neutral: <MinusCircle className="w-5 h-5 text-slate-400" />,
  credit: <TrendingUp className="w-5 h-5 text-emerald-600" />,
  debit: <TrendingDown className="w-5 h-5 text-amber-600" />,
};

const TONE_AMOUNT_CLASS: Record<Movement["tone"], string> = {
  success: "text-emerald-700",
  failure: "text-red-700",
  neutral: "text-slate-500",
  credit: "text-emerald-700",
  debit: "text-amber-700",
};

interface MovementsContentProps {
  groupData: GroupDetailData;
}

export const MovementsContent: React.FC<MovementsContentProps> = ({
  groupData,
}) => {
  const movements = buildMovements(groupData);

  if (movements.length === 0) {
    return (
      <p className="text-center text-slate-500 py-8">
        No hay movimientos registrados todavía.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {movements.map((movement) => (
        <div
          key={movement.key}
          className="flex items-start gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="mt-0.5">{TONE_ICON[movement.tone]}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">{movement.title}</p>
              <p className="text-xs text-slate-500 whitespace-nowrap">
                {new Date(movement.date).toLocaleString("es-AR")}
              </p>
            </div>
            {movement.detail && (
              <p className="text-sm text-slate-500 mt-1">{movement.detail}</p>
            )}
          </div>
          {movement.amount !== null && (
            <p
              className={`text-lg font-bold whitespace-nowrap ${TONE_AMOUNT_CLASS[movement.tone]}`}
            >
              ${movement.amount.toFixed(2)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default MovementsContent;
