import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  CreditCard,
  Landmark,
  MessageCircle,
  Search,
  Wallet,
} from "lucide-react";
import type {
  AffiliateStatus,
  CreateGroupSubmitResult,
  CreateAffiliateGroupModalPayload,
} from "./AffiliateGroups.types";
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

const GROUP_STATUS_LABEL: Record<string, string> = {
  ACTIVE: "ACTIVO",
  EXPIRED: "EXPIRADO",
  NO_COVERAGE: "SIN COBERTURA",
  GRACE_PERIOD: "GRACIA",
};

const buildWhatsAppUrl = (phone?: string | null) => {
  const digits = (phone ?? "").replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : null;
};

const formatAffiliateName = (affiliate: {
  firstName?: string | null;
  lastName?: string | null;
}) => {
  const fullName = [affiliate.firstName, affiliate.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "Sin nombre";
};

const PhoneLink: React.FC<{ phone?: string | null }> = ({ phone }) => {
  const whatsappUrl = buildWhatsAppUrl(phone);

  if (!phone || !whatsappUrl) {
    return <span>{phone ?? "N/A"}</span>;
  }

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 hover:underline"
      title={`Enviar WhatsApp a ${phone}`}
    >
      <span>{phone}</span>
      <MessageCircle className="w-4 h-4" />
    </a>
  );
};

const AffiliateGroupsContainer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { data, meta, loading, createGroupLoading } = useSelector(
    (state: RootState) => state.affiliateGroups,
  );

  const [dni, setDni] = useState("");
  const [showGroups, setShowGroups] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState<
    "all" | "card" | "cbu" | "cash"
  >("all");
  const [page, setPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleClear = () => {
    setDni("");
    setPaymentFilter("all");
    setPage(1);
  };

  const handleCreateAffiliate = async (
    data: CreateAffiliateGroupModalPayload,
  ): Promise<CreateGroupSubmitResult | undefined> => {
    if (createGroupLoading) return undefined;

    const result = await dispatch(onCreateGroupThunk(data));

    if (result?.group) {
      setPage(1);
      dispatch(
        getGroupsThunk({
          page: 1,
          pageSize: meta.pageSize,
          dni,
          paymentType: paymentFilter,
        }),
      );
    }

    return result;
  };

  const handleViewGroup = (groupId: number) => {
    navigate(`/affiliate-groups/${groupId}`);
  };

  useEffect(() => {
    dispatch(
      getGroupsThunk({
        page,
        pageSize: meta.pageSize,
        dni,
        paymentType: paymentFilter,
      }),
    );
  }, [dispatch, page, meta.pageSize, dni, paymentFilter]);

  useEffect(() => {
    setPage(1);
  }, [dni, paymentFilter]);

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
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {Array.isArray(data) && data.filter(Boolean).length > 0 ? (
                data.filter(Boolean).map((group: any) => {
                  const paymentTypeRaw =
                    group.paymentMethods?.[0]?.type ?? "cash";
                  const paymentType =
                    paymentTypeRaw.toLowerCase() as keyof typeof PAYMENT_METHOD_ICON;
                  const PaymentIcon =
                    PAYMENT_METHOD_ICON[paymentType] ?? Wallet;
                  const affiliates = Array.isArray(group.affiliates)
                    ? group.affiliates.filter(Boolean)
                    : [];

                  return (
                    <React.Fragment key={group.id}>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-slate-400 font-medium">
                          {group.id}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-900">
                          <div>{group.name}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-700">
                          {group.promoter?.name ? (
                            <div>
                              <div>{group.promoter.name}</div>
                              <div className="mt-1 text-xs font-medium text-slate-500">
                                Promotor
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-4 text-slate-600">
                          {new Date(group.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-4 text-slate-600 font-mono text-xs">
                          -
                        </td>
                        <td className="px-4 py-4 text-slate-600">-</td>
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
                            {GROUP_STATUS_LABEL[group.planStatus ?? ""] ??
                              group.planStatus ??
                              "N/A"}
                          </span>
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

                      {showGroups &&
                        affiliates.map((affiliate: any, index: number) => (
                          <tr
                            key={`${group.id}-affiliate-${affiliate.id}`}
                            className={
                              affiliate.isVerified
                                ? "bg-emerald-50/80 text-slate-700"
                                : "bg-rose-50/80 text-slate-700"
                            }
                          >
                            <td className="px-6 py-3 text-slate-400 font-medium">
                              {index === 0 ? "" : ""}
                            </td>
                            <td className="px-4 py-3">
                              {affiliate.isHolder ? (
                                <span>-</span>
                              ) : (
                                <div className="pl-4 border-l-2 border-slate-200">
                                  <div className="font-medium text-slate-700">
                                    {formatAffiliateName(affiliate)}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    Integrante
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {affiliate.isHolder ? (
                                <div>
                                  <div className="font-medium text-slate-700">
                                    {formatAffiliateName(affiliate)}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    Titular
                                  </div>
                                </div>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {affiliate.birthDate
                                ? new Date(
                                    affiliate.birthDate,
                                  ).toLocaleDateString()
                                : "N/A"}
                            </td>
                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                              {affiliate.documentNumber ?? "N/A"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              <PhoneLink phone={affiliate.phone} />
                            </td>
                            <td className="px-4 py-3 text-slate-600">-</td>
                            <td className="px-4 py-3 text-slate-500 text-xs">
                              -
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col items-start gap-1">
                                <span className="text-[11px] font-medium text-slate-500">
                                  {affiliate.isActive ? "ACTIVO" : "INACTIVO"}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-slate-400">
                              Afiliado
                            </td>
                          </tr>
                        ))}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    {loading
                      ? "Cargando grupos..."
                      : "No hay grupos disponibles"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 text-sm text-slate-500 flex items-center justify-between">
          <p>
            Mostrando{" "}
            <span className="font-semibold text-slate-700">{data.length}</span>{" "}
            resultados
          </p>
          <div className="flex items-center gap-3">
            <p>
              {meta.total > 0
                ? `${(meta.page - 1) * meta.pageSize + 1}-${Math.min(
                    meta.page * meta.pageSize,
                    meta.total,
                  )} de ${meta.total}`
                : "0 de 0"}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1 || loading}
                className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="min-w-[64px] text-center text-slate-700 font-semibold">
                {meta.page}/{meta.totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(meta.totalPages || 1, current + 1),
                  )
                }
                disabled={page >= meta.totalPages || loading}
                className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
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
