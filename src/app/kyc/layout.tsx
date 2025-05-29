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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FaIdCard className="text-blue-600" />
              KYC Management
            </h1>
          </div>
          {children}
        </div>
      </div>
    </DashboardLayout>
  );
}
