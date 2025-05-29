"use client";

import { usePathname } from 'next/navigation';
import { FaIdCard } from 'react-icons/fa';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

export default function KYCLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-white flex flex-col">
        {/* Sticky header for KYC section */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8 h-[64px] flex items-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaIdCard className="text-blue-600" />
            KYC Management
          </h1>
        </div>
        {/* Content below header, no inner scroll */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
