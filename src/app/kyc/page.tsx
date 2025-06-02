'use client';

import { useEffect, useState } from 'react';
import { FaSpinner, FaSearch, FaEye, FaTimes, FaFilter, FaEdit, FaFileAlt, FaUser, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaTimesCircle, FaExclamationCircle, FaCheckCircle, FaHome, FaUserCircle, FaBuilding, FaAddressCard, FaQuestionCircle, FaInfoCircle, FaLightbulb, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { isAuthenticated, isEmployee, getUserRole } from '@/services/auth';
import { useRouter } from 'next/navigation';
import { Tab } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip } from 'react-tooltip';

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
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ViewKYC() {
export default function ViewKYC() {
  const router = useRouter();
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
    fetchKYCData();
  }, [router]);

  const fetchKYCData = async () => {
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
      className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8 relative"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl flex items-center gap-3 max-w-lg w-full shadow-lg">
          <FaTimesCircle className="w-6 h-6 flex-shrink-0" />
          <p className="text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!kycResponse?.kycData) {
  if (!kycResponse?.kycData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-yellow-50 text-yellow-600 p-6 rounded-2xl flex items-center gap-3 max-w-lg w-full shadow-lg">
          <FaExclamationCircle className="w-6 h-6 flex-shrink-0" />
          <p className="text-lg font-medium">No KYC data available</p>
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
    <div className="w-80 h-screen overflow-y-auto bg-white shadow-lg z-40 hidden lg:block">
      <div className="h-full flex flex-col">
        {/* Profile Section */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            {kycData.personalDetails.employeeImage ? (
              <div className="relative">
                <img
                  src={kycData.personalDetails.employeeImage}
                  alt="Employee"
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-blue-100"
                />
                <div className="absolute -bottom-2 -right-2">
                  <div className={classNames(
                    'w-5 h-5 rounded-full border-2 border-white',
                    kycData.status.toLowerCase() === 'approved' ? 'bg-green-500' :
                    kycData.status.toLowerCase() === 'pending' ? 'bg-yellow-500' :
                    'bg-red-500'
                  )}/>
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                <FaUser className="w-8 h-8 text-blue-500" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
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
    <div className="sticky top-0 z-40 lg:hidden">
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {kycData.personalDetails.employeeImage ? (
                <img
                  src={kycData.personalDetails.employeeImage}
                  alt="Employee"
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <FaUser className="w-5 h-5 text-blue-500" />
                </div>
              )}
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {kycData.personalDetails.fullName}
                </h2>
                <p className="text-sm text-gray-500">{kycData.personalDetails.employeeId}</p>
              </div>
            </div>
            <button
              onClick={() => setShowQuickNav(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <FaFilter className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedTab(item.id)}
                className={classNames(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                  selectedTab === item.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
                {completionStatus[item.key] && (
                  <FaCheckCircle className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
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
    <div className="min-h-screen bg-gray-50 lg:flex">
      {/* Left Navigation */}
      <LeftNavigation />

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
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <FaUser className="text-blue-600 w-6 h-6" />
                        <h2 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                          Personal Information
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FaInfoCircle className="w-4 h-4" />
                        <span>All fields marked with * are required</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 mb-8">
                      <p className="text-sm text-blue-700">
                        Your personal information helps us verify your identity and maintain accurate records. Please ensure all details are current and accurate.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[
                        { 
                          label: 'Project Name', 
                          value: kycData.personalDetails.projectName, 
                          icon: FaBuilding,
                          tooltip: 'The name of the project you are currently assigned to'
                        },
                        { 
                          label: "Father's Name", 
                          value: kycData.personalDetails.fathersName, 
                          icon: FaUser,
                          tooltip: 'Your father\'s full legal name'
                        },
                        { 
                          label: "Mother's Name", 
                          value: kycData.personalDetails.mothersName, 
                          icon: FaUser,
                          tooltip: 'Your mother\'s full legal name'
                        },
                        { 
                          label: 'Date of Birth', 
                          value: kycData.personalDetails.dob, 
                          icon: FaIdCard,
                          tooltip: 'Your date of birth'
                        },
                        { 
                          label: 'Phone Number', 
                          value: kycData.personalDetails.phoneNumber, 
                          icon: FaPhone,
                          tooltip: 'Your contact phone number'
                        },
                        { 
                          label: 'Email', 
                          value: kycData.personalDetails.email, 
                          icon: FaEnvelope,
                          tooltip: 'Your email address'
                        },
                        { 
                          label: 'Date of Joining', 
                          value: kycData.personalDetails.dateOfJoining, 
                          icon: FaBuilding,
                          tooltip: 'The date you started working for the company'
                        },
                        { 
                          label: 'Work Type', 
                          value: kycData.personalDetails.workType, 
                          icon: FaBuilding,
                          tooltip: 'The type of work you do'
                        },
                        { 
                          label: 'Experience', 
                          value: kycData.personalDetails.experience, 
                          icon: FaIdCard,
                          tooltip: 'Your total years of work experience'
                        },
                        { 
                          label: 'Education', 
                          value: kycData.personalDetails.educationalQualification, 
                          icon: FaIdCard,
                          tooltip: 'Your highest level of education'
                        },
                        { 
                          label: 'Languages', 
                          value: kycData.personalDetails.languages.join(', '), 
                          icon: FaIdCard,
                          tooltip: 'The languages you can speak'
                        },
                        { 
                          label: 'Blood Group', 
                          value: kycData.personalDetails.bloodGroup, 
                          icon: FaIdCard,
                          tooltip: 'Your blood group'
                        }
                      ].map((field, index) => (
                        <motion.div
                          key={field.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                          className="group bg-gray-50 hover:bg-gray-100 rounded-xl p-6 transition-all duration-200"
                          data-tooltip-id={`field-${field.label}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-blue-100/50 text-blue-600">
                              <field.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">{field.label}</label>
                              <p className="text-gray-900 font-medium mt-1">{field.value}</p>
                            </div>
                          </div>
                          <Tooltip id={`field-${field.label}`}>{field.tooltip}</Tooltip>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}

              {selectedTab === 1 && (
                <div className="space-y-8">
                  <motion.div 
                    className="p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <FaMapMarkerAlt className="text-blue-600 w-6 h-6" />
                        <h2 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                          Address Information
                        </h2>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 mb-8">
                      <p className="text-sm text-blue-700">
                        Please provide both your permanent and current addresses. This information is crucial for official communications and documentation.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {['Permanent', 'Current'].map((type, index) => (
                        <motion.div
                          key={type}
                          initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.2 }}
                          className="bg-gray-50 hover:bg-gray-100 rounded-xl p-6 transition-all duration-200"
                        >
                          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-900">
                            <div className="p-2 rounded-lg bg-blue-100/50">
                              <FaMapMarkerAlt className="text-blue-600 w-5 h-5" />
                            </div>
                            {type} Address
                            <div 
                              className="ml-2 text-blue-600 cursor-help"
                              data-tooltip-id={`address-${type}`}
                            >
                              <FaInfoCircle className="w-4 h-4" />
                            </div>
                            <Tooltip id={`address-${type}`}>
                              {type === 'Permanent' ? 
                                'Your permanent residential address as per official records' : 
                                'Your current residential address where you presently reside'
                              }
                            </Tooltip>
                          </h3>
                          <div className="space-y-4">
                            {['street', 'city', 'state', 'postalCode'].map((field) => (
                              <div 
                                key={field} 
                                className="group bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-all duration-200"
                                data-tooltip-id={`${type}-${field}`}
                              >
                                <label className="text-sm font-medium text-gray-500 capitalize">
                                  {field.replace(/([A-Z])/g, ' $1').trim()}
                                </label>
                                <p className="text-gray-900 font-medium mt-1">
                                  {kycData.addressDetails[type.toLowerCase() === 'permanent' ? 'permanentAddress' : 'currentAddress'][field as keyof typeof kycData.addressDetails.permanentAddress]}
                                </p>
                                <Tooltip id={`${type}-${field}`}>
                                  {getAddressFieldTooltip(field)}
                                </Tooltip>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}

              {selectedTab === 2 && (
                <div className="space-y-8">
                  <motion.div 
                    className="p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <FaBuilding className="text-blue-600 w-6 h-6" />
                        <h2 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                          Bank Details
                        </h2>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 mb-8">
                      <div className="flex items-start gap-3">
                        <FaInfoCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-700 mb-2">
                            Your bank account details are required for salary disbursement and other financial transactions.
                          </p>
                          <ul className="text-sm text-blue-600 list-disc list-inside space-y-1">
                            <li>Ensure the account is active and in your name</li>
                            <li>Double-check the IFSC code for accuracy</li>
                            <li>Provide a cancelled cheque for verification</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { 
                          label: 'Bank Name', 
                          value: kycData.bankDetails.bankName, 
                          icon: FaBuilding,
                          tooltip: 'Name of your bank where you hold the account'
                        },
                        { 
                          label: 'Branch Name', 
                          value: kycData.bankDetails.branchName, 
                          icon: FaBuilding,
                          tooltip: 'The specific branch where your account is maintained'
                        },
                        { 
                          label: 'Account Number', 
                          value: kycData.bankDetails.accountNumber, 
                          icon: FaIdCard,
                          tooltip: 'Your bank account number',
                          sensitive: true
                        },
                        { 
                          label: 'IFSC Code', 
                          value: kycData.bankDetails.ifscCode, 
                          icon: FaIdCard,
                          tooltip: 'Indian Financial System Code of your bank branch'
                        }
                      ].map((field, index) => (
                        <motion.div
                          key={field.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="group bg-gray-50 hover:bg-gray-100 rounded-xl p-6 transition-all duration-200"
                          data-tooltip-id={`bank-${field.label}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-blue-100/50 text-blue-600">
                              <field.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <label className="text-sm font-medium text-gray-500">{field.label}</label>
                              <p className="text-gray-900 font-medium mt-1 flex items-center gap-2">
                                {field.sensitive ? (
                                  <>
                                    {'•'.repeat(field.value.length - 4)}
                                    {field.value.slice(-4)}
                                    <button 
                                      className="text-blue-600 hover:text-blue-700 transition-colors"
                                      onClick={() => {/* Add show/hide functionality */}}
                                      data-tooltip-id={`show-${field.label}`}
                                    >
                                      <FaEye className="w-4 h-4" />
                                    </button>
                                    <Tooltip id={`show-${field.label}`}>Show/Hide {field.label}</Tooltip>
                                  </>
                                ) : (
                                  field.value
                                )}
                              </p>
                            </div>
                          </div>
                          <Tooltip id={`bank-${field.label}`}>{field.tooltip}</Tooltip>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}

              {selectedTab === 3 && (
                <div className="space-y-8">
                  <motion.div 
                    className="p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-8 flex items-center gap-3">
                      <FaPhone className="text-blue-600" />
                      Emergency Contact
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { label: 'Name', value: kycData.emergencyContact.name, icon: FaUser },
                        { label: 'Phone', value: kycData.emergencyContact.phone, icon: FaPhone },
                        { label: 'Relationship', value: kycData.emergencyContact.relationship, icon: FaUserCircle }
                      ].map((field, index) => (
                        <motion.div
                          key={field.label}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="group bg-gray-50 hover:bg-gray-100 rounded-xl p-6 transition-all duration-200"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-lg bg-blue-100/50 text-blue-600">
                              <field.icon className="w-5 h-5" />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500">{field.label}</label>
                              <p className="text-gray-900 font-medium mt-1 text-lg">{field.value}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}

              {selectedTab === 4 && (
                <div className="space-y-8">
                  <motion.div 
                    className="p-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <FaFileAlt className="text-blue-600 w-6 h-6" />
                        <h2 className="text-2xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                          Documents
                        </h2>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-4 mb-8">
                      <div className="flex items-start gap-3">
                        <FaInfoCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-700 mb-2">
                            Please ensure all uploaded documents are:
                          </p>
                          <ul className="text-sm text-blue-600 list-disc list-inside space-y-1">
                            <li>Clear and legible</li>
                            <li>In valid format (PDF, JPG, PNG)</li>
                            <li>Not exceeding 5MB in size</li>
                            <li>Current and not expired</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {kycData.documents.map((doc, index) => (
                        <motion.div
                          key={doc._id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          className="group relative cursor-pointer bg-gray-50 hover:bg-gray-100 rounded-xl overflow-hidden transition-all duration-200"
                          onClick={() => setSelectedImage(doc.url)}
                          data-tooltip-id={`doc-${doc._id}`}
                        >
                          <div className="aspect-[3/2] overflow-hidden bg-gray-100">
                            {doc.type.toLowerCase().includes('pdf') ? (
                              <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                <FaFileAlt className="w-12 h-12 text-gray-400" />
                              </div>
                            ) : (
                              <img
                                src={doc.url}
                                alt={doc.type}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                            )}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-medium flex items-center gap-2 px-4 py-2 rounded-lg bg-black/20 backdrop-blur-sm">
                              <FaEye className="w-5 h-5" />
                              View Document
                            </span>
                          </div>
                          <div className="p-4">
                            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                              {doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}
                              <span className="text-xs font-normal text-gray-500">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            </h3>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500">
                                {formatFileSize(getFileSize(doc.url))}
                              </span>
                              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                              <span className="text-xs text-gray-500">
                                {getFileExtension(doc.url).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <Tooltip id={`doc-${doc._id}`}>Click to view document</Tooltip>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showQuickNav && <QuickNavigation />}
      </AnimatePresence>
      <HelpButton />
      
      {/* Enhanced Image Modal - Updated with better transitions */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-lg"
            onClick={() => setSelectedImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative max-w-5xl w-full rounded-2xl overflow-hidden bg-white/10 backdrop-blur-xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-[16/9] relative">
                <img
                  src={selectedImage}
                  alt="Document Preview"
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/75 transition-colors"
                >
                  <FaTimesCircle className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}