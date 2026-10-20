import React, { useState, useMemo } from 'react';
import { DailyCommissionGroup } from '../types/commission';
import { formatINR, formatDateDisplay, getTodayISODate } from '../utils/commissionUtils';

interface DailyCommissionCardsProps {
  dailyGroups: DailyCommissionGroup[];
  todayStr?: string;
  onSelectDate: (group: DailyCommissionGroup) => void;
}

const EXTENDED_PAGE_SIZE = 12;

export const DailyCommissionCards: React.FC<DailyCommissionCardsProps> = ({
  dailyGroups,
  todayStr = getTodayISODate(),
  onSelectDate
}) => {
  const [isExtendedMode, setIsExtendedMode] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalDays = dailyGroups ? dailyGroups.length : 0;
  const totalPages = Math.ceil(totalDays / EXTENDED_PAGE_SIZE) || 1;

  // Progressive Pagination: Default last 4 days -> 12 days paginated
  const visibleGroups = useMemo(() => {
    if (!dailyGroups || dailyGroups.length === 0) return [];
    if (!isExtendedMode) {
      return dailyGroups.slice(0, 4);
    }
    const startIndex = (currentPage - 1) * EXTENDED_PAGE_SIZE;
    return dailyGroups.slice(startIndex, startIndex + EXTENDED_PAGE_SIZE);
  }, [dailyGroups, isExtendedMode, currentPage]);

  const handleToggleMode = () => {
    setIsExtendedMode(prev => !prev);
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  if (!dailyGroups || dailyGroups.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-lg">
          <i className="fa-regular fa-calendar-xmark"></i>
        </div>
        <h4 className="text-sm font-bold text-slate-700">कोणतीही कमिशन नोंद उपलब्ध नाही</h4>
        <p className="text-xs text-slate-500 mt-1">
          पूर्ण झालेली सेवा किंवा डिस्पॅच कमिशन येथे दिसेल.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-2xl shadow-2xs border border-slate-200 space-y-3">
      {/* Header with Title and Mode Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <i className="fa-solid fa-calendar-days text-sm"></i>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {!isExtendedMode
                ? 'Daily History (Recent 4 Days)'
                : `Daily History (Page ${currentPage} of ${totalPages})`}
            </h4>
            <p className="text-[11px] text-slate-500">
              Click any day card to view customer services, workflow stages, and earned fees.
            </p>
          </div>
        </div>

        {totalDays > 4 && (
          <button
            type="button"
            onClick={handleToggleMode}
            className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition cursor-pointer flex items-center gap-1.5"
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

      {/* Date Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {visibleGroups.map(group => {
          const isToday = group.date === todayStr;
          const stage1Count = group.services.filter(s => s.stage === 'STAGE_1_DOCS').length;
          const stage2Count = group.services.filter(s => s.stage === 'STAGE_2_SUBMIT').length;
          const fullCount = group.services.filter(s => s.stage === 'FULL_COMPLETE').length;

          return (
            <div
              key={group.date}
              onClick={() => onSelectDate(group)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-150 hover:shadow-md hover:border-indigo-300 relative group flex flex-col justify-between ${
                isToday
                  ? 'bg-gradient-to-br from-indigo-50/70 to-white border-indigo-300 ring-1 ring-indigo-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">
                        {formatDateDisplay(group.date)}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-bold bg-indigo-600 text-white px-1.5 py-0.2 rounded-full uppercase">
                          Today
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {group.services.length} {group.services.length === 1 ? 'service' : 'services'}
                    </p>
                  </div>
                  <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] group-hover:bg-indigo-600 group-hover:text-white transition">
                    <i className="fa-solid fa-chevron-right"></i>
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-[10px] text-slate-400 font-medium">Day Total:</span>
                <span className="text-base font-extrabold text-emerald-700 font-mono">
                  {formatINR(group.total)}
                </span>
              </div>

              {/* Stage summary tags */}
              <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
                {stage1Count > 0 && (
                  <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium text-[9px]">
                    Work: {stage1Count}
                  </span>
                )}
                {stage2Count > 0 && (
                  <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium text-[9px]">
                    Disp: {stage2Count}
                  </span>
                )}
                {fullCount > 0 && (
                  <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-medium text-[9px]">
                    Full: {fullCount}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 12-Day Progressive Pagination Controls */}
      {isExtendedMode && totalPages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
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
  );
};

export default DailyCommissionCards;
