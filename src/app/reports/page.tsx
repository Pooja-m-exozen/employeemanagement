'use client'
import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaCalendarAlt, FaSearch, FaDownload, FaEye, FaFilter, FaArrowLeft, FaFileExcel, FaCalendar } from 'react-icons/fa';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useRouter, useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';

interface LeaveBalance {
  EL: number;
  CL: number;
  SL: number;
  CompOff: number;
}

interface LeaveHistory {
  leaveId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  isHalfDay: boolean;
  halfDayType: string | null;
  status: string;
  reason: string;
  emergencyContact: string;
  attachments: any[];
  appliedOn: string;
  lastUpdated: string;
  cancellationReason?: string;
}

interface LeaveReport {
  employeeId: string;
  employeeName: string;
  totalLeaves: number;
  leaveBalances: LeaveBalance;
  leaveHistory: LeaveHistory[];
}

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  projectName?: string;
  designation?: string;
  date: string;
  punchInTime?: string;
  punchInPhoto?: string;
  punchInLatitude?: number;
  punchInLongitude?: number;
  punchOutTime?: string;
  punchOutPhoto?: string;
  punchOutLatitude?: number;
  punchOutLongitude?: number;
  status: string;
}

interface AttendanceReport {
  message: string;
  attendance: AttendanceRecord[];
}

export default function ReportsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to leave report by default
    router.push('/reports/leave');
  }, [router]);

  return null;
} 