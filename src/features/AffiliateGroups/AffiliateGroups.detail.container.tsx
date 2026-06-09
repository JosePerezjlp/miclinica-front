import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  CreditCard,
  DollarSign,
  Eye,
  Edit2,
  FileText,
  Plus,
  Users,
} from "lucide-react";
import type { AppDispatch, RootState } from "../../store/store";
import {
  getGroupDetailThunk,
  registerManualPaymentThunk,
  settleDebtThunk,
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

type DetailTab = "information" | "transactions";
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

const clampChargeDay = (year: number, month: number, chargeDay: number) => {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  return Math.min(Math.max(chargeDay, 1), lastDayOfMonth);
};

const calculateNextChargeDate = (chargeDay: number, now = new Date()) => {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentMonthDay = clampChargeDay(currentYear, currentMonth, chargeDay);
  const currentCandidate = new Date(currentYear, currentMonth, currentMonthDay);

  if (currentCandidate.getTime() > now.getTime()) {
    return currentCandidate;
  }

  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
  const nextMonthDay = clampChargeDay(
    nextMonthDate.getFullYear(),
    nextMonthDate.getMonth(),
    chargeDay,
  );

  return new Date(
    nextMonthDate.getFullYear(),
    nextMonthDate.getMonth(),
    nextMonthDay,
  );
};

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

  const billingBalance =
    Number(
      groupData.currentAccount?.balanceCapital ?? computedPendingBalance,
    ) || 0;
  const formattedPlanPrice = groupData.plan
    ? `$${Number(groupData.plan.monthlyFee).toFixed(2)}`
    : "Sin precio";
  const nextChargeDate = calculateNextChargeDate(groupData.chargeDay);
  const promoterName = groupData.promoter?.name?.trim() || "Sin promotor";
  const cityLabel = "No informada";
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
    setShowDebtSettlementModal(true);
  };

  const closeDebtSettlementModal = () => {
    setShowDebtSettlementModal(false);
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Miembros</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {groupData.affiliates?.length || 0}
              </p>
            </div>
            <Users className="w-10 h-10 text-emerald-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Formas de Pago</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {activeMethods.length}
              </p>
            </div>
            <CreditCard className="w-10 h-10 text-amber-500 opacity-20" />
          </div>
        </div>

        <button
          type="button"
          onClick={openDebtSettlementModal}
          disabled={billingBalance <= 0}
          className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500 text-left transition-colors hover:bg-red-50 disabled:cursor-default disabled:hover:bg-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Saldo Cuenta</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                ${billingBalance.toFixed(2)}
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                {billingBalance > 0
                  ? "Click para regularizar saldo pendiente"
                  : "Sin deuda pendiente"}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-red-500 opacity-20" />
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
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">Transacciones</h2>
            <p className="mt-1 text-sm text-slate-500">
              Historial completo de facturación, pagos y saldo por período.
            </p>
          </div>

          <BillingContent
            groupData={groupData}
            onPayRemaining={
              nextAutomaticMethod ? undefined : openSettlePaymentModal
            }
          />
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
                  <option value="CASH">CASH</option>
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="CARD">CARD</option>
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

      {showDebtSettlementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Regularizar deuda acumulada
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Aplicá bonificación y definí cuánto cobrar ahora. La
                  imputación se hace del período más viejo al más nuevo.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDebtSettlementModal}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                Cerrar
              </button>
            </div>

            <form
              className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_360px]"
              onSubmit={handleSubmitDebtSettlement}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Deuda actual
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      ${billingBalance.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase text-blue-700">
                      Total a regularizar
                    </p>
                    <p className="mt-1 text-lg font-bold text-blue-900">
                      ${debtSettlementTotalToApply.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-xs font-semibold uppercase text-amber-700">
                      Saldo remanente
                    </p>
                    <p className="mt-1 text-lg font-bold text-amber-900">
                      ${debtSettlementRemainingBalance.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">
                      Bonificación total
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
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">
                      Monto a cobrar ahora
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
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Máximo cobrable luego de bonificación: $
                      {debtSettlementMaxPayable.toFixed(2)}
                    </p>
                  </div>
                </div>

                {debtSettlementDiscount > 0 && (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-900">
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
                      className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ej. Regularización comercial"
                    />
                  </div>
                )}

                {debtSettlementPaymentExceeded && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    El monto a cobrar supera el saldo que queda luego de aplicar
                    la bonificación.
                  </div>
                )}

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                      Desglose por período
                    </h4>
                    <span className="text-xs text-slate-500">
                      Vista previa de imputación
                    </span>
                  </div>

                  {debtSettlementPreview.length > 0 ? (
                    <div className="space-y-3">
                      {debtSettlementPreview.map((item) => (
                        <div
                          key={item.billingPeriodId}
                          className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {item.periodLabel}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Vence {item.dueDate}
                              </p>
                            </div>
                            <div className="text-right text-xs text-slate-500">
                              <p>
                                Saldo actual: ${item.remainingAmount.toFixed(2)}
                              </p>
                              <p>Cuota: ${item.amountDue.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <div className="rounded-lg bg-white px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase text-slate-500">
                                Bonificación
                              </p>
                              <p className="mt-1 font-semibold text-blue-700">
                                ${item.discountApplied.toFixed(2)}
                              </p>
                            </div>
                            <div className="rounded-lg bg-white px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase text-slate-500">
                                Cobro
                              </p>
                              <p className="mt-1 font-semibold text-emerald-700">
                                ${item.paymentApplied.toFixed(2)}
                              </p>
                            </div>
                            <div className="rounded-lg bg-white px-3 py-2">
                              <p className="text-[11px] font-semibold uppercase text-slate-500">
                                Saldo proyectado
                              </p>
                              <p className="mt-1 font-semibold text-amber-700">
                                ${item.projectedRemaining.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500">
                      Ingresá una bonificación o un monto a cobrar para ver cómo
                      se va a imputar por período.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Método de pago
                  </label>
                  <select
                    value={debtSettlementForm.method}
                    onChange={(e) =>
                      setDebtSettlementForm((current) => ({
                        ...current,
                        method: e.target.value as "CARD" | "CASH" | "TRANSFER",
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">CASH</option>
                    <option value="TRANSFER">TRANSFER</option>
                    <option value="CARD">CARD</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Referencia
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
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Comprobante, transferencia o recibo"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-900">
                    Notas
                  </label>
                  <textarea
                    value={debtSettlementForm.notes}
                    onChange={(e) =>
                      setDebtSettlementForm((current) => ({
                        ...current,
                        notes: e.target.value,
                      }))
                    }
                    className="min-h-24 w-full rounded-lg border border-slate-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Bonificación</span>
                    <span>${debtSettlementDiscount.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>Cobro ahora</span>
                    <span>${debtSettlementPaymentAmount.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between font-bold text-slate-900">
                    <span>Saldo restante</span>
                    <span>${debtSettlementRemainingBalance.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeDebtSettlementModal}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
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
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Guardando..." : "Regularizar deuda"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AffiliateGroupsDetailContainer;
