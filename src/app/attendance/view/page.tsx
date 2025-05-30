'use client';

import { useEffect, useState, useMemo } from 'react';
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
  FaMapMarkerAlt,
  FaUserCheck,
  FaClock as FaClockIcon,
  FaSignInAlt,
  FaSignOutAlt,
  FaPhoneAlt
} from 'react-icons/fa';
import { isAuthenticated, getEmployeeId } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from 'date-fns';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

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
  const [activities, setActivities] = useState<any[]>([]);
  const [showDetailedRecordsModal, setShowDetailedRecordsModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;
  const [selectedActivity, setSelectedActivity] = useState<any | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchActivities();
  }, [router]);

  const fetchActivities = async () => {
      setLoading(true);
      setError(null);
    try {
      const employeeId = getEmployeeId();
      const response = await fetch(`https://cafm.zenapi.co.in/api/attendance/${employeeId}/recent-activities`);
      const data = await response.json();
      if (response.ok && data.status === 'success' && Array.isArray(data.data?.activities)) {
        setActivities(data.data.activities);
        } else {
        setActivities([]);
        setError('No attendance data found.');
        }
    } catch (e) {
      setActivities([]);
      setError('Failed to fetch attendance data.');
      }
      setLoading(false);
  };

  const getCalendarDays = () => {
    const start = startOfMonth(selectedDate);
    const end = endOfMonth(selectedDate);
    const days = eachDayOfInterval({ start, end });
    // Add empty days at the start
    const firstDayOfWeek = start.getDay();
    const leadingEmpty = Array.from({ length: firstDayOfWeek });
    // Add empty days at the end to fill 6 rows (42 cells)
    const totalCells = 42;
    const trailingEmpty = Array.from({ length: totalCells - (leadingEmpty.length + days.length) });
    return [
      ...leadingEmpty.map(() => null),
      ...days,
      ...trailingEmpty.map(() => null)
    ];
  };

  const getStatusForDate = (date: Date) => {
    const activity = activities.find(a => a.date === format(date, 'yyyy-MM-dd'));
    if (!activity) return { code: '', color: '' };
    if (activity.status === 'Present') return { code: 'P', color: 'text-green-600' };
    if (activity.status === 'Absent') return { code: 'A', color: 'text-red-600' };
    if (activity.status.toLowerCase().includes('holiday')) return { code: 'H', color: 'text-blue-600' };
    if (activity.status.toLowerCase().includes('saturday') || activity.status.toLowerCase().includes('sunday')) return { code: 'O', color: 'text-gray-400' };
    return { code: activity.status[0], color: 'text-gray-600' };
  };

  // Filtered and paginated activities for modal
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const matchesSearch = search === '' ||
        a.displayDate.toLowerCase().includes(search.toLowerCase()) ||
        a.status.toLowerCase().includes(search.toLowerCase()) ||
        (a.time && a.time.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || a.status.toLowerCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [activities, search, statusFilter]);

  const totalPages = Math.ceil(filteredActivities.length / recordsPerPage);
  const paginatedActivities = filteredActivities.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  // Calculate attendance rate and working days from activities
  const workingDays = activities.filter(a => a.status === 'Present' || a.status === 'Absent' || a.status.toLowerCase().includes('late')).length;
  const presentDays = activities.filter(a => a.status === 'Present').length;
  const attendanceRate = workingDays > 0 ? ((presentDays / workingDays) * 100).toFixed(2) : '0.00';

    return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Blue Gradient Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-8 shadow-lg flex items-center justify-between">
            <div>
          <h2 className="text-3xl font-bold text-white">Monthly Overview</h2>
          <p className="text-blue-100 mt-1 text-lg">{format(selectedDate, 'MMMM yyyy')} • {workingDays} Working Days</p>
            </div>
            </div>
      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Graph + Instructions */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          {/* Attendance Distribution Graph */}
          <div className="w-48 h-48 flex items-center justify-center mb-6">
            <CircularProgressbar
              value={parseFloat(attendanceRate)}
              text={`${attendanceRate}%`}
              styles={buildStyles({
                pathColor: '#10B981',
                textColor: '#111827',
                trailColor: '#E5E7EB',
                textSize: '18px',
              })}
            />
                    </div>
          <div className="text-center text-gray-500 mb-6">Attendance Rate</div>
          {/* Instructions */}
          <div className="w-full bg-gray-50 rounded-lg p-4 border">
            <h3 className="font-semibold text-gray-800 mb-2">Instructions & Notes</h3>
            <ul className="list-decimal list-inside text-sm text-gray-700 space-y-1">
              <li>Your attendance is automatically recorded when you punch in and out using the mobile app.</li>
              <li>Late arrival is marked if you punch in after your scheduled start time.</li>
              <li>Each punch requires a photo and your location for verification purposes.</li>
              <li>Contact HR if you notice any discrepancies in your attendance records.</li>
            </ul>
            <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded-lg text-xs">
                  <FaExclamationCircle className="w-4 h-4 flex-shrink-0" />
              Important: Ensure your device's location services and camera permissions are enabled for accurate attendance tracking.
                </div>
              </div>
            </div>
        {/* Right: Calendar */}
        <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-4">
            <h3 className="text-xl font-semibold text-gray-900">{format(selectedDate, 'MMMM yyyy')}</h3>
            {/* Calendar controls (prev, today, next) */}
                <div className="flex items-center gap-2">
                  <button
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                &lt;
                  </button>
                  <button
                    onClick={() => setSelectedDate(new Date())}
                className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-700"
                  >
                    Today
                  </button>
                  <button
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                &gt;
                  </button>
                </div>
              </div>
          <div className="w-full" style={{ minWidth: 350, maxWidth: 420 }}>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              {getCalendarDays().map((date, idx) => {
                if (!date) {
                  return <div key={idx} className="w-14 h-14" />;
                }
                const { code, color } = getStatusForDate(date);
                const activity = activities.find(a => a.date === format(date, 'yyyy-MM-dd'));
                return (
                  <div
                    key={idx}
                    className={`relative w-14 h-14 border rounded-lg flex flex-col items-center justify-center shadow-sm transition
                      ${isToday(date) ? 'ring-2 ring-blue-400 bg-blue-50' : ''}
                      ${isSameMonth(date, selectedDate) ? 'bg-white' : 'bg-gray-50 opacity-60'}
                      group`}
                    title={activity ? `${activity.status}${activity.time ? ' at ' + activity.time : ''}` : ''}
                  >
                    <span className="text-xs text-gray-400 absolute top-1 left-1">{date ? format(date, 'd') : ''}</span>
                    <span className={`mt-2 text-base font-bold ${color}`}>{code}</span>
                    {activity && activity.remarks && (
                      <span className="absolute bottom-1 left-1 text-[10px] text-amber-600" title={activity.remarks}>*</span>
                    )}
                  </div>
                );
              })}
              </div>
          </div>
                <button
                  onClick={() => setShowDetailedRecordsModal(true)}
            className="mt-8 w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
            <FaClipboardCheck className="inline mr-2" /> View Detailed Report
                </button>
              </div>
            </div>
      {/* Error or Loading */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <FaClock className="animate-spin text-blue-500 w-8 h-8 mr-2" />
          <span className="text-gray-600">Loading attendance...</span>
          </div>
      )}
      {error && (
        <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg">
          <FaExclamationCircle className="text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </div>
      )}
      {/* Detailed Report Modal */}
      {showDetailedRecordsModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-5xl w-full mx-4 relative">
            <button
              onClick={() => setShowDetailedRecordsModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-md">
                <FaClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800">Attendance Records</h3>
                <p className="text-gray-500">Detailed view of your attendance history</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 mt-4">
              <div className="relative w-full sm:w-64">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black placeholder:text-gray-400"
                />
              </div>
              <div className="relative w-full sm:w-48">
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full appearance-none bg-white pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-black"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="holiday">Holiday</option>
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl">
          <table className="w-full">
                <thead className="sticky top-0 bg-white z-10">
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaCalendarAlt className="inline mr-1 text-blue-500" /> Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaCheckCircle className="inline mr-1 text-green-500" /> Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaSignInAlt className="inline mr-1 text-emerald-500" /> Punch In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaSignOutAlt className="inline mr-1 text-amber-500" /> Punch Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><FaClockIcon className="inline mr-1 text-indigo-500" /> Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedActivities.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No records found</td>
                </tr>
                  ) : paginatedActivities.map((activity, idx) => {
                    const isTodayRow = activity.date === format(new Date(), 'yyyy-MM-dd');
                    return (
                      <tr key={idx} className={`hover:bg-blue-50 transition ${isTodayRow ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-black">
                        <div className="flex flex-col">
                            <span className="font-bold text-lg text-black">{format(new Date(activity.date), 'dd')}</span>
                            <span className="text-xs text-black font-medium uppercase">{format(new Date(activity.date), 'MMM')}</span>
                            <span className="text-xs text-black">{format(new Date(activity.date), 'EEEE')}</span>
                      </div>
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {activity.status.toLowerCase() === 'present' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500 text-white gap-1">
                              <FaCheckCircle className="w-4 h-4 mr-1" /> Present
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              activity.status.toLowerCase() === 'absent' ? 'bg-red-100 text-red-700' :
                              activity.status.toLowerCase().includes('holiday') ? 'bg-blue-100 text-blue-700' :
                              activity.status.toLowerCase().includes('late') ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {activity.status}
                            </span>
                          )}
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {activity.punchInTime ? (
                        <div className="flex flex-col gap-1.5">
                              <span className="flex items-center gap-2"><FaSignInAlt className="text-emerald-500" /> {activity.punchInTime}</span>
                              {activity.punchInLocation && (
                                <span className="flex items-center gap-1 text-xs text-gray-500"><FaMapMarkerAlt className="w-3 h-3" />{activity.punchInLocation.latitude}, {activity.punchInLocation.longitude}</span>
                          )}
                        </div>
                          ) : <span className="text-gray-400">-</span>}
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {activity.punchOutTime ? (
                        <div className="flex flex-col gap-1.5">
                              <span className="flex items-center gap-2"><FaSignOutAlt className="text-amber-500" /> {activity.punchOutTime}</span>
                              {activity.punchOutLocation && (
                                <span className="flex items-center gap-1 text-xs text-gray-500"><FaMapMarkerAlt className="w-3 h-3" />{activity.punchOutLocation.latitude}, {activity.punchOutLocation.longitude}</span>
                          )}
                        </div>
                          ) : <span className="text-gray-400">-</span>}
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {activity.totalHoursWorked ? (
                            <span className="flex items-center gap-2"><FaClockIcon className="text-indigo-500" /> {activity.totalHoursWorked}</span>
                          ) : <span className="text-gray-400">-</span>}
                    </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                      <button
                            onClick={() => setSelectedActivity(activity)}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition font-medium shadow-sm border border-blue-200"
                          >
                        View Details
                      </button>
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
                    );
                  })}
            </tbody>
          </table>
        </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 mt-2">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, filteredActivities.length)} of {filteredActivities.length} records
      </div>
                <div className="flex items-center gap-2">
          <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
          >
                    <FaChevronLeft className="w-4 h-4" />
          </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:text-blue-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <FaChevronRight className="w-4 h-4" />
                  </button>
        </div>
      </div>
            )}
            <div className="mt-6 flex justify-end">
          <button
                onClick={() => setShowDetailedRecordsModal(false)}
                className="px-6 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-lg hover:from-blue-200 hover:to-indigo-200 transition font-medium shadow-sm"
              >
                Close
              </button>
            </div>
            {/* Details Modal */}
            {selectedActivity && (
              <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 relative">
                  <button
                    onClick={() => setSelectedActivity(null)}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FaClipboardCheck className="text-blue-600" /> Attendance Details
                  </h3>
              <div className="space-y-4">
                <div>
                      <span className="block text-xs text-gray-500 mb-1">Date</span>
                      <span className="font-semibold text-lg text-gray-900">{selectedActivity.displayDate}</span>
                </div>
                  <div>
                      <span className="block text-xs text-gray-500 mb-1">Status</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedActivity.status.toLowerCase() === 'present' ? 'bg-green-100 text-green-700' :
                        selectedActivity.status.toLowerCase() === 'absent' ? 'bg-red-100 text-red-700' :
                        selectedActivity.status.toLowerCase().includes('holiday') ? 'bg-blue-100 text-blue-700' :
                        selectedActivity.status.toLowerCase().includes('late') ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedActivity.status}
                      </span>
                    </div>
                  <div>
                      <span className="block text-xs text-gray-500 mb-1">Time</span>
                      <span className="font-medium text-gray-900">{selectedActivity.time || '-'}</span>
                  </div>
                <div>
                      <span className="block text-xs text-gray-500 mb-1">Late?</span>
                      <span className="font-medium text-gray-900">{selectedActivity.isLate ? 'Yes' : 'No'}</span>
                </div>
                    {selectedActivity.remarks && (
                  <div>
                        <span className="block text-xs text-gray-500 mb-1">Remarks</span>
                        <span className="text-gray-900">{selectedActivity.remarks}</span>
                  </div>
                )}
                  </div>
                  <div className="mt-6 flex justify-end">
            <button
                      onClick={() => setSelectedActivity(null)}
                      className="px-6 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-lg hover:from-blue-200 hover:to-indigo-200 transition font-medium shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
            )}
          </div>
        </div>
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