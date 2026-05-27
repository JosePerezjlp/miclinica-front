import { useEffect, useState } from "react";
import {
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { getRolesThunk } from "../Roles/Roles.action";
import {
  createUserThunk,
  deleteUserThunk,
  getUsersThunk,
  updateUserThunk,
} from "./Users.action";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserResponse,
} from "./Users.types";

type UserFormState = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roleIds: number[];
};

const emptyForm: UserFormState = {
  username: "",
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  isActive: true,
  roleIds: [],
};

function buildForm(user?: UserResponse): UserFormState {
  if (!user) {
    return emptyForm;
  }

  return {
    username: user.username,
    email: user.email ?? "",
    password: "",
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    roleIds: user.userRoles.map((relation) => relation.role.id),
  };
}

const UsersContainer = () => {
  const dispatch = useAppDispatch();
  const { data, loading, saveLoading } = useAppSelector((state) => state.users);
  const roleOptions = useAppSelector((state) => state.roles.data);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);

  useEffect(() => {
    dispatch(getUsersThunk());
    dispatch(getRolesThunk());
  }, [dispatch]);

  const filteredUsers = data.filter((user) => {
    const normalizedQuery = query.trim().toLowerCase();
    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      user.username.toLowerCase().includes(normalizedQuery) ||
      fullName.includes(normalizedQuery) ||
      user.uid.toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? user.isActive : !user.isActive);

    return matchesQuery && matchesStatus;
  });

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserResponse) => {
    setEditingUser(user);
    setForm(buildForm(user));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saveLoading) {
      return;
    }

    setIsModalOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  };

  const toggleRole = (roleId: number) => {
    setForm((current) => ({
      ...current,
      roleIds: current.roleIds.includes(roleId)
        ? current.roleIds.filter((item) => item !== roleId)
        : [...current.roleIds, roleId],
    }));
  };

  const handleSubmit = async () => {
    if (
      !form.username.trim() ||
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      return;
    }

    if (!editingUser && form.password.trim().length < 8) {
      return;
    }

    if (editingUser) {
      const payload: UpdateUserRequest = {
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        isActive: form.isActive,
        roleIds: form.roleIds,
      };

      if (form.password.trim()) {
        payload.password = form.password.trim();
      }

      await dispatch(updateUserThunk(editingUser.uid, payload));
    } else {
      const payload: CreateUserRequest = {
        username: form.username.trim(),
        email: form.email.trim() || undefined,
        password: form.password.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        isActive: form.isActive,
        roleIds: form.roleIds,
      };

      await dispatch(createUserThunk(payload));
    }

    closeModal();
  };

  const handleToggleActive = async (user: UserResponse) => {
    if (user.isActive) {
      await dispatch(deleteUserThunk(user.uid));
      return;
    }

    await dispatch(
      updateUserThunk(user.uid, {
        isActive: true,
        roleIds: user.userRoles.map((relation) => relation.role.id),
      }),
    );
  };

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-none font-extrabold tracking-tight">
            Usuarios
          </h1>
          <p className="text-xl text-slate-600 mt-2">
            Administración operativa de accesos, credenciales y roles asignados
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Crear Usuario
        </button>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, nombre o UID"
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
                <th className="px-6 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Nombre</th>
                <th className="px-4 py-3 font-semibold">Roles</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Ultimo acceso</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => (
                <tr
                  key={user.uid}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">
                      {user.username}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {user.email || "Sin email"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-700">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      UID {user.uid.slice(0, 12)}...
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.userRoles.length > 0 ? (
                        user.userRoles.map((relation) => (
                          <span
                            key={relation.id}
                            className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700"
                          >
                            {relation.role.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">
                          Sin roles
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        user.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleString()
                      : "Nunca"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(user)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(user)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          user.isActive
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {user.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredUsers.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No hay usuarios para los filtros seleccionados.
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
                  {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Definí identidad, contraseña y roles operativos.
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
                  <span className="font-semibold">Usuario</span>
                  <input
                    value={form.username}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    className="w-full h-11 rounded-xl border border-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-semibold">Email</span>
                  <input
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="w-full h-11 rounded-xl border border-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-semibold">Nombre</span>
                  <input
                    value={form.firstName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        firstName: event.target.value,
                      }))
                    }
                    className="w-full h-11 rounded-xl border border-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span className="font-semibold">Apellido</span>
                  <input
                    value={form.lastName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        lastName: event.target.value,
                      }))
                    }
                    className="w-full h-11 rounded-xl border border-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                  <span className="font-semibold">
                    {editingUser ? "Nueva contraseña (opcional)" : "Contraseña"}
                  </span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className="w-full h-11 rounded-xl border border-slate-200 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Roles asignados
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Seleccioná uno o varios roles para este usuario.
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
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
                    Usuario activo
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  {roleOptions.map((role) => {
                    const isSelected = form.roleIds.includes(role.id);

                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {role.name}
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
                <UserCog className="w-4 h-4" />
                {saveLoading
                  ? "Guardando..."
                  : editingUser
                    ? "Guardar cambios"
                    : "Crear usuario"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersContainer;
