'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AttendanceReport from '../components/AttendanceReport';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { getEmployeeId, isAuthenticated } from '@/services/auth';

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  projectName: string;
  designation: string;
  date: string;
  punchInTime: string;
  punchOutTime: string;
  punchInPhoto: string;
}

const AttendancePage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchAttendanceData();
  }, [selectedMonth, selectedYear, router]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const employeeId = getEmployeeId();
      if (!employeeId) {
        throw new Error('Employee ID not found. Please login again.');
      }
      const response = await fetch(
        `https://cafm.zenapi.co.in/api/attendance/report/monthly/employee?employeeId=${employeeId}&month=${selectedMonth}&year=${selectedYear}`
      );
      const data = await response.json();
      
      if (data.attendance) {
        setAttendanceData(data.attendance);
      } else {
        setAttendanceData([]);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
  };

  const handleViewRecord = (record: AttendanceRecord) => {
    // Implement view record functionality
    console.log('Viewing record:', record);
  };

  const handleBack = () => {
    router.back();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  };

  return (
    <DashboardLayout>
      <AttendanceReport
        loading={loading}
        attendanceData={attendanceData}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        handleMonthChange={handleMonthChange}
        handleYearChange={handleYearChange}
        handleViewRecord={handleViewRecord}
        handleBack={handleBack}
        fetchReportData={fetchAttendanceData}
        formatDate={formatDate}
        formatTime={formatTime}
      />
    </DashboardLayout>
  );
};

export default AttendancePage; 