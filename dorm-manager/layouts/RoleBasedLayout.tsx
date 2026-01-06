import React, { useContext, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import AdminLayout from './AdminLayout';
import ManagerLayout from './ManagerLayout';
import StudentLayout from './StudentLayout';
import { NavItem, UserRole } from '../types';
import { getNavItemsByRole, getLayoutTitleByRole } from '../config/layoutConfig';

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

  if (!user) return null;

  // Get nav items: use custom if provided, otherwise use role-based defaults
  const navItems = useMemo(() => {
    const items = customNavItems || getNavItemsByRole(user.role);
    // Mark active items based on current pathname
    return items.map(item => ({
      ...item,
      isActive: item.link === location.pathname
    }));
  }, [customNavItems, user.role, location.pathname]);

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
