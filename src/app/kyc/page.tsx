'use client';

import { useEffect, useState } from 'react';
import { FaSpinner, FaSearch, FaEye, FaTimes, FaFilter, FaEdit, FaFileAlt, FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaTimesCircle, FaExclamationCircle,FaUniversity, FaCheckCircle, FaHome, FaUserCircle, FaBuilding, FaAddressCard, FaQuestionCircle, FaInfoCircle, FaLightbulb, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { isAuthenticated, isEmployee, getUserRole, getEmployeeId } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from 'react-tooltip';

// import classNames from 'classnames';

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

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ViewKYC() {
  const router = useRouter();
  const employeeId = getEmployeeId();
  const [kycResponse, setKYCResponse] = useState<KYCResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [activeSection, setActiveSection] = useState('personal');
  const [completionStatus, setCompletionStatus] = useState({
    personal: false,
    address: false,
    bank: false,
    emergency: false,
    documents: false
  });
  const [showQuickNav, setShowQuickNav] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    fetchKYCData();
  }, [router]);

  const fetchKYCData = async () => {
    try {
      if (!employeeId) {
        throw new Error('Employee ID not found');
      }
      const response = await fetch(`https://cafm.zenapi.co.in/api/kyc/${employeeId}`);
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-50 text-green-700 ring-green-600/20';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20';
      case 'rejected':
        return 'bg-red-50 text-red-700 ring-red-600/20';
      default:
        return 'bg-gray-50 text-gray-700 ring-gray-600/20';
    }
  };

  // Calculate completion percentage
  const calculateCompletion = () => {
    const sections = Object.values(completionStatus);
    const completed = sections.filter(Boolean).length;
    return Math.round((completed / sections.length) * 100);
  };

  // Check section completion
  useEffect(() => {
    if (kycResponse?.kycData) {
      const { personalDetails, addressDetails, bankDetails, emergencyContact, documents } = kycResponse.kycData;
      
      setCompletionStatus({
        personal: Object.values(personalDetails).every(val => val !== ''),
        address: Object.values(addressDetails.permanentAddress).every(val => val !== '') && 
                Object.values(addressDetails.currentAddress).every(val => val !== ''),
        bank: Object.values(bankDetails).every(val => val !== ''),
        emergency: Object.values(emergencyContact).every(val => val !== ''),
        documents: documents.length > 0
      });
    }
  }, [kycResponse]);

  // Instructions component
  const Instructions = () => (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl p-6 mb-8 relative"
    >
      <button
        onClick={() => setShowInstructions(false)}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
      >
        <FaTimes className="w-5 h-5" />
      </button>
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-xl">
          <FaLightbulb className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">KYC Instructions</h3>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-center gap-2">
              <FaCheckCircle className="w-4 h-4 text-green-500" />
              Complete all sections for full verification
            </li>
            <li className="flex items-center gap-2">
              <FaCheckCircle className="w-4 h-4 text-green-500" />
              Ensure all documents are clear and legible
            </li>
            <li className="flex items-center gap-2">
              <FaCheckCircle className="w-4 h-4 text-green-500" />
              Keep your information up to date
            </li>
          </ul>
        </div>
      </div>
    </motion.div>
  );

  // Progress Bar component
  const ProgressBar = () => (
    <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">KYC Completion Status</h3>
        <span className="text-sm font-medium text-gray-500">{calculateCompletion()}% Complete</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
          style={{ width: `${calculateCompletion()}%` }}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
        {Object.entries(completionStatus).map(([section, isComplete]) => (
          <div
            key={section}
            className="flex items-center gap-2"
            data-tooltip-id={`section-${section}`}
          >
            {isComplete ? (
              <FaCheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <FaExclamationCircle className="w-4 h-4 text-yellow-500" />
            )}
            <span className="text-sm font-medium capitalize text-gray-700">
              {section}
            </span>
            <Tooltip id={`section-${section}`}>
              {isComplete ? 'Section completed' : 'Section pending completion'}
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  );

  // Help Button component
  const HelpButton = () => (
    <button
      onClick={() => setShowInstructions(true)}
      className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
      data-tooltip-id="help-tooltip"
    >
      <FaQuestionCircle className="w-6 h-6" />
      <Tooltip id="help-tooltip">Need help? Click for instructions</Tooltip>
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-blue-600">
          <FaSpinner className="w-12 h-12" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl flex items-center gap-3 max-w-lg w-full shadow-lg">
          <FaTimesCircle className="w-6 h-6 flex-shrink-0" />
          <p className="text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!kycResponse?.kycData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-yellow-50 text-yellow-600 p-6 rounded-2xl flex items-center gap-3 max-w-lg w-full shadow-lg">
          <FaExclamationCircle className="w-6 h-6 flex-shrink-0" />
          <p className="text-lg font-medium">No KYC data available</p>
        </div>
      </div>
    );
  }

  const { kycData } = kycResponse;
  
  // Fix the TypeScript error by creating a mapping type
  type CompletionStatusKey = 'personal' | 'address' | 'bank' | 'emergency' | 'documents';
  
  // Map navigation items to section keys
  const navigationItems = [
    { icon: FaUserCircle, label: 'Personal Info', id: 0, key: 'personal' as CompletionStatusKey },
    { icon: FaAddressCard, label: 'Address', id: 1, key: 'address' as CompletionStatusKey },
    { icon: FaBuilding, label: 'Bank Details', id: 2, key: 'bank' as CompletionStatusKey },
    { icon: FaPhone, label: 'Emergency Contact', id: 3, key: 'emergency' as CompletionStatusKey },
    { icon: FaFileAlt, label: 'Documents', id: 4, key: 'documents' as CompletionStatusKey },
  ];

  // Helper function for address field tooltips
  const getAddressFieldTooltip = (field: string) => {
    switch (field) {
      case 'street':
        return 'Your street address including house/apartment number';
      case 'city':
        return 'The city or town where you reside';
      case 'state':
        return 'Your state of residence';
      case 'postalCode':
        return 'Your area PIN code';
      default:
        return '';
    }
  };

  // Helper functions for document handling
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileSize = (url: string) => {
    // This is a placeholder. In a real application, you would get the actual file size
    return Math.floor(Math.random() * 5 * 1024 * 1024); // Random size up to 5MB
  };

  const getFileExtension = (url: string) => {
    return url.split('.').pop() || '';
  };

  // Left Side Navigation component
  const LeftNavigation = () => (
    <div className="w-72 h-screen bg-white shadow-lg z-40 hidden lg:block">
      <div className="h-full flex flex-col">
        {/* Profile Section */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            {kycData.personalDetails.employeeImage ? (
              <div className="relative">
                <img
                  src={kycData.personalDetails.employeeImage}
                  alt="Employee"
                  className="w-14 h-14 rounded-xl object-cover ring-2 ring-blue-100"
                />
                <div className="absolute -bottom-1 -right-1">
                  <div className={classNames(
                    'w-4 h-4 rounded-full border-2 border-white',
                    kycData.status.toLowerCase() === 'approved' ? 'bg-green-500' :
                    kycData.status.toLowerCase() === 'pending' ? 'bg-yellow-500' :
                    'bg-red-500'
                  )}/>
                </div>
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                <FaUser className="w-7 h-7 text-blue-500" />
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-gray-900 truncate max-w-[160px]">
                {kycData.personalDetails.fullName}
              </h2>
              <p className="text-sm text-gray-500">{kycData.personalDetails.employeeId}</p>
            </div>
          </div>
          
          {/* Completion Status */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Completion</span>
              <span className="text-sm font-semibold text-blue-600">{calculateCompletion()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${calculateCompletion()}%` }}
              />
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="px-4 space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedTab(item.id)}
                className={classNames(
                  'w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200',
                  selectedTab === item.id
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={classNames(
                    'w-5 h-5',
                    selectedTab === item.id ? 'text-blue-600' : 'text-gray-400'
                  )} />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {completionStatus[item.key] ? (
                    <FaCheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <FaExclamationCircle className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-6 border-t border-gray-100">
          <div className="bg-blue-50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Need Help?</h4>
            <p className="text-sm text-blue-700 mb-3">
              Contact HR support for assistance with your KYC verification.
            </p>
            <a
              href="mailto:hr@support.com"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              <FaEnvelope className="w-4 h-4" />
              hr@support.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile Header
  const MobileHeader = () => (
    <div className="sticky top-0 z-40 lg:hidden bg-white border-b border-gray-200">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {kycData.personalDetails.employeeImage ? (
              <img
                src={kycData.personalDetails.employeeImage}
                alt="Employee"
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FaUser className="w-5 h-5 text-blue-500" />
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-gray-900 truncate max-w-[200px]">
                {kycData.personalDetails.fullName}
              </h2>
              <p className="text-xs text-gray-500">{kycData.personalDetails.employeeId}</p>
            </div>
          </div>
          <button
            onClick={() => setShowQuickNav(true)}
            className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
            aria-label="Open navigation"
          >
            <FaFilter className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedTab(item.id)}
              className={classNames(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                selectedTab === item.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {completionStatus[item.key] && (
                <FaCheckCircle className="w-3 h-3" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Quick Navigation component (updated)
  const QuickNavigation = () => (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50"
    >
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Quick Navigation</h3>
            <button
              onClick={() => setShowQuickNav(false)}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6">
          <div className="px-6 space-y-3">
            {navigationItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedTab(item.id);
                  setShowQuickNav(false);
                }}
                className={classNames(
                  'w-full flex items-center justify-between p-4 rounded-xl transition-all',
                  selectedTab === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50 text-gray-600'
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {completionStatus[item.key] ? (
                    <FaCheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <FaExclamationCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <FaChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-700 mb-2">Need assistance?</p>
            <p className="text-xs text-blue-600">
              Contact HR support at <br />
              <a href="mailto:hr@support.com" className="font-medium">hr@support.com</a>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 font-sans">
      <div className="flex">
        {/* Left Navigation for desktop */}
        <div className="hidden lg:block w-72 min-h-screen bg-white shadow-lg">
          <div className="h-full flex flex-col p-6">
            {/* Profile Section */}
            <div className="flex items-center gap-4 mb-6">
              {kycData.personalDetails.employeeImage ? (
                <div className="relative">
                  <img
                    src={kycData.personalDetails.employeeImage}
                    alt="Employee"
                    className="w-16 h-16 rounded-xl object-cover ring-2 ring-indigo-100"
                  />
                  <div className="absolute -bottom-1 -right-1">
                    <div className={classNames(
                      'w-4 h-4 rounded-full border-2 border-white',
                      getStatusColor(kycData.status)
                    )}/>
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <FaUser className="w-8 h-8 text-indigo-500" />
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {kycData.personalDetails.fullName}
                </h2>
                <p className="text-sm text-gray-500">{kycData.personalDetails.employeeId}</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 -mx-2">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedTab(item.id)}
                  className={classNames(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-1',
                    selectedTab === item.id
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                  {completionStatus[item.key] && (
                    <FaCheckCircle className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto" style={{height: 'calc(100vh - 64px)'}}>
          {/* Mobile Header */}
          <div className="lg:hidden bg-white border-b border-gray-200">
            <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {kycData.personalDetails.employeeImage ? (
                  <img
                    src={kycData.personalDetails.employeeImage}
                    alt="Employee"
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <FaUser className="w-5 h-5 text-indigo-500" />
                  </div>
                )}
                <div className="flex flex-col">
                  <h2 className="text-base font-semibold text-gray-900">
                    {kycData.personalDetails.fullName}
                  </h2>
                  <p className="text-xs text-gray-500">{kycData.personalDetails.employeeId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4 lg:p-6">
            {/* Modern KYC Header */}
            <div className="rounded-2xl mb-8 p-6 flex items-center gap-5 bg-gradient-to-r from-blue-500 to-blue-800 shadow-lg">
              <div className="bg-blue-600 bg-opacity-30 rounded-xl p-4 flex items-center justify-center">
                <FaIdCard className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">View KYC</h1>
                <p className="text-white text-base opacity-90">View and manage your KYC verification details</p>
              </div>
            </div>
            {/* Dynamic Content */}
            {showInstructions && <Instructions />}
            <ProgressBar />
            
            {/* Content sections based on selected tab */}
            <div className="space-y-6 mt-6">
              <AnimatePresence mode="wait">
                {selectedTab === 0 && (
                  <motion.div
                    key="personal"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl shadow-sm p-6"
                  >
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(kycData.personalDetails).map(([key, value]) => 
                        key !== 'employeeImage' && (
                          <div key={key} className="space-y-2">
                            <label className="text-sm font-medium text-gray-500 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <p
                              className={classNames(
                                "text-base font-medium text-gray-900",
                                key === 'email' || key === 'workType' ? "break-all" : ""
                              )}
                              title={Array.isArray(value) ? value.join(', ') : value?.toString() || '-'}
                            >
                              {Array.isArray(value) ? value.join(', ') : value?.toString() || '-'}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </motion.div>
                )}

                {selectedTab === 1 && (
                  <motion.div
                    key="address"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {/* Permanent Address */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Permanent Address
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(kycData.addressDetails.permanentAddress).map(([key, value]) => (
                          <div key={key}>
                            <label className="text-sm font-medium text-gray-500 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <p className="text-base font-medium text-gray-900 mt-1">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Current Address */}
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Current Address
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(kycData.addressDetails.currentAddress).map(([key, value]) => (
                          <div key={key}>
                            <label className="text-sm font-medium text-gray-500 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </label>
                            <p className="text-base font-medium text-gray-900 mt-1">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {selectedTab === 2 && (
                  <motion.div
                    key="bank"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl shadow-sm p-6"
                  >
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Bank Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(kycData.bankDetails).map(([key, value]) => (
                        <div key={key}>
                          <label className="text-sm font-medium text-gray-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <p className="text-base font-medium text-gray-900 mt-1 font-mono">{value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {selectedTab === 3 && (
                  <motion.div
                    key="emergency"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl shadow-sm p-6"
                  >
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Emergency Contact</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(kycData.emergencyContact).map(([key, value]) => (
                        <div key={key}>
                          <label className="text-sm font-medium text-gray-500 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <p className="text-base font-medium text-gray-900 mt-1">{value}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {selectedTab === 4 && (
                  <motion.div
                    key="documents"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl shadow-sm p-6"
                  >
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Documents</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {kycData.documents.map((doc) => (
                        <div key={doc._id} className="flex items-start p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-4">
                            <FaFileAlt className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{doc.type}</h4>
                            <p className="text-sm text-gray-500 mt-1">
                              Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-flex items-center"
                            >
                              <FaEye className="w-4 h-4 mr-1" />
                              View Document
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2">
        <div className="flex justify-around max-w-md mx-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedTab(item.id)}
              className="flex flex-col items-center p-2"
            >
              <item.icon className={classNames(
                'w-5 h-5',
                selectedTab === item.id ? 'text-indigo-600' : 'text-gray-400'
              )} />
              <span className={classNames(
                'text-xs mt-1',
                selectedTab === item.id ? 'text-indigo-600 font-medium' : 'text-gray-500'
              )}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Help Button */}
      <button
        onClick={() => setShowInstructions(true)}
        className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-all z-50"
      >
        <FaQuestionCircle className="w-6 h-6" />
      </button>
    </div>
  );
}