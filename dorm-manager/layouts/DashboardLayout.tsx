
import React, { useContext } from 'react';
import { AuthContext } from '../App';
import { NavItem } from '../types';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  searchPlaceholder?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  sidebarTitle?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  navItems, 
  searchPlaceholder, 
  headerTitle,
  headerSubtitle,
  sidebarTitle
}) => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark font-lexend overflow-hidden text-text-main dark:text-white">
      {/* Shared Sidebar */}
      <Sidebar 
        user={user} 
        navItems={navItems} 
        logout={logout} 
        title={sidebarTitle}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Shared Header */}
        <Header 
          user={user} 
          logout={logout} 
          placeholder={searchPlaceholder}
          title={headerTitle}
          subtitle={headerSubtitle}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth bg-background-light dark:bg-background-dark">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
