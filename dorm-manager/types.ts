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
  email?: string; 
  mssv?: string; // Mã số sinh viên (for students)
  building_id?: string | number; // Tòa nhà (for managers)
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