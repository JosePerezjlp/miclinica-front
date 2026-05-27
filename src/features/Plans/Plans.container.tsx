import { useEffect, useState } from "react";
import { Pencil, Plus, Power, Search, ShieldCheck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  createPlanThunk,
  deletePlanThunk,
  getPlansThunk,
  updatePlanThunk,
} from "./Plans.action";
import type { CreatePlanRequest, PlanResponse } from "./Plans.types";

type PlanFormState = {
  name: string;
  monthlyFee: string;
  gracePeriodDays: string;
  isActive: boolean;
};

const emptyForm: PlanFormState = {
  name: "",
  monthlyFee: "",
  gracePeriodDays: "0",
  isActive: true,
};

function formatCurrency(value: number | string) {
  const numericValue = typeof value === "number" ? value : Number(value);

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number.isNaN(numericValue) ? 0 : numericValue);
}

function buildForm(plan?: PlanResponse): PlanFormState {
  if (!plan) {
    return emptyForm;
  }

  return {
    name: plan.name,
    monthlyFee: String(plan.monthlyFee),
    gracePeriodDays: String(plan.gracePeriodDays ?? 0),
    isActive: plan.isActive,
  };
}

const PlansContainer = () => {
  const dispatch = useAppDispatch();
  const { data, loading, saveLoading } = useAppSelector((state) => state.plans);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanResponse | null>(null);
  const [form, setForm] = useState<PlanFormState>(emptyForm);

  useEffect(() => {
    dispatch(getPlansThunk());
  }, [dispatch]);

  const filteredPlans = data.filter((plan) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      plan.name.toLowerCase().includes(normalizedQuery) ||
      String(plan.id).includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? plan.isActive : !plan.isActive);

    return matchesQuery && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingPlan(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (plan: PlanResponse) => {
    setEditingPlan(plan);
    setForm(buildForm(plan));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saveLoading) return;
    setIsModalOpen(false);
    setEditingPlan(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    const payload: CreatePlanRequest = {
      name: form.name.trim(),
      monthlyFee: Number(form.monthlyFee),
      gracePeriodDays: Number(form.gracePeriodDays || 0),
    };

    if (!payload.name || Number.isNaN(payload.monthlyFee)) {
      return;
    }

    if (editingPlan) {
      await dispatch(
        updatePlanThunk(editingPlan.id, {
          ...payload,
          isActive: form.isActive,
        }),
      );
    } else {
      await dispatch(createPlanThunk(payload));
    }

    closeModal();
  };

  const handleToggleActive = async (plan: PlanResponse) => {
    if (plan.isActive) {
      await dispatch(deletePlanThunk(plan.id));
      return;
    }

    await dispatch(updatePlanThunk(plan.id, { isActive: true }));
  };

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-none font-extrabold tracking-tight">
            Planes
          </h1>
          <p className="text-xl text-slate-600 mt-2">
            Administración de planes de cobertura
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Crear Plan
        </button>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o ID"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "all" | "active" | "inactive",
              )
            }
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
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Cuota</th>
                <th className="px-4 py-3 font-semibold">Gracia</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Actualizado</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPlans.map((plan) => (
                <tr
                  key={plan.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-400 font-medium">
                    {plan.id}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">
                      {plan.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Creado {new Date(plan.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700 font-semibold">
                    {formatCurrency(plan.monthlyFee)}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {plan.gracePeriodDays} día
                    {plan.gracePeriodDays === 1 ? "" : "s"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        plan.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {plan.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {new Date(plan.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(plan)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(plan)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          plan.isActive
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {plan.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredPlans.length === 0 && (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">
            No hay planes que coincidan con el filtro actual.
          </div>
        )}

        {loading && (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">
            Cargando planes...
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {editingPlan ? "Editar plan" : "Crear plan"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Definí nombre, cuota mensual y periodo de gracia.
              </p>
            </div>

            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="sm:col-span-2 space-y-2 text-sm text-slate-700 font-medium">
                <span>Nombre del plan</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700 font-medium">
                <span>Cuota mensual</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monthlyFee}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      monthlyFee: event.target.value,
                    }))
                  }
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-700 font-medium">
                <span>Días de gracia</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.gracePeriodDays}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      gracePeriodDays: event.target.value,
                    }))
                  }
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              {editingPlan && (
                <label className="sm:col-span-2 inline-flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Plan activo
                </label>
              )}
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
                disabled={
                  saveLoading || !form.name.trim() || !form.monthlyFee.trim()
                }
                className="h-10 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-sm font-semibold transition-colors"
              >
                {saveLoading
                  ? "Guardando..."
                  : editingPlan
                    ? "Guardar cambios"
                    : "Crear plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansContainer;
