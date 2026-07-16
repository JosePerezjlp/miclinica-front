import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  CheckSquare,
  Square,
  ShoppingCart,
  Info,
  CreditCard,
  CheckCircle,
  XCircle,
  ChevronRight,
  Plus,
  Loader,
} from "lucide-react";
import {
  getAfiliadoByDni,
  pagarDeuda,
  type AfiliadoPublicData,
  type PayDeudaResponse,
} from "../../api/afiliado.service";

// ─── helpers ────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En proceso",
  PARTIAL: "Parcial",
  FAILED: "Rechazada",
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-amber-700 bg-amber-50 border-amber-200",
  IN_PROGRESS: "text-blue-700 bg-blue-50 border-blue-200",
  PARTIAL: "text-orange-700 bg-orange-50 border-orange-200",
  FAILED: "text-red-700 bg-red-50 border-red-200",
};

const UNPAID_STATUSES = new Set(["PENDING", "FAILED", "PARTIAL", "IN_PROGRESS"]);

function formatMoney(value: number | string) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function getOrCreateDeviceFingerprintId(): string {
  const key = "miclinica.payway.deviceFingerprintId";
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const id = crypto.randomUUID();
  localStorage.setItem(key, id);
  return id;
}

function inferCardBrand(digits: string): { brand: string | null; paywayId: number | null } {
  if (!digits) return { brand: null, paywayId: null };
  if (digits.startsWith("4")) return { brand: "Visa", paywayId: 1 };
  const n2 = parseInt(digits.slice(0, 2));
  const n4 = parseInt(digits.slice(0, 4));
  if ((n2 >= 51 && n2 <= 55) || (n4 >= 2221 && n4 <= 2720))
    return { brand: "Mastercard", paywayId: 104 };
  if (digits.startsWith("34") || digits.startsWith("37"))
    return { brand: "American Express", paywayId: 65 };
  if (
    digits.startsWith("589657") ||
    digits.startsWith("603522") ||
    digits.startsWith("6042")
  )
    return { brand: "Cabal", paywayId: 63 };
  return { brand: null, paywayId: null };
}

function formatCardDisplay(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function extractApiError(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const resp = (err as { response?: { data?: { message?: string | string[] } } }).response;
    const msg = resp?.data?.message;
    if (typeof msg === "string") return msg;
    if (Array.isArray(msg)) return msg[0] ?? fallback;
  }
  return fallback;
}

type Period = AfiliadoPublicData["group"]["billingPeriods"][number];
type PaymentStep = "idle" | "summary" | "form" | "processing" | "success" | "error";

// ─── component ──────────────────────────────────────────────────────────────

export default function AfiliadoDeuda() {
  const { dni } = useParams<{ dni: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState<AfiliadoPublicData | null>(
    (location.state as { data?: AfiliadoPublicData } | null)?.data ?? null,
  );
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // ── Payment sheet state ────────────────────────────────────────────────────
  const [paymentStep, setPaymentStep] = useState<PaymentStep>("idle");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentResponse, setPaymentResponse] = useState<PayDeudaResponse | null>(null);

  // card form fields
  const [cardNumber, setCardNumber] = useState("");
  const [cvv, setCvv] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [holderName, setHolderName] = useState("");
  const [cardDni, setCardDni] = useState("");
  const [cardBrand, setCardBrand] = useState<string | null>(null);
  const [paywayMethodId, setPaywayMethodId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // for automatic groups: selected existing method or "add new"
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data || !dni) return;
    setLoading(true);
    getAfiliadoByDni(dni)
      .then(setData)
      .catch(() => setError("No pudimos cargar la información de deuda."))
      .finally(() => setLoading(false));
  }, [dni, data]);

  const unpaidPeriods = useMemo<Period[]>(
    () =>
      (data?.group.billingPeriods ?? [])
        .filter((p) => UNPAID_STATUSES.has(p.status))
        .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month),
    [data],
  );

  const selectedTotal = useMemo(
    () =>
      unpaidPeriods
        .filter((p) => selected.has(p.id))
        .reduce((sum, p) => sum + parseFloat(String(p.amountDue)), 0),
    [unpaidPeriods, selected],
  );

  const selectedPeriods = useMemo(
    () => unpaidPeriods.filter((p) => selected.has(p.id)),
    [unpaidPeriods, selected],
  );

  function toggleAll() {
    if (selected.size === unpaidPeriods.length) setSelected(new Set());
    else setSelected(new Set(unpaidPeriods.map((p) => p.id)));
  }

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allSelected = unpaidPeriods.length > 0 && selected.size === unpaidPeriods.length;
  const someSelected = selected.size > 0;

  const isCashGroup = (data?.group.paymentMethods.length ?? 0) === 0;

  // ── Open payment sheet ─────────────────────────────────────────────────────
  function openPayment() {
    setPaymentError(null);
    setPaymentResponse(null);
    setFormError(null);
    // Pre-fill card form from affiliate data
    if (data) {
      setHolderName(`${data.affiliate.firstName} ${data.affiliate.lastName}`);
      setCardDni(data.affiliate.documentNumber);
    }
    // Auto-select first method for automatic groups
    if (!isCashGroup && data) {
      setSelectedMethodId(data.group.paymentMethods[0].id);
      setShowNewCardForm(false);
    }
    setPaymentStep("summary");
  }

  function closeSheet() {
    if (paymentStep === "processing") return;
    setPaymentStep("idle");
  }

  // ── Card number change handler ─────────────────────────────────────────────
  function handleCardNumberChange(val: string) {
    const formatted = formatCardDisplay(val);
    setCardNumber(formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length >= 4) {
      const { brand, paywayId } = inferCardBrand(digits);
      setCardBrand(brand);
      setPaywayMethodId(paywayId);
    } else {
      setCardBrand(null);
      setPaywayMethodId(null);
    }
  }

  // ── Form validation ────────────────────────────────────────────────────────
  function validateCardForm(): string | null {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 13) return "Número de tarjeta inválido";
    if (!cvv || cvv.replace(/\D/g, "").length < 3) return "CVV inválido";
    if (!expiryMonth) return "Ingresá el mes de vencimiento";
    if (!expiryYear) return "Ingresá el año de vencimiento";
    const now = new Date();
    const year4 = 2000 + parseInt(expiryYear, 10);
    const month = parseInt(expiryMonth, 10);
    if (year4 < now.getFullYear() || (year4 === now.getFullYear() && month < now.getMonth() + 1))
      return "La tarjeta está vencida";
    if (!holderName.trim()) return "Ingresá el nombre del titular";
    if (!cardDni.replace(/\D/g, "")) return "Ingresá el DNI del titular";
    return null;
  }

  // ── Submit payment ─────────────────────────────────────────────────────────
  async function handlePay() {
    const needsCardForm = isCashGroup || showNewCardForm;

    if (needsCardForm) {
      const err = validateCardForm();
      if (err) { setFormError(err); return; }
    } else {
      if (!selectedMethodId) { setFormError("Seleccioná una tarjeta"); return; }
    }

    setFormError(null);
    setPaymentStep("processing");

    try {
      const billingPeriodIds = Array.from(selected);

      const response = await pagarDeuda(dni!, needsCardForm ? {
        billingPeriodIds,
        paymentMethod: {
          gateway: "PAYWAY",
          type: "CARD",
          priority: 1,
          cardNumber: cardNumber.replace(/\D/g, ""),
          cvv: cvv.replace(/\D/g, ""),
          expiryMonth: parseInt(expiryMonth, 10),
          expiryYear: 2000 + parseInt(expiryYear, 10),
          holderName: holderName.trim(),
          documentNumber: cardDni.replace(/\D/g, ""),
          deviceFingerprintId: getOrCreateDeviceFingerprintId(),
          paywayPaymentMethodId: paywayMethodId ?? undefined,
          brand: cardBrand ?? undefined,
        },
      } : {
        billingPeriodIds,
        existingPaymentMethodId: selectedMethodId!,
      });

      setPaymentResponse(response);
      const allOk = response.results.every((r) => r.success);
      setPaymentStep(allOk || response.totalCharged > 0 ? "success" : "error");
    } catch (err) {
      setPaymentError(extractApiError(err, "No se pudo procesar el pago. Intentá más tarde."));
      setPaymentStep("error");
    }
  }

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Cargando deuda…</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-slate-700 font-medium">{error ?? "Error desconocido"}</p>
          <button
            onClick={() => navigate(`/afiliado/${dni}`)}
            className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a mi credencial
          </button>
        </div>
      </div>
    );
  }

  const { affiliate, group } = data;

  // ── Current year for expiry selector ──────────────────────────────────────
  const currentYear = new Date().getFullYear();
  const expiryYears = Array.from({ length: 12 }, (_, i) => currentYear + i);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 py-6 px-4 pb-40">
      {/* header */}
      <div className="max-w-sm mx-auto mb-4">
        <button
          onClick={() => navigate(`/afiliado/${dni}`, { state: { data } })}
          className="inline-flex items-center gap-1.5 text-slate-500 text-sm hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mi credencial
        </button>
      </div>

      <div className="max-w-sm mx-auto space-y-4">
        <div>
          <h1 className="text-slate-800 text-xl font-bold">Detalle de deuda</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {affiliate.firstName} {affiliate.lastName} · DNI {affiliate.documentNumber}
          </p>
        </div>

        {/* no debt */}
        {unpaidPeriods.length === 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-6 text-center space-y-2">
            <p className="text-2xl">🎉</p>
            <p className="text-emerald-700 font-semibold">¡No tenés deudas pendientes!</p>
            <p className="text-emerald-600 text-sm">Todas tus cuotas están al día.</p>
          </div>
        )}

        {/* periods table */}
        {unpaidPeriods.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={toggleAll}
              className="w-full flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              {allSelected ? (
                <CheckSquare className="w-5 h-5 text-blue-600 shrink-0" />
              ) : (
                <Square className="w-5 h-5 text-slate-300 shrink-0" />
              )}
              <span className="text-sm font-semibold text-slate-700">
                {allSelected ? "Deseleccionar todo" : "Seleccionar todo"}
              </span>
              <span className="ml-auto text-xs text-slate-400">
                {unpaidPeriods.length} {unpaidPeriods.length === 1 ? "cuota" : "cuotas"}
              </span>
            </button>

            <ul className="divide-y divide-slate-50">
              {unpaidPeriods.map((period) => {
                const isSelected = selected.has(period.id);
                const amount = parseFloat(String(period.amountDue));
                return (
                  <li key={period.id}>
                    <button
                      onClick={() => toggle(period.id)}
                      className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${
                        isSelected ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="shrink-0">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 text-sm font-semibold leading-tight">
                          {MONTH_NAMES[period.month - 1]} {period.year}
                        </p>
                        <span
                          className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                            STATUS_COLOR[period.status] ??
                            "text-slate-600 bg-slate-50 border-slate-200"
                          }`}
                        >
                          {STATUS_LABEL[period.status] ?? period.status}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-bold ${isSelected ? "text-blue-700" : "text-slate-700"}`}>
                          {formatMoney(amount)}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-100">
              <span className="text-slate-600 text-sm font-medium">Total seleccionado</span>
              <span className="text-slate-800 text-base font-bold">{formatMoney(selectedTotal)}</span>
            </div>
          </div>
        )}

        {unpaidPeriods.length > 0 && (
          <div className="flex gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-blue-700 text-xs leading-relaxed">
              Seleccioná las cuotas que querés abonar y presioná <strong>Pagar ahora</strong>.
            </p>
          </div>
        )}
      </div>

      {/* sticky footer */}
      {someSelected && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-lg px-4 py-4">
          <div className="max-w-sm mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">
                  {selected.size} {selected.size === 1 ? "cuota seleccionada" : "cuotas seleccionadas"}
                </p>
                <p className="text-slate-800 text-lg font-bold leading-tight">
                  {formatMoney(selectedTotal)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <button
              onClick={openPayment}
              className="flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
            >
              <CreditCard className="w-4 h-4" />
              Pagar ahora — {formatMoney(selectedTotal)}
            </button>
          </div>
        </div>
      )}

      {/* ── Payment Sheet ─────────────────────────────────────────────────── */}
      {paymentStep !== "idle" && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeSheet(); }}
        >
          <div
            ref={sheetRef}
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] sm:max-h-[88vh] overflow-y-auto"
          >
            {/* drag handle — only visible on mobile bottom sheet */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* ── Summary step ─────────────────────────────────────────── */}
            {paymentStep === "summary" && (
              <div className="px-5 py-4 space-y-5 pb-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-slate-800 text-lg font-bold">Detalle del pago</h2>
                  <button onClick={closeSheet} className="text-slate-400 hover:text-slate-600 text-sm">
                    Cerrar
                  </button>
                </div>

                {/* Selected periods */}
                <div className="bg-slate-50 rounded-2xl overflow-hidden">
                  {selectedPeriods.map((p, i) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-4 py-3 ${
                        i < selectedPeriods.length - 1 ? "border-b border-slate-100" : ""
                      }`}
                    >
                      <span className="text-slate-700 text-sm">
                        {MONTH_NAMES[p.month - 1]} {p.year}
                      </span>
                      <span className="text-slate-800 text-sm font-semibold">
                        {formatMoney(parseFloat(String(p.amountDue)))}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-4 py-3 bg-blue-50 border-t border-blue-100">
                    <span className="text-blue-700 text-sm font-bold">Total</span>
                    <span className="text-blue-800 text-base font-bold">
                      {formatMoney(selectedTotal)}
                    </span>
                  </div>
                </div>

                {/* Holder benefits */}
                {group.plan && group.plan.benefits.length > 0 && (
                  <div>
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-2">
                      Beneficios del plan {group.plan.name}
                    </p>
                    <ul className="space-y-1.5">
                      {group.plan.benefits.map((b) => (
                        <li key={b.id} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                          <span>
                            <span className="font-medium">{b.name}</span>
                            {b.freeDescription && (
                              <span className="text-slate-400"> — {b.freeDescription}</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  onClick={() => setPaymentStep("form")}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
                >
                  Continuar con el pago
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* ── Form step ───────────────────────────────────────────── */}
            {paymentStep === "form" && (
              <div className="px-5 py-4 space-y-5 pb-8">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaymentStep("summary")}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-slate-800 text-lg font-bold">
                    {isCashGroup ? "Datos de tarjeta" : "Método de pago"}
                  </h2>
                </div>

                {/* Automatic group: show saved cards */}
                {!isCashGroup && (
                  <div className="space-y-2">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">
                      Tarjetas guardadas
                    </p>
                    <ul className="space-y-2">
                      {group.paymentMethods.map((m) => {
                        const isChosen = !showNewCardForm && selectedMethodId === m.id;
                        return (
                          <li key={m.id}>
                            <button
                              onClick={() => { setSelectedMethodId(m.id); setShowNewCardForm(false); setFormError(null); }}
                              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-colors text-left ${
                                isChosen
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <CreditCard className={`w-5 h-5 shrink-0 ${isChosen ? "text-blue-600" : "text-slate-400"}`} />
                              <div className="flex-1">
                                <p className="text-slate-800 text-sm font-semibold">
                                  {m.brand ?? m.type} •••• {m.last4 ?? "????"}
                                </p>
                                <p className="text-slate-400 text-xs">{m.gateway}</p>
                              </div>
                              {isChosen && (
                                <CheckCircle className="w-5 h-5 text-blue-500 shrink-0" />
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Add new card toggle */}
                    <button
                      onClick={() => { setShowNewCardForm((v) => !v); setSelectedMethodId(null); setFormError(null); }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-colors ${
                        showNewCardForm
                          ? "border-blue-500 bg-blue-50"
                          : "border-dashed border-slate-300 hover:border-slate-400"
                      }`}
                    >
                      <Plus className={`w-5 h-5 shrink-0 ${showNewCardForm ? "text-blue-600" : "text-slate-400"}`} />
                      <span className={`text-sm font-medium ${showNewCardForm ? "text-blue-700" : "text-slate-500"}`}>
                        Agregar nueva tarjeta
                      </span>
                    </button>
                  </div>
                )}

                {/* Card form (cash group OR adding new card) */}
                {(isCashGroup || showNewCardForm) && (
                  <div className="space-y-3">
                    {/* Card number */}
                    <div>
                      <label className="text-slate-600 text-xs font-semibold block mb-1">
                        Número de tarjeta
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0000 0000 0000 0000"
                          value={cardNumber}
                          onChange={(e) => handleCardNumberChange(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400 pr-16"
                          maxLength={19}
                        />
                        {cardBrand && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {cardBrand}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CVV + Expiry */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-slate-600 text-xs font-semibold block mb-1">CVV</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="123"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                          className="w-full border border-slate-200 rounded-xl px-3 py-3 text-slate-800 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                          maxLength={4}
                        />
                      </div>
                      <div>
                        <label className="text-slate-600 text-xs font-semibold block mb-1">Mes</label>
                        <select
                          value={expiryMonth}
                          onChange={(e) => setExpiryMonth(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-2 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                        >
                          <option value="">MM</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={String(m).padStart(2, "0")}>
                              {String(m).padStart(2, "0")}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-600 text-xs font-semibold block mb-1">Año</label>
                        <select
                          value={expiryYear}
                          onChange={(e) => setExpiryYear(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-2 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                        >
                          <option value="">AA</option>
                          {expiryYears.map((y) => (
                            <option key={y} value={String(y).slice(-2)}>
                              {String(y).slice(-2)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Holder name */}
                    <div>
                      <label className="text-slate-600 text-xs font-semibold block mb-1">
                        Nombre del titular (como figura en la tarjeta)
                      </label>
                      <input
                        type="text"
                        placeholder="JUAN PEREZ"
                        value={holderName}
                        onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>

                    {/* DNI */}
                    <div>
                      <label className="text-slate-600 text-xs font-semibold block mb-1">DNI del titular</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="12345678"
                        value={cardDni}
                        onChange={(e) => setCardDni(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                  </div>
                )}

                {formError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <p className="text-red-700 text-sm">{formError}</p>
                  </div>
                )}

                <button
                  onClick={handlePay}
                  disabled={!isCashGroup && !showNewCardForm && !selectedMethodId}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3.5 rounded-xl transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  Pagar {formatMoney(selectedTotal)}
                </button>

                <p className="text-center text-slate-400 text-xs">
                  Pago seguro procesado por Payway
                </p>
              </div>
            )}

            {/* ── Processing step ──────────────────────────────────────── */}
            {paymentStep === "processing" && (
              <div className="px-5 py-12 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <p className="text-slate-700 font-semibold">Procesando pago…</p>
                <p className="text-slate-400 text-sm text-center">
                  No cierres esta ventana mientras se procesa tu pago.
                </p>
              </div>
            )}

            {/* ── Success step ─────────────────────────────────────────── */}
            {paymentStep === "success" && paymentResponse && (
              <div className="px-5 py-6 space-y-5 pb-8">
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-slate-800 text-xl font-bold text-center">
                    {paymentResponse.results.every((r) => r.success)
                      ? "¡Pago exitoso!"
                      : "Pago parcialmente procesado"}
                  </h2>
                  <p className="text-slate-500 text-sm text-center">
                    Se procesaron{" "}
                    <strong>{paymentResponse.results.filter((r) => r.success).length}</strong>{" "}
                    de {paymentResponse.results.length} cuota
                    {paymentResponse.results.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Per-period results */}
                <div className="bg-slate-50 rounded-2xl overflow-hidden">
                  {paymentResponse.results.map((r, i) => (
                    <div
                      key={r.billingPeriodId}
                      className={`flex items-center gap-3 px-4 py-3 ${
                        i < paymentResponse.results.length - 1 ? "border-b border-slate-100" : ""
                      }`}
                    >
                      {r.success ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <span className="text-slate-700 text-sm flex-1">
                        {MONTH_NAMES[r.month - 1]} {r.year}
                      </span>
                      <span className={`text-sm font-semibold ${r.success ? "text-emerald-700" : "text-red-500"}`}>
                        {r.success ? formatMoney(r.amountDue) : r.failureMessage ?? "Rechazado"}
                      </span>
                    </div>
                  ))}
                  {paymentResponse.totalCharged > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-t border-emerald-100">
                      <span className="text-emerald-700 text-sm font-bold">Total cobrado</span>
                      <span className="text-emerald-800 text-base font-bold">
                        {formatMoney(paymentResponse.totalCharged)}
                      </span>
                    </div>
                  )}
                </div>

                {paymentResponse.newPaymentMethodId && (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <CreditCard className="w-4 h-4 text-blue-500 shrink-0" />
                    <p className="text-blue-700 text-xs">
                      Tu tarjeta fue guardada para futuros cobros automáticos.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => {
                    setPaymentStep("idle");
                    navigate(`/afiliado/${dni}`);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
                >
                  Volver a mi credencial
                </button>
              </div>
            )}

            {/* ── Error step ───────────────────────────────────────────── */}
            {paymentStep === "error" && (
              <div className="px-5 py-6 space-y-5 pb-8">
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-slate-800 text-xl font-bold">Error en el pago</h2>
                  <p className="text-slate-500 text-sm text-center">
                    {paymentError ?? "No se pudo completar el pago."}
                  </p>
                </div>

                {/* Partial results if any */}
                {paymentResponse && paymentResponse.results.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl overflow-hidden">
                    {paymentResponse.results.map((r, i) => (
                      <div
                        key={r.billingPeriodId}
                        className={`flex items-center gap-3 px-4 py-3 ${
                          i < paymentResponse.results.length - 1 ? "border-b border-slate-100" : ""
                        }`}
                      >
                        {r.success ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                        <span className="text-slate-700 text-sm flex-1">
                          {MONTH_NAMES[r.month - 1]} {r.year}
                        </span>
                        <span className={`text-xs ${r.success ? "text-emerald-700 font-semibold" : "text-red-400"}`}>
                          {r.success ? formatMoney(r.amountDue) : (r.failureMessage ?? "Rechazado")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setPaymentStep("form")}
                    className="flex-1 border border-slate-200 text-slate-700 font-semibold py-3.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Reintentar
                  </button>
                  <button
                    onClick={closeSheet}
                    className="flex-1 bg-slate-800 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
