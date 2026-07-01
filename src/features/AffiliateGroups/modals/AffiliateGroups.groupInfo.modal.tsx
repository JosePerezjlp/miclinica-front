import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Check } from "lucide-react";
import type { AppDispatch, RootState } from "../../../store/store";
import type { GroupDetailData } from "../AffiliateGroups.detail.types";
import { updateGroupInfoThunk } from "../AffiliateGroups.detail.action";
import { promotersService } from "../../../api/promoters.service";
import { citiesService } from "../../../api/cities.service";
import type { PromoterResponse } from "../../Promoters/Promoters.types";
import type { CityResponse } from "../../Cities/Cities.types";

interface GroupInfoModalProps {
  groupData: GroupDetailData;
  onClose: () => void;
}

interface FormState {
  isActive: boolean;
  chargeDay: number;
  promoterId: number | null;
  cityId: number | null;
}

function toFormState(groupData: GroupDetailData): FormState {
  return {
    isActive: groupData.isActive,
    chargeDay: groupData.chargeDay,
    promoterId: groupData.promoterId,
    cityId: groupData.cityId ?? null,
  };
}

function hasChanges(original: FormState, current: FormState): boolean {
  return (
    original.isActive !== current.isActive ||
    original.chargeDay !== current.chargeDay ||
    original.promoterId !== current.promoterId ||
    original.cityId !== current.cityId
  );
}

const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  groupData,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(
    (state: RootState) => state.groupDetail?.loading || false,
  );

  const original = toFormState(groupData);
  const [formData, setFormData] = useState<FormState>(original);
  const [promoters, setPromoters] = useState<PromoterResponse[]>([]);
  const [cities, setCities] = useState<CityResponse[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingData(true);
    Promise.all([promotersService.list(), citiesService.list()])
      .then(([proms, cits]) => {
        if (cancelled) return;
        setPromoters(proms.filter((p) => p.isActive));
        setCities(cits.filter((c) => c.isActive));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingData(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePromoterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!e.target.value) {
      setFormData((prev) => ({ ...prev, promoterId: null }));
      return;
    }
    const selectedPromoter = promoters.find(
      (p) => p.id === Number(e.target.value),
    );
    setFormData((prev) => ({
      ...prev,
      promoterId: selectedPromoter?.id ?? null,
      cityId: selectedPromoter?.cityId ?? prev.cityId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges(original, formData)) return;
    await dispatch(
      updateGroupInfoThunk({
        groupId: groupData.id,
        payload: {
          isActive: formData.isActive,
          chargeDay: formData.chargeDay,
          ...(formData.promoterId !== null
            ? { promoterId: formData.promoterId }
            : {}),
          ...(formData.cityId !== null ? { cityId: formData.cityId } : {}),
        },
      }),
    );
    onClose();
  };

  const changed = hasChanges(original, formData);
  const selectedCityName =
    cities.find((c) => c.id === formData.cityId)?.name ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Editar Información
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Promotor */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Promotor
            </label>
            <select
              value={formData.promoterId ? String(formData.promoterId) : ""}
              onChange={handlePromoterChange}
              disabled={loadingData}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-slate-100 disabled:text-slate-500"
            >
              {loadingData && <option value="">Cargando...</option>}
              {!loadingData && promoters.length === 0 && (
                <option value="">No hay promotores activos</option>
              )}
              {!loadingData && (
                <option value="">Sin promotor</option>
              )}
              {!loadingData &&
                promoters.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Ciudad */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Ciudad
            </label>
            <select
              value={formData.cityId ? String(formData.cityId) : ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  cityId: e.target.value ? Number(e.target.value) : null,
                }))
              }
              disabled={loadingData}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="">Sin ciudad asignada</option>
              {!loadingData &&
                cities.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.name}
                  </option>
                ))}
            </select>
            {selectedCityName &&
              formData.promoterId &&
              cities.find((c) => c.id === formData.cityId) && (
                <p className="mt-1 text-xs text-slate-500">
                  Ciudad asignada al grupo
                </p>
              )}
          </div>

          {/* Día de cobro */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Día de cobro
            </label>
            <input
              type="number"
              min={1}
              max={31}
              value={formData.chargeDay}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  chargeDay: Math.min(
                    31,
                    Math.max(1, Number(e.target.value) || 1),
                  ),
                }))
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            <p className="mt-2 text-xs text-slate-500">
              Define el día del mes en que vence la próxima cuota.
            </p>
          </div>

          {/* Grupo activo */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  isActive: e.target.checked,
                }))
              }
              className="w-4 h-4 rounded border-slate-300 text-blue-600"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-semibold text-slate-900"
            >
              Grupo activo
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !changed}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Check className="w-4 h-4" />
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupInfoModal;
