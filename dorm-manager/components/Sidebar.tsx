import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, NavItem, UserRole } from '../types';

interface SidebarProps {
  user: User;
  navItems: NavItem[];
  logout: () => void;
  title?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ user, navItems, logout, title = "Dorm Manager" }) => {
  const location = useLocation();

  const settingsLink = user.role === UserRole.STUDENT ? '/student/settings' : '/manager/settings';
  const isSettingsActive = location.pathname === settingsLink;

  return (
    <aside className="w-72 flex-shrink-0 bg-white dark:bg-surface-dark border-r border-border-color dark:border-gray-700 flex flex-col hidden md:flex z-20 h-full overflow-y-auto">
      <div className="p-6 flex flex-col gap-6">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2 text-primary">
            <span className="material-symbols-outlined fill" style={{ fontSize: '28px' }}>apartment</span>
          </div>
          <h2 className="text-text-main dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">{title}</h2>
        </div>
        
        {/* User Profile Snippet */}
        <div className="flex items-center gap-3 rounded-xl bg-background-light dark:bg-gray-800 p-3">
          <div 
            className="bg-center bg-no-repeat bg-cover rounded-full size-12 border-2 border-white dark:border-gray-600 shadow-sm" 
            style={{ backgroundImage: `url("${user.avatar}")` }}
          ></div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-text-main dark:text-white text-sm font-bold leading-tight truncate">{user.name}</h1>
            <p className="text-text-secondary dark:text-gray-400 text-xs font-normal leading-normal truncate">{user.subtitle}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.link;
            return (
              <Link 
                key={index} 
                to={item.link || '#'} 
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-background-light dark:hover:bg-gray-800 text-text-secondary dark:text-gray-300'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'fill' : 'group-hover:text-text-main dark:group-hover:text-white'}`}>
                  {item.icon}
                </span>
                <p className={`text-sm font-medium leading-normal ${isActive ? 'font-bold' : 'text-text-main dark:text-gray-200'}`}>
                  {item.label}
                </p>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-2 border-t border-border-color dark:border-gray-700 pt-4">
          <Link 
            to={settingsLink} 
            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors group ${
              isSettingsActive 
                ? 'bg-primary/10 text-primary' 
                : 'hover:bg-background-light dark:hover:bg-gray-800 text-text-secondary dark:text-gray-300'
            }`}
          >
            <span className={`material-symbols-outlined ${isSettingsActive ? 'fill' : 'group-hover:text-text-main dark:group-hover:text-white'}`}>
              settings
            </span>
            <p className={`text-sm font-medium leading-normal ${isSettingsActive ? 'font-bold' : 'text-text-main dark:text-gray-200'}`}>
              Cài đặt
            </p>
          </Link>
          <button onClick={logout} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors w-full text-left">
            <span className="material-symbols-outlined">logout</span>
            <p className="text-sm font-medium leading-normal">Đăng xuất</p>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;