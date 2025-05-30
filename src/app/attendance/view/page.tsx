'use client';

import { useEffect, useState } from 'react';
import { 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationCircle, 
  FaChartPie, 
  FaChevronDown, 
  FaSearch, 
  FaChevronLeft, 
  FaChevronRight,  
  FaClipboardCheck,
  FaSync,
  FaClock,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { isAuthenticated } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from 'date-fns';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface AttendanceRecord {
  date: string;
  displayDate: string;
  status: string;
  punchInTime: string | null;
  punchOutTime: string | null;
  punchInLocation?: {
    latitude: number;
    longitude: number;
  };
  punchOutLocation?: {
    latitude: number;
    longitude: number;
  };
  punchInPhoto?: string;
  punchOutPhoto?: string;
  totalHoursWorked?: string;
  isLate: boolean;
  remarks?: string;
}

interface MonthlyStats {
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  overtimeDays: number;
  lateArrivals: number;
  earlyArrivals: number;
  earlyLeaves: number;
  attendanceRate: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Mock data for development
const MOCK_DATA = {
  monthlyStats: {
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    workingDays: 22,
    presentDays: 18,
    absentDays: 2,
    halfDays: 1,
    overtimeDays: 1,
    lateArrivals: 2,
    earlyArrivals: 15,
    earlyLeaves: 1,
    attendanceRate: "81.82%"
  },
  records: Array.from({ length: 22 }, (_, i) => {
    const date = new Date();
    date.setDate(i + 1);
    const isPresent = Math.random() > 0.2;
    const isLate = isPresent && Math.random() > 0.8;
    
    // Generate random punch times
    const punchInHour = Math.floor(Math.random() * 2) + 8;
    const punchInMinute = Math.floor(Math.random() * 60);
    const punchOutHour = Math.floor(Math.random() * 3) + 16;
    const punchOutMinute = Math.floor(Math.random() * 60);
    
    const punchInTime = isPresent ? `${punchInHour}:${punchInMinute.toString().padStart(2, '0')} AM` : null;
    const punchOutTime = isPresent ? `${punchOutHour}:${punchOutMinute.toString().padStart(2, '0')} PM` : null;
    
    // Calculate total hours worked
    const totalHours = isPresent ? (punchOutHour + 12 - punchInHour) + (punchOutMinute - punchInMinute) / 60 : 0;
    
    return {
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      status: isPresent ? 'Present' : 'Absent',
      punchInTime,
      punchOutTime,
      isLate,
      totalHoursWorked: isPresent ? `${totalHours.toFixed(2)} hrs` : '-',
      remarks: isLate ? 'Late arrival' : undefined,
      punchInLocation: isPresent ? {
        latitude: 12.9716 + (Math.random() - 0.5) * 0.01,
        longitude: 77.5946 + (Math.random() - 0.5) * 0.01
      } : undefined,
      punchOutLocation: isPresent ? {
        latitude: 12.9716 + (Math.random() - 0.5) * 0.01,
        longitude: 77.5946 + (Math.random() - 0.5) * 0.01
      } : undefined,
      punchInPhoto: isPresent ? '/mock-punch-in-photo.jpg' : undefined,
      punchOutPhoto: isPresent ? '/mock-punch-out-photo.jpg' : undefined
    };
  })
};

// Error Message Component
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
    <FaExclamationCircle className="text-red-500 mr-2" />
    <p className="text-red-700">{message}</p>
  </div>
);

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-12">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <div className="mt-4 text-center text-gray-600">Loading...</div>
    </div>
  </div>
);

// Calendar Day Component
const CalendarDay = ({ 
  date, 
  record,
  isToday,
  isCurrentMonth 
}: { 
  date: Date;
  record?: AttendanceRecord;
  isToday: boolean;
  isCurrentMonth: boolean;
}) => {
  const getStatusColor = () => {
    if (!isCurrentMonth) return 'text-gray-300';
    if (!record) return 'text-gray-600';
    
    switch (record.status.toLowerCase()) {
      case 'present':
        return record.isLate 
          ? 'text-amber-700'
          : 'text-emerald-700';
      case 'absent':
        return 'text-red-700';
      case 'holiday':
        return 'text-blue-700';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBackground = () => {
    if (!isCurrentMonth || !record) return 'bg-white';
    
    switch (record.status.toLowerCase()) {
      case 'present':
        return record.isLate 
          ? 'bg-amber-50'
          : 'bg-emerald-50';
      case 'absent':
        return 'bg-red-50';
      case 'holiday':
        return 'bg-blue-50';
      default:
        return 'bg-white';
    }
  };

  const getStatusLabel = () => {
    if (!record || !isCurrentMonth) return '';
    
    switch (record.status.toLowerCase()) {
      case 'present':
        return record.isLate ? 'Late' : 'Present';
      case 'absent':
        return 'Absent';
      case 'holiday':
        return 'Holiday';
      default:
        return '';
    }
  };

  return (
    <div 
      className={`
        relative h-16 p-2
        ${isToday ? 'ring-2 ring-blue-400' : 'border border-gray-200'}
        ${getStatusBackground()}
        rounded-lg transition-all duration-200
        ${record ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
        flex flex-col justify-between
      `}
    >
      <div className="flex justify-between items-start">
        <span className={`text-sm font-semibold ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}`}>
          {format(date, 'd')}
        </span>
        {record && isCurrentMonth && (
          <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getStatusColor()} bg-white/50`}>
            {getStatusLabel()}
          </div>
        )}
      </div>
    </div>
  );
};

function ViewAttendanceContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [isDevMode] = useState(() => process.env.NODE_ENV === 'development');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;
  const [showDetailedRecordsModal, setShowDetailedRecordsModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchMonthlyData();
  }, [router, selectedDate]);

  const validateResponse = async (response: Response) => {
    try {
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Error: ${response.status}`);
      }
      return data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid response format from server');
      }
      throw error;
    }
  };

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use mock data in development mode
      if (isDevMode) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        setMonthlyStats(MOCK_DATA.monthlyStats);
        setAttendanceRecords(MOCK_DATA.records.filter(record => {
          const recordDate = new Date(record.date);
          return recordDate.getMonth() === selectedDate.getMonth() &&
                 recordDate.getFullYear() === selectedDate.getFullYear();
        }));
        return;
      }
      
      const month = selectedDate.getMonth() + 1;
      const year = selectedDate.getFullYear();

      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      try {
        const [statsResponse, recordsResponse] = await Promise.all([
          fetch(`https://cafm.zenapi.co.in/api/attendance/EFMS3295/monthly-stats?month=${month}&year=${year}`, {
            method: 'GET',
            headers
          }),
          fetch(`https://cafm.zenapi.co.in/api/attendance/EFMS3295/records?month=${month}&year=${year}`, {
            method: 'GET',
            headers
          })
        ]);

        const [statsData, recordsData] = await Promise.all([
          validateResponse(statsResponse),
          validateResponse(recordsResponse)
        ]);

        if (!statsData.success) {
          throw new Error(statsData.message || 'Failed to fetch monthly stats');
        }
        if (!recordsData.success) {
          throw new Error(recordsData.message || 'Failed to fetch attendance records');
        }

        setMonthlyStats(statsData.data);
        setAttendanceRecords(recordsData.records);
      } catch (error) {
        console.error('API Error:', error);
        // Fallback to mock data if API fails in development
        if (isDevMode) {
          console.log('Falling back to mock data');
          setMonthlyStats(MOCK_DATA.monthlyStats);
          setAttendanceRecords(MOCK_DATA.records);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const retryFetch = () => {
    setError(null);
    fetchMonthlyData();
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = searchQuery === '' || 
      record.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.status.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || record.status.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getCalendarDays = () => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    return eachDayOfInterval({ start, end });
  };

  const findRecordForDate = (date: Date) => {
    return attendanceRecords.find(record => {
      const recordDate = parseISO(record.date);
      return isSameMonth(recordDate, date) && recordDate.getDate() === date.getDate();
    });
  };

  const renderStats = () => {
    if (!monthlyStats) return null;

    return (
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        {/* Header Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
          <div className="absolute top-0 right-0 w-40 h-40 transform translate-x-20 -translate-y-20 opacity-10">
            <FaChartPie className="w-full h-full" />
          </div>
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Monthly Overview</h2>
              <p className="text-blue-100 text-lg">
                {format(selectedDate, 'MMMM yyyy')} • {monthlyStats.workingDays} Working Days
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setChartType(chartType === 'pie' ? 'bar' : 'pie')}
                className="p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Toggle Chart Type"
              >
                {chartType === 'pie' ? <FaChartPie className="w-5 h-5" /> : <FaChartPie className="w-5 h-5" />}
              </button>
              <button 
                onClick={fetchMonthlyData}
                className="p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                title="Refresh Data"
              >
                <FaSync className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Distribution Chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Attendance Distribution</h3>
                <div className="text-sm text-gray-500">
                  Rate: {monthlyStats.attendanceRate}
                </div>
              </div>
              
              <div className="relative w-full aspect-square max-w-sm mx-auto">
                {chartType === 'pie' ? (
                  <div className="relative w-full h-full">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        className="text-gray-100"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r="80"
                        cx="50%"
                        cy="50%"
                      />
                      <circle
                        className="text-emerald-500"
                        strokeWidth="10"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="80"
                        cx="50%"
                        cy="50%"
                        strokeDasharray={`${502.4 * (monthlyStats.presentDays / monthlyStats.workingDays)} 502.4`}
                      />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-4xl font-bold text-gray-900">{monthlyStats.attendanceRate}</div>
                      <div className="text-sm text-gray-500">Attendance Rate</div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Bar
                      data={{
                        labels: ['Present', 'Late', 'Absent', 'Half Day'],
                        datasets: [
                          {
                            data: [
                              monthlyStats.presentDays - monthlyStats.lateArrivals,
                              monthlyStats.lateArrivals,
                              monthlyStats.absentDays,
                              monthlyStats.halfDays
                            ],
                            backgroundColor: [
                              'rgb(16, 185, 129)',
                              'rgb(245, 158, 11)',
                              'rgb(239, 68, 68)',
                              'rgb(59, 130, 246)'
                            ]
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              stepSize: 1
                            }
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Instructions Section */}
              <div className="mt-4 border-t border-gray-200 pt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Instructions & Notes</h3>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs mt-0.5">1</div>
                    <p className="text-sm text-gray-600">Your attendance is automatically recorded when you punch in and out using the mobile app.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs mt-0.5">2</div>
                    <p className="text-sm text-gray-600">Late arrival is marked if you punch in after your scheduled start time.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs mt-0.5">3</div>
                    <p className="text-sm text-gray-600">Each punch requires a photo and your location for verification purposes.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs mt-0.5">4</div>
                    <p className="text-sm text-gray-600">Contact HR if you notice any discrepancies in your attendance records.</p>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-lg">
                  <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs">Important: Ensure your device's location services and camera permissions are enabled for accurate attendance tracking.</p>
                </div>
              </div>
            </div>

            {/* Right Column - Calendar */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {format(selectedDate, 'MMMM yyyy')}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setSelectedDate(newDate);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <FaChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                    className="px-4 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setSelectedDate(newDate);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                  >
                    <FaChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {getCalendarDays().map((date, index) => (
                  <div key={index} onClick={() => {
                    const record = findRecordForDate(date);
                    if (record) {
                      setSelectedRecord(record);
                      setShowRecordModal(true);
                    }
                  }}>
                    <CalendarDay
                      date={date}
                      record={findRecordForDate(date)}
                      isToday={isToday(date)}
                      isCurrentMonth={isSameMonth(date, selectedDate)}
                    />
                  </div>
                ))}
              </div>

              {/* Add View Detailed Report Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowDetailedRecordsModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                    bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700
                    text-white font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <FaClipboardCheck className="w-5 h-5" />
                  View Detailed Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailedRecords = () => {
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

    const renderPagination = () => {
      return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
          <div className="flex items-center">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstRecord + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(indexOfLastRecord, filteredRecords.length)}
              </span>{' '}
              of <span className="font-medium">{filteredRecords.length}</span> records
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === pageNum
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    };

    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 via-white to-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md">
                <FaClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Attendance Records</h3>
                <p className="text-gray-500">Detailed view of your attendance history</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm"
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-48 appearance-none bg-white pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 shadow-sm"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
                <FaChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 via-white to-gray-50">
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <FaCalendarAlt className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Date</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <FaClipboardCheck className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Status</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                      <FaClock className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Punch In</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-100 rounded-lg">
                      <FaClock className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Punch Out</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 rounded-lg">
                      <FaChartPie className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">Hours</span>
                  </div>
                </th>
                <th className="px-6 py-4 text-left">
                  <span className="text-sm font-semibold text-gray-700">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12">
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <FaCalendarAlt className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-2">No attendance records found</p>
                      {(searchQuery || statusFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center gap-2"
                        >
                          <FaSync className="w-4 h-4" />
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentRecords.map((record, index) => (
                  <tr 
                    key={index} 
                    className="group hover:bg-gray-50/80 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-12 h-12 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 group-hover:border-blue-200 transition-colors">
                          <span className="text-lg font-bold text-gray-900">
                            {format(new Date(record.date), 'dd')}
                          </span>
                          <span className="text-xs font-medium text-gray-500 uppercase">
                            {format(new Date(record.date), 'MMM')}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {format(new Date(record.date), 'EEEE')}
                            </span>
                            {isToday(new Date(record.date)) && (
                              <span className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md">
                                Today
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-500">
                              {format(new Date(record.date), 'yyyy')}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                            <span className="text-xs text-gray-500">
                              Week {format(new Date(record.date), 'w')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`
                        inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                        transition-all duration-200 shadow-sm
                        ${record.status.toLowerCase() === 'present'
                          ? record.isLate
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
                          : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                        }
                      `}>
                        {record.status.toLowerCase() === 'present' ? (
                          record.isLate ? (
                            <>
                              <FaClock className="w-4 h-4" />
                              <span>Late</span>
                            </>
                          ) : (
                            <>
                              <FaCheckCircle className="w-4 h-4" />
                              <span>Present</span>
                            </>
                          )
                        ) : (
                          <>
                            <FaTimesCircle className="w-4 h-4" />
                            <span>Absent</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {record.punchInTime ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 rounded-lg">
                              <FaClock className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                            <span className="font-medium text-gray-900">{record.punchInTime}</span>
                          </div>
                          {record.punchInLocation && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 pl-1">
                              <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                              <span className="truncate max-w-[150px]">
                                {record.punchInLocation.latitude.toFixed(6)}, {record.punchInLocation.longitude.toFixed(6)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {record.punchOutTime ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-amber-100 rounded-lg">
                              <FaClock className="w-3.5 h-3.5 text-amber-600" />
                            </div>
                            <span className="font-medium text-gray-900">{record.punchOutTime}</span>
                          </div>
                          {record.punchOutLocation && (
                            <div className="flex items-center gap-2 text-xs text-gray-500 pl-1">
                              <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                              <span className="truncate max-w-[150px]">
                                {record.punchOutLocation.latitude.toFixed(6)}, {record.punchOutLocation.longitude.toFixed(6)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${
                          record.totalHoursWorked && parseFloat(record.totalHoursWorked) >= 8
                            ? 'bg-emerald-100'
                            : record.totalHoursWorked
                              ? 'bg-amber-100'
                              : 'bg-gray-100'
                        }`}>
                          <FaChartPie className={`w-4 h-4 ${
                            record.totalHoursWorked && parseFloat(record.totalHoursWorked) >= 8
                              ? 'text-emerald-600'
                              : record.totalHoursWorked
                                ? 'text-amber-600'
                                : 'text-gray-400'
                          }`} />
                        </div>
                        <span className="font-medium text-gray-900">
                          {record.totalHoursWorked || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowRecordModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                          bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100
                          text-blue-600 hover:text-blue-700 font-medium transition-all duration-200
                          border border-blue-100 hover:border-blue-200 shadow-sm hover:shadow"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {renderPagination()}
      </div>
    );
  };

  const renderDetailedRecordsModal = () => {
    if (!showDetailedRecordsModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full mx-auto relative transform transition-all duration-300 scale-100 opacity-100 max-h-[90vh] overflow-y-auto max-w-7xl">
          <button
            onClick={() => setShowDetailedRecordsModal(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>


          {renderDetailedRecords()}
        </div>
      </div>
    );
  };

  const renderAttendanceModal = () => {
    if (!showRecordModal || !selectedRecord) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full mx-auto relative transform transition-all duration-300 scale-100 opacity-100 max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => setShowRecordModal(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-xl ${
              selectedRecord.status.toLowerCase() === 'present'
                ? selectedRecord.isLate
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                  : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                : 'bg-gradient-to-br from-red-400 to-rose-500'
            } text-white`}>
              {selectedRecord.status.toLowerCase() === 'present' ? (
                selectedRecord.isLate ? (
                  <FaClock className="w-6 h-6" />
                ) : (
                  <FaCheckCircle className="w-6 h-6" />
                )
              ) : (
                <FaTimesCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Attendance Details</h2>
              <p className="text-gray-500">{selectedRecord.displayDate}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Punch In Details */}
            <div className="bg-gray-50/80 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Punch In Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Time</label>
                  <p className="text-lg text-gray-900 font-medium flex items-center gap-2">
                    <FaClock className="w-4 h-4 text-gray-400" />
                    {selectedRecord.punchInTime || '-'}
                  </p>
                </div>
                
                {selectedRecord.punchInLocation && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Location</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />
                      <span>
                        {selectedRecord.punchInLocation.latitude.toFixed(6)}, 
                        {selectedRecord.punchInLocation.longitude.toFixed(6)}
                      </span>
                    </div>
                  </div>
                )}

                {selectedRecord.punchInPhoto && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Photo</label>
                    <img 
                      src={selectedRecord.punchInPhoto} 
                      alt="Punch In Photo" 
                      className="w-full h-48 object-cover rounded-xl shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Punch Out Details */}
            <div className="bg-gray-50/80 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Punch Out Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Time</label>
                  <p className="text-lg text-gray-900 font-medium flex items-center gap-2">
                    <FaClock className="w-4 h-4 text-gray-400" />
                    {selectedRecord.punchOutTime || '-'}
                  </p>
                </div>
                
                {selectedRecord.punchOutLocation && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Location</label>
                    <div className="flex items-center gap-2 text-gray-900">
                      <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />
                      <span>
                        {selectedRecord.punchOutLocation.latitude.toFixed(6)}, 
                        {selectedRecord.punchOutLocation.longitude.toFixed(6)}
                      </span>
                    </div>
                  </div>
                )}

                {selectedRecord.punchOutPhoto && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Photo</label>
                    <img 
                      src={selectedRecord.punchOutPhoto} 
                      alt="Punch Out Photo" 
                      className="w-full h-48 object-cover rounded-xl shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Summary Section */}
            <div className="md:col-span-2 bg-gray-50/80 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Status</label>
                  <div className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium ${
                    selectedRecord.status.toLowerCase() === 'present'
                      ? selectedRecord.isLate
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-r from-red-500 to-rose-600'
                  } text-white shadow-sm`}>
                    {selectedRecord.status}
                    {selectedRecord.isLate && ' (Late)'}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Total Hours</label>
                  <p className="text-lg text-gray-900 font-medium">{selectedRecord.totalHoursWorked}</p>
                </div>

                {selectedRecord.remarks && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Remarks</label>
                    <p className="text-gray-900">{selectedRecord.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setShowRecordModal(false)}
              className="px-6 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all duration-300 font-medium shadow-sm hover:shadow"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="space-y-4">
          <ErrorMessage message={error} />
          <div className="flex justify-center">
            <button
              onClick={retryFetch}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg inline-flex items-center gap-2"
            >
              <FaSync className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          {renderStats()}
          {renderDetailedRecordsModal()}
          {renderAttendanceModal()}
        </>
      )}
    </div>
  );
}

export default function ViewAttendancePage() {
  return (
    <DashboardLayout>
      <ViewAttendanceContent />
    </DashboardLayout>
  );
} 