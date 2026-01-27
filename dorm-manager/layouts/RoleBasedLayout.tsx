import React, { useContext, useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import AdminLayout from './AdminLayout';
import ManagerLayout from './ManagerLayout';
import StudentLayout from './StudentLayout';
import { NavItem, UserRole } from '../types';
import { getNavItemsByRole, getLayoutTitleByRole } from '../config/layoutConfig';
import { getStudentById } from '../api';

interface RoleBasedLayoutProps {
  children: React.ReactNode;
  /**
   * Optional: Custom nav items (overrides default role-based items)
   */
  navItems?: NavItem[];
  /**
   * Optional: Custom search placeholder
   */
  searchPlaceholder?: string;
  /**
   * Optional: Custom header title (overrides default from layoutConfig)
   */
  headerTitle?: string;
  /**
   * Optional: Custom header subtitle
   */
  headerSubtitle?: string;
}

/**
 * RoleBasedLayout: Automatically selects the correct layout based on user role
 * 
 * Features:
 * - Automatically displays correct sidebar navigation based on user role
 * - Uses layoutConfig to manage navigation items for each role
 * - Supports optional custom nav items override
 * - Highlights active navigation items based on current route
 * 
 * Usage:
 * <RoleBasedLayout headerTitle="My Page">
 *   {children}
 * </RoleBasedLayout>
 */
const RoleBasedLayout: React.FC<RoleBasedLayoutProps> = ({ 
  children, 
  navItems: customNavItems,
  searchPlaceholder,
  headerTitle,
  headerSubtitle,
}) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [hasRoom, setHasRoom] = useState<boolean | undefined>(undefined);

  // Fetch student info to check if they have a room (only for students)
  useEffect(() => {
    if (user && user.role === UserRole.STUDENT) {
      const checkStudentRoom = async () => {
        try {
          const studentData = await getStudentById(user.id);
          setHasRoom(!!studentData?.current_room_id);
        } catch (error) {
          console.error('Error checking student room:', error);
          setHasRoom(false);
        }
      };
      checkStudentRoom();
    }
  }, [user?.id, user?.role]);

  // Get nav items: use custom if provided, otherwise use role-based defaults
  const navItems = useMemo(() => {
    if (!user) return [];
    const items = customNavItems || getNavItemsByRole(user.role, hasRoom);
    // Mark active items based on current pathname
    return items.map(item => ({
      ...item,
      isActive: item.link === location.pathname
    }));
  }, [customNavItems, user?.role, hasRoom, location.pathname]);

  if (!user) return null;

  // Get default title if not provided
  const finalTitle = headerTitle || getLayoutTitleByRole(user.role);

  // Determine which layout to use based on role
  const layoutProps = {
    navItems,
    searchPlaceholder,
    headerTitle: finalTitle,
    headerSubtitle,
  };

  if (user.role === UserRole.ADMIN) {
    return (
      <AdminLayout {...layoutProps}>
        {children}
      </AdminLayout>
    );
  }

  if (user.role === UserRole.MANAGER) {
    return (
      <ManagerLayout {...layoutProps}>
        {children}
      </ManagerLayout>
    );
  }

  // Default to StudentLayout
  return (
    <StudentLayout {...layoutProps}>
      {children}
    </StudentLayout>
  );
};

export default RoleBasedLayout;
