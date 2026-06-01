import React, { useEffect, useState } from "react";
import DashboardMetricCard from "./Dashboard.metricCard";
import DashboardPaymentCard from "./Dashboard.paymentCard";
import type { DashboardMetric, DashboardPayment } from "./Dashboard.types";
import {
  dashboardIcons,
  dashboardPaymentIcons,
} from "./Dashboard.constants.ts";
import {
  dashboardService,
  type DashboardSummaryResponse,
} from "../../api/dashboard.service";

const formatInteger = (value: number) =>
  new Intl.NumberFormat("es-AR").format(value);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

const DashboardContainer: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadSummary = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await dashboardService.getSummary();
        if (active) {
          setSummary(response);
        }
      } catch (requestError: any) {
        if (active) {
          setError(
            requestError?.response?.data?.message ||
              "No se pudo cargar el dashboard.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      active = false;
    };
  }, []);

  const statsTop: DashboardMetric[] = summary
    ? [
        {
          title: "Total Afiliados",
          value: formatInteger(summary.metrics.totalAffiliates),
          icon: dashboardIcons.totalAffiliates,
        },
        {
          title: "Activos",
          value: formatInteger(summary.metrics.activeAffiliates),
          icon: dashboardIcons.activeAffiliates,
        },
        {
          title: "Cuota Vencida",
          value: formatInteger(summary.metrics.overdueInstallments),
          detail:
            summary.metrics.overdueInGracePeriod > 0
              ? `${formatInteger(summary.metrics.overdueInGracePeriod)} en periodo de gracia`
              : "Sin grupos en periodo de gracia",
          icon: dashboardIcons.overdueInstallments,
          tone: "text-red-600",
        },
        {
          title: "Sin Cobertura",
          value: formatInteger(summary.metrics.affiliatesWithoutCoverage),
          icon: dashboardIcons.affiliatesWithoutCoverage,
        },
      ]
    : [];

  const statsBottom: DashboardMetric[] = summary
    ? [
        {
          title: "Deuda Total",
          value: formatCurrency(summary.metrics.debtTotal),
          icon: dashboardIcons.debtTotal,
          accent: "border-l-2 border-l-amber-400",
        },
        {
          title: "Tarjetas por Vencer",
          value: formatInteger(summary.metrics.expiringCards),
          subtitle: "< 2 meses",
          icon: dashboardIcons.expiringCards,
          accent: "border-l-2 border-l-amber-400",
        },
        {
          title: "Debitos Rechazados",
          value: formatInteger(summary.metrics.failedDebits.total),
          subtitle: `Tarjeta: ${formatInteger(summary.metrics.failedDebits.card)} / CBU: ${formatInteger(summary.metrics.failedDebits.cbu)}`,
          icon: dashboardIcons.failedDebits,
          accent: "border-l-2 border-l-red-500",
        },
        {
          title: "Nuevas Afiliaciones",
          value: formatInteger(summary.metrics.newAffiliations.currentMonth),
          subtitle: "Este mes",
          trend: summary.metrics.newAffiliations.trend,
          tone: summary.metrics.newAffiliations.trend?.startsWith("-")
            ? "text-red-600"
            : "text-emerald-600",
          icon: dashboardIcons.newAffiliations,
          accent: "",
        },
      ]
    : [];

  const paymentStats: DashboardPayment[] = summary
    ? [
        {
          title: "Tarjeta (Payway)",
          value: formatCurrency(summary.collections.paywayCard),
          icon: dashboardPaymentIcons.paywayCard,
        },
        {
          title: "CBU (Siro)",
          value: formatCurrency(summary.collections.siroCbu),
          icon: dashboardPaymentIcons.siroCbu,
        },
        {
          title: "Efectivo",
          value: formatCurrency(summary.collections.cash),
          icon: dashboardPaymentIcons.cash,
        },
      ]
    : [];

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <header className="mb-1">
        <h1 className="text-4xl leading-none font-extrabold tracking-tight">
          Dashboard
        </h1>
        <p className="text-xl text-slate-600 mt-2">
          Vista general del sistema de gestion
        </p>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && !summary && (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Cargando metricas del dashboard...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsTop.map((item: DashboardMetric) => (
          <DashboardMetricCard key={item.title} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsBottom.map((item: DashboardMetric) => (
          <DashboardMetricCard
            key={item.title}
            item={item}
            showGrowthOnNewAffiliations
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {paymentStats.map((item: DashboardPayment) => (
          <DashboardPaymentCard key={item.title} item={item} />
        ))}
      </div>
    </div>
  );
};

export default DashboardContainer;
