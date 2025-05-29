'use client';

import { useState, useEffect } from 'react';
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationCircle,
  FaCalendarCheck,
  FaSync,
  FaCalendarAlt,
  FaClock,
  FaChartPie,
  FaChartBar
} from 'react-icons/fa';
import { isAuthenticated } from '@/services/auth';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface LeaveBalance {
  allocated: number;
  used: number;
  remaining: number;
  pending: number;
}

interface LeaveBalances {
  employeeId: string;
  employeeName: string;
  year: number;
  balances: {
    EL: LeaveBalance;
    SL: LeaveBalance;
    CL: LeaveBalance;
    CompOff: LeaveBalance;
  };
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
  totalPending: number;
}

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-12">
    <div className="relative">
      <div className="w-20 h-20 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="mt-4 text-center text-gray-600 font-medium">Loading your data...</div>
    </div>
  </div>
);

// Error Message Component
const ErrorMessage = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
  <div className="p-8 text-center">
    <div className="flex items-center justify-center gap-3 p-6 bg-red-50 rounded-2xl text-red-600 mb-6 shadow-sm">
      <FaExclamationCircle className="w-8 h-8" />
      <p className="text-base font-medium">{message}</p>
    </div>
    <button
      onClick={onRetry}
      className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 inline-flex items-center gap-2 shadow-lg shadow-indigo-200"
    >
      <FaSync className="w-5 h-5" />
      Try Again
    </button>
  </div>
);

function ViewLeaveContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalances | null>(null);
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchLeaveBalances();
  }, [router]);

  const fetchLeaveBalances = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('https://cafm.zenapi.co.in/api/leave/balance/EFMS3295');
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Failed to fetch leave balances');
      }

      setLeaveBalances(data);
    } catch (error: any) {
      setError(error.message || 'An error occurred while fetching leave balances');
    } finally {
      setLoading(false);
    }
  };

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'EL': return 'Earned Leave';
      case 'SL': return 'Sick Leave';
      case 'CL': return 'Casual Leave';
      case 'CompOff': return 'Compensatory Off';
      default: return type;
    }
  };

  const renderCharts = () => {
    if (!leaveBalances) return null;

    const pieData = {
      labels: ['Used', 'Remaining', 'Pending'],
      datasets: [{
        data: [
          leaveBalances.totalUsed,
          leaveBalances.totalRemaining,
          leaveBalances.totalPending
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.9)',
          'rgba(16, 185, 129, 0.9)',
          'rgba(245, 158, 11, 0.9)'
        ],
        borderColor: [
          'rgba(239, 68, 68, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)'
        ],
        borderWidth: 2,
      }]
    };

    const barData = {
      labels: Object.keys(leaveBalances.balances).map(getLeaveTypeLabel),
      datasets: [
        {
          label: 'Allocated',
          data: Object.values(leaveBalances.balances).map(b => b.allocated),
          backgroundColor: 'rgba(99, 102, 241, 0.9)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 2,
        },
        {
          label: 'Used',
          data: Object.values(leaveBalances.balances).map(b => b.used),
          backgroundColor: 'rgba(239, 68, 68, 0.9)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
        },
        {
          label: 'Remaining',
          data: Object.values(leaveBalances.balances).map(b => b.remaining),
          backgroundColor: 'rgba(16, 185, 129, 0.9)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
        }
      ]
    };

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-8 space-y-6 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Leave Overview</h3>
            <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setChartType('pie')}
                className={`p-2.5 rounded-lg transition-all duration-300 ${
                  chartType === 'pie' 
                    ? 'bg-white text-indigo-600 shadow-md' 
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
                title="Pie Chart View"
              >
                <FaChartPie className="w-5 h-5" />
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`p-2.5 rounded-lg transition-all duration-300 ${
                  chartType === 'bar' 
                    ? 'bg-white text-indigo-600 shadow-md' 
                    : 'text-gray-600 hover:text-indigo-600'
                }`}
                title="Bar Chart View"
              >
                <FaChartBar className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="h-[350px]">
            {chartType === 'pie' ? (
              <Pie 
                data={pieData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                          size: 12,
                          family: "'Inter', sans-serif"
                        }
                      }
                    }
                  }
                }}
              />
            ) : (
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                          size: 12,
                          family: "'Inter', sans-serif"
                        }
                      }
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      stacked: false,
                      grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                      }
                    },
                    x: {
                      grid: {
                        display: false
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Stats</h3>
          <div className="space-y-6">
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl transform transition-transform hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-600">Total Allocated</p>
                  <p className="text-3xl font-bold text-indigo-700 mt-1">{leaveBalances?.totalAllocated}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl shadow-lg">
                  <FaCalendarAlt className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl transform transition-transform hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Available Balance</p>
                  <p className="text-3xl font-bold text-emerald-700 mt-1">{leaveBalances?.totalRemaining}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
                  <FaCheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl transform transition-transform hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-rose-600">Used Leaves</p>
                  <p className="text-3xl font-bold text-rose-700 mt-1">{leaveBalances?.totalUsed}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-rose-500 to-red-500 rounded-xl shadow-lg">
                  <FaClock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl transform transition-transform hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">Pending Requests</p>
                  <p className="text-3xl font-bold text-amber-700 mt-1">{leaveBalances?.totalPending}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl shadow-lg">
                  <FaCalendarCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLeaveTypes = () => {
    if (!leaveBalances) return null;

    return (
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden mt-8 hover:shadow-2xl transition-shadow duration-300">
        <div className="p-8 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">Leave Type Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Allocated
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Used
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Remaining
                </th>
                <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  Pending
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {Object.entries(leaveBalances.balances).map(([type, balance]) => (
                <tr key={type} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {getLeaveTypeLabel(type)}
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-sm font-medium text-indigo-600">{balance.allocated}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-sm font-medium text-rose-600">{balance.used}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-sm font-medium text-emerald-600">{balance.remaining}</div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="text-sm font-medium text-amber-600">{balance.pending}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl shadow-lg">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl shadow-lg">
            <FaCalendarCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">Leave Balance</h1>
            <p className="text-gray-600">Track and manage your leave allocations</p>
          </div>
        </div>
        <button
          onClick={fetchLeaveBalances}
          className="p-3 text-gray-600 hover:text-indigo-600 transition-colors rounded-xl hover:bg-indigo-50 group"
          title="Refresh Data"
        >
          <FaSync className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchLeaveBalances} />
      ) : leaveBalances ? (
        <>
          {renderCharts()}
          {renderLeaveTypes()}
        </>
      ) : null}
    </div>
  );
}

export default function ViewLeavePage() {
  return (
    <DashboardLayout>
      <ViewLeaveContent />
    </DashboardLayout>
  );
} 