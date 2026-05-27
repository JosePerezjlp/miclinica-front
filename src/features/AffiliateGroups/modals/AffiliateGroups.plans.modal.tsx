import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Check } from 'lucide-react';
import type { AppDispatch, RootState } from '../../../store/store';
import type { GroupDetailData } from '../AffiliateGroups.detail.types';
import { updatePlanThunk } from '../AffiliateGroups.detail.action';

interface PlansModalProps {
  groupData: GroupDetailData;
  onClose: () => void;
}

const PLAN_STATUS_OPTIONS = ['ACTIVE', 'EXPIRED', 'NO_COVERAGE', 'GRACE_PERIOD'];

const PlansModal: React.FC<PlansModalProps> = ({ groupData, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.groupDetail?.loading || false);

  const [formData, setFormData] = useState({
    planStatus: groupData.planStatus || 'ACTIVE',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(updatePlanThunk({
      groupId: groupData.id,
      payload: formData,
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Gestionar Plan</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Plan Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs uppercase text-blue-600 font-semibold mb-2">Plan Actual</p>
            <h3 className="text-2xl font-bold text-blue-900">{groupData.plan?.name || 'Sin Plan'}</h3>
            {groupData.plan && (
              <p className="text-lg text-blue-700 font-semibold mt-2">
                ${groupData.plan.monthlyFee.toFixed(2)}/mes
              </p>
            )}
          </div>

          {/* Plan Status */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Estado del Plan
            </label>
            <div className="space-y-2">
              {PLAN_STATUS_OPTIONS.map((status) => (
                <label key={status} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="planStatus"
                    value={status}
                    checked={formData.planStatus === status}
                    onChange={(e) => setFormData({ ...formData, planStatus: e.target.value })}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">{status}</p>
                    <p className="text-xs text-slate-500">
                      {status === 'ACTIVE' && 'El plan está activo y funcionando normalmente'}
                      {status === 'EXPIRED' && 'El plan ha expirado'}
                      {status === 'NO_COVERAGE' && 'No hay cobertura disponible'}
                      {status === 'GRACE_PERIOD' && 'El plan está en período de gracia'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Grace Period Info */}
          {groupData.gracePeriodEndsAt && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs uppercase text-amber-600 font-semibold">Período de Gracia</p>
              <p className="text-sm text-amber-900 font-semibold mt-1">
                Termina: {new Date(groupData.gracePeriodEndsAt).toLocaleDateString('es-AR')}
              </p>
            </div>
          )}

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
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlansModal;
