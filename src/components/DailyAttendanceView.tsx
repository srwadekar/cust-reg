import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  getActiveLocalSession,
  saveActiveLocalSession,
  clearActiveLocalSession,
  formatISTTime,
  formatDurationDisplay,
  getLiveTimerDetails,
  syncPunchInToCloud,
  syncPunchOutToCloud,
  PunchSession,
} from '../lib/punchManager';
import { evaluateWorkingHours } from '../lib/attendanceEngine';

export interface AttendanceRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  date: string;
  punch_in: string | null;
  punch_out: string | null;
  total_hours: number;
  attendance_type: 'Full Day' | 'Half Day' | 'Absent';
  day_salary_multiplier: number;
  base_daily_salary?: number;
}

export const DailyAttendanceView: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [activePunchIn, setActivePunchIn] = useState<string | null>(() => {
    const local = getActiveLocalSession();
    return local ? local.punchInISO : null;
  });
  const [liveHours, setLiveHours] = useState<number>(0);
  const [timerBanner, setTimerBanner] = useState<string>('');
  const [liveSummary, setLiveSummary] = useState<string>('गणना चालू आहे');
  const [loading, setLoading] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch today's records from cloud
  const loadAttendance = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cafe_attendance')
        .select('*')
        .eq('date', todayStr);

      if (!error && data && data.length > 0) {
        setRecords(data);
        const myRecord = data.find(
          (r: AttendanceRecord) =>
            r.staff_name?.includes('Sagar') ||
            r.staff_id === 'current_user' ||
            r.staff_id === 'sagar_wadekar' ||
            r.staff_id === 'sagar'
        );
        if (myRecord && myRecord.punch_in && !myRecord.punch_out) {
          setActivePunchIn(myRecord.punch_in);
          saveActiveLocalSession({
            staffId: myRecord.staff_id || 'sagar_wadekar',
            staffName: myRecord.staff_name || 'Sagar Wadekar',
            date: todayStr,
            punchInISO: myRecord.punch_in,
          });
        } else if (myRecord && myRecord.punch_out) {
          setActivePunchIn(null);
          clearActiveLocalSession();
        }
      }
    } catch (err) {
      console.warn('[Attendance Load]:', err);
    }
  }, [todayStr]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // Live timer for active punch-in (1-second tick)
  useEffect(() => {
    if (!activePunchIn) {
      setLiveHours(0);
      setTimerBanner('');
      setLiveSummary('');
      return;
    }

    const updateTimer = () => {
      const details = getLiveTimerDetails(activePunchIn);
      setLiveHours(details.totalHours);
      setTimerBanner(details.bannerText);
      setLiveSummary(details.summaryMarathi);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activePunchIn]);

  // Handle Instant Optimistic Punch In
  const handlePunchIn = async () => {
    setLoading(true);
    const nowISO = new Date().toISOString();
    const session: PunchSession = {
      staffId: 'sagar_wadekar',
      staffName: 'Sagar Wadekar',
      date: todayStr,
      punchInISO: nowISO,
    };

    // 1. Instant local persistence and reactive UI switch (< 5ms)
    saveActiveLocalSession(session);
    setActivePunchIn(nowISO);

    const newRecord: AttendanceRecord = {
      id: `att_${todayStr}_sagar_wadekar`,
      staff_id: session.staffId,
      staff_name: session.staffName,
      date: todayStr,
      punch_in: nowISO,
      punch_out: null,
      total_hours: 0,
      attendance_type: 'Absent',
      day_salary_multiplier: 0,
      base_daily_salary: 300,
    };

    setRecords((prev) => [newRecord, ...prev.filter((r) => r.staff_id !== session.staffId || r.date !== todayStr)]);

    // 2. Non-blocking asynchronous cloud sync
    syncPunchInToCloud(session, 300).catch((err) => console.warn('[Attendance syncPunchIn err]:', err));
    setLoading(false);
  };

  // Handle Instant Optimistic Punch Out
  const handlePunchOut = async () => {
    if (!activePunchIn) return;
    setLoading(true);

    const nowISO = new Date().toISOString();
    const evaluation = evaluateWorkingHours(activePunchIn, nowISO);

    const updatedData = {
      punch_out: nowISO,
      total_hours: evaluation.totalHours,
      attendance_type: evaluation.attendanceType,
      day_salary_multiplier: evaluation.salaryMultiplier,
    };

    // 1. Instant UI update & storage clear
    setRecords((prev) =>
      prev.map((r) =>
        r.punch_in === activePunchIn || (r.staff_id === 'sagar_wadekar' && !r.punch_out)
          ? { ...r, ...updatedData }
          : r
      )
    );

    const savedPunchIn = activePunchIn;
    setActivePunchIn(null);
    clearActiveLocalSession();

    // 2. Non-blocking asynchronous cloud sync
    syncPunchOutToCloud('sagar_wadekar', 'Sagar Wadekar', todayStr, savedPunchIn, nowISO, 300).catch((err) =>
      console.warn('[Attendance syncPunchOut err]:', err)
    );
    setLoading(false);
  };

  return (
    <div className="space-y-4 max-w-full">
      {/* 1. ATTENDANCE CRITERIA BANNER (MOBILE-OPTIMIZED) */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
              ⏱️ कामाच्या अचूक तासांवर आधारित हजेरी नियम (Instant Punch Engine)
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
              फक्त लॉगिन करून हजेरी ग्राह्य धरली जाणार नाही. प्रत्यक्ष कामाच्या वेळेनुसार (Duration) पगार मोजला जाईल.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!activePunchIn ? (
              <button
                type="button"
                onClick={handlePunchIn}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-black text-xs text-slate-950 rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>⏱️</span>
                <span>Punch In करा</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePunchOut}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-500 hover:bg-rose-600 font-black text-xs text-white rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <span>🛑</span>
                <span>Punch Out & हजेरी नोंदवा</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Active Session Status (Instant Live Banner) */}
        {activePunchIn && (
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-emerald-300">{timerBanner || 'चालू वेळ गणना होत आहे...'}</span>
              <span className="text-slate-400 font-mono text-[11px]">({liveHours} hrs)</span>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-lg text-[11px] font-semibold">
              सध्याची स्थिती: <strong className="text-amber-300">{liveSummary}</strong>
            </div>
          </div>
        )}
      </div>

      {/* 2. CRITERIA SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/20 shadow-2xs">
          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">४ तासांपेक्षा जास्त</div>
          <div className="text-lg font-black text-emerald-700 mt-0.5">Full Day (पूर्ण पगार)</div>
          <div className="text-[10px] text-slate-400 mt-0.5">&gt; 4.0 तास लॉग इन (100% दैनिक वेतन)</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-sky-200/80 bg-sky-50/20 shadow-2xs">
          <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">२ ते ४ तास</div>
          <div className="text-lg font-black text-sky-700 mt-0.5">Half Day (अर्धा पगार)</div>
          <div className="text-[10px] text-slate-400 mt-0.5">२.० ते ४.० तास (५०% दैनिक वेतन)</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/20 shadow-2xs">
          <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">२ तासांपेक्षा कमी</div>
          <div className="text-lg font-black text-rose-700 mt-0.5">Absent (शून्य पगार)</div>
          <div className="text-[10px] text-slate-400 mt-0.5">&lt; २.० तास (केवळ लॉगिन केल्यास हजेरी नाही)</div>
        </div>
      </div>

      {/* 3. TODAY'S ATTENDANCE RECORDS TABLE (IST TIME FORMATTED) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">आजचा हजेरी तक्ता (Staff Logs)</h4>
          <span className="text-[10px] font-mono text-slate-400">{todayStr}</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200/60">
              <tr>
                <th className="py-2.5 px-4">कर्मचारी</th>
                <th className="py-2.5 px-4">पंच-इन वेळ (Punch-In Time)</th>
                <th className="py-2.5 px-4">पंच-आऊट वेळ (Punch-Out Time)</th>
                <th className="py-2.5 px-4">कामाचे तास (Duration)</th>
                <th className="py-2.5 px-4">हजेरी स्थिती व पगार (Status & Wage)</th>
                <th className="py-2.5 px-4">पगार गणना</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                    आज अजून कोणाचीही हजेरी नोंद झालेली नाही.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const inTime = formatISTTime(r.punch_in);
                  const outTime = r.punch_out
                    ? formatISTTime(r.punch_out)
                    : r.punch_in
                    ? '🟢 काम चालू आहे'
                    : '—';
                  const durationDisplay = formatDurationDisplay(r.punch_in, r.punch_out);
                  const wageStatusText =
                    r.attendance_type === 'Full Day' || r.day_salary_multiplier === 1
                      ? 'Full Day (100%)'
                      : r.attendance_type === 'Half Day' || r.day_salary_multiplier === 0.5
                      ? 'Half Day (50%)'
                      : 'Absent (0%)';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{r.staff_name}</td>
                      <td className="py-3 px-4 font-mono font-semibold">{inTime}</td>
                      <td className="py-3 px-4 font-mono font-semibold">{outTime}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{durationDisplay}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            r.attendance_type === 'Full Day'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : r.attendance_type === 'Half Day'
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          {wageStatusText}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {r.day_salary_multiplier === 1
                          ? '१००% (Full Day)'
                          : r.day_salary_multiplier === 0.5
                          ? '५०% (Half Day)'
                          : '०% (Absent / None)'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyAttendanceView;
