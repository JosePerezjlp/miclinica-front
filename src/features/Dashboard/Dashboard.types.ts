import type { LucideIcon } from "lucide-react";

export interface DashboardSideItem {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  path?: string;
}

export interface DashboardSideSection {
  title: string;
  items: DashboardSideItem[];
}

export interface DashboardMetric {
  title: string;
  value: string;
  icon: LucideIcon;
  detail?: string;
  subtitle?: string;
  trend?: string;
  tone?: string;
  accent?: string;
}

export interface DashboardPayment {
  title: string;
  value: string;
  icon: LucideIcon;
}
