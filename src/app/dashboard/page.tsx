'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { useUser } from '@/context/UserContext';
import Confetti from 'react-confetti';
import { getDashboardData, getMonthlyStats, submitLeaveRequest, submitRegularization, uploadDocument, getLeaveBalance } from '@/services/dashboard';
import { getEmployeeId } from '@/services/auth';
import type { BirthdayResponse, WorkAnniversaryResponse, LeaveBalanceResponse, MonthlyStats, DepartmentStats, AnalyticsViewType, ChartType, LeaveType } from '../../types/dashboard';
import { FaClipboardList, FaFileUpload, FaRegCalendarPlus, FaTicketAlt } from 'react-icons/fa';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function Dashboard() {
  const router = useRouter();
  const userDetails = useUser();
  const employeeId = getEmployeeId();
  const [birthdays, setBirthdays] = useState<BirthdayResponse | null>(null);
  const [anniversaries, setAnniversaries] = useState<WorkAnniversaryResponse | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceResponse | null>(null);
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [monthlyStatsCache, setMonthlyStatsCache] = useState<Record<string, MonthlyStats>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showRegularizationModal, setShowRegularizationModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [leaveRequestForm, setLeaveRequestForm] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    numberOfDays: 1,
    isHalfDay: false,
    halfDayType: null as string | null,
    reason: '',
    emergencyContact: '',
    attachments: [] as File[],
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  // Regularization Form State
  const [regularizationForm, setRegularizationForm] = useState({
    date: '',
    punchInTime: '',
    punchOutTime: '',
    reason: '',
    status: 'Present',
  });
  const [regularizationLoading, setRegularizationLoading] = useState(false);
  const [regularizationError, setRegularizationError] = useState<string | null>(null);
  const [regularizationSuccess, setRegularizationSuccess] = useState<string | null>(null);

  // Upload Document Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // State for analytics view and chart type
  const [analyticsView, setAnalyticsView] = useState<AnalyticsViewType>('attendance');
  const [attendanceChartType, setAttendanceChartType] = useState<ChartType>('bar');
  const [leaveChartType, setLeaveChartType] = useState<ChartType>('bar');

  // Ticket Form State
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    priority: 'Medium',
  });
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState('');
  const [ticketError, setTicketError] = useState('');

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const getWelcomeMessage = () => {
    const day = currentTime.getDay();
    const isWeekend = day === 0 || day === 6;
    
    if (isWeekend) {
      return "Enjoy your weekend! Here's your dashboard overview.";
    }
    
    const hour = currentTime.getHours();
    if (hour < 12) {
      return "Hope you have a productive day ahead!";
    } else if (hour < 17) {
      return "Keep up with the great work!";
    } else {
      return "Great job today! Here's your dashboard summary.";
    }
  };

  const fetchData = async (showLoading = true, monthToFetch: number = currentMonth, yearToFetch: number = currentYear) => {
    try {
      if (showLoading) setLoading(true);
      setAnalyticsLoading(true);
      const monthYearKey = `${monthToFetch}-${yearToFetch}`;

      // Check cache first for monthly stats
      if (monthlyStatsCache[monthYearKey]) {
        if (monthToFetch === currentMonth && yearToFetch === currentYear) {
          setMonthlyStats(monthlyStatsCache[monthYearKey]);
        }
      } else {
        // Fetch monthly stats
        const monthlyStatsData = await getMonthlyStats(employeeId || '', monthToFetch, yearToFetch);
        
        // Update monthly stats and cache
        setMonthlyStatsCache(prev => ({
          ...prev,
          [monthYearKey]: monthlyStatsData
        }));
        
        if (monthToFetch === currentMonth && yearToFetch === currentYear) {
          setMonthlyStats(monthlyStatsData);
        }
      }

      // Fetch leave balance
      const leaveBalanceData = await getLeaveBalance(employeeId || '');
      setLeaveBalance(leaveBalanceData);

      // Fetch birthdays and anniversaries only
      const { birthdays, anniversaries } = await getDashboardData();
      setBirthdays(birthdays);
      setAnniversaries(anniversaries);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (showLoading) setLoading(false);
      setRefreshing(false);
      setAnalyticsLoading(false);
    }
  };



  // Initial data fetch on component mount
  useEffect(() => {
    fetchData();

    // Poll every 5 minutes
    const pollInterval = setInterval(() => {
      setRefreshing(true);
      fetchData(false, currentMonth, currentYear);
    }, 5 * 60 * 1000);

    return () => clearInterval(pollInterval);
  }, []);

  // Effect to update displayed monthly stats when currentMonth or currentYear changes
  useEffect(() => {
    if (currentMonth > 0) {
      const monthYearKey = `${currentMonth}-${currentYear}`;
      if (monthlyStatsCache[monthYearKey]) {
        setMonthlyStats(monthlyStatsCache[monthYearKey]);
      } else {
        fetchData(false, currentMonth, currentYear);
      }
    }
  }, [currentMonth, currentYear, monthlyStatsCache]);

  useEffect(() => {
    if (birthdays?.success && birthdays.data && birthdays.data.length > 0) {
      setShowCelebration(true);
      setCelebrationMessage(`Happy Birthday ${birthdays.data[0].fullName}! 🎉`);
    } else if (anniversaries?.success && anniversaries.data && anniversaries.data.length > 0) {
      setShowCelebration(true);
      setCelebrationMessage(`Happy Work Anniversary ${anniversaries.data[0].fullName}! 🎉`);
    } else {
      setShowCelebration(false);
      setCelebrationMessage(null);
    }
  }, [birthdays, anniversaries]);

  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  );


  // Update barChartOptions with new configuration
  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.4)',
          lineWidth: 1
        },
        ticks: {
          font: {
            size: 12,
            family: "'Geist', sans-serif"
          },
          color: '#64748b',
          padding: 8
        },
        border: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            family: "'Geist', sans-serif"
          },
          color: '#64748b',
          padding: 8,
          autoSkip: false,
          maxRotation: currentMonth === 0 ? 45 : 0
        },
        border: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'start',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          padding: 20,
          font: {
            size: 12,
            family: "'Geist', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} days`;
          }
        }
      }
    },
    datasets: {
      bar: {
        barThickness: currentMonth === 0 ? 'flex' : 20,
        maxBarThickness: currentMonth === 0 ? 16 : 26,
        barPercentage: currentMonth === 0 ? 0.8 : 0.6,
        categoryPercentage: currentMonth === 0 ? 0.8 : 0.6
      }
    }
  };

  const pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        align: 'center',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          padding: 20,
          font: {
            size: 12,
            family: "'Geist', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        titleColor: '#1e293b',
        bodyColor: '#475569',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value * 100) / total);
            return `${context.label}: ${percentage}%`;
          }
        }
      }
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentMonth(parseInt(e.target.value));
    // useEffect will handle updating monthlyStats and fetching if needed
    // When "All" is selected, currentMonth will be 0.
  };

  const renderMonthSelector = () => (
    <div className="flex items-center gap-2">
      <label htmlFor="month-select" className="text-gray-700 font-medium text-sm whitespace-nowrap">Select Month:</label>
      <select
        id="month-select"
        value={currentMonth}
        onChange={handleMonthChange}
        className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
      >
        <option value={0}>All Months</option> {/* Added "All Months" option */}
        {monthNames.map((month, index) => (
          <option key={month} value={index + 1}>
            {month} {currentYear}
          </option>
        ))}
      </select>
    </div>
  );

  const renderAttendanceChart = () => {
    if (!monthlyStats?.data) return null;

    const chartData: ChartData<'bar'> = {
      labels: currentMonth === 0 ? monthNames : ['Monthly Attendance'],
      datasets: [
        {
          label: 'Present Days',
          data: currentMonth === 0 
            ? monthlyStats.data.monthlyPresent || Array(12).fill(0)
            : [monthlyStats.data.presentDays],
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 3,
          borderRadius: 6,
          maxBarThickness: 32,
        },
        {
          label: 'Late Arrivals',
          data: currentMonth === 0 
            ? monthlyStats.data.monthlyLateArrivals || Array(12).fill(0)
            : [monthlyStats.data.lateArrivals],
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgba(245, 158, 11, 1)',
          borderWidth: 3,
          borderRadius: 6,
          maxBarThickness: 32,
        },
        {
          label: 'Early Arrivals',
          data: currentMonth === 0 
            ? monthlyStats.data.monthlyEarlyArrivals || Array(12).fill(0)
            : [monthlyStats.data.earlyArrivals],
          backgroundColor: 'rgba(75, 192, 192, 0.8)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 3,
          borderRadius: 6,
          maxBarThickness: 32,
        },
        {
          label: 'Absent Days',
          data: currentMonth === 0 
            ? monthlyStats.data.monthlyAbsent || Array(12).fill(0)
            : [monthlyStats.data.absentDays],
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 3,
          borderRadius: 6,
          maxBarThickness: 32,
        }
      ]
    };

    const pieData: ChartData<'pie'> = {
      labels: ['Present Days', 'Late Arrivals', 'Early Arrivals', 'Absent Days'],
      datasets: [{
        data: [
          monthlyStats.data.presentDays,
          monthlyStats.data.lateArrivals,
          monthlyStats.data.earlyArrivals,
          monthlyStats.data.absentDays
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 3
      }]
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Attendance Analytics for {currentMonth === 0 ? 'All Months' : `${monthNames[currentMonth - 1]} ${currentYear}`}
            </h3>
          </div>

          <div className="w-full relative" style={{ height: attendanceChartType === 'bar' ? '400px' : undefined }}>
            {attendanceChartType === 'bar' ? (
              <Bar data={chartData} options={barChartOptions} />
            ) : (
              <div className="w-[320px] h-[320px] mx-auto">
                <Pie data={pieData} options={pieChartOptions} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderLeaveChart = () => {
    if (!leaveBalance) return <p className="text-center text-gray-500 h-[400px] flex items-center justify-center">No leave balance data available.</p>;

    const leaveTypes: LeaveType[] = ['EL', 'SL', 'CL', 'CompOff'];
    const leaveLabels = ['Earned Leave', 'Sick Leave', 'Casual Leave', 'Comp Off'];

    const chartData = {
      labels: leaveLabels,
      datasets: [
        {
          label: 'Allocated',
          data: leaveTypes.map(type => leaveBalance.balances[type as LeaveType].allocated),
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 3,
          borderRadius: 6,
        },
        {
          label: 'Used',
          data: leaveTypes.map(type => leaveBalance.balances[type as LeaveType].used),
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 3,
          borderRadius: 6,
        },
        {
          label: 'Remaining',
          data: leaveTypes.map(type => leaveBalance.balances[type as LeaveType].remaining),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 3,
          borderRadius: 6,
        }
      ]
    };

    const pieData = {
      labels: leaveLabels,
      datasets: [{
        data: leaveTypes.map(type => leaveBalance.balances[type as LeaveType].allocated),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 3
      }]
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Leave Balance for {leaveBalance.employeeName}
            </h3>
            
          </div>

          <div className="w-full h-[200px] relative">
            {leaveChartType === 'bar' ? (
              <Bar data={chartData} options={barChartOptions} />
            ) : (
              <div className="w-[320px] h-[320px] mx-auto">
                <Pie data={pieData} options={pieChartOptions} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderChart = () => {
    if (analyticsView === 'attendance') {
      return renderAttendanceChart();
    } else {
      return renderLeaveChart();
    }
  };

  const renderChartTypeToggle = () => {
    const currentChartType = analyticsView === 'attendance' ? attendanceChartType : leaveChartType;
    const setChartType = analyticsView === 'attendance' ? setAttendanceChartType : setLeaveChartType;

    // Disable pie chart option when "All Months" is selected for attendance
    const isPieDisabled = analyticsView === 'attendance' && currentMonth === 0;

    return (
      <div className="flex gap-2">
        <button
          onClick={() => setChartType('bar')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${currentChartType === 'bar' ? 'bg-indigo-500 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Bar Chart
        </button>
        <button
          onClick={() => setChartType('pie')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${currentChartType === 'pie' ? 'bg-indigo-500 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} ${isPieDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isPieDisabled} // Disable button
        >
          Pie Chart
        </button>
      </div>
    );
  };

  interface MetricCardProps {
    icon: React.ElementType;
    title: string;
    value: string;
    subtext: string;
    gradient: string;
  }

  const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, title, value, subtext, gradient }) => (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl shadow-md p-4 text-white
      transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer group`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-lg group-hover:scale-110 transition-transform">
          <Icon className="text-2xl opacity-80" />
        </div>
        <h3 className="text-sm font-medium opacity-90">{title}</h3>
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
      <p className="text-xs opacity-75 mt-1">{subtext}</p>
    </div>
  );

  const handleRequestLeaveChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setLeaveRequestForm(prev => ({
        ...prev,
        [name]: checked,
        halfDayType: name === 'isHalfDay' && !checked ? null : prev.halfDayType,
      }));
    } else {
      setLeaveRequestForm(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmitLeaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRequest(true);
    setRequestError(null);
    setRequestSuccess(null);
    try {
      await submitLeaveRequest(employeeId || '', leaveRequestForm);
      setRequestSuccess('Leave request submitted successfully!');
      setLeaveRequestForm({
        leaveType: '',
        startDate: '',
        endDate: '',
        numberOfDays: 1,
        isHalfDay: false,
        halfDayType: null,
        reason: '',
        emergencyContact: '',
        attachments: [],
      });
      setTimeout(() => setShowLeaveModal(false), 1500);
    } catch (err: any) {
      setRequestError(err.message || 'Failed to submit leave request');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleRegularizationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRegularizationForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRegularizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegularizationLoading(true);
    setRegularizationError(null);
    setRegularizationSuccess(null);
    try {
      await submitRegularization(employeeId || '', regularizationForm);
      setRegularizationSuccess('Attendance regularization request submitted successfully!');
      setRegularizationForm({ date: '', punchInTime: '', punchOutTime: '', reason: '', status: 'Present' });
      setTimeout(() => setShowRegularizationModal(false), 1500);
    } catch (error: any) {
      setRegularizationError(error.message || 'Failed to submit regularization request');
    } finally {
      setRegularizationLoading(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadLoading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      if (!uploadFile) throw new Error('Please select a file');
      await uploadDocument(employeeId || '', uploadFile, uploadType, uploadDesc);
      setUploadSuccess('Document uploaded successfully!');
      setUploadFile(null);
      setUploadType('');
      setUploadDesc('');
      setTimeout(() => setShowUploadModal(false), 1500);
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload document');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleViewReports = () => {
    router.push('/reports');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 relative">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="max-w-7xl mx-auto space-y-6 relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white/80 backdrop-blur rounded-xl shadow-sm p-4 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-slate-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
                <div className="space-y-4">
                  {[1, 2].map((j) => (
                    <div key={j} className="h-20 bg-slate-100 rounded"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-0 px-2 md:pt-0 md:px-4 relative overflow-x-hidden">
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 animate-fade-in">
          <Confetti width={window.innerWidth} height={window.innerHeight} numberOfPieces={400} recycle={false} />
          <div className="text-center p-8 rounded-2xl shadow-xl bg-white/90 border-4 border-yellow-300 animate-bounce-in">
            <h2 className="text-4xl font-extrabold text-yellow-500 mb-4 drop-shadow-lg">
              {celebrationMessage?.split('\n')[0]}
            </h2>
            <p className="text-lg text-gray-700 font-medium italic">
              {celebrationMessage?.split('\n')[1]}
            </p>
          </div>
        </div>
      )}
      {/* Welcome Section */}
      <div className="mt-0 mb-5">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-white">
          <div>
            <h1 className="text-2xl md:text-2xl font-bold drop-shadow-lg">
              Welcome back, <span className="text-white font-bold">{userDetails?.fullName || <span className="inline-block h-6 w-32 bg-blue-300 rounded animate-pulse align-middle">&nbsp;</span>}</span>!
            </h1>
            <p className="text-base md:text-lg font-medium opacity-90 mt-1">
              {getWelcomeMessage()}
            </p>
          </div>
          <div className="flex gap-2 z-10">
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg shadow-md hover:bg-blue-50 transition font-semibold text-base">View My Tickets</button>
            <button onClick={handleViewReports} className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 transition font-semibold text-base">View Reports</button>
          </div>
        </div>
      </div>

      {/* Quick Actions and Dashboard Analytics Section */}
      <div className="grid grid-cols-12 gap-6 mb-6 h-[calc(100vh-120px)]">
        {/* Quick Actions */}
        <div className="col-span-12 lg:col-span-2 bg-white rounded-2xl shadow-lg p-4 overflow-y-auto">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            Quick Actions
          </h2>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setShowLeaveModal(true)}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-300 group"
            >
              <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                <FaRegCalendarPlus className="text-lg" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">Leave</span>
            </button>
            
            <button 
              onClick={() => setShowRegularizationModal(true)}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-amber-300 group"
            >
              <div className="p-2 rounded-full bg-amber-100 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
                <FaClipboardList className="text-lg" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-amber-600 transition-colors">Attendance</span>
            </button>
            
            <button 
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-emerald-300 group"
            >
              <div className="p-2 rounded-full bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                <FaFileUpload className="text-lg" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">Document</span>
            </button>
            
            <button 
              onClick={() => setShowTicketModal(true)}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-purple-300 group"
            >
              <div className="p-2 rounded-full bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                <FaTicketAlt className="text-lg" />
              </div>
              <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">Raise Ticket</span>
            </button>
          </div>
        </div>

        {/* Dashboard Analytics */}
        <div className="col-span-12 lg:col-span-10 bg-white rounded-2xl shadow-lg p-4 overflow-y-auto max-h-[calc(100vh-120px)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-3">
              Dashboard Analytics
            </h2>
            {refreshing && <LoadingSpinner />}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={() => setAnalyticsView('attendance')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${analyticsView === 'attendance' ? 'bg-blue-500 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Attendance Analytics
              </button>
              <button
                onClick={() => setAnalyticsView('leave')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${analyticsView === 'leave' ? 'bg-blue-500 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Leave Analytics
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              {analyticsView === 'attendance' && renderMonthSelector()}
              {renderChartTypeToggle()}
            </div>
          </div>

          <div className="relative w-full">
            {renderChart()}
          </div>
        </div>
      </div>

      {/* Leave Balance Section (consolidated into Analytics) */}
      {/* Attendance Analytics (consolidated into Analytics) */}

      {/* Modals (scaffolded) */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md border border-gray-200 animate-fade-in-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md">
                  <FaRegCalendarPlus className="text-lg" />
                </span>
                Request Leave
              </h3>
              <button 
                onClick={() => setShowLeaveModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmitLeaveRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Leave Type</label>
                <select 
                  name="leaveType" 
                  value={leaveRequestForm.leaveType} 
                  onChange={handleRequestLeaveChange} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300" 
                  required
                >
                  <option value="">Select Leave Type</option>
                  <option value="EL">Earned Leave</option>
                  <option value="SL">Sick Leave</option>
                  <option value="CL">Casual Leave</option>
                  <option value="CompOff">Comp Off</option>
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">From</label>
                  <input 
                    type="date" 
                    name="startDate" 
                    value={leaveRequestForm.startDate} 
                    onChange={handleRequestLeaveChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300" 
                    required 
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1.5 text-gray-700">To</label>
                  <input 
                    type="date" 
                    name="endDate" 
                    value={leaveRequestForm.endDate} 
                    onChange={handleRequestLeaveChange} 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300" 
                    required 
                  />
                </div>
              </div>
              <div className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg">
                <input 
                  type="checkbox" 
                  id="isHalfDay"
                  name="isHalfDay" 
                  checked={leaveRequestForm.isHalfDay} 
                  onChange={handleRequestLeaveChange} 
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isHalfDay" className="text-sm text-gray-700">Half Day</label>
                {leaveRequestForm.isHalfDay && (
                  <select 
                    name="halfDayType" 
                    value={leaveRequestForm.halfDayType || ''} 
                    onChange={handleRequestLeaveChange} 
                    className="ml-2 border border-gray-300 rounded px-2 py-1 text-gray-700 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select</option>
                    <option value="First Half">First Half</option>
                    <option value="Second Half">Second Half</option>
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Reason</label>
                <textarea 
                  name="reason" 
                  value={leaveRequestForm.reason} 
                  onChange={handleRequestLeaveChange} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300" 
                  rows={3}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Emergency Contact</label>
                <input 
                  name="emergencyContact" 
                  value={leaveRequestForm.emergencyContact} 
                  onChange={handleRequestLeaveChange} 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300" 
                />
              </div>
              {requestError && <div className="text-red-600 text-sm p-2 bg-red-50 rounded-lg">{requestError}</div>}
              {requestSuccess && <div className="text-green-600 text-sm p-2 bg-green-50 rounded-lg">{requestSuccess}</div>}
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowLeaveModal(false)} 
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2" 
                  disabled={submittingRequest}
                >
                  {submittingRequest ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showRegularizationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-black">Request Regularization</h3>
            <form onSubmit={handleRegularizationSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-black">Date</label>
                <input type="date" name="date" value={regularizationForm.date} onChange={handleRegularizationChange} className="w-full border rounded px-3 py-2 text-black" required />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-black">Punch In Time</label>
                  <input type="time" name="punchInTime" value={regularizationForm.punchInTime} onChange={handleRegularizationChange} className="w-full border rounded px-3 py-2 text-black" required />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1 text-black">Punch Out Time</label>
                  <input type="time" name="punchOutTime" value={regularizationForm.punchOutTime} onChange={handleRegularizationChange} className="w-full border rounded px-3 py-2 text-black" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-black">Reason</label>
                <textarea name="reason" value={regularizationForm.reason} onChange={handleRegularizationChange} className="w-full border rounded px-3 py-2 text-black" required />
              </div>
              {regularizationError && <div className="text-red-600 text-sm">{regularizationError}</div>}
              {regularizationSuccess && <div className="text-green-600 text-sm">{regularizationSuccess}</div>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowRegularizationModal(false)} className="px-4 py-2 bg-red-500 text-white rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-white rounded" disabled={regularizationLoading}>{regularizationLoading ? 'Submitting...' : 'Submit'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-black">Upload Document</h3>
            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-black">Document Type</label>
                <input value={uploadType} onChange={e => setUploadType(e.target.value)} className="w-full border rounded px-3 py-2 text-black" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-black">Description</label>
                <input value={uploadDesc} onChange={e => setUploadDesc(e.target.value)} className="w-full border rounded px-3 py-2 text-black" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-black">File</label>
                <input type="file" onChange={e => setUploadFile(e.target.files?.[0] || null)} className="w-full border rounded px-3 py-2 text-black" required />
              </div>
              {uploadError && <div className="text-red-600 text-sm">{uploadError}</div>}
              {uploadSuccess && <div className="text-green-600 text-sm">{uploadSuccess}</div>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowUploadModal(false)} className="px-4 py-2 bg-red-500 text-white rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-emerald-500 text-white rounded" disabled={uploadLoading}>{uploadLoading ? 'Uploading...' : 'Upload'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    
    </div>
  );
}