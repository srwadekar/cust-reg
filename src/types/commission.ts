export type CommissionStage = 'STAGE_1_DOCS' | 'STAGE_2_SUBMIT' | 'FULL_COMPLETE';

export interface CommissionEntry {
  id: string;
  taskId: string;
  customerName: string;
  serviceName: string;
  stage: CommissionStage;
  stageLabel?: string;
  commissionAmount: number;
  date: string; // ISO YYYY-MM-DD
  time: string;
}

export interface DailyCommissionGroup {
  date: string;
  total: number;
  services: CommissionEntry[];
}

export interface AssociateCommissionMetrics {
  todayEarned: number;
  pendingPayout: number;
  totalAccumulated: number;
  paidAmount?: number;
  dailyGroups: DailyCommissionGroup[];
}

export interface OperatorCommissionProfile {
  username: string;
  name: string;
  role: string;
  accumulated_commission: number;
  paid_commission: number;
  pending_commission: number;
  base_salary_earned: number;
  base_salary_paid: number;
  base_salary_pending: number;
}

export interface CommissionTask {
  id?: string | number;
  logId?: string | number;
  appId?: string;
  customer_name?: string;
  customerName?: string;
  service_name?: string;
  serviceName?: string;
  form_name?: string;
  name?: string;
  doc_associate?: string;
  completedBy?: string;
  completed_by?: string;
  submit_associate?: string;
  dispatchedBy?: string;
  dispatched_by?: string;
  assigned_to?: string;
  assignedTo?: string;
  completed_at?: string | null;
  completedAt?: string | null;
  dispatched_at?: string | null;
  dispatchedAt?: string | null;
  split_commission?: boolean;
  work_rate?: number;
  dispatch_rate?: number;
  procCommission?: number;
  dispCommission?: number;
  proc_commission?: number;
  disp_commission?: number;
  rate?: number;
  commission_amount?: number;
  netMargin?: number;
  net_margin?: number;
  customerPrice?: number;
  customer_price?: number;
  challanFees?: number;
  challan_fees?: number;
  amount?: number;
  status?: string;
  physicalStatus?: string;
  physical_status?: string;
  date?: string;
  sIndex?: number;
}
