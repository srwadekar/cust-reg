import React from 'react';
import { DailyCommissionGroup } from '../types/commission';
import { formatINR, formatDateDisplay, getStageBadge } from '../utils/commissionUtils';

interface CommissionDrilldownModalProps {
  group: DailyCommissionGroup | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CommissionDrilldownModal: React.FC<CommissionDrilldownModalProps> = ({
  group,
  isOpen,
  onClose
}) => {
  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-sm">
              <i className="fa-solid fa-list-check"></i>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Daily Commission Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                {formatDateDisplay(group.date)} • {group.services.length} services completed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Modal Summary Banner */}
        <div className="px-6 py-3 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            Total Earned on this Day:
          </span>
          <span className="text-lg font-extrabold text-emerald-700">
            {formatINR(group.total)}
          </span>
        </div>

        {/* Services List Table */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Workflow Stage</th>
                  <th className="px-4 py-3 text-right">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {group.services.map((item, idx) => {
                  const stageBadge = getStageBadge(item.stage);
                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                        {item.time || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {item.customerName}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {item.serviceName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${stageBadge.badgeClass}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${stageBadge.dotClass}`}></span>
                          {stageBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-700 font-mono text-sm">
                        {formatINR(item.commissionAmount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Isolated from base attendance salary.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg text-xs transition"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
