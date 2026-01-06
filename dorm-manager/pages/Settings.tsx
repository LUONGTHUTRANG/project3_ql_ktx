import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Select, Modal, Form, Input, App } from 'antd';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { UserRole } from '../types';
import { changePassword } from '../api/auth';
import { getAvatarUrl } from '../utils/avatarUtils';

const Settings: React.FC = () => {
  const { notification } = App.useApp();
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    bills: false,
    support: true,
    general: true
  });
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  if (!user) return null;

  console.log("Rendering Settings for user:", user);

  const isManager = user.role === UserRole.MANAGER || user.role === UserRole.ADMIN;

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleEditProfile = () => {
    if (!isManager) {
      navigate('/student/profile');
    }
  };

  const handleChangePassword = () => {
    setChangePasswordModal(true);
    passwordForm.resetFields();
  };

  const handleChangePasswordSubmit = async (values: any) => {
    setIsLoadingPassword(true);
    try {
      // Validate new password matches confirmation
      if (values.newPassword !== values.confirmPassword) {
        notification.error({
          message: 'Lỗi xác thực',
          description: 'Mật khẩu xác nhận không khớp!',
          duration: 4.5,
        });
        return;
      }

      // Call API to change password
      await changePassword(values.currentPassword, values.newPassword);
      
      notification.success({
        message: 'Thành công',
        description: 'Mật khẩu của bạn đã được thay đổi thành công!',
        duration: 4.5,
      });
      setChangePasswordModal(false);
      passwordForm.resetFields();
    } catch (error: any) {
      notification.error({
        message: 'Đổi mật khẩu thất bại',
        description: error.message || 'Lỗi khi thay đổi mật khẩu!',
        duration: 4.5,
      });
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleLogoutClick = () => {
    setLogoutModalVisible(true);
  };

  const handleConfirmLogout = () => {
    setLogoutModalVisible(false);
    logout();
  };

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm cài đặt..."
      headerTitle="Cài đặt"
    >
      <div className="flex flex-col w-full mx-auto animate-in fade-in duration-500">
        
        {/* Page Heading */}
        <div className="flex flex-col gap-2 pb-6">
          <h1 className="text-text-main dark:text-white text-3xl sm:text-4xl font-black leading-tight tracking-tight">Cài đặt</h1>
          <p className="text-text-secondary dark:text-gray-400 text-base font-normal leading-normal">Quản lý thông tin cá nhân và tùy chọn ứng dụng</p>
        </div>

        {/* Profile Summary Card */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-border-color dark:border-gray-700 overflow-hidden p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
            <div 
              className="bg-center bg-no-repeat bg-cover rounded-full size-24 shrink-0 border-2 border-white dark:border-gray-600 shadow-md" 
              style={{ backgroundImage: `url("${getAvatarUrl(user.avatar, user.name)}")` }}
            ></div>
            <div className="flex flex-col justify-center flex-1 gap-1">
              <h2 className="text-text-main dark:text-white text-2xl font-bold leading-tight">{user.name}</h2>
              <p className="text-text-secondary dark:text-gray-400 text-base font-medium">
                {isManager ? `ID: ${user.id}` : `MSSV: ${user.mssv || user.id}`}
              </p>
              <p className="text-text-secondary dark:text-gray-400 text-sm">{user.subtitle}</p>
            </div>
            <div className="flex items-center self-center sm:self-start mt-2 sm:mt-0">
              <button 
                onClick={handleEditProfile}
                className="flex items-center justify-center rounded-lg px-5 py-2.5 bg-background-light dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-text-main dark:text-white text-sm font-bold transition-all active:scale-95"
              >
                Chỉnh sửa hồ sơ
              </button>
            </div>
          </div>
        </div>

        {/* Settings Group: Account & Security */}
        <div className="flex flex-col gap-3 mb-8">
          <h3 className="text-text-main dark:text-white text-lg font-bold leading-tight px-1">Tài khoản & Bảo mật</h3>
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-border-color dark:border-gray-700 overflow-hidden">
            <button 
              onClick={handleChangePassword}
              className="group flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border-b border-border-color dark:border-gray-700 last:border-0 w-full text-left"
            >
              <div className="flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary shrink-0 size-11">
                <span className="material-symbols-outlined text-[24px]">lock</span>
              </div>
              <div className="flex flex-1 flex-col min-w-0">
                <p className="text-text-main dark:text-white text-base font-bold leading-normal">Thay đổi mật khẩu</p>
                <p className="text-text-secondary dark:text-gray-400 text-sm hidden sm:block truncate">Cập nhật mật khẩu để bảo vệ tài khoản</p>
              </div>
              <div className="shrink-0 text-text-secondary dark:text-gray-500 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[24px]">chevron_right</span>
              </div>
            </button>
            <a className="group flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer" href="#">
              <div className="flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary shrink-0 size-11">
                <span className="material-symbols-outlined text-[24px]">link</span>
              </div>
              <div className="flex flex-1 flex-col min-w-0">
                <p className="text-text-main dark:text-white text-base font-bold leading-normal">Tài khoản liên kết</p>
                <p className="text-text-secondary dark:text-gray-400 text-sm hidden sm:block truncate">Kết nối với tài khoản mạng xã hội hoặc email dự phòng</p>
              </div>
              <div className="shrink-0 text-text-secondary dark:text-gray-500 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[24px]">chevron_right</span>
              </div>
            </a>
          </div>
        </div>

        {/* Settings Group: Notifications */}
        <div className="flex flex-col gap-3 mb-8">
          <h3 className="text-text-main dark:text-white text-lg font-bold leading-tight px-1">Cài đặt thông báo</h3>
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-border-color dark:border-gray-700 overflow-hidden">
            {/* Notification Items */}
            <div className="flex items-center justify-between gap-4 p-4 border-b border-border-color dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary shrink-0 size-11">
                  <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-text-main dark:text-white text-base font-bold leading-normal">Hóa đơn mới</p>
                  <p className="text-text-secondary dark:text-gray-400 text-sm truncate">Nhận thông báo khi có hóa đơn điện, nước</p>
                </div>
              </div>
              <button 
                onClick={() => toggleNotification('bills')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-offset-2 focus:ring-2 focus:ring-primary ${notifications.bills ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.bills ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 p-4 border-b border-border-color dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary shrink-0 size-11">
                  <span className="material-symbols-outlined text-[24px]">support_agent</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-text-main dark:text-white text-base font-bold leading-normal">Phản hồi yêu cầu</p>
                  <p className="text-text-secondary dark:text-gray-400 text-sm truncate">Khi ban quản lý trả lời yêu cầu hỗ trợ</p>
                </div>
              </div>
              <button 
                onClick={() => toggleNotification('support')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-offset-2 focus:ring-2 focus:ring-primary ${notifications.support ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.support ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary shrink-0 size-11">
                  <span className="material-symbols-outlined text-[24px]">campaign</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <p className="text-text-main dark:text-white text-base font-bold leading-normal">Thông báo chung</p>
                  <p className="text-text-secondary dark:text-gray-400 text-sm truncate">Tin tức, sự kiện từ ký túc xá</p>
                </div>
              </div>
              <button 
                onClick={() => toggleNotification('general')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ring-offset-2 focus:ring-2 focus:ring-primary ${notifications.general ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.general ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Settings Group: Preferences */}
        <div className="flex flex-col gap-3 mb-8">
          <h3 className="text-text-main dark:text-white text-lg font-bold leading-tight px-1">Ứng dụng</h3>
          <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-border-color dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary shrink-0 size-11">
                  <span className="material-symbols-outlined text-[24px]">language</span>
                </div>
                <p className="text-text-main dark:text-white text-base font-bold leading-normal">Ngôn ngữ</p>
              </div>
              <Select 
                className="min-w-[160px] h-11"
                defaultValue="vi"
                options={[
                  { value: 'vi', label: 'Tiếng Việt' },
                  { value: 'en', label: 'English' },
                ]}
                suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">expand_more</span>}
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={handleLogoutClick}
            className="w-full sm:w-auto min-w-[240px] flex items-center justify-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-bold py-4 px-8 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            Đăng xuất tài khoản
          </button>
        </div>

        {/* Change Password Modal */}
        <Modal
          title={
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/20 text-primary shrink-0 size-10">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </div>
              <span className="text-base font-bold text-text-main dark:text-white">Thay đổi mật khẩu</span>
            </div>
          }
          open={changePasswordModal}
          onCancel={() => setChangePasswordModal(false)}
          footer={null}
          width={420}
          centered
          className="change-password-modal"
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePasswordSubmit}
            className="mt-6"
          >
            <Form.Item
              label={<span className="text-sm font-bold text-text-main dark:text-white">Mật khẩu hiện tại</span>}
              name="currentPassword"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu hiện tại' },
              ]}
            >
              <Input.Password
                placeholder="Nhập mật khẩu hiện tại"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-bold text-text-main dark:text-white">Mật khẩu mới</span>}
              name="newPassword"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                {
                  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Mật khẩu phải chứa chữ hoa, chữ thường và số'
                },
              ]}
            >
              <Input.Password
                placeholder="Nhập mật khẩu mới (ít nhất 8 ký tự)"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label={<span className="text-sm font-bold text-text-main dark:text-white">Xác nhận mật khẩu</span>}
              name="confirmPassword"
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ]}
            >
              <Input.Password
                placeholder="Nhập lại mật khẩu mới"
                size="large"
              />
            </Form.Item>

            <Form.Item className="mb-0 mt-8">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setChangePasswordModal(false)}
                  className="flex-1 h-10 rounded-lg border border-border-color dark:border-gray-600 text-text-main dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isLoadingPassword}
                  className="flex-1 h-10 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingPassword ? 'Đang xử lý...' : 'Thay đổi mật khẩu'}
                </button>
              </div>
            </Form.Item>
          </Form>
        </Modal>

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
    </RoleBasedLayout>
  );
};

export default Settings;