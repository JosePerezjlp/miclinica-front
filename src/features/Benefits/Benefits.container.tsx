import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Gift,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { getPlansThunk } from "../Plans/Plans.action";
import {
  createBenefitThunk,
  deleteBenefitThunk,
  getBenefitsThunk,
  updateBenefitThunk,
} from "./Benefits.action";
import type { Benefit, CreateBenefitRequest } from "./Benefits.types";

type BenefitType = "percent" | "fixed" | "perk";

type BenefitFormState = {
  name: string;
  description: string;
  benefitType: BenefitType;
  discountPercent: string;
  discountFixed: string;
  freeDescription: string;
  minMethodCount: string;
  requiresGateway: string;
  requiresMethodType: string;
  requiresCardBrand: string;
  requiresBank: string;
  minMonthsActive: string;
  maxMonthsActive: string;
  planIds: number[];
};

const emptyBenefitForm: BenefitFormState = {
  name: "",
  description: "",
  benefitType: "percent",
  discountPercent: "",
  discountFixed: "",
  freeDescription: "",
  minMethodCount: "",
  requiresGateway: "",
  requiresMethodType: "",
  requiresCardBrand: "",
  requiresBank: "",
  minMonthsActive: "",
  maxMonthsActive: "",
  planIds: [],
};

function formatCurrency(value: number | string) {
  const n = typeof value === "number" ? value : Number(value);
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number.isNaN(n) ? 0 : n);
}

function benefitSummary(b: Benefit): string {
  if (b.discountPercent !== null && b.discountPercent !== undefined) {
    return `${b.discountPercent}% de descuento`;
  }
  if (b.discountFixed !== null && b.discountFixed !== undefined) {
    return `${formatCurrency(b.discountFixed)} de descuento`;
  }
  return b.freeDescription ?? "Beneficio";
}

function benefitCondition(b: Benefit): string {
  const parts: string[] = [];
  if (b.minMethodCount) parts.push(`≥${b.minMethodCount} métodos activos`);
  if (b.requiresGateway) parts.push(`Gateway: ${b.requiresGateway}`);
  if (b.requiresMethodType) parts.push(b.requiresMethodType);
  if (b.requiresCardBrand) parts.push(b.requiresCardBrand);
  if (b.requiresBank) parts.push(`Banco: ${b.requiresBank}`);
  if (b.minMonthsActive) parts.push(`≥${b.minMonthsActive} meses`);
  return parts.length > 0 ? parts.join(" · ") : "Sin condición específica";
}

function buildBenefitPayload(form: BenefitFormState): CreateBenefitRequest {
  const payload: CreateBenefitRequest = {
    name: form.name.trim(),
    planIds: form.planIds,
  };
  if (form.description.trim()) payload.description = form.description.trim();
  if (form.benefitType === "percent" && form.discountPercent)
    payload.discountPercent = Number(form.discountPercent);
  if (form.benefitType === "fixed" && form.discountFixed)
    payload.discountFixed = Number(form.discountFixed);
  if (form.benefitType === "perk" && form.freeDescription.trim())
    payload.freeDescription = form.freeDescription.trim();
  if (form.minMethodCount) payload.minMethodCount = Number(form.minMethodCount);
  if (form.requiresGateway) payload.requiresGateway = form.requiresGateway;
  if (form.requiresMethodType) payload.requiresMethodType = form.requiresMethodType;
  if (form.requiresCardBrand.trim()) payload.requiresCardBrand = form.requiresCardBrand.trim();
  if (form.requiresBank.trim()) payload.requiresBank = form.requiresBank.trim();
  if (form.minMonthsActive) payload.minMonthsActive = Number(form.minMonthsActive);
  if (form.maxMonthsActive) payload.maxMonthsActive = Number(form.maxMonthsActive);
  return payload;
}

function buildBenefitForm(b: Benefit): BenefitFormState {
  let benefitType: BenefitType = "perk";
  if (b.discountPercent !== null && b.discountPercent !== undefined) benefitType = "percent";
  else if (b.discountFixed !== null && b.discountFixed !== undefined) benefitType = "fixed";
  return {
    name: b.name,
    description: b.description ?? "",
    benefitType,
    discountPercent: b.discountPercent !== null && b.discountPercent !== undefined ? String(b.discountPercent) : "",
    discountFixed: b.discountFixed !== null && b.discountFixed !== undefined ? String(b.discountFixed) : "",
    freeDescription: b.freeDescription ?? "",
    minMethodCount: b.minMethodCount !== null && b.minMethodCount !== undefined ? String(b.minMethodCount) : "",
    requiresGateway: b.requiresGateway ?? "",
    requiresMethodType: b.requiresMethodType ?? "",
    requiresCardBrand: b.requiresCardBrand ?? "",
    requiresBank: b.requiresBank ?? "",
    minMonthsActive: b.minMonthsActive !== null && b.minMonthsActive !== undefined ? String(b.minMonthsActive) : "",
    maxMonthsActive: b.maxMonthsActive !== null && b.maxMonthsActive !== undefined ? String(b.maxMonthsActive) : "",
    planIds: b.plans.map((p) => p.id),
  };
}

const BenefitsContainer = () => {
  const dispatch = useAppDispatch();
  const { data, loading, saveLoading } = useAppSelector((s) => s.benefits);
  const { data: plans } = useAppSelector((s) => s.plans);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBenefit, setEditingBenefit] = useState<Benefit | null>(null);
  const [form, setForm] = useState<BenefitFormState>(emptyBenefitForm);
  const [showConditions, setShowConditions] = useState(false);

  useEffect(() => {
    dispatch(getBenefitsThunk());
    dispatch(getPlansThunk());
  }, [dispatch]);

  const filteredBenefits = data.filter((benefit) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || benefit.name.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? benefit.isActive : !benefit.isActive);
    return matchesQuery && matchesStatus;
  });

  const togglePlan = (planId: number) => {
    setForm((current) => ({
      ...current,
      planIds: current.planIds.includes(planId)
        ? current.planIds.filter((id) => id !== planId)
        : [...current.planIds, planId],
    }));
  };

  const openCreateModal = () => {
    setEditingBenefit(null);
    setForm(emptyBenefitForm);
    setShowConditions(false);
    setIsModalOpen(true);
  };

  const openEditModal = (benefit: Benefit) => {
    setEditingBenefit(benefit);
    setForm(buildBenefitForm(benefit));
    setShowConditions(
      !!(benefit.requiresGateway || benefit.requiresMethodType || benefit.requiresCardBrand || benefit.requiresBank || benefit.minMonthsActive || benefit.maxMonthsActive),
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saveLoading) return;
    setIsModalOpen(false);
    setEditingBenefit(null);
    setForm(emptyBenefitForm);
    setShowConditions(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    const payload = buildBenefitPayload(form);

    if (editingBenefit) {
      await dispatch(updateBenefitThunk(editingBenefit.id, payload));
    } else {
      await dispatch(createBenefitThunk(payload));
    }
    closeModal();
  };

  const handleToggleActive = async (benefit: Benefit) => {
    if (benefit.isActive) {
      await dispatch(deleteBenefitThunk(benefit.id));
    } else {
      await dispatch(updateBenefitThunk(benefit.id, { isActive: true }));
    }
  };

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-none font-extrabold tracking-tight">
            Beneficios
          </h1>
          <p className="text-xl text-slate-600 mt-2">
            Beneficios aplicables a uno o varios planes
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Crear Beneficio
        </button>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
            className="h-10 px-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Beneficio</th>
                <th className="px-4 py-3 font-semibold">Condición</th>
                <th className="px-4 py-3 font-semibold">Planes</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBenefits.map((benefit) => (
                <tr key={benefit.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-slate-400 font-medium">{benefit.id}</td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">{benefit.name}</div>
                    <div className="text-xs text-violet-700 font-medium mt-0.5">
                      {benefitSummary(benefit)}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600 max-w-[220px]">
                    {benefitCondition(benefit)}
                  </td>
                  <td className="px-4 py-4">
                    {benefit.plans.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {benefit.plans.map((plan) => (
                          <span
                            key={plan.id}
                            className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700"
                          >
                            {plan.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Sin planes asignados</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        benefit.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {benefit.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(benefit)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(benefit)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          benefit.isActive
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {benefit.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredBenefits.length === 0 && (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">
            No hay beneficios que coincidan con el filtro actual.
          </div>
        )}
        {loading && (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">
            Cargando beneficios...
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 px-4 py-8 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {editingBenefit ? "Editar beneficio" : "Nuevo beneficio"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Definí el tipo de beneficio, sus condiciones y a qué planes aplica.
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="sm:col-span-2 space-y-1 text-xs font-semibold text-slate-700">
                  <span>Nombre del beneficio *</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Descuento por segundo método"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </label>

                <label className="sm:col-span-2 space-y-1 text-xs font-semibold text-slate-700">
                  <span>Descripción (opcional)</span>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Descripción visible para el operador"
                    className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                  />
                </label>

                <div className="sm:col-span-2 space-y-2">
                  <p className="text-xs font-semibold text-slate-700">Tipo de beneficio *</p>
                  <div className="flex gap-2">
                    {(
                      [
                        { value: "percent", label: "Descuento %" },
                        { value: "fixed", label: "Descuento fijo $" },
                        { value: "perk", label: "Beneficio/Servicio" },
                      ] as { value: BenefitType; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, benefitType: opt.value }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                          form.benefitType === opt.value
                            ? "bg-violet-600 text-white border-violet-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-violet-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.benefitType === "percent" && (
                  <label className="sm:col-span-2 space-y-1 text-xs font-semibold text-slate-700">
                    <span>Porcentaje de descuento</span>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={form.discountPercent}
                        onChange={(e) => setForm((f) => ({ ...f, discountPercent: e.target.value }))}
                        placeholder="10"
                        className="w-full h-9 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                    </div>
                  </label>
                )}

                {form.benefitType === "fixed" && (
                  <label className="sm:col-span-2 space-y-1 text-xs font-semibold text-slate-700">
                    <span>Monto de descuento</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.discountFixed}
                        onChange={(e) => setForm((f) => ({ ...f, discountFixed: e.target.value }))}
                        placeholder="5000"
                        className="w-full h-9 pl-6 pr-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </div>
                  </label>
                )}

                {form.benefitType === "perk" && (
                  <label className="sm:col-span-2 space-y-1 text-xs font-semibold text-slate-700">
                    <span>Descripción del beneficio</span>
                    <input
                      type="text"
                      value={form.freeDescription}
                      onChange={(e) => setForm((f) => ({ ...f, freeDescription: e.target.value }))}
                      placeholder="Ej: Cobertura de ambulancia, turno médico gratis"
                      className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                    />
                  </label>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowConditions((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
                >
                  {showConditions ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                  Condiciones de aplicación
                  <span className="text-slate-400 font-normal">(opcional)</span>
                </button>

                {showConditions && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="space-y-1 text-xs font-semibold text-slate-700">
                      <span>Mínimo de métodos activos</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={form.minMethodCount}
                        onChange={(e) => setForm((f) => ({ ...f, minMethodCount: e.target.value }))}
                        placeholder="2"
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </label>

                    <label className="space-y-1 text-xs font-semibold text-slate-700">
                      <span>Gateway requerido</span>
                      <select
                        value={form.requiresGateway}
                        onChange={(e) => setForm((f) => ({ ...f, requiresGateway: e.target.value }))}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      >
                        <option value="">Cualquiera</option>
                        <option value="SIRO">SIRO (CBU)</option>
                        <option value="PAYWAY">Payway (Tarjeta)</option>
                        <option value="MOBBEX">Mobbex</option>
                      </select>
                    </label>

                    <label className="space-y-1 text-xs font-semibold text-slate-700">
                      <span>Tipo de método</span>
                      <select
                        value={form.requiresMethodType}
                        onChange={(e) => setForm((f) => ({ ...f, requiresMethodType: e.target.value }))}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      >
                        <option value="">Cualquiera</option>
                        <option value="CARD">Tarjeta</option>
                        <option value="CBU">CBU / Débito Directo</option>
                      </select>
                    </label>

                    <label className="space-y-1 text-xs font-semibold text-slate-700">
                      <span>Marca de tarjeta</span>
                      <input
                        type="text"
                        value={form.requiresCardBrand}
                        onChange={(e) => setForm((f) => ({ ...f, requiresCardBrand: e.target.value }))}
                        placeholder="Ej: VISA_BLACK, MC_PLATINUM"
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </label>

                    <label className="space-y-1 text-xs font-semibold text-slate-700">
                      <span>Banco específico</span>
                      <input
                        type="text"
                        value={form.requiresBank}
                        onChange={(e) => setForm((f) => ({ ...f, requiresBank: e.target.value }))}
                        placeholder="Ej: SANTANDER, GALICIA"
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </label>

                    <label className="space-y-1 text-xs font-semibold text-slate-700">
                      <span>Antigüedad mínima (meses)</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.minMonthsActive}
                        onChange={(e) => setForm((f) => ({ ...f, minMonthsActive: e.target.value }))}
                        placeholder="0"
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </label>

                    <label className="space-y-1 text-xs font-semibold text-slate-700">
                      <span>Antigüedad máxima (meses)</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.maxMonthsActive}
                        onChange={(e) => setForm((f) => ({ ...f, maxMonthsActive: e.target.value }))}
                        placeholder="Sin límite"
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400"
                      />
                    </label>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-violet-600" />
                    Planes a los que aplica
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Seleccioná los planes que otorgan este beneficio.
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {plans.length === 0 && (
                    <span className="text-xs text-slate-400">No hay planes cargados.</span>
                  )}
                  {plans.map((plan) => {
                    const isSelected = form.planIds.includes(plan.id);
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => togglePlan(plan.id)}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-violet-200 bg-violet-50 text-violet-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {plan.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={closeModal}
                className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={saveLoading || !form.name.trim()}
                className="h-10 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-sm font-semibold transition-colors"
              >
                {saveLoading
                  ? "Guardando..."
                  : editingBenefit
                    ? "Guardar cambios"
                    : "Crear beneficio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenefitsContainer;
