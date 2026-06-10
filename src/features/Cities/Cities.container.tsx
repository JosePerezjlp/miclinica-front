import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  MapPin,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  createCityThunk,
  deleteCityThunk,
  getCitiesThunk,
  updateCityThunk,
} from "./Cities.action";
import type { CityResponse, CreateCityRequest } from "./Cities.types";

type CityFormState = {
  name: string;
  description: string;
  isActive: boolean;
};

const emptyForm: CityFormState = {
  name: "",
  description: "",
  isActive: true,
};

function buildForm(city?: CityResponse): CityFormState {
  if (!city) {
    return emptyForm;
  }

  return {
    name: city.name,
    description: city.description ?? "",
    isActive: city.isActive,
  };
}

function generateCode(name: string): string {
  return name.trim().substring(0, 3).toUpperCase();
}

const CitiesContainer = () => {
  const dispatch = useAppDispatch();
  const { data, loading, saveLoading } = useAppSelector(
    (state) => state.cities,
  );

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<CityResponse | null>(null);
  const [form, setForm] = useState<CityFormState>(emptyForm);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(getCitiesThunk());
  }, [dispatch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmedName = form.name.trim().toUpperCase();
  const isNameExisting = data.some(
    (c) =>
      c.name.toUpperCase() === trimmedName &&
      c.id !== editingCity?.id,
  );
  const isNewCity =
    trimmedName.length > 0 && !isNameExisting && !editingCity;
  const generatedCode = generateCode(form.name);

  const filteredCities = data.filter((city) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      city.name.toLowerCase().includes(normalizedQuery) ||
      city.code.toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? city.isActive : !city.isActive);

    return matchesQuery && matchesStatus;
  });

  const nameSuggestions = data.filter((city) => {
    if (!form.name.trim() || editingCity) return false;
    return city.name.toUpperCase().includes(form.name.trim().toUpperCase());
  });

  const handleNameChange = (value: string) => {
    setForm((current) => ({ ...current, name: value }));
    setShowDropdown(value.trim().length > 0 && !editingCity);
    setDropdownIndex(-1);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || nameSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDropdownIndex((prev) =>
        prev < nameSuggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDropdownIndex((prev) =>
        prev > 0 ? prev - 1 : nameSuggestions.length - 1,
      );
    } else if (e.key === "Enter" && dropdownIndex >= 0) {
      e.preventDefault();
      selectCity(nameSuggestions[dropdownIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const selectCity = (city: CityResponse) => {
    setEditingCity(city);
    setForm({
      name: city.name,
      description: city.description ?? "",
      isActive: city.isActive,
    });
    setShowDropdown(false);
    setDropdownIndex(-1);
  };

  const openCreateModal = () => {
    setEditingCity(null);
    setForm(emptyForm);
    setShowDropdown(false);
    setIsModalOpen(true);
  };

  const openEditModal = (city: CityResponse) => {
    setEditingCity(city);
    setForm(buildForm(city));
    setShowDropdown(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saveLoading) return;
    setIsModalOpen(false);
    setEditingCity(null);
    setForm(emptyForm);
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    const payload: CreateCityRequest = {
      name: form.name.trim().toUpperCase(),
      description: form.description.trim() || undefined,
      isActive: form.isActive,
    };

    if (!payload.name) return;

    if (editingCity) {
      await dispatch(updateCityThunk(editingCity.id, payload));
    } else {
      await dispatch(createCityThunk(payload));
    }

    closeModal();
  };

  const handleToggleActive = async (city: CityResponse) => {
    if (city.isActive) {
      await dispatch(deleteCityThunk(city.id));
      return;
    }
    await dispatch(updateCityThunk(city.id, { isActive: true }));
  };

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-none font-extrabold tracking-tight">
            Ciudades
          </h1>
          <p className="text-xl text-slate-600 mt-2">
            Administración de ciudades del sistema
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 h-10 px-5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Crear Ciudad
        </button>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o código"
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
                <th className="px-4 py-3 font-semibold">Ciudad</th>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Descripción</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Actualizado</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCities.map((city) => (
                <tr
                  key={city.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-400 font-medium">
                    {city.id}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">
                      {city.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Ciudad
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 tracking-wider">
                      {city.code}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600 max-w-[200px] truncate">
                    {city.description ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        city.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {city.isActive ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {new Date(city.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(city)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(city)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          city.isActive
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {city.isActive ? "Desactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filteredCities.length === 0 && (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">
            No hay ciudades que coincidan con el filtro actual.
          </div>
        )}

        {loading && (
          <div className="px-6 py-10 text-center text-slate-500 text-sm">
            Cargando ciudades...
          </div>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {editingCity ? "Editar ciudad" : "Crear ciudad"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {editingCity
                  ? "Modificá los datos de la ciudad."
                  : "Ingresá el nombre de la ciudad. El código se genera automáticamente."}
              </p>
            </div>

            <div className="px-6 py-5 grid grid-cols-1 gap-4">
              <label className="space-y-2 text-sm text-slate-700 font-medium relative">
                <span>Nombre</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onFocus={() => {
                    if (form.name.trim() && !editingCity) {
                      setShowDropdown(true);
                    }
                  }}
                  onKeyDown={handleNameKeyDown}
                  placeholder="Escriba el nombre de la ciudad"
                  className="w-full h-11 px-3 pr-10 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
                {form.name.trim() && !editingCity && (
                  <span className="absolute right-3 top-[38px]">
                    {isNameExisting ? (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                  </span>
                )}

                {isNameExisting && !editingCity && (
                  <span className="text-xs text-rose-600 font-medium">
                    Esta ciudad ya existe en el sistema.
                  </span>
                )}
                {isNewCity && !editingCity && (
                  <span className="text-xs text-emerald-600 font-medium">
                    Ciudad nueva — se creará con el código{" "}
                    <strong>{generatedCode}</strong>
                  </span>
                )}

                {showDropdown && nameSuggestions.length > 0 && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                  >
                    {nameSuggestions.map((city, index) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => selectCity(city)}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${
                          index === dropdownIndex
                            ? "bg-blue-50 text-blue-700"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span className="font-medium">{city.name}</span>
                        <span className="text-xs text-slate-400 font-mono">
                          {city.code}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </label>

              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-700 font-medium">
                  Código:
                </label>
                <span className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700 tracking-wider">
                  {form.name.trim().length >= 3
                    ? generatedCode
                    : "___"}
                </span>
              </div>

              <label className="space-y-2 text-sm text-slate-700 font-medium">
                <span>Descripción</span>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Descripción opcional de la ciudad"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      isActive: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Ciudad activa</span>
              </label>
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
                disabled={
                  saveLoading ||
                  !form.name.trim() ||
                  (!editingCity && isNameExisting)
                }
                className="h-10 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                {saveLoading
                  ? "Guardando..."
                  : editingCity
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

export default CitiesContainer;
