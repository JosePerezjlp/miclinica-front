import { useEffect, useState } from "react";
import {
  Megaphone,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  createPromoterThunk,
  deletePromoterThunk,
  getPromotersThunk,
  updatePromoterThunk,
} from "./Promoters.action";
import type {
  CreatePromoterRequest,
  PromoterResponse,
} from "./Promoters.types";

type PromoterFormState = {
  name: string;
  percentage: string;
  isActive: boolean;
  isInternal: boolean;
};

const emptyForm: PromoterFormState = {
  name: "",
  percentage: "",
  isActive: true,
  isInternal: false,
};

function buildForm(promoter?: PromoterResponse): PromoterFormState {
  if (!promoter) {
    return emptyForm;
  }

  return {
    name: promoter.name,
    percentage: String(promoter.percentage),
    isActive: promoter.isActive,
    isInternal: promoter.isInternal,
  };
}

const PromotersContainer = () => {
  const dispatch = useAppDispatch();
  const { data, loading, saveLoading } = useAppSelector(
    (state) => state.promoters,
  );

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [scopeFilter, setScopeFilter] = useState<
    "all" | "internal" | "external"
  >("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromoter, setEditingPromoter] =
    useState<PromoterResponse | null>(null);
  const [form, setForm] = useState<PromoterFormState>(emptyForm);

  useEffect(() => {
    dispatch(getPromotersThunk());
  }, [dispatch]);

  const filteredPromoters = data.filter((promoter) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      promoter.name.toLowerCase().includes(normalizedQuery) ||
      String(promoter.id).includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? promoter.isActive : !promoter.isActive);
    const matchesScope =
      scopeFilter === "all" ||
      (scopeFilter === "internal" ? promoter.isInternal : !promoter.isInternal);

    return matchesQuery && matchesStatus && matchesScope;
  });

  const openCreateModal = () => {
    setEditingPromoter(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (promoter: PromoterResponse) => {
    setEditingPromoter(promoter);
    setForm(buildForm(promoter));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saveLoading) {
      return;
    }

    setIsModalOpen(false);
    setEditingPromoter(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    const payload: CreatePromoterRequest = {
      name: form.name.trim(),
      percentage: Number(form.percentage),
      isActive: form.isActive,
      isInternal: form.isInternal,
    };

    if (!payload.name || Number.isNaN(payload.percentage)) {
      return;
    }

    if (editingPromoter) {
      await dispatch(updatePromoterThunk(editingPromoter.id, payload));
    } else {
      await dispatch(createPromoterThunk(payload));
    }

    closeModal();
  };

  const handleToggleActive = async (promoter: PromoterResponse) => {
    if (promoter.isActive) {
      await dispatch(deletePromoterThunk(promoter.id));
      return;
    }

    await dispatch(updatePromoterThunk(promoter.id, { isActive: true }));
  };

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-none font-extrabold tracking-tight">
            Promotores
          </h1>
          <p className="text-xl text-slate-600 mt-2">
            Administración comercial de promotores y porcentaje asignado
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Crear Promotor
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

          <select
            value={scopeFilter}
            onChange={(event) =>
              setScopeFilter(
                event.target.value as "all" | "internal" | "external",
              )
            }
            className="h-10 px-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Internos y externos</option>
            <option value="internal">Internos</option>
            <option value="external">Externos</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Promotor</th>
                <th className="px-4 py-3 font-semibold">Porcentaje</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Actualizado</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPromoters.map((promoter) => (
                <tr
                  key={promoter.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-400 font-medium">
                    {promoter.id}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">
                      {promoter.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1">
                      <Megaphone className="w-3 h-3" />
                      {promoter.isInternal ? "Gestión interna" : "Red externa"}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700 font-semibold">
                    {Number(promoter.percentage).toFixed(2)}%
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {promoter.isInternal ? "Interno" : "Externo"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        promoter.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {promoter.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {new Date(promoter.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(promoter)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(promoter)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          promoter.isActive
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {promoter.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredPromoters.length === 0 && (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">
            No hay promotores que coincidan con el filtro actual.
          </div>
        )}

        {loading && (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">
            Cargando promotores...
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {editingPromoter ? "Editar promotor" : "Crear promotor"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Definí el porcentaje comercial, estado y si pertenece a la
                estructura interna.
              </p>
            </div>

            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="sm:col-span-2 space-y-2 text-sm text-slate-700 font-medium">
                <span>Nombre</span>
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
                <span>Porcentaje</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.percentage}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      percentage: event.target.value,
                    }))
                  }
                  className="w-full h-11 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <div className="space-y-3 text-sm text-slate-700 font-medium">
                <span className="block">Configuración</span>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.isInternal}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isInternal: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Promotor interno</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span>Promotor activo</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="h-10 px-4 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={saveLoading}
                className="h-10 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {saveLoading
                  ? "Guardando..."
                  : editingPromoter
                    ? "Actualizar"
                    : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotersContainer;
