import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Users,
  CreditCard,
  FileText,
  Edit2,
  Plus,
  DollarSign,
} from "lucide-react";
import type { AppDispatch, RootState } from "../../store/store";
import { getGroupDetailThunk } from "./AffiliateGroups.detail.action";
import GroupInfoModal from "./modals/AffiliateGroups.groupInfo.modal";
import MembersModal from "./modals/AffiliateGroups.members.modal";
import PaymentMethodsModal from "./modals/AffiliateGroups.paymentMethods.modal";
import PlansModal from "./modals/AffiliateGroups.plans.modal";
import BillingModal from "./modals/AffiliateGroups.billing.modal";

const AffiliateGroupsDetailContainer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const {
    data: groupData,
    loading,
    error,
  } = useSelector(
    (state: RootState) =>
      state.groupDetail || { data: null, loading: false, error: null },
  );

  const [activeModal, setActiveModal] = useState<
    "info" | "members" | "payments" | "plans" | "billing" | null
  >(null);

  useEffect(() => {
    if (id) {
      dispatch(getGroupDetailThunk(parseInt(id, 10)));
    }
  }, [id, dispatch]);

  if (!id) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-slate-600">ID de grupo no válido</p>
      </div>
    );
  }

  if (loading && !groupData) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!groupData) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-red-600">{error || "Grupo no encontrado"}</p>
      </div>
    );
  }

  const holder = groupData.affiliates?.find((a) => a.isHolder);
  const planStatus = groupData.planStatus || "N/A";
  const activeMethods =
    groupData.paymentMethods?.filter((m) => m.isActive) || [];
  const nextAutomaticMethod = activeMethods[0] ?? null;
  const recentPayments = groupData.payments?.slice(0, 3) || [];
  const billingBalance = groupData.currentAccount?.balance || 0;

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/affiliate-groups")}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Volver"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {groupData.name}
            </h1>
            <p className="text-slate-500 mt-1">Grupo ID: #{groupData.id}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">Titular</p>
          <p className="text-lg font-semibold text-slate-900">
            {holder?.firstName} {holder?.lastName}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Plan Actual</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {groupData.plan?.name || "N/A"}
              </p>
            </div>
            <FileText className="w-10 h-10 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Miembros</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {groupData.affiliates?.length || 0}
              </p>
            </div>
            <Users className="w-10 h-10 text-emerald-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Formas de Pago</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                {activeMethods.length}
              </p>
            </div>
            <CreditCard className="w-10 h-10 text-amber-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Saldo Cuenta</p>
              <p className="text-2xl font-bold text-slate-900 mt-2">
                ${billingBalance.toFixed(2)}
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-red-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Grupo */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Información del Grupo
              </h2>
              <button
                onClick={() => setActiveModal("info")}
                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold">
                    Nombre del Grupo
                  </p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {groupData.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold">
                    Titular
                  </p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {groupData.holderFullName}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold">
                    DNI Titular
                  </p>
                  <p className="text-lg font-mono text-slate-900 mt-1">
                    {holder?.documentNumber}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold">
                    Estado
                  </p>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-lg text-sm font-semibold ${
                      groupData.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {groupData.isActive ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold">
                    Fecha de Inscripción
                  </p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {new Date(groupData.createdAt).toLocaleDateString("es-AR")}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500 font-semibold">
                    Calificación
                  </p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {groupData.rating}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Miembros del Grupo */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Miembros del Grupo
              </h2>
              <button
                onClick={() => setActiveModal("members")}
                className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Gestionar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <th className="px-4 py-3 text-left">Nombre</th>
                    <th className="px-4 py-3 text-left">DNI</th>
                    <th className="px-4 py-3 text-left">Fecha Nacimiento</th>
                    <th className="px-4 py-3 text-center">Titular</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupData.affiliates?.map((affiliate) => (
                    <tr
                      key={affiliate.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {affiliate.firstName} {affiliate.lastName}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 text-xs">
                        {affiliate.documentNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(affiliate.birthDate).toLocaleDateString(
                          "es-AR",
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {affiliate.isHolder && (
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                            Sí
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Formas de Pago */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Formas de Pago
              </h2>
              <button
                onClick={() => setActiveModal("payments")}
                className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-sm font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Gestionar
              </button>
            </div>

            {activeMethods.length > 0 ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
                  <p className="text-sm font-semibold text-blue-900">
                    La proxima cuota se cobrara automaticamente.
                  </p>
                  <p className="mt-1 text-sm text-blue-700">
                    Metodo programado: {nextAutomaticMethod?.gateway}{" "}
                    {nextAutomaticMethod?.brand
                      ? `- ${nextAutomaticMethod.brand}`
                      : ""}
                    {nextAutomaticMethod?.last4
                      ? ` •••• ${nextAutomaticMethod.last4}`
                      : ""}
                    . Solo se cobrara ahora si el operador ejecuta un cobro
                    manual desde la gestion del grupo.
                  </p>
                </div>

                {activeMethods.map((method) => (
                  <div
                    key={method.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <CreditCard className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="font-semibold text-slate-900">
                          {method.type} - {method.gateway}
                        </p>
                        <p className="text-sm text-slate-500">
                          {method.brand && `${method.brand} `}
                          {method.last4 && `•••• ${method.last4}`}
                          {method.holderName && ` - ${method.holderName}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {method.expiresAt && (
                        <p className="text-xs text-slate-500">
                          Vence:{" "}
                          {new Date(method.expiresAt).toLocaleDateString(
                            "es-AR",
                          )}
                        </p>
                      )}
                      <span className="inline-block mt-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-semibold">
                        Activo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">
                No hay formas de pago registradas
              </p>
            )}
          </div>
        </div>

        {/* Right Column - Secondary Info */}
        <div className="space-y-6">
          {/* Plan */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Plan</h2>
              <button
                onClick={() => setActiveModal("plans")}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Nombre
                </p>
                <p className="text-lg font-semibold text-slate-900 mt-1">
                  {groupData.plan?.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Cuota Mensual
                </p>
                <p className="text-lg font-semibold text-slate-900 mt-1"></p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500 font-semibold">
                  Estado del Plan
                </p>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-lg text-xs font-semibold ${
                    planStatus === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {planStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Pagos Recientes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">
                Pagos Recientes
              </h2>
              <button
                onClick={() => setActiveModal("billing")}
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
              >
                Ver todo
              </button>
            </div>

            {recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {payment.month}/{payment.year}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-semibold ${
                          payment.status === "PAID"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      ${payment.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-6 text-sm">
                Sin pagos registrados
              </p>
            )}
          </div>

          {/* Status Overview */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              Estado General
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Proxima cuota</span>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    nextAutomaticMethod
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {nextAutomaticMethod
                    ? `Automatico por ${nextAutomaticMethod.gateway}`
                    : "Sin debito automatico"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  Período de Gracia
                </span>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    groupData.gracePeriodEndsAt
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {groupData.gracePeriodEndsAt ? "Activo" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === "info" && (
        <GroupInfoModal
          groupData={groupData}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "members" && (
        <MembersModal
          groupData={groupData}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "payments" && (
        <PaymentMethodsModal
          groupData={groupData}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "plans" && (
        <PlansModal
          groupData={groupData}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "billing" && (
        <BillingModal
          groupData={groupData}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
};

export default AffiliateGroupsDetailContainer;
