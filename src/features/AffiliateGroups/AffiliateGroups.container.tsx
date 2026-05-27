import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  CreditCard,
  Landmark,
  Minus,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import type {
  AffiliateStatus,
  CreateGroupSubmitResult,
  CreateAffiliateGroupModalPayload,
} from "./AffiliateGroups.types";
import { MONTHS, yearOptions } from "./AffiliateGroups.constants";
import AffiliateGroupsCreateModal from "./AffiliateGroups.createModal";
import type { AppDispatch, RootState } from "../../store/store";
import { getGroupsThunk, onCreateGroupThunk } from "./AffiliateGroups.action";

const STATUS_CLASS: Record<AffiliateStatus, string> = {
  active: "bg-emerald-100 text-emerald-700",
  suspended: "bg-amber-100 text-amber-700",
  "no-coverage": "bg-red-100 text-red-700",
};

const PAYMENT_METHOD_LABEL = {
  card: "CARD",
  cbu: "CBU",
  cash: "EFECTIVO",
} as const;

const PAYMENT_METHOD_ICON = {
  card: CreditCard,
  cbu: Landmark,
  cash: Wallet,
} as const;

const AffiliateGroupsContainer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { data } = useSelector((state: RootState) => state.affiliateGroups);
  const createGroupLoading = useSelector(
    (state: RootState) => state.affiliateGroups.createGroupLoading,
  );

  const [dni, setDni] = useState("");
  const [year, setYear] = useState(yearOptions[yearOptions.length - 1]);
  const [showGroups, setShowGroups] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState<
    "all" | "card" | "cbu" | "cash"
  >("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleClear = () => {
    setDni("");
    setPaymentFilter("all");
  };

  const handleCreateAffiliate = async (
    data: CreateAffiliateGroupModalPayload,
  ): Promise<CreateGroupSubmitResult | undefined> => {
    if (createGroupLoading) return undefined;
    return dispatch(onCreateGroupThunk(data));
  };

  const handleViewGroup = (groupId: number) => {
    navigate(`/affiliate-groups/${groupId}`);
  };

  useEffect(() => {
    dispatch(getGroupsThunk());
  }, [dispatch]);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-none font-extrabold tracking-tight">
            Afiliados
          </h1>
          <p className="text-xl text-slate-600 mt-2">
            Gestión de Grupos de Afiliados
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Crear Grupo de Afiliados
          </button>
          <button
            type="button"
            className="h-10 px-5 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Continuar Suscripción
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm">Filtro Medio de Pago</span>
            <select
              value={paymentFilter}
              onChange={(e) =>
                setPaymentFilter(
                  e.target.value as "all" | "card" | "cbu" | "cash",
                )
              }
              className="h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos</option>
              <option value="card">Tarjeta</option>
              <option value="cbu">CBU</option>
              <option value="cash">Efectivo</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowGroups((prev) => !prev)}
            className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold transition-colors ${
              showGroups
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <BadgeCheck className="w-4 h-4" />
            {showGroups ? "Ocultar Grupos" : "Desplegar Grupos"}
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-600 ml-auto">
            <span>Año de pagos:</span>
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setYear((y) => y - 1)}
                className="px-3 py-1.5 hover:bg-slate-100 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="px-3 py-1.5 font-semibold text-slate-900 min-w-[52px] text-center border-x border-slate-200">
                {year}
              </span>
              <button
                type="button"
                onClick={() => setYear((y) => y + 1)}
                className="px-3 py-1.5 hover:bg-slate-100 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="relative ml-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por DNI"
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                className="h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>

        {showGroups && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Grupo</th>
                  <th className="px-4 py-3 font-semibold">Titular</th>
                  <th className="px-4 py-3 font-semibold">
                    Fecha de Inscripción
                  </th>
                  <th className="px-4 py-3 font-semibold">DNI</th>
                  <th className="px-4 py-3 font-semibold">Teléfono</th>
                  <th className="px-4 py-3 font-semibold">Plan</th>
                  <th className="px-4 py-3 font-semibold">Medio de Pago</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Cobros {year}</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {Array.isArray(data) && data.length > 0 ? (
                  data.map((group: any) => {
                    const paymentTypeRaw =
                      group.paymentMethods?.[0]?.type ?? "cash";
                    const paymentType =
                      paymentTypeRaw.toLowerCase() as keyof typeof PAYMENT_METHOD_ICON;
                    const PaymentIcon =
                      PAYMENT_METHOD_ICON[paymentType] ?? Wallet;
                    const holder = group.affiliates?.find(
                      (a: any) => a.isHolder,
                    );

                    return (
                      <tr
                        key={group.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-slate-400 font-medium">
                          {group.id}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          <div>{group.name}</div>
                          {group.promoter?.name && (
                            <div className="mt-1 text-xs font-medium text-slate-500">
                              Promotor: {group.promoter.name}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {group.holderFullName}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {new Date(group.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-mono text-xs">
                          {holder?.documentNumber ?? "N/A"}
                        </td>
                        <td className="px-4 py-4 text-slate-600">N/A</td>
                        <td className="px-4 py-4 text-slate-600">
                          {group.plan?.name ?? "N/A"}
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold">
                            <PaymentIcon className="w-3 h-3" />
                            {PAYMENT_METHOD_LABEL[paymentType] ??
                              paymentTypeRaw}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_CLASS[group.planStatus?.toLowerCase() as AffiliateStatus] ?? "bg-slate-100 text-slate-700"}`}
                          >
                            {group.planStatus ?? "N/A"}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-0.5">
                            {MONTHS.map((m: string, i: number) => (
                              <span
                                key={`${m}-${i}`}
                                className="w-6 h-6 flex items-center justify-center text-[10px] font-bold rounded bg-slate-100 text-slate-400"
                              >
                                {m}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleViewGroup(group.id)}
                            className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            Consultar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={11}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No hay grupos disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-6 py-3 border-t border-slate-100 text-sm text-slate-500 flex items-center justify-between">
          <p>
            Mostrando{" "}
            <span className="font-semibold text-slate-700">
              {Array.isArray(data) ? data.length : 0}
            </span>{" "}
            resultados
          </p>
          <p>
            {Array.isArray(data) && data.length > 0
              ? `1-${data.length} de ${data.length}`
              : "0 de 0"}
          </p>
        </div>
      </div>

      <AffiliateGroupsCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateAffiliate}
      />
    </div>
  );
};

export default AffiliateGroupsContainer;
