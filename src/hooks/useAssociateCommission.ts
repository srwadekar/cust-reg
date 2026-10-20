import { useMemo } from 'react';
import { CommissionEntry, DailyCommissionGroup, AssociateCommissionMetrics, CommissionTask } from '../types/commission';
import { getTodayISODate, normalizeToISODate, extractTimestampParts } from '../utils/commissionUtils';
import { CommissionService } from '../services/commissionService';

export { CommissionEntry };

export const useAssociateCommission = (
  associateId: string,
  tasks: CommissionTask[] = [],
  paidCommissionAmount: number = 0,
  targetDate?: string
): AssociateCommissionMetrics => {
  const todayStr = targetDate || getTodayISODate();

  // 1. Extract only valid commission events for this associate with Date-Accurate Split Earnings
  const commissionLogs: CommissionEntry[] = useMemo(() => {
    const list: CommissionEntry[] = [];
    if (!associateId) return list;

    (tasks || []).forEach(task => {
      const taskId = String(task.id || task.logId || task.appId || 'task');
      const customerName = task.customerName || task.customer_name || 'Customer';
      const serviceName = task.serviceName || task.service_name || task.form_name || task.name || 'Service';

      // Check Work / Processing eligibility
      const isDocs =
        (task.completedBy === associateId ||
          task.completed_by === associateId ||
          task.doc_associate === associateId) &&
        task.status === 'Completed';

      // Check Dispatch eligibility
      const isDispatch =
        (task.dispatchedBy === associateId ||
          task.dispatched_by === associateId ||
          task.submit_associate === associateId) &&
        (task.physicalStatus === 'Despatched' ||
          task.physicalStatus === 'Come in Shop' ||
          task.physical_status === 'Despatched' ||
          task.physical_status === 'Come in Shop');

      // Check Full Complete eligibility (when not split into doc/dispatch)
      const isFullAssigned =
        (task.assignedTo === associateId || task.assigned_to === associateId) &&
        task.status === 'Completed' &&
        !task.split_commission &&
        task.procCommission === undefined &&
        task.dispCommission === undefined;

      // 1. STAGE 1 (Work / Submit Commission):
      // Credited strictly on the date the job was finished (completed_at / completedAt)
      if (isDocs) {
        const { date: workDate, time: workTime } = extractTimestampParts(
          task.completedAt || task.completed_at,
          task.date
        );

        const workComm = Number(
          task.procCommission !== undefined
            ? task.procCommission
            : task.proc_commission !== undefined
            ? task.proc_commission
            : task.work_rate !== undefined
            ? task.work_rate
            : 15
        );

        list.push({
          id: `${taskId}_${task.sIndex ?? 0}_doc`,
          taskId,
          customerName,
          serviceName,
          stage: 'STAGE_1_DOCS',
          stageLabel: 'कामाचे कमिशन (Work/Submit)',
          commissionAmount: Math.round(workComm * 100) / 100,
          date: workDate,
          time: workTime
        });
      }

      // 2. STAGE 2 (Dispatch Commission):
      // Strictly credited on the date the physical status was marked as Despatched (dispatched_at / dispatchedAt),
      // regardless of when the task was initially completed.
      // If an old task from last week is dispatched TODAY, its dispatch fee reflects in TODAY's earnings.
      if (isDispatch) {
        const { date: dispatchDate, time: dispatchTime } = extractTimestampParts(
          task.dispatchedAt || task.dispatched_at,
          todayStr // Fallback to todayStr so dispatching today instantly credits today
        );

        const dispComm = Number(
          task.dispCommission !== undefined
            ? task.dispCommission
            : task.disp_commission !== undefined
            ? task.disp_commission
            : task.dispatch_rate !== undefined
            ? task.dispatch_rate
            : 5
        );

        list.push({
          id: `${taskId}_${task.sIndex ?? 0}_disp`,
          taskId,
          customerName,
          serviceName,
          stage: 'STAGE_2_SUBMIT',
          stageLabel: 'डिस्पॅच कमिशन (Dispatch)',
          commissionAmount: Math.round(dispComm * 100) / 100,
          date: dispatchDate,
          time: dispatchTime
        });
      }

      // 3. FULL SERVICE COMPLETE (Fallback for legacy unsplit tasks)
      if (!isDocs && !isDispatch && isFullAssigned) {
        const { date: fullDate, time: fullTime } = extractTimestampParts(
          task.completedAt || task.completed_at,
          task.date
        );

        const fullComm = Number(
          task.commission_amount !== undefined
            ? task.commission_amount
            : task.rate !== undefined
            ? task.rate
            : 20
        );

        list.push({
          id: `${taskId}_${task.sIndex ?? 0}_full`,
          taskId,
          customerName,
          serviceName,
          stage: 'FULL_COMPLETE',
          stageLabel: 'पूर्ण काम (Full Service)',
          commissionAmount: Math.round(fullComm * 100) / 100,
          date: fullDate,
          time: fullTime
        });
      }
    });

    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [associateId, tasks, todayStr]);

  // 2. Metrics Calculation (Decoupled from Attendance Salary)
  const metrics = useMemo(() => {
    return CommissionService.calculateMetrics(commissionLogs, paidCommissionAmount, todayStr);
  }, [commissionLogs, paidCommissionAmount, todayStr]);

  return {
    todayEarned: metrics.todayEarned,
    pendingPayout: metrics.pendingPayout,
    totalAccumulated: metrics.totalAccumulated,
    paidAmount: paidCommissionAmount,
    dailyGroups: metrics.dailyGroups
  };
};

export default useAssociateCommission;
