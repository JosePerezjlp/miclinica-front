import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  Landmark,
  FileDown,
  Share2,
  AlertTriangle,
  ShieldCheck,
  CheckCheck,
  Lock,
} from "lucide-react";
import {
  getAfiliadoByDni,
  type AfiliadoPublicData,
  type Benefit,
} from "../../api/afiliado.service";

// ─── helpers ────────────────────────────────────────────────────────────────

const PLAN_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Activo",
  GRACE_PERIOD: "Activo · Pago Vencido",
  EXPIRED: "Sin Cobertura",
  NO_COVERAGE: "Sin Cobertura",
};

const BILLING_STATUS_LABEL: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En proceso",
  PARTIAL: "Parcial",
  PAID: "Pagada",
  FAILED: "Rechazada",
  EXEMPT: "Exenta",
};

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMoney(value: number | string) {
  const n = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function totalDebt(
  ca: AfiliadoPublicData["group"]["currentAccount"],
): number {
  if (!ca) return 0;
  return (
    parseFloat(String(ca.balanceCapital)) +
    parseFloat(String(ca.balanceInterest))
  );
}

function getNextDebitDate(chargeDay: number): string {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), chargeDay);
  const target =
    thisMonth > today
      ? thisMonth
      : new Date(today.getFullYear(), today.getMonth() + 1, chargeDay);
  return target.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function monthsActive(createdAt: string): number {
  const start = new Date(createdAt);
  const now = new Date();
  return (
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth())
  );
}

function todayFilenameSegment(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function planStatusColor(status: string) {
  if (status === "ACTIVE") return "text-emerald-600 bg-emerald-50";
  if (status === "GRACE_PERIOD") return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

function planStatusIcon(status: string) {
  if (status === "ACTIVE") return <CheckCircle2 className="w-4 h-4" />;
  if (status === "GRACE_PERIOD") return <Clock className="w-4 h-4" />;
  return <XCircle className="w-4 h-4" />;
}

function billingStatusColor(status: string) {
  const map: Record<string, string> = {
    PAID: "text-emerald-600 bg-emerald-50",
    PENDING: "text-amber-600 bg-amber-50",
    IN_PROGRESS: "text-blue-600 bg-blue-50",
    PARTIAL: "text-orange-600 bg-orange-50",
    FAILED: "text-red-600 bg-red-50",
    EXEMPT: "text-slate-500 bg-slate-50",
  };
  return map[status] ?? "text-slate-600 bg-slate-50";
}

// ─── BenefitsSection ────────────────────────────────────────────────────────

function BenefitsSection({
  benefits,
  groupCreatedAt,
}: {
  benefits: Benefit[];
  groupCreatedAt: string;
}) {
  if (benefits.length === 0) return null;

  const months = monthsActive(groupCreatedAt);
  const immediate = benefits.filter(
    (b) => b.minMonthsActive === null || b.minMonthsActive === 0,
  );
  const bySeniority = benefits.filter(
    (b) => b.minMonthsActive !== null && b.minMonthsActive > 0,
  );

  return (
    <>
      {immediate.length > 0 && (
        <Section title="Beneficios del plan">
          <ul className="space-y-2">
            {immediate.map((b) => (
              <li key={b.id} className="flex items-start gap-2.5">
                <CheckCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-slate-700 text-sm font-medium leading-tight">
                    {b.name}
                  </p>
                  {(b.description || b.freeDescription) && (
                    <p className="text-slate-400 text-xs mt-0.5 leading-snug">
                      {b.freeDescription ?? b.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {bySeniority.length > 0 && (
        <Section title="Beneficios por antigüedad">
          <ul className="space-y-2">
            {bySeniority.map((b) => {
              const min = b.minMonthsActive!;
              const unlocked = months >= min;
              const remaining = min - months;
              return (
                <li key={b.id} className="flex items-start gap-2.5">
                  {unlocked ? (
                    <CheckCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium leading-tight ${unlocked ? "text-slate-700" : "text-slate-400"}`}
                    >
                      {b.name}
                    </p>
                    {!unlocked && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Disponible en {remaining}{" "}
                        {remaining === 1 ? "mes" : "meses"} más
                      </p>
                    )}
                    {unlocked && (b.freeDescription ?? b.description) && (
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                        {b.freeDescription ?? b.description}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>
      )}
    </>
  );
}

// ─── component ──────────────────────────────────────────────────────────────

export default function AfiliadoCard() {
  const { dni } = useParams<{ dni: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<AfiliadoPublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const recaptchaToken = (
    location.state as { recaptchaToken?: string } | null
  )?.recaptchaToken;

  useEffect(() => {
    if (!dni) return;
    setLoading(true);
    setError(null);
    getAfiliadoByDni(dni, recaptchaToken)
      .then(setData)
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 404)
          setError("No encontramos un afiliado con ese DNI.");
        else if (status === 429)
          setError(
            "Demasiadas consultas en poco tiempo. Esperá 5 minutos e intentá nuevamente.",
          );
        else if (status === 401)
          setError(
            "Verificación reCAPTCHA inválida. Volvé a la búsqueda e intentá nuevamente.",
          );
        else setError("Ocurrió un error al consultar. Intentá nuevamente.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dni]);

  // ── PDF ──────────────────────────────────────────────────────────────────
  async function handleDownloadPdf() {
    if (!printRef.current || !data) return;
    setPdfLoading(true);
    try {
      const el = printRef.current;
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f8fafc",
        scrollY: 0,
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pxToMm = 0.2645833333;
      const imgWMm = (canvas.width * pxToMm) / 2;
      const imgHMm = (canvas.height * pxToMm) / 2;
      const a4W = 210;
      const ratio = a4W / imgWMm;
      const finalH = imgHMm * ratio;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: finalH > 297 ? [a4W, finalH] : "a4",
      });
      pdf.addImage(imgData, "PNG", 0, 0, a4W, finalH);

      const name = `${data.affiliate.firstName}-${data.affiliate.lastName}`
        .replace(/\s+/g, "-")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");

      pdf.save(`${todayFilenameSegment()}-clinica-${name}.pdf`);
    } finally {
      setPdfLoading(false);
    }
  }

  // ── Share ────────────────────────────────────────────────────────────────
  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Mi Credencial de Afiliado",
          text: `Credencial de ${data?.affiliate.firstName} ${data?.affiliate.lastName}`,
          url,
        });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert("Enlace copiado al portapapeles");
    }
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Consultando información…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-slate-700 font-medium">{error ?? "Error desconocido"}</p>
          <button
            onClick={() => navigate("/afiliado")}
            className="inline-flex items-center gap-1.5 text-blue-600 text-sm font-medium hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la búsqueda
          </button>
        </div>
      </div>
    );
  }

  const { affiliate, group } = data;
  const debt = totalDebt(group.currentAccount);
  const latestPeriod = group.billingPeriods[0] ?? null;
  const pageUrl = window.location.href;
  const benefits = group.plan?.benefits ?? [];

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-blue-50 py-6 px-4">
      {/* back button */}
      <div className="max-w-sm mx-auto mb-4">
        <button
          onClick={() => navigate("/afiliado")}
          className="inline-flex items-center gap-1.5 text-slate-500 text-sm hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Nueva consulta
        </button>
      </div>

      {/* ── PDF-captured area ───────────────────────────────────────────── */}
      <div ref={printRef} className="max-w-sm mx-auto space-y-3 pb-2">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-linear-to-r from-blue-600 to-blue-500 px-5 pt-5 pb-14">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-0.5">
                  {affiliate.isHolder ? "Titular" : "Adherente"}
                </p>
                <h1 className="text-white text-xl font-bold leading-tight">
                  {affiliate.firstName} {affiliate.lastName}
                </h1>
              </div>
              <ShieldCheck className="w-8 h-8 text-blue-200 mt-0.5 shrink-0" />
            </div>
          </div>
          <div className="px-5 pb-5 -mt-10">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex gap-4">
              <div className="flex-1 space-y-2 min-w-0">
                <InfoRow label="DNI" value={affiliate.documentNumber} />
                <InfoRow label="Afiliado desde" value={formatDate(group.createdAt)} />
                <InfoRow label="Plan" value={group.plan?.name ?? "Sin plan"} />
                {group.plan && (
                  <InfoRow
                    label="Cuota mensual"
                    value={formatMoney(group.plan.monthlyFee)}
                  />
                )}
              </div>
              <div className="shrink-0 flex flex-col items-center gap-1">
                <QRCodeSVG
                  value={pageUrl}
                  size={80}
                  bgColor="#ffffff"
                  fgColor="#1e293b"
                  level="M"
                />
                <p className="text-[10px] text-slate-400 text-center leading-tight">
                  Verificación
                  <br />Online
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cobertura */}
        <Section title="Cobertura">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">Estado</span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${planStatusColor(group.planStatus)}`}
              >
                {planStatusIcon(group.planStatus)}
                {PLAN_STATUS_LABEL[group.planStatus] ?? group.planStatus}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">Día de débito</span>
              <span className="text-slate-800 text-sm font-medium">
                {group.chargeDay} de cada mes
              </span>
            </div>
            {latestPeriod && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm">Cuota actual</span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${billingStatusColor(latestPeriod.status)}`}
                  >
                    {MONTH_NAMES[latestPeriod.month - 1]} {latestPeriod.year} ·{" "}
                    {BILLING_STATUS_LABEL[latestPeriod.status] ?? latestPeriod.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 text-sm">Próximo débito</span>
                  <span className="text-slate-800 text-sm font-medium">
                    {getNextDebitDate(group.chargeDay)}
                  </span>
                </div>
              </>
            )}
            {group.gracePeriodEndsAt && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-sm">
                  Período de gracia hasta
                </span>
                <span className="text-amber-600 text-sm font-medium">
                  {formatDate(group.gracePeriodEndsAt)}
                </span>
              </div>
            )}
          </div>
        </Section>

        {/* Benefits */}
        <BenefitsSection benefits={benefits} groupCreatedAt={group.createdAt} />

        {/* Deuda */}
        {debt > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-red-700 text-xs font-semibold uppercase tracking-wider mb-0.5">
                  Deuda pendiente
                </p>
                <p className="text-red-600 text-2xl font-bold">
                  {formatMoney(debt)}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-300 shrink-0" />
            </div>
            <button
              onClick={() =>
                navigate(`/afiliado/${dni}/deuda`, {
                  state: { data },
                })
              }
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-sm font-semibold transition-colors"
            >
              Ver y pagar deuda
            </button>
          </div>
        )}

        {/* Integrantes */}
        <Section title="Integrantes del grupo">
          <ul className="space-y-2">
            {group.affiliates.map((a) => (
              <li key={a.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-blue-600 text-[11px] font-bold">
                      {a.firstName[0]}{a.lastName[0]}
                    </span>
                  </div>
                  <span className="text-slate-700 text-sm font-medium truncate">
                    {a.firstName} {a.lastName}
                  </span>
                </div>
                {a.isHolder && (
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0 ml-2">
                    Titular
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>

        {/* Métodos de pago */}
        {group.paymentMethods.length > 0 && (
          <Section title="Métodos de pago">
            <ul className="space-y-2">
              {group.paymentMethods.map((pm, idx) => (
                <li key={pm.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    {pm.type === "CARD" ? (
                      <CreditCard className="w-4 h-4 text-slate-500" />
                    ) : (
                      <Landmark className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-sm font-medium leading-tight">
                      {pm.type === "CARD"
                        ? `${pm.brand ?? "Tarjeta"} •••• ${pm.last4 ?? "****"}`
                        : `CBU · ${pm.gateway}`}
                    </p>
                    <p className="text-slate-400 text-xs">{pm.gateway}</p>
                  </div>
                  {idx === 0 && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                      Preferida
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>

      {/* Action buttons — outside PDF area */}
      <div className="max-w-sm mx-auto mt-3 flex gap-3 pb-6">
        <button
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 font-semibold text-sm py-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-sm disabled:opacity-60"
        >
          {pdfLoading ? (
            <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          {pdfLoading ? "Generando…" : "Descargar PDF"}
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold text-sm py-3 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
        >
          <Share2 className="w-4 h-4" />
          Compartir
        </button>
      </div>
    </div>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm px-5 py-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </p>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] text-slate-400 uppercase tracking-wider leading-none mb-0.5">
        {label}
      </p>
      <p className="text-slate-800 text-sm font-semibold leading-snug truncate">
        {value}
      </p>
    </div>
  );
}
