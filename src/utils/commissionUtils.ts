import { CommissionStage } from '../types/commission';

export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount || 0);
};

export const getTodayISODate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const normalizeToISODate = (dateStr?: string | null): string => {
  if (!dateStr) return getTodayISODate();
  const trimmed = String(dateStr).trim();

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }

  // If standard parseable date
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return trimmed;
};

export const formatDateDisplay = (isoDate: string): string => {
  if (!isoDate) return '';
  try {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, month, day);
      return dateObj.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    return isoDate;
  } catch {
    return isoDate;
  }
};

export const extractTimestampParts = (
  timestamp?: string | null,
  fallbackDate?: string
): { date: string; time: string } => {
  const defaultDate = fallbackDate ? normalizeToISODate(fallbackDate) : getTodayISODate();

  if (!timestamp) {
    return { date: defaultDate, time: '12:00' };
  }

  try {
    if (timestamp.includes('T')) {
      const [d, t] = timestamp.split('T');
      return {
        date: d || defaultDate,
        time: t ? t.substring(0, 5) : '12:00'
      };
    }
    const d = normalizeToISODate(timestamp);
    return { date: d, time: '12:00' };
  } catch {
    return { date: defaultDate, time: '12:00' };
  }
};

export const getStageBadge = (stage: CommissionStage) => {
  switch (stage) {
    case 'STAGE_1_DOCS':
      return {
        label: 'कामाचे कमिशन (Work/Submit)',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dotClass: 'bg-indigo-500',
        icon: 'fa-file-lines'
      };
    case 'STAGE_2_SUBMIT':
      return {
        label: 'डिस्पॅच कमिशन (Dispatch)',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        dotClass: 'bg-purple-500',
        icon: 'fa-paper-plane'
      };
    case 'FULL_COMPLETE':
      return {
        label: 'पूर्ण काम (Full Complete)',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotClass: 'bg-emerald-500',
        icon: 'fa-circle-check'
      };
    default:
      return {
        label: 'पूर्ण सेवा (Completed Service)',
        badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
        dotClass: 'bg-slate-500',
        icon: 'fa-check'
      };
  }
};
