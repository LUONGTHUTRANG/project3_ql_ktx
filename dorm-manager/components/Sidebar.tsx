import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, NavItem, UserRole } from '../types';
import { Modal } from 'antd';
import { getAvatarUrl } from '../utils/avatarUtils';
import { useSystemConfig } from '../contexts/SystemConfigContext';

interface SidebarProps {
  user: User;
  navItems: NavItem[];
  logout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, navItems, logout }) => {
  const { systemConfig } = useSystemConfig();
  const systemTitle = systemConfig?.system_name || "Hệ thống Quản lý Ký túc xá";
  const location = useLocation();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const [hasScrollbar, setHasScrollbar] = useState(false);

  const settingsLink = `/${user.role}/settings`;
  const isSettingsActive = location.pathname.startsWith(settingsLink);

  // Save collapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Detect if scrollbar is visible
  useEffect(() => {
    const checkScrollbar = () => {
      const asideElement = document.querySelector('aside');
      if (asideElement) {
        const hasVerticalScroll = asideElement.scrollHeight > asideElement.clientHeight;
        setHasScrollbar(hasVerticalScroll);
      }
    };

    checkScrollbar();
    window.addEventListener('resize', checkScrollbar);
    // Check after content renders
    const timer = setTimeout(checkScrollbar, 100);

    return () => {
      window.removeEventListener('resize', checkScrollbar);
      clearTimeout(timer);
    };
  }, [isCollapsed, navItems]);

  const handleLogoutClick = () => {
    setLogoutModalVisible(true);
  };

  const handleConfirmLogout = () => {
    setLogoutModalVisible(false);
    logout();
  };

  return (
    <aside className={`z-50 flex-shrink-0 bg-white dark:bg-surface-dark border-r border-border-color dark:border-gray-700 flex flex-col hidden md:flex z-20 h-full overflow-y-auto transition-all duration-300 ${
      isCollapsed ? (hasScrollbar ? 'w-[90px]' : 'w-20') : 'w-72'
    }`}>
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} flex flex-col gap-6 h-full`}>
        {/* Header with Logo */}
        <div 
          onMouseEnter={() => setIsLogoHovered(true)}
          onMouseLeave={() => setIsLogoHovered(false)}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-3 px-2 cursor-pointer group"
        >
          <div className="flex items-center justify-center rounded-lg bg-primary/10 p-2 text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
            <span className="material-symbols-outlined fill" style={{ fontSize: '28px' }}>
              {isLogoHovered ? (isCollapsed ? 'keyboard_double_arrow_right' : 'keyboard_double_arrow_left') : 'apartment'}
            </span>
          </div>
          {!isCollapsed && (
            <h2 className="text-text-main dark:text-white text-xl font-bold leading-snug tracking-[-0.015em] group-hover:text-primary transition-colors whitespace-normal flex-1">{systemTitle}</h2>
          )}
        </div>
        
        {/* User Profile Snippet */}
        <div className={`flex items-center gap-3 rounded-xl bg-background-light dark:bg-gray-800 ${isCollapsed ? 'justify-center p-2' : 'p-3'}`}>
          <div 
            className="bg-center bg-no-repeat bg-cover rounded-full size-12 border-2 border-white dark:border-gray-600 shadow-sm shrink-0" 
            style={{ backgroundImage: `url("${getAvatarUrl(user.avatar, user.name)}")` }}
          ></div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <h1 className="text-text-main dark:text-white text-sm font-bold leading-tight truncate">{user.name}</h1>
              <p className="text-text-secondary dark:text-gray-400 text-xs font-normal leading-normal truncate">{user.subtitle}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map((item, index) => {
            // Special handling for manager invoices routes
            let isActive = location.pathname.startsWith(item.link || '');
            if (item.link === '/manager/invoices/room-fee' && location.pathname.startsWith('/manager/invoices')) {
              isActive = true;
            }
            return (
              <Link 
                key={index} 
                to={item.link || '#'} 
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-lg transition-colors group ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'hover:bg-background-light dark:hover:bg-gray-800 text-text-secondary dark:text-gray-300'
                }`}
              >
                <span className={`material-symbols-outlined ${isActive ? 'fill' : 'group-hover:text-text-main dark:group-hover:text-white'}`}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <p className={`text-sm font-medium leading-normal ${isActive ? 'font-bold' : 'text-text-main dark:text-gray-200'}`}>
                    {item.label}
                  </p>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className={`flex flex-col gap-2 border-t border-border-color dark:border-gray-700 ${isCollapsed ? 'pt-2' : 'pt-4'}`}>
          <Link 
            to={settingsLink} 
            title={isCollapsed ? 'Cài đặt' : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-lg transition-colors group ${
              isSettingsActive 
                ? 'bg-primary/10 text-primary' 
                : 'hover:bg-background-light dark:hover:bg-gray-800 text-text-secondary dark:text-gray-300'
            }`}
          >
            <span className={`material-symbols-outlined ${isSettingsActive ? 'fill' : 'group-hover:text-text-main dark:group-hover:text-white'}`}>
              settings
            </span>
            {!isCollapsed && (
              <p className={`text-sm font-medium leading-normal ${isSettingsActive ? 'font-bold' : 'text-text-main dark:text-gray-200'}`}>
                Cài đặt
              </p>
            )}
          </Link>
          <button 
            onClick={handleLogoutClick}
            title={isCollapsed ? 'Đăng xuất' : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors w-full text-left`}
          >
            <span className="material-symbols-outlined">logout</span>
            {!isCollapsed && (
              <p className="text-sm font-medium leading-normal">Đăng xuất</p>
            )}
          </button>

          {/* Logout Confirmation Modal */}
          <Modal
            title={
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 shrink-0 size-10">
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                </div>
                <span className="text-base font-bold text-text-main dark:text-white">Xác nhận đăng xuất</span>
              </div>
            }
            open={logoutModalVisible}
            onCancel={() => setLogoutModalVisible(false)}
            footer={null}
            width={420}
            centered
            className="logout-confirmation-modal"
          >
            <div className="py-4">
              <p className="text-text-main dark:text-white text-base font-medium mb-2">Bạn có chắc chắn muốn đăng xuất?</p>
              <p className="text-text-secondary dark:text-gray-400 text-sm">Bạn sẽ được chuyển hướng đến trang đăng nhập và sẽ cần nhập lại thông tin đăng nhập của mình.</p>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setLogoutModalVisible(false)}
                  className="flex-1 h-10 rounded-lg border border-border-color dark:border-gray-600 text-text-main dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLogout}
                  className="flex-1 h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;