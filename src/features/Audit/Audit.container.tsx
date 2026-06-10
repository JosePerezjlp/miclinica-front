import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Download, Filter, MapPin } from "lucide-react";
import type { AppDispatch, RootState } from "../../store/store";
import {
  getAuditTransactionsThunk,
  getAuditSummaryThunk,
  onSetAuditFilters,
  onSetAuditView,
} from "./Audit.action";
import type { AuditFiltersData } from "./Audit.types";
import {
  MONTHS_OPTIONS,
  YEAR_OPTIONS,
  VIEW_OPTIONS,
  CURRENT_MONTH,
  CURRENT_YEAR,
  DEBT_FILTER_OPTIONS,
  CHARGE_DAY_RANGES,
} from "./Audit.constants";
import AuditTransactionsView from "./views/Audit.transactions";
import AuditSummaryView from "./views/Audit.summary";
import { promotersService } from "../../api/promoters.service";
import { familiarGroupGet } from "../../api/groups.service";
import { citiesService } from "../../api/cities.service";
import type { CityResponse } from "../Cities/Cities.types";

interface SelectOption {
  label: string;
  value: number;
}

const AuditContainer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { transactions, summary, filters, view, loading } = useSelector(
    (state: RootState) => state.audit,
  );

  const [familiarGroups, setFamiliarGroups] = useState<SelectOption[]>([]);
  const [promoters, setPromoters] = useState<SelectOption[]>([]);
  const [cities, setCities] = useState<CityResponse[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [promotersLoading, setPromotersLoading] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setGroupsLoading(true);
        const response = await familiarGroupGet.getGroups();
        const options = response.items.map(
          (g: { id: number; name: string }) => ({
            label: g.name,
            value: g.id,
          }),
        );
        setFamiliarGroups(options);
      } catch (error) {
        console.error("Error loading familiar groups:", error);
      } finally {
        setGroupsLoading(false);
      }
    };
    loadGroups();
  }, []);

  useEffect(() => {
    const loadPromoters = async () => {
      try {
        setPromotersLoading(true);
        const response = await promotersService.list();
        const options = response.map((p: { id: number; name: string }) => ({
          label: p.name,
          value: p.id,
        }));
        setPromoters(options);
      } catch (error) {
        console.error("Error loading promoters:", error);
      } finally {
        setPromotersLoading(false);
      }
    };
    loadPromoters();
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const response = await citiesService.list();
        setCities(response.filter((c) => c.isActive));
      } catch (error) {
        console.error("Error loading cities:", error);
      }
    };
    loadCities();
  }, []);

  useEffect(() => {
    const newFilters: AuditFiltersData = {
      familiarGroupId: filters.familiarGroupId,
      promoterId: filters.promoterId,
      month: filters.month || CURRENT_MONTH,
      year: filters.year || CURRENT_YEAR,
      cityId: filters.cityId,
      debtFilter: filters.debtFilter,
      chargeDayRange: filters.chargeDayRange,
    };

    if (view === "transactions") {
      dispatch(getAuditTransactionsThunk(newFilters));
    } else {
      dispatch(getAuditSummaryThunk(newFilters));
    }
  }, [filters, view, dispatch]);

  const handleFilterChange = (
    key: keyof AuditFiltersData,
    value: number | string | undefined,
  ) => {
    const newFilters = {
      ...filters,
      [key]: value,
    };
    dispatch(onSetAuditFilters(newFilters));
  };

  const handleViewChange = (newView: "transactions" | "summary") => {
    dispatch(onSetAuditView(newView));
  };

  const handleExport = () => {
    console.log("Export functionality to be implemented");
  };

  const handleClearFilters = () => {
    dispatch(
      onSetAuditFilters({
        month: CURRENT_MONTH,
        year: CURRENT_YEAR,
      }),
    );
  };

  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl leading-none font-extrabold tracking-tight">
            Auditoría
          </h1>
          <p className="text-xl text-slate-600 mt-2">
            Transacciones y movimientos de cuentas
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            type="button"
            className="h-10 px-5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </header>

      {/* View Tabs */}
      <div className="flex gap-3 border-b border-slate-200">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleViewChange(option.value)}
            type="button"
            className={`pb-3 px-2 font-semibold text-sm transition-colors border-b-2 ${
              view === option.value
                ? "text-teal-600 border-teal-600"
                : "text-slate-600 border-transparent hover:text-slate-900"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex flex-col gap-4">
          {/* Row 1: Main filters */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <Filter className="w-5 h-5 text-slate-400 sm:mb-0 -mb-1" />

            {/* Familiar Group */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Grupo Familiar
              </label>
              <select
                value={filters.familiarGroupId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "familiarGroupId",
                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                  )
                }
                disabled={groupsLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm disabled:opacity-50"
              >
                <option value="">Todos los grupos</option>
                {familiarGroups.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Promoter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Promotor
              </label>
              <select
                value={filters.promoterId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "promoterId",
                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                  )
                }
                disabled={promotersLoading}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm disabled:opacity-50"
              >
                <option value="">Todos los promotores</option>
                {promoters.map((promoter) => (
                  <option key={promoter.value} value={promoter.value}>
                    {promoter.label}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  Ciudad
                </span>
              </label>
              <select
                value={filters.cityId || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "cityId",
                    e.target.value ? parseInt(e.target.value, 10) : undefined,
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
              >
                <option value="">Todas las ciudades</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name} ({city.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Month */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Mes
              </label>
              <select
                value={filters.month || CURRENT_MONTH}
                onChange={(e) =>
                  handleFilterChange("month", parseInt(e.target.value, 10))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
              >
                {MONTHS_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Año
              </label>
              <select
                value={filters.year || CURRENT_YEAR}
                onChange={(e) =>
                  handleFilterChange("year", parseInt(e.target.value, 10))
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
              >
                {YEAR_OPTIONS.map((year) => (
                  <option key={year.value} value={year.value}>
                    {year.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Debt filter + Charge day ranges */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {/* Debt Filter */}
            <div className="min-w-[180px]">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Estado de Deuda
              </label>
              <select
                value={filters.debtFilter || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "debtFilter",
                    e.target.value || undefined,
                  )
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm"
              >
                {DEBT_FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Charge Day Ranges */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Día de Cobro
              </label>
              <div className="flex gap-2">
                {CHARGE_DAY_RANGES.map((range) => (
                  <button
                    key={range.value}
                    type="button"
                    onClick={() =>
                      handleFilterChange(
                        "chargeDayRange",
                        filters.chargeDayRange === range.value
                          ? undefined
                          : range.value,
                      )
                    }
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      filters.chargeDayRange === range.value
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear Button */}
            <button
              onClick={handleClearFilters}
              type="button"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-slate-600">Cargando datos...</div>
        </div>
      ) : view === "transactions" && transactions ? (
        <AuditTransactionsView data={transactions} />
      ) : view === "summary" && summary ? (
        <AuditSummaryView data={summary} />
      ) : null}
    </div>
  );
};

export default AuditContainer;
