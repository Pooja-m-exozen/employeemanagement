import React, { useState, useEffect } from 'react';
import { FaFileExcel, FaFilePdf, FaCalendar, FaChevronLeft, FaCalendarAlt, FaCheckCircle, FaTimesCircle, FaPercentage } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Image from 'next/image';
import { isHoliday, formatUtcTime, calculateHoursUtc, transformAttendanceRecord } from '../../utils/attendanceUtils';

interface AttendanceRecord {
  _id: string;
  employeeId: string;
  projectName: string;
  designation: string;
  date: string;
  punchInTime: string;
  punchOutTime: string;
  punchInPhoto: string;
  punchInLatitude?: number;
  punchInLongitude?: number;
  status?: string;
}

interface LeaveBalance {
  EL: number;
  CL: number;
  SL: number;
  CompOff: number;
}

interface LeaveRecord {
  leaveId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  status: string;
  reason: string;
}

interface AttendanceReportProps {
  loading: boolean;
  attendanceData: AttendanceRecord[];
  selectedMonth: number;
  selectedYear: number;
  handleMonthChange: (month: number) => void;
  handleYearChange: (year: number) => void;
  handleViewRecord: (record: AttendanceRecord) => void;
  handleBack: () => void;
  fetchReportData: () => Promise<void>;
  formatDate: (dateString: string) => string;
  employeeId: string;
}

const AttendanceReport: React.FC<AttendanceReportProps> = ({
  loading,
  attendanceData,
  selectedMonth,
  selectedYear,
  handleMonthChange,
  handleYearChange,
  handleBack,
  formatDate,
  employeeId,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Add government holidays (you can modify this list as needed)
  const governmentHolidays = [
    '2024-01-26', // Republic Day
    '2024-03-25', // Holi
    '2024-04-09', // Ram Navami
    '2024-05-01', // Labor Day
    '2024-08-15', // Independence Day
    '2024-10-02', // Gandhi Jayanti
    '2024-11-14', // Diwali
    '2024-12-25', // Christmas
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + 2 - i);

  const isWeekend = (date: string) => {
    const day = new Date(date).getDay();
    return day === 0; // Only Sunday is weekend
  };

  // Helper to get all second and fourth Saturdays for a given month/year
  const getSecondAndFourthSaturdays = (year: number, month: number) => {
    const saturdays: string[] = [];
    let count = 0;
    for (let day = 1; day <= 31; day++) {
      const date = new Date(year, month - 1, day);
      if (date.getMonth() !== month - 1) break;
      if (date.getDay() === 6) { // Saturday
        count++;
        if (count === 2 || count === 4) {
          saturdays.push(date.toISOString().split('T')[0]);
        }
      }
    }
    return saturdays;
  };

  const isSecondOrFourthSaturday = (date: string, year: number, month: number) => {
    const dateStr = date.split('T')[0];
    const secondFourthSaturdays = getSecondAndFourthSaturdays(year, month);
    return secondFourthSaturdays.includes(dateStr);
  };

  const isSunday = (date: string) => {
    return new Date(date).getDay() === 0;
  };

  const isHoliday = (date: string) => {
    const dateStr = date.split('T')[0];
    return governmentHolidays.includes(dateStr);
  };

  const getDayStatus = (date: string, year: number, month: number) => {
    if (isHoliday(date)) return 'Holiday';
    if (isSunday(date)) return 'Holiday';
    if (isSecondOrFourthSaturday(date, year, month)) return 'Holiday';
    return 'Working Day';
  };

  const getAttendanceStatus = (record: AttendanceRecord | undefined, dayStatus: string) => {
    if (dayStatus === 'Holiday') {
      return 'Holiday';
    }
    if (!record) {
      return 'Absent';
    }
    if (record.status) {
      return record.status;
    }
    if (record.punchInTime && record.punchOutTime) {
      return 'Present';
    }
    if (record.punchInTime && !record.punchOutTime) {
      return 'Half Day';
    }
    return 'Absent';
  };

  // Helper to get status code for PDF/calendar
  const getStatusCode = (record: AttendanceRecord | undefined, dayStatus: string) => {
    if (dayStatus === 'Holiday') return 'H';
    if (!record) return 'A';
    if (record.status === 'Present' || (record.punchInTime && record.punchOutTime)) return 'P';
    if (record.punchInTime && !record.punchOutTime) return 'P'; // Treat half day as present for code
    return 'A';
  };

  // Transform attendanceData using the shared logic
  const processedAttendanceData = attendanceData.map(transformAttendanceRecord);

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      attendanceData.map(record => ({
        Date: formatDate(record.date),
        'Project Name': record.projectName,
        Designation: record.designation,
        'Check In': formatTime(record.punchInTime),
        'Check Out': formatTime(record.punchOutTime),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
    XLSX.writeFile(workbook, `attendance_report_${selectedMonth}_${selectedYear}.xlsx`);
  };

  const getDayType = (date: string, year: number, month: number) => {
    const dateStr = date.split('T')[0];
    if (governmentHolidays.includes(dateStr)) {
      // Map specific holidays to their names
      const holidayMap: { [key: string]: string } = {
        '2024-01-26': 'Republic Day',
        '2024-03-25': 'Holi',
        '2024-04-09': 'Ram Navami',
        '2024-05-01': 'Labor Day',
        '2024-08-15': 'Independence Day',
        '2024-10-02': 'Gandhi Jayanti',
        '2024-11-14': 'Diwali',
        '2024-12-25': 'Christmas',
      };
      return holidayMap[dateStr] || 'Government Holiday';
    }
    if (isSunday(date)) return 'Sunday';
    if (isSecondOrFourthSaturday(date, year, month)) {
      const dateObj = new Date(date);
      const weekNumber = Math.ceil(dateObj.getDate() / 7);
      return `${weekNumber === 2 ? '2nd' : '4th'} Saturday`;
    }
    return 'Working Day';
  };

  const downloadPDF = async () => {
    const doc = new jsPDF();
    let yPosition = 15;

    // First page - Header and Attendance Table
    doc.addImage("/exozen_logo1.png", 'PNG', 15, yPosition, 25, 8);
    doc.setFontSize(11);
    doc.setTextColor(41, 128, 185);
    doc.text(`Attendance Report - ${months[selectedMonth - 1]} ${selectedYear}`, 45, yPosition + 4);
    doc.setFontSize(9);
    doc.text(`Employee ID: ${employeeId}`, 45, yPosition + 8);

    yPosition += 12;
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPosition, 195, yPosition);
    yPosition += 5;

    // Attendance table
    const tableColumn = ["Date", "Project", "Check In", "Check Out", "Day Type"];
    const filteredRecords = processedAttendanceData.filter(record => {
      const dateObj = new Date(record.date);
      return dateObj.getMonth() === selectedMonth - 1 && dateObj.getFullYear() === selectedYear;
    });

    const tableRows = filteredRecords.map(record => [
      formatDate(record.date),
      record.projectName || 'N/A',
      formatTime(record.punchInTime),
      formatTime(record.punchOutTime),
      getDayType(record.date, selectedYear, selectedMonth)
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: yPosition,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 35 }
      }
    });

    // Start second page
    doc.addPage();
    yPosition = 15;

    // Add Monthly Summary section
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text('Monthly Summary', 15, yPosition);
    yPosition += 10;

    if (summary) {
      const summaryTable = [
        ['Working Days', 'Present Days', 'Absent Days', 'Attendance Rate'],
        [
          summary.workingDays || '0',
          summary.presentDays || '0',
          summary.absentDays || '0',
          `${summary.workingDays ? ((summary.presentDays / summary.workingDays) * 100).toFixed(1) : 0}%`
        ]
      ];

      autoTable(doc, {
        head: [summaryTable[0]],
        body: [summaryTable[1]],
        startY: yPosition,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' }
        },
        margin: { left: 15 },
        tableWidth: 180
      });

      // Add Leave Balance section
      yPosition = (doc as any).lastAutoTable.finalY + 20;
      doc.setFontSize(12);
      doc.text('Leave Balances', 15, yPosition);
      yPosition += 10;

      if (summary.leaveBalances) {
        const leaveTable = [
          ['Leave Type', 'Balance'],
          ['Earned Leave', summary.leaveBalances.EL || '0'],
          ['Casual Leave', summary.leaveBalances.CL || '0'],
          ['Sick Leave', summary.leaveBalances.SL || '0'],
          ['Comp Off', summary.leaveBalances.CompOff || '0']
        ];

        autoTable(doc, {
          head: [leaveTable[0]],
          body: leaveTable.slice(1),
          startY: yPosition,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 4 },
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 90, halign: 'center' }
          },
          margin: { left: 15 }
        });
      }

      // Add Leave History section
      try {
        const leaveRes = await fetch(
          `https://cafm.zenapi.co.in/api/leave/history/${employeeId}`
        );
        const leaveData = await leaveRes.json();

        if (leaveData.leaveHistory?.length > 0) {
          yPosition = (doc as any).lastAutoTable.finalY + 20;
          doc.setFontSize(12);
          doc.text('Leave History', 15, yPosition);
          yPosition += 10;

          const leaveHeaders = [['Date', 'Leave Type', 'Days', 'Status', 'Reason']];
          const leaveRows = leaveData.leaveHistory
            .filter((leave: { isHalfDay: boolean }) => !leave.isHalfDay)
            .map((leave: LeaveRecord) => [
              new Date(leave.startDate).toLocaleDateString(),
              leave.leaveType,
              leave.numberOfDays,
              leave.status,
              leave.reason?.substring(0, 30) || ''
            ]);

          if (leaveRows.length > 0) {
            autoTable(doc, {
              head: leaveHeaders,
              body: leaveRows,
              startY: yPosition,
              theme: 'grid',
              styles: { fontSize: 8 },
              headStyles: { fillColor: [41, 128, 185], textColor: 255 },
              columnStyles: {
                0: { cellWidth: 30 },
                1: { cellWidth: 30 },
                2: { cellWidth: 20 },
                3: { cellWidth: 30 },
                4: { cellWidth: 70 }
              },
              margin: { left: 15 }
            });
          }
        }
      } catch (error) {
        console.error('Error fetching leave history:', error);
      }
    }

    doc.save(`attendance_report_${selectedMonth}_${selectedYear}.pdf`);
  };

  useEffect(() => {
    if (!employeeId || !selectedMonth || !selectedYear) return;
    setSummaryLoading(true);
    setSummaryError(null);
    fetch(`https://cafm.zenapi.co.in/api/attendance/${employeeId}/monthly-stats?month=${selectedMonth}&year=${selectedYear}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSummary(data.data);
        } else {
          setSummary(null);
          setSummaryError('Failed to fetch summary');
        }
      })
      .catch(() => {
        setSummary(null);
        setSummaryError('Failed to fetch summary');
      })
      .finally(() => setSummaryLoading(false));
  }, [employeeId, selectedMonth, selectedYear]);

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const match = dateString.match(/T(\d{2}:\d{2}:\d{2})/);
    return match ? match[1] : dateString;
  };

  return (
    <div className="space-y-6 bg-white rounded-xl shadow-sm p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <FaFileExcel className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Attendance Report</h1>
              <p className="text-blue-100 mt-1">View and download your attendance records</p>
            </div>
          </div>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <FaChevronLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaCalendarAlt className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Working Days</h3>
                <p className="text-2xl font-bold text-gray-900">{summary.workingDays || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaCheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Present Days</h3>
                <p className="text-2xl font-bold text-gray-900">{summary.presentDays || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <FaTimesCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Absent Days</h3>
                <p className="text-2xl font-bold text-gray-900">{summary.absentDays || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FaPercentage className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Attendance Rate</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.workingDays ? ((summary.presentDays / summary.workingDays) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div className="flex gap-4">
          <div className="relative">
            <FaCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(parseInt(e.target.value))}
              className="pl-10 pr-4 py-2 border rounded-lg appearance-none bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {months.map((month, index) => (
                <option key={index + 1} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="px-4 py-2 border rounded-lg appearance-none bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FaFileExcel className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <FaFilePdf className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Attendance Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : attendanceData.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.map((record, index) => (
                  <tr 
                    key={record._id || index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(record.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.projectName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(record.punchInTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(record.punchOutTime)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        record.status === 'Present' 
                          ? 'bg-green-100 text-green-800'
                          : record.status === 'Absent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status || (record.punchInTime && record.punchOutTime ? 'Present' : 'Absent')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Monthly Summary Table moved here */}
          {summary && (
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-xl font-bold text-gray-800">Monthly Summary</h3>
                <div className="flex-1 border-b border-gray-200"></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Working Days</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present Days</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent Days</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{summary.workingDays || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{summary.presentDays || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">{summary.absentDays || 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{summary.totalDays ?? summary.summary?.totalDays ?? ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500">No attendance records found for the selected month and year.</p>
        </div>
      )}

      {/* Modal for viewing record details */}
      {selectedRecord && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full relative animate-fade-in">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">Attendance Record Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Date:</span>
                <span className="text-gray-900">{formatDate(selectedRecord.date)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Project Name:</span>
                <span className="text-gray-900">{selectedRecord.projectName || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Designation:</span>
                <span className="text-gray-900">{selectedRecord.designation || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Punch In Time:</span>
                <span className="text-gray-900">{formatTime(selectedRecord.punchInTime)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Punch Out Time:</span>
                <span className="text-gray-900">{formatTime(selectedRecord.punchOutTime)}</span>
              </div>
              {selectedRecord.punchInPhoto && (
                <div className="flex flex-col items-start border-b pb-2">
                  <span className="font-medium text-gray-500 mb-1">Punch In Photo:</span>
                  <Image 
                    src={selectedRecord.punchInPhoto} 
                    alt="Punch In" 
                    width={300}
                    height={200}
                    className="rounded shadow object-contain"
                  />
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedRecord.status === 'Present'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedRecord.status || (selectedRecord.punchInTime && selectedRecord.punchOutTime ? 'Present' : 'Absent')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReport;