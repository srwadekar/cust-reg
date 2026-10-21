import { Agent, AgentStats, AppTypeDualPrice } from '../types/agent';
import { CustomerLog } from '../types/ledger';

/**
 * Calculates net margin for direct or wholesale agent service
 * Formula: Service Fee (Customer Fee or Agent Fee) - Govt Challan Fee
 */
export const calculateNetMargin = (fee: number, challanFees: number = 0): number => {
  const cleanFee = Number(fee || 0);
  const cleanChallan = Number(challanFees || 0);
  return Math.max(0, cleanFee - cleanChallan);
};

/**
 * Resolves the service rate based on client type:
 * - Direct customer: defaultAmount (full retail)
 * - Agent work: defaultAgentAmount (wholesale discounted fee), fallback to defaultAmount
 */
export const getServiceRate = (
  service: AppTypeDualPrice,
  clientType: 'direct' | 'agent' = 'direct'
): number => {
  if (clientType === 'agent') {
    const agentRate = service.defaultAgentAmount !== undefined && service.defaultAgentAmount !== null
      ? Number(service.defaultAgentAmount)
      : Number(service.default_agent_amount || 0);
    if (agentRate > 0) return agentRate;
  }
  return service.defaultAmount !== undefined && service.defaultAmount !== null
    ? Number(service.defaultAmount)
    : Number(service.default_amount || 0);
};

/**
 * Calculates aggregated volume, billed amount, paid amount, and outstanding dues for a specific agent.
 */
export const calculateAgentStats = (
  agentId: number | string,
  logs: CustomerLog[] = []
): AgentStats => {
  const agentLogs = logs.filter(
    (log) =>
      log.clientType === 'agent' ||
      log.client_type === 'agent' ||
      String(log.agentId) === String(agentId) ||
      String(log.agent_id) === String(agentId)
  );

  const appCount = agentLogs.length;
  const totalBilled = agentLogs.reduce((sum, log) => sum + Number(log.total_amount || 0), 0);
  
  const totalPaid = agentLogs.reduce((sum, log) => {
    const directPaid = Number(log.paid_amount || 0);
    const histPaid = (log.payment_history || []).reduce(
      (hSum, p) => hSum + Number(p.amount || 0),
      0
    );
    return sum + directPaid + histPaid;
  }, 0);

  const totalDue = Math.max(0, totalBilled - totalPaid);
  const completedCount = agentLogs.filter((log) => log.status === 'Completed').length;
  const pendingCount = agentLogs.filter((log) => log.status !== 'Completed').length;

  return {
    agentId,
    appCount,
    totalBilled,
    totalPaid,
    totalDue,
    completedCount,
    pendingCount
  };
};

/**
 * Calculates high-level metrics across all active agents
 */
export const calculateOverallAgentMetrics = (
  agents: Agent[] = [],
  logs: CustomerLog[] = []
) => {
  const agentLogs = logs.filter(
    (log) => log.clientType === 'agent' || log.client_type === 'agent'
  );

  const totalApps = agentLogs.length;
  const totalBilled = agentLogs.reduce((sum, log) => sum + Number(log.total_amount || 0), 0);
  
  const totalPaid = agentLogs.reduce((sum, log) => {
    const directPaid = Number(log.paid_amount || 0);
    const histPaid = (log.payment_history || []).reduce(
      (hSum, p) => hSum + Number(p.amount || 0),
      0
    );
    return sum + directPaid + histPaid;
  }, 0);

  const totalDue = Math.max(0, totalBilled - totalPaid);

  return {
    activeAgentsCount: agents.length,
    totalApps,
    totalBilled,
    totalPaid,
    totalDue
  };
};
