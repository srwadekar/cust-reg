import { supabase } from './supabaseClient';
import { evaluateWorkingHours } from './attendanceEngine';

export const PUNCH_STORAGE_KEY = 'suravi_active_punch_session';

export interface PunchSession {
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  punchInISO: string;
}

// 1. Get stored active session from localStorage (Zero delay on reload)
export const getActiveLocalSession = (): PunchSession | null => {
  try {
    const raw = localStorage.getItem(PUNCH_STORAGE_KEY);
    if (!raw) return null;
    const session: PunchSession = JSON.parse(raw);
    const todayStr = new Date().toISOString().split('T')[0];
    if (session.date === todayStr) {
      return session;
    }
    localStorage.removeItem(PUNCH_STORAGE_KEY);
  } catch {
    localStorage.removeItem(PUNCH_STORAGE_KEY);
  }
  return null;
};

// 2. Save active session to localStorage (Instant reactive store)
export const saveActiveLocalSession = (session: PunchSession): void => {
  try {
    localStorage.setItem(PUNCH_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn('[punchManager] Failed to save session:', err);
  }
};

// 3. Clear active session on punch-out
export const clearActiveLocalSession = (): void => {
  try {
    localStorage.removeItem(PUNCH_STORAGE_KEY);
  } catch (err) {
    console.warn('[punchManager] Failed to clear session:', err);
  }
};

// 4. Format ISO to Indian Standard Time (hh:mm A)
export const formatISTTime = (isoString: string | null): string => {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return '—';
  }
};

// 5. Get formatted live timer details
export const getLiveTimerDetails = (punchInISO: string) => {
  const timeIST = formatISTTime(punchInISO);
  const evaluation = evaluateWorkingHours(punchInISO);
  const start = new Date(punchInISO).getTime();
  const diffMs = Math.max(0, Date.now() - start);
  const totalMins = Math.floor(diffMs / (1000 * 60));
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const durationText = `${hrs} hrs ${mins} min${mins === 1 ? '' : 's'}`;
  
  return {
    timeIST,
    durationText,
    totalHours: evaluation.totalHours,
    summaryMarathi: evaluation.summaryMarathi,
    bannerText: `चालू वेळ: ${timeIST} (${hrs} hrs ${mins} min)`,
  };
};

// 6. Asynchronous Cloud Sync for Punch In
export const syncPunchInToCloud = async (session: PunchSession, baseSalary: number = 300) => {
  const payload = {
    id: `att_${session.date}_${session.staffId}`,
    staff_id: session.staffId,
    staff_name: session.staffName,
    date: session.date,
    punch_in: session.punchInISO,
    punch_out: null,
    total_hours: 0.0,
    attendance_type: 'Absent',
    day_salary_multiplier: 0.0,
    base_daily_salary: baseSalary,
    auto_calculated: false,
  };

  try {
    await supabase.from('cafe_attendance').upsert(payload, { onConflict: 'id' });
  } catch (err) {
    console.warn('[punchManager] cafe_attendance punch-in error:', err);
  }

  try {
    await supabase.from('attendance_logs').upsert({
      id: payload.id,
      staff_id: session.staffId,
      date: session.date,
      status: 'Present',
      punch_in_time: formatISTTime(session.punchInISO),
      punch_out_time: null,
      punch_in_iso: session.punchInISO,
      punch_out_iso: null,
      total_hours: 0.0,
      attendance_type: 'Absent',
      day_salary_multiplier: 0.0,
      auto_calculated: false,
    }, { onConflict: 'staff_id,date' });
  } catch (err) {
    console.warn('[punchManager] attendance_logs punch-in error:', err);
  }
};

// 7. Asynchronous Cloud Sync for Punch Out
export const syncPunchOutToCloud = async (
  staffId: string,
  staffName: string,
  date: string,
  punchInISO: string,
  punchOutISO: string,
  baseSalary: number = 300
) => {
  const evaluation = evaluateWorkingHours(punchInISO, punchOutISO);
  const recId = `att_${date}_${staffId}`;

  const updatedData = {
    punch_out: punchOutISO,
    total_hours: evaluation.totalHours,
    attendance_type: evaluation.attendanceType,
    day_salary_multiplier: evaluation.salaryMultiplier,
    base_daily_salary: baseSalary,
  };

  try {
    await supabase
      .from('cafe_attendance')
      .update(updatedData)
      .eq('id', recId);
  } catch (err) {
    console.warn('[punchManager] cafe_attendance punch-out error:', err);
  }

  try {
    await supabase
      .from('attendance_logs')
      .update({
        punch_out_time: formatISTTime(punchOutISO),
        punch_out_iso: punchOutISO,
        total_hours: evaluation.totalHours,
        attendance_type: evaluation.attendanceType,
        day_salary_multiplier: evaluation.salaryMultiplier,
        status: evaluation.attendanceType === 'Absent' ? 'Absent' : 'Present',
      })
      .eq('staff_id', staffId)
      .eq('date', date);
  } catch (err) {
    console.warn('[punchManager] attendance_logs punch-out error:', err);
  }
};
