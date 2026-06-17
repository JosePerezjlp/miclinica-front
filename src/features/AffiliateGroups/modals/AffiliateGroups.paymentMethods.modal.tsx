import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { X, Check, Plus, Trash2, Edit2 } from "lucide-react";
import type { AppDispatch, RootState } from "../../../store/store";
import type { GroupDetailData } from "../AffiliateGroups.detail.types";
import {
  addPaymentMethodThunk,
  removePaymentMethodThunk,
  setPaymentAutomationThunk,
  updatePaymentMethodThunk,
} from "../AffiliateGroups.detail.action";

interface PaymentMethodsModalProps {
  groupData: GroupDetailData;
  onClose: () => void;
}

const GATEWAY_OPTIONS = ["SIRO", "PAYWAY"] as const;

const PAYWAY_DEVICE_FINGERPRINT_STORAGE_KEY =
  "miclinica.payway.deviceFingerprintId";

function buildPaywayDeviceFingerprintId(): string {
  const randomPart =
    typeof window !== "undefined" && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

  return `payway-${randomPart}`.slice(0, 64);
}

function getOrCreatePaywayDeviceFingerprintId(): string {
  if (typeof window === "undefined") {
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

const PaymentMethodsModal: React.FC<PaymentMethodsModalProps> = ({
  groupData,
  onClose,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(
    (state: RootState) => state.groupDetail?.loading || false,
  );

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedPrimaryMethodId, setSelectedPrimaryMethodId] = useState<
    number | null
  >(null);
  const [selectedBackupMethodIds, setSelectedBackupMethodIds] = useState<
    number[]
  >([]);

  const [formData, setFormData] = useState({
    gateway: "PAYWAY",
    type: "CARD",
    rawToken: "",
    priority: 1,
    cardNumber: "",
    cvv: "",
    expiryMonth: "",
    expiryYear: "",
    last4: "",
    brand: "",
    holderName: "",
    documentNumber: "",
    email: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    phone: "",
    chargePendingNow: false,
    amountDue:
      groupData.currentAccount?.balanceCapital &&
      groupData.currentAccount.balanceCapital > 0
        ? Number(groupData.currentAccount.balanceCapital)
        : Number(groupData.plan?.monthlyFee ?? 0),
  });

  const [editData, setEditData] = useState<any>(null);

  const savedMethods =
    groupData.paymentMethods?.filter((method) => !method.deletedAt) || [];
  const activeMethods = savedMethods.filter((method) => method.isActive);
  const inactiveMethods = savedMethods.filter((method) => !method.isActive);

  useEffect(() => {
    const primaryMethod =
      inactiveMethods.find((method) => method.priority === 1) ??
      inactiveMethods[0] ??
      null;

    setSelectedPrimaryMethodId(primaryMethod?.id ?? null);
    setSelectedBackupMethodIds(
      inactiveMethods
        .filter((method) => method.id !== primaryMethod?.id)
        .map((method) => method.id),
    );
  }, [groupData.id, inactiveMethods]);

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();

    const isSiro = formData.gateway === "SIRO";

    try {
      await dispatch(
        addPaymentMethodThunk({
          groupId: groupData.id,
          payload: {
            gateway: formData.gateway,
            type: isSiro ? "CBU" : "CARD",
            rawToken: isSiro ? formData.rawToken : undefined,
            priority: formData.priority,
            cardNumber: isSiro ? undefined : formData.cardNumber,
            cvv: isSiro ? undefined : formData.cvv,
            expiryMonth: isSiro ? undefined : Number(formData.expiryMonth),
            expiryYear: isSiro ? undefined : Number(formData.expiryYear),
            last4: isSiro
              ? formData.rawToken.replace(/\D/g, "").slice(-4)
              : formData.cardNumber.replace(/\D/g, "").slice(-4),
            brand: isSiro ? "CBU" : undefined,
            holderName: formData.holderName || undefined,
            documentNumber: formData.documentNumber || undefined,
            email: isSiro ? formData.email || undefined : undefined,
            address: undefined,
            city: undefined,
            province: undefined,
            postalCode: undefined,
            phone: undefined,
            deviceFingerprintId:
              formData.gateway === "PAYWAY"
                ? getOrCreatePaywayDeviceFingerprintId()
                : undefined,
            chargePendingNow: formData.chargePendingNow,
            amountDue: formData.chargePendingNow
              ? Number(formData.amountDue)
              : undefined,
          },
        }),
      ).unwrap();
    } catch (error: any) {
      toast.error(
        error?.message ||
          (isSiro
            ? "No se pudo agregar el CBU. Verificá que sea un CBU bancario real (no un CVU de billetera digital)."
            : "No se pudo agregar la tarjeta. Revisá los datos e intentá de nuevo."),
        { duration: 6000 },
      );
      return;
    }

    toast.success(
      isSiro
        ? "CBU agregado. Se usará desde la próxima cuota."
        : formData.chargePendingNow
          ? "Tarjeta agregada y cobro pendiente ejecutado por decisión del operador."
          : "Tarjeta agregada. Se usará desde la próxima cuota.",
    );

    setFormData({
      gateway: "PAYWAY",
      type: "CARD",
      rawToken: "",
      priority: 1,
      cardNumber: "",
      cvv: "",
      expiryMonth: "",
      expiryYear: "",
      last4: "",
      brand: "",
      holderName: "",
      documentNumber: "",
      email: "",
      address: "",
      city: "",
      province: "",
      postalCode: "",
      phone: "",
      chargePendingNow: false,
      amountDue:
        groupData.currentAccount?.balanceCapital &&
        groupData.currentAccount.balanceCapital > 0
          ? Number(groupData.currentAccount.balanceCapital)
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
      await dispatch(
        updatePaymentMethodThunk({
          groupId: groupData.id,
          methodId: editingId,
          payload: updatePayload,
        }),
      );
      setEditingId(null);
      setEditData(null);
    }
  };

  const handleRemoveMethod = async (methodId: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta forma de pago?")) {
      await dispatch(
        removePaymentMethodThunk({
          groupId: groupData.id,
          methodId,
        }),
      );
    }
  };

  const startEdit = (method: any) => {
    setEditingId(method.id);
    setEditData({ ...method });
  };

  const handleDisableAutomatic = async () => {
    await dispatch(
      setPaymentAutomationThunk({
        groupId: groupData.id,
        payload: { enabled: false },
      }),
    ).unwrap();

    toast.success(
      "Cobro automático desactivado. El grupo vuelve a gestión manual/efectivo.",
    );
  };

  const handleEnableAutomatic = async () => {
    if (!selectedPrimaryMethodId) {
      toast.error(
        "Seleccioná una tarjeta principal para reactivar el cobro automático.",
      );
      return;
    }

    await dispatch(
      setPaymentAutomationThunk({
        groupId: groupData.id,
        payload: {
          enabled: true,
          primaryMethodId: selectedPrimaryMethodId,
          backupMethodIds: selectedBackupMethodIds.filter(
            (methodId) => methodId !== selectedPrimaryMethodId,
          ),
        },
      }),
    ).unwrap();

    toast.success(
      "Cobro automático reactivado con tarjeta principal y respaldos configurados.",
    );
  };

  const toggleBackupMethod = (methodId: number) => {
    setSelectedBackupMethodIds((current) =>
      current.includes(methodId)
        ? current.filter((id) => id !== methodId)
        : [...current, methodId],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">
            Gestionar Formas de Pago
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Modo de cobranza
                </h3>
                <p className="text-sm text-slate-600 mt-1">
                  {activeMethods.length > 0
                    ? "El grupo tiene cobro automático activo. Si falla la principal, el sistema prueba con la siguiente tarjeta activa según prioridad."
                    : "El grupo está en gestión manual/efectivo. Las tarjetas guardadas no se usan hasta reactivar el cobro automático."}
                </p>
              </div>
              {activeMethods.length > 0 ? (
                <button
                  type="button"
                  onClick={handleDisableAutomatic}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50"
                >
                  Pasar a efectivo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEnableAutomatic}
                  disabled={loading || inactiveMethods.length === 0}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  Activar cobro automático
                </button>
              )}
            </div>

            {activeMethods.length === 0 && inactiveMethods.length > 0 && (
              <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm font-semibold text-blue-900">
                  Elegí la tarjeta principal y los respaldos que querés
                  reactivar.
                </p>
                <div className="space-y-3">
                  {inactiveMethods.map((method) => {
                    const isPrimary = selectedPrimaryMethodId === method.id;
                    const isBackup = selectedBackupMethodIds.includes(
                      method.id,
                    );

                    return (
                      <div
                        key={method.id}
                        className="rounded-lg border border-blue-100 bg-white px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {method.type} - {method.gateway}
                            </p>
                            <p className="text-sm text-slate-500">
                              {method.brand ? `${method.brand} ` : ""}
                              {method.last4 ? `•••• ${method.last4}` : ""}
                              {method.holderName
                                ? ` - ${method.holderName}`
                                : ""}
                            </p>
                          </div>
                          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <input
                              type="radio"
                              name="primary-payment-method"
                              checked={isPrimary}
                              onChange={() =>
                                setSelectedPrimaryMethodId(method.id)
                              }
                            />
                            Principal
                          </label>
                        </div>
                        <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={isBackup}
                            onChange={() => toggleBackupMethod(method.id)}
                            disabled={isPrimary}
                          />
                          Usar como respaldo si falla la principal
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeMethods.length === 0 && inactiveMethods.length === 0 && (
              <p className="text-sm text-slate-500">
                No hay tarjetas guardadas para reactivar. Primero agregá una
                forma de pago.
              </p>
            )}
          </div>

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
            <form
              onSubmit={handleAddMethod}
              className="p-4 bg-slate-50 rounded-lg space-y-4"
            >
              <h3 className="font-semibold text-slate-900">
                Nueva Forma de Pago
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Gateway
                  </label>
                  <select
                    value={formData.gateway}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gateway: e.target.value,
                        type: e.target.value === "SIRO" ? "CBU" : "CARD",
                        rawToken: "",
                        chargePendingNow: formData.chargePendingNow,
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
                  <label className="block text-xs font-semibold text-slate-900 mb-1">
                    Tipo
                  </label>
                  <input
                    value={formData.gateway === "SIRO" ? "CBU" : "CARD"}
                    disabled
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Prioridad
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {formData.gateway === "PAYWAY" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Número de tarjeta"
                      value={formData.cardNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, cardNumber: e.target.value })
                      }
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                    <input
                      type="text"
                      placeholder="CVV"
                      value={formData.cvv}
                      onChange={(e) =>
                        setFormData({ ...formData, cvv: e.target.value })
                      }
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
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expiryMonth: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                    <input
                      type="number"
                      min="2026"
                      placeholder="Año vencimiento"
                      value={formData.expiryYear}
                      onChange={(e) =>
                        setFormData({ ...formData, expiryYear: e.target.value })
                      }
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nombre del Titular (opcional)"
                      value={formData.holderName}
                      onChange={(e) =>
                        setFormData({ ...formData, holderName: e.target.value })
                      }
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="DNI titular (opcional)"
                      value={formData.documentNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          documentNumber: e.target.value,
                        })
                      }
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
                        Cobrar saldo pendiente ahora. Si no lo marcás, la
                        tarjeta solo se usará desde la próxima cuota.
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

              {formData.gateway === "SIRO" && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
                    SIRO se maneja solo con CBU desde este frontend.
                  </div>

                  <input
                    type="text"
                    placeholder="CBU"
                    value={formData.rawToken}
                    onChange={(e) =>
                      setFormData({ ...formData, rawToken: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nombre del Titular"
                      value={formData.holderName}
                      onChange={(e) =>
                        setFormData({ ...formData, holderName: e.target.value })
                      }
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      type="text"
                      placeholder="DNI titular"
                      value={formData.documentNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          documentNumber: e.target.value,
                        })
                      }
                      className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <input
                    type="email"
                    placeholder="Email del cliente"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
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
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Agregar
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Edit Form */}
          {editingId && editData && (
            <form
              onSubmit={handleUpdateMethod}
              className="p-4 bg-slate-50 rounded-lg space-y-4"
            >
              <h3 className="font-semibold text-slate-900">
                Editar Forma de Pago
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  Prioridad
                </label>
                <input
                  type="number"
                  min="1"
                  value={editData.priority}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      priority: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editData.isActive}
                  onChange={(e) =>
                    setEditData({ ...editData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-semibold text-slate-900">
                  Activo
                </span>
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
                  {loading ? "Guardando..." : "Actualizar"}
                </button>
              </div>
            </form>
          )}

          {/* Payment Methods List */}
          <div className="space-y-3">
            {groupData.paymentMethods?.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
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
                      Vence:{" "}
                      {new Date(method.expiresAt).toLocaleDateString("es-AR")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      Prioridad: {method.priority}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${
                        method.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {method.isActive ? "Activo" : "Inactivo"}
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
