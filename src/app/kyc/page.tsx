'use client';

import { useEffect, useState } from 'react';
import { FaSpinner, FaSearch, FaEye, FaTimes, FaFilter, FaEdit, FaFileAlt, FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaTimesCircle, FaExclamationCircle } from 'react-icons/fa';
import { isAuthenticated, isEmployee, getUserRole } from '@/services/auth';
import { useRouter } from 'next/navigation';

interface KYCResponse {
  message: string;
  kycData: {
    personalDetails: {
      employeeId: string;
      projectName: string;
      fullName: string;
      fathersName: string;
      mothersName: string;
      gender: string;
      dob: string;
      phoneNumber: string;
      designation: string;
      dateOfJoining: string;
      nationality: string;
      religion: string;
      maritalStatus: string;
      bloodGroup: string;
      uanNumber: string;
      esicNumber: string;
      experience: string;
      educationalQualification: string;
      languages: string[];
      employeeImage: string;
      email: string;
      workType: string;
    };
    addressDetails: {
      permanentAddress: {
        state: string;
        city: string;
        street: string;
        postalCode: string;
      };
      currentAddress: {
        state: string;
        city: string;
        street: string;
        postalCode: string;
      };
    };
    bankDetails: {
      bankName: string;
      branchName: string;
      accountNumber: string;
      ifscCode: string;
    };
    identificationDetails: {
      identificationType: string;
      identificationNumber: string;
    };
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
      aadhar: string;
    };
    _id: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    documents: Array<{
      type: string;
      url: string;
      uploadedAt: string;
      _id: string;
    }>;
  };
}

export default function ViewKYC() {
  const router = useRouter();
  const [kycResponse, setKYCResponse] = useState<KYCResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setKYCResponse(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch KYC data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <FaSpinner className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
        <FaTimesCircle className="w-5 h-5" />
        {error}
      </div>
    );
  }

  if (!kycResponse?.kycData) {
    return (
      <div className="bg-yellow-50 text-yellow-600 p-4 rounded-lg flex items-center gap-2">
        <FaExclamationCircle className="w-5 h-5" />
        No KYC data available
      </div>
    );
  }

  const { kycData } = kycResponse;

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FaUser className="text-blue-600" />
          Personal Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="md:col-span-2 lg:col-span-3">
            <div className="flex items-center gap-4">
              {kycData.personalDetails.employeeImage && (
                <img
                  src={kycData.personalDetails.employeeImage}
                  alt="Employee"
                  className="w-24 h-24 rounded-full object-cover"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold">{kycData.personalDetails.fullName}</h3>
                <p className="text-gray-600">{kycData.personalDetails.employeeId} - {kycData.personalDetails.designation}</p>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Project Name</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.personalDetails.projectName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Father's Name</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.personalDetails.fathersName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Mother's Name</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.personalDetails.mothersName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Date of Birth</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.personalDetails.dob}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Phone Number</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.personalDetails.phoneNumber}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.personalDetails.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Date of Joining</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.personalDetails.dateOfJoining}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Work Type</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.personalDetails.workType}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Experience</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.personalDetails.experience}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Education</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.personalDetails.educationalQualification}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Languages</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.personalDetails.languages.join(', ')}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Blood Group</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.personalDetails.bloodGroup}</p>
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FaMapMarkerAlt className="text-blue-600" />
          Address Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Permanent Address</h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Street</label>
                <p className="text-gray-900 font-medium mt-1">{kycData.addressDetails.permanentAddress.street}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">City</label>
                <p className="text-gray-900 font-medium mt-1">{kycData.addressDetails.permanentAddress.city}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">State</label>
                <p className="text-gray-900 font-medium mt-1">{kycData.addressDetails.permanentAddress.state}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Postal Code</label>
                <p className="text-gray-900 font-medium mt-1">{kycData.addressDetails.permanentAddress.postalCode}</p>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Current Address</h3>
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium text-gray-500">Street</label>
                <p className="text-gray-900 font-medium mt-1">{kycData.addressDetails.currentAddress.street}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">City</label>
                <p className="text-gray-900 font-medium mt-1">{kycData.addressDetails.currentAddress.city}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">State</label>
                <p className="text-gray-900 font-medium mt-1">{kycData.addressDetails.currentAddress.state}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Postal Code</label>
                <p className="text-gray-900 font-medium mt-1">{kycData.addressDetails.currentAddress.postalCode}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FaFileAlt className="text-blue-600" />
          Bank Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Bank Name</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.bankDetails.bankName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Branch Name</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.bankDetails.branchName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Account Number</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.bankDetails.accountNumber}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">IFSC Code</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.bankDetails.ifscCode}</p>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FaPhone className="text-blue-600" />
          Emergency Contact
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">Name</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.emergencyContact.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Phone</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.emergencyContact.phone}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Relationship</label>
            <p className="text-gray-900 font-medium mt-1">{kycData.emergencyContact.relationship}</p>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Uploaded Documents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {kycData.documents.map((doc) => (
            <div key={doc._id} className="space-y-2">
              <label className="text-sm font-medium text-gray-500">{doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}</label>
              <div className="aspect-[3/2] rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={doc.url}
                  alt={doc.type}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-gray-500">
                Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}