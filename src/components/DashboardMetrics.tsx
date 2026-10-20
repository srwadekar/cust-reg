import React from 'react';

export interface MetricsProps {
  activeServicesCount: number;
  totalBookings: number;
  inProcessCount: number;
  completedCount: number;
  totalAmount: number;
  totalAdvance: number;
  totalOutstanding: number;
}

export const DashboardMetrics: React.FC<MetricsProps> = ({
  activeServicesCount,
  totalBookings,
  inProcessCount,
  completedCount,
  totalAmount,
  totalAdvance,
  totalOutstanding,
}) => {
  return (
    <div className="space-y-3">
      {/* Volume Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Master Catalog</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{activeServicesCount}</div>
          <span className="text-[11px] font-medium text-emerald-600 mt-0.5 block">Active Services Configured</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalBookings}</div>
          <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">Customer Service Items</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Pipeline</span>
          <div className="text-2xl font-black text-sky-700 mt-1">{inProcessCount}</div>
          <span className="text-[11px] font-medium text-sky-600 mt-0.5 block">Active In Process Jobs</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{completedCount}</div>
          <span className="text-[11px] font-medium text-emerald-600 mt-0.5 block">Finished & Ready</span>
        </div>
      </div>

      {/* Financial Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Billed Volume</span>
            <div className="text-xl font-extrabold text-slate-900 font-mono mt-0.5">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">₹</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Collected Revenue</span>
            <div className="text-xl font-extrabold text-emerald-700 font-mono mt-0.5">₹{totalAdvance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">✓</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/30 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Outstanding Due Dues</span>
            <div className="text-xl font-extrabold text-amber-700 font-mono mt-0.5">₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100/70 flex items-center justify-center text-amber-700 font-bold">⏳</div>
        </div>
      </div>
    </div>
  );
};
