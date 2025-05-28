'use client';

import { useState, useEffect } from 'react';
import { FaUser, FaMapMarkerAlt, FaIdCard, FaSpinner, FaSave, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/services/auth';

interface KYCData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    nationality: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  identityInfo: {
    aadharNumber: string;
    panNumber: string;
    passportNumber?: string;
  };
}

const initialKYCData: KYCData = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
  },
  address: {
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  },
  identityInfo: {
    aadharNumber: '',
    panNumber: '',
    passportNumber: '',
  },
};

const validateAndTransformKYCData = (data: any): KYCData => {
  return {
    personalInfo: {
      fullName: data?.personalInfo?.fullName || '',
      email: data?.personalInfo?.email || '',
      phone: data?.personalInfo?.phone || '',
      dateOfBirth: data?.personalInfo?.dateOfBirth || '',
      gender: data?.personalInfo?.gender || '',
      nationality: data?.personalInfo?.nationality || '',
    },
    address: {
      street: data?.address?.street || '',
      city: data?.address?.city || '',
      state: data?.address?.state || '',
      country: data?.address?.country || '',
      postalCode: data?.address?.postalCode || '',
    },
    identityInfo: {
      aadharNumber: data?.identityInfo?.aadharNumber || '',
      panNumber: data?.identityInfo?.panNumber || '',
      passportNumber: data?.identityInfo?.passportNumber || '',
    },
  };
};

export default function EditKYC() {
  const router = useRouter();
  const [kycData, setKYCData] = useState<KYCData>(initialKYCData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchKYCData();
  }, [router]);

  const fetchKYCData = async () => {
    try {
      const response = await fetch('https://cafm.zenapi.co.in/api/kyc/EFMS3295');
      if (!response.ok) {
        throw new Error('Failed to fetch KYC data');
      }
      const data = await response.json();
      
      // Validate and transform the data
      const transformedData = validateAndTransformKYCData(data);
      setKYCData(transformedData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch KYC data');
      setKYCData(initialKYCData); // Set to initial state on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('https://cafm.zenapi.co.in/api/kyc/EFMS3295', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(kycData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update KYC information');
      }

      setSuccess('KYC information updated successfully!');
      
      // Update local state with validated response data
      const transformedData = validateAndTransformKYCData(data);
      setKYCData(transformedData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update KYC information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error && !kycData) {
    return (
      <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
        <FaExclamationCircle className="w-5 h-5 flex-shrink-0" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <FaUser className="text-blue-600" />
          Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={kycData.personalInfo.fullName}
              onChange={(e) => setKYCData({
                ...kycData,
                personalInfo: { ...kycData.personalInfo, fullName: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={kycData.personalInfo.email}
              onChange={(e) => setKYCData({
                ...kycData,
                personalInfo: { ...kycData.personalInfo, email: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={kycData.personalInfo.phone}
              onChange={(e) => setKYCData({
                ...kycData,
                personalInfo: { ...kycData.personalInfo, phone: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={kycData.personalInfo.dateOfBirth}
              onChange={(e) => setKYCData({
                ...kycData,
                personalInfo: { ...kycData.personalInfo, dateOfBirth: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              value={kycData.personalInfo.gender}
              onChange={(e) => setKYCData({
                ...kycData,
                personalInfo: { ...kycData.personalInfo, gender: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nationality
            </label>
            <input
              type="text"
              value={kycData.personalInfo.nationality}
              onChange={(e) => setKYCData({
                ...kycData,
                personalInfo: { ...kycData.personalInfo, nationality: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <FaMapMarkerAlt className="text-blue-600" />
          Address Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              value={kycData.address.street}
              onChange={(e) => setKYCData({
                ...kycData,
                address: { ...kycData.address, street: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
            </label>
            <input
              type="text"
              value={kycData.address.city}
              onChange={(e) => setKYCData({
                ...kycData,
                address: { ...kycData.address, city: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State
            </label>
            <input
              type="text"
              value={kycData.address.state}
              onChange={(e) => setKYCData({
                ...kycData,
                address: { ...kycData.address, state: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <input
              type="text"
              value={kycData.address.country}
              onChange={(e) => setKYCData({
                ...kycData,
                address: { ...kycData.address, country: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postal Code
            </label>
            <input
              type="text"
              value={kycData.address.postalCode}
              onChange={(e) => setKYCData({
                ...kycData,
                address: { ...kycData.address, postalCode: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>
      </div>

      {/* Identity Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <FaIdCard className="text-blue-600" />
          Identity Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aadhar Number
            </label>
            <input
              type="text"
              value={kycData.identityInfo.aadharNumber}
              onChange={(e) => setKYCData({
                ...kycData,
                identityInfo: { ...kycData.identityInfo, aadharNumber: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PAN Number
            </label>
            <input
              type="text"
              value={kycData.identityInfo.panNumber}
              onChange={(e) => setKYCData({
                ...kycData,
                identityInfo: { ...kycData.identityInfo, panNumber: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passport Number (Optional)
            </label>
            <input
              type="text"
              value={kycData.identityInfo.passportNumber}
              onChange={(e) => setKYCData({
                ...kycData,
                identityInfo: { ...kycData.identityInfo, passportNumber: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
          <FaExclamationCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
          <FaCheckCircle className="w-5 h-5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className={`px-6 py-3 rounded-lg text-white font-medium transition-all ${
            saving
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <FaSpinner className="animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <FaSave />
              Save Changes
            </span>
          )}
        </button>
      </div>
    </form>
  );
} 