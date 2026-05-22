import React, { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { mobbexService } from "../../api/mobbex.service";
import {
  paymentGatewayOptions,
  planOptions,
  provinceOptions,
  promoterOptions,
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
} from "./AffiliateGroups.types";

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
    plan: planOptions[0],
    mobbexSubscriptionId: "",
    mobbexWebhook: "",
    paymentMethod: "card",
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
  const [isLoadingMobbexSubscriptions, setIsLoadingMobbexSubscriptions] =
    useState(false);
  const [mobbexSubscriptionsError, setMobbexSubscriptionsError] = useState("");
  const [generatedMobbexLink, setGeneratedMobbexLink] = useState("");
  const [copyFeedback, setCopyFeedback] = useState("");

  // Cash payment form
  const [cashData, setCashData] = useState<
    Omit<CashAffiliateGroupFormData, "mode" | "members">
  >({
    promoter: promoterOptions[0],
    seller: sellerOptions[0],
    plan: planOptions[0],
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
    setAutoData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCashChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCashData((prev) => ({ ...prev, [name]: value }));
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
      plan: planOptions[0],
      mobbexSubscriptionId: "",
      mobbexWebhook: "",
      paymentMethod: "card",
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
    setMobbexSubscriptionsError("");
    setGeneratedMobbexLink("");
    setCopyFeedback("");
    setCashData({
      promoter: promoterOptions[0],
      seller: sellerOptions[0],
      plan: planOptions[0],
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
            {autoData.gateway !== "MOBBEX" && (
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
                    name="plan"
                    value={autoData.plan}
                    onChange={handleAutoChange}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {planOptions.map((plan) => (
                      <option key={plan} value={plan}>
                        {plan}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

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
                <select
                  name="paymentMethod"
                  value={autoData.paymentMethod}
                  onChange={handleAutoChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="card">Tarjeta</option>
                  <option value="cbu">CBU</option>
                </select>
              </div>
            )}

            {/* Card details */}
            {autoData.gateway !== "MOBBEX" && (
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
                  name="promoter"
                  value={cashData.promoter}
                  onChange={handleCashChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {promoterOptions.map((prom) => (
                    <option key={prom} value={prom}>
                      {prom}
                    </option>
                  ))}
                </select>
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
                  name="plan"
                  value={cashData.plan}
                  onChange={handleCashChange}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {planOptions.map((plan) => (
                    <option key={plan} value={plan}>
                      {plan}
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
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  className="flex-1 h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors"
                >
                  CREAR AFILIADO
                </button>
                <button
                  type="button"
                  className="flex-1 h-10 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm rounded-xl transition-colors"
                >
                  SELECCIONAR AFILIADO
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
                AGREGAR MIEMBRO
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AffiliateGroupsCreateModal;
