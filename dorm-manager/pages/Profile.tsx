import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import DashboardLayout from '../layouts/DashboardLayout';
import { STUDENT_NAV_ITEMS } from './StudentDashboard';
import { MANAGER_NAV_ITEMS } from './ManagerDashboard';
import { UserRole } from '../types';
import { getStudentById, StudentProfile } from '../api/studentApi';

interface ProfileProps {
  isManager?: boolean;
}

const Profile: React.FC<ProfileProps> = ({ isManager = false }) => {
  const { user } = useContext(AuthContext);
  const { id: studentIdFromUrl } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<StudentProfile | null>(null);
  const [formData, setFormData] = useState({
    phone: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showChangeRoomModal, setShowChangeRoomModal] = useState(false);
  const [showRemoveRoomModal, setShowRemoveRoomModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Determine which student ID to use
  // If URL has student ID (manager viewing), use that; otherwise use logged-in user's ID
  const studentId = studentIdFromUrl || user?.id;

  // Load dữ liệu sinh viên từ API
  useEffect(() => {
    const loadStudentData = async () => {
      if (!studentId) return;
      
      try {
        setIsLoading(true);
        const data = await getStudentById(studentId);
        setStudentData(data);
        setFormData({
          phone: data.phone_number || '',
          email: data.email || ''
        });
        setError(null);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu sinh viên:', err);
        setError('Không thể tải thông tin sinh viên');
        // Nếu không load được, sử dụng dữ liệu từ user context
        setFormData({
          phone: '',
          email: ''
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStudentData();
  }, [studentId]);

  if (!user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // TODO: Thêm API call để cập nhật thông tin
      setShowSuccessMessage(true);
      setIsEditMode(false);
      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error('Lỗi khi cập nhật thông tin:', err);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    // Restore original data
    if (studentData) {
      setFormData({
        phone: studentData.phone_number || '',
        email: studentData.email || ''
      });
    }
  };

  return (
    <DashboardLayout 
      navItems={isManager ? MANAGER_NAV_ITEMS.map(item => ({...item, isActive: false})) : STUDENT_NAV_ITEMS.map(item => ({...item, isActive: item.link === '/student/profile'}))}
      searchPlaceholder="Tìm kiếm..."
      headerTitle={isManager ? "Thông tin sinh viên" : "Thông tin cá nhân"}
    >
      {isManager && <button
            onClick={() => navigate('/manager/students')}
            className="group flex items-center gap-2 mb-2 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            <div className="flex items-center justify-center size-8 rounded-full group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </div>
            <span className="text-sm font-bold leading-normal">Quay lại danh sách</span>
          </button>}
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
          <>
        {/* Profile Header Card */}
        <div className="rounded-2xl border border-border-color bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-surface-dark overflow-hidden relative">
          <div className="absolute right-0 top-0 h-full w-1/4 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
          <div className="relative flex flex-col items-center gap-8 sm:flex-row">
            <div className="relative group cursor-pointer shrink-0">
              <div 
                className="h-28 w-28 overflow-hidden rounded-full border-4 border-gray-50 shadow-md dark:border-gray-700 bg-center bg-cover bg-no-repeat transition-transform hover:scale-105" 
                style={{ backgroundImage: `url("${user?.avatar}")` }}
              ></div>
              {!isManager && (
                <div className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-white dark:ring-surface-dark transition-all hover:scale-110 active:scale-95">
                  <span className="material-symbols-outlined text-lg font-bold">edit</span>
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
              <div className="mb-2 flex items-center gap-3 flex-wrap justify-center sm:justify-start">
                <h2 className="text-2xl font-black text-text-main dark:text-white">{studentData?.full_name}</h2>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">MSSV: <span className="font-bold text-text-main dark:text-white">{studentData?.mssv}</span></p>
                <p className="text-text-secondary dark:text-gray-400 text-sm font-medium flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">school</span>
                  {studentData?.class_name || 'Chưa cập nhật'}
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
            {!isManager && !isEditMode  && (
              <div className="shrink-0">
                <button 
                  onClick={() => setIsEditMode(true)}
                  className="flex items-center justify-center gap-2 h-11 px-5 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  <span>Chỉnh sửa</span>
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
                    <span className="text-sm font-bold text-text-main dark:text-white">{studentData?.full_name}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500">Mã số sinh viên</label>
                  <div className="flex items-center rounded-xl border border-border-color bg-gray-50 h-11 px-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <span className="text-sm font-bold text-text-main dark:text-white">{studentData?.mssv}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500">Ngày sinh</label>
                  <div className="flex items-center rounded-xl border border-border-color bg-gray-50 h-11 px-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <span className="material-symbols-outlined mr-3 text-text-secondary text-lg">calendar_today</span>
                    <span className="text-sm font-bold text-text-main dark:text-white">Chưa cập nhật</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500">Giới tính</label>
                  <div className="flex items-center rounded-xl border border-border-color bg-gray-50 h-11 px-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <span className="text-sm font-bold text-text-main dark:text-white">{studentData?.gender || 'Chưa cập nhật'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500">Lớp sinh hoạt</label>
                  <div className="flex items-center rounded-xl border border-border-color bg-gray-50 h-11 px-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <span className="text-sm font-bold text-text-main dark:text-white">{studentData?.class_name || 'Chưa cập nhật'}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500">Số CCCD</label>
                  <div className="flex items-center rounded-xl border border-border-color bg-gray-50 h-11 px-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <span className="text-sm font-bold text-text-main dark:text-white">Chưa cập nhật</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500">Phòng ở hiện tại</label>
                  <div className="flex items-center rounded-xl border border-border-color bg-gray-50 h-11 px-4 dark:border-gray-700 dark:bg-gray-800/50">
                    <span className="material-symbols-outlined mr-3 text-text-secondary text-lg">location_on</span>
                    <span className="text-sm font-bold text-text-main dark:text-white">
                      {studentData?.room_number && studentData?.building_name 
                        ? `${studentData?.room_number} - ${studentData?.building_name}`
                        : 'Chưa cập nhật'
                      }
                    </span>
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
                    />
                  </div>
                </div>

                <div className="mt-auto pt-10">
                  {!isManager && isEditMode && (
                    <div className="flex gap-3">
                      <button 
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border-color text-sm font-black p-2 text-text-main shadow-md hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800 transition-all uppercase tracking-wider"
                      >
                        <span className="material-symbols-outlined text-lg font-bold">close</span>
                        Hủy
                      </button>
                      <button 
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-black text-white p-2 shadow-lg shadow-primary/20 hover:bg-primary-hover active:scale-[0.98] transition-all uppercase tracking-wider" 
                        type="submit"
                      >
                        <span className="material-symbols-outlined text-lg font-bold">save</span>
                        Lưu thay đổi
                      </button>
                    </div>
                  )}
                </div>

                {/* Success Message */}
                {showSuccessMessage && (
                  <div className="animate-in fade-in slide-in-from-top duration-300 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 p-3 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Thông tin đã được cập nhật thành công!</span>
                  </div>
                )}
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
          </>
      </div>
    </DashboardLayout>
  );
};

export default Profile;