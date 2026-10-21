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
 * Calculates auto 20% discounted agent rate from customer retail price
 * Formula: Math.round(custPrice * 0.8)
 */
export const calculateAutoAgentDiscount = (custPrice: number): number => {
  return Math.round(Number(custPrice || 0) * 0.8);
};

/**
 * Resolves the service rate based on client type:
 * - Direct customer: defaultAmount (full retail)
 * - Agent work: defaultAgentAmount (wholesale discounted fee), fallback to 20% auto discount of defaultAmount
 */
export const getServiceRate = (
  service: AppTypeDualPrice,
  clientType: 'direct' | 'agent' = 'direct'
): number => {
  const retail = service.defaultAmount !== undefined && service.defaultAmount !== null
    ? Number(service.defaultAmount)
    : Number(service.default_amount || 0);

  if (clientType === 'agent') {
    const agentRate = service.defaultAgentAmount !== undefined && service.defaultAgentAmount !== null
      ? Number(service.defaultAgentAmount)
      : Number(service.default_agent_amount || 0);
    if (agentRate > 0) return agentRate;
    // Auto 20% discount rule fallback when agent rate is not explicitly stored
    if (retail > 0) return calculateAutoAgentDiscount(retail);
  }
  return retail;
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

/**
 * Calculates live summary of batch customer ingestion rows
 */
export const calculateBatchSummary = (rows: Array<{ agentPrice: number | string; challanFees: number | string; paidAmount: number | string; customerName?: string }>) => {
  const validRows = rows.filter(r => (r.customerName || '').trim().length > 0);
  const totalBilling = validRows.reduce((sum, r) => sum + Number(r.agentPrice || 0), 0);
  const totalChallan = validRows.reduce((sum, r) => sum + Number(r.challanFees || 0), 0);
  const totalMargin = validRows.reduce((sum, r) => sum + Math.max(0, Number(r.agentPrice || 0) - Number(r.challanFees || 0)), 0);
  const totalPaid = validRows.reduce((sum, r) => sum + Number(r.paidAmount || 0), 0);
  const totalDue = Math.max(0, totalBilling - totalPaid);

  return {
    validCount: validRows.length,
    totalBilling,
    totalChallan,
    totalMargin,
    totalPaid,
    totalDue
  };
};

/**
 * Formats agent customer logs into structured rows for Excel export
 */
export const prepareAgentExcelRows = (
  logs: CustomerLog[] = [],
  agents: Agent[] = [],
  targetAgentId?: number | string
) => {
  let targetLogs = logs.filter(
    (l) => l.clientType === 'agent' || l.client_type === 'agent' || Boolean(l.agentId || l.agent_id)
  );

  let agObj: Agent | undefined;
  if (targetAgentId) {
    agObj = agents.find((a) => String(a.id) === String(targetAgentId));
    targetLogs = targetLogs.filter((l) => String(l.agentId || l.agent_id) === String(targetAgentId));
  }

  const excelRows: any[] = [];
  targetLogs.forEach((log) => {
    const ag = agObj || agents.find((a) => String(a.id) === String(log.agentId || log.agent_id));
    const shopOrVillage = ag?.centerName ? `${ag.centerName} (${ag.village || ''})` : (ag?.village || log.address || '');
    const directPaid = Number(log.paid_amount || log.paidAmount || 0);
    const histPaid = (log.payment_history || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalPaid = directPaid + histPaid;
    const totalDue = Math.max(0, Number(log.total_amount || log.totalAmount || 0) - totalPaid);

    if (log.services && log.services.length > 0) {
      log.services.forEach((s) => {
        const wholesaleRate = Number(s.agentPrice !== undefined && s.agentPrice !== null ? s.agentPrice : (s.customerPrice || s.amount || 0));
        const challan = Number(s.challanFees || 0);
        const margin = s.netMargin !== undefined ? Number(s.netMargin) : Math.max(0, wholesaleRate - challan);
        excelRows.push({
          "App ID": log.app_id || log.appId,
          "Date": log.date,
          "Agent Name": log.agentName || log.agent_name || ag?.name || 'Agent',
          "Shop/Village": shopOrVillage,
          "Customer Name": log.customer_name || log.customerName,
          "Mobile": log.mobile_no || log.mobileNo || '',
          "Service Name": s.name || log.application_type || log.applicationType || '',
          "Agent Wholesale Rate": wholesaleRate,
          "Govt Challan": challan,
          "Net Margin": margin,
          "Paid Amount": totalPaid,
          "Due Amount": totalDue,
          "Processing Status": s.status || log.status || 'In Process',
          "Physical Delivery": s.physicalStatus || 'Pending'
        });
      });
    } else {
      excelRows.push({
        "App ID": log.app_id || log.appId,
        "Date": log.date,
        "Agent Name": log.agentName || log.agent_name || ag?.name || 'Agent',
        "Shop/Village": shopOrVillage,
        "Customer Name": log.customer_name || log.customerName,
        "Mobile": log.mobile_no || log.mobileNo || '',
        "Service Name": log.application_type || log.applicationType || 'General Service',
        "Agent Wholesale Rate": Number(log.total_amount || log.totalAmount || 0),
        "Govt Challan": 0,
        "Net Margin": Number(log.total_amount || log.totalAmount || 0),
        "Paid Amount": totalPaid,
        "Due Amount": totalDue,
        "Processing Status": log.status || 'In Process',
        "Physical Delivery": 'Pending'
      });
    }
  });

  return excelRows;
};

