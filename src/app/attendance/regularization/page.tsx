'use client';

import { useState, useEffect } from 'react';
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaHistory, 
  FaCalendarAlt, 
  FaClock, 
  FaEdit, 
  FaTrash, 
  FaCheck, 
  FaTimes,
  FaClipboardCheck,
  FaSync,
  FaFilter,
  FaSearch,
  FaChevronDown
} from 'react-icons/fa';
import { isAuthenticated } from '@/services/auth';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface RegularizationRequest {
  date: string;
  punchInTime: string;
  punchOutTime: string;
  reason: string;
  status: string;
}

interface RegularizationHistoryItem {
  date: string;
  status: string;
  punchInTime: string;
  punchOutTime: string;
  reason: string;
  appliedOn: string;
  actionStatus: string;
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

function RegularizationContent() {
  const router = useRouter();
  const [regularizationLoading, setRegularizationLoading] = useState(false);
  const [regularizationError, setRegularizationError] = useState<string | null>(null);
  const [regularizationSuccess, setRegularizationSuccess] = useState<string | null>(null);
  const [regularizationForm, setRegularizationForm] = useState<RegularizationRequest>({
    date: '',
    punchInTime: '',
    punchOutTime: '',
    reason: '',
    status: 'Present'
  });
  const [regularizationHistory, setRegularizationHistory] = useState<RegularizationHistoryItem[]>([]);
  const [regularizationHistoryLoading, setRegularizationHistoryLoading] = useState(true);
  const [regularizationHistoryError, setRegularizationHistoryError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchRegularizationHistory();
  }, [router]);

  const fetchRegularizationHistory = async () => {
    try {
      setRegularizationHistoryLoading(true);
      setRegularizationHistoryError(null);

      // For development, use mock data
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        const mockHistory: RegularizationHistoryItem[] = Array.from({ length: 10 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: ['Present', 'Half Day', 'Work From Home'][Math.floor(Math.random() * 3)],
          punchInTime: '09:00',
          punchOutTime: '18:00',
          reason: 'System issue with attendance marking',
          appliedOn: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          actionStatus: ['Pending', 'Approved', 'Rejected'][Math.floor(Math.random() * 3)]
        }));
        setRegularizationHistory(mockHistory);
        return;
      }

      const response = await fetch('https://cafm.zenapi.co.in/api/attendance/EFMS3295/regularization-history');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch regularization history');
      }

      if (data.success && Array.isArray(data.history)) {
        setRegularizationHistory(data.history);
      } else {
        setRegularizationHistory([]);
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch regularization history');
        }
      }
    } catch (error: any) {
      setRegularizationHistoryError(error.message || 'Failed to fetch regularization history');
      setRegularizationHistory([]);
    } finally {
      setRegularizationHistoryLoading(false);
    }
  };

  const handleRegularizationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegularizationLoading(true);
    setRegularizationError(null);
    setRegularizationSuccess(null);

    try {
      // For development, simulate API call
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRegularizationSuccess('Regularization request submitted successfully!');
        setRegularizationForm({
          date: '',
          punchInTime: '',
          punchOutTime: '',
          reason: '',
          status: 'Present'
        });
        setShowForm(false);
        fetchRegularizationHistory();
        return;
      }

      const response = await fetch('https://cafm.zenapi.co.in/api/attendance/regularize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: 'EFMS3295',
          ...regularizationForm,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRegularizationSuccess('Regularization request submitted successfully!');
        setRegularizationForm({
          date: '',
          punchInTime: '',
          punchOutTime: '',
          reason: '',
          status: 'Present'
        });
        setShowForm(false);
        fetchRegularizationHistory();
      } else {
        throw new Error(data.message || 'Failed to submit regularization request');
      }
    } catch (error: any) {
      setRegularizationError(error.message || 'Failed to submit regularization request');
    } finally {
      setRegularizationLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRegularizationForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  const filteredHistory = regularizationHistory.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.actionStatus.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl">
            <FaClipboardCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Attendance Regularization</h1>
            <p className="text-gray-600">Request attendance corrections and view history</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          {showForm ? <FaTimes className="w-4 h-4" /> : <FaEdit className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Request'}
        </button>
      </div>

      {/* Form Section */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <form onSubmit={handleRegularizationSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={regularizationForm.date}
                    onChange={handleInputChange}
                    required
                    className="pl-10 w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={regularizationForm.status}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Present">Present</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Work From Home">Work From Home</option>
                </select>
              </div>

              <div>
                <label htmlFor="punchInTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Punch In Time
                </label>
                <div className="relative">
                  <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    id="punchInTime"
                    name="punchInTime"
                    value={regularizationForm.punchInTime}
                    onChange={handleInputChange}
                    required
                    className="pl-10 w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="punchOutTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Punch Out Time
                </label>
                <div className="relative">
                  <FaClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="time"
                    id="punchOutTime"
                    name="punchOutTime"
                    value={regularizationForm.punchOutTime}
                    onChange={handleInputChange}
                    required
                    className="pl-10 w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Regularization
              </label>
              <textarea
                id="reason"
                name="reason"
                value={regularizationForm.reason}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Please provide a detailed reason for attendance regularization..."
              />
            </div>

            {regularizationError && (
              <FeedbackMessage message={regularizationError} type="error" />
            )}

            {regularizationSuccess && (
              <FeedbackMessage message={regularizationSuccess} type="success" />
            )}

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={regularizationLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {regularizationLoading ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaCheck className="w-4 h-4" />
                    Submit Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FaHistory className="text-gray-400" />
              Regularization History
            </h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-auto pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-white pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <button
                onClick={fetchRegularizationHistory}
                className="p-2 text-gray-600 hover:text-blue-600 transition-colors rounded-lg hover:bg-gray-50"
                title="Refresh"
              >
                <FaSync className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {regularizationHistoryLoading ? (
          <LoadingSpinner />
        ) : regularizationHistoryError ? (
          <div className="p-8 text-center">
            <FeedbackMessage message={regularizationHistoryError} type="error" />
            <button
              onClick={fetchRegularizationHistory}
              className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
            >
              <FaSync className="w-4 h-4" />
              Try Again
            </button>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <FaHistory className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium">No regularization history found</p>
            <p className="text-sm mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search filters'
                : 'Submit a new regularization request to see it here'}
            </p>
            {(searchQuery || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied On
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHistory.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{new Date(item.date).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.status}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.punchInTime} - {item.punchOutTime}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={item.reason}>
                        {item.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(item.appliedOn).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusBadgeClass(item.actionStatus)
                      }`}>
                        {item.actionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegularizationPage() {
  return (
    <DashboardLayout>
      <RegularizationContent />
    </DashboardLayout>
  );
} 