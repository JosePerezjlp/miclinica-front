import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  CreditCard,
  Eye,
  Edit2,
  FileText,
  Plus,
  Users,
} from "lucide-react";
import type { AppDispatch, RootState } from "../../store/store";
import {
  chargeNowForPeriodThunk,
  checkBillingPeriodSiroStatusThunk,
  getGroupDetailThunk,
  registerManualPaymentThunk,
  settleDebtByGatewayThunk,
  settleDebtThunk,
  updateManualPaymentThunk,
} from "./AffiliateGroups.detail.action";
import type { GroupDetailData } from "./AffiliateGroups.detail.types";
import GroupInfoModal from "./modals/AffiliateGroups.groupInfo.modal";
import MembersModal from "./modals/AffiliateGroups.members.modal";
import PaymentMethodsModal from "./modals/AffiliateGroups.paymentMethods.modal";
import PlansModal from "./modals/AffiliateGroups.plans.modal";
import {
  BillingContent,
  type UnifiedPaymentEntry,
} from "./modals/AffiliateGroups.billing.modal";
import { applyDiscount } from "../../api/groupDetail.service";
import { calculateNextChargeDate } from "./AffiliateGroups.utils";
import { MovementsContent } from "./AffiliateGroups.movements";

type DetailTab = "information" | "transactions";
type TransactionsView = "billing" | "movements";
type GroupAffiliate = GroupDetailData["affiliates"][number];
type SettlementPreviewItem = {
  billingPeriodId: number;
  periodLabel: string;
  dueDate: string;
  amountDue: number;
  remainingAmount: number;
  discountApplied: number;
  paymentApplied: number;
  projectedRemaining: number;
};

const buildBillingPeriodKey = (month: number, year: number) =>
  `${year}-${month}`;

const formatBillingPeriodLabel = (month: number, year: number) =>
  `${String(month).padStart(2, "0")}/${year}`;

const formatAffiliateFullName = (affiliate: GroupAffiliate) =>
  [affiliate.firstName, affiliate.lastName].filter(Boolean).join(" ") ||
  "Sin nombre";

const formatDisplayValue = (value: unknown, fallback: string) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim();

  return normalized ? normalized : fallback;
};

const formatDateValue = (value: unknown, fallback = "Sin fecha") => {
  if (!value) {
    return fallback;
  }

  const parsedDate = new Date(String(value));

  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return parsedDate.toLocaleDateString("es-AR");
};

const buildWhatsAppUrl = (phone?: string | null) => {
  const digits = String(phone ?? "").replace(/\D/g, "");

  if (!digits) {
    return null;
  }

  const normalizedDigits = digits.startsWith("54") ? digits : `54${digits}`;

  return `https://wa.me/${normalizedDigits}`;
};

const buildDebtSettlementPreview = ({
  groupData,
  paidByPeriodKey,
  discountsByPeriodKey,
  discountAmount,
  paymentAmount,
}: {
  groupData: GroupDetailData;
  paidByPeriodKey: Map<string, number>;
  discountsByPeriodKey: Map<string, number>;
  discountAmount: number;
  paymentAmount: number;
}): SettlementPreviewItem[] => {
  let remainingDiscount = Math.max(0, discountAmount);
  let remainingPayment = Math.max(0, paymentAmount);

  return [...(groupData.billingPeriods || [])]
    .sort(
      (left, right) =>
        new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime() ||
        left.id - right.id,
    )
    .map((period) => {
      const key = buildBillingPeriodKey(period.month, period.year);
      const paidAmount = paidByPeriodKey.get(key) ?? 0;
      const discountedAmount = discountsByPeriodKey.get(key) ?? 0;
      const remainingAmount = Math.max(
        Number(period.amountDue || 0) - paidAmount - discountedAmount,
        0,
      );

      if (remainingAmount <= 0) {
        return null;
      }

      const discountApplied = Math.min(remainingDiscount, remainingAmount);
      remainingDiscount -= discountApplied;

      const remainingAfterDiscount = remainingAmount - discountApplied;
      const paymentApplied = Math.min(remainingPayment, remainingAfterDiscount);
      remainingPayment -= paymentApplied;

      return {
        billingPeriodId: period.id,
        periodLabel: formatBillingPeriodLabel(period.month, period.year),
        dueDate: formatDateValue(period.dueDate),
        amountDue: Number(period.amountDue || 0),
        remainingAmount,
        discountApplied,
        paymentApplied,
        projectedRemaining: Math.max(
          remainingAmount - discountApplied - paymentApplied,
          0,
        ),
      };
    })
    .filter(
      (item): item is SettlementPreviewItem =>
        item !== null && (item.discountApplied > 0 || item.paymentApplied > 0),
    );
};

const PLAN_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Activo",
  EXPIRED: "Vencido",
  NO_COVERAGE: "Sin cobertura",
  GRACE_PERIOD: "Período de gracia",
};

const AffiliateGroupsDetailContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const {
    data: groupData,
    loading,
    error,
  } = useSelector(
    (state: RootState) =>
      state.groupDetail || { data: null, loading: false, error: null },
  );

  const [activeModal, setActiveModal] = useState<
    "info" | "members" | "payments" | "plans" | null
  >(null);
  const [activeTab, setActiveTab] = useState<DetailTab>("transactions");
  const [transactionsView, setTransactionsView] =
    useState<TransactionsView>("billing");
  const [selectedAffiliate, setSelectedAffiliate] =
    useState<GroupAffiliate | null>(null);
  const [paymentToSettle, setPaymentToSettle] =
    useState<UnifiedPaymentEntry | null>(null);
  const [manualPaymentForm, setManualPaymentForm] = useState({
    amount: "",
    method: "CASH" as "CARD" | "CASH" | "TRANSFER",
    reference: "",
    notes: "",
  });
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    number | null
  >(null);
  const [chargingPeriodId, setChargingPeriodId] = useState<number | null>(null);
  const [chargeNowFeedback, setChargeNowFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [checkingPeriodId, setCheckingPeriodId] = useState<number | null>(null);
  const [discountTarget, setDiscountTarget] = useState<UnifiedPaymentEntry | null>(null);
  const [discountAmount, setDiscountAmount] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [discountSubmitting, setDiscountSubmitting] = useState(false);
  const [discountError, setDiscountError] = useState("");
  const [siroStatusModal, setSiroStatusModal] = useState<{
    billingPeriodId: number;
    billingPeriodStatus: string;
    nroTransaccion?: string;
    estado?: string;
    estadoLabel?: string;
    cantidadErrores?: number;
    isError?: boolean;
    message?: string;
  } | null>(null);
  const [showDebtSettlementModal, setShowDebtSettlementModal] = useState(false);
  const [debtSettlementForm, setDebtSettlementForm] = useState({
    amount: "",
    discountAmount: "0",
    discountReason: "",
    method: "CASH" as "CARD" | "CASH" | "TRANSFER",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    if (id) {
      dispatch(getGroupDetailThunk(parseInt(id, 10)));
    }
  }, [dispatch, id]);

  // Al llegar recién creado desde el alta de pago automático, abrir el modal
  // de miembros para completar los datos del cliente en el momento.
  useEffect(() => {
    const shouldOpenMembers = (
      location.state as { openMembersModal?: boolean } | null
    )?.openMembersModal;

    if (groupData && shouldOpenMembers) {
      setActiveModal("members");
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [groupData, location, navigate]);

  if (!id) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-slate-600">ID de grupo no válido</p>
      </div>
    );
  }

  if (loading && !groupData) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-red-600">{error || "Grupo no encontrado"}</p>
      </div>
    );
  }

  const holder = groupData.affiliates?.find((affiliate) => affiliate.isHolder);
  const planStatus = groupData.planStatus || "N/A";
  const planStatusLabel = PLAN_STATUS_LABELS[planStatus] || planStatus;
  const activeMethods =
    groupData.paymentMethods?.filter((method) => method.isActive) || [];
  const nextAutomaticMethod = activeMethods[0] ?? null;
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
      : null;

    if (!relatedPeriod) {
      continue;
    }

    const key = buildBillingPeriodKey(relatedPeriod.month, relatedPeriod.year);
    discountsByPeriodKey.set(
      key,
      (discountsByPeriodKey.get(key) ?? 0) + Number(discount.amount || 0),
    );
  }

  const computedPendingBalance = (groupData.billingPeriods || []).reduce(
    (sum, period) => {
      const key = buildBillingPeriodKey(period.month, period.year);
      const paid = paidByPeriodKey.get(key) ?? 0;
      const discounted = discountsByPeriodKey.get(key) ?? 0;

      return (
        sum + Math.max(Number(period.amountDue || 0) - discounted - paid, 0)
      );
    },
    0,
  );

  const billingBalance = computedPendingBalance;
  const formattedPlanPrice = groupData.plan
    ? `$${Number(groupData.plan.monthlyFee).toFixed(2)}`
    : "Sin precio";
  const nextChargeDate = calculateNextChargeDate(groupData.chargeDay);
  const promoterName = groupData.promoter?.name?.trim() || "Sin promotor";
  const cityLabel = groupData.city?.name?.trim() || "No informada";
  const debtSettlementDiscount = Math.max(
    0,
    Number(debtSettlementForm.discountAmount || 0),
  );
  const debtSettlementPaymentAmount = Math.max(
    0,
    Number(debtSettlementForm.amount || 0),
  );
  const debtSettlementMaxPayable = Math.max(
    0,
    billingBalance - debtSettlementDiscount,
  );
  const debtSettlementPaymentExceeded =
    debtSettlementPaymentAmount > debtSettlementMaxPayable;
  const debtSettlementTotalToApply =
    debtSettlementDiscount + debtSettlementPaymentAmount;
  const debtSettlementRemainingBalance = Math.max(
    0,
    billingBalance - debtSettlementTotalToApply,
  );
  const debtSettlementPreview = buildDebtSettlementPreview({
    groupData,
    paidByPeriodKey,
    discountsByPeriodKey,
    discountAmount: debtSettlementDiscount,
    paymentAmount: Math.min(
      debtSettlementPaymentAmount,
      debtSettlementMaxPayable,
    ),
  });

  const openSettlePaymentModal = (payment: UnifiedPaymentEntry) => {
    setPaymentToSettle(payment);
    setManualPaymentForm({
      amount:
        payment.remainingAmount !== null
          ? payment.remainingAmount.toFixed(2)
          : "",
      method: "CASH",
      reference: "",
      notes: `Saldo pendiente ${String(payment.month).padStart(2, "0")}/${payment.year}`,
    });
  };

  const closeSettlePaymentModal = () => {
    setPaymentToSettle(null);
    setManualPaymentForm({
      amount: "",
      method: "CASH",
      reference: "",
      notes: "",
    });
  };

  const handleOpenDiscount = (payment: UnifiedPaymentEntry) => {
    setDiscountTarget(payment);
    setDiscountAmount(String(payment.remainingAmount ?? ""));
    setDiscountReason("");
    setDiscountError("");
  };

  const handleSubmitDiscount = async () => {
    if (!discountTarget || !groupData) return;
    const amount = parseFloat(discountAmount.replace(",", "."));
    if (!amount || amount <= 0) {
      setDiscountError("Ingresá un monto válido.");
      return;
    }
    const remaining = discountTarget.remainingAmount ?? 0;
    if (amount > remaining) {
      setDiscountError(`El monto no puede superar el saldo pendiente ($${remaining.toFixed(2)}).`);
      return;
    }
    setDiscountSubmitting(true);
    setDiscountError("");
    try {
      await applyDiscount(groupData.id, {
        billingPeriodId: discountTarget.billingPeriodId!,
        amount,
        type: amount >= remaining ? "TOTAL" : "PARTIAL",
        reason: discountReason.trim() || "Bonificación aplicada por operador",
        appliedBy: "admin",
      });
      setDiscountTarget(null);
      dispatch(getGroupDetailThunk(groupData.id));
    } catch (err: any) {
      setDiscountError(err?.response?.data?.message ?? "No se pudo aplicar la bonificación.");
    } finally {
      setDiscountSubmitting(false);
    }
  };

  const handleChargeNow = async (payment: UnifiedPaymentEntry) => {
    if (!payment.billingPeriodId || chargingPeriodId !== null) return;
    setChargingPeriodId(payment.billingPeriodId);
    setChargeNowFeedback(null);
    const result = await dispatch(
      chargeNowForPeriodThunk({
        groupId: parseInt(id, 10),
        billingPeriodId: payment.billingPeriodId,
      }),
    );
    setChargingPeriodId(null);
    if (chargeNowForPeriodThunk.fulfilled.match(result)) {
      setChargeNowFeedback({
        ok: true,
        message: `Cobro de ${String(payment.month).padStart(2, "0")}/${payment.year} procesado correctamente.`,
      });
    } else {
      setChargeNowFeedback({
        ok: false,
        message:
          (result.payload as any)?.message ||
          "Error al procesar el cobro. Revisá los logs del gateway.",
      });
    }
    setTimeout(() => setChargeNowFeedback(null), 6000);
  };

  const handleCheckStatus = async (payment: UnifiedPaymentEntry) => {
    if (!payment.billingPeriodId || checkingPeriodId !== null) return;
    setCheckingPeriodId(payment.billingPeriodId);
    const result = await dispatch(
      checkBillingPeriodSiroStatusThunk({
        groupId: parseInt(id, 10),
        billingPeriodId: payment.billingPeriodId,
      }),
    );
    setCheckingPeriodId(null);
    dispatch(getGroupDetailThunk(parseInt(id, 10)));
    if (checkBillingPeriodSiroStatusThunk.fulfilled.match(result)) {
      setSiroStatusModal(result.payload);
    } else {
      setSiroStatusModal({
        billingPeriodId: payment.billingPeriodId ?? 0,
        billingPeriodStatus: "ERROR",
        message: (result.payload as any)?.message || "Error al consultar el estado SIRO.",
      });
    }
  };

  const handleEditPayment = async (
    payment: UnifiedPaymentEntry,
    fields: { amount?: number; reference?: string; notes?: string },
  ) => {
    const result = await dispatch(
      updateManualPaymentThunk({
        groupId: groupData.id,
        paymentId: payment.id,
        payload: fields,
      }),
    );
    if (updateManualPaymentThunk.rejected.match(result)) {
      throw new Error((result.payload as any)?.message || "Error al actualizar el pago");
    }
  };

  const openDebtSettlementModal = () => {
    if (billingBalance <= 0) {
      return;
    }

    setDebtSettlementForm({
      amount: billingBalance.toFixed(2),
      discountAmount: "0",
      discountReason: "",
      method: "CASH",
      reference: "",
      notes: "Regularización de deuda acumulada",
    });
    setSelectedPaymentMethodId(activeMethods[0]?.id ?? null);
    setShowDebtSettlementModal(true);
  };

  const closeDebtSettlementModal = () => {
    setShowDebtSettlementModal(false);
    setSelectedPaymentMethodId(null);
  };

  const handleSubmitRemainingPayment = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!paymentToSettle?.billingPeriodId) {
      return;
    }

    await dispatch(
      registerManualPaymentThunk({
        groupId: groupData.id,
        payload: {
          amount: Number(manualPaymentForm.amount),
          billingPeriodId: paymentToSettle.billingPeriodId,
          method: manualPaymentForm.method,
          paidAt: new Date().toISOString(),
          reference: manualPaymentForm.reference.trim() || undefined,
          notes: manualPaymentForm.notes.trim() || undefined,
        },
      }),
    ).unwrap();

    closeSettlePaymentModal();
  };

  const handleSubmitDebtSettlementByGateway = async () => {
    if (!selectedPaymentMethodId) return;
    const pendingPeriodIds = (groupData.billingPeriods || [])
      .filter((p) => p.status !== "PAID" && p.status !== "EXEMPT")
      .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      .map((p) => p.id);
    if (!pendingPeriodIds.length) return;

    const result = await dispatch(
      settleDebtByGatewayThunk({
        groupId: groupData.id,
        paymentMethodId: selectedPaymentMethodId,
        billingPeriodIds: pendingPeriodIds,
      }),
    );
    if (settleDebtByGatewayThunk.fulfilled.match(result)) {
      closeDebtSettlementModal();
    }
  };

  const handleSubmitDebtSettlement = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (debtSettlementPaymentExceeded || debtSettlementTotalToApply <= 0) {
      return;
    }

    await dispatch(
      settleDebtThunk({
        groupId: groupData.id,
        payload: {
          amount: debtSettlementPaymentAmount,
          discountAmount: debtSettlementDiscount || undefined,
          discountReason:
            debtSettlementDiscount > 0
              ? debtSettlementForm.discountReason.trim() || undefined
              : undefined,
          method: debtSettlementForm.method,
          paidAt: new Date().toISOString(),
          reference: debtSettlementForm.reference.trim() || undefined,
          notes: debtSettlementForm.notes.trim() || undefined,
        },
      }),
    ).unwrap();

    closeDebtSettlementModal();
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/affiliate-groups")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Volver"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {groupData.name}
            </h1>
            <p className="text-slate-500 mt-1">Grupo ID: #{groupData.id}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Titular</p>
          <p className="text-lg font-semibold text-slate-900">
            {holder?.firstName} {holder?.lastName}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-2 inline-flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("transactions")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "transactions"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Transacciones
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("information")}
          className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "information"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Información
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Plan */}
        <button
          type="button"
          onClick={() => setActiveModal("plans")}
          className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Plan</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {groupData.plan?.name || "N/A"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    planStatus === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-700"
                      : planStatus === "GRACE_PERIOD"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {planStatusLabel}
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {formattedPlanPrice}/mes
                </span>
              </div>
            </div>
            <FileText className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </button>

        {/* Miembros — clickable, muestra titular */}
        <button
          type="button"
          onClick={() => setActiveModal("members")}
          className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-slate-500 text-sm">Miembros</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {groupData.affiliates?.length || 0}
              </p>
              {holder && (
                <div className="mt-2 space-y-0.5">
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {holder.firstName} {holder.lastName}
                    <span className="ml-1.5 text-xs font-normal text-emerald-600">Titular</span>
                  </p>
                  {holder.phone && (
                    <p className="text-xs text-slate-500 truncate">{String(holder.phone)}</p>
                  )}
                  {holder.email && (
                    <p className="text-xs text-slate-500 truncate">{holder.email}</p>
                  )}
                </div>
              )}
            </div>
            <Users className="w-10 h-10 text-emerald-500 opacity-20 flex-shrink-0" />
          </div>
        </button>

        {/* Formas de Pago — clickable, abre PaymentMethodsModal */}
        <button
          type="button"
          onClick={() => setActiveModal("payments")}
          className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-slate-500 text-sm">Formas de Pago</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {activeMethods.length}
              </p>
              {activeMethods.length > 0 ? (
                <div className="mt-2 space-y-0.5">
                  {activeMethods.slice(0, 2).map((m) => (
                    <p key={m.id} className="text-xs text-slate-500 truncate">
                      {m.gateway} · {m.type}
                      {m.priority === 1 && <span className="ml-1 text-amber-600 font-medium">(principal)</span>}
                    </p>
                  ))}
                  {activeMethods.length > 2 && (
                    <p className="text-xs text-slate-400">+{activeMethods.length - 2} más</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-2">Sin métodos activos</p>
              )}
            </div>
            <CreditCard className="w-10 h-10 text-amber-500 opacity-20 flex-shrink-0" />
          </div>
        </button>
      </div>

      {activeTab === "information" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Información del Grupo
                </h2>
                <button
                  onClick={() => setActiveModal("info")}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase text-slate-500 font-semibold">
                      Nombre del Grupo
                    </p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {groupData.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500 font-semibold">
                      Promotor
                    </p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {promoterName}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase text-slate-500 font-semibold">
                      Ciudad
                    </p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {cityLabel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500 font-semibold">
                      Estado
                    </p>
                    <span
                      className={`inline-block mt-1 px-3 py-1 rounded-lg text-sm font-semibold ${
                        groupData.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {groupData.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase text-slate-500 font-semibold">
                      Próximo cobro
                    </p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {nextChargeDate.toLocaleDateString("es-AR")}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Día de cobro: {groupData.chargeDay}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-slate-500 font-semibold">
                      Calificación
                    </p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {groupData.rating}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs uppercase text-slate-500 font-semibold">
                      Fecha de inscripción
                    </p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      {groupData.joinedAt
                        ? new Date(groupData.joinedAt).toLocaleDateString("es-AR")
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Miembros del Grupo
                </h2>
                <button
                  onClick={() => setActiveModal("members")}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Gestionar
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                      <th className="px-4 py-3 text-left">Nombre</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">Telefono</th>
                      <th className="px-4 py-3 text-center">Titular</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {groupData.affiliates?.map((affiliate) => {
                      const whatsappUrl = buildWhatsAppUrl(affiliate.phone);

                      return (
                        <tr
                          key={affiliate.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {formatAffiliateFullName(affiliate)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {affiliate.email ? (
                              <a
                                href={`mailto:${String(affiliate.email).trim()}`}
                                className="text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                {formatDisplayValue(
                                  affiliate.email,
                                  "Sin email",
                                )}
                              </a>
                            ) : (
                              <span className="text-slate-400">Sin email</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {affiliate.phone && whatsappUrl ? (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                                title="Enviar mensaje por WhatsApp"
                              >
                                {formatDisplayValue(
                                  affiliate.phone,
                                  "Sin telefono",
                                )}
                              </a>
                            ) : (
                              <span className="text-slate-400">
                                Sin telefono
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {affiliate.isHolder && (
                              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                Sí
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => setSelectedAffiliate(affiliate)}
                              className="inline-flex items-center justify-center rounded-lg bg-slate-100 p-2 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                              title="Ver mas informacion"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Formas de Pago
                </h2>
                <button
                  onClick={() => setActiveModal("payments")}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Gestionar
                </button>
              </div>

              {activeMethods.length > 0 ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="text-sm font-semibold text-blue-900">
                      La proxima cuota se cobrara automaticamente.
                    </p>
                    <p className="mt-1 text-sm text-blue-700">
                      Metodo programado: {nextAutomaticMethod?.gateway}{" "}
                      {nextAutomaticMethod?.brand
                        ? `- ${nextAutomaticMethod.brand}`
                        : ""}
                      {nextAutomaticMethod?.last4
                        ? ` •••• ${nextAutomaticMethod.last4}`
                        : ""}
                      . Solo se cobrara ahora si el operador ejecuta un cobro
                      manual desde la gestion del grupo.
                    </p>
                  </div>

                  {activeMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <CreditCard className="w-5 h-5 text-amber-500" />
                        <div>
                          <p className="font-semibold text-slate-900">
                            {method.type} - {method.gateway}
                          </p>
                          <p className="text-sm text-slate-500">
                            {method.brand && `${method.brand} `}
                            {method.last4 && `•••• ${method.last4}`}
                            {method.holderName && ` - ${method.holderName}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {method.expiresAt && (
                          <p className="text-xs text-slate-500">
                            Vence:{" "}
                            {new Date(method.expiresAt).toLocaleDateString(
                              "es-AR",
                            )}
                          </p>
                        )}
                        <span className="inline-block mt-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                          Activo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">
                  No hay formas de pago registradas
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Estado General
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">Proxima cuota</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      nextAutomaticMethod
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {nextAutomaticMethod
                      ? `Automatico por ${nextAutomaticMethod.gateway}`
                      : "Sin debito automatico"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    Período de Gracia
                  </span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      groupData.gracePeriodEndsAt
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {groupData.gracePeriodEndsAt ? "Activo" : "No"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {transactionsView === "billing" ? "Transacciones" : "Movimientos"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {transactionsView === "billing"
                  ? "Historial completo de facturación, pagos y saldo por período."
                  : "Historial completo de cobros automáticos, fallos y movimientos de cuenta corriente, ordenados por fecha."}
              </p>
            </div>
            <div className="bg-slate-100 rounded-lg p-1 inline-flex gap-1">
              <button
                type="button"
                onClick={() => setTransactionsView("billing")}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  transactionsView === "billing"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Transacciones
              </button>
              <button
                type="button"
                onClick={() => setTransactionsView("movements")}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  transactionsView === "movements"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Movimientos
              </button>
            </div>
          </div>

          {transactionsView === "billing" ? (
            <>
              {chargeNowFeedback && (
                <div
                  className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${
                    chargeNowFeedback.ok
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {chargeNowFeedback.message}
                </div>
              )}
              <BillingContent
                groupData={groupData}
                onPayRemaining={nextAutomaticMethod ? handleChargeNow : openSettlePaymentModal}
                onCheckStatus={handleCheckStatus}
                onApplyDiscount={handleOpenDiscount}
                onEditPayment={handleEditPayment}
                chargeLabel={nextAutomaticMethod ? "Cobrar" : "Pagar"}
                chargingPeriodId={chargingPeriodId}
                checkingPeriodId={checkingPeriodId}
                billingBalance={billingBalance}
                onOpenDebtSettlement={openDebtSettlementModal}
              />
            </>
          ) : (
            <MovementsContent groupData={groupData} />
          )}
        </div>
      )}

      {activeModal === "info" && (
        <GroupInfoModal
          groupData={groupData}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "members" && (
        <MembersModal
          groupData={groupData}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "payments" && (
        <PaymentMethodsModal
          groupData={groupData}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "plans" && (
        <PlansModal
          groupData={groupData}
          onClose={() => setActiveModal(null)}
        />
      )}

      {selectedAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {formatAffiliateFullName(selectedAffiliate)}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Detalle completo del miembro
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAffiliate(null)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                Cerrar
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  DNI
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatDisplayValue(
                    selectedAffiliate.documentNumber,
                    "Sin DNI",
                  )}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Fecha de nacimiento
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatDateValue(selectedAffiliate.birthDate)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Email
                </p>
                <p className="mt-1 break-all text-lg font-semibold text-slate-900">
                  {formatDisplayValue(selectedAffiliate.email, "Sin email")}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Telefono
                </p>
                <div className="mt-1">
                  {selectedAffiliate.phone ? (
                    <a
                      href={
                        buildWhatsAppUrl(selectedAffiliate.phone) || undefined
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="text-lg font-semibold text-emerald-700 hover:underline"
                    >
                      {formatDisplayValue(
                        selectedAffiliate.phone,
                        "Sin telefono",
                      )}
                    </a>
                  ) : (
                    <p className="text-lg font-semibold text-slate-900">
                      Sin telefono
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Direccion
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatDisplayValue(
                    selectedAffiliate.address,
                    "Sin direccion",
                  )}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Titular
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {selectedAffiliate.isHolder ? "Sí" : "No"}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Verificacion
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {selectedAffiliate.isVerified ? "Verificado" : "Pendiente"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentToSettle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Registrar pago pendiente
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Saldar {String(paymentToSettle.month).padStart(2, "0")}/
                  {paymentToSettle.year}
                </p>
              </div>
              <button
                type="button"
                onClick={closeSettlePaymentModal}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                Cerrar
              </button>
            </div>

            <form
              className="space-y-4 px-6 py-6"
              onSubmit={handleSubmitRemainingPayment}
            >
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Saldo pendiente
                </p>
                <p className="mt-1 text-lg font-bold text-amber-700">
                  ${Number(paymentToSettle.remainingAmount ?? 0).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Monto a pagar
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={Number(paymentToSettle.remainingAmount ?? 0)}
                  value={manualPaymentForm.amount}
                  onChange={(e) =>
                    setManualPaymentForm((current) => ({
                      ...current,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Método
                </label>
                <select
                  value={manualPaymentForm.method}
                  onChange={(e) =>
                    setManualPaymentForm((current) => ({
                      ...current,
                      method: e.target.value as "CARD" | "CASH" | "TRANSFER",
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASH">Efectivo</option>
                  <option value="TRANSFER">Transferencia</option>
                  {activeMethods.some(
                    (pm) => pm.type?.toUpperCase() === "CARD" || pm.gateway === "PAYWAY" || pm.gateway === "MOBBEX",
                  ) && <option value="CARD">Tarjeta</option>}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Referencia
                </label>
                <input
                  type="text"
                  value={manualPaymentForm.reference}
                  onChange={(e) =>
                    setManualPaymentForm((current) => ({
                      ...current,
                      reference: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Comprobante u observación breve"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Notas
                </label>
                <textarea
                  value={manualPaymentForm.notes}
                  onChange={(e) =>
                    setManualPaymentForm((current) => ({
                      ...current,
                      notes: e.target.value,
                    }))
                  }
                  className="min-h-24 w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeSettlePaymentModal}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Registrar pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {siroStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${siroStatusModal.isError ? "bg-red-100" : "bg-amber-100"}`}>
                  <span className="text-lg">{siroStatusModal.isError ? "❌" : "🔍"}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Estado SIRO</h3>
                  <p className="text-xs text-slate-500">
                    {siroStatusModal.nroTransaccion ? `Transacción #${siroStatusModal.nroTransaccion}` : "Consulta de estado"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSiroStatusModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-6 space-y-4">
              {siroStatusModal.message && !siroStatusModal.estado && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {siroStatusModal.message}
                </div>
              )}

              {siroStatusModal.estado && (
                <>
                  <div className={`rounded-xl border px-4 py-3 ${siroStatusModal.isError ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Estado</p>
                    <p className={`text-base font-bold ${siroStatusModal.isError ? "text-red-700" : "text-amber-700"}`}>
                      {siroStatusModal.estado}
                    </p>
                    {siroStatusModal.estadoLabel && (
                      <p className="mt-1 text-sm text-slate-600">{siroStatusModal.estadoLabel}</p>
                    )}
                  </div>

                  {typeof siroStatusModal.cantidadErrores === "number" && siroStatusModal.cantidadErrores > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-red-500 mb-1">Registros con error</p>
                      <p className="text-lg font-bold text-red-700">{siroStatusModal.cantidadErrores}</p>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-1">Estado del período</p>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                      siroStatusModal.billingPeriodStatus === "FAILED"
                        ? "bg-red-100 text-red-700"
                        : siroStatusModal.billingPeriodStatus === "IN_PROGRESS"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                    }`}>
                      {siroStatusModal.billingPeriodStatus === "IN_PROGRESS"
                        ? "En proceso"
                        : siroStatusModal.billingPeriodStatus === "FAILED"
                          ? "Fallido"
                          : siroStatusModal.billingPeriodStatus}
                    </span>
                    {siroStatusModal.billingPeriodStatus === "FAILED" && (
                      <p className="mt-2 text-xs text-red-600">El período fue marcado como fallido por errores reportados por SIRO.</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setSiroStatusModal(null)}
                className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showDebtSettlementModal && (() => {
        const hasAutoMethods = activeMethods.length > 0;
        const pendingPeriods = (groupData.billingPeriods || [])
          .filter((p) => p.status !== "PAID" && p.status !== "EXEMPT")
          .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center p-0 sm:p-4">
            <div className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${hasAutoMethods ? "bg-blue-100" : "bg-amber-100"}`}>
                    <span className="text-lg">{hasAutoMethods ? "💳" : "💵"}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Regularizar deuda
                    </h3>
                    <p className="text-xs text-slate-500">
                      {hasAutoMethods
                        ? "Cobro automático — seleccioná el método y confirmá"
                        : "Registrá el pago manual recibido"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDebtSettlementModal}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1">

                {/* Resumen de deuda */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                  <div className="px-6 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Deuda total</p>
                    <p className="mt-1 text-2xl font-bold text-red-600">${billingBalance.toFixed(2)}</p>
                    <p className="text-xs text-slate-400">{pendingPeriods.length} período{pendingPeriods.length !== 1 ? "s" : ""} pendiente{pendingPeriods.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">A cobrar</p>
                    <p className="mt-1 text-2xl font-bold text-blue-700">
                      ${hasAutoMethods ? billingBalance.toFixed(2) : debtSettlementTotalToApply.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">{hasAutoMethods ? "deuda completa" : "luego de bonificación"}</p>
                  </div>
                  <div className="px-6 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Saldo restante</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-700">
                      ${hasAutoMethods ? "0.00" : debtSettlementRemainingBalance.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">proyectado luego del cobro</p>
                  </div>
                </div>

                <div className="grid gap-0 lg:grid-cols-[1fr_380px] divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

                  {/* Panel izquierdo: períodos */}
                  <div className="px-6 py-5 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Períodos a cobrar
                    </h4>
                    <div className="space-y-2">
                      {pendingPeriods.map((period) => (
                        <div
                          key={period.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600">
                              {String(period.month).padStart(2, "0")}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {String(period.month).padStart(2, "0")}/{period.year}
                              </p>
                              <p className="text-xs text-slate-400">
                                Vence {new Date(period.dueDate).toLocaleDateString("es-AR")}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-900">
                              ${Number(period.amountDue || 0).toFixed(2)}
                            </p>
                            <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                              {period.status}
                            </span>
                          </div>
                        </div>
                      ))}
                      {pendingPeriods.length === 0 && (
                        <p className="text-sm text-slate-400 py-4 text-center">No hay períodos pendientes</p>
                      )}
                    </div>

                    {/* Preview imputación (solo modo manual) */}
                    {!hasAutoMethods && debtSettlementPreview.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Vista previa de imputación
                        </h4>
                        {debtSettlementPreview.map((item) => (
                          <div key={item.billingPeriodId} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-slate-900">{item.periodLabel}</span>
                              <span className="text-xs text-slate-400">Saldo: ${item.remainingAmount.toFixed(2)}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="rounded-lg bg-blue-50 px-2 py-1.5 text-center">
                                <p className="font-semibold text-blue-600">-${item.discountApplied.toFixed(2)}</p>
                                <p className="text-slate-400 mt-0.5">Bonif.</p>
                              </div>
                              <div className="rounded-lg bg-emerald-50 px-2 py-1.5 text-center">
                                <p className="font-semibold text-emerald-700">${item.paymentApplied.toFixed(2)}</p>
                                <p className="text-slate-400 mt-0.5">Cobro</p>
                              </div>
                              <div className="rounded-lg bg-amber-50 px-2 py-1.5 text-center">
                                <p className="font-semibold text-amber-700">${item.projectedRemaining.toFixed(2)}</p>
                                <p className="text-slate-400 mt-0.5">Queda</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Panel derecho: acción */}
                  <div className="px-6 py-5 space-y-5">

                    {hasAutoMethods ? (
                      /* MODO AUTOMÁTICO */
                      <>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                            Cobrar con
                          </h4>
                          <div className="space-y-2">
                            {activeMethods.map((method) => {
                              const isSelected = selectedPaymentMethodId === method.id;
                              const isCbu = method.type === "CBU";
                              return (
                                <button
                                  key={method.id}
                                  type="button"
                                  onClick={() => setSelectedPaymentMethodId(method.id)}
                                  className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                                    isSelected
                                      ? "border-blue-500 bg-blue-50"
                                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                  }`}
                                >
                                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${isSelected ? "bg-blue-100" : "bg-slate-100"}`}>
                                    <span className="text-lg">{isCbu ? "🏦" : "💳"}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">
                                      {isCbu
                                        ? `CBU ${method.holderName || ""}`
                                        : `${method.brand || method.gateway} •••• ${method.last4 || "****"}`}
                                    </p>
                                    <p className="text-xs text-slate-400 truncate">
                                      {method.gateway}
                                      {!isCbu && method.expiresAt
                                        ? ` · Vence ${new Date(method.expiresAt).toLocaleDateString("es-AR", { month: "2-digit", year: "2-digit" })}`
                                        : ""}
                                      {!isCbu && method.holderName ? ` · ${method.holderName}` : ""}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <div className="h-5 w-5 flex-shrink-0 rounded-full bg-blue-500 flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">✓</span>
                                    </div>
                                  )}
                                  {method.priority === 1 && !isSelected && (
                                    <span className="flex-shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                      Principal
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Períodos a cobrar</span>
                            <span>{pendingPeriods.length}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between font-bold text-slate-900 text-base">
                            <span>Total a cobrar</span>
                            <span className="text-blue-700">${billingBalance.toFixed(2)}</span>
                          </div>
                          <p className="mt-2 text-[11px] text-slate-400">
                            Se realizará un intento de cobro por cada período pendiente, del más viejo al más nuevo.
                          </p>
                        </div>

                        <div className="flex gap-3 pt-1">
                          <button
                            type="button"
                            onClick={closeDebtSettlementModal}
                            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={loading || !selectedPaymentMethodId || pendingPeriods.length === 0}
                            onClick={handleSubmitDebtSettlementByGateway}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                          >
                            {loading ? (
                              <>
                                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Procesando...
                              </>
                            ) : (
                              `Cobrar $${billingBalance.toFixed(2)}`
                            )}
                          </button>
                        </div>
                      </>
                    ) : (
                      /* MODO MANUAL */
                      <form onSubmit={handleSubmitDebtSettlement} className="space-y-4">
                        <div className="grid gap-4 grid-cols-2">
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                              Bonificación
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              max={billingBalance}
                              value={debtSettlementForm.discountAmount}
                              onChange={(e) =>
                                setDebtSettlementForm((current) => ({
                                  ...current,
                                  discountAmount: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                              Monto a cobrar
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              max={debtSettlementMaxPayable}
                              value={debtSettlementForm.amount}
                              onChange={(e) =>
                                setDebtSettlementForm((current) => ({
                                  ...current,
                                  amount: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                            <p className="mt-1 text-[11px] text-slate-400">
                              Máx: ${debtSettlementMaxPayable.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {debtSettlementDiscount > 0 && (
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                              Motivo bonificación
                            </label>
                            <input
                              type="text"
                              value={debtSettlementForm.discountReason}
                              onChange={(e) =>
                                setDebtSettlementForm((current) => ({
                                  ...current,
                                  discountReason: e.target.value,
                                }))
                              }
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Ej. Regularización comercial"
                            />
                          </div>
                        )}

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                            Método de pago
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {(["CASH", "TRANSFER", "CARD"] as const)
                              .filter((m) => {
                                if (m === "CARD") {
                                  return activeMethods.some(
                                    (pm) => pm.type?.toUpperCase() === "CARD" || pm.gateway === "PAYWAY" || pm.gateway === "MOBBEX",
                                  );
                                }
                                return true;
                              })
                              .map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => setDebtSettlementForm((c) => ({ ...c, method: m }))}
                                  className={`rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all ${
                                    debtSettlementForm.method === m
                                      ? "border-blue-500 bg-blue-50 text-blue-700"
                                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                                  }`}
                                >
                                  {m === "CASH" ? "Efectivo" : m === "TRANSFER" ? "Transferencia" : "Tarjeta"}
                                </button>
                              ))}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                            Referencia <span className="text-slate-400 font-normal">(opcional)</span>
                          </label>
                          <input
                            type="text"
                            value={debtSettlementForm.reference}
                            onChange={(e) =>
                              setDebtSettlementForm((current) => ({
                                ...current,
                                reference: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Comprobante, recibo…"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                            Notas <span className="text-slate-400 font-normal">(opcional)</span>
                          </label>
                          <textarea
                            value={debtSettlementForm.notes}
                            onChange={(e) =>
                              setDebtSettlementForm((current) => ({
                                ...current,
                                notes: e.target.value,
                              }))
                            }
                            rows={2}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>

                        {debtSettlementPaymentExceeded && (
                          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                            El monto supera el saldo disponible luego de la bonificación.
                          </div>
                        )}

                        <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm space-y-1.5">
                          <div className="flex justify-between text-slate-500">
                            <span>Bonificación</span>
                            <span>-${debtSettlementDiscount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>Cobro ahora</span>
                            <span>${debtSettlementPaymentAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                            <span>Saldo restante</span>
                            <span className={debtSettlementRemainingBalance > 0 ? "text-amber-700" : "text-emerald-700"}>
                              ${debtSettlementRemainingBalance.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-1">
                          <button
                            type="button"
                            onClick={closeDebtSettlementModal}
                            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={
                              loading ||
                              debtSettlementPaymentExceeded ||
                              debtSettlementTotalToApply <= 0
                            }
                            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                          >
                            {loading ? "Guardando..." : "Registrar pago"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Discount modal */}
      {discountTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl mx-4">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-800">Aplicar Bonificación</h3>
              <button
                type="button"
                onClick={() => setDiscountTarget(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="rounded-xl bg-violet-50 border border-violet-200 px-4 py-3 text-sm text-violet-800">
                <div className="font-medium">
                  Período {String(discountTarget.month).padStart(2, "0")}/{discountTarget.year}
                </div>
                <div className="text-violet-600 mt-0.5">
                  Saldo pendiente: <span className="font-semibold">${(discountTarget.remainingAmount ?? 0).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Monto a bonificar ($)
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={discountTarget.remainingAmount ?? undefined}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Motivo <span className="text-slate-400">(opcional)</span>
                </label>
                <textarea
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  placeholder="Ej: deuda antigua, acuerdo con el socio..."
                />
              </div>

              {discountError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
                  {discountError}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setDiscountTarget(null)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSubmitDiscount}
                  disabled={discountSubmitting}
                  className="flex-1 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-50"
                >
                  {discountSubmitting ? "Aplicando..." : "Aplicar Bonificación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateGroupsDetailContainer;
