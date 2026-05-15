import React from "react";
import type { DashboardPayment } from "./Dashboard.types";

interface DashboardPaymentCardProps {
  item: DashboardPayment;
}

const DashboardPaymentCard: React.FC<DashboardPaymentCardProps> = ({
  item,
}) => {
  const Icon = item.icon;

  return (
    <article className="bg-white border border-slate-200 rounded-2xl p-5 h-[156px] shadow-sm">
      <div className="flex items-center gap-2 text-slate-700 text-[14px] font-semibold">
        <Icon className="w-4 h-4 text-blue-600" />
        {item.title}
      </div>

      <p className="mt-5 text-[14px] leading-none font-extrabold tracking-tight tabular-nums">
        {item.value}
      </p>
      <p className="text-sm text-slate-600 mt-2">Cobrado este mes</p>
    </article>
  );
};

export default DashboardPaymentCard;
