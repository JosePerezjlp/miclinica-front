import axios from "axios";

const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

export interface AfiliadoPublicData {
  affiliate: {
    id: number;
    firstName: string;
    lastName: string;
    documentNumber: string;
    birthDate: string;
    isHolder: boolean;
    familiarGroupId: number;
    createdAt: string;
  };
  group: {
    id: number;
    name: string;
    holderFullName: string;
    isActive: boolean;
    chargeDay: number;
    planStatus: string;
    gracePeriodEndsAt: string | null;
    createdAt: string;
    plan: {
      id: number;
      name: string;
      monthlyFee: number | string;
      gracePeriodDays: number;
    } | null;
    affiliates: Array<{
      id: number;
      firstName: string;
      lastName: string;
      documentNumber: string;
      birthDate: string;
      isHolder: boolean;
      createdAt: string;
    }>;
    currentAccount: {
      balanceCapital: number | string;
      balanceInterest: number | string;
      advanceBalance: number | string;
    } | null;
    paymentMethods: Array<{
      id: number;
      type: string;
      last4: string | null;
      brand: string | null;
      priority: number;
      gateway: string;
    }>;
    billingPeriods: Array<{
      id: number;
      month: number;
      year: number;
      status: string;
      amountDue: number | string;
      dueDate: string;
    }>;
  };
}

export async function getAfiliadoByDni(
  dni: string,
): Promise<AfiliadoPublicData> {
  const { data } = await publicClient.get<AfiliadoPublicData>(
    `/public/afiliado/${dni}`,
  );
  return data;
}
