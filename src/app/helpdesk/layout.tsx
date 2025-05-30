import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Help Desk | Employee Management System',
  description: 'Manage and track your support tickets',
};

export default function HelpDeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
} 