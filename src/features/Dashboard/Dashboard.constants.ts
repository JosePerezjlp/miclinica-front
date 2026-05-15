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

export const statsTop: DashboardMetric[] = [
  {
    title: "Total Afiliados",
    value: "2,847",
    detail: "",
    trend: "+12.5%",
    icon: Users,
    tone: "text-emerald-600",
  },
  {
    title: "Activos",
    value: "2,156",
    detail: "",
    trend: "+8.2%",
    icon: UserCheck,
    tone: "text-emerald-600",
  },
  {
    title: "Cuota Vencida",
    value: "384",
    detail: "En periodo de gracia",
    trend: "+2.1%",
    icon: CircleAlert,
    tone: "text-red-600",
  },
  {
    title: "Sin Cobertura",
    value: "307",
    detail: "",
    trend: "-5.3%",
    icon: UserRoundX,
    tone: "text-emerald-600",
  },
];

export const statsBottom: DashboardMetric[] = [
  {
    title: "Deuda Total",
    value: "$8,456,200",
    subtitle: "",
    icon: CircleDollarSign,
    accent: "border-l-2 border-l-amber-400",
  },
  {
    title: "Tarjetas por Vencer",
    value: "127",
    subtitle: "< 2 meses",
    icon: CreditCard,
    accent: "border-l-2 border-l-amber-400",
  },
  {
    title: "Debitos Rechazados",
    value: "89",
    subtitle: "Tarjeta: 52 / CBU: 37",
    icon: CircleX,
    accent: "border-l-2 border-l-red-500",
  },
  {
    title: "Nuevas Afiliaciones",
    value: "58",
    subtitle: "Este mes",
    icon: UserRound,
    accent: "",
  },
];

export const paymentStats: DashboardPayment[] = [
  { title: "Tarjeta (Payway)", value: "$3,200,000", icon: WalletCards },
  { title: "CBU (Siro)", value: "$1,800,000", icon: Landmark },
  { title: "Efectivo", value: "$800,000", icon: Wallet },
];

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
      { label: "Planes", icon: ScanText },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { label: "Afiliacion Online", icon: NotebookPen },
      { label: "Cobradores", icon: Briefcase },
      { label: "Promotores", icon: Megaphone },
    ],
  },
  {
    title: "Administracion",
    items: [
      { label: "Auditoria", icon: Shield },
      { label: "Pagos Adelantados", icon: CalendarCheck },
      { label: "Control General", icon: ListChecks },
      { label: "Calificacion", icon: Star },
    ],
  },
];
