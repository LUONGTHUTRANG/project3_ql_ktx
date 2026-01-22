import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { Select, Switch, message } from 'antd';
import { createRegistration } from '../api/registrationApi';
import { fetchBuildings } from '../api/buildingApi';
import { getAllSemesters, Semester } from '../api/semesterApi';
import { getCurrentStay, CurrentStayInfo } from '../api/studentApi';

type RegistrationStatus = 'upcoming' | 'open' | 'closed';
type ActiveTab = 'regular' | 'special' | 'extension';

interface UploadedFile {
  name: string;
  size: string;
  url: string;
  file?: File; // Store the actual File object for upload
}

interface Building {
  id: number;
  name: string;
  location?: string;
  gender_restriction?: string;
}

const StudentRegistration: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [isGroupReg, setIsGroupReg] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState<string[]>(['Ngủ sớm']);
  const [activeTab, setActiveTab] = useState<ActiveTab>('regular');

  // Trạng thái cổng đăng ký: 'upcoming' (Chưa mở), 'open' (Đang mở), 'closed' (Đã đóng)
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('open');

  // Giả lập trạng thái sinh viên đã có chỗ ở hiện tại hay chưa để gia hạn
  const [hasCurrentStay, setHasCurrentStay] = useState<boolean>(false);

  // State quản lý tệp cho đơn đặc biệt
  const [specialFiles, setSpecialFiles] = useState<UploadedFile[]>([]);
  const specialFileInputRef = useRef<HTMLInputElement>(null);

  // State quản lý tệp cho đơn gia hạn
  const [extensionFiles, setExtensionFiles] = useState<UploadedFile[]>([]);
  const extensionFileInputRef = useRef<HTMLInputElement>(null);

  // ===== NEW STATES FOR API CONNECTION =====
  const [loading, setLoading] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [activeSemester, setActiveSemester] = useState<Semester | null>(null);

  // Form data states
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<string>('4');
  const [selectedFloor, setSelectedFloor] = useState<string>('any');
  const [priorityCategory, setPriorityCategory] = useState<string>('');
  const [priorityDescription, setPriorityDescription] = useState<string>('');
  const [extensionReason, setExtensionReason] = useState<string>('');

  // Current stay info for renewal
  const [currentStayInfo, setCurrentStayInfo] = useState<CurrentStayInfo | null>(null);
  const [loadingCurrentStay, setLoadingCurrentStay] = useState(false);

  // Fetch buildings and semester on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Fetch buildings
        const buildingsData = await fetchBuildings();
        setBuildings(buildingsData);

        // Fetch semesters and find active one
        const semesters = await getAllSemesters();
        const active = semesters.find((s: Semester) => s.is_active === 1);
        if (active) {
          setActiveSemester(active);
        }

        // Fetch current stay info for renewal tab
        await loadCurrentStay();
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    loadInitialData();
  }, []);

  // Load current stay info
  const loadCurrentStay = async () => {
    setLoadingCurrentStay(true);
    try {
      const response = await getCurrentStay();
      if (response.hasCurrentStay && response.data) {
        setHasCurrentStay(true);
        setCurrentStayInfo(response.data);
      } else {
        setHasCurrentStay(false);
        setCurrentStayInfo(null);
      }
    } catch (error) {
      console.error('Error loading current stay:', error);
      setHasCurrentStay(false);
      setCurrentStayInfo(null);
    } finally {
      setLoadingCurrentStay(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  if (!user) return null;

  const habits = [
    { label: 'Ngủ sớm', icon: 'bedtime' },
    { label: 'Thích yên tĩnh', icon: 'volume_off' },
    { label: 'Chơi thể thao', icon: 'fitness_center' },
    { label: 'Chăm học', icon: 'menu_book' },
    { label: 'Không hút thuốc', icon: 'smoke_free' },
    { label: 'Yêu động vật', icon: 'pets' },
  ];

  const toggleHabit = (habit: string) => {
    setSelectedHabits(prev =>
      prev.includes(habit) ? prev.filter(h => h !== habit) : [...prev, habit]
    );
  };

  const cycleStatus = () => {
    if (registrationStatus === 'upcoming') setRegistrationStatus('open');
    else if (registrationStatus === 'open') setRegistrationStatus('closed');
    else setRegistrationStatus('upcoming');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).map((file: File) => ({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        url: URL.createObjectURL(file),
        file: file, // Store the actual File object for upload
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
    if (e.target) e.target.value = '';
  };

  const removeFile = (index: number, setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ===== SUBMIT HANDLER =====
  const handleSubmit = async () => {
    if (!user) {
      message.error('Vui lòng đăng nhập để tiếp tục');
      return;
    }

    setLoading(true);
    try {
      let registrationType: 'NORMAL' | 'PRIORITY' | 'RENEWAL' = 'NORMAL';
      let evidenceFile: File | null = null;
      let priorityCat: 'NONE' | 'POOR_HOUSEHOLD' | 'DISABILITY' | 'OTHER' = 'NONE';
      let priorityDesc: string | null = null;

      // Determine registration type based on active tab
      if (activeTab === 'regular') {
        registrationType = 'NORMAL';
      } else if (activeTab === 'special') {
        registrationType = 'PRIORITY';
        // Map priority category
        if (priorityCategory === '1') priorityCat = 'OTHER'; // Con liệt sĩ
        else if (priorityCategory === '2') priorityCat = 'DISABILITY';
        else if (priorityCategory === '3') priorityCat = 'POOR_HOUSEHOLD';
        else if (priorityCategory === '4') priorityCat = 'OTHER'; // Dân tộc thiểu số

        priorityDesc = priorityDescription || null;

        // Get evidence file
        if (specialFiles.length > 0 && specialFiles[0].file) {
          evidenceFile = specialFiles[0].file;
        }
      } else if (activeTab === 'extension') {
        registrationType = 'RENEWAL';
        priorityDesc = extensionReason || null;

        // Get evidence file for extension
        if (extensionFiles.length > 0 && extensionFiles[0].file) {
          evidenceFile = extensionFiles[0].file;
        }
      }

      // For renewal, use current room's building if available
      const buildingIdToSend = activeTab === 'extension' && currentStayInfo
        ? currentStayInfo.building_id
        : selectedBuildingId;

      const roomIdToSend = activeTab === 'extension' && currentStayInfo
        ? currentStayInfo.room_id
        : null;

      // Call API
      const result = await createRegistration({
        student_id: user.id,
        registration_type: registrationType,
        desired_building_id: buildingIdToSend,
        desired_room_id: roomIdToSend,
        priority_category: priorityCat,
        priority_description: priorityDesc,
        evidence: evidenceFile,
      });

      message.success(result.message || 'Đăng ký thành công!');

      // Reset form after success
      setSelectedBuildingId(null);
      setPriorityCategory('');
      setPriorityDescription('');
      setExtensionReason('');
      setSpecialFiles([]);
      setExtensionFiles([]);

    } catch (error: any) {
      message.error(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleBasedLayout
      searchPlaceholder="Tìm kiếm..."
      headerTitle="Đăng ký Nội trú"
    >
      <div className="mx-auto flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Page Heading */}
        <div className="flex flex-col gap-2">
          <h1 className="text-text-main dark:text-white text-3xl font-bold tracking-tight">Đăng ký Chỗ ở</h1>
          <p className="text-text-secondary dark:text-gray-400 text-base">
            Theo dõi trạng thái và thời gian mở đăng ký chỗ ở KTX năm học 2024-2025.
          </p>
        </div>

        {/* Container with Tabs */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-sm border border-border-color dark:border-gray-700 overflow-hidden">
          <div className="border-b border-border-color dark:border-gray-700">
            <div className="flex gap-0 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('regular')}
                className={`group flex items-center gap-2 border-b-[3px] pb-3 pt-4 px-6 cursor-pointer transition-all ${activeTab === 'regular'
                  ? 'border-b-primary text-primary'
                  : 'border-b-transparent text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white'
                  }`}
              >
                <span className={`material-symbols-outlined ${activeTab === 'regular' ? 'fill' : ''}`}>assignment</span>
                <p className="text-sm font-bold whitespace-nowrap">Đơn đăng ký thông thường</p>
              </button>
              <button
                onClick={() => setActiveTab('special')}
                className={`group flex items-center gap-2 border-b-[3px] pb-3 pt-4 px-6 cursor-pointer transition-all ${activeTab === 'special'
                  ? 'border-b-primary text-primary'
                  : 'border-b-transparent text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white'
                  }`}
              >
                <span className={`material-symbols-outlined ${activeTab === 'special' ? 'fill' : ''}`}>star</span>
                <p className="text-sm font-bold whitespace-nowrap">Đơn ưu tiên / Đặc biệt</p>
              </button>
              <button
                onClick={() => setActiveTab('extension')}
                className={`group flex items-center gap-2 border-b-[3px] pb-3 pt-4 px-6 cursor-pointer transition-all ${activeTab === 'extension'
                  ? 'border-b-primary text-primary'
                  : 'border-b-transparent text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white'
                  }`}
              >
                <span className={`material-symbols-outlined ${activeTab === 'extension' ? 'fill' : ''}`}>history_edu</span>
                <p className="text-sm font-bold whitespace-nowrap">Gia hạn chỗ ở</p>
              </button>
            </div>
          </div>

          {registrationStatus === 'upcoming' && (
            /* CASE: PORT NOT YET OPEN */
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center w-full animate-in fade-in zoom-in duration-500">
              <div className="size-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-primary text-[48px]">calendar_clock</span>
              </div>
              <h3 className="text-text-main dark:text-white text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                Cổng đăng ký chưa mở
              </h3>
              <p className="text-text-secondary dark:text-gray-400 text-base max-w-[500px] mb-10 leading-relaxed">
                Hiện tại hệ thống chưa mở tiếp nhận đơn đăng ký chỗ ở cho học kỳ này. Vui lòng quay lại vào thời gian đăng ký dự kiến bên dưới.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-border-color dark:border-gray-700 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Mở đăng ký</span>
                  </div>
                  <span className="text-lg md:text-xl font-bold text-primary">08:00 - 20/08/2024</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-border-color dark:border-gray-700 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">event_busy</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Đóng đăng ký</span>
                  </div>
                  <span className="text-lg md:text-xl font-bold text-text-main dark:text-white">17:00 - 30/08/2024</span>
                </div>
              </div>

              <div className="w-full max-w-md border-t border-border-color dark:border-gray-700 pt-8 flex flex-col items-center gap-4">
                <p className="text-text-main dark:text-gray-300 font-medium text-sm">Bạn có thắc mắc hoặc cần hỗ trợ đặc biệt?</p>
                <div className="flex flex-wrap justify-center gap-4 w-full">
                  <a className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border-color dark:border-gray-700 text-text-main dark:text-white text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary transition-all bg-white dark:bg-surface-dark min-w-[140px] shadow-sm" href="tel:02412345678">
                    <span className="material-symbols-outlined text-[20px]">call</span>
                    Gọi Hotline
                  </a>
                  <a className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border-color dark:border-gray-700 text-text-main dark:text-white text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary transition-all bg-white dark:bg-surface-dark min-w-[140px] shadow-sm" href="mailto:ktx@school.edu.vn">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                    Gửi Email
                  </a>
                </div>
              </div>
            </div>
          )}

          {registrationStatus === 'closed' && (
            /* CASE: PORT CLOSED */
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center w-full animate-in fade-in zoom-in duration-500">
              <div className="size-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-red-600 text-[48px]">timer_off</span>
              </div>
              <h3 className="text-text-main dark:text-white text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                Cổng đăng ký đã đóng
              </h3>
              <p className="text-text-secondary dark:text-gray-400 text-base max-w-[500px] mb-10 leading-relaxed">
                Thời gian tiếp nhận đơn đăng ký chỗ ở cho đợt này đã kết thúc. Hệ thống hiện không còn nhận thêm yêu cầu mới. Vui lòng quay lại trong đợt đăng ký tiếp theo.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-border-color dark:border-gray-700 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">history</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Đã mở đăng ký</span>
                  </div>
                  <span className="text-lg md:text-xl font-bold text-text-secondary dark:text-gray-400">08:00 - 20/08/2024</span>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-900/30 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <span className="material-symbols-outlined text-[20px]">event_busy</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Đã đóng đăng ký</span>
                  </div>
                  <span className="text-lg md:text-xl font-bold text-red-700 dark:text-red-400">17:00 - 30/08/2024</span>
                </div>
              </div>

              <div className="w-full max-w-md border-t border-border-color dark:border-gray-700 pt-8 flex flex-col items-center gap-4">
                <p className="text-text-main dark:text-gray-300 font-medium text-sm">Bạn đã bỏ lỡ đợt đăng ký hoặc cần hỗ trợ?</p>
                <div className="flex flex-wrap justify-center gap-4 w-full">
                  <a className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border-color dark:border-gray-700 text-text-main dark:text-white text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary transition-all bg-white dark:bg-surface-dark min-w-[140px] shadow-sm" href="tel:02412345678">
                    <span className="material-symbols-outlined text-[20px]">call</span>
                    Gọi Hotline
                  </a>
                  <a className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border-color dark:border-gray-700 text-text-main dark:text-white text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary transition-all bg-white dark:bg-surface-dark min-w-[140px] shadow-sm" href="mailto:ktx@school.edu.vn">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                    Gửi Email
                  </a>
                </div>
              </div>
            </div>
          )}

          {registrationStatus === 'open' && (
            <div className="p-6 md:p-8 flex flex-col gap-8 animate-in fade-in duration-500">
              {activeTab === 'regular' && (
                /* REGULAR FORM CONTENT */
                <>
                  {/* Section 1: Personal Info */}
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3 border-b border-dashed border-border-color dark:border-gray-700 pb-3">
                      <span className="material-symbols-outlined text-primary text-2xl font-bold">person</span>
                      <h2 className="text-text-main dark:text-white text-xl font-bold">Thông tin cá nhân</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-bold">Mã số sinh viên</span>
                        <div className="relative group">
                          <input
                            className="w-full h-11 rounded-lg border border-border-color bg-gray-50 dark:bg-gray-800 dark:border-gray-700 px-4 text-text-secondary dark:text-gray-400 cursor-not-allowed text-sm"
                            readOnly
                            value={user.mssv || ''}
                          />
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">lock</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-bold">Họ và tên</span>
                        <div className="relative group">
                          <input
                            className="w-full h-11 rounded-lg border border-border-color bg-gray-50 dark:bg-gray-800 dark:border-gray-700 px-4 text-text-secondary dark:text-gray-400 cursor-not-allowed text-sm"
                            readOnly
                            value={user.name}
                          />
                          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">lock</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-bold">Lớp sinh hoạt</span>
                        <input
                          className="w-full h-11 rounded-lg border border-border-color dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-text-main dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                          placeholder="Ví dụ: CNTT2024"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-bold">Số điện thoại</span>
                        <input
                          className="w-full h-11 rounded-lg border border-border-color dark:border-gray-700 bg-white dark:bg-gray-800 px-4 text-text-main dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                          placeholder="09xx xxx xxx"
                          type="tel"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Lifestyle & Preferences */}
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3 border-b border-dashed border-border-color dark:border-gray-700 pb-3">
                      <span className="material-symbols-outlined text-primary text-2xl font-bold">interests</span>
                      <h2 className="text-text-main dark:text-white text-xl font-bold">Sở thích & Thói quen</h2>
                    </div>
                    <p className="text-sm text-text-secondary dark:text-gray-400 -mt-2">Chọn các đặc điểm phù hợp với bạn để chúng tôi tìm bạn cùng phòng phù hợp nhất.</p>
                    <div className="flex flex-wrap gap-3">
                      {habits.map((habit) => (
                        <button
                          key={habit.label}
                          onClick={() => toggleHabit(habit.label)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-all ${selectedHabits.includes(habit.label)
                            ? 'bg-primary border-primary text-white shadow-md shadow-primary/20 scale-105'
                            : 'bg-white dark:bg-gray-800 border-border-color dark:border-gray-700 text-text-main dark:text-gray-200 hover:border-primary/50'
                            }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">{habit.icon}</span>
                          {habit.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Room Requests */}
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3 border-b border-dashed border-border-color dark:border-gray-700 pb-3">
                      <span className="material-symbols-outlined text-primary text-2xl font-bold">apartment</span>
                      <h2 className="text-text-main dark:text-white text-xl font-bold">Nguyện vọng phòng ở</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-bold">Loại phòng</span>
                        <Select
                          className="w-full h-11"
                          defaultValue="4"
                          options={[
                            { value: '4', label: '4 Người (Tiêu chuẩn)' },
                            { value: '6', label: '6 Người (Phổ thông)' },
                            { value: '8', label: '8 Người (Tiết kiệm)' },
                          ]}
                          suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">expand_more</span>}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-bold">Tòa nhà mong muốn</span>
                        <Select
                          className="w-full h-11"
                          placeholder="Chọn tòa nhà"
                          value={selectedBuildingId}
                          onChange={(value) => setSelectedBuildingId(value)}
                          options={buildings.map(b => ({ value: b.id, label: b.name }))}
                          suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">expand_more</span>}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-bold">Tầng ưu tiên</span>
                        <Select
                          className="w-full h-11"
                          defaultValue="any"
                          options={[
                            { value: 'low', label: 'Tầng thấp (1-3)' },
                            { value: 'mid', label: 'Tầng trung (4-7)' },
                            { value: 'high', label: 'Tầng cao (8+)' },
                            { value: 'any', label: 'Tầng bất kỳ' },
                          ]}
                          suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">expand_more</span>}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: Group Registration */}
                  <div className="flex flex-col gap-4 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-dashed border-border-color dark:border-gray-700 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-2xl font-bold">groups</span>
                        </div>
                        <div>
                          <h3 className="text-text-main dark:text-white text-lg font-bold">Đăng ký theo nhóm</h3>
                          <p className="text-xs text-text-secondary dark:text-gray-400">Bạn muốn ở cùng bạn bè? Hãy nhập MSSV của họ.</p>
                        </div>
                      </div>
                      <Switch
                        checked={isGroupReg}
                        onChange={setIsGroupReg}
                        className={isGroupReg ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}
                      />
                    </div>

                    {isGroupReg && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 animate-in slide-in-from-top-2 duration-300">
                        <div className="flex flex-col gap-2">
                          <span className="text-text-main dark:text-gray-200 text-xs font-bold uppercase tracking-wider">MSSV Bạn cùng phòng 1</span>
                          <div className="flex gap-2">
                            <input className="flex-1 h-11 px-4 rounded-lg border border-border-color dark:border-gray-700 bg-white dark:bg-gray-800 text-text-main dark:text-white text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="Nhập MSSV" />
                            <button className="h-11 px-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors flex items-center justify-center">
                              <span className="material-symbols-outlined">check_circle</span>
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <span className="text-text-main dark:text-gray-200 text-xs font-bold uppercase tracking-wider">MSSV Bạn cùng phòng 2</span>
                          <div className="flex gap-2">
                            <input className="flex-1 h-11 px-4 rounded-lg border border-border-color dark:border-gray-700 bg-white dark:bg-gray-800 text-text-main dark:text-white text-sm focus:ring-1 focus:ring-primary outline-none" placeholder="Nhập MSSV" />
                            <button className="h-11 px-3 bg-gray-100 dark:bg-gray-700 text-text-secondary dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-center">
                              <span className="material-symbols-outlined">add</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'special' && (
                /* SPECIAL FORM CONTENT */
                <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  {/* Alert Banner */}
                  <div className="bg-blue-50 dark:bg-blue-900/10 border-l-4 border-primary p-4 rounded-r-lg">
                    <div className="flex gap-3">
                      <span className="material-symbols-outlined text-primary">info</span>
                      <div>
                        <h3 className="font-bold text-text-main dark:text-white text-sm">Đơn đăng ký hoàn cảnh đặc biệt</h3>
                        <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">Dành cho sinh viên thuộc diện chính sách, khuyết tật hoặc hộ nghèo. Cần tải lên giấy tờ minh chứng hợp lệ.</p>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Student Info */}
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3 border-b border-dashed border-border-color dark:border-gray-700 pb-3">
                      <span className="material-symbols-outlined text-primary text-2xl font-bold bg-primary/10 rounded-full p-1">person</span>
                      <h2 className="text-text-main dark:text-white text-xl font-bold">Thông tin sinh viên</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-medium">Họ và tên</span>
                        <input className="h-11 w-full rounded-lg border border-border-color bg-gray-50 dark:bg-gray-800 dark:border-gray-700 px-4 text-text-main dark:text-white text-sm cursor-not-allowed font-medium" disabled value={user.name} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-medium">Mã số sinh viên</span>
                        <input className="h-11 w-full rounded-lg border border-border-color bg-gray-50 dark:bg-gray-800 dark:border-gray-700 px-4 text-text-main dark:text-white text-sm cursor-not-allowed font-medium" disabled value={user.mssv || ''} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-medium">Lớp sinh hoạt</span>
                        <input className="h-11 w-full rounded-lg border border-border-color bg-gray-50 dark:bg-gray-800 dark:border-gray-700 px-4 text-text-main dark:text-white text-sm cursor-not-allowed font-medium" disabled value="K65 - Công nghệ thông tin 01" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-medium">Giới tính</span>
                        <input className="h-11 w-full rounded-lg border border-border-color bg-gray-50 dark:bg-gray-800 dark:border-gray-700 px-4 text-text-main dark:text-white text-sm cursor-not-allowed font-medium" disabled value="Nam" />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Preferences */}
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3 border-b border-dashed border-border-color dark:border-gray-700 pb-3">
                      <span className="material-symbols-outlined text-primary text-2xl font-bold bg-primary/10 rounded-full p-1">bedroom_parent</span>
                      <h2 className="text-text-main dark:text-white text-xl font-bold">Nguyện vọng phòng ở</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-medium">Loại phòng <span className="text-red-500">*</span></span>
                        <Select
                          className="w-full h-11"
                          placeholder="Chọn loại phòng"
                          options={[
                            { value: '4', label: 'Phòng 4 người (Chất lượng cao)' },
                            { value: '6', label: 'Phòng 6 người' },
                            { value: '8', label: 'Phòng 8 người (Tiêu chuẩn)' },
                          ]}
                          suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">expand_more</span>}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-medium">Tòa nhà mong muốn</span>
                        <Select
                          className="w-full h-11"
                          placeholder="Chọn tòa nhà"
                          value={selectedBuildingId}
                          onChange={(value) => setSelectedBuildingId(value)}
                          options={buildings.map(b => ({ value: b.id, label: b.name }))}
                          suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">expand_more</span>}
                        />
                      </div>
                      <div className="flex flex-col gap-2 md:col-span-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-medium">Ghi chú / Yêu cầu bạn cùng phòng</span>
                        <textarea className="h-24 w-full rounded-lg border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark p-4 text-text-main dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none transition-shadow" placeholder="VD: Mong muốn ở cùng bạn Nguyễn Văn B (MSSV: 2024...), cùng sở thích thể thao, yên tĩnh..."></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Special Circumstances */}
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3 border-b border-dashed border-border-color dark:border-gray-700 pb-3">
                      <span className="material-symbols-outlined text-primary text-2xl font-bold bg-primary/10 rounded-full p-1">verified</span>
                      <h2 className="text-text-main dark:text-white text-xl font-bold">Hồ sơ ưu tiên</h2>
                    </div>
                    <p className="text-sm text-text-secondary dark:text-gray-400 -mt-2">Vui lòng chọn diện ưu tiên và tải lên ảnh chụp hoặc bản scan giấy tờ chứng minh.</p>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-medium">Diện ưu tiên <span className="text-red-500">*</span></span>
                        <Select
                          className="w-full h-11"
                          placeholder="Chọn diện ưu tiên"
                          value={priorityCategory}
                          onChange={(value) => setPriorityCategory(value)}
                          options={[
                            { value: '1', label: 'Con liệt sĩ, con thương binh, bệnh binh' },
                            { value: '2', label: 'Sinh viên khuyết tật' },
                            { value: '3', label: 'Hộ nghèo, hộ cận nghèo' },
                            { value: '4', label: 'Người dân tộc thiểu số ở vùng cao' },
                          ]}
                          suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">expand_more</span>}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-medium">Minh chứng kèm theo <span className="text-red-500">*</span></span>

                        {/* Hidden File Input */}
                        <input
                          type="file"
                          ref={specialFileInputRef}
                          onChange={(e) => handleFileChange(e, setSpecialFiles)}
                          multiple
                          className="hidden"
                          accept=".png,.jpg,.jpeg,.pdf"
                        />

                        {/* Upload Trigger Area */}
                        <div
                          onClick={() => specialFileInputRef.current?.click()}
                          className="border-2 border-dashed border-border-color dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-800/30 hover:bg-white dark:hover:bg-gray-800 hover:border-primary transition-colors cursor-pointer group/upload"
                        >
                          <div className="size-12 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center shadow-sm group-hover/upload:shadow-md transition-shadow">
                            <span className="material-symbols-outlined text-text-secondary group-hover/upload:text-primary text-2xl">cloud_upload</span>
                          </div>
                          <div className="text-center">
                            <p className="text-text-main dark:text-white font-medium text-sm"><span className="text-primary font-bold">Bấm để tải lên</span> hoặc kéo thả tệp vào đây</p>
                            <p className="text-text-secondary dark:text-gray-400 text-xs mt-1">Hỗ trợ định dạng: PNG, JPG, PDF (Tối đa 5MB)</p>
                          </div>
                        </div>

                        {/* List of Uploaded Files */}
                        <div className="flex flex-col gap-2 mt-2">
                          {specialFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border border-border-color dark:border-gray-700 rounded-lg bg-white dark:bg-surface-dark animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="flex items-center gap-3">
                                <div className={`rounded p-1.5 flex items-center justify-center ${file.name.toLowerCase().endsWith('.pdf') ? 'bg-red-50 dark:bg-red-900/30 text-red-600' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'}`}>
                                  <span className="material-symbols-outlined text-[20px]">
                                    {file.name.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'image'}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-text-main dark:text-white truncate max-w-[200px] md:max-w-md">{file.name}</span>
                                  <span className="text-xs text-text-secondary dark:text-gray-500">{file.size}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFile(idx, setSpecialFiles)}
                                className="text-text-secondary hover:text-red-500 transition-colors p-1"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'extension' && (
                /* EXTENSION TAB CONTENT */
                loadingCurrentStay ? (
                  /* LOADING STATE */
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                    <p className="text-text-secondary dark:text-gray-400">Đang tải thông tin chỗ ở...</p>
                  </div>
                ) : hasCurrentStay && currentStayInfo ? (
                  /* CASE: HAS CURRENT STAY - Show Form */
                  <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    {/* Section 1: Current Info */}
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center gap-3 border-b border-dashed border-border-color dark:border-gray-700 pb-3">
                        <span className="material-symbols-outlined text-primary text-2xl font-bold bg-primary/10 rounded-full p-1">info</span>
                        <h2 className="text-text-main dark:text-white text-xl font-bold">Thông tin hiện tại</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-1 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-border-color dark:border-gray-700">
                          <span className="text-text-secondary dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Phòng hiện tại</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="material-symbols-outlined text-text-secondary dark:text-gray-500" style={{ fontSize: '20px' }}>meeting_room</span>
                            <span className="text-text-main dark:text-white text-base font-bold">
                              {currentStayInfo.room_number} - {currentStayInfo.building_name}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-border-color dark:border-gray-700">
                          <span className="text-text-secondary dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Kỳ học hiện tại</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="material-symbols-outlined text-text-secondary dark:text-gray-500" style={{ fontSize: '20px' }}>school</span>
                            <span className="text-text-main dark:text-white text-base font-medium">
                              Học kỳ {currentStayInfo.term} / {currentStayInfo.academic_year}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-border-color dark:border-gray-700">
                          <span className="text-text-secondary dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Thời gian đã ở</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="material-symbols-outlined text-green-500" style={{ fontSize: '20px' }}>schedule</span>
                            <span className="text-text-main dark:text-white text-base font-bold">
                              {currentStayInfo.months_stayed > 0
                                ? `${currentStayInfo.months_stayed} tháng ${currentStayInfo.days_stayed % 30} ngày`
                                : `${currentStayInfo.days_stayed} ngày`
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Additional Info Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-1 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                          <span className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">Ngày vào ở</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400" style={{ fontSize: '20px' }}>event_available</span>
                            <span className="text-text-main dark:text-white text-base font-bold">{formatDate(currentStayInfo.start_date)}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                          <span className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">Kết thúc học kỳ</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400" style={{ fontSize: '20px' }}>event_busy</span>
                            <span className="text-text-main dark:text-white text-base font-bold">{formatDate(currentStayInfo.semester_end)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Expected Extension */}
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center gap-3 border-b border-dashed border-border-color dark:border-gray-700 pb-3">
                        <span className="material-symbols-outlined text-primary text-2xl font-bold bg-primary/10 rounded-full p-1">calendar_month</span>
                        <h2 className="text-text-main dark:text-white text-xl font-bold">Yêu cầu gia hạn</h2>
                      </div>
                      <div className="flex flex-col gap-4 p-5 rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800">
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5">
                            <span className="material-symbols-outlined text-green-600" style={{ fontSize: '28px' }}>autorenew</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-green-700 dark:text-green-300 text-xs font-bold uppercase tracking-wide">Tiếp tục ở tại</span>
                            <span className="text-text-main dark:text-white text-lg font-bold text-green-700 dark:text-green-400">
                              {currentStayInfo.room_number} - {currentStayInfo.building_name}
                            </span>
                          </div>
                        </div>
                        <div className="ml-0 sm:ml-[44px] border-t border-green-200 dark:border-green-800/50 pt-4 border-dashed">
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            Bạn đang yêu cầu gia hạn chỗ ở tại phòng <strong>{currentStayInfo.room_number}</strong> ({currentStayInfo.building_name})
                            cho học kỳ tiếp theo. Giá phòng: <strong>{new Intl.NumberFormat('vi-VN').format(currentStayInfo.price_per_semester)} VNĐ/kỳ</strong>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Reason & Proof */}
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center gap-3 border-b border-dashed border-border-color dark:border-gray-700 pb-3">
                        <span className="material-symbols-outlined text-primary text-2xl font-bold bg-primary/10 rounded-full p-1">description</span>
                        <h2 className="text-text-main dark:text-white text-xl font-bold">Lý do & Minh chứng</h2>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-text-main dark:text-white text-sm font-bold flex items-center gap-1">
                          Lý do gia hạn <span className="text-text-secondary dark:text-gray-500 font-normal text-xs ml-1">(Tùy chọn)</span>
                        </label>
                        <textarea className="flex w-full rounded-lg text-text-main dark:text-white dark:bg-surface-dark border border-border-color dark:border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary min-h-[120px] px-4 py-3 text-sm font-normal leading-normal placeholder:text-text-secondary resize-none" placeholder="Ví dụ: Em tiếp tục học hè tại trường, hoặc chưa tìm được chỗ ở mới..."></textarea>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-text-main dark:text-white text-sm font-bold">Minh chứng (Tùy chọn)</label>
                        <input
                          type="file"
                          ref={extensionFileInputRef}
                          onChange={(e) => handleFileChange(e, setExtensionFiles)}
                          multiple
                          className="hidden"
                          accept=".png,.jpg,.jpeg,.pdf"
                        />
                        <div
                          onClick={() => extensionFileInputRef.current?.click()}
                          className="mt-1 flex justify-center rounded-xl border-2 border-dashed border-border-color dark:border-gray-700 px-6 py-8 hover:bg-background-light dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                        >
                          <div className="text-center">
                            <span className="material-symbols-outlined text-text-secondary dark:text-gray-400 group-hover:text-primary transition-colors mb-2" style={{ fontSize: '40px' }}>cloud_upload</span>
                            <div className="flex text-sm leading-6 text-text-secondary dark:text-gray-400 justify-center">
                              <span className="font-bold text-primary hover:text-primary-hover">Tải tệp lên</span>
                              <p className="pl-1">hoặc kéo thả vào đây</p>
                            </div>
                            <p className="text-xs leading-5 text-text-secondary dark:text-gray-500 mt-1">PNG, JPG, PDF tối đa 10MB</p>
                          </div>
                        </div>

                        {/* Extension Files List */}
                        <div className="flex flex-col gap-2 mt-2">
                          {extensionFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border border-border-color dark:border-gray-700 rounded-lg bg-white dark:bg-surface-dark animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="flex items-center gap-3">
                                <div className={`rounded p-1.5 flex items-center justify-center ${file.name.toLowerCase().endsWith('.pdf') ? 'bg-red-50 dark:bg-red-900/30 text-red-600' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600'}`}>
                                  <span className="material-symbols-outlined text-[20px]">
                                    {file.name.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'image'}
                                  </span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-text-main dark:text-white truncate max-w-[200px] md:max-w-md">{file.name}</span>
                                  <span className="text-xs text-text-secondary dark:text-gray-500">{file.size}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFile(idx, setExtensionFiles)}
                                className="text-text-secondary hover:text-red-500 transition-colors p-1"
                                type="button"
                              >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* CASE: NO CURRENT STAY - Show Empty Screen */
                  <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-in fade-in zoom-in-95 duration-500">
                    <div className="size-28 bg-gray-50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-8 border border-border-color dark:border-gray-700 shadow-inner">
                      <span className="material-symbols-outlined text-[#94a3b8] dark:text-gray-600 text-[56px]">search_off</span>
                    </div>
                    <h3 className="text-text-main dark:text-white text-2xl font-bold mb-4">Chưa có thông tin gia hạn</h3>
                    <p className="text-text-secondary dark:text-gray-400 text-base max-w-[480px] mb-10 leading-relaxed">
                      Hệ thống không tìm thấy thông tin lưu trú hiện tại của bạn tại ký túc xá. Chức năng gia hạn chỉ áp dụng cho sinh viên đang ở nội trú trong học kỳ hiện tại.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => setActiveTab('regular')}
                        className="flex items-center justify-center gap-2 px-8 h-12 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                      >
                        <span className="material-symbols-outlined">add_circle</span>
                        Đăng ký mới ngay
                      </button>
                      <button
                        onClick={() => loadCurrentStay()}
                        disabled={loadingCurrentStay}
                        className="flex items-center justify-center gap-2 px-8 h-12 bg-white dark:bg-gray-800 border border-border-color dark:border-gray-700 text-text-main dark:text-white rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                      >
                        <span className={`material-symbols-outlined ${loadingCurrentStay ? 'animate-spin' : ''}`}>refresh</span>
                        {loadingCurrentStay ? 'Đang tải...' : 'Thử lại'}
                      </button>
                    </div>
                  </div>
                )
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-6 border-t border-border-color dark:border-gray-700">
                <button className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-text-secondary dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  {activeTab === 'extension' ? 'Hủy' : 'Hủy bỏ'}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={(activeTab === 'extension' && !hasCurrentStay) || loading}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-3 rounded-xl text-base font-bold shadow-lg transition-all active:scale-95 ${(activeTab === 'extension' && !hasCurrentStay) || loading
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-primary hover:bg-primary-hover text-white shadow-primary/20'
                    }`}
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">send</span>
                      {activeTab === 'extension' ? 'Gửi yêu cầu gia hạn' : 'Gửi đơn đăng ký'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-text-secondary dark:text-gray-500 text-center max-w-lg leading-relaxed">
            Bằng việc gửi đơn {activeTab === 'extension' ? 'gia hạn' : 'đăng ký'}, bạn đồng ý với <a className="text-primary font-bold hover:underline" href="#">Quy định Nội trú</a> và cam kết các thông tin khai báo là trung thực.
          </p>
        </div>
      </div>
    </RoleBasedLayout>
  );
};

export default StudentRegistration;