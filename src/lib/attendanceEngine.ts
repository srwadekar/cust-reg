export interface AttendanceEvaluation {
  totalHours: number;
  attendanceType: 'Full Day' | 'Half Day' | 'Absent';
  salaryMultiplier: number; // 1.0, 0.5, or 0.0
  summaryMarathi: string;
}

export const evaluateWorkingHours = (punchInISO: string, punchOutISO?: string | null): AttendanceEvaluation => {
  if (!punchInISO) {
    return { totalHours: 0, attendanceType: 'Absent', salaryMultiplier: 0, summaryMarathi: 'गैरहजर (पंचिंग नाही)' };
  }

  const start = new Date(punchInISO).getTime();
  const end = punchOutISO ? new Date(punchOutISO).getTime() : Date.now();
  const diffMs = Math.max(0, end - start);
  const totalHours = Number((diffMs / (1000 * 60 * 60)).toFixed(2));

  if (totalHours >= 4.0) {
    return {
      totalHours,
      attendanceType: 'Full Day',
      salaryMultiplier: 1.0,
      summaryMarathi: `पूर्ण दिवस (${totalHours} तास)`,
    };
  } else if (totalHours >= 2.0) {
    return {
      totalHours,
      attendanceType: 'Half Day',
      salaryMultiplier: 0.5,
      summaryMarathi: `अर्धा दिवस (${totalHours} तास)`,
    };
  } else {
    return {
      totalHours,
      attendanceType: 'Absent',
      salaryMultiplier: 0.0,
      summaryMarathi: `अमान्य - २ तासांपेक्षा कमी (${totalHours} तास)`,
    };
  }
};

export const formatActiveDuration = (punchInISO: string): string => {
  if (!punchInISO) return '0 hrs 0 mins';
  const start = new Date(punchInISO).getTime();
  const diffMs = Math.max(0, Date.now() - start);
  const totalMins = Math.floor(diffMs / (1000 * 60));
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return `${hrs} hrs ${mins} mins`;
};
