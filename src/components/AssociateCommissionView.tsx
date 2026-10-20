import React, { useState, useMemo } from 'react';
import { useAssociateCommission } from '../hooks/useAssociateCommission';
import { CommissionTask } from '../types/commission';
import { formatINR, formatDateDisplay, getTodayISODate } from '../utils/commissionUtils';

interface Props {
  associateId: string;
  associateName: string;
  tasks: CommissionTask[];
  paidCommissionAmount: number;
  onPayCommission?: (amount: number) => void;
  isAdmin?: boolean;
}

const EXTENDED_PAGE_SIZE = 12;

export const AssociateCommissionView: React.FC<Props> = ({
  associateId,
  associateName,
  tasks = [],
  paidCommissionAmount = 0,
  onPayCommission,
  isAdmin = false
}) => {
  const todayStr = getTodayISODate();

  const { todayEarned, pendingPayout, totalAccumulated, dailyGroups } = useAssociateCommission(
    associateId,
    tasks,
    paidCommissionAmount,
    todayStr
  );

  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [isExtendedMode, setIsExtendedMode] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Progressive Pagination Logic (Default last 4 days -> 12 days per page)
  const totalDays = dailyGroups ? dailyGroups.length : 0;
  const totalPages = Math.ceil(totalDays / EXTENDED_PAGE_SIZE) || 1;

  const visibleDays = useMemo(() => {
    if (!dailyGroups || dailyGroups.length === 0) return [];
    if (!isExtendedMode) {
      // डीफॉल्ट फक्त शेवटचे ४ दिवस (Default: Last 4 days)
      return dailyGroups.slice(0, 4);
    }
    // १२ दिवसांचे पान (12 Days per page in Extended Mode)
    const startIndex = (currentPage - 1) * EXTENDED_PAGE_SIZE;
    return dailyGroups.slice(startIndex, startIndex + EXTENDED_PAGE_SIZE);
  }, [dailyGroups, isExtendedMode, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
      setExpandedDate(null);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      setExpandedDate(null);
    }
  };

  const handleToggleMode = () => {
    setIsExtendedMode((prev) => !prev);
    setCurrentPage(1);
    setExpandedDate(null);
  };

  return (
    <div className="space-y-4">
      {/* १. स्ट्रीमलाइन्ड समरी कार्ड्स (३ कार्ड्स: Total Earned, Pending Payout, Today's Earned) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* कार्ड १: Total Earned (एकूण कमिशन) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Earned (एकूण कमिशन)
              </span>
              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs">
                <i className="fa-solid fa-trophy"></i>
              </span>
            </div>
            <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono tracking-tight">
              {formatINR(totalAccumulated)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2">
            एकूण कमिशन कमाई • {associateName || associateId}
          </div>
        </div>

        {/* कार्ड २: Pending Payout (द्यायचे बाकी कमिशन) */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Pending Payout (द्यायचे बाकी कमिशन)
              </span>
              {pendingPayout > 0 && onPayCommission && (
                <button
                  type="button"
                  onClick={() => onPayCommission(pendingPayout)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold transition shadow-2xs cursor-pointer inline-flex items-center gap-1"
                >
                  <i className="fa-solid fa-hand-holding-dollar text-[9px]"></i> Pay Now
                </button>
              )}
            </div>
            <div className="text-xl font-extrabold text-amber-600 mt-1 font-mono tracking-tight">
              {formatINR(pendingPayout)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>देय बाकी कमिशन</span>
            <span className="text-[9px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded border border-amber-200 font-semibold">
              Decoupled
            </span>
          </div>
        </div>

        {/* कार्ड ३: Today's Earned (आजचे कमिशन) */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-200/90 shadow-2xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Today's Earned (आजचे कमिशन)
              </span>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[9px] font-bold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-200 uppercase">
                  Today
                </span>
              </div>
            </div>
            <div className="text-xl font-extrabold text-indigo-700 mt-1 font-mono tracking-tight">
              {formatINR(todayEarned)}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
            <span>आज पूर्ण / डिस्पॅच कामे</span>
            <span className="text-[9px] text-indigo-600 font-semibold">Date-Accurate</span>
          </div>
        </div>
      </div>

      {/* २. दैनिक कमिशन यादी व नियंत्रणे (Daily History with 4 Days -> 12 Days Pagination) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            {!isExtendedMode
              ? 'Daily History (Recent 4 Days)'
              : `Daily History (Page ${currentPage} of ${totalPages})`}
          </h4>

          {totalDays > 4 && (
            <button
              type="button"
              onClick={handleToggleMode}
              className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition cursor-pointer flex items-center gap-1"
            >
              <i className="fa-solid fa-list-ul text-[10px]"></i>
              <span>
                {!isExtendedMode
                  ? `View More History (${totalDays} Days)`
                  : 'Show Recent 4 Days Only'}
              </span>
            </button>
          )}
        </div>

        {visibleDays.length === 0 ? (
          <div className="text-xs text-slate-400 text-center py-6 bg-white rounded-xl border border-dashed border-slate-200">
            कोणतीही नोंद उपलब्ध नाही (No commission records found).
          </div>
        ) : (
          <div className="space-y-1.5">
            {visibleDays.map((group) => {
              const isExpanded = expandedDate === group.date;
              const isToday = group.date === todayStr;

              return (
                <div
                  key={group.date}
                  className={`bg-white rounded-xl border transition shadow-2xs overflow-hidden ${
                    isToday ? 'border-indigo-300 ring-1 ring-indigo-200' : 'border-slate-200'
                  }`}
                >
                  {/* Clickable Day Card Header */}
                  <button
                    type="button"
                    onClick={() => setExpandedDate(isExpanded ? null : group.date)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50/70 transition cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>📅 {formatDateDisplay(group.date)}</span>
                        {isToday && (
                          <span className="text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.2 rounded-full uppercase">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {group.services.length} कामे पूर्ण केली
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-700 font-mono">
                        {formatINR(group.total)}
                      </span>
                      <span className="text-slate-400 text-xs">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </button>

                  {/* Drilldown Service Breakdown */}
                  {isExpanded && (
                    <div className="bg-slate-50/80 border-t border-slate-100 p-2.5 space-y-1.5">
                      {group.services.map((srv) => (
                        <div
                          key={srv.id}
                          className="bg-white p-2.5 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">
                              {srv.serviceName}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              ग्राहक: <strong className="text-slate-700">{srv.customerName}</strong> •{' '}
                              <span className="text-indigo-600 font-medium">
                                {srv.stageLabel ||
                                  (srv.stage === 'STAGE_1_DOCS'
                                    ? 'कामाचे कमिशन'
                                    : srv.stage === 'STAGE_2_SUBMIT'
                                    ? 'डिस्पॅच कमिशन'
                                    : 'पूर्ण काम')}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="font-bold text-emerald-700 font-mono text-sm">
                              +{formatINR(srv.commissionAmount)}
                            </span>
                            <div className="text-[9px] text-slate-400 font-mono">{srv.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ३. १२-१२ दिवसांचे पॅजिनेशन नियंत्रणे (Next / Previous Buttons) */}
        {isExtendedMode && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
            >
              <i className="fa-solid fa-chevron-left text-[10px]"></i> Previous 12 Days
            </button>

            <span className="text-[11px] font-semibold text-slate-500">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
            >
              Next 12 Days <i className="fa-solid fa-chevron-right text-[10px]"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssociateCommissionView;
