'use client';

import { useState, useEffect } from 'react';
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaHistory,
  FaSearch,
  FaChevronDown,
  FaSync,
  FaCalendarAlt,
  FaClock,
  FaFilter,
  FaTimes,
  FaEye,
  FaDownload,
  FaInfoCircle
} from 'react-icons/fa';
import { isAuthenticated } from '@/services/auth';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface LeaveHistory {
  id: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: string;
  appliedOn: string;
  approvedBy?: string;
  approvedOn?: string;
  remarks?: string;
}

// Enhanced feedback messages with animation
const FeedbackMessage = ({ message, type }: { message: string; type: 'success' | 'error' }) => (
  <div className={`flex items-center gap-2 p-4 rounded-xl animate-fade-in ${
    type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
  }`}>
    {type === 'success' ? <FaCheckCircle className="w-5 h-5" /> : <FaExclamationCircle className="w-5 h-5" />}
    <p className="text-sm font-medium">{message}</p>
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

// Status Badge Class Helper
const getStatusBadgeClass = (status: string) => {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

// Leave Details Modal
const LeaveDetailsModal = ({ leave, onClose }: { leave: LeaveHistory; onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Leave Request Details</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Leave Type</h4>
            <p className="mt-1 text-base font-medium text-gray-900">{leave.leaveType}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Status</h4>
            <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              getStatusBadgeClass(leave.status)
            }`}>
              {leave.status}
            </span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Duration</h4>
            <p className="mt-1 text-base text-gray-900 flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400" />
              {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500">Applied On</h4>
            <p className="mt-1 text-base text-gray-900 flex items-center gap-2">
              <FaClock className="text-gray-400" />
              {new Date(leave.appliedOn).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-500">Reason</h4>
          <p className="mt-1 text-base text-gray-900">{leave.reason}</p>
        </div>
        {leave.approvedBy && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Approved By</h4>
            <p className="mt-1 text-base text-gray-900">{leave.approvedBy}</p>
          </div>
        )}
        {leave.remarks && (
          <div>
            <h4 className="text-sm font-medium text-gray-500">Remarks</h4>
            <p className="mt-1 text-base text-gray-900">{leave.remarks}</p>
          </div>
        )}
      </div>
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

function LeaveHistoryContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leaveHistory, setLeaveHistory] = useState<LeaveHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedLeave, setSelectedLeave] = useState<LeaveHistory | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchLeaveHistory();
  }, [router]);

  const fetchLeaveHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // For development, use mock data
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        const mockHistory: LeaveHistory[] = Array.from({ length: 10 }, (_, i) => ({
          id: `LEAVE${i + 1}`,
          startDate: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(Date.now() - (i * 7 - 2) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          leaveType: ['Annual Leave', 'Sick Leave', 'Personal Leave'][Math.floor(Math.random() * 3)],
          reason: 'Personal commitments and family event',
          status: ['Pending', 'Approved', 'Rejected'][Math.floor(Math.random() * 3)],
          appliedOn: new Date(Date.now() - (i * 7 + 2) * 24 * 60 * 60 * 1000).toISOString(),
          approvedBy: 'John Manager',
          approvedOn: new Date(Date.now() - (i * 7 + 1) * 24 * 60 * 60 * 1000).toISOString(),
          remarks: 'Approved as per policy'
        }));
        setLeaveHistory(mockHistory);
        return;
      }

      const response = await fetch('https://cafm.zenapi.co.in/api/leave/EFMS3295/history');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch leave history');
      }

      if (data.success && Array.isArray(data.history)) {
        setLeaveHistory(data.history);
      } else {
        setLeaveHistory([]);
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch leave history');
        }
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch leave history');
      setLeaveHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilteredHistory = (history: LeaveHistory[]) => {
    const now = new Date();
    switch (dateFilter) {
      case 'last30':
        return history.filter(item => {
          const date = new Date(item.appliedOn);
          return (now.getTime() - date.getTime()) <= 30 * 24 * 60 * 60 * 1000;
        });
      case 'last90':
        return history.filter(item => {
          const date = new Date(item.appliedOn);
          return (now.getTime() - date.getTime()) <= 90 * 24 * 60 * 60 * 1000;
        });
      case 'thisYear':
        return history.filter(item => {
          const date = new Date(item.appliedOn);
          return date.getFullYear() === now.getFullYear();
        });
      default:
        return history;
    }
  };

  const filteredHistory = getDateFilteredHistory(leaveHistory).filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDateFilter('all');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl">
            <FaHistory className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Leave History</h1>
            <p className="text-gray-600">View and track your leave requests</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
            title="Toggle Filters"
          >
            <FaFilter className="w-5 h-5" />
          </button>
          <button
            onClick={fetchLeaveHistory}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
            title="Refresh"
          >
            <FaSync className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear all filters
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none bg-white pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
              <div className="relative">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full appearance-none bg-white pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="last30">Last 30 Days</option>
                  <option value="last90">Last 90 Days</option>
                  <option value="thisYear">This Year</option>
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaHistory className="text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-800">Leave History</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {filteredHistory.length} {filteredHistory.length === 1 ? 'record' : 'records'} found
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="p-8 text-center">
            <FeedbackMessage message={error} type="error" />
            <button
              onClick={fetchLeaveHistory}
              className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
            >
              <FaSync className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaHistory className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No leave history found</p>
            <p className="text-sm mt-1">
              {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search filters'
                : 'Submit a new leave request to see it here'}
            </p>
            {(searchQuery || statusFilter !== 'all' || dateFilter !== 'all') && (
              <button
                onClick={clearFilters}
                className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied On
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.leaveType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <FaCalendarAlt className="w-3 h-3 text-gray-400" />
                          {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusBadgeClass(item.status)
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1">
                          <FaClock className="w-3 h-3 text-gray-400" />
                          {new Date(item.appliedOn).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedLeave(item)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
                          title="View Details"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-100"
                          title="Download"
                        >
                          <FaDownload className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leave Details Modal */}
      {selectedLeave && (
        <LeaveDetailsModal
          leave={selectedLeave}
          onClose={() => setSelectedLeave(null)}
        />
      )}
    </div>
  );
}

export default function LeaveHistoryPage() {
  return (
    <DashboardLayout>
      <LeaveHistoryContent />
    </DashboardLayout>
  );
} 