import React, { useState, useEffect } from 'react';
import { evaluateWorkingHours } from '../lib/attendanceEngine';
import { supabase } from '../lib/supabaseClient';

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
  const [activePunchIn, setActivePunchIn] = useState<string | null>(null);
  const [liveHours, setLiveHours] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch today's records
  const loadAttendance = async () => {
    try {
      const { data } = await supabase
        .from('cafe_attendance')
        .select('*')
        .eq('date', todayStr);

      if (data && data.length > 0) {
        setRecords(data);
        const myRecord = data.find((r: AttendanceRecord) => r.staff_name?.includes('Sagar') || r.staff_id === 'current_user' || r.staff_id === 'sagar_wadekar');
        if (myRecord && myRecord.punch_in && !myRecord.punch_out) {
          setActivePunchIn(myRecord.punch_in);
        } else {
          setActivePunchIn(null);
        }
      }
    } catch (err) {
      console.warn('[Attendance Load]:', err);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [todayStr]);

  // Live timer for active punch-in
  useEffect(() => {
    if (!activePunchIn) return;

    const interval = setInterval(() => {
      const evalData = evaluateWorkingHours(activePunchIn);
      setLiveHours(evalData.totalHours);
    }, 30000); // Check every 30 seconds

    const initial = evaluateWorkingHours(activePunchIn);
    setLiveHours(initial.totalHours);

    return () => clearInterval(interval);
  }, [activePunchIn]);

  // Handle Punch In
  const handlePunchIn = async () => {
    setLoading(true);
    const nowISO = new Date().toISOString();
    const newRecord: AttendanceRecord = {
      id: `att_${todayStr}_sagar`,
      staff_id: 'sagar_wadekar',
      staff_name: 'Sagar Wadekar',
      date: todayStr,
      punch_in: nowISO,
      punch_out: null,
      total_hours: 0,
      attendance_type: 'Absent',
      day_salary_multiplier: 0,
      base_daily_salary: 300,
    };

    setActivePunchIn(nowISO);
    setRecords((prev) => [newRecord, ...prev.filter((r) => r.id !== newRecord.id)]);

    try {
      await supabase.from('cafe_attendance').upsert(newRecord);
    } catch (e) {
      console.warn('cafe_attendance upsert error:', e);
    }
    try {
      await supabase.from('attendance').upsert(newRecord);
    } catch (e) {
      // ignore if attendance table not present
    }
    setLoading(false);
  };

  // Handle Punch Out
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

    setRecords((prev) =>
      prev.map((r) =>
        r.punch_in === activePunchIn
          ? { ...r, ...updatedData }
          : r
      )
    );

    setActivePunchIn(null);

    try {
      await supabase
        .from('cafe_attendance')
        .update(updatedData)
        .eq('date', todayStr)
        .eq('staff_id', 'sagar_wadekar');
    } catch (e) {
      console.warn('cafe_attendance update error:', e);
    }
    try {
      await supabase
        .from('attendance')
        .update(updatedData)
        .eq('date', todayStr)
        .eq('staff_id', 'sagar_wadekar');
    } catch (e) {
      // ignore if attendance table not present
    }

    setLoading(false);
  };

  const currentEval = activePunchIn ? evaluateWorkingHours(activePunchIn) : null;

  return (
    <div className="space-y-4 max-w-full">
      {/* 1. ATTENDANCE CRITERIA BANNER (MOBILE-OPTIMIZED) */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold tracking-tight">
              ⏱️ कामाच्या अचूक तासांवर आधारित हजेरी नियम
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
              फक्त लॉगिन करून हजेरी ग्राह्य धरली जाणार नाही. प्रत्यक्ष कामाच्या वेळेनुसार पगार मोजला जाईल.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!activePunchIn ? (
              <button
                type="button"
                onClick={handlePunchIn}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 font-black text-xs text-slate-950 rounded-xl transition shadow-xs cursor-pointer"
              >
                ⏱️ Punch In करा
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePunchOut}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-500 hover:bg-rose-600 font-black text-xs text-white rounded-xl transition shadow-xs cursor-pointer"
              >
                🛑 Punch Out & हजेरी नोंदवा
              </button>
            )}
          </div>
        </div>

        {/* Live Active Session Status */}
        {activePunchIn && currentEval && (
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>सध्याचे कामाचे तास: <strong className="font-mono text-emerald-300 text-sm">{liveHours} hrs</strong></span>
            </div>
            <div className="bg-white/10 px-3 py-1 rounded-lg text-[11px] font-semibold">
              सध्याची स्थिती: <strong className="text-amber-300">{currentEval.summaryMarathi}</strong>
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

      {/* 3. TODAY'S ATTENDANCE RECORDS TABLE (RESPONSIVE WRAPPER) */}
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
                <th className="py-2.5 px-4">पंच इन (वेळ)</th>
                <th className="py-2.5 px-4">पंच आऊट (वेळ)</th>
                <th className="py-2.5 px-4">एकूण तास</th>
                <th className="py-2.5 px-4">हजेरी स्थिती</th>
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
                  const inTime = r.punch_in ? new Date(r.punch_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
                  const outTime = r.punch_out ? new Date(r.punch_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (r.punch_in ? '🟢 चालू आहे' : '—');
                  const hours = Number(r.total_hours || 0);

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{r.staff_name}</td>
                      <td className="py-3 px-4 font-mono">{inTime}</td>
                      <td className="py-3 px-4 font-mono">{outTime}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{hours.toFixed(2)} hrs</td>
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
                          {r.attendance_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {r.day_salary_multiplier === 1 ? '१००% (Full)' : r.day_salary_multiplier === 0.5 ? '५०% (Half)' : '०% (None)'}
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
