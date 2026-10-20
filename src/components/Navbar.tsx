import React from 'react';

export interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingSyncCount: number;
  activeServicesCount?: number;
  onOpenDbConfig: () => void;
  onForceClearSync: () => void;
  operatorName?: string;
  role?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  pendingSyncCount,
  onOpenDbConfig,
  onForceClearSync,
  operatorName = 'Sagar',
  role = 'Admin',
}) => {
  const tabs = [
    { id: 'ledger', label: 'Operations Ledger', icon: '📋' },
    { id: 'tasks', label: 'Task Dispatch', icon: '⚡' },
    { id: 'commissions', label: 'Commission & Payroll', icon: '💰' },
    { id: 'admin', label: 'Master Catalog & Admin', icon: '⚙️' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Live Indicators */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-800 flex items-center justify-center text-white font-black text-lg shadow-xs">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight">Suravi Cyber Cafe</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  Live System
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Nampur • Enterprise Management</p>
            </div>
          </div>

          {/* Navigation Pill Menu */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentTab === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>

          {/* System Status Controls & Profile */}
          <div className="flex items-center gap-2.5">
            {pendingSyncCount > 0 ? (
              <button
                onClick={onForceClearSync}
                title="Click to reset stalled sync items"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Syncing ({pendingSyncCount}) ✕
              </button>
            ) : (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Synced Cloud
              </div>
            )}

            <button
              onClick={onOpenDbConfig}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/80 transition cursor-pointer"
              title="Database Settings"
            >
              ⚡
            </button>

            <div className="h-6 w-px bg-slate-200 mx-0.5" />

            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                {operatorName.charAt(0)}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-none">{operatorName}</div>
                <div className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{role}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
