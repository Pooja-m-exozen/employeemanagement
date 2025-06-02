import type { 
  BirthdayResponse, 
  WorkAnniversaryResponse, 
  LeaveBalanceResponse, 
  MonthlyStats, 
  DepartmentStats,
  LeaveRequestForm,
  RegularizationForm,
  DocumentUploadResponse
} from '../types/dashboard';

const BASE_URL = 'https://cafm.zenapi.co.in/api';

const handleResponse = async (response: Response) => {
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    // If the response is not JSON, try to get the text for better error reporting
    const text = await response.text();
    throw new Error(`Expected JSON response but got ${contentType}. Server response: ${text.substring(0, 200)}...`);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const getDashboardData = async (): Promise<{
  birthdays: BirthdayResponse;
  anniversaries: WorkAnniversaryResponse;
}> => {
  try {
    // Fetch both birthday and anniversary data in parallel
    const [birthdayRes, anniversaryRes] = await Promise.all([
      fetch(`${BASE_URL}/kyc/birthdays/today`),
      fetch(`${BASE_URL}/kyc/work-anniversaries/today`)
    ]);

    // Handle responses
    const birthdays = await handleResponse(birthdayRes);
    const anniversaries = await handleResponse(anniversaryRes);

    // Return both in a single object
    return {
      birthdays,
      anniversaries
    };

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};



export const getMonthlyStats = async (
  employeeId: string,
  month: number,
  year: number
): Promise<MonthlyStats> => {
  try {
    const response = await fetch(
      `${BASE_URL}/attendance/${employeeId}/monthly-stats?month=${month}&year=${year}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    throw error;
  }
};

export const submitLeaveRequest = async (employeeId: string, leaveData: LeaveRequestForm) => {
  try {
    const response = await fetch('/api/leave-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ employeeId, ...leaveData }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error submitting leave request:', error);
    throw error;
  }
};

export const submitRegularization = async (employeeId: string, data: RegularizationForm) => {
  try {
    const response = await fetch(`${BASE_URL}/attendance/regularize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ employeeId, ...data }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error submitting regularization:', error);
    throw error;
  }
};

export const uploadDocument = async (
  employeeId: string,
  file: File,
  type: string,
  description: string
): Promise<DocumentUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('employeeId', employeeId);
    formData.append('type', type);
    formData.append('description', description);

    const response = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      },
      body: formData,
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const getDepartmentStats = async (): Promise<DepartmentStats> => {
  try {
    const response = await fetch(`${BASE_URL}/departments/stats`);
    if (!response.ok) {
      throw new Error('Failed to fetch department stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching department stats:', error);
    throw error;
  }
};

export const getLeaveBalance = async (employeeId: string): Promise<LeaveBalanceResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/leave/balance/${employeeId}`, {
      headers: {
        'Accept': 'application/json'
      }
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    throw error;
  }
};

export const fetchDashboardSummary = async (
  employeeId: string,
  month: number,
  year: number
) => {
  const [monthlyStats, leaveBalance, dashboardData] = await Promise.all([
    getMonthlyStats(employeeId, month, year),
    getLeaveBalance(employeeId),
    getDashboardData(employeeId, month, year),
  ]);
  return {
    monthlyStats,
    leaveBalance,
    birthdays: dashboardData.birthdays,
    anniversaries: dashboardData.anniversaries,
    attendanceActivities: dashboardData.attendanceActivities,
  };
};