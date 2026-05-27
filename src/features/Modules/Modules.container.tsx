import { useEffect, useState } from "react";
import {
  KeyRound,
  Layers3,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  createModuleThunk,
  createPermissionThunk,
  deleteModuleThunk,
  deletePermissionThunk,
  getModulesThunk,
  updateModuleThunk,
  updatePermissionThunk,
} from "./Modules.action";
import type {
  AccessModuleResponse,
  CreateModuleRequest,
  CreatePermissionRequest,
  PermissionResponse,
} from "./Modules.types";

type ModuleFormState = {
  name: string;
  description: string;
  isActive: boolean;
  permissionIds: number[];
};

type PermissionFormState = {
  name: string;
  description: string;
  isActive: boolean;
};

const emptyModuleForm: ModuleFormState = {
  name: "",
  description: "",
  isActive: true,
  permissionIds: [],
};

const emptyPermissionForm: PermissionFormState = {
  name: "",
  description: "",
  isActive: true,
};

function buildModuleForm(module?: AccessModuleResponse): ModuleFormState {
  if (!module) {
    return emptyModuleForm;
  }

  return {
    name: module.name,
    description: module.description ?? "",
    isActive: module.isActive,
    permissionIds: module.modulePermissions.map(
      (relation) => relation.permission.id,
    ),
  };
}

function buildPermissionForm(
  permission?: PermissionResponse,
): PermissionFormState {
  if (!permission) {
    return emptyPermissionForm;
  }

  return {
    name: permission.name,
    description: permission.description ?? "",
    isActive: permission.isActive,
  };
}

const ModulesContainer = () => {
  const dispatch = useAppDispatch();
  const { modules, permissions, loading, saveLoading } = useAppSelector(
    (state) => state.accessModules,
  );

  const [moduleQuery, setModuleQuery] = useState("");
  const [permissionQuery, setPermissionQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [permissionStatusFilter, setPermissionStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [editingModule, setEditingModule] =
    useState<AccessModuleResponse | null>(null);
  const [editingPermission, setEditingPermission] =
    useState<PermissionResponse | null>(null);
  const [moduleForm, setModuleForm] =
    useState<ModuleFormState>(emptyModuleForm);
  const [permissionForm, setPermissionForm] =
    useState<PermissionFormState>(emptyPermissionForm);

  useEffect(() => {
    dispatch(getModulesThunk());
  }, [dispatch]);

  const filteredModules = modules.filter((module) => {
    const normalizedQuery = moduleQuery.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      module.name.toLowerCase().includes(normalizedQuery) ||
      String(module.id).includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? module.isActive : !module.isActive);

    return matchesQuery && matchesStatus;
  });

  const filteredPermissions = permissions.filter((permission) => {
    const normalizedQuery = permissionQuery.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      permission.name.toLowerCase().includes(normalizedQuery) ||
      String(permission.id).includes(normalizedQuery);
    const matchesStatus =
      permissionStatusFilter === "all" ||
      (permissionStatusFilter === "active"
        ? permission.isActive
        : !permission.isActive);

    return matchesQuery && matchesStatus;
  });

  const togglePermissionSelection = (permissionId: number) => {
    setModuleForm((current) => ({
      ...current,
      permissionIds: current.permissionIds.includes(permissionId)
        ? current.permissionIds.filter((item) => item !== permissionId)
        : [...current.permissionIds, permissionId],
    }));
  };

  const openCreateModuleModal = () => {
    setEditingModule(null);
    setModuleForm(emptyModuleForm);
    setIsModuleModalOpen(true);
  };

  const openEditModuleModal = (module: AccessModuleResponse) => {
    setEditingModule(module);
    setModuleForm(buildModuleForm(module));
    setIsModuleModalOpen(true);
  };

  const closeModuleModal = () => {
    if (saveLoading) {
      return;
    }

    setIsModuleModalOpen(false);
    setEditingModule(null);
    setModuleForm(emptyModuleForm);
  };

  const openCreatePermissionModal = () => {
    setEditingPermission(null);
    setPermissionForm(emptyPermissionForm);
    setIsPermissionModalOpen(true);
  };

  const openEditPermissionModal = (permission: PermissionResponse) => {
    setEditingPermission(permission);
    setPermissionForm(buildPermissionForm(permission));
    setIsPermissionModalOpen(true);
  };

  const closePermissionModal = () => {
    if (saveLoading) {
      return;
    }

    setIsPermissionModalOpen(false);
    setEditingPermission(null);
    setPermissionForm(emptyPermissionForm);
  };

  const handleModuleSubmit = async () => {
    const payload: CreateModuleRequest = {
      name: moduleForm.name.trim(),
      description: moduleForm.description.trim() || undefined,
      isActive: moduleForm.isActive,
      permissionIds: moduleForm.permissionIds,
    };

    if (!payload.name) {
      return;
    }

    if (editingModule) {
      await dispatch(updateModuleThunk(editingModule.id, payload));
    } else {
      await dispatch(createModuleThunk(payload));
    }

    closeModuleModal();
  };

  const handlePermissionSubmit = async () => {
    const payload: CreatePermissionRequest = {
      name: permissionForm.name.trim(),
      description: permissionForm.description.trim() || undefined,
      isActive: permissionForm.isActive,
    };

    if (!payload.name) {
      return;
    }

    if (editingPermission) {
      await dispatch(updatePermissionThunk(editingPermission.id, payload));
    } else {
      await dispatch(createPermissionThunk(payload));
    }

    closePermissionModal();
  };

  const handleToggleModuleActive = async (module: AccessModuleResponse) => {
    if (module.isActive) {
      await dispatch(deleteModuleThunk(module.id));
      return;
    }

    await dispatch(
      updateModuleThunk(module.id, {
        isActive: true,
        permissionIds: module.modulePermissions.map(
          (relation) => relation.permission.id,
        ),
      }),
    );
  };

  const handleTogglePermissionActive = async (
    permission: PermissionResponse,
  ) => {
    if (permission.isActive) {
      await dispatch(deletePermissionThunk(permission.id));
      return;
    }

    await dispatch(updatePermissionThunk(permission.id, { isActive: true }));
  };

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-none font-extrabold tracking-tight">
            Módulos
          </h1>
          <p className="text-xl text-slate-600 mt-2">
            Catálogo de áreas funcionales y permisos reutilizables del sistema
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openCreatePermissionModal}
            className="inline-flex items-center gap-2 h-10 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <KeyRound className="w-4 h-4" />
            Crear Permiso
          </button>
          <button
            type="button"
            onClick={openCreateModuleModal}
            className="inline-flex items-center gap-2 h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Crear Módulo
          </button>
        </div>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar módulo por nombre o ID"
              value={moduleQuery}
              onChange={(event) => setModuleQuery(event.target.value)}
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
                <th className="px-4 py-3 font-semibold">Módulo</th>
                <th className="px-4 py-3 font-semibold">Permisos</th>
                <th className="px-4 py-3 font-semibold">Roles</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredModules.map((module) => (
                <tr
                  key={module.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-400 font-medium">
                    {module.id}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">
                      {module.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {module.description || "Sin descripción"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {module.modulePermissions.length > 0 ? (
                        module.modulePermissions.map((relation) => (
                          <span
                            key={relation.id}
                            className="inline-flex items-center rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700"
                          >
                            {relation.permission.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">
                          Sin permisos
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {module.roleModules.length}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        module.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {module.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModuleModal(module)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleModuleActive(module)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          module.isActive
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {module.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredModules.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No hay módulos para los filtros seleccionados.
            </div>
          )}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar permiso por nombre o ID"
              value={permissionQuery}
              onChange={(event) => setPermissionQuery(event.target.value)}
              className="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={permissionStatusFilter}
            onChange={(event) =>
              setPermissionStatusFilter(
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
                <th className="px-4 py-3 font-semibold">Permiso</th>
                <th className="px-4 py-3 font-semibold">Módulos</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredPermissions.map((permission) => (
                <tr
                  key={permission.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-400 font-medium">
                    {permission.id}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">
                      {permission.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {permission.description || "Sin descripción"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {permission.modulePermissions &&
                      permission.modulePermissions.length > 0 ? (
                        permission.modulePermissions.map((relation) => (
                          <span
                            key={relation.id}
                            className="inline-flex items-center rounded-lg bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700"
                          >
                            {relation.module.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">
                          Sin asignaciones
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        permission.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {permission.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditPermissionModal(permission)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void handleTogglePermissionActive(permission)
                        }
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          permission.isActive
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {permission.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredPermissions.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No hay permisos para los filtros seleccionados.
            </div>
          )}
        </div>
      </section>

      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingModule ? "Editar Módulo" : "Nuevo Módulo"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Asociá permisos reutilizables a un módulo funcional.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModuleModal}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cerrar
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-semibold">Nombre</span>
                  <input
                    value={moduleForm.name}
                    onChange={(event) =>
                      setModuleForm((current) => ({
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
                    checked={moduleForm.isActive}
                    onChange={(event) =>
                      setModuleForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  Módulo activo
                </label>
                <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                  <span className="font-semibold">Descripción</span>
                  <textarea
                    value={moduleForm.description}
                    onChange={(event) =>
                      setModuleForm((current) => ({
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
                    Permisos del módulo
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Podés combinar permisos activos o inactivos según el
                    catálogo.
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {permissions.map((permission) => {
                    const isSelected = moduleForm.permissionIds.includes(
                      permission.id,
                    );

                    return (
                      <button
                        key={permission.id}
                        type="button"
                        onClick={() => togglePermissionSelection(permission.id)}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-violet-200 bg-violet-50 text-violet-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {permission.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={closeModuleModal}
                className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleModuleSubmit()}
                disabled={saveLoading}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-60"
              >
                <Layers3 className="w-4 h-4" />
                {saveLoading
                  ? "Guardando..."
                  : editingModule
                    ? "Guardar cambios"
                    : "Crear módulo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPermissionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {editingPermission ? "Editar Permiso" : "Nuevo Permiso"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Gestioná el catálogo granular de acciones disponibles.
                </p>
              </div>
              <button
                type="button"
                onClick={closePermissionModal}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cerrar
              </button>
            </div>

            <div className="p-6 space-y-4">
              <label className="space-y-2 text-sm text-slate-700 block">
                <span className="font-semibold">Nombre</span>
                <input
                  value={permissionForm.name}
                  onChange={(event) =>
                    setPermissionForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className="w-full h-11 rounded-xl border border-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="space-y-2 text-sm text-slate-700 block">
                <span className="font-semibold">Descripción</span>
                <textarea
                  value={permissionForm.description}
                  onChange={(event) =>
                    setPermissionForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="w-full min-h-24 rounded-xl border border-slate-200 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={permissionForm.isActive}
                  onChange={(event) =>
                    setPermissionForm((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                />
                Permiso activo
              </label>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={closePermissionModal}
                className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handlePermissionSubmit()}
                disabled={saveLoading}
                className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-slate-900 text-white text-sm font-semibold disabled:opacity-60"
              >
                <KeyRound className="w-4 h-4" />
                {saveLoading
                  ? "Guardando..."
                  : editingPermission
                    ? "Guardar cambios"
                    : "Crear permiso"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModulesContainer;
