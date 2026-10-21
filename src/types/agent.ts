export interface Agent {
  id: number | string;
  name: string;
  center_name?: string;
  centerName?: string;
  mobile: string;
  village: string;
  notes?: string;
  created_at?: string;
  createdAt?: string;
}

export interface AgentStats {
  agentId: number | string;
  appCount: number;
  totalBilled: number;
  totalPaid: number;
  totalDue: number;
  completedCount: number;
  pendingCount: number;
}

export interface AppTypeDualPrice {
  id: number;
  name: string;
  default_amount: number;
  defaultAmount?: number;
  default_agent_amount: number;
  defaultAgentAmount?: number;
  default_challan: number;
  defaultChallan?: number;
}

export interface AgentBatchCustomerRow {
  customerName: string;
  mobileNo: string;
  serviceName: string;
  agentPrice: number | string;
  challanFees: number | string;
  netMargin: number | string;
  paidAmount: number | string;
}

export interface AgentBatchForm {
  agentId: number | string;
  agentName: string;
  date: string;
  isCreatingInlineAgent: boolean;
  inlineAgent: {
    name: string;
    centerName: string;
    mobile: string;
    village: string;
    notes?: string;
  };
  rows: AgentBatchCustomerRow[];
}

