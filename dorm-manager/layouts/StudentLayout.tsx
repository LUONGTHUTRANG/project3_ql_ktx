import React, { useContext } from 'react';
import { AuthContext } from '../App';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { NavItem } from '../types';

interface StudentLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  searchPlaceholder?: string;
  headerTitle?: string;
  headerSubtitle?: string;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ 
  children, 
  navItems, 
  searchPlaceholder = "Tìm kiếm...",
  headerTitle,
  headerSubtitle,
}) => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark font-lexend overflow-hidden text-text-main dark:text-white">
      {/* Student Sidebar */}
      <Sidebar 
        user={user} 
        navItems={navItems} 
        logout={logout} 
        title="Student Portal"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Student Header */}
        <Header 
          user={user} 
          logout={logout} 
          placeholder={searchPlaceholder}
          title={headerTitle}
          subtitle={headerSubtitle}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth bg-background-light dark:bg-background-dark">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
