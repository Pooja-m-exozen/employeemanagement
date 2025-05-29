'use client';

import React, { useState, useEffect } from 'react';
import { FaCalendarCheck, FaUserClock,FaClipboardList, FaFileAlt, FaPlusCircle, FaFileUpload, FaRegCalendarPlus, FaTicketAlt, FaClipboardCheck } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, ChartOptions } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import Confetti from 'react-confetti';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface BirthdayResponse {
  success: boolean;
  message: string;
  data?: {
    fullName: string;
    employeeId: string;
    designation: string;
    employeeImage: string;
    personalizedWish: string;
  }[];
}

interface WorkAnniversaryResponse {
  success: boolean;
  message: string;
  data?: {
    fullName: string;
    employeeId: string;
    designation: string;
    employeeImage: string;
    yearsOfService: number;
    personalizedWish: string;
  }[];
}

interface LeaveBalance {
  allocated: number;
  used: number;
  remaining: number;
  pending: number;
}

interface LeaveBalances {
  EL: LeaveBalance;
  SL: LeaveBalance;
  CL: LeaveBalance;
  CompOff: LeaveBalance;
}

interface LeaveBalanceResponse {
  employeeId: string;
  employeeName: string;
  year: number;
  balances: LeaveBalances;
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
  totalPending: number;
}


export default function Dashboard() {
  const router = useRouter();
  const userDetails = useUser();
  const [birthdays, setBirthdays] = useState<BirthdayResponse | null>(null);
  const [anniversaries, setAnniversaries] = useState<WorkAnniversaryResponse | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceResponse | null>(null);
  const [attendanceActivities, setAttendanceActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
  const [analyticsView, setAnalyticsView] = useState<'attendance' | 'leave'>('attendance');
  const [attendanceChartType, setAttendanceChartType] = useState<'bar' | 'pie'>('bar');
  const [leaveChartType, setLeaveChartType] = useState<'bar' | 'pie'>('bar');

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
      return "Keep up the great work!";
    } else {
      return "Great job today! Here's your dashboard summary.";
    }
  };

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const [birthdaysRes, anniversariesRes, leaveBalanceRes, attendanceRes] = await Promise.all([
        fetch('https://cafm.zenapi.co.in/api/kyc/birthdays/today'),
        fetch('https://cafm.zenapi.co.in/api/kyc/work-anniversaries/today'),
        fetch('https://cafm.zenapi.co.in/api/leave/balance/EFMS3295'),
        fetch('https://cafm.zenapi.co.in/api/attendance/EFMS3295/recent-activities')
      ]);

      const [birthdaysData, anniversariesData, leaveBalanceData, attendanceData] = await Promise.all([
        birthdaysRes.json(),
        anniversariesRes.json(),
        leaveBalanceRes.json(),
        attendanceRes.json()
      ]);

      setBirthdays(birthdaysData);
      setAnniversaries(anniversariesData);
      setLeaveBalance(leaveBalanceData);
      if (attendanceData.status === 'success') {
        setAttendanceActivities(attendanceData.data.activities);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Polling setup
  useEffect(() => {
    fetchData();

    // Poll every 5 minutes
    const pollInterval = setInterval(() => {
      setRefreshing(true);
      fetchData(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(pollInterval);
  }, []);

  useEffect(() => {
    if (birthdays?.success && birthdays.data && birthdays.data.length > 0) {
      setShowCelebration(true);
      setCelebrationMessage(
        `Happy Birthday, ${birthdays.data.map(b => b.fullName).join(', ')}! 🎉\n${birthdays.data[0].personalizedWish}`
      );
    } else if (anniversaries?.success && anniversaries.data && anniversaries.data.length > 0) {
      setShowCelebration(true);
      setCelebrationMessage(
        `Happy Work Anniversary, ${anniversaries.data.map(a => a.fullName).join(', ')}! 🎊\n${anniversaries.data[0].personalizedWish}`
      );
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

  // Colors for leave types
  const leaveColors = {
    EL: {
      gradient: 'from-emerald-400 to-emerald-600',
      bg: 'rgba(16, 185, 129, 0.8)',
      border: 'rgba(16, 185, 129, 1)',
      light: 'bg-emerald-50',
      text: 'text-emerald-600'
    },
    SL: {
      gradient: 'from-red-400 to-red-600',
      bg: 'rgba(239, 68, 68, 0.8)',
      border: 'rgba(239, 68, 68, 1)',
      light: 'bg-red-50',
      text: 'text-red-600'
    },
    CL: {
      gradient: 'from-blue-400 to-blue-600',
      bg: 'rgba(59, 130, 246, 0.8)',
      border: 'rgba(59, 130, 246, 1)',
      light: 'bg-blue-50',
      text: 'text-blue-600'
    },
    CompOff: {
      gradient: 'from-purple-400 to-purple-600',
      bg: 'rgba(139, 92, 246, 0.8)',
      border: 'rgba(139, 92, 246, 1)',
      light: 'bg-purple-50',
      text: 'text-purple-600'
    }
  };

  // Colors for attendance status
  const attendanceColors = {
    Present: {
      bg: 'rgba(16, 185, 129, 0.8)',
      border: 'rgba(16, 185, 129, 1)',
      text: 'text-emerald-600'
    },
    Absent: {
      bg: 'rgba(239, 68, 68, 0.8)',
      border: 'rgba(239, 68, 68, 1)',
      text: 'text-red-600'
    },
    Late: {
      bg: 'rgba(245, 158, 11, 0.8)',
      border: 'rgba(245, 158, 11, 1)',
      text: 'text-amber-600'
    }
  };

  const barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x',
    layout: {
      padding: 0
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'center' as const,
        labels: {
          font: {
            family: "'Geist', sans-serif",
            size: 12,
            weight: 'normal' as 'normal'
          },
          usePointStyle: true,
          padding: 20,
          boxWidth: 10
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        bodyFont: {
          size: 13,
          family: "'Geist', sans-serif",
          weight: 'normal' as 'normal'
        },
        titleFont: {
          size: 14,
          weight: 'bold' as 'bold',
          family: "'Geist', sans-serif"
        },
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y} days`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(226, 232, 240, 0.5)',
          lineWidth: 1,
          display: true
        },
        ticks: {
          font: {
            size: 12,
            family: "'Geist', sans-serif",
            weight: 'normal' as 'normal'
          },
          color: '#64748b',
          padding: 8,
          stepSize: 1
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            family: "'Geist', sans-serif",
            weight: 'normal' as 'normal'
          },
          color: '#64748b',
          padding: 8
        }
      }
    },
    elements: {
      bar: {
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false
      }
    },
    datasets: {
      bar: {
        barThickness: 40,
        maxBarThickness: 60,
        barPercentage: 0.95,
        categoryPercentage: 0.95
      }
    }
  };

  const pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 16,
        bottom: 16,
        left: 16,
        right: 16
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        align: 'center' as const,
        labels: {
          font: {
            family: "'Geist', sans-serif",
            size: 12,
            weight: 'normal' as 'normal'
          },
          usePointStyle: true,
          padding: 16,
          boxWidth: 10
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        bodyFont: {
          size: 13,
          family: "'Geist', sans-serif",
          weight: 'normal' as 'normal'
        },
        titleFont: {
          size: 14,
          weight: 'bold' as 'bold',
          family: "'Geist', sans-serif"
        },
        callbacks: {
          label: function(context) {
             return `${context.label}: ${context.formattedValue}`; // Standard pie chart tooltip format
          }
        }
      }
    }
  };

  const renderAttendanceChart = () => {
    if (!attendanceActivities || attendanceActivities.length === 0) return <p className="text-center text-gray-500">No attendance data available.</p>;

    // Filter activities for the current month and process data
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyActivities = attendanceActivities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate.getMonth() === currentMonth && activityDate.getFullYear() === currentYear && !['Sunday', '4th Saturday', '2nd Saturday'].includes(activity.status);
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (monthlyActivities.length === 0) return <p className="text-center text-gray-500">No attendance data for the current month.</p>;

    // Calculate total counts for Present, Absent, and Late
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    monthlyActivities.forEach(activity => {
      if (activity.status === 'Present') presentCount++;
      if (activity.status === 'Absent') absentCount++;
      if (activity.isLate) lateCount++; // Count late occurrences
    });

    const barChartData = {
      labels: ['Present', 'Absent', 'Late'],
      datasets: [
        {
          label: 'Count',
          data: [presentCount, absentCount, lateCount],
          backgroundColor: [
            attendanceColors.Present.bg,
            attendanceColors.Absent.bg,
            attendanceColors.Late.bg,
          ],
          borderColor: [
            attendanceColors.Present.border,
            attendanceColors.Absent.border,
            attendanceColors.Late.border,
          ],
          borderWidth: 1,
        },
      ],
    };

    // Process data for pie chart
    const statusCounts: { [key: string]: number } = {};
     monthlyActivities.forEach(activity => {
      statusCounts[activity.status] = (statusCounts[activity.status] || 0) + 1;
    });
    // Include Late status in pie chart counts if applicable
     monthlyActivities.forEach(activity => {
       if(activity.isLate) statusCounts['Late'] = (statusCounts['Late'] || 0) + 1;
    });

    const pieChartLabels = Object.keys(statusCounts).filter(status => statusCounts[status] > 0);
    const pieChartDataValues = Object.values(statusCounts).filter(count => count > 0);

    const pieChartData = {
      labels: pieChartLabels,
      datasets: [
        {
          label: '# of Days',
          data: pieChartDataValues,
          backgroundColor: [
            attendanceColors.Present.bg,
            attendanceColors.Absent.bg,
            attendanceColors.Late.bg,
            'rgba(54, 162, 235, 0.6)', // Example additional color if needed
            'rgba(153, 102, 255, 0.6)', // Example additional color if needed
            'rgba(201, 203, 207, 0.6)', // Example additional color if needed
          ],
          borderColor: [
            attendanceColors.Present.border,
            attendanceColors.Absent.border,
            attendanceColors.Late.border,
            'rgba(54, 162, 235, 1)', // Example additional color if needed
            'rgba(153, 102, 255, 1)', // Example additional color if needed
            'rgba(201, 203, 207, 1)', // Example additional color if needed
          ],
          borderWidth: 1,
        },
      ],
    };

    if (attendanceChartType === 'bar') {
      return (
        <div className="w-full h-full max-w-3xl mx-auto">
          <div className="h-[400px]">
            <Bar
              data={barChartData}
              options={barChartOptions}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="w-full h-full max-w-2xl mx-auto p-4">
          <Pie data={pieChartData} options={pieChartOptions} />
        </div>
      );
    }
  };

  const renderLeaveChart = () => {
    if (!leaveBalance) return <p>No leave balance data available.</p>;

    type LeaveType = 'EL' | 'SL' | 'CL' | 'CompOff';
    const leaveTypes: LeaveType[] = ['EL', 'SL', 'CL', 'CompOff'];
    const allocatedData = leaveTypes.map((type: LeaveType) => leaveBalance.balances[type].allocated);

    const chartData = {
      labels: leaveTypes,
      datasets: [
        {
          label: 'Allocated Days',
          data: allocatedData,
          backgroundColor: [
            leaveColors.EL.bg,
            leaveColors.SL.bg,
            leaveColors.CL.bg,
            leaveColors.CompOff.bg,
          ],
          borderColor: [
            leaveColors.EL.border,
            leaveColors.SL.border,
            leaveColors.CL.border,
            leaveColors.CompOff.border,
          ],
          borderWidth: 1,
        },
      ],
    };

    if (leaveChartType === 'bar') {
      return (
        <div className="w-full h-full max-w-4xl mx-auto p-4">
          <Bar
            data={chartData}
            options={barChartOptions}
          />
        </div>
      );
    } else {
      return (
        <div className="w-full h-full max-w-2xl mx-auto p-4">
          <Pie data={chartData} options={pieChartOptions} />
        </div>
      );
    }
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
    return (
      <div className="flex gap-2">
        <button
          onClick={() => setChartType('bar')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${currentChartType === 'bar' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Bar Chart
        </button>
        <button
          onClick={() => setChartType('pie')}
          className={`px-3 py-1 rounded-full text-sm font-medium ${currentChartType === 'pie' ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Pie Chart
        </button>
      </div>
    );
  };

  const renderLeaveBalanceGraphs = () => {
    if (!leaveBalance) return null;

    type LeaveType = 'EL' | 'SL' | 'CL' | 'CompOff';
    const leaveTypes: LeaveType[] = ['EL', 'SL', 'CL', 'CompOff'];

    const data = {
      labels: ['Earned Leave', 'Sick Leave', 'Casual Leave', 'Comp Off'],
      datasets: [
        {
          data: leaveTypes.map(type => leaveBalance.balances[type].allocated),
          backgroundColor: leaveTypes.map(type => leaveColors[type].bg),
          borderColor: leaveTypes.map(type => leaveColors[type].border),
          borderWidth: 2,
          borderRadius: 8,
          barThickness: 40,
        }
      ]
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Leave Balance Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100
          transform transition-all duration-300 hover:shadow-xl group">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <span className="text-emerald-500">📊</span>
            Leave Balance Overview
          </h3>
          <div className="transform transition-transform duration-300 group-hover:scale-[1.02]">
            <Bar
              data={data}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'x',
                layout: {
                  padding: {
                    top: 20,
                    bottom: 20,
                    left: 20,
                    right: 20
                  }
                },
                plugins: {
                  legend: {
                    position: 'top' as const,
                    align: 'center' as const,
                    labels: {
                      font: {
                        family: "'Geist', sans-serif",
                        size: 12,
                        weight: 'normal' as 'normal'
                      },
                      usePointStyle: true,
                      padding: 20,
                      boxWidth: 10
                    }
                  },
                  tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#1f2937',
                    bodyColor: '#4b5563',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    padding: 12,
                    bodyFont: {
                      size: 13,
                      family: "'Geist', sans-serif",
                      weight: 'normal' as 'normal'
                    },
                    titleFont: {
                      size: 14,
                      weight: 'bold' as 'bold',
                      family: "'Geist', sans-serif"
                    },
                    callbacks: {
                      label: function(context) {
                        if ('y' in context.parsed) {
                          return `${context.dataset.label}: ${context.parsed.y} days`;
                        } else {
                          return `${context.dataset.label}: ${context.parsed}`;
                        }
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(226, 232, 240, 0.5)',
                      lineWidth: 1,
                      display: true
                    },
                    ticks: {
                      font: {
                        size: 12,
                        family: "'Geist', sans-serif",
                        weight: 'normal' as 'normal'
                      },
                      color: '#64748b',
                      padding: 8,
                      stepSize: 1
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      font: {
                        size: 12,
                        family: "'Geist', sans-serif",
                        weight: 'normal' as 'normal'
                      },
                      color: '#64748b',
                      padding: 8
                    }
                  }
                },
                elements: {
                  bar: {
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                  }
                },
                datasets: {
                  bar: {
                    barThickness: 40,
                    maxBarThickness: 60,
                    barPercentage: 0.95,
                    categoryPercentage: 0.95
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Leave Status Cards */}
        <div className="grid grid-cols-2 gap-4">
          {leaveTypes.map((type, index) => {
            const balance = leaveBalance.balances[type];
            const percentage = (balance.used / balance.allocated) * 100;

            return (
              <div
                key={type}
                className={`bg-gradient-to-br ${leaveColors[type].gradient} rounded-xl p-4 text-white
                  transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg group`}
                style={{
                  animation: `fadeSlideIn 0.5s ease-out forwards ${index * 0.1}s`
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium opacity-90">{type}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm`}>
                    {balance.remaining} left
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs opacity-75">Used</span>
                    <span className="text-sm font-medium group-hover:font-bold transition-all">
                      {balance.used}/{balance.allocated}
                    </span>
                  </div>
                  <div className="relative pt-1">
                    <div className="flex mb-1 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-white/20 backdrop-blur-sm">
                          {Math.round(percentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 text-xs flex rounded-full bg-white/20 backdrop-blur-sm">
                      <div
                        style={{ width: `${percentage}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center
                          bg-white/40 transition-all duration-500 ease-in-out group-hover:bg-white/50"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const MetricCard = ({ icon: Icon, title, value, subtext, gradient }: {
    icon: any,
    title: string,
    value: string,
    subtext: string,
    gradient: string
  }) => (
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
      const response = await fetch('https://cafm.zenapi.co.in/api/leave/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: userDetails?.employeeId,
          ...leaveRequestForm,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit leave request');
      }
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
      const response = await fetch(`https://cafm.zenapi.co.in/api/attendance/${userDetails?.employeeId}/regularize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regularizationForm),
      });
      const data = await response.json();
      if (response.ok) {
        setRegularizationSuccess('Attendance regularization request submitted successfully!');
        setRegularizationForm({ date: '', punchInTime: '', punchOutTime: '', reason: '', status: 'Present' });
        setTimeout(() => setShowRegularizationModal(false), 1500);
      } else {
        throw new Error(data.message || 'Failed to submit regularization request');
      }
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
      const formData = new FormData();
      formData.append('document', uploadFile);
      formData.append('type', uploadType);
      formData.append('description', uploadDesc);
      const response = await fetch(`https://cafm.zenapi.co.in/api/kyc/${userDetails?.employeeId}`, {
        method: 'PUT',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setUploadSuccess('Document uploaded successfully!');
        setUploadFile(null);
        setUploadType('');
        setUploadDesc('');
        setTimeout(() => setShowUploadModal(false), 1500);
      } else {
        throw new Error(data.message || 'Failed to upload document');
      }
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
      <div className="container mx-auto px-0 pt-0 mt-0 mb-8">
  <div className="bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-600 rounded-2xl shadow-lg overflow-hidden">
    <div className="flex flex-col md:flex-row justify-between items-center p-8 gap-6">
      {/* Welcome Message */}
      <div className="text-center md:text-left">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h2 className="text-3xl font-bold text-white">
              Welcome back,{" "}
              <span className="text-blue-100 font-extrabold">
                {userDetails?.fullName || (
                  <span className="inline-block h-5 w-28 bg-blue-300 rounded animate-pulse align-middle">&nbsp;</span>
                )}
              </span>
            </h2>
            <p className="text-blue-100 mt-2 text-lg">{getWelcomeMessage()}</p>
          </div>
        </div>
        {userDetails && (
          <p className="text-white text-sm font-medium bg-white/20 px-4 py-2 rounded-full inline-block mt-3 backdrop-blur-md border border-white/30 shadow-inner">
            {userDetails.designation} • {userDetails.department}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
        <button
          className="px-5 py-2.5 bg-white text-indigo-600 rounded-lg hover:bg-blue-50 transition-all duration-300 font-medium text-sm shadow-md hover:shadow-lg flex items-center gap-2 transform hover:-translate-y-1"
        >
          <FaTicketAlt className="text-indigo-500" /> View My Tickets
        </button>
        <button
          onClick={handleViewReports}
          className="px-5 py-2.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all duration-300 font-medium text-sm shadow-md hover:shadow-lg border border-white/30 flex items-center gap-2 transform hover:-translate-y-1"
        >
          <FaFileAlt className="text-white/80" /> View Reports
        </button>
      </div>
    </div>
  </div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 p-4 mb-8">
  {/* Reusable Card Component */}
  {[
    {
      title: "Attendance",
      subtitle: "This Month",
      icon: <FaUserClock className="text-blue-600 text-2xl" />,
      bgFrom: "from-blue-50",
      bgTo: "to-blue-100",
      value: "18 / 22",
      label: "Present / Working Days",
      progress: "82%",
      progressColor: "bg-blue-500",
      footerText: "+2 days vs last month",
      borderColor: "border-blue-200",
      hoverBg: "hover:bg-blue-50"
    },
    {
      title: "Leave Balance",
      icon: <FaCalendarCheck className="text-emerald-600 text-2xl" />,
      bgFrom: "from-emerald-50",
      bgTo: "to-emerald-100",
      value: "12 / 20",
      label: "Used / Allocated",
      progress: "60%",
      progressColor: "bg-emerald-500",
      footerText: "8 days remaining",
      borderColor: "border-emerald-200",
      hoverBg: "hover:bg-emerald-50"
    },
    {
      title: "Attendance Regularization",
      icon: <FaClipboardList className="text-amber-600 text-2xl" />,
      bgFrom: "from-amber-50",
      bgTo: "to-amber-100",
      value: "15 / 03 / 01",
      label: "Requested / Approved / Rejected",
      progress: "60%",
      progressColor: "bg-amber-500",
      footerText: "8 days remaining",
      borderColor: "border-amber-200",
      hoverBg: "hover:bg-amber-50"
    },
    {
      title: "Leave",
      subtitle: "This Month",
      icon: <FaClipboardCheck className="text-purple-600 text-2xl" />,
      bgFrom: "from-purple-50",
      bgTo: "to-purple-100",
      value: "2",
      label: "Approved",
      progress: "82%",
      progressColor: "bg-purple-500",
      footerText: "1 request pending",
      borderColor: "border-purple-200",
      hoverBg: "hover:bg-purple-50"
    },
  ].map((card, index) => (
    <div
      key={index}
      className={`group bg-white rounded-xl p-6 shadow-sm hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border ${card.borderColor} ${card.hoverBg}`}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className={`bg-gradient-to-br ${card.bgFrom} ${card.bgTo} shadow-md p-4 rounded-full transform group-hover:scale-110 transition-transform duration-300`}>
          {card.icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{card.title}</p>
          {card.subtitle && <h3 className="text-base font-semibold text-gray-700">{card.subtitle}</h3>}
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{card.value}</h2>
          <p className="text-xs text-gray-500">{card.label}</p>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${card.progressColor} transition-all rounded-full group-hover:animate-pulse`}
            style={{ width: card.progress }}
          />
        </div>
        <p className="text-xs font-medium text-gray-500 mt-1">{card.footerText}</p>
      </div>
    </div>
  ))}
</div>


      {/* Quick Actions Section - New */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-indigo-600">⚡</span> Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button 
            onClick={() => setShowLeaveModal(true)}
            className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-300 group"
          >
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mb-3 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
              <FaRegCalendarPlus className="text-xl" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">Request Leave</span>
          </button>
          
          <button 
            onClick={() => setShowRegularizationModal(true)}
            className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-amber-300 group"
          >
            <div className="p-3 rounded-full bg-amber-100 text-amber-600 mb-3 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300">
              <FaClipboardList className="text-xl" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-amber-600 transition-colors">Regularize Attendance</span>
          </button>
          
          <button 
            onClick={() => setShowUploadModal(true)}
            className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-emerald-300 group"
          >
            <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
              <FaFileUpload className="text-xl" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-600 transition-colors">Upload Document</span>
          </button>
          
          <button 
            onClick={() => setShowTicketModal(true)}
            className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-purple-300 group"
          >
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mb-3 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
              <FaTicketAlt className="text-xl" />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">Raise Ticket</span>
          </button>
        </div>
      </div>

      {/* Dashboard Analytics Section - Redesigned */}
      <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-2xl p-2 bg-indigo-100 text-indigo-600 rounded-lg">📈</span>
            Dashboard Analytics
          </h2>
          <div className="flex items-center gap-3 mt-3 sm:mt-0">
            {refreshing && <LoadingSpinner />}
            <button
              onClick={() => {
                setRefreshing(true);
                fetchData(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600
                rounded-full text-sm font-medium transition-all duration-300 hover:shadow-md
                border border-gray-200 hover:border-gray-300"
              disabled={refreshing}
            >
              <svg
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-xl mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex gap-3">
              <button
                onClick={() => setAnalyticsView('attendance')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${analyticsView === 'attendance' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
              >
                Attendance Analytics
              </button>
              <button
                onClick={() => setAnalyticsView('leave')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${analyticsView === 'leave' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
              >
                Leave Analytics
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => analyticsView === 'attendance' ? setAttendanceChartType('bar') : setLeaveChartType('bar')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${(analyticsView === 'attendance' ? attendanceChartType : leaveChartType) === 'bar' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5h-2v12h2V2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3z"/>
                </svg>
                Bar
              </button>
              <button
                onClick={() => analyticsView === 'attendance' ? setAttendanceChartType('pie') : setLeaveChartType('pie')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1.5 ${(analyticsView === 'attendance' ? attendanceChartType : leaveChartType) === 'pie' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M7.5 1.018a7 7 0 0 0-4.79 11.566L7.5 7.793V1.018zm1 0V7.5h6.482A7.001 7.001 0 0 0 8.5 1.018zM14.982 8.5H8.207l-4.79 4.79A7 7 0 0 0 14.982 8.5zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8z"/>
                </svg>
                Pie
              </button>
            </div>
          </div>
          <div className="relative w-full h-[400px] max-w-3xl mx-auto bg-white p-4 rounded-lg shadow-sm">
            <div className="w-full h-full">
              {renderChart()}
            </div>
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
      {showTicketModal && (
        <div className="fixed inset-0 z-50 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl p-6 shadow-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-black">Raise Ticket</h3>
            {/* Ticket form goes here */}
            <button onClick={() => setShowTicketModal(false)} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}