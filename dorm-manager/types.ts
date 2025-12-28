export enum UserRole {
  STUDENT = 'student',
  MANAGER = 'manager',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  subtitle?: string; // e.g., "P.302 - Nhà B" or "Quản lý Tòa A1"
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'warning' | 'info' | 'success';
  date?: string;
}

export interface RequestItem {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed';
  date: string;
  studentName?: string;
  room?: string;
  avatar?: string;
}

export interface NavItem {
  label: string;
  icon: string;
  link?: string;
  isActive?: boolean;
}