import React, { useState, useMemo } from 'react';
import { Agent } from '../types/agent';
import { CustomerLog } from '../types/ledger';
import { calculateAgentStats, calculateOverallAgentMetrics } from '../utils/agentUtils';

interface AgentsHubViewProps {
  agents: Agent[];
  logs: CustomerLog[];
  onAddAgent: (agent: Omit<Agent, 'id'>) => void;
  onEditAgent: (agent: Agent) => void;
  onDeleteAgent: (id: number | string) => void;
  onViewLedger: (agentName: string) => void;
}

export const AgentsHubView: React.FC<AgentsHubViewProps> = ({
  agents,
  logs,
  onAddAgent,
  onEditAgent,
  onDeleteAgent,
  onViewLedger
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'clear'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    centerName: '',
    mobile: '',
    village: '',
    notes: ''
  });

  const metrics = useMemo(() => {
    return calculateOverallAgentMetrics(agents, logs);
  }, [agents, logs]);

  const filteredAgents = useMemo(() => {
    return agents.filter((ag) => {
      const q = searchQuery.toLowerCase().trim();
      const textMatch =
        !q ||
        ag.name.toLowerCase().includes(q) ||
        (ag.centerName && ag.centerName.toLowerCase().includes(q)) ||
        ag.mobile.includes(q) ||
        (ag.village && ag.village.toLowerCase().includes(q));

      if (!textMatch) return false;

      const stats = calculateAgentStats(ag.id, logs);
      if (statusFilter === 'due') return stats.totalDue > 0;
      if (statusFilter === 'clear') return stats.totalDue === 0;
      return true;
    });
  }, [agents, logs, searchQuery, statusFilter]);

  const handleCreateAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.name.trim()) return;
    onAddAgent(newAgent);
    setNewAgent({ name: '', centerName: '', mobile: '', village: '', notes: '' });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Action */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-purple-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl border border-white/20">
              🤝
            </div>
            <div>
              <h2 className="text-lg font-bold">Agents & B2B Wholesale Hub</h2>
              <p className="text-xs text-purple-200 mt-0.5">
                गाव पातळीवरील भागीदार, सब-केंद्रे व एजंट्सचे काम, घाऊक बिलिंग व बाकी रकमेचे व्यवस्थापन
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <i className="fa-solid fa-plus text-xs"></i>
            <span>+ नवीन एजंट जोडा (+ Add Agent)</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Active Partners
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{metrics.activeAgentsCount}</div>
          <span className="text-[11px] font-medium text-purple-600 mt-0.5 block">सक्रिय एजंट नेटवर्क</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Agent Applications
          </span>
          <div className="text-2xl font-black text-indigo-700 mt-1">{metrics.totalApps}</div>
          <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">एजंट्सचे एकूण अर्ज</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Billed
          </span>
          <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
            ₹{metrics.totalBilled.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] font-medium text-emerald-600 mt-0.5 block">एकूण घाऊक व्यवसाय</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
            Outstanding Dues
          </span>
          <div className="text-2xl font-black text-rose-600 font-mono mt-1">
            ₹{metrics.totalDue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] font-medium text-rose-500 mt-0.5 block">एजंट्सकडून येणे बाकी</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-2.5 text-slate-400"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="एजंट, केंद्र किंवा गावाचे नाव शोधा..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            सर्व एजंट ({agents.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('due')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              statusFilter === 'due'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            बाकी असलेले
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('clear')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              statusFilter === 'clear'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            हिशोब पूर्ण
          </button>
        </div>
      </div>

      {/* Agents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredAgents.map((agent) => {
          const stats = calculateAgentStats(agent.id, logs);
          return (
            <div
              key={agent.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <span>{agent.name}</span>
                    </h3>
                    <div className="text-xs text-purple-700 font-semibold mt-0.5">
                      {agent.centerName || 'महा-ई-सेवा केंद्र'}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-full text-[10px]">
                    {agent.village || 'गाव'}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <i className="fa-solid fa-phone text-slate-400"></i>
                    <span className="font-mono">{agent.mobile}</span>
                  </span>
                  <a
                    href={`https://wa.me/91${agent.mobile.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 text-[11px]"
                  >
                    <i className="fa-brands fa-whatsapp text-emerald-500"></i> WhatsApp
                  </a>
                </div>
              </div>

              {/* Stats Box */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">एकूण अर्ज:</span>
                  <span className="font-bold font-mono text-slate-800">{stats.appCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">बिल आकारणी:</span>
                  <span className="font-bold font-mono text-slate-800">₹{stats.totalBilled}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">जमा रक्कम:</span>
                  <span className="font-bold font-mono text-emerald-700">₹{stats.totalPaid}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-700">बाकी रक्कम (Due):</span>
                  <span
                    className={`font-black font-mono text-sm ${
                      stats.totalDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    ₹{stats.totalDue}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onViewLedger(agent.name)}
                  className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  title="View Applications in Ledger"
                >
                  <i className="fa-solid fa-table-list text-xs"></i>
                  <span>अर्ज पहा</span>
                </button>
                <button
                  type="button"
                  onClick={() => onEditAgent(agent)}
                  className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs transition cursor-pointer"
                  title="Edit Agent"
                >
                  <i className="fa-solid fa-pen"></i>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteAgent(agent.id)}
                  className="px-2.5 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-lg text-xs transition cursor-pointer"
                  title="Delete Agent"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Agent Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="text-purple-600">🤝</span>
                <span>नवीन एजंट नोंद (Add New Agent)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <i className="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  एजंटचे पूर्ण नाव (Agent Name) *
                </label>
                <input
                  type="text"
                  required
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  placeholder="उदा. रामेश्वर शांताराम पाटील"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  दुकान / केंद्राचे नाव (Shop / Center Name)
                </label>
                <input
                  type="text"
                  value={newAgent.centerName}
                  onChange={(e) => setNewAgent({ ...newAgent, centerName: e.target.value })}
                  placeholder="उदा. पाटील महा-ई-सेवा केंद्र"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    मोबाईल नंबर (Mobile) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAgent.mobile}
                    onChange={(e) => setNewAgent({ ...newAgent, mobile: e.target.value })}
                    placeholder="१० अंकी क्रमांक"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    गाव / पत्ता (Village / Address) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAgent.village}
                    onChange={(e) => setNewAgent({ ...newAgent, village: e.target.value })}
                    placeholder="उदा. वीरगाव, ता. सटाणा"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  टीप / शेरा (Notes / Remarks)
                </label>
                <input
                  type="text"
                  value={newAgent.notes}
                  onChange={(e) => setNewAgent({ ...newAgent, notes: e.target.value })}
                  placeholder="उदा. नियमित पॅन कार्ड व दाखले काम"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  रद्द करा
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-lg shadow"
                >
                  सेव्ह करा (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
