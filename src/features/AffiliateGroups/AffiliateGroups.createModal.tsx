import React, { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { mobbexService } from "../../api/mobbex.service";
import { plansService } from "../../api/plans.service";
import { promotersService } from "../../api/promoters.service";
import {
  paymentGatewayOptions,
  provinceOptions,
  sellerOptions,
  cityOptions,
} from "./AffiliateGroups.constants";
import type {
  AutomaticAffiliateGroupFormData,
  CardType,
  CashAffiliateGroupFormData,
  CashMember,
  CreateGroupSubmitResult,
  CreateAffiliateGroupModalPayload,
  MobbexSubscriptionSummary,
  PaymentMode,
  PaymentGatewayProvider,
} from "./AffiliateGroups.types";
import type { PlanResponse } from "../Plans/Plans.types";
import type { PromoterResponse } from "../Promoters/Promoters.types";

interface CreateAffiliateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateAffiliateGroupModalPayload,
  ) =>
    | Promise<CreateGroupSubmitResult | undefined>
    | CreateGroupSubmitResult
    | undefined;
}

const PAYWAY_DEVICE_FINGERPRINT_STORAGE_KEY =
  "miclinica.payway.deviceFingerprintId";

function buildPaywayDeviceFingerprintId(): string {
  const randomPart =
    typeof window !== "undefined" && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const timeZone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone.replace(/[^a-zA-Z0-9]/g, "")
          .slice(0, 16)
      : "local";

  return `payway-${timeZone || "local"}-${randomPart}`.slice(0, 64);
}

function getOrCreatePaywayDeviceFingerprintId(): string {
  if (typeof window === "undefined") {
    return buildPaywayDeviceFingerprintId();
  }

  try {
    const stored = window.localStorage.getItem(
      PAYWAY_DEVICE_FINGERPRINT_STORAGE_KEY,
    );
    if (stored) {
      return stored;
    }

    const created = buildPaywayDeviceFingerprintId();
    window.localStorage.setItem(PAYWAY_DEVICE_FINGERPRINT_STORAGE_KEY, created);
    return created;
  } catch {
    return buildPaywayDeviceFingerprintId();
  }
}

function formatPlanLabel(plan: PlanResponse): string {
  const amount = Number(plan.monthlyFee);

  return `${plan.name} - ${new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number.isNaN(amount) ? 0 : amount)}`;
}

const AffiliateGroupsCreateModal: React.FC<CreateAffiliateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [mode, setMode] = useState<PaymentMode>("automatic");
  const [cardType, setCardType] = useState<CardType>("prepaid");

  // Automatic payment form
  const [autoData, setAutoData] = useState<
    Omit<AutomaticAffiliateGroupFormData, "mode" | "cardType">
  >({
    gateway: paymentGatewayOptions[0].value,
    plan: "",
    planId: undefined,
    mobbexSubscriptionId: "",
    mobbexWebhook: "",
    paymentMethod: "card",
    cbu: "",
    cardNumber: "",
    cardMonth: "",
    cardYear: "",
    cardCvv: "",
    firstName: "",
    lastName: "",
    dni: "",
    province: provinceOptions[0],
    city: cityOptions[0],
    email: "",
    postalCode: "",
    address: "",
    phone: "",
    deviceFingerprintId: "",
  });
  const [mobbexSubscriptions, setMobbexSubscriptions] = useState<
    MobbexSubscriptionSummary[]
  >([]);
  const [localPlans, setLocalPlans] = useState<PlanResponse[]>([]);
  const [localPromoters, setLocalPromoters] = useState<PromoterResponse[]>([]);
  const [isLoadingLocalPlans, setIsLoadingLocalPlans] = useState(false);
  const [isLoadingPromoters, setIsLoadingPromoters] = useState(false);
  const [localPlansError, setLocalPlansError] = useState("");
  const [promotersError, setPromotersError] = useState("");
  const [isLoadingMobbexSubscriptions, setIsLoadingMobbexSubscriptions] =
    useState(false);
  const [mobbexSubscriptionsError, setMobbexSubscriptionsError] = useState("");
  const [generatedMobbexLink, setGeneratedMobbexLink] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

  // Cash payment form
  const [cashData, setCashData] = useState<
    Omit<CashAffiliateGroupFormData, "mode" | "members">
  >({
    promoterId: undefined,
    promoterName: "",
    seller: sellerOptions[0],
    plan: "",
    planId: undefined,
    planAmount: undefined,
    city: cityOptions[0],
  });

  const [members, setMembers] = useState<CashMember[]>([
    {
      id: 1,
      firstName: "",
      lastName: "",
      birthDate: "",
      dni: "",
      address: "",
      email: "",
      phone: "",
      inscriptionDate: "",
      validated: false,
    },
  ]);

  const [memberIdCounter, setMemberIdCounter] = useState(2);

  const handleAutoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setAutoData((prev) => {
      if (name === "gateway") {
        const gateway = value as PaymentGatewayProvider;
        const paymentMethod = gateway === "SIRO" ? "cbu" : "card";

        if (gateway === "MOBBEX") {
          return {
            ...prev,
            gateway,
            planId: undefined,
            paymentMethod: "card",
          };
        }

        const firstLocalPlan = localPlans[0];
        return {
          ...prev,
          gateway,
          paymentMethod,
          planId: firstLocalPlan?.id,
          plan: firstLocalPlan?.name ?? prev.plan,
        };
      }

      if (name === "planId") {
        const selectedPlan = localPlans.find(
          (plan) => plan.id === Number(value),
        );
        return {
          ...prev,
          planId: selectedPlan?.id,
          plan: selectedPlan?.name ?? prev.plan,
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const handleCashChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCashData((prev) => {
      if (name === "promoterId") {
        const selectedPromoter = localPromoters.find(
          (promoter) => promoter.id === Number(value),
        );

        return {
          ...prev,
          promoterId: selectedPromoter?.id,
          promoterName: selectedPromoter?.name ?? prev.promoterName,
        };
      }

      if (name === "planId") {
        const selectedPlan = localPlans.find(
          (plan) => plan.id === Number(value),
        );
        return {
          ...prev,
          planId: selectedPlan?.id,
          plan: selectedPlan?.name ?? prev.plan,
          planAmount: selectedPlan
            ? Number(selectedPlan.monthlyFee)
            : prev.planAmount,
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const handleMobbexPlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subscription = mobbexSubscriptions.find(
      (item) => item.uid === e.target.value,
    );

    setAutoData((prev) => ({
      ...prev,
      mobbexSubscriptionId: e.target.value,
      mobbexWebhook: subscription?.webhook ?? "",
      plan: subscription?.name ?? prev.plan,
    }));
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const loadLocalPlans = async () => {
      setIsLoadingLocalPlans(true);
      setLocalPlansError("");

      try {
        const items = await plansService.list();
        if (cancelled) {
          return;
        }

        const activePlans = items.filter((plan) => plan.isActive);
        setLocalPlans(activePlans);

        const firstPlan = activePlans[0];

        if (firstPlan) {
          setAutoData((prev) => {
            if (prev.gateway === "MOBBEX" || prev.planId) {
              return prev;
            }

            return {
              ...prev,
              planId: firstPlan.id,
              plan: firstPlan.name,
            };
          });

          setCashData((prev) => {
            if (prev.planId) {
              return prev;
            }

            return {
              ...prev,
              planId: firstPlan.id,
              plan: firstPlan.name,
              planAmount: Number(firstPlan.monthlyFee),
            };
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLocalPlans([]);
        setLocalPlansError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los planes locales.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingLocalPlans(false);
        }
      }
    };

    const loadPromoters = async () => {
      setIsLoadingPromoters(true);
      setPromotersError("");

      try {
        const items = await promotersService.list();
        if (cancelled) {
          return;
        }

        const activePromoters = items.filter((promoter) => promoter.isActive);
        setLocalPromoters(activePromoters);

        const firstPromoter = activePromoters[0];
        if (firstPromoter) {
          setCashData((prev) => {
            if (prev.promoterId) {
              return prev;
            }

            return {
              ...prev,
              promoterId: firstPromoter.id,
              promoterName: firstPromoter.name,
            };
          });
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLocalPromoters([]);
        setPromotersError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los promotores.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingPromoters(false);
        }
      }
    };

    void loadLocalPlans();
    void loadPromoters();

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (mode !== "automatic") {
      return;
    }

    if (autoData.gateway !== "PAYWAY" || autoData.deviceFingerprintId) {
      return;
    }

    setAutoData((prev) => {
      if (prev.gateway !== "PAYWAY" || prev.deviceFingerprintId) {
        return prev;
      }

      return {
        ...prev,
        deviceFingerprintId: getOrCreatePaywayDeviceFingerprintId(),
      };
    });
  }, [mode, autoData.gateway, autoData.deviceFingerprintId]);

  useEffect(() => {
    if (mode !== "automatic" || autoData.gateway === "MOBBEX") {
      return;
    }

    if (autoData.planId || localPlans.length === 0) {
      return;
    }

    const firstPlan = localPlans[0];
    setAutoData((prev) => ({
      ...prev,
      planId: firstPlan.id,
      plan: firstPlan.name,
    }));
  }, [mode, autoData.gateway, autoData.planId, localPlans]);

  useEffect(() => {
    if (mode !== "cash") {
      return;
    }

    if (cashData.planId || localPlans.length === 0) {
      return;
    }

    const firstPlan = localPlans[0];
    setCashData((prev) => ({
      ...prev,
      planId: firstPlan.id,
      plan: firstPlan.name,
      planAmount: Number(firstPlan.monthlyFee),
    }));
  }, [mode, cashData.planId, localPlans]);

  useEffect(() => {
    if (!isOpen || mode !== "automatic" || autoData.gateway !== "MOBBEX") {
      return;
    }

    let cancelled = false;

    const loadSubscriptions = async () => {
      setIsLoadingMobbexSubscriptions(true);
      setMobbexSubscriptionsError("");

      try {
        const items = await mobbexService.searchSubscriptions();
        if (cancelled) {
          return;
        }

        setMobbexSubscriptions(items);
        setAutoData((prev) => {
          const selected = items.find(
            (item) => item.uid === prev.mobbexSubscriptionId,
          );

          if (selected) {
            return {
              ...prev,
              plan: selected.name,
              mobbexWebhook: selected.webhook,
            };
          }

          const first = items[0];
          if (!first) {
            return {
              ...prev,
              mobbexSubscriptionId: "",
              mobbexWebhook: "",
            };
          }

          return {
            ...prev,
            plan: first.name,
            planId: undefined,
            mobbexSubscriptionId: first.uid,
            mobbexWebhook: first.webhook,
          };
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setMobbexSubscriptions([]);
        setMobbexSubscriptionsError(
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los planes de Mobbex.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingMobbexSubscriptions(false);
        }
      }
    };

    void loadSubscriptions();

    return () => {
      cancelled = true;
    };
  }, [isOpen, mode, autoData.gateway]);

  const handleMemberChange = (
    memberId: number,
    field: keyof CashMember,
    value: unknown,
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, [field]: value } : m)),
    );
  };

  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      {
        id: memberIdCounter,
        firstName: "",
        lastName: "",
        birthDate: "",
        dni: "",
        address: "",
        email: "",
        phone: "",
        inscriptionDate: "",
        validated: false,
      },
    ]);
    setMemberIdCounter((prev) => prev + 1);
  };

  const removeMember = (memberId: number) => {
    if (members.length > 1) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    }
  };

  const handleSubmitAuto = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await onSubmit({ mode: "automatic", cardType, ...autoData });

    if (autoData.gateway === "MOBBEX" && result?.mobbexSourceUrl) {
      setGeneratedMobbexLink(result.mobbexSourceUrl);
      setCopyFeedback("");
      return;
    }

    resetForms();
    onClose();
  };

  const handleSubmitCash = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ mode: "cash", ...cashData, members });
    resetForms();
    onClose();
  };

  const resetForms = () => {
    setAutoData({
      gateway: paymentGatewayOptions[0].value,
      plan: localPlans[0]?.name ?? "",
      planId: localPlans[0]?.id,
      mobbexSubscriptionId: "",
      mobbexWebhook: "",
      paymentMethod: "card",
      cbu: "",
      cardNumber: "",
      cardMonth: "",
      cardYear: "",
      cardCvv: "",
      firstName: "",
      lastName: "",
      dni: "",
      province: provinceOptions[0],
      city: cityOptions[0],
      email: "",
      postalCode: "",
      address: "",
      phone: "",
      deviceFingerprintId: "",
    });
    setMobbexSubscriptions([]);
    setLocalPlansError("");
    setMobbexSubscriptionsError("");
    setGeneratedMobbexLink("");
    setCopyFeedback("");
    setCashData({
      promoterId: localPromoters[0]?.id,
      promoterName: localPromoters[0]?.name ?? "",
      seller: sellerOptions[0],
      plan: localPlans[0]?.name ?? "",
      planId: localPlans[0]?.id,
      planAmount: localPlans[0] ? Number(localPlans[0].monthlyFee) : undefined,
      city: cityOptions[0],
    });
    setMembers([
      {
        id: 1,
        firstName: "",
        lastName: "",
        birthDate: "",
        dni: "",
        address: "",
        email: "",
        phone: "",
        inscriptionDate: "",
        validated: false,
      },
    ]);
    setMemberIdCounter(2);
  };

  if (!isOpen) return null;

  const handleCopyMobbexLink = async () => {
    if (!generatedMobbexLink) {
      return;
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(generatedMobbexLink);
        setCopyFeedback("Link copiado.");
        return;
      }

      setCopyFeedback("Copiá el link manualmente.");
    } catch {
      setCopyFeedback("No se pudo copiar automáticamente.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Crear Grupo de Afiliados
          </h2>
          <button
            onClick={onClose}
            type="button"
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-3 px-6 pt-6 pb-4 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setMode("automatic")}
            className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all ${
              mode === "automatic"
                ? "bg-slate-600 hover:bg-slate-700 text-white shadow-md"
                : "bg-slate-200 hover:bg-slate-300 text-slate-700"
            }`}
          >
            AUTOMÁTICO
          </button>
          <button
            type="button"
            onClick={() => setMode("cash")}
            className={`flex-1 h-10 rounded-xl font-bold text-sm transition-all ${
              mode === "cash"
                ? "bg-cyan-500 hover:bg-cyan-600 text-white shadow-md"
                : "bg-slate-200 hover:bg-slate-300 text-slate-700"
            }`}
          >
            EFECTIVO
          </button>
        </div>

        {/* Automatic Payment Form */}
        {mode === "automatic" && (
          <form onSubmit={handleSubmitAuto} className="px-6 py-6 space-y-6">
            {/* Card type selection */}
            {autoData.paymentMethod === "card" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Tipo de Tarjeta
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={cardType === "credit"}
                      onChange={() => setCardType("credit")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">
                      Tarjeta de crédito
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={cardType === "debit"}
                      onChange={() => setCardType("debit")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">
                      Tarjeta de débito
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={cardType === "prepaid"}
                      onChange={() => setCardType("prepaid")}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-slate-700">
                      Tarjeta prepaga
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Gateway and plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Gateway
                </label>
                <select
                  name="gateway"
                  value={autoData.gateway}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {paymentGatewayOptions.map((gateway) => (
                    <option key={gateway.value} value={gateway.value}>
                      {gateway.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  {autoData.gateway === "MOBBEX" ? "Plan de Mobbex" : "Plan"}
                </label>
                {autoData.gateway === "MOBBEX" ? (
                  <select
                    value={autoData.mobbexSubscriptionId}
                    onChange={handleMobbexPlanChange}
                    disabled={
                      isLoadingMobbexSubscriptions ||
                      mobbexSubscriptions.length === 0
                    }
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    {mobbexSubscriptions.map((subscription) => (
                      <option key={subscription.uid} value={subscription.uid}>
                        {subscription.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    name="planId"
                    value={autoData.planId ? String(autoData.planId) : ""}
                    onChange={handleAutoChange}
                    disabled={isLoadingLocalPlans || localPlans.length === 0}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {isLoadingLocalPlans && (
                      <option value="">Cargando planes...</option>
                    )}
                    {!isLoadingLocalPlans && localPlans.length === 0 && (
                      <option value="">No hay planes activos</option>
                    )}
                    {localPlans.map((plan) => (
                      <option key={plan.id} value={String(plan.id)}>
                        {formatPlanLabel(plan)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {autoData.gateway !== "MOBBEX" && localPlansError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {localPlansError}
              </div>
            )}

            {autoData.gateway === "MOBBEX" && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 space-y-2">
                <p>
                  Mobbex no pide la tarjeta en este formulario. Después de crear
                  el grupo, se abre el checkout hospedado para que el titular
                  complete la suscripción.
                </p>
                {isLoadingMobbexSubscriptions && (
                  <p>Cargando planes de Mobbex...</p>
                )}
                {mobbexSubscriptionsError && <p>{mobbexSubscriptionsError}</p>}
                {!isLoadingMobbexSubscriptions &&
                  !mobbexSubscriptionsError &&
                  autoData.mobbexSubscriptionId && (
                    <p>Plan seleccionado: {autoData.plan}</p>
                  )}
              </div>
            )}

            {generatedMobbexLink && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 space-y-3">
                <p className="text-sm font-semibold text-emerald-900">
                  Link de suscripcion generado para enviar al cliente.
                </p>
                <input
                  type="text"
                  readOnly
                  value={generatedMobbexLink}
                  onFocus={(event) => event.currentTarget.select()}
                  className="w-full px-4 py-2.5 border border-emerald-200 rounded-xl bg-white text-sm text-slate-700"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCopyMobbexLink}
                    className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Copiar link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForms();
                      onClose();
                    }}
                    className="h-10 px-4 border border-emerald-300 text-emerald-800 font-semibold rounded-xl transition-colors hover:bg-emerald-100"
                  >
                    Cerrar
                  </button>
                </div>
                {copyFeedback && (
                  <p className="text-sm text-emerald-800">{copyFeedback}</p>
                )}
              </div>
            )}

            {/* Payment method */}
            {autoData.gateway !== "MOBBEX" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Método de pago
                </label>
                <input
                  value={autoData.gateway === "SIRO" ? "CBU" : "Tarjeta"}
                  disabled
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-100 text-slate-600"
                />
              </div>
            )}

            {/* Card details */}
            {autoData.paymentMethod === "card" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Número de Tarjeta
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={autoData.cardNumber}
                      onChange={handleAutoChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Código del dorso (***)
                    </label>
                    <input
                      type="text"
                      name="cardCvv"
                      value={autoData.cardCvv}
                      onChange={handleAutoChange}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Mes
                    </label>
                    <input
                      type="text"
                      name="cardMonth"
                      value={autoData.cardMonth}
                      onChange={handleAutoChange}
                      placeholder="MM"
                      maxLength={2}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Año
                    </label>
                    <input
                      type="text"
                      name="cardYear"
                      value={autoData.cardYear}
                      onChange={handleAutoChange}
                      placeholder="YY"
                      maxLength={2}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </>
            )}

            {autoData.paymentMethod === "cbu" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  CBU
                </label>
                <input
                  type="text"
                  name="cbu"
                  value={autoData.cbu}
                  onChange={handleAutoChange}
                  placeholder="Ingresá el CBU"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Personal info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nombres
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={autoData.firstName}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Apellido
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={autoData.lastName}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  DNI (Titular)
                </label>
                <input
                  type="text"
                  name="dni"
                  value={autoData.dni}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Province, email, postal */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Provincia
                </label>
                <select
                  name="province"
                  value={autoData.province}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {provinceOptions.map((prov) => (
                    <option key={prov} value={prov}>
                      {prov}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ciudad
                </label>
                <select
                  name="city"
                  value={autoData.city}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={autoData.email}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Código Postal
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={autoData.postalCode}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="address"
                  value={autoData.address}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={autoData.phone}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {autoData.gateway === "PAYWAY" && (
              <p className="text-sm text-slate-600">
                Payway sandbox envía el identificador del dispositivo y usa
                email, domicilio y ciudad del titular para fraude.
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                disabled={
                  autoData.gateway === "MOBBEX" &&
                  (isLoadingMobbexSubscriptions ||
                    !autoData.mobbexSubscriptionId ||
                    Boolean(generatedMobbexLink))
                }
                className="flex-1 h-10 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl transition-colors"
              >
                {autoData.gateway === "MOBBEX"
                  ? "GENERAR LINK DE MOBBEX"
                  : "COBRAR"}
              </button>
            </div>
          </form>
        )}

        {/* Cash Payment Form */}
        {mode === "cash" && (
          <form onSubmit={handleSubmitCash} className="px-6 py-6 space-y-6">
            {/* Top selects */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Promotor
                </label>
                <select
                  name="promoterId"
                  value={cashData.promoterId ? String(cashData.promoterId) : ""}
                  onChange={handleCashChange}
                  disabled={isLoadingPromoters || localPromoters.length === 0}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isLoadingPromoters && (
                    <option value="">Cargando promotores...</option>
                  )}
                  {!isLoadingPromoters && localPromoters.length === 0 && (
                    <option value="">No hay promotores activos</option>
                  )}
                  {localPromoters.map((promoter) => (
                    <option key={promoter.id} value={String(promoter.id)}>
                      {promoter.name}
                    </option>
                  ))}
                </select>
                {promotersError && (
                  <p className="mt-2 text-xs text-amber-700">
                    {promotersError}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Vendedor
                </label>
                <select
                  name="seller"
                  value={cashData.seller}
                  onChange={handleCashChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sellerOptions.map((seller) => (
                    <option key={seller} value={seller}>
                      {seller}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Planes
                </label>
                <select
                  name="planId"
                  value={cashData.planId ? String(cashData.planId) : ""}
                  onChange={handleCashChange}
                  disabled={isLoadingLocalPlans || localPlans.length === 0}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {isLoadingLocalPlans && (
                    <option value="">Cargando planes...</option>
                  )}
                  {!isLoadingLocalPlans && localPlans.length === 0 && (
                    <option value="">No hay planes activos</option>
                  )}
                  {localPlans.map((plan) => (
                    <option key={plan.id} value={String(plan.id)}>
                      {formatPlanLabel(plan)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Ciudad
                </label>
                <select
                  name="city"
                  value={cashData.city}
                  onChange={handleCashChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="mb-4">
                <button
                  type="button"
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors"
                >
                  CREAR AFILIADO
                </button>
              </div>
            </div>

            {/* Members list */}
            <div className="space-y-6">
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className="bg-slate-50 p-6 rounded-xl border border-slate-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">
                      Titular: Miembro N° {index + 1}
                    </h3>
                    {members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={member.firstName}
                        onChange={(e) =>
                          handleMemberChange(
                            member.id,
                            "firstName",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Apellido
                      </label>
                      <input
                        type="text"
                        value={member.lastName}
                        onChange={(e) =>
                          handleMemberChange(
                            member.id,
                            "lastName",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={member.birthDate}
                        onChange={(e) =>
                          handleMemberChange(
                            member.id,
                            "birthDate",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        DNI
                      </label>
                      <input
                        type="text"
                        value={member.dni}
                        onChange={(e) =>
                          handleMemberChange(member.id, "dni", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={member.address}
                        onChange={(e) =>
                          handleMemberChange(
                            member.id,
                            "address",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) =>
                          handleMemberChange(member.id, "email", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={member.phone}
                        onChange={(e) =>
                          handleMemberChange(member.id, "phone", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Fecha de Inscripción
                      </label>
                      <input
                        type="date"
                        value={member.inscriptionDate}
                        onChange={(e) =>
                          handleMemberChange(
                            member.id,
                            "inscriptionDate",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={member.validated}
                      onChange={(e) =>
                        handleMemberChange(
                          member.id,
                          "validated",
                          e.target.checked,
                        )
                      }
                      className="w-5 h-5 border-2 border-slate-300 rounded cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      Validado
                    </span>
                  </label>
                </div>
              ))}
            </div>

            {/* Add member button */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={addMember}
                className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-colors"
              >
                AGREGAR MIEMBRO
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl transition-colors"
              >
                CANCELAR
              </button>
              <button
                type="submit"
                className="flex-1 h-10 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-colors"
              >
                CREAR AFILIADO
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AffiliateGroupsCreateModal;
