import React from 'react';
import { formatINR } from '../utils/commissionUtils';

interface CommissionMetricCardsProps {
  totalAccumulated: number;
  pendingPayout: number;
  todayEarned: number;
  paidAmount?: number;
  todayLabel?: string;
  onOpenPayoutModal?: () => void;
  isAdmin?: boolean;
}

export const CommissionMetricCards: React.FC<CommissionMetricCardsProps> = ({
  totalAccumulated,
  pendingPayout,
  todayEarned,
  paidAmount = 0,
  todayLabel = 'Today',
  onOpenPayoutModal,
  isAdmin = false
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {/* 1. Total Earned (एकूण कमिशन) */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition duration-150 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Earned (एकूण कमिशन)
            </span>
            <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
              <i className="fa-solid fa-trophy"></i>
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1.5 font-mono tracking-tight">
            {formatINR(totalAccumulated)}
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>एकूण झालेली कमाई</span>
          {paidAmount > 0 && (
            <span className="text-[10px] text-slate-500 font-medium font-mono">
              वितरित: {formatINR(paidAmount)}
            </span>
          )}
        </div>
      </div>

      {/* 2. Pending Payout (द्यायचे बाकी कमिशन) */}
      <div className="bg-white p-4.5 rounded-2xl border border-amber-200/80 shadow-2xs hover:shadow-xs transition duration-150 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Payout (द्यायचे बाकी कमिशन)
            </span>
            {isAdmin && pendingPayout > 0 && onOpenPayoutModal && (
              <button
                type="button"
                onClick={onOpenPayoutModal}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
              >
                <i className="fa-solid fa-hand-holding-dollar text-[9px]"></i> Pay Now
              </button>
            )}
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1.5 font-mono tracking-tight">
            {formatINR(pendingPayout)}
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>देय बाकी कमिशन</span>
          <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded border border-amber-200 font-semibold">
            Decoupled
          </span>
        </div>
      </div>

      {/* 3. Today's Earned (आजचे कमिशन) */}
      <div className="bg-white p-4.5 rounded-2xl border border-indigo-200/80 shadow-2xs hover:shadow-xs transition duration-150 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Today's Earned (आजचे कमिशन)
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live Today Tracker"></span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                {todayLabel}
              </span>
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 mt-1.5 font-mono tracking-tight">
            {formatINR(todayEarned)}
          </div>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>आज पूर्ण / डिस्पॅच कामे</span>
          <span className="text-[10px] text-indigo-600 font-semibold">
            Live Split
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommissionMetricCards;
