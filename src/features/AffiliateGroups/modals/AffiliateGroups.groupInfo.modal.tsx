import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { X, Check } from "lucide-react";
import type { AppDispatch, RootState } from "../../../store/store";
import type { GroupDetailData } from "../AffiliateGroups.detail.types";
import { updateGroupInfoThunk } from "../AffiliateGroups.detail.action";

interface GroupInfoModalProps {
  groupData: GroupDetailData;
  onClose: () => void;
}

const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  groupData,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(
    (state: RootState) => state.groupDetail?.loading || false,
  );

  const [formData, setFormData] = useState({
    isActive: groupData.isActive,
    chargeDay: groupData.chargeDay,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(
      updateGroupInfoThunk({
        groupId: groupData.id,
        payload: formData,
      }),
    );
    onClose();
  };

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
                setFormData({
                  ...formData,
                  chargeDay: Math.min(
                    31,
                    Math.max(1, Number(e.target.value) || 1),
                  ),
                })
              }
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            />
            <p className="mt-2 text-xs text-slate-500">
              Define el día del mes en que vence la próxima cuota.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
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
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
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
