import type {
  AffiliateGroupsRow,
  PaymentGatewayProvider,
} from "./AffiliateGroups.types";

export const MONTHS = [
  "E",
  "F",
  "M",
  "A",
  "M",
  "J",
  "J",
  "A",
  "S",
  "O",
  "N",
  "D",
];

export const yearOptions = [2024, 2025, 2026];

export const planOptions = [
  "Plan Familiar",
  "Plan Individual",
  "Plan Plus",
  "Plan Premium",
];

export const provinceOptions = [
  "Buenos Aires",
  "Córdoba",
  "Santa Fe",
  "Mendoza",
  "Entre Ríos",
  "Misiones",
  "Corrientes",
  "Tucumán",
  "Salta",
  "Jujuy",
];

export const promoterOptions = [
  "Promotor 1 - Juan Pérez",
  "Promotor 2 - María García",
  "Promotor 3 - Carlos López",
];

export const sellerOptions = [
  "Vendedor 1 - Roberto Silva",
  "Vendedor 2 - Ana Martínez",
  "Vendedor 3 - Fernando Rodríguez",
];

export const cityOptions = [
  "Buenos Aires",
  "La Plata",
  "Mar del Plata",
  "Córdoba",
  "Rosario",
  "Mendoza",
  "Salta",
  "San Miguel de Tucumán",
];

export const paymentGatewayOptions: Array<{
  value: PaymentGatewayProvider;
  label: string;
}> = [
  { value: "MOBBEX", label: "Mobbex" },
  { value: "PAYWAY", label: "Payway" },
  { value: "SIRO", label: "Siro" },
];

export const affiliateRows: AffiliateGroupsRow[] = [
  {
    id: 1,
    groupName: "Clinica Goya",
    titular: "Lopez, Mauricio Gabriel",
    inscriptionDate: "2026-01-12",
    dni: "28.431.592",
    phone: "3624-541890",
    plan: "Plan Familiar",
    status: "active",
    paymentMethod: "card",
    paidMonths: ["E", "F", "M", "A"],
  },
  {
    id: 2,
    groupName: "Grupo Norte",
    titular: "Rodriguez, Ana Laura",
    inscriptionDate: "2025-11-08",
    dni: "31.209.871",
    phone: "3624-889012",
    plan: "Plan Individual",
    status: "suspended",
    paymentMethod: "cbu",
    paidMonths: ["E", "F"],
  },
  {
    id: 3,
    groupName: "Familia Perez",
    titular: "Perez, Carlos Alberto",
    inscriptionDate: "2025-06-22",
    dni: "25.671.443",
    phone: "3624-334567",
    plan: "Plan Plus",
    status: "no-coverage",
    paymentMethod: "cash",
    paidMonths: [],
  },
];
