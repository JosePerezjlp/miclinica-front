import React from 'react';
import { X } from 'lucide-react';
import type { GroupDetailData } from '../AffiliateGroups.detail.types';

interface BillingModalProps {
  groupData: GroupDetailData;
  onClose: () => void;
}

const BillingModal: React.FC<BillingModalProps> = ({ groupData, onClose }) => {
  const allPayments = groupData.payments || [];
  const allBillingPeriods = groupData.billingPeriods || [];

  const getPaymentForPeriod = (periodId: number) => {
    return allPayments.find((p) => p.billingPeriodId === periodId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-slate-900">Historial de Facturación y Pagos</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs uppercase text-blue-600 font-semibold">Total Pagos</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                ${allPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0).toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <p className="text-xs uppercase text-emerald-600 font-semibold">Pagados</p>
              <p className="text-2xl font-bold text-emerald-900 mt-2">
                {allPayments.filter((p) => p.status === 'PAID').length}
              </p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs uppercase text-red-600 font-semibold">Fallidos</p>
              <p className="text-2xl font-bold text-red-900 mt-2">
                {allPayments.filter((p) => p.status === 'FAILED').length}
              </p>
            </div>
          </div>

          {/* Billing Periods Table */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-4">Períodos de Facturación</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold">
                    <th className="px-4 py-3 text-left">Período</th>
                    <th className="px-4 py-3 text-left">Monto</th>
                    <th className="px-4 py-3 text-left">Estado</th>
                    <th className="px-4 py-3 text-left">Pago</th>
                    <th className="px-4 py-3 text-left">Gateway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allBillingPeriods.length > 0 ? (
                    allBillingPeriods.map((period) => {
                      const payment = getPaymentForPeriod(period.id);
                      return (
                        <tr key={period.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {String(period.month).padStart(2, '0')}/{period.year}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            ${parseFloat(period.amountDue.toString()).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              period.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-700'
                                : period.status === 'FAILED'
                                ? 'bg-red-100 text-red-700'
                                : period.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : period.status === 'EXEMPT'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {period.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {payment ? (
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                payment.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                ${parseFloat(payment.amount.toString()).toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600 text-xs font-mono">
                            {payment?.gateway || '—'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                        No hay períodos de facturación registrados
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* All Payments Detail */}
          {allPayments.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Detalle de Pagos</h3>
              <div className="space-y-3">
                {allPayments.map((payment) => (
                  <div key={payment.id} className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          Pago #{payment.id} - {payment.month}/{payment.year}
                        </p>
                        <p className="text-xs text-slate-500">
                          Creado: {new Date(payment.createdAt).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900">
                          ${parseFloat(payment.amount.toString()).toFixed(2)}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold ${
                          payment.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 pt-3 border-t border-slate-200">
                      <div>
                        <p className="text-slate-500">Gateway</p>
                        <p className="font-mono">{payment.gateway}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">ID Transacción</p>
                        <p className="font-mono">{payment.gatewayTransactionId || '—'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

export default BillingModal;
