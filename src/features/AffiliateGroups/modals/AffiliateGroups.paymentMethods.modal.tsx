import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Check, Plus, Trash2, Edit2 } from 'lucide-react';
import type { AppDispatch, RootState } from '../../../store/store';
import type { GroupDetailData } from '../AffiliateGroups.detail.types';
import {
  addPaymentMethodThunk,
  removePaymentMethodThunk,
  updatePaymentMethodThunk,
} from '../AffiliateGroups.detail.action';

interface PaymentMethodsModalProps {
  groupData: GroupDetailData;
  onClose: () => void;
}

const GATEWAY_OPTIONS = ['SIRO', 'PAYWAY', 'MOBBEX'];
const TYPE_OPTIONS = ['CARD', 'CBU'];

const PaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({ groupData, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.groupDetail?.loading || false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    gateway: 'SIRO',
    type: 'CARD',
    priority: 1,
    last4: '',
    brand: '',
    holderName: '',
    expiresAt: '',
  });

  const [editData, setEditData] = useState<any>(null);

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(addPaymentMethodThunk({
      groupId: groupData.id,
      payload: formData,
    }));
    setFormData({
      gateway: 'SIRO',
      type: 'CARD',
      priority: 1,
      last4: '',
      brand: '',
      holderName: '',
      expiresAt: '',
    });
    setShowAddForm(false);
  };

  const handleUpdateMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updatePayload = {
        priority: editData.priority,
        isActive: editData.isActive,
      };
      await dispatch(updatePaymentMethodThunk({
        groupId: groupData.id,
        methodId: editingId,
        payload: updatePayload,
      }));
      setEditingId(null);
      setEditData(null);
    }
  };

  const handleRemoveMethod = async (methodId: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta forma de pago?')) {
      await dispatch(removePaymentMethodThunk({
        groupId: groupData.id,
        methodId,
      }));
    }
  };

  const startEdit = (method: any) => {
    setEditingId(method.id);
    setEditData({ ...method });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Gestionar Formas de Pago</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Payment Method Section */}
          {!showAddForm && !editingId && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 text-slate-600 font-semibold rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Agregar Nueva Forma de Pago
            </button>
          )}

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddMethod} className="p-4 bg-slate-50 rounded-lg space-y-4">
              <h3 className="font-semibold text-slate-900">Nueva Forma de Pago</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">Gateway</label>
                  <select
                    value={formData.gateway}
                    onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {GATEWAY_OPTIONS.map((gw) => (
                      <option key={gw} value={gw}>
                        {gw}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">Tipo</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Prioridad</label>
                <input
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {formData.type === 'CARD' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Marca (ej: Visa)"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Últimos 4 dígitos"
                     
                      value={formData.last4}
                      onChange={(e) => setFormData({ ...formData, last4: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nombre del Titular"
                      value={formData.holderName}
                      onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Guardando...' : 'Agregar'}
                </button>
              </div>
            </form>
          )}

          {/* Edit Form */}
          {editingId && editData && (
            <form onSubmit={handleUpdateMethod} className="p-4 bg-slate-50 rounded-lg space-y-4">
              <h3 className="font-semibold text-slate-900">Editar Forma de Pago</h3>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">Prioridad</label>
                <input
                  type="number"
                  min="1"
                  value={editData.priority}
                  onChange={(e) => setEditData({ ...editData, priority: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.isActive}
                  onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-semibold text-slate-900">Activo</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Guardando...' : 'Actualizar'}
                </button>
              </div>
            </form>
          )}

          {/* Payment Methods List */}
          <div className="space-y-3">
            {groupData.paymentMethods?.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">
                    {method.type} - {method.gateway}
                  </p>
                  <p className="text-sm text-slate-500">
                    {method.brand && `${method.brand} `}
                    {method.last4 && `•••• ${method.last4}`}
                    {method.holderName && ` - ${method.holderName}`}
                  </p>
                  {method.expiresAt && (
                    <p className="text-xs text-slate-400 mt-1">
                      Vence: {new Date(method.expiresAt).toLocaleDateString('es-AR')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Prioridad: {method.priority}</p>
                    <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${
                      method.isActive
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {method.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(method)}
                      className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveMethod(method.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsModal;
