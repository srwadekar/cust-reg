import React from 'react';
import { CustomerLog, CustomerServiceItem, ServiceProcessStatus, PhysicalDeliveryStatus } from '../types/ledger';

export interface CustomerLedgerCardProps {
  customer: CustomerLog;
  onToggleProcStatus: (customerId: number | string, serviceId: string | number, status: ServiceProcessStatus) => void;
  onTogglePhysicalStatus: (customerId: number | string, serviceId: string | number, status: PhysicalDeliveryStatus) => void;
  onEditCustomer?: (customer: CustomerLog) => void;
  onDeleteCustomer?: (customerId: number | string) => void;
  onPrintReceipt?: (customer: CustomerLog) => void;
  onSendWhatsApp?: (customer: CustomerLog) => void;
}

export const CustomerLedgerCard: React.FC<CustomerLedgerCardProps> = ({
  customer,
  onToggleProcStatus,
  onTogglePhysicalStatus,
  onEditCustomer,
  onDeleteCustomer,
  onPrintReceipt,
  onSendWhatsApp,
}) => {
  const getNormalizedServices = (c: CustomerLog): CustomerServiceItem[] => {
    if (!c.services || !Array.isArray(c.services)) return [];
    return c.services.map((srv, index) => ({
      id: srv.id ?? index,
      service_name: srv.service_name || srv.name || 'General Service',
      customer_fee: Number(srv.customer_fee ?? srv.customerPrice ?? 0),
      proc_status: (srv.proc_status || srv.status || 'Pending') as ServiceProcessStatus,
      physical_status: (srv.physical_status || srv.physicalStatus || 'In Shop') as PhysicalDeliveryStatus,
      completed_at: srv.completed_at || srv.completedAt,
      dispatched_at: srv.dispatched_at || srv.dispatchedAt,
      assigned_to: srv.assigned_to || srv.assignedTo,
      completed_by: srv.completed_by || srv.completedBy,
      dispatched_by: srv.dispatched_by || srv.dispatchedBy,
    }));
  };

  const services = getNormalizedServices(customer);
  const totalDue = Math.max(0, (customer.total_amount || 0) - (customer.paid_amount || 0));
  const isFullyPaid = totalDue <= 0 && (customer.total_amount || 0) > 0;

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-3.5">
      {/* Header: Customer Info & Financial Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              #{customer.app_id}
            </span>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">{customer.customer_name}</h3>
            {customer.mobile_no && (
              <a
                href={`tel:${customer.mobile_no}`}
                className="text-xs text-slate-500 hover:text-slate-800 font-mono"
              >
                📞 {customer.mobile_no}
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
            <span>📅 {customer.date}</span>
            {customer.application_type && (
              <>
                <span>•</span>
                <span className="text-slate-600 font-medium">{customer.application_type}</span>
              </>
            )}
            {customer.address && (
              <>
                <span>•</span>
                <span className="truncate max-w-[200px]" title={customer.address}>📍 {customer.address}</span>
              </>
            )}
          </div>
        </div>

        {/* Financial Badges */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fee / Paid</div>
            <div className="text-xs font-mono font-bold text-slate-800">
              ₹{Number(customer.total_amount || 0).toLocaleString('en-IN')} / <span className="text-emerald-700">₹{Number(customer.paid_amount || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${
            isFullyPaid
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : totalDue > 0
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}>
            {isFullyPaid ? '✓ Paid' : `Due: ₹${totalDue.toLocaleString('en-IN')}`}
          </div>
        </div>
      </div>

      {/* Subscribed Services & Multi-Stage Completion */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Subscribed Services & Multi-Stage Completion
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3 border border-slate-200/70 transition space-y-2"
            >
              {/* Service Title & Pricing */}
              <div className="flex items-center justify-between">
                <div className="font-bold text-xs text-slate-900 tracking-tight">
                  {srv.service_name}
                </div>
                <div className="text-xs font-mono font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                  ₹{srv.customer_fee}
                </div>
              </div>

              {/* Processing State Segmented Controller */}
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Work Progress:
                </span>
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  {(['Pending', 'In Process', 'Completed'] as const).map((statusKey) => {
                    const isActive = srv.proc_status === statusKey;
                    return (
                      <button
                        key={statusKey}
                        type="button"
                        onClick={() => onToggleProcStatus(customer.id, srv.id, statusKey)}
                        className={`py-1 text-[10px] font-bold rounded-md transition-all text-center cursor-pointer ${
                          isActive
                            ? statusKey === 'Completed'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : statusKey === 'In Process'
                              ? 'bg-sky-600 text-white shadow-xs'
                              : 'bg-amber-500 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        {statusKey === 'Completed' ? '✓ Completed' : statusKey === 'In Process' ? '⚡ Process' : '⏳ Pending'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Physical Dispatch Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-500 font-medium">Physical Delivery:</span>
                <button
                  type="button"
                  onClick={() =>
                    onTogglePhysicalStatus(
                      customer.id,
                      srv.id,
                      srv.physical_status === 'Despatched' ? 'In Shop' : 'Despatched'
                    )
                  }
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition cursor-pointer ${
                    srv.physical_status === 'Despatched'
                      ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {srv.physical_status === 'Despatched' ? '📦 Dispatched (Out)' : '🏬 Ready in Shop'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Footer (WhatsApp, Receipt, Edit, Delete) */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1.5">
          {onSendWhatsApp && (
            <button
              onClick={() => onSendWhatsApp(customer)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-semibold cursor-pointer transition"
              title="Send WhatsApp Update"
            >
              💬 WhatsApp
            </button>
          )}
          {onPrintReceipt && (
            <button
              onClick={() => onPrintReceipt(customer)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 font-semibold cursor-pointer transition"
              title="Print Customer Receipt"
            >
              🖨️ Receipt
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onEditCustomer && (
            <button
              onClick={() => onEditCustomer(customer)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="Edit Customer"
            >
              ✏️
            </button>
          )}
          {onDeleteCustomer && (
            <button
              onClick={() => onDeleteCustomer(customer.id)}
              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
              title="Delete Entry"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
