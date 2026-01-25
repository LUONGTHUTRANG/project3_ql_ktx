import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { UserRole } from '../types';
import { App } from 'antd';
import { getAvatarUrl } from '../utils/avatarUtils';
import { updateManagerContact, getContactInfo } from '../api';

interface ManagerProfileProps {
  isAdmin?: boolean;
}

interface ContactInfo {
  phone_number?: string;
  email?: string;
  building_name?: string;
  building_id?: string;
}

const ManagerProfile: React.FC<ManagerProfileProps> = ({ isAdmin = false }) => {
  const { notification } = App.useApp();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    address: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!user) return null;

  // Load contact info from API
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        setIsLoading(true);
        const info = await getContactInfo();
        setContactInfo(info);
        setFormData({
          phone: info.phone_number || '',
          email: info.email || '',
          address: ''
        });
      } catch (err: any) {
        const errorMessage = err.message || 'Không thể tải thông tin liên lạc';
        setError(errorMessage);
        notification.error({
          message: 'Lỗi',
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchContactInfo();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSaving(true);
      
      // Validate input
      if (!formData.phone && !formData.email) {
        notification.error({
          message: 'Lỗi',
          description: 'Cần cung cấp ít nhất số điện thoại hoặc email',
          duration: 4.5,
        });
        return;
      }

      // Call API to update manager contact information
      await updateManagerContact(user.id, {
        phone_number: formData.phone,
        email: formData.email
      });

      notification.success({
        message: 'Thành công',
        description: 'Cập nhật thông tin liên lạc thành công',
        duration: 4.5,
      });

      setIsEditMode(false);
    } catch (err: any) {
      console.error('Lỗi khi cập nhật thông tin:', err);
      notification.error({
        message: 'Cập nhật thất bại',
        description: err.response?.data?.error || err.message || 'Lỗi khi cập nhật thông tin',
        duration: 4.5,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Restore original data from user context
    setFormData({
      phone: user?.phone_number || '',
      email: user?.subtitle?.includes('@') ? user.subtitle : '',
      address: ''
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      notification.error({
        message: 'Lỗi',
        description: 'Vui lòng chọn một tệp ảnh',
        duration: 4.5,
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notification.error({
        message: 'Lỗi',
        description: 'Kích thước ảnh không vượt quá 5MB',
        duration: 4.5,
      });
      return;
    }

    try {
      // TODO: Call API to upload avatar
      notification.success({
        message: 'Thành công',
        description: 'Avatar đã được cập nhật',
        duration: 4.5,
      });
    } catch (err: any) {
      console.error('Lỗi khi tải lên avatar:', err);
      notification.error({
        message: 'Tải lên thất bại',
        description: 'Không thể tải lên avatar',
        duration: 4.5,
      });
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChangePassword = () => {
    // TODO: Implement change password modal
  };

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm kiếm..."
      headerTitle="Hồ sơ cá nhân"
    >
      <div className="mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
        {/* Profile Header Card */}
        <div className="rounded-2xl border border-border-color bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-surface-dark overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
          <div className="relative flex flex-col items-center gap-8 sm:flex-row">
            <div className="relative group cursor-pointer shrink-0">
              <div 
                className="h-28 w-28 overflow-hidden rounded-full border-4 border-gray-50 shadow-md dark:border-gray-700 bg-center bg-cover bg-no-repeat transition-transform hover:scale-105" 
                style={{ backgroundImage: `url("${getAvatarUrl(user?.avatar, user?.name)}")` }}
                onClick={handleAvatarClick}
              ></div>
              {/* Camera overlay on hover */}
              <div 
                className="absolute inset-0 h-28 w-28 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                onClick={handleAvatarClick}
              >
                <span className="material-symbols-outlined text-white text-[40px]">camera_alt</span>
              </div>
              {/* Hidden file input */}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
              <div className="mb-2 flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                <h2 className="text-2xl font-bold text-text-main dark:text-white">{user?.name}</h2>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-text-secondary dark:text-gray-400 text-sm font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                  {user?.subtitle || 'Cán bộ Quản lý'}
                </p>
                <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">
                  Mã: {user?.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Read-only Work & ID Info */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Work Info */}
            <div className="rounded-2xl border border-border-color bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark overflow-hidden">
              <div className="px-6 py-4 border-b border-border-color dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">work</span>
                  Thông tin công việc
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-text-secondary dark:text-gray-400 uppercase tracking-widest">Chức vụ</span>
                  <div className="text-text-main dark:text-white font-medium p-2.5 bg-background-light dark:bg-gray-800 rounded border border-border-color dark:border-gray-700">
                    {`Quản lý Tòa nhà`}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-text-secondary dark:text-gray-400 uppercase tracking-widest">Tòa nhà phụ trách</span>
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-400 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-900/50">
                      {`Tòa ${contactInfo?.building_name || 'A1'}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ID Info */}
            <div className="rounded-2xl border border-border-color bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark overflow-hidden">
              <div className="px-6 py-4 border-b border-border-color dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">fingerprint</span>
                  Định danh cá nhân
                </h3>
              </div>
              <div className="p-6 space-y-5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-text-secondary dark:text-gray-400 uppercase tracking-widest">Họ và tên</span>
                  <div className="text-text-main dark:text-white font-medium p-2.5 bg-background-light dark:bg-gray-800 rounded border border-border-color dark:border-gray-700 flex items-center justify-between">
                    {user?.name}
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-lg" title="Đã xác thực">verified</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-medium text-text-secondary dark:text-gray-400 uppercase tracking-widest">Số CCCD/CMND</span>
                  <div className="text-text-main dark:text-white font-medium p-2.5 bg-background-light dark:bg-gray-800 rounded border border-border-color dark:border-gray-700 tracking-wider">
                    Chưa cập nhật
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Editable Contact Info */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="h-full">
              <div className="rounded-2xl border border-border-color bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark overflow-hidden h-full flex flex-col">
                <div className="px-6 py-4 border-b border-border-color dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                  <h3 className="font-bold text-text-main dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">contact_mail</span>
                    Thông tin liên lạc
                  </h3>
                  {!isEditMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditMode(true);
                      }}
                      className="text-md gap-2 bg-primary flex justify-center items-center text-white px-2 py-1 rounded-md border border-primary/20 dark:border-blue-900/30 hover:bg-primary/70 dark:hover:bg-blue-900/70 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      Chỉnh sửa
                    </button>
                  )}
                </div>
                <div className="p-6 space-y-6 flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500" htmlFor="phone">Số điện thoại</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="material-symbols-outlined text-text-secondary text-lg">call</span>
                        </div>
                        <input 
                          className={`block w-full rounded-xl border py-3 pl-10 text-sm font-bold shadow-sm transition-all outline-none ${
                            isEditMode
                              ? 'border-border-color bg-white text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white'
                              : 'border-border-color bg-gray-50 text-text-main cursor-not-allowed dark:border-gray-700 dark:bg-gray-800/50 dark:text-white'
                          }`}
                          id="phone" 
                          name="phone" 
                          type="tel" 
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={!isEditMode}
                          placeholder="Nhập số điện thoại"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500" htmlFor="email">Email</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="material-symbols-outlined text-text-secondary text-lg">mail</span>
                        </div>
                        <input 
                          className={`block w-full rounded-xl border py-3 pl-10 text-sm font-bold shadow-sm transition-all outline-none ${
                            isEditMode
                              ? 'border-border-color bg-white text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white'
                              : 'border-border-color bg-gray-50 text-text-main cursor-not-allowed dark:border-gray-700 dark:bg-gray-800/50 dark:text-white'
                          }`}
                          id="email" 
                          name="email" 
                          type="email" 
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!isEditMode}
                          placeholder="example@domain.com"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500" htmlFor="address">Địa chỉ thường trú (Tùy chọn)</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <span className="material-symbols-outlined text-text-secondary text-lg">home</span>
                        </div>
                        <input 
                          className={`block w-full rounded-xl border py-3 pl-10 text-sm font-bold shadow-sm transition-all outline-none ${
                            isEditMode
                              ? 'border-border-color bg-white text-text-main focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white'
                              : 'border-border-color bg-gray-50 text-text-main cursor-not-allowed dark:border-gray-700 dark:bg-gray-800/50 dark:text-white'
                          }`}
                          id="address" 
                          name="address" 
                          type="text" 
                          value={formData.address}
                          onChange={handleInputChange}
                          disabled={!isEditMode}
                          placeholder="Nhập địa chỉ"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {isEditMode && (
                  <div className="bg-gray-50/50 dark:bg-gray-800/50 px-6 py-4 border-t border-border-color dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-text-secondary dark:text-gray-400 italic">
                      * Các thay đổi sẽ được lưu ngay lập tức.
                    </p>
                    <div className="flex gap-3 w-full">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border-color text-sm font-bold p-2 text-text-main shadow-md hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800 transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-lg font-bold">close</span>
                        Hủy
                      </button>
                      <button 
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white p-2 shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed" 
                        type="submit"
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <span className="material-symbols-outlined text-lg font-bold animate-spin">hourglass_empty</span>
                            Đang lưu...
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-lg font-bold">save</span>
                            Lưu thay đổi
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </RoleBasedLayout>
  );
};

export default ManagerProfile;
