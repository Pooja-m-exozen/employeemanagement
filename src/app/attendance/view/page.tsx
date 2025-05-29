'use client';

import { useEffect, useState } from 'react';
import { 
  FaSpinner, 
  FaCalendarAlt, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaExclamationCircle, 
  FaChartLine, 
  FaChartPie, 
  FaChartBar, 
  FaFilter, 
  FaChevronDown, 
  FaSearch, 
  FaChevronLeft, 
  FaChevronRight, 
  FaUserCheck, 
  FaCalendarCheck, 
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
  time: string | null;
  isLate: boolean;
  remarks?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  photo?: string;
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
    
    return {
      date: date.toISOString().split('T')[0],
      displayDate: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      status: isPresent ? 'Present' : 'Absent',
      time: isPresent ? `${Math.floor(Math.random() * 2) + 8}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} AM` : null,
      isLate,
      remarks: isLate ? 'Late arrival' : undefined,
      location: isPresent ? {
        latitude: 12.9716 + (Math.random() - 0.5) * 0.01,
        longitude: 77.5946 + (Math.random() - 0.5) * 0.01
      } : undefined
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
    if (!isCurrentMonth) return 'bg-gray-50 text-gray-400 opacity-50';
    if (!record) return 'bg-gray-50 text-gray-400';
    
    switch (record.status.toLowerCase()) {
      case 'present':
        return record.isLate 
          ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
      case 'absent':
        return 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100';
      case 'holiday':
        return 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100';
      default:
        return 'bg-gray-50 text-gray-400';
    }
  };

  return (
    <div 
      className={`
        relative p-4 
        ${isToday ? 'ring-2 ring-blue-600 ring-offset-2' : 'border border-gray-200'} 
        rounded-xl transition-all duration-200 
        ${getStatusColor()}
        ${record ? 'cursor-pointer hover:shadow-md transform hover:-translate-y-1' : ''}
      `}
      title={record?.remarks || ''}
    >
      <span className={`text-sm font-medium ${!isCurrentMonth ? 'opacity-50' : ''}`}>
        {format(date, 'd')}
      </span>
      {record && (
        <div className="mt-2 space-y-2">
          <div className="text-xs font-medium truncate">{record.status}</div>
          {record.time && (
            <div className="text-xs flex items-center gap-1">
              <FaClock className="w-3 h-3" />
              {record.time}
            </div>
          )}
          {record.isLate && (
            <div className="absolute top-2 right-2">
              <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      )}
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

    const statCards = [
      {
        title: 'Present Days',
        value: monthlyStats.presentDays,
        icon: <FaUserCheck />,
        color: 'emerald'
      },
      {
        title: 'Absent Days',
        value: monthlyStats.absentDays,
        icon: <FaTimesCircle />,
        color: 'red'
      },
      {
        title: 'Late Arrivals',
        value: monthlyStats.lateArrivals,
        icon: <FaClock />,
        color: 'amber'
      },
      {
        title: 'Attendance Rate',
        value: monthlyStats.attendanceRate,
        icon: <FaChartLine />,
        color: 'blue'
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div 
            key={index}
            className={`bg-${card.color}-50 rounded-xl p-6 border border-${card.color}-100 hover:shadow-lg transition-all duration-300 cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-3 bg-${card.color}-100 rounded-lg`}>
                <div className={`w-6 h-6 text-${card.color}-600`}>{card.icon}</div>
              </div>
              <span className={`text-${card.color}-600 text-sm font-medium`}>
                {format(selectedDate, 'MMM yyyy')}
              </span>
            </div>
            <h3 className="mt-4 text-2xl font-bold text-gray-800">{card.value}</h3>
            <p className={`mt-1 text-${card.color}-600 text-sm`}>{card.title}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderCalendar = () => {
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-xl">
              <FaCalendarAlt className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">
                {format(selectedDate, 'MMMM yyyy')}
              </h3>
              <p className="text-gray-500">View and track your attendance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setSelectedDate(newDate);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <FaChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
            >
              Today
            </button>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setSelectedDate(newDate);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <FaChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Holiday</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 mb-4">
          {weekDays.map(day => (
            <div key={day} className="text-center font-medium text-gray-500 text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-4">
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
      </div>
    );
  };

  const renderDetailedRecords = () => {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-xl">
                <FaClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Attendance Records</h3>
                <p className="text-gray-500">Detailed view of your attendance history</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-48 appearance-none bg-white pl-4 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-4 bg-gray-50 rounded-full mb-4">
                        <FaCalendarAlt className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-2">No records found</p>
                      {(searchQuery || statusFilter !== 'all') && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedRecord(record);
                      setShowRecordModal(true);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{record.displayDate}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        record.status.toLowerCase() === 'present'
                          ? record.isLate
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <span className="flex items-center gap-2">
                          {record.status.toLowerCase() === 'present' ? (
                            record.isLate ? (
                              <>
                                <FaClock className="w-4 h-4" />
                                Late
                              </>
                            ) : (
                              <>
                                <FaCheckCircle className="w-4 h-4" />
                                Present
                              </>
                            )
                          ) : (
                            <>
                              <FaTimesCircle className="w-4 h-4" />
                              Absent
                            </>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {record.time ? (
                          <div className="flex items-center gap-2">
                            <FaClock className="w-4 h-4 text-gray-400" />
                            {record.time}
                          </div>
                        ) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {record.location ? (
                          <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />
                            <span>Recorded</span>
                          </div>
                        ) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {record.remarks || '-'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderAttendanceModal = () => {
    if (!showRecordModal || !selectedRecord) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-auto relative">
          <button
            onClick={() => setShowRecordModal(false)}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className={`p-3 rounded-xl ${
              selectedRecord.status.toLowerCase() === 'present'
                ? selectedRecord.isLate
                  ? 'bg-amber-100'
                  : 'bg-emerald-100'
                : 'bg-red-100'
            }`}>
              {selectedRecord.status.toLowerCase() === 'present' ? (
                selectedRecord.isLate ? (
                  <FaClock className="w-6 h-6 text-amber-600" />
                ) : (
                  <FaCheckCircle className="w-6 h-6 text-emerald-600" />
                )
              ) : (
                <FaTimesCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Attendance Details</h2>
              <p className="text-gray-500">{selectedRecord.displayDate}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    selectedRecord.status.toLowerCase() === 'present'
                      ? selectedRecord.isLate
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedRecord.status}
                    {selectedRecord.isLate && ' (Late)'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Time</label>
                  <p className="text-lg text-gray-900">{selectedRecord.time || '-'}</p>
                </div>
              </div>
            </div>

            {selectedRecord.location && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-medium text-gray-500 mb-2">Location</label>
                <div className="flex items-center gap-2 text-gray-900">
                  <FaMapMarkerAlt className="text-gray-400" />
                  <span>
                    {selectedRecord.location.latitude.toFixed(6)}, {selectedRecord.location.longitude.toFixed(6)}
                  </span>
                </div>
              </div>
            )}

            {selectedRecord.remarks && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-medium text-gray-500 mb-2">Remarks</label>
                <p className="text-gray-900">{selectedRecord.remarks}</p>
              </div>
            )}

            {selectedRecord.photo && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <label className="block text-sm font-medium text-gray-500 mb-2">Photo</label>
                <img 
                  src={selectedRecord.photo} 
                  alt="Attendance Photo" 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={() => setShowRecordModal(false)}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
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
              className="px-6 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium inline-flex items-center gap-2"
            >
              <FaSync className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                  <FaCalendarCheck className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Attendance Overview</h1>
                  <p className="text-blue-100">Track and monitor your attendance records</p>
                </div>
              </div>
              <button
                onClick={fetchMonthlyData}
                className="p-3 bg-white bg-opacity-20 rounded-xl hover:bg-opacity-30 transition-colors"
                title="Refresh data"
              >
                <FaSync className="w-5 h-5" />
              </button>
            </div>
          </div>

          {renderStats()}
          {renderCalendar()}
          {renderDetailedRecords()}
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