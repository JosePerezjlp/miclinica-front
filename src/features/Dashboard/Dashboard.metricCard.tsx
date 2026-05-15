import React from "react";
import type { DashboardMetric } from "./Dashboard.types";

interface DashboardMetricCardProps {
  item: DashboardMetric;
  showGrowthOnNewAffiliations?: boolean;
}

const DashboardMetricCard: React.FC<DashboardMetricCardProps> = ({
  item,
  showGrowthOnNewAffiliations = false,
}) => {
  const Icon = item.icon;

  return (
    <article
      className={`bg-white border border-slate-200 rounded-2xl p-5 h-[182px] shadow-sm ${item.accent ?? ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[14px] font-medium text-slate-600">{item.title}</p>
        <span className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-slate-500" strokeWidth={1.8} />
        </span>
      </div>

      <p className="mt-2 text-[16px] leading-none font-extrabold tracking-tight tabular-nums">
        {item.value}
      </p>

      {item.detail && (
        <p className="text-[14px] text-slate-600 mt-1">{item.detail}</p>
      )}
      {item.subtitle && (
        <p className="text-sm text-slate-600 mt-2">{item.subtitle}</p>
      )}
      {item.trend && (
        <p
          className={`text-sm font-semibold mt-2 ${item.tone ?? "text-emerald-600"}`}
        >
          ↗ {item.trend}
        </p>
      )}
      {showGrowthOnNewAffiliations && item.title === "Nuevas Afiliaciones" && (
        <p className="text-sm font-semibold mt-2 text-emerald-600">↗ +41.5%</p>
      )}
    </article>
  );
};

export default DashboardMetricCard;
