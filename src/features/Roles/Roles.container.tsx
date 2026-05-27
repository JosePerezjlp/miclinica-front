import { useEffect, useState } from "react";
import { Blocks, Pencil, Plus, Power, Search, ShieldCheck } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { getModulesThunk } from "../Modules/Modules.action";
import {
  createRoleThunk,
  deleteRoleThunk,
  getRolesThunk,
  updateRoleThunk,
} from "./Roles.action";
import type { CreateRoleRequest, RoleResponse } from "./Roles.types";

type RoleFormState = {
  name: string;
  description: string;
  isActive: boolean;
  moduleIds: number[];
};

const emptyForm: RoleFormState = {
  name: "",
  description: "",
  isActive: true,
  moduleIds: [],
};

function buildForm(role?: RoleResponse): RoleFormState {
  if (!role) {
    return emptyForm;
  }

  return {
    name: role.name,
    description: role.description ?? "",
    isActive: role.isActive,
    moduleIds: role.roleModules.map((relation) => relation.module.id),
  };
}

const RolesContainer = () => {
  const dispatch = useAppDispatch();
  const { data, loading, saveLoading } = useAppSelector((state) => state.roles);
  const moduleOptions = useAppSelector((state) => state.accessModules.modules);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
  const [form, setForm] = useState<RoleFormState>(emptyForm);

  useEffect(() => {
    dispatch(getRolesThunk());
    dispatch(getModulesThunk());
  }, [dispatch]);

  const filteredRoles = data.filter((role) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      role.name.toLowerCase().includes(normalizedQuery) ||
      String(role.id).includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? role.isActive : !role.isActive);

    return matchesQuery && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingRole(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (role: RoleResponse) => {
    setEditingRole(role);
    setForm(buildForm(role));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saveLoading) {
      return;
    }

    setIsModalOpen(false);
    setEditingRole(null);
    setForm(emptyForm);
  };

  const toggleModule = (moduleId: number) => {
    setForm((current) => ({
      ...current,
      moduleIds: current.moduleIds.includes(moduleId)
        ? current.moduleIds.filter((item) => item !== moduleId)
        : [...current.moduleIds, moduleId],
    }));
  };

  const handleSubmit = async () => {
    const payload: CreateRoleRequest = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      isActive: form.isActive,
      moduleIds: form.moduleIds,
    };

    if (!payload.name) {
      return;
    }

    if (editingRole) {
      await dispatch(updateRoleThunk(editingRole.id, payload));
    } else {
      await dispatch(createRoleThunk(payload));
    }

    closeModal();
  };

  const handleToggleActive = async (role: RoleResponse) => {
    if (role.isActive) {
      await dispatch(deleteRoleThunk(role.id));
      return;
    }

    await dispatch(
      updateRoleThunk(role.id, {
        isActive: true,
        moduleIds: role.roleModules.map((relation) => relation.module.id),
      }),
    );
  };

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-none font-extrabold tracking-tight">
            Roles
          </h1>
          <p className="text-xl text-slate-600 mt-2">
            Organización de perfiles, alcance funcional y módulos habilitados
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Crear Rol
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
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Módulos</th>
                <th className="px-4 py-3 font-semibold">Usuarios</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRoles.map((role) => (
                <tr
                  key={role.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-400 font-medium">
                    {role.id}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">
                      {role.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {role.description || "Sin descripción"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {role.roleModules.length > 0 ? (
                        role.roleModules.map((relation) => (
                          <span
                            key={relation.id}
                            className="inline-flex items-center rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700"
                          >
                            {relation.module.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">
                          Sin módulos
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {role.userRoles.length}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        role.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {role.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(role)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(role)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          role.isActive
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {role.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredRoles.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No hay roles para los filtros seleccionados.
            </div>
          )}
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingRole ? "Editar Rol" : "Nuevo Rol"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Configurá el perfil y sus módulos disponibles.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cerrar
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-semibold">Nombre del rol</span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="w-full h-11 rounded-xl border border-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700 inline-flex items-center gap-2 mt-8 md:mt-0">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  Rol activo
                </label>
                <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                  <span className="font-semibold">Descripción</span>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    className="w-full min-h-24 rounded-xl border border-slate-200 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    Módulos habilitados
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Cada módulo arrastra sus permisos asociados.
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {moduleOptions.map((module) => {
                    const isSelected = form.moduleIds.includes(module.id);

                    return (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => toggleModule(module.id)}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {module.name}
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
                className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={saveLoading}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-60"
              >
                <Blocks className="w-4 h-4" />
                {saveLoading
                  ? "Guardando..."
                  : editingRole
                    ? "Guardar cambios"
                    : "Crear rol"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesContainer;
