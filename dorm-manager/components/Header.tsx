import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, UserRole } from '../types';
import NotificationPopup from './NotificationPopup';
import { Input } from 'antd';
import { SearchOutlined } from "@ant-design/icons";
import { getMyNotifications } from '../api';

interface HeaderProps {
  user: User;
  logout: () => void;
  placeholder?: string;
  title?: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ user, logout, placeholder = "Tìm kiếm...", title, subtitle }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Fetch unread notifications count
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const response = await getMyNotifications(1, 100);
        const data = response.data || [];
        const unread = data.filter((notif: any) => !notif.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error('Failed to load unread count:', err);
      }
    };

    loadUnreadCount();
  }, []);

  const handleProfileClick = () => {
    setIsDropdownOpen(false);
    if (user.role === UserRole.STUDENT) {
      navigate('/student/profile');
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark px-6 md:px-8 z-20 sticky top-0">
      {/* Mobile Menu Button & Mobile Title */}
      <div className="flex items-center gap-4">
        <button className="md:hidden text-text-secondary dark:text-gray-400">
          <span className="material-symbols-outlined">menu</span>
        </button>
        {(title || subtitle) && (
          <div className="hidden md:block">
            {title && <h2 className="text-text-main dark:text-white text-lg font-bold tracking-tight">{title}</h2>}
            {subtitle && <p className="text-xs text-text-secondary dark:text-gray-400 hidden md:block">{subtitle}</p>}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-8">
        <Input
          placeholder={placeholder} 
          prefix={<SearchOutlined />}
          className="w-full h-10 gap-3 pl-1 flex-1"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Notification Bell */}
        <div className="relative">
          <button 
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsDropdownOpen(false); // Close user dropdown if open
            }}
            className={`relative flex items-center justify-center rounded-full p-2 transition-colors ${
              isNotificationsOpen 
                ? 'bg-primary/10 text-primary' 
                : 'bg-white dark:bg-surface-dark text-text-secondary dark:text-gray-400 hover:bg-background-light dark:hover:bg-gray-800 hover:text-primary'
            }`}
          >
            <span className={`material-symbols-outlined ${isNotificationsOpen ? 'fill' : ''}`}>notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-2 size-2 rounded-full bg-red-500 border border-white dark:border-surface-dark"></span>
            )}
          </button>
          
          {isNotificationsOpen && (
            <NotificationPopup onClose={() => setIsNotificationsOpen(false)} />
          )}
        </div>
        
        <div className="h-8 w-px bg-border-color dark:bg-gray-700"></div>
        
        {/* User Dropdown */}
        <div className="relative">
          <button 
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setIsNotificationsOpen(false); // Close notifications if open
            }}
            className="flex items-center gap-2 rounded-full pl-1 pr-1 sm:pr-3 py-1 hover:bg-background-light dark:hover:bg-gray-800 transition-colors"
          >
            <div 
              className="bg-center bg-no-repeat bg-cover rounded-full size-8" 
              style={{ backgroundImage: `url("${user.avatar}")` }}
            ></div>
            <span className="hidden sm:block text-sm font-medium text-text-main dark:text-white">Tài khoản</span>
            <span className="material-symbols-outlined text-text-secondary dark:text-gray-400 text-[20px]">expand_more</span>
          </button>
          
          {isDropdownOpen && (
            <>
              {/* Overlay to close on click outside */}
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
              
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-white dark:bg-surface-dark shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.subtitle}</p>
                </div>
                <div className="p-1">
                  <button 
                    onClick={handleProfileClick}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px] text-gray-500 dark:text-gray-400">person</span>
                    Hồ sơ
                  </button>
                  <button 
                    onClick={logout} 
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    Đăng xuất
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;