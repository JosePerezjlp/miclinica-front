import {
  BookUser,
  Briefcase,
  CalendarCheck,
  CircleAlert,
  CircleDollarSign,
  CircleX,
  CreditCard,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  NotebookPen,
  ScanText,
  Shield,
  Star,
  UserCheck,
  UserRound,
  UserRoundX,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";
import type {
  DashboardMetric,
  DashboardPayment,
  DashboardSideSection,
} from "./Dashboard.types";

export const dashboardIcons: Record<string, DashboardMetric["icon"]> = {
  totalAffiliates: Users,
  activeAffiliates: UserCheck,
  overdueInstallments: CircleAlert,
  affiliatesWithoutCoverage: UserRoundX,
  debtTotal: CircleDollarSign,
  expiringCards: CreditCard,
  failedDebits: CircleX,
  newAffiliations: UserRound,
};

export const dashboardPaymentIcons: Record<string, DashboardPayment["icon"]> = {
  paywayCard: WalletCards,
  siroCbu: Landmark,
  cash: Wallet,
};

export const sideSections: DashboardSideSection[] = [
  {
    title: "Principal",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        active: true,
        path: "/dashboard",
      },
      { label: "Afiliados", icon: BookUser, path: "/affiliate-groups" },
      { label: "Carnet Online", icon: CreditCard },
      { label: "Planes", icon: ScanText, path: "/plans" },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { label: "Afiliacion Online", icon: NotebookPen },
      { label: "Cobradores", icon: Briefcase },
      { label: "Promotores", icon: Megaphone, path: "/promoters" },
    ],
  },
  {
    title: "Administracion",
    items: [
      { label: "Auditoria", icon: Shield, path: "/audit" },
      { label: "Pagos Adelantados", icon: CalendarCheck },
      { label: "Control General", icon: ListChecks },
      { label: "Calificacion", icon: Star },
      { label: "Usuarios", icon: Users, path: "/users" },
      { label: "Roles", icon: Shield, path: "/roles" },
      { label: "Modulos", icon: Briefcase, path: "/modules" },
    ],
  },
];
