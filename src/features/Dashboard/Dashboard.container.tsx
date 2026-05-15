import React from "react";
import DashboardMetricCard from "./Dashboard.metricCard";
import DashboardPaymentCard from "./Dashboard.paymentCard";
import type { DashboardMetric, DashboardPayment } from "./Dashboard.types";
import { paymentStats, statsBottom, statsTop } from "./Dashboard.constants.ts";

const DashboardContainer: React.FC = () => {
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
