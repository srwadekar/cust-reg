import { CommissionEntry, OperatorCommissionProfile, DailyCommissionGroup } from '../types/commission';
import { getTodayISODate } from '../utils/commissionUtils';

export interface PaymentLog {
  id: string;
  staffId?: string;
  staff_id?: string;
  type: string;
  method?: string;
  amount: number;
  date: string;
  note?: string;
}

export class CommissionService {
  /**
   * Calculates isolated balances for an operator, strictly separating fixed attendance salary and service commission.
   */
  static getDecoupledOperatorProfile(
    operator: { username: string; name: string; role?: string },
    commissionEntries: CommissionEntry[],
    paymentLogs: PaymentLog[],
    baseSalaryEarned: number = 0
  ): OperatorCommissionProfile {
    try {
      const username = operator.username;

      // 1. Commission Balances (Strictly isolated from attendance salary)
      const accumulated_commission = commissionEntries.reduce((sum, item) => sum + item.commissionAmount, 0);

      const paid_commission = (paymentLogs || [])
        .filter(p => (p.staffId === username || p.staff_id === username) && p.type === 'Commission Payout')
        .reduce((sum, p) => sum + Number(p.amount || 0), 0);

      const pending_commission = Math.max(0, Math.round((accumulated_commission - paid_commission) * 100) / 100);

      // 2. Fixed Daily Attendance Salary Balances (Strictly isolated from commissions)
      const base_salary_paid = (paymentLogs || [])
        .filter(p => (p.staffId === username || p.staff_id === username) && p.type !== 'Commission Payout')
        .reduce((sum, p) => (p.type === 'Deduction' ? sum - Number(p.amount || 0) : sum + Number(p.amount || 0)), 0);

      const base_salary_pending = Math.max(0, Math.round((baseSalaryEarned - base_salary_paid) * 100) / 100);

      return {
        username,
        name: operator.name,
        role: operator.role || 'associate',
        accumulated_commission: Math.round(accumulated_commission * 100) / 100,
        paid_commission: Math.round(paid_commission * 100) / 100,
        pending_commission,
        base_salary_earned: Math.round(baseSalaryEarned * 100) / 100,
        base_salary_paid: Math.round(base_salary_paid * 100) / 100,
        base_salary_pending
      };
    } catch (error) {
      console.error('Error calculating decoupled operator profile:', error);
      return {
        username: operator.username,
        name: operator.name,
        role: operator.role || 'associate',
        accumulated_commission: 0,
        paid_commission: 0,
        pending_commission: 0,
        base_salary_earned: 0,
        base_salary_paid: 0,
        base_salary_pending: 0
      };
    }
  }

  /**
   * Groups commission entries by day for interactive daily drilldown cards.
   */
  static groupEntriesByDay(entries: CommissionEntry[]): DailyCommissionGroup[] {
    const map: Record<string, { total: number; services: CommissionEntry[] }> = {};

    (entries || []).forEach(entry => {
      if (!map[entry.date]) {
        map[entry.date] = { total: 0, services: [] };
      }
      map[entry.date].total += entry.commissionAmount;
      map[entry.date].services.push(entry);
    });

    return Object.entries(map)
      .map(([date, data]) => ({
        date,
        total: Math.round(data.total * 100) / 100,
        services: data.services
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  /**
   * Calculates isolated totals for an associate: totalAccumulated, todayEarned, pendingPayout
   */
  static calculateMetrics(
    entries: CommissionEntry[],
    paidAmount: number = 0,
    todayStr: string = getTodayISODate()
  ) {
    const totalAccumulated = Math.round(entries.reduce((sum, e) => sum + e.commissionAmount, 0) * 100) / 100;
    const todayEarned = Math.round(
      entries.filter(e => e.date === todayStr).reduce((sum, e) => sum + e.commissionAmount, 0) * 100
    ) / 100;
    const pendingPayout = Math.max(0, Math.round((totalAccumulated - paidAmount) * 100) / 100);

    return {
      totalAccumulated,
      todayEarned,
      pendingPayout,
      dailyGroups: this.groupEntriesByDay(entries)
    };
  }

  /**
   * Formats payload for recording isolated commission payouts.
   */
  static createCommissionPayoutPayload(
    staffId: string,
    amount: number,
    date: string = getTodayISODate(),
    method: string = 'Cash',
    note: string = 'Service Commission Payout'
  ) {
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(Date.now()).slice(-4);
    const randSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    const id = `VCH-${datePrefix}-${seq}-${randSuffix}`;

    return {
      id,
      staff_id: staffId,
      type: 'Commission Payout',
      method,
      amount: Number(amount),
      date,
      note
    };
  }
}
