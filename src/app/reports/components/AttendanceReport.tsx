import React, { useState } from 'react';
import { FaFileExcel, FaFilePdf, FaDownload, FaCalendar, FaClock, FaChevronLeft } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  formatTime: (dateString: string) => string;
}

const AttendanceReport: React.FC<AttendanceReportProps> = ({
  loading,
  attendanceData,
  selectedMonth,
  selectedYear,
  handleMonthChange,
  handleYearChange,
  handleViewRecord,
  handleBack,
  fetchReportData,
  formatDate,
  formatTime,
}) => {
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + 2 - i);

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

  const downloadPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Date", "Project", "Designation", "Check In", "Check Out"];
    const tableRows = attendanceData.map(record => [
      formatDate(record.date),
      record.projectName,
      record.designation,
      formatTime(record.punchInTime),
      formatTime(record.punchOutTime),
    ]);

    doc.setFontSize(20);
    doc.text(`Attendance Report - ${months[selectedMonth - 1]} ${selectedYear}`, 14, 15);
    
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`attendance_report_${selectedMonth}_${selectedYear}.pdf`);
  };

  const calculateStatistics = () => {
    const totalDays = attendanceData.length;
    const presentDays = attendanceData.filter(record => record.punchInTime && record.punchOutTime).length;
    const absentDays = totalDays - presentDays;
    
    return { totalDays, presentDays, absentDays };
  };

  const stats = calculateStatistics();

  // Utility to extract time from ISO string
  const extractTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Kolkata',
    });
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
                    {record.projectName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-gray-400" />
                      {extractTime(record.punchInTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-gray-400" />
                      {extractTime(record.punchOutTime)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      record.punchInTime && record.punchOutTime
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {record.punchInTime && record.punchOutTime ? 'Present' : 'Absent'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500">No attendance records found for the selected period</p>
        </div>
      )}

      {/* Modal for viewing record details */}
      {selectedRecord && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full relative animate-fade-in">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setSelectedRecord(null)}
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
                <span className="text-gray-900">{selectedRecord.projectName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Designation:</span>
                <span className="text-gray-900">{selectedRecord.designation}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Punch In Time:</span>
                <span className="text-gray-900">{extractTime(selectedRecord.punchInTime)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="font-medium text-gray-500">Punch Out Time:</span>
                <span className="text-gray-900">{extractTime(selectedRecord.punchOutTime)}</span>
              </div>
              {selectedRecord.punchInPhoto && (
                <div className="flex flex-col items-start border-b pb-2">
                  <span className="font-medium text-gray-500 mb-1">Punch In Photo:</span>
                  <img src={selectedRecord.punchInPhoto} alt="Punch In" className="rounded shadow max-h-40" />
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium text-gray-500">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedRecord.punchInTime && selectedRecord.punchOutTime
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedRecord.punchInTime && selectedRecord.punchOutTime ? 'Present' : 'Absent'}
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