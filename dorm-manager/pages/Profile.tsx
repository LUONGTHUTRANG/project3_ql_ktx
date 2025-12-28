import React, { useContext, useState } from 'react';
import { AuthContext } from '../App';
import DashboardLayout from '../layouts/DashboardLayout';
import { STUDENT_NAV_ITEMS } from './StudentDashboard';
import { MANAGER_NAV_ITEMS } from './ManagerDashboard';
import { UserRole } from '../types';

interface ProfileProps {
  isManager?: boolean;
}

const Profile: React.FC<ProfileProps> = ({ isManager = false }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    phone: '0987654321',
    email: 'nguyenvanA@gmail.com'
  });
  const [showChangeRoomModal, setShowChangeRoomModal] = useState(false);
  const [showRemoveRoomModal, setShowRemoveRoomModal] = useState(false);

  if (!user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    alert('Thông tin liên lạc đã được cập nhật thành công!');
  };

  return (
    <DashboardLayout 
      navItems={isManager ? MANAGER_NAV_ITEMS.map(item => ({...item, isActive: false})) : STUDENT_NAV_ITEMS.map(item => ({...item, isActive: item.link === '/student/profile'}))}
      searchPlaceholder="Tìm kiếm..."
      headerTitle={isManager ? "Thông tin sinh viên" : "Thông tin cá nhân"}
    >
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-in fade-in duration-500">

        {/* Profile Header Card */}
        <div className="rounded-2xl border border-border-color bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-surface-dark overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
          <div className="relative flex flex-col items-center gap-8 sm:flex-row">
            <div className="relative group cursor-pointer shrink-0">
              <div 
                className="h-28 w-28 overflow-hidden rounded-full border-4 border-gray-50 shadow-md dark:border-gray-700 bg-center bg-cover bg-no-repeat transition-transform hover:scale-105" 
                style={{ backgroundImage: `url("${user.avatar}")` }}
              ></div>
              {!isManager && (
                <div className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-white dark:ring-surface-dark transition-all hover:scale-110 active:scale-95">
                  <span className="material-symbols-outlined text-lg font-bold">edit</span>
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
              <div className="mb-2 flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                <h2 className="text-2xl font-black text-text-main dark:text-white">{user.name}</h2>
                <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-black text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-800 uppercase tracking-wider">Đang ở KTX</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">MSSV: <span className="font-bold text-text-main dark:text-white">{user.id.replace('S', '')}</span></p>
                <p className="text-text-secondary dark:text-gray-400 text-sm font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">school</span>
                  Khoa Công nghệ Thông tin - K65
                </p>
              </div>
            </div>
            {isManager && (
              <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                <button 
                  onClick={() => setShowChangeRoomModal(true)}
                  className="flex items-center justify-center gap-2 h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                  <span>Chuyển phòng</span>
                </button>
                <button 
                  onClick={() => setShowRemoveRoomModal(true)}
                  className="flex items-center justify-center gap-2 h-10 px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Xóa khỏi phòng</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Form Content */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left Column: Basic Info (Read Only) */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="rounded-2xl border border-border-color bg-white dark:border-gray-700 dark:bg-surface-dark shadow-sm">
              <div className="border-b border-border-color px-6 py-5 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
                <h3 className="flex items-center gap-3 text-lg font-black text-text-main dark:text-white">
                  <span className="material-symbols-outlined text-primary font-bold">badge</span>
                  Thông tin cơ bản
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500">Họ và tên</label>
                  <div className="flex items-center rounded-xl border border-border-color bg-gray-50 h-11 px-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <span className="text-sm font-bold text-text-main dark:text-white">{user.name}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500">Mã số sinh viên</label>
                  <div className="flex items-center rounded-xl border border-border-color bg-gray-50 h-11 px-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <span className="text-sm font-bold text-text-main dark:text-white">{user.id.replace('S', '')}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500">Ngày sinh</label>
                  <div className="flex items-center rounded-xl border border-border-color bg-gray-50 h-11 px-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <span className="material-symbols-outlined mr-3 text-text-secondary text-lg">calendar_today</span>
                    <span className="text-sm font-bold text-text-main dark:text-white">15/08/2002</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500">Giới tính</label>
                  <div className="flex items-center rounded-xl border border-border-color bg-gray-50 h-11 px-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <span className="text-sm font-bold text-text-main dark:text-white">Nam</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500">Lớp sinh hoạt</label>
                  <div className="flex items-center rounded-xl border border-border-color bg-gray-50 h-11 px-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <span className="text-sm font-bold text-text-main dark:text-white">CNTT-K65</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500">Số CCCD</label>
                  <div className="flex items-center rounded-xl border border-border-color bg-gray-50 h-11 px-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <span className="text-sm font-bold text-text-main dark:text-white">001202012345</span>
                    <span className="ml-auto material-symbols-outlined text-green-600 text-lg font-bold" title="Đã xác thực">verified</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500">Quê quán</label>
                  <div className="flex items-center rounded-xl border border-border-color bg-gray-50 h-11 px-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <span className="material-symbols-outlined mr-3 text-text-secondary text-lg">location_on</span>
                    <span className="text-sm font-bold text-text-main dark:text-white">Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội</span>
                  </div>
                </div>

              </div>
              {!isManager && (
                <div className="px-6 py-4 bg-primary/5 dark:bg-primary/10 rounded-b-2xl border-t border-primary/10">
                  <p className="text-xs text-primary font-bold flex items-center gap-2 italic">
                    <span className="material-symbols-outlined text-[16px]">info</span>
                    Thông tin cơ bản được đồng bộ từ hệ thống quản lý sinh viên. Vui lòng liên hệ phòng Đào tạo nếu có sai sót.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Contact Info (Editable) */}
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border-color bg-white dark:border-gray-700 dark:bg-surface-dark shadow-sm h-full flex flex-col">
              <div className="border-b border-border-color px-6 py-5 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/20">
                <h3 className="flex items-center gap-3 text-lg font-black text-text-main dark:text-white">
                  <span className="material-symbols-outlined text-primary font-bold">contact_phone</span>
                  Liên lạc
                </h3>
              </div>
              <div className="flex flex-col gap-6 p-6 flex-1">
                {!isManager && (
                  <div className="rounded-xl bg-blue-50/50 p-4 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 border border-blue-100 dark:border-blue-900/30">
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-lg">info</span>
                      <span className="leading-relaxed">Thông tin dưới đây dùng để liên lạc khi khẩn cấp, vui lòng cập nhật chính xác.</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500" htmlFor="phone">Số điện thoại</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="material-symbols-outlined text-text-secondary text-lg">call</span>
                    </div>
                    <input 
                      className="block w-full rounded-xl border border-border-color bg-white py-3 pl-10 text-sm font-bold text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all outline-none" 
                      id="phone" 
                      name="phone" 
                      type="tel" 
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500" htmlFor="email">Email cá nhân</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="material-symbols-outlined text-text-secondary text-lg">mail</span>
                    </div>
                    <input 
                      className="block w-full rounded-xl border border-border-color bg-white py-3 pl-10 text-sm font-bold text-text-main shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white transition-all outline-none" 
                      id="email" 
                      name="email" 
                      type="email" 
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="mt-auto pt-10">
                  {!isManager && (
                    <button 
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-sm font-black text-white shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all uppercase tracking-wider" 
                      type="submit"
                    >
                      <span className="material-symbols-outlined text-lg font-bold">save</span>
                      Lưu thay đổi
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Change Room Modal */}
        {showChangeRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">meeting_room</span>
                  Chuyển phòng
                </h3>
                <button 
                  onClick={() => setShowChangeRoomModal(false)}
                  className="text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <p className="text-sm text-text-secondary dark:text-gray-300 mb-6">Chọn phòng mới cho sinh viên:</p>
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-secondary dark:text-gray-400">Tòa nhà</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-border-color dark:border-gray-700 bg-white dark:bg-gray-800 text-text-main dark:text-white">
                    <option>Tòa A1</option>
                    <option>Tòa A2</option>
                    <option>Tòa B1</option>
                    <option>Tòa B2</option>
                    <option>Tòa C3</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-text-secondary dark:text-gray-400">Phòng</label>
                  <select className="w-full h-10 px-3 rounded-lg border border-border-color dark:border-gray-700 bg-white dark:bg-gray-800 text-text-main dark:text-white">
                    <option>P.101</option>
                    <option>P.102</option>
                    <option>P.201</option>
                    <option>P.305</option>
                    <option>P.402</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowChangeRoomModal(false)}
                  className="flex-1 h-10 px-4 rounded-lg border border-border-color dark:border-gray-700 text-text-main dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => {
                    alert('Chuyển phòng thành công!');
                    setShowChangeRoomModal(false);
                  }}
                  className="flex-1 h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors active:scale-95"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Remove from Room Modal */}
        {showRemoveRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-600">warning</span>
                  Xóa khỏi phòng
                </h3>
                <button 
                  onClick={() => setShowRemoveRoomModal(false)}
                  className="text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <p className="text-sm text-text-secondary dark:text-gray-300 mb-2">Bạn có chắc chắn muốn xóa sinh viên này khỏi phòng?</p>
              <p className="text-xs text-red-600 dark:text-red-400 mb-6 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
                <span className="material-symbols-outlined text-[16px] align-middle mr-2">info</span>
                Hành động này không thể hoàn tác. Sinh viên sẽ được đánh dấu là "Đã trả phòng".
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowRemoveRoomModal(false)}
                  className="flex-1 h-10 px-4 rounded-lg border border-border-color dark:border-gray-700 text-text-main dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Hủy
                </button>
                <button 
                  onClick={() => {
                    alert('Sinh viên đã được xóa khỏi phòng!');
                    setShowRemoveRoomModal(false);
                  }}
                  className="flex-1 h-10 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors active:scale-95"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Profile;