export type ServiceProcessStatus = 'Pending' | 'In Process' | 'Completed';
export type PhysicalDeliveryStatus = 'In Shop' | 'Despatched';

export interface CustomerServiceItem {
  id: string | number;
  service_name: string;
  name?: string;
  customer_fee: number;
  customerPrice?: number;
  challan_fees?: number;
  challanFees?: number;
  net_margin?: number;
  netMargin?: number;
  proc_status: ServiceProcessStatus;
  status?: string;
  physical_status: PhysicalDeliveryStatus;
  physicalStatus?: string;
  assigned_to?: string;
  assignedTo?: string;
  completed_by?: string;
  completedBy?: string;
  completed_at?: string;
  completedAt?: string;
  dispatched_by?: string;
  dispatchedBy?: string;
  dispatched_at?: string;
  dispatchedAt?: string;
  proc_commission?: number;
  procCommission?: number;
  disp_commission?: number;
  dispCommission?: number;
  agent_price?: number;
  agentPrice?: number;
}

export interface CustomerFormAgentBatchRow {
  customerName: string;
  mobileNo: string;
  username?: string;
  password?: string;
  serviceName: string;
  agentFee: number;
  challan: number;
  netMargin: number;
}

export interface CustomerLog {
  id: number | string;
  app_id: string;
  customer_name: string;
  mobile_no?: string;
  address?: string;
  application_type?: string;
  client_type?: 'direct' | 'agent' | 'customer';
  clientType?: 'direct' | 'agent' | 'customer';
  agent_id?: number | string | null;
  agentId?: number | string | null;
  agent_name?: string | null;
  agentName?: string | null;
  services: CustomerServiceItem[];
  username?: string;
  password?: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  payment_date?: string;
  payment_history?: Array<{
    amount: number;
    date: string;
    method?: string;
    note?: string;
  }>;
  notes?: string;
  date: string;
  created_by?: string;
  created_at?: string;
  dispatched_at?: string;
}
