import React, { ReactNode, useState, useEffect } from 'react';
import type { JSX } from 'react';
import Image from 'next/image';
import { FaUserFriends, FaBuilding, FaFileAlt, FaTachometerAlt, FaSignOutAlt, FaChevronRight, FaPlus, FaChevronLeft, FaMinus, FaUser, FaCalendarAlt, FaMoneyBillWave, FaTasks, FaReceipt, FaHeadset, FaFileContract, FaDoorOpen, FaBell, FaSearch, FaIdCard, FaEnvelope } from 'react-icons/fa';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { logout, isAuthenticated, getUserRole } from '@/services/auth';

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

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
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
        const response = await fetch('https://cafm.zenapi.co.in/api/kyc/EFMS3295');
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

  const getMenuItemsByRole = (): MenuItem[] => {
    const role = getUserRole();
    
    if (role === 'Employee') {
      return [
        {
          icon: <FaTachometerAlt />,
          label: 'Dashboard',
          href: '/dashboard'
        },
        {
          icon: <FaUser />,
          label: 'Know Me',
          href: '/kyc'
        },
        {
          icon: <FaCalendarAlt />,
          label: 'Attendance',
          href: '/attendance'
        },
        {
          icon: <FaFileAlt />,
          label: 'Leave Management',
          href: '/leave-management'
        },
        {
          icon: <FaMoneyBillWave />,
          label: 'Payslip',
          href: '/payslip'
        },
        {
          icon: <FaTasks />,
          label: 'Tasks and Project',
          href: '/tasks'
        },
        {
          icon: <FaReceipt />,
          label: 'Expense Reimbursement',
          href: '/expense'
        },
        {
          icon: <FaHeadset />,
          label: 'Helpdesk',
          href: '/helpdesk'
        },
        {
          icon: <FaFileContract />,
          label: 'Policy and Document',
          href: '/policy'
        },
        {
          icon: <FaDoorOpen />,
          label: 'Resignation',
          href: '/resignation'
        }
      ];
    }

    // Admin menu items
    return [
      {
        icon: <FaTachometerAlt />,
        label: 'Dashboard',
        href: '/dashboard'
      },
      {
        icon: <FaFileAlt />,
        label: 'KYC Verification',
        href: '/kyc'
      },
      {
        icon: <FaUserFriends />,
        label: 'Employee Directory',
        href: '/employees'
      },
      {
        icon: <FaBuilding />,
        label: 'Position Management',
        href: '/positionmanagement'
      },
    ];
  };

  const menuItems: MenuItem[] = getMenuItemsByRole();

  const renderMenuItem = (item: MenuItem) => {
    const isExpanded = expandedMenus.includes(item.label);
    const isActive = pathname === item.href;
    
    return (
      <li key={item.label}>
        {item.subItems ? (
          <div className="space-y-1">
            <button
              onClick={() => toggleMenu(item.label)}
              className={`w-full flex items-center justify-between px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all duration-200 ${
                isExpanded ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              <div className="flex items-center min-w-0">
                <span className={`text-xl w-8 transition-colors ${isExpanded ? 'text-blue-700' : 'text-gray-500'}`}>{item.icon}</span>
                {isSidebarExpanded && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
              </div>
              {isSidebarExpanded && (
                <span className="ml-2 flex-shrink-0">
                  {isExpanded ? (
                    <FaMinus className="w-4 h-4 text-blue-700" />
                  ) : (
                    <FaPlus className="w-4 h-4 text-gray-500" />
                  )}
                </span>
              )}
            </button>
            {expandedMenus.includes(item.label) && isSidebarExpanded && (
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
          <Link
            href={item.href || '#'}
            className={`w-full flex items-center px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all duration-200 ${
              isActive ? 'bg-blue-50 text-blue-700' : ''
            }`}
          >
            <span className={`text-xl w-8 transition-colors ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>{item.icon}</span>
            {isSidebarExpanded && (
              <span className="font-medium truncate">{item.label}</span>
            )}
          </Link>
        )}
      </li>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm lg:hidden z-20"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar with integrated header */}
      <aside
        className={`fixed inset-y-0 left-0 flex flex-col
          ${isSidebarExpanded ? 'w-72' : 'w-20'}
          bg-white border-r border-gray-100 shadow-lg
          transition-all duration-300 z-30`}
      >
        {/* Logo and Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className={`flex items-center ${isSidebarExpanded ? 'justify-start' : 'justify-center'} w-full`}>
            <Image
              src="/logo-exo .png"
              alt="Exozen Logo"
              width={40}
              height={40}
              className="rounded-xl shadow-sm"
            />
            {isSidebarExpanded && (
              <span className="ml-4 font-semibold text-gray-800 text-xl tracking-wide">Exozen</span>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 ml-2"
            title={isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarExpanded ? <FaChevronLeft /> : <FaChevronRight />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
          <ul className="p-4 space-y-2">
            {menuItems.map(renderMenuItem)}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-100 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 rounded-xl
              hover:bg-red-50 hover:text-red-600 transition-all duration-200 group
              justify-center"
          >
            <span className="inline-flex items-center justify-center w-8 h-8">
              <FaSignOutAlt className="text-xl group-hover:text-red-600 transition-colors" />
            </span>
            {isSidebarExpanded && (
              <span className="font-medium text-sm">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content with Header */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        isSidebarExpanded ? 'ml-72' : 'ml-20'
      }`}>
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 shadow-lg sticky top-0 z-20 border-b border-gray-100">
          <div className="flex items-center justify-between px-8 py-4">
            {/* Left side - Employee ID */}
            <div className="flex items-center">
              {userDetails && (
                <div className="flex items-center space-x-3 text-gray-700">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
                    <FaIdCard className="text-xl text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Employee ID</p>
                    <p className="text-base font-semibold text-blue-600">{userDetails.employeeId}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Notifications and Profile */}
            <div className="flex items-center space-x-6">
              {/* Notifications */}
              <button className="relative p-3 rounded-xl bg-white shadow-sm border border-gray-100 hover:bg-gray-50 transition-all duration-200 group">
                <FaBell className="text-xl text-blue-600" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[11px] font-bold text-white flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-4 pl-6 border-l border-gray-200">
                {loading ? (
                  <div className="animate-pulse flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full bg-gray-200"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ) : userDetails ? (
                  <>
                    <div className="relative group">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full blur-md opacity-30"></div>
                        <img
                          src={userDetails.employeeImage}
                          alt={userDetails.fullName}
                          className="relative w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-3 hidden group-hover:block transform transition-all duration-200">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-lg font-bold text-gray-800">{userDetails.fullName}</p>
                          <p className="text-sm font-medium text-blue-600 mt-1">{userDetails.designation}</p>
                        </div>
                        <div className="px-4 py-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <FaIdCard className="mr-2 text-blue-500" />
                            <span className="font-medium">{userDetails.employeeId}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-lg font-bold text-gray-800">{userDetails.fullName}</p>
                      <p className="text-sm font-medium text-blue-600">{userDetails.designation}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                      <FaUser className="text-gray-400 text-xl" />
                    </div>
                    <div className="hidden md:block">
                      <p className="text-lg font-bold text-gray-800">User</p>
                      <p className="text-sm font-medium text-gray-500">Not Available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed bottom-6 right-6 lg:hidden bg-white text-gray-600 p-4 rounded-full 
          shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
      >
        {isMobileMenuOpen ? <FaChevronLeft /> : <FaChevronRight />}
      </button>
    </div>
  );
};

export default DashboardLayout;