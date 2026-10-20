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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {/* 1. Total Earned (एकूण कमिशन) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition duration-150 flex flex-col justify-between overflow-visible">
        <div>
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Earned (एकूण कमिशन)
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm shrink-0">
              <i className="fa-solid fa-trophy"></i>
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 font-mono tracking-tight break-words">
            {formatINR(totalAccumulated)}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 gap-2 flex-wrap">
          <span>एकूण झालेली कमाई</span>
          {paidAmount > 0 && (
            <span className="text-[11px] text-slate-600 font-medium font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              वितरित: {formatINR(paidAmount)}
            </span>
          )}
        </div>
      </div>

      {/* 2. Pending Payout (द्यायचे बाकी कमिशन) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/90 shadow-2xs hover:shadow-xs transition duration-150 flex flex-col justify-between overflow-visible relative border-t-4 border-t-amber-500">
        <div>
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Payout (द्यायचे बाकी कमिशन)
            </span>
            {isAdmin && pendingPayout > 0 && onOpenPayoutModal && (
              <button
                type="button"
                onClick={onOpenPayoutModal}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1 shrink-0"
              >
                <i className="fa-solid fa-hand-holding-dollar text-[10px]"></i> Pay Now
              </button>
            )}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2 font-mono tracking-tight break-words">
            {formatINR(pendingPayout)}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 gap-2 flex-wrap">
          <span>देय बाकी कमिशन</span>
          <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-semibold">
            Decoupled Ledger
          </span>
        </div>
      </div>

      {/* 3. Today's Earned (आजचे कमिशन) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-indigo-200/90 shadow-2xs hover:shadow-xs transition duration-150 flex flex-col justify-between overflow-visible relative border-t-4 border-t-indigo-600 sm:col-span-2 lg:col-span-1">
        <div>
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today's Earned (आजचे कमिशन)
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live Today Tracker"></span>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                {todayLabel}
              </span>
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-700 mt-2 font-mono tracking-tight break-words">
            {formatINR(todayEarned)}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 gap-2 flex-wrap">
          <span>आज पूर्ण / डिस्पॅच कामे</span>
          <span className="text-[11px] text-indigo-600 font-semibold bg-indigo-50/70 px-2 py-0.5 rounded">
            Live Split Credit
          </span>
        </div>
      </div>
    </div>
  );
};

export default CommissionMetricCards;
