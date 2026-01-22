import { NavItem, UserRole } from '../types';

/**
 * STUDENT NAV ITEMS
 */
export const STUDENT_NAV_ITEMS: NavItem[] = [
  { label: 'Trang chủ', icon: 'home', link: '/student/home' },
  { label: 'Thông tin cá nhân', icon: 'person', link: '/student/profile' },
  { label: 'Phòng của tôi', icon: 'meeting_room', link: '/student/my-room' },
  { label: 'Đăng ký nội trú', icon: 'assignment', link: '/student/register' },
  { label: 'Thông tin tòa nhà & phòng', icon: 'apartment', link: '/student/buildings' },
  { label: 'Hóa đơn & Công nợ', icon: 'receipt_long', link: '/student/bills' },
  { label: 'Yêu cầu hỗ trợ', icon: 'support_agent', link: '/student/requests' },
  { label: 'Thông báo', icon: 'notifications', link: '/notifications' },
];

/**
 * MANAGER NAV ITEMS
 */
export const MANAGER_NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan', icon: 'dashboard', link: '/manager/home' },
  { label: 'Quản lý Phòng', icon: 'meeting_room', link: '/manager/rooms' },
  { label: 'Quản lý Sinh viên', icon: 'school', link: '/manager/students' },
  { label: 'Quản lý Hóa đơn', icon: 'receipt_long', link: '/manager/invoices/room-fee' },
  { label: 'Quản lý Đăng ký ở', icon: 'assignment_ind', link: '/manager/registrations' },
  { label: 'Yêu cầu hỗ trợ', icon: 'support_agent', link: '/manager/requests' },
  { label: 'Quản lý Thông báo', icon: 'notifications', link: '/manager/notifications' },
//   { label: 'Cài đặt', icon: 'settings', link: '/manager/settings' },
];

/**
 * ADMIN NAV ITEMS
 */
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan', icon: 'dashboard', link: '/admin/home' },
  { label: 'Quản lý Tòa nhà', icon: 'apartment', link: '/admin/buildings' },
  { label: 'Quản lý Phòng', icon: 'meeting_room', link: '/admin/rooms' },
  { label: 'Quản lý Sinh viên', icon: 'school', link: '/admin/students' },
  { label: 'Quản lý Kỳ ở', icon: 'calendar_month', link: '/admin/semesters' },
  { label: 'Quản lý Cán bộ', icon: 'badge', link: '/admin/managers' },
  { label: 'Quản lý Giá Dịch vụ', icon: 'local_offer', link: '/admin/service-prices' },
  { label: 'Quản lý Đăng ký ở', icon: 'assignment_ind', link: '/admin/registrations' },
  { label: 'Yêu cầu hỗ trợ', icon: 'support_agent', link: '/admin/requests' },
  { label: 'Quản lý Thông báo', icon: 'notifications', link: '/admin/notifications' },
  { label: 'Quản lý Cấu hình Hệ thống', icon: 'settings', link: '/admin/system-config' },
//   { label: 'Cài đặt', icon: 'settings', link: '/admin/settings' },
];

/**
 * Get nav items based on user role
 */
export const getNavItemsByRole = (role: UserRole): NavItem[] => {
  switch (role) {
    case UserRole.ADMIN:
      return ADMIN_NAV_ITEMS;
    case UserRole.MANAGER:
      return MANAGER_NAV_ITEMS;
    case UserRole.STUDENT:
      return STUDENT_NAV_ITEMS;
    default:
      return STUDENT_NAV_ITEMS;
  }
};

/**
 * Get layout title based on user role
 */
export const getLayoutTitleByRole = (role: UserRole): string => {
  // switch (role) {
    // case UserRole.ADMIN:
      return 'Hệ thống Quản lý Ký túc xá';
    // case UserRole.MANAGER:
    //   return 'Manager Panel';
    // case UserRole.STUDENT:
    //   return 'Student Portal';
    // default:
    //   return 'Portal';
  // }
};

/**
 * Layout configuration for each role
 */
interface LayoutConfig {
  title: string;
  navItems: NavItem[];
  defaultSearchPlaceholder: string;
}

export const LAYOUT_CONFIG: Record<UserRole, LayoutConfig> = {
  [UserRole.STUDENT]: {
    title: 'Hệ thống Quản lý Ký túc xá',
    navItems: STUDENT_NAV_ITEMS,
    defaultSearchPlaceholder: 'Tìm kiếm...',
  },
  [UserRole.MANAGER]: {
    title: 'Hệ thống Quản lý Ký túc xá',
    navItems: MANAGER_NAV_ITEMS,
    defaultSearchPlaceholder: 'Tìm kiếm...',
  },
  [UserRole.ADMIN]: {
    title: 'Hệ thống Quản lý Ký túc xá',
    navItems: ADMIN_NAV_ITEMS,
    defaultSearchPlaceholder: 'Tìm kiếm...',
  },
};
