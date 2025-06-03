// Shared attendance utilities for status, holiday, and record transformation
import { format } from 'date-fns';

export const GOVT_HOLIDAYS = [
  '2024-01-26', // Republic Day
  '2024-03-25', // Holi
  '2024-04-09', // Ram Navami
  '2024-05-01', // Labor Day
  '2024-08-15', // Independence Day
  '2024-10-02', // Gandhi Jayanti
  '2024-11-14', // Diwali
  '2024-12-25', // Christmas
  '2025-05-01', // Example: May Day
];

export function isHoliday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const day = date.getDay(); // 0=Sunday, 6=Saturday
  // Sundays
  if (day === 0) return true;
  // 2nd and 4th Saturdays
  if (day === 6) {
    const dayOfMonth = date.getDate();
    const weekOfMonth = Math.ceil(dayOfMonth / 7);
    if (weekOfMonth === 2 || weekOfMonth === 4) return true;
  }
  // Government holidays
  if (GOVT_HOLIDAYS.includes(dateStr)) return true;
  return false;
}

export function formatUtcTime(utcString: string | null): string | null {
  if (!utcString) return null;
  try {
    const date = new Date(utcString);
    let hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return null;
  }
}

export function calculateHoursUtc(punchInUtc: string | null, punchOutUtc: string | null): string {
  if (!punchInUtc || !punchOutUtc) return '0';
  try {
    const inDate = new Date(punchInUtc);
    const outDate = new Date(punchOutUtc);
    if (outDate < inDate) outDate.setUTCDate(outDate.getUTCDate() + 1);
    const diffMs = outDate.getTime() - inDate.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);
    if (isNaN(diffHrs) || diffHrs < 0) return '0';
    return diffHrs.toFixed(2);
  } catch {
    return '0';
  }
}

// Transform API attendance record to unified AttendanceRecord format
export function transformAttendanceRecord(record: any): any {
  const dateStr = (record.date as string).split('T')[0];
  let status = record.status as string;
  if (isHoliday(dateStr)) status = 'Holiday';
  return {
    ...record,
    date: dateStr,
    displayDate: format(new Date(record.date as string), 'EEE, MMM d, yyyy'),
    status,
    punchInTime: record.punchInTime ? formatUtcTime(record.punchInTime as string) : null,
    punchOutTime: record.punchOutTime ? formatUtcTime(record.punchOutTime as string) : null,
    punchInUtc: record.punchInTime as string || null,
    punchOutUtc: record.punchOutTime as string || null,
    isLate: record.isLate as boolean || false,
    remarks: record.remarks as string,
    totalHoursWorked: calculateHoursUtc(record.punchInTime as string, record.punchOutTime as string)
  };
} 