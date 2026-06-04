import type { AuditView } from "./Audit.types";

export const CURRENT_YEAR = new Date().getFullYear();
export const CURRENT_MONTH = new Date().getMonth() + 1;

export const MONTHS: Record<number, string> = {
  1: "Enero",
  2: "Febrero",
  3: "Marzo",
  4: "Abril",
  5: "Mayo",
  6: "Junio",
  7: "Julio",
  8: "Agosto",
  9: "Septiembre",
  10: "Octubre",
  11: "Noviembre",
  12: "Diciembre",
};

export const MONTHS_OPTIONS = Object.entries(MONTHS).map(([key, value]) => ({
  label: value,
  value: parseInt(key, 10),
}));

export const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => ({
  label: (CURRENT_YEAR - i).toString(),
  value: CURRENT_YEAR - i,
}));

export const TRANSACTION_KIND_LABELS: Record<string, string> = {
  DEBIT_CAPITAL: "Débito Capital",
  DEBIT_INTEREST: "Débito Interés",
  CREDIT_PAYMENT_AUTO: "Crédito - Pago Automático",
  CREDIT_PAYMENT_MANUAL: "Crédito - Pago Manual",
  CREDIT_ADVANCE: "Crédito - Adelanto",
  CREDIT_DISCOUNT: "Crédito - Bonificación",
};

export const TRANSACTION_KIND_COLORS: Record<string, string> = {
  DEBIT_CAPITAL: "text-red-600",
  DEBIT_INTEREST: "text-orange-600",
  CREDIT_PAYMENT_AUTO: "text-emerald-600",
  CREDIT_PAYMENT_MANUAL: "text-emerald-600",
  CREDIT_ADVANCE: "text-blue-600",
  CREDIT_DISCOUNT: "text-purple-600",
};

export const BILLING_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Proceso",
  PARTIAL: "Parcial",
  PAID: "Pagado",
  FAILED: "Fallido",
  EXEMPT: "Exento",
};

export const BILLING_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  PARTIAL: "bg-orange-100 text-orange-700",
  PAID: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-red-100 text-red-700",
  EXEMPT: "bg-gray-100 text-gray-700",
};

export const ATTEMPT_RESULT_LABELS: Record<string, string> = {
  SUCCESS: "Exitoso",
  FAILED_INSUFFICIENT_FUNDS: "Fondos Insuficientes",
  FAILED_CARD_EXPIRED: "Tarjeta Expirada",
  FAILED_CARD_BLOCKED: "Tarjeta Bloqueada",
  FAILED_CBU_INVALID: "CBU Inválido",
  FAILED_GATEWAY_TIMEOUT: "Timeout del Gateway",
  FAILED_GATEWAY_ERROR: "Error del Gateway",
  FAILED_TOKEN_INVALID: "Token Inválido",
  SKIPPED: "Omitido",
};

export const ATTEMPT_RESULT_COLORS: Record<string, string> = {
  SUCCESS: "bg-emerald-100 text-emerald-700",
  FAILED_INSUFFICIENT_FUNDS: "bg-red-100 text-red-700",
  FAILED_CARD_EXPIRED: "bg-orange-100 text-orange-700",
  FAILED_CARD_BLOCKED: "bg-red-100 text-red-700",
  FAILED_CBU_INVALID: "bg-red-100 text-red-700",
  FAILED_GATEWAY_TIMEOUT: "bg-red-100 text-red-700",
  FAILED_GATEWAY_ERROR: "bg-red-100 text-red-700",
  FAILED_TOKEN_INVALID: "bg-red-100 text-red-700",
  SKIPPED: "bg-gray-100 text-gray-700",
};

export const VIEW_OPTIONS: Array<{ label: string; value: AuditView }> = [
  { label: "Transacciones", value: "transactions" },
  { label: "Resumen", value: "summary" },
];

export const PAYMENT_GATEWAY_LABELS: Record<string, string> = {
  SIRO: "SIRO",
  PAYWAY: "Payway",
  MOBBEX: "Mobbex",
};

export const MANUAL_PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: "Tarjeta",
  CASH: "Efectivo",
  TRANSFER: "Transferencia",
};
