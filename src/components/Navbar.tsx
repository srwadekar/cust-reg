import React from 'react';

export interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingSyncCount: number;
  onOpenDbConfig: () => void;
  onForceClearSync: () => void;
  onNewCustomerLog?: () => void;
  // Punch In / Out props
  isPunchedIn: boolean;
  onTogglePunch: () => void;
  activeWorkDuration?: string; // e.g. "2h 15m"
  operatorName?: string;
  role?: string;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  pendingSyncCount,
  onOpenDbConfig,
  onForceClearSync,
  onNewCustomerLog,
  isPunchedIn,
  onTogglePunch,
  activeWorkDuration,
  operatorName = 'Sagar Wadekar',
  role = 'Operator',
  onLogout,
}) => {
  const navigationTabs = [
    { id: 'ledger', label: 'Operations Ledger', icon: '📋' },
    { id: 'tasks', label: 'Task Dispatch', icon: '⚡' },
    { id: 'attendance_hub', label: 'Attendance & Payroll', icon: '👥' },
    { id: 'commissions', label: 'Commission & Ledger', icon: '💰' },
    { id: 'admin', label: 'Master Admin', icon: '⚙️' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-2xs">
      {/* TIER 1: BRAND + PUNCH TOGGLE + LOG + OPERATOR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-slate-100">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Cafe Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-800 flex items-center justify-center text-white font-black text-base shadow-xs">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 tracking-tight">
                  Suravi Cyber Cafe
                </span>
                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-none">Nampur • Center Operations</p>
            </div>
          </div>

          {/* Quick Actions & Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* RESTORED: DYNAMIC PUNCH IN / PUNCH OUT BUTTON */}
            <button
              type="button"
              onClick={onTogglePunch}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
                isPunchedIn
                  ? 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 animate-pulse'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
              }`}
              title={isPunchedIn ? 'Click to Punch Out' : 'Click to Punch In'}
            >
              <span>{isPunchedIn ? '🛑' : '⏱️'}</span>
              <span>{isPunchedIn ? 'Punch Out' : 'Punch In'}</span>
              {isPunchedIn && activeWorkDuration && (
                <span className="hidden sm:inline-block font-mono text-[10px] bg-rose-200/60 text-rose-900 px-1.5 py-0.2 rounded-md ml-0.5">
                  {activeWorkDuration}
                </span>
              )}
            </button>

            {/* Quick New Customer Log */}
            <button
              type="button"
              onClick={onNewCustomerLog}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white shadow-2xs transition cursor-pointer"
            >
              <span>➕</span>
              <span className="hidden sm:inline">New Customer Log</span>
              <span className="sm:hidden">New Log</span>
            </button>

            {/* Sync Badge */}
            {pendingSyncCount > 0 ? (
              <button
                type="button"
                onClick={onForceClearSync}
                title="Click to reset stalled sync items"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Syncing ({pendingSyncCount}) ✕
              </button>
            ) : (
              <div className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Cloud Synced
              </div>
            )}

            {/* DB Config Trigger */}
            <button
              type="button"
              onClick={onOpenDbConfig}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition"
              title="Database Settings"
            >
              ⚡
            </button>

            <div className="h-5 w-px bg-slate-200" />

            {/* Operator Profile */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                SW
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-none">{operatorName}</div>
                <div className="text-[9px] text-slate-400 font-semibold">{role}</div>
              </div>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Logout"
                  className="text-[11px] text-slate-400 hover:text-rose-600 ml-1 transition"
                >
                  🚪
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TIER 2: SECOND ROW SUB-NAVIGATION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-11 overflow-x-auto no-scrollbar gap-1 py-1">
          {navigationTabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
