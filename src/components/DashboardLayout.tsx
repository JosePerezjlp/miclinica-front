import React from "react";
import DashboardSidebar from "../features/Dashboard/Dashboard.sidebar";
import DashboardTopbar from "../features/Dashboard/Dashboard.topbar";
import { sideSections } from "../features/Dashboard/Dashboard.constants";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <section className="min-h-screen w-full bg-slate-100 flex text-slate-900">
      <DashboardSidebar sections={sideSections} />
      <div className="flex-1 min-w-0 flex flex-col">
        <DashboardTopbar />
        <main className="flex-1 overflow-auto bg-slate-100">{children}</main>
      </div>
    </section>
  );
};

export default DashboardLayout;
