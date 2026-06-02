import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Check, Plus, Trash2, Edit2 } from 'lucide-react';
import type { AppDispatch, RootState } from '../../../store/store';
import type { GroupDetailData } from '../AffiliateGroups.detail.types';
import { addAffiliateThunk, removeAffiliateThunk, updateAffiliateThunk } from '../AffiliateGroups.detail.action';

interface MembersModalProps {
  groupData: GroupDetailData;
  onClose: () => void;
}

const MembersModal: React.FC<MembersModalProps> = ({ groupData, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.groupDetail?.loading || false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    documentNumber: '',
    birthDate: '',
    address: '',
    email: '',
    phone: '',
    isHolder: false,
  });

  const [editData, setEditData] = useState<any>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    await dispatch(addAffiliateThunk({
      groupId: groupData.id,
      payload: formData,
    }));
    setFormData({ firstName: '', lastName: '', documentNumber: '', birthDate: '', address: '', email: '', phone: '', isHolder: false });
    setShowAddForm(false);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await dispatch(updateAffiliateThunk({
        groupId: groupData.id,
        affiliateId: editingId,
        payload: editData,
      }));
      setEditingId(null);
      setEditData(null);
    }
  };

  const handleRemoveMember = async (affiliateId: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este miembro?')) {
      await dispatch(removeAffiliateThunk({
        groupId: groupData.id,
        affiliateId,
      }));
    }
  };

  const startEdit = (affiliate: any) => {
    setEditingId(affiliate.id);
    setEditData({ ...affiliate });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Gestionar Miembros</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Member Section */}
          {!showAddForm && !editingId && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 text-slate-600 font-semibold rounded-lg hover:border-slate-400 hover:bg-slate-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Agregar Nuevo Miembro
            </button>
          )}

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddMember} className="p-4 bg-slate-50 rounded-lg space-y-4">
              <h3 className="font-semibold text-slate-900">Nuevo Miembro</h3>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Apellido"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="DNI"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Dirección"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <input
                type="text"
                placeholder="Teléfono"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isHolder}
                  onChange={(e) => setFormData({ ...formData, isHolder: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-semibold text-slate-900">Es titular</span>
              </label>

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
            <form onSubmit={handleUpdateMember} className="p-4 bg-slate-50 rounded-lg space-y-4">
              <h3 className="font-semibold text-slate-900">Editar Miembro</h3>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={editData.firstName}
                  onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Apellido"
                  value={editData.lastName}
                  onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="DNI"
                  value={editData.documentNumber}
                  onChange={(e) => setEditData({ ...editData, documentNumber: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="date"
                  value={editData.birthDate?.split('T')[0]}
                  onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Dirección"
                  value={editData.address || ''}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={editData.email || ''}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <input
                type="text"
                placeholder="Teléfono"
                value={editData.phone || ''}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />

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

          {/* Members List */}
          <div className="space-y-3">
            {groupData.affiliates?.map((affiliate) => (
              <div key={affiliate.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">
                    {affiliate.firstName} {affiliate.lastName}
                    {affiliate.isHolder && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        Titular
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">
                    {affiliate.documentNumber} • {new Date(affiliate.birthDate).toLocaleDateString('es-AR')}
                  </p>
                  {(affiliate.address || affiliate.email || affiliate.phone) && (
                    <p className="text-xs text-slate-400 mt-1">
                      {affiliate.address || 'Sin dirección'}
                      {affiliate.email ? ` • ${affiliate.email}` : ''}
                      {affiliate.phone ? ` • ${affiliate.phone}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(affiliate)}
                    className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveMember(affiliate.id)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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

export default MembersModal;
