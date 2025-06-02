"use client";

import React, { ReactNode, useState, useEffect } from 'react';
import type { JSX } from 'react';
import Image from 'next/image';
import { FaUserFriends, FaBuilding, FaFileAlt, FaTachometerAlt, FaSignOutAlt, FaChevronRight, FaPlus, FaChevronLeft, FaMinus, FaUser, FaCalendarAlt, FaMoneyBillWave, FaTasks, FaReceipt, FaHeadset, FaFileContract, FaDoorOpen, FaBell, FaSearch, FaIdCard, FaEnvelope, FaTimes, FaBars, FaCog, FaEdit, FaUserCheck, FaCalendarCheck, FaClipboardCheck, FaHistory } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { logout, isAuthenticated, getUserRole, getEmployeeId } from '@/services/auth';
import { UserContext } from '@/context/UserContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  icon: JSX.Element;
  label: string;
  href?: string;
  subItems?: MenuItem[];
}

interface UserDetails {
  fullName: string;
  employeeId: string;
  email: string;
  employeeImage: string;
  designation: string;
}

const DashboardLayout = ({ children }: DashboardLayoutProps): JSX.Element => {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [isSidebarExpanded, setSidebarExpanded] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        router.replace('/login');
        return;
      }

      const userRole = getUserRole();
      if (!userRole) {
        logout();
        router.replace('/login');
        return;
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const employeeId = getEmployeeId();
        if (!employeeId) {
          console.error('No employee ID found');
          setLoading(false);
          return;
        }

        const response = await fetch(`https://cafm.zenapi.co.in/api/kyc/${employeeId}`);
        const data = await response.json();
        if (data.kycData) {
          setUserDetails({
            fullName: data.kycData.personalDetails.fullName,
            employeeId: data.kycData.personalDetails.employeeId,
            email: data.kycData.personalDetails.email,
            employeeImage: data.kycData.personalDetails.employeeImage,
            designation: data.kycData.personalDetails.designation
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, []);

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const toggleSidebar = () => {
    setSidebarExpanded(!isSidebarExpanded);
  };

  const handleMenuClick = (href: string) => {
    router.push(href);
  };

  const getMenuItemsByRole = (): MenuItem[] => {
    const role = getUserRole();
    
    return [
      {
        icon: <FaTachometerAlt />,
        label: 'Dashboard',
        href: '/dashboard'
      },
      {
        icon: <FaUser />,
        label: 'KYC',
        subItems: [
          {
            icon: <FaIdCard />,
            label: 'View KYC',
            href: '/kyc'
          },
          {
            icon: <FaFileAlt />,
            label: 'Upload Documents',
            href: '/kyc/upload'
          },
          {
            icon: <FaEdit />,
            label: 'Edit KYC',
            href: '/kyc/edit'
          }
        ]
      },
      {
        icon: <FaCalendarAlt />,
        label: 'Attendance',
        subItems: [
          {
            icon: <FaUserCheck />,
            label: 'Mark Attendance',
            href: '/attendance/mark'
          },
          {
            icon: <FaCalendarCheck />,
            label: 'View Attendance',
            href: '/attendance/view'
          },
          {
            icon: <FaClipboardCheck />,
            label: 'Regularization',
            href: '/attendance/regularization'
          }
        ]
      },
      {
        icon: <FaFileAlt />,
        label: 'Leave Management',
        subItems: [
          {
            icon: <FaPlus />,
            label: 'Request Leave',
            href: '/leave-management/request'
          },
          {
            icon: <FaHistory />,
            label: 'Leave History',
            href: '/leave-management/history'
          },
          {
            icon: <FaCalendarCheck />,
            label: 'View Leave',
            href: '/leave-management/view'
          }
        ]
      },
      {
        icon: <FaMoneyBillWave />,
        label: 'Payslip',
        href: '/payslip'
      },
      {
        icon: <FaTasks />,
        label: 'Reports',
        subItems: [
          {
            icon: <FaCalendarAlt />,
            label: 'Attendance Report',
            href: '/reports/Attendance'
          },
          {
            icon: <FaFileAlt />,
            label: 'Leave Report',
            href: '/reports/leave'
          }
        ]
      },
      {
        icon: <FaHeadset />,
        label: 'Helpdesk',
        href: '/helpdesk'
      }
    ];
  };

  const menuItems: MenuItem[] = getMenuItemsByRole();

  const renderMenuItem = (item: MenuItem): JSX.Element => {
    const isExpanded = expandedMenus.includes(item.label);
    const isActive = pathname === item.href;
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isParentOfActive = hasSubItems && item.subItems?.some(subItem => pathname === subItem.href);
    
    return (
      <li key={item.label}>
        {hasSubItems ? (
          <div className="space-y-1">
            <button
              onClick={() => toggleMenu(item.label)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300 ease-in-out
                ${(isExpanded || isParentOfActive)
                  ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 text-blue-700 shadow-sm' 
                  : 'text-gray-600 hover:bg-blue-50/50 hover:text-blue-700'
                }
                group relative overflow-hidden
              `}
            >
              <div className="flex items-center min-w-0 relative z-10">
                <span className={`text-xl w-8 transition-all duration-300 transform group-hover:scale-110 ${
                  (isExpanded || isParentOfActive) ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {item.icon}
                </span>
                {isSidebarExpanded && (
                  <span className="font-medium truncate ml-3 tracking-wide">{item.label}</span>
                )}
              </div>
              {isSidebarExpanded && (
                <span className="ml-2 flex-shrink-0">
                  <FaChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'transform rotate-90 text-blue-700' : 'text-gray-500'}`} />
                </span>
              )}
            </button>
            {expandedMenus.includes(item.label) && isSidebarExpanded && item.subItems && (
              <ul className="pl-6 space-y-1 animate-fadeIn">
                {item.subItems.map(subItem => (
                  <li key={subItem.label}>
                    <Link
                      href={subItem.href || '#'}
                      className="w-full flex items-center px-4 py-2.5 text-sm text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200"
                    >
                      <span className="text-sm w-8">{subItem.icon}</span>
                      <span className="font-medium truncate">{subItem.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              if (item.href) {
                handleMenuClick(item.href);
              }
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-300 ease-in-out
              ${isActive 
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md' 
                : 'text-gray-600 hover:bg-blue-50/50 hover:text-blue-600'
              }
              group relative overflow-hidden
            `}
          >
            <span className={`text-xl w-8 transition-all duration-300 transform group-hover:scale-110 ${
              isActive ? 'text-white' : 'text-gray-500'
            }`}>
              {item.icon}
            </span>
            {isSidebarExpanded && (
              <span className="font-medium truncate ml-3 tracking-wide">{item.label}</span>
            )}
          </button>
        )}
      </li>
    );
  };

  const handleProfileImageClick = () => {
    setShowProfileDropdown((prev) => !prev);
  };

  const handleEditProfile = () => {
    setShowProfileDropdown(false);
    setShowEditProfileModal(true);
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleProfileImageUpload = async () => {
    if (!selectedImage) return;
    setUploading(true);
    setUploadError(null);
    try {
      const employeeId = getEmployeeId();
      if (!employeeId) {
        throw new Error('No employee ID found');
      }

      const formData = new FormData();
      formData.append('image', selectedImage);
      const imageUrl = URL.createObjectURL(selectedImage);

      const res = await fetch(`https://cafm.zenapi.co.in/api/kyc/${employeeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeImage: imageUrl }),
      });
      if (!res.ok) throw new Error('Failed to update profile image');
      
      setUserDetails((prev) => prev ? { ...prev, employeeImage: imageUrl } : prev);
      setShowEditProfileModal(false);
      setSelectedImage(null);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar with integrated header */}
      <aside
        className={`fixed inset-y-0 left-0 flex flex-col
          ${isSidebarExpanded ? 'w-72' : 'w-20'}
          bg-white shadow-xl border-r border-gray-100 z-30
          transition-all duration-300 ease-in-out
        `}
      >
        {/* Logo and Toggle */}
        <div className="flex items-center h-16 px-4 border-b border-gray-100/75 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
          <div className={`flex items-center ${isSidebarExpanded ? 'justify-between' : 'justify-center'} w-full`}>
            <div className="flex items-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-20 blur-sm group-hover:opacity-30 transition-opacity duration-300"></div>
                <Image
                  src="/logo-exo .png"
                  alt="Exozen Logo"
                  width={40}
                  height={40}
                  className="relative rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              {isSidebarExpanded && (
                <span className="ml-3 font-bold text-gray-800 text-2xl tracking-wide">Exozen</span>
              )}
            </div>
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-all duration-300 ease-in-out"
              title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarExpanded ? <FaChevronLeft className="w-5 h-5"/> : <FaChevronRight className="w-5 h-5"/>}
            </button>
          </div>
        </div>

        {/* User Profile Section */}
        {userDetails && (
          <div className={`px-4 py-4 border-b border-gray-100/75 bg-white/95 backdrop-blur-sm transition-all duration-300 ease-in-out
            ${isSidebarExpanded ? 'items-start' : 'items-center'}
          `}>
            <div className={`flex ${isSidebarExpanded ? 'items-start space-x-4' : 'flex-col items-center'}`}>
              <div className="relative group flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur-md group-hover:opacity-30 transition-opacity duration-300"></div>
                <img
                  src={userDetails.employeeImage || '/placeholder-user.jpg'}
                  alt={userDetails.fullName}
                  className="relative w-12 h-12 rounded-full object-cover border-2 border-white shadow-md transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              {isSidebarExpanded && (
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{userDetails.fullName}</p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{userDetails.designation}</p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <FaIdCard className="w-3 h-3 mr-1" />
                    <span>{userDetails.employeeId}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <ul className="space-y-2">
            {menuItems.map(renderMenuItem)}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-100/75 bg-white/95 backdrop-blur-sm">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
              bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800
              text-white transition-all duration-300 ease-in-out group
              justify-center font-medium text-sm relative overflow-hidden shadow-md hover:shadow-lg"
          >
            <span className="inline-flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <FaSignOutAlt className="text-xl" />
            </span>
            {isSidebarExpanded && (
              <span className="transition-transform duration-300 group-hover:scale-105">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content with Header */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        isSidebarExpanded ? 'ml-72' : 'ml-20'
      }`}>
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 z-20 sticky top-0 h-[65px] flex items-center">
          <div className="flex items-center justify-between px-8 w-full">
            {/* Left side - Employee ID */}
            <div className="flex items-center">
              {userDetails && (
                <div className="flex items-center space-x-4 text-gray-700">
                  <div className="p-2 bg-gray-100 rounded-lg shadow-sm border border-gray-200 flex-shrink-0">
                    <FaIdCard className="text-2xl text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Employee ID</p>
                    <p className="text-lg font-bold text-blue-700">{userDetails.employeeId}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Notifications and Profile */}
            <div className="flex items-center gap-6">
              {/* Notifications */}
              <button className="relative p-3 rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-all duration-200 group flex-shrink-0">
                <FaBell className="text-2xl text-blue-600" />
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full text-xs font-bold text-white flex items-center justify-center ring-2 ring-white">
                  3
                </span>
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-4 pl-6 border-l border-gray-200">
                {loading ? (
                  <div className="animate-pulse flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                      <div className="h-3 w-20 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ) : (
                  <div className="relative group flex-shrink-0">
                    <div className="relative cursor-pointer">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur-md"></div>
                      <img
                        src={userDetails?.employeeImage || '/placeholder-user.jpg'}
                        alt={userDetails?.fullName || 'User'}
                        className="relative w-12 h-12 rounded-full object-cover border-2 border-white shadow-md transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="hidden group-hover:block absolute right-0 top-full mt-3 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-3 z-50 transform transition-all duration-200 origin-top-right">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-base font-bold text-gray-800 truncate">{userDetails?.fullName}</p>
                        <p className="text-sm font-medium text-blue-600 mt-1 truncate">{userDetails?.designation}</p>
                      </div>
                      <div className="px-4 py-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaIdCard className="mr-3 text-blue-500 text-lg" />
                          <span className="font-medium">{userDetails?.employeeId}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {isSidebarExpanded && !loading && userDetails && (
                  <div className="hidden md:block min-w-0">
                    <p className="text-base font-bold text-gray-800 truncate">{userDetails.fullName}</p>
                    <p className="text-sm font-medium text-gray-500 truncate">{userDetails.designation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8 bg-gray-100 min-h-screen">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed bottom-6 right-6 lg:hidden bg-white text-blue-600 p-4 rounded-full 
          shadow-lg border border-gray-200 hover:bg-blue-50 transition-all duration-200 z-50"
        title="Toggle menu"
      >
        {isMobileMenuOpen ? <FaTimes className="w-6 h-6"/> : <FaBars className="w-6 h-6"/>}
      </button>
    </div>
  );
};

export default DashboardLayout;