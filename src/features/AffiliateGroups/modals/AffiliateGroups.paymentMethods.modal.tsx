import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { X, Check, Plus, Trash2, Edit2 } from 'lucide-react';
import type { AppDispatch, RootState } from '../../../store/store';
import type { GroupDetailData } from '../AffiliateGroups.detail.types';
import {
  addPaymentMethodThunk,
  getGroupDetailThunk,
  removePaymentMethodThunk,
  updatePaymentMethodThunk,
} from '../AffiliateGroups.detail.action';
import { mobbexService } from '../../../api/mobbex.service';
import { paymentsService } from '../../../api/payments.service';

interface PaymentMethodsModalProps {
  groupData: GroupDetailData;
  onClose: () => void;
}

const GATEWAY_OPTIONS = ['SIRO', 'PAYWAY', 'MOBBEX'] as const;

const PAYWAY_DEVICE_FINGERPRINT_STORAGE_KEY =
  'miclinica.payway.deviceFingerprintId';

function buildPaywayDeviceFingerprintId(): string {
  const randomPart =
    typeof window !== 'undefined' && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

  return `payway-${randomPart}`.slice(0, 64);
}

function getOrCreatePaywayDeviceFingerprintId(): string {
  if (typeof window === 'undefined') {
    return buildPaywayDeviceFingerprintId();
  }

  const existing = window.localStorage.getItem(
    PAYWAY_DEVICE_FINGERPRINT_STORAGE_KEY,
  );
  if (existing) {
    return existing;
  }

  const created = buildPaywayDeviceFingerprintId();
  window.localStorage.setItem(PAYWAY_DEVICE_FINGERPRINT_STORAGE_KEY, created);
  return created;
}

function buildSubscriptionStartDate() {
  const now = new Date();

  return {
    day: now.getDate(),
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

const PaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({ groupData, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector((state: RootState) => state.groupDetail?.loading || false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [generatedMobbexLink, setGeneratedMobbexLink] = useState('');
  const [mobbexSubscriptions, setMobbexSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);

  const [formData, setFormData] = useState({
    gateway: 'SIRO',
    type: 'CARD',
    priority: 1,
    cardNumber: '',
    cvv: '',
    expiryMonth: '',
    expiryYear: '',
    last4: '',
    brand: '',
    holderName: '',
    documentNumber: '',
    email: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    phone: '',
    mobbexSubscriptionId: '',
    mobbexWebhook: '',
    chargePendingNow: false,
    amountDue:
      groupData.currentAccount?.balance && groupData.currentAccount.balance > 0
        ? Number(groupData.currentAccount.balance)
        : Number(groupData.plan?.monthlyFee ?? 0),
  });

  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    if (!showAddForm || formData.gateway !== 'MOBBEX') {
      return;
    }

    let cancelled = false;

    const loadSubscriptions = async () => {
      setLoadingSubscriptions(true);
      try {
        const items = await mobbexService.searchSubscriptions('');
        if (cancelled) {
          return;
        }

        setMobbexSubscriptions(items);
        if (!formData.mobbexSubscriptionId && items[0]) {
          setFormData((prev) => ({
            ...prev,
            mobbexSubscriptionId: items[0].uid,
            mobbexWebhook: items[0].webhook ?? '',
          }));
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : 'No se pudieron cargar las suscripciones de Mobbex.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingSubscriptions(false);
        }
      }
    };

    void loadSubscriptions();

    return () => {
      cancelled = true;
    };
  }, [showAddForm, formData.gateway, formData.mobbexSubscriptionId]);

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.gateway === 'MOBBEX') {
      if (!formData.mobbexSubscriptionId) {
        toast.error('Seleccioná una suscripción de Mobbex.');
        return;
      }

      const createdMethod = await paymentsService.createGroupPaymentMethod(
        groupData.id,
        {
          gateway: 'MOBBEX',
          type: 'CARD',
          priority: formData.priority,
          brand: formData.brand || undefined,
          holderName: formData.holderName || groupData.holderFullName,
        },
      );

      try {
        const holderDocument =
          formData.documentNumber ||
          groupData.affiliates.find((affiliate) => affiliate.isHolder)
            ?.documentNumber ||
          '';

        const subscriber = await mobbexService.createGroupSubscriber(
          groupData.id,
          formData.mobbexSubscriptionId,
          {
            customer: {
              email:
                formData.email.trim() ||
                `pagos+fg-${groupData.id}@miclinica.local`,
              name: formData.holderName.trim() || groupData.holderFullName,
              identification: holderDocument.replace(/\D/g, ''),
            },
            startDate: buildSubscriptionStartDate(),
            webhook: formData.mobbexWebhook || undefined,
          },
        );

        if (!subscriber.result || !subscriber.sourceUrl) {
          throw new Error(
            subscriber.error ||
              subscriber.code ||
              'Mobbex no devolvió un link para completar la suscripción.',
          );
        }

        setGeneratedMobbexLink(subscriber.sourceUrl);
        await dispatch(getGroupDetailThunk(groupData.id)).unwrap();
        toast.success(
          'Tarjeta Mobbex preparada. Enviá el link al cliente para completar la adhesión.',
        );
      } catch (error) {
        await paymentsService.deactivateGroupPaymentMethod(
          groupData.id,
          createdMethod.id,
        );
        throw error;
      }
    } else {
      await dispatch(addPaymentMethodThunk({
        groupId: groupData.id,
        payload: {
          gateway: formData.gateway,
          type: 'CARD',
          priority: formData.priority,
          cardNumber: formData.cardNumber,
          cvv: formData.cvv,
          expiryMonth: Number(formData.expiryMonth),
          expiryYear: Number(formData.expiryYear),
          last4: formData.cardNumber.replace(/\D/g, '').slice(-4),
          brand: formData.brand || undefined,
          holderName: formData.holderName || groupData.holderFullName,
          documentNumber: formData.documentNumber || undefined,
          email: formData.email || undefined,
          address: formData.address || undefined,
          city: formData.city || undefined,
          province: formData.province || undefined,
          postalCode: formData.postalCode || undefined,
          phone: formData.phone || undefined,
          deviceFingerprintId:
            formData.gateway === 'PAYWAY'
              ? getOrCreatePaywayDeviceFingerprintId()
              : undefined,
          chargePendingNow: formData.chargePendingNow,
          amountDue: formData.chargePendingNow
            ? Number(formData.amountDue)
            : undefined,
        },
      })).unwrap();

      toast.success(
        formData.chargePendingNow
          ? 'Tarjeta agregada y cobro pendiente ejecutado por decisión del operador.'
          : 'Tarjeta agregada. Se usará desde la próxima cuota.',
      );
    }

    setFormData({
      gateway: 'SIRO',
      type: 'CARD',
      priority: 1,
      cardNumber: '',
      cvv: '',
      expiryMonth: '',
      expiryYear: '',
      last4: '',
      brand: '',
      holderName: '',
      documentNumber: '',
      email: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      phone: '',
      mobbexSubscriptionId: '',
      mobbexWebhook: '',
      chargePendingNow: false,
      amountDue:
        groupData.currentAccount?.balance && groupData.currentAccount.balance > 0
          ? Number(groupData.currentAccount.balance)
          : Number(groupData.plan?.monthlyFee ?? 0),
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
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gateway: e.target.value,
                        mobbexSubscriptionId: '',
                        mobbexWebhook: '',
                        chargePendingNow:
                          e.target.value === 'MOBBEX'
                            ? false
                            : formData.chargePendingNow,
                      })
                    }
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
                  <input
                    value="CARD"
                    disabled
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 outline-none"
                  />
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

              {formData.gateway !== 'MOBBEX' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Número de tarjeta"
                      value={formData.cardNumber}
                      onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      value={formData.cvv}
                      onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      placeholder="Mes vencimiento"
                      value={formData.expiryMonth}
                      onChange={(e) => setFormData({ ...formData, expiryMonth: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                    <input
                      type="number"
                      min="2026"
                      placeholder="Año vencimiento"
                      value={formData.expiryYear}
                      onChange={(e) => setFormData({ ...formData, expiryYear: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

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
                      placeholder="Nombre del Titular"
                      value={formData.holderName}
                      onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="DNI titular"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
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

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Dirección"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Ciudad"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Provincia"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Código Postal"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Teléfono"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={formData.chargePendingNow}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            chargePendingNow: e.target.checked,
                          })
                        }
                        className="mt-1 h-4 w-4 rounded"
                      />
                      <span className="text-sm text-slate-700">
                        Cobrar saldo pendiente ahora.
                        Si no lo marcás, la tarjeta solo se usará desde la próxima cuota.
                      </span>
                    </label>

                    {formData.chargePendingNow && (
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={formData.amountDue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            amountDue: Number(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    )}
                  </div>
                </>
              )}

              {formData.gateway === 'MOBBEX' && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
                    Mobbex no cobra en el alta de la tarjeta. Primero se genera la adhesión y el cliente debe completar el link de suscripción.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-900 mb-1">Suscripción Mobbex</label>
                    <select
                      value={formData.mobbexSubscriptionId}
                      onChange={(e) => {
                        const selected = mobbexSubscriptions.find(
                          (item) => item.uid === e.target.value,
                        );
                        setFormData({
                          ...formData,
                          mobbexSubscriptionId: e.target.value,
                          mobbexWebhook: selected?.webhook ?? '',
                        });
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      disabled={loadingSubscriptions}
                    >
                      <option value="">
                        {loadingSubscriptions ? 'Cargando suscripciones...' : 'Seleccioná una suscripción'}
                      </option>
                      {mobbexSubscriptions.map((subscription) => (
                        <option key={subscription.uid} value={subscription.uid}>
                          {subscription.name}
                        </option>
                      ))}
                    </select>
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
                      type="text"
                      placeholder="DNI titular"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <input
                    type="email"
                    placeholder="Email del cliente"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />

                  {generatedMobbexLink && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 space-y-2">
                      <p className="font-semibold">Link de adhesión generado</p>
                      <a
                        href={generatedMobbexLink}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-blue-600 underline"
                      >
                        {generatedMobbexLink}
                      </a>
                    </div>
                  )}
                </div>
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
