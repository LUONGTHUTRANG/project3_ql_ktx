import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { Select, Switch, message, Button, Input } from 'antd';
import { createRegistration } from '../api';
import { fetchBuildings } from '../api';
import { getAllSemesters, Semester } from '../api';
import { getCurrentStay, CurrentStayInfo } from '../api';
import { checkActiveStay, ActiveStayInfo } from '../api_handlers/stayApi';
import RoomSelectionModal from '../components/RoomSelectionModal';
import { AvailableRoom } from '../api_handlers/roomApi';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [isGroupReg, setIsGroupReg] = useState(false);
  const [selectedHabits, setSelectedHabits] = useState<string[]>(['Ngủ sớm']);
  const [activeTab, setActiveTab] = useState<ActiveTab>('regular');

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
  const [loadingCurrentStay, setLoadingCurrentStay] = useState(true);
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false); // Only show spinner after 5ms

  // Check if student has active stay record (status = 'ACTIVE' in stay_records table)
  const [hasActiveRoom, setHasActiveRoom] = useState<boolean>(false);
  const [activeRoomInfo, setActiveRoomInfo] = useState<ActiveStayInfo | null>(null);

  // Room selection modal states
  const [roomSelectionModalVisible, setRoomSelectionModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<AvailableRoom | null>(null);

  // Registration period state - track for each registration type
  const [registrationStatus, setRegistrationStatus] = useState<'upcoming' | 'open' | 'closed'>('open');
  const [registrationMessage, setRegistrationMessage] = useState<string>('');

  // Status for each registration type
  const [regularRegStatus, setRegularRegStatus] = useState<'upcoming' | 'open' | 'closed'>('open');
  const [specialRegStatus, setSpecialRegStatus] = useState<'upcoming' | 'open' | 'closed'>('open');
  const [renewalRegStatus, setRenewalRegStatus] = useState<'upcoming' | 'open' | 'closed'>('open');

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
          checkRegistrationPeriods(active);
        }

        // Fetch current stay info for renewal tab
        await loadCurrentStay();
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    loadInitialData();
  }, []);

  // Update registration status when active tab changes
  useEffect(() => {
    if (activeSemester) {
      checkRegistrationPeriods(activeSemester);
    }
  }, [activeTab]);

  // Control spinner visibility - only show after 5ms to avoid flicker on fast loads
  useEffect(() => {
    if (loadingCurrentStay) {
      const timer = setTimeout(() => {
        setShowLoadingSpinner(true);
      }, 50);
      return () => {
        clearTimeout(timer);
      };
    } else {
      setShowLoadingSpinner(false);
    }
  }, [loadingCurrentStay]);

  // Format datetime helper (dd/mm/yyyy hh:mm:ss)
  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
    } catch (error) {
      return dateStr;
    }
  };

  // Check if current time is within a specific registration period
  const isWithinRegistrationPeriod = (openDate: string | undefined, closeDate: string | undefined): boolean => {
    if (!openDate || !closeDate) return false;
    const now = new Date();
    const open = new Date(openDate);
    const close = new Date(closeDate);
    return now >= open && now <= close;
  };

  // Get registration status for a specific period
  const getRegistrationStatus = (
    openDate: string | undefined,
    closeDate: string | undefined
  ): { status: 'upcoming' | 'open' | 'closed'; message: string } => {
    if (!openDate || !closeDate) {
      return { status: 'closed', message: 'Chưa cấu hình thời gian đăng ký' };
    }

    const now = new Date();
    const open = new Date(openDate);
    const close = new Date(closeDate);

    if (now < open) {
      const daysUntilOpen = Math.ceil((open.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        status: 'upcoming',
        message: `Đăng ký mở vào ${formatDateTime(openDate)} (còn ${daysUntilOpen} ngày)`,
      };
    } else if (now > close) {
      return {
        status: 'closed',
        message: 'Đã hết thời gian đăng ký',
      };
    } else {
      return {
        status: 'open',
        message: '',
      };
    }
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  // Load current stay info and check for active stay records
  const loadCurrentStay = async () => {
    setLoadingCurrentStay(true);
    try {
      // Get current stay info for renewal
      const response = await getCurrentStay();
      setHasCurrentStay(response.hasCurrentStay);
      setCurrentStayInfo(response.data);

      // Check for active stay record (status = 'ACTIVE')
      if (user && user.id) {
        const activeStayResponse = await checkActiveStay(user.id);
        if (activeStayResponse.hasActiveStay && activeStayResponse.data) {
          setHasActiveRoom(true);
          setActiveRoomInfo(activeStayResponse.data);
        } else {
          setHasActiveRoom(false);
          setActiveRoomInfo(null);
        }
      }
    } catch (error) {
      console.error('Error loading current stay:', error);
      setHasCurrentStay(false);
      setCurrentStayInfo(null);
      setHasActiveRoom(false);
      setActiveRoomInfo(null);
    } finally {
      setLoadingCurrentStay(false);
    }
  };

  // Check registration periods for all types
  const checkRegistrationPeriods = (semester: Semester) => {
    // Check regular registration
    const regularStatus = getRegistrationStatus(
      semester.registration_open_date,
      semester.registration_close_date
    );
    setRegularRegStatus(regularStatus.status);

    // Check special registration
    const specialStatus = getRegistrationStatus(
      semester.registration_special_open_date,
      semester.registration_special_close_date
    );
    setSpecialRegStatus(specialStatus.status);

    // Check renewal registration
    const renewalStatus = getRegistrationStatus(
      semester.renewal_open_date,
      semester.renewal_close_date
    );
    setRenewalRegStatus(renewalStatus.status);

    // Set overall status based on active tab
    if (activeTab === 'regular') {
      setRegistrationStatus(regularStatus.status);
      setRegistrationMessage(regularStatus.message);
    } else if (activeTab === 'special') {
      setRegistrationStatus(specialStatus.status);
      setRegistrationMessage(specialStatus.message);
    } else if (activeTab === 'extension') {
      setRegistrationStatus(renewalStatus.status);
      setRegistrationMessage(renewalStatus.message);
    }
  };

  // Format price helper
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  // Handle room selection
  const handleSelectRoom = (roomId: number, roomInfo: AvailableRoom) => {
    setSelectedRoom(roomInfo);
    message.success(`Đã chọn phòng ${roomInfo.room_number} - ${roomInfo.building_name}`);
  };

  // Clear selected room
  const handleClearRoom = () => {
    setSelectedRoom(null);
    message.info('Đã bỏ chọn phòng');
  };

  if (!user) return null;

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

    // Check registration period based on active tab
    let isRegistrationOpen = false;
    let registrationPeriodMessage = '';

    if (activeTab === 'regular') {
      if (!activeSemester?.registration_open_date || !activeSemester?.registration_close_date) {
        message.error('Chưa cấu hình thời gian đăng ký thông thường');
        return;
      }
      isRegistrationOpen = isWithinRegistrationPeriod(
        activeSemester.registration_open_date,
        activeSemester.registration_close_date
      );
      registrationPeriodMessage = `Thời gian đăng ký thông thường: ${formatDateTime(activeSemester.registration_open_date)} - ${formatDateTime(activeSemester.registration_close_date)}`;
    } else if (activeTab === 'special') {
      if (!activeSemester?.registration_special_open_date || !activeSemester?.registration_special_close_date) {
        message.error('Chưa cấu hình thời gian đăng ký ưu tiên/đặc biệt');
        return;
      }
      isRegistrationOpen = isWithinRegistrationPeriod(
        activeSemester.registration_special_open_date,
        activeSemester.registration_special_close_date
      );
      registrationPeriodMessage = `Thời gian đăng ký ưu tiên/đặc biệt: ${formatDateTime(activeSemester.registration_special_open_date)} - ${formatDateTime(activeSemester.registration_special_close_date)}`;
    } else if (activeTab === 'extension') {
      if (!activeSemester?.renewal_open_date || !activeSemester?.renewal_close_date) {
        message.error('Chưa cấu hình thời gian gia hạn chỗ ở');
        return;
      }
      isRegistrationOpen = isWithinRegistrationPeriod(
        activeSemester.renewal_open_date,
        activeSemester.renewal_close_date
      );
      registrationPeriodMessage = `Thời gian gia hạn: ${formatDateTime(activeSemester.renewal_open_date)} - ${formatDateTime(activeSemester.renewal_close_date)}`;
    }

    if (!isRegistrationOpen) {
      message.error(`Ngoài thời gian đăng ký. ${registrationPeriodMessage}`);
      return;
    }

    // For regular and priority registration, room must be selected
    if ((activeTab === 'regular' || activeTab === 'special') && !selectedRoom) {
      message.error('Vui lòng chọn phòng trước khi đăng ký');
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
        : selectedRoom?.building_id || selectedBuildingId;

      const roomIdToSend = activeTab === 'extension' && currentStayInfo
        ? currentStayInfo.room_id
        : selectedRoom?.id || null;

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

      // For NORMAL registration, navigate to payment page if invoice was created
      if (result.invoice_id) {
        message.success('Đăng ký thành công! Chuyển đến trang thanh toán...', 2);
        setTimeout(() => {
          navigate(`/student/bills/${result.invoice_id}`);
        }, 2000);
      } else {
        message.success(result.message || 'Đăng ký thành công!');
        // Reset form after success
        setSelectedRoom(null);
        setSelectedBuildingId(null);
        setPriorityCategory('');
        setPriorityDescription('');
        setExtensionReason('');
        setSpecialFiles([]);
        setExtensionFiles([]);
      }

    } catch (error: any) {
      message.error(error.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  console.log("checkcheck", loadingCurrentStay)

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

          {!loadingCurrentStay && hasActiveRoom && activeRoomInfo && (
            /* CASE: STUDENT ALREADY HAS ACTIVE ROOM FOR CURRENT SEMESTER */
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center w-full animate-in fade-in zoom-in duration-500">
              <div className="size-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-emerald-600 text-[48px]">check_circle</span>
              </div>
              <h3 className="text-text-main dark:text-white text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                Bạn đã có chỗ ở cho kỳ học này
              </h3>
              <p className="text-text-secondary dark:text-gray-400 text-base max-w-[500px] mb-10 leading-relaxed">
                Bạn hiện đang ở tại phòng được chỉ định cho kỳ học {activeSemester?.term} năm học {activeSemester?.academic_year}. Bạn không thể đăng ký phòng mới cho kỳ học này.
              </p>

              <div className="w-full max-w-2xl mb-12">
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <span className="text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">Phòng hiện tại</span>
                      <span className="text-text-main dark:text-white text-lg font-bold">
                        {activeRoomInfo.room_number} - {activeRoomInfo.building_name}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">Tầng</span>
                      <span className="text-text-main dark:text-white text-lg font-bold">
                        Tầng {activeRoomInfo.floor || 'N/A'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">Kỳ học</span>
                      <span className="text-text-main dark:text-white text-lg font-bold">
                        {activeRoomInfo.term} / {activeRoomInfo.academic_year}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">Ngày vào ở</span>
                      <span className="text-text-main dark:text-white text-lg font-bold">
                        {formatDate(activeRoomInfo.start_date)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-emerald-800 dark:text-emerald-200">
                      Nếu bạn cần gia hạn chỗ ở cho kỳ học tiếp theo, vui lòng đợi đến thời gian mở đơn gia hạn hoặc liên hệ quản lý KTX.
                    </p>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-md border-t border-border-color dark:border-gray-700 pt-8 flex flex-col items-center gap-4">
                <p className="text-text-main dark:text-gray-300 font-medium text-sm">Cần hỗ trợ?</p>
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

          {!loadingCurrentStay && registrationStatus === 'upcoming' && !hasActiveRoom && (
            /* CASE: PORT NOT YET OPEN */
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center w-full animate-in fade-in zoom-in duration-500">
              <div className="size-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <span className="material-symbols-outlined text-primary text-[48px]">calendar_clock</span>
              </div>
              <h3 className="text-text-main dark:text-white text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                Cổng đăng ký chưa mở
              </h3>
              <p className="text-text-secondary dark:text-gray-400 text-base max-w-[500px] mb-10 leading-relaxed">
                {registrationMessage || 'Hiện tại hệ thống chưa mở tiếp nhận đơn đăng ký chỗ ở cho học kỳ này. Vui lòng quay lại vào thời gian đăng ký dự kiến bên dưới.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-12">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-border-color dark:border-gray-700 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Mở đăng ký</span>
                  </div>
                  <span className="text-lg md:text-xl font-bold text-primary text-center">
                    {activeTab === 'regular' && activeSemester?.registration_open_date
                      ? formatDateTime(activeSemester.registration_open_date)
                      : activeTab === 'special' && activeSemester?.registration_special_open_date
                        ? formatDateTime(activeSemester.registration_special_open_date)
                        : activeTab === 'extension' && activeSemester?.renewal_open_date
                          ? formatDateTime(activeSemester.renewal_open_date)
                          : '...'}
                  </span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-border-color dark:border-gray-700 flex flex-col items-center gap-2 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">event_busy</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Đóng đăng ký</span>
                  </div>
                  <span className="text-lg md:text-xl font-bold text-text-main dark:text-white text-center">
                    {activeTab === 'regular' && activeSemester?.registration_close_date
                      ? formatDateTime(activeSemester.registration_close_date)
                      : activeTab === 'special' && activeSemester?.registration_special_close_date
                        ? formatDateTime(activeSemester.registration_special_close_date)
                        : activeTab === 'extension' && activeSemester?.renewal_close_date
                          ? formatDateTime(activeSemester.renewal_close_date)
                          : '...'}
                  </span>
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

          {!loadingCurrentStay && registrationStatus === 'closed' && !hasActiveRoom && (
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
                  <span className="text-lg md:text-xl font-bold text-text-secondary dark:text-gray-400 text-center">
                    {activeTab === 'regular' && activeSemester?.registration_open_date
                      ? formatDateTime(activeSemester.registration_open_date)
                      : activeTab === 'special' && activeSemester?.registration_special_open_date
                        ? formatDateTime(activeSemester.registration_special_open_date)
                        : activeTab === 'extension' && activeSemester?.renewal_open_date
                          ? formatDateTime(activeSemester.renewal_open_date)
                          : '...'}
                  </span>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-xl border border-red-100 dark:border-red-900/30 flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <span className="material-symbols-outlined text-[20px]">event_busy</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Đã đóng đăng ký</span>
                  </div>
                  <span className="text-lg md:text-xl font-bold text-red-700 dark:text-red-400 text-center">
                    {activeTab === 'regular' && activeSemester?.registration_close_date
                      ? formatDateTime(activeSemester.registration_close_date)
                      : activeTab === 'special' && activeSemester?.registration_special_close_date
                        ? formatDateTime(activeSemester.registration_special_close_date)
                        : activeTab === 'extension' && activeSemester?.renewal_close_date
                          ? formatDateTime(activeSemester.renewal_close_date)
                          : '...'}
                  </span>
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

          {!loadingCurrentStay && registrationStatus === 'open' && !hasActiveRoom && (
            <div className="p-6 md:p-8 flex flex-col gap-8 animate-in fade-in duration-500">
              {/* Registration Period Info Banner */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[28px]">check_circle</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-700 dark:text-green-300">Đang trong thời gian đăng ký</h3>
                    <div className="text-sm text-green-700 dark:text-green-400 space-y-1">
                      {activeTab === 'regular' && (
                        <>
                          <p><strong>Đơn đăng ký thông thường</strong></p>
                          <p>Mở đơn: {formatDateTime(activeSemester?.registration_open_date)}</p>
                          <p>Đóng đơn: {formatDateTime(activeSemester?.registration_close_date)}</p>
                        </>
                      )}
                      {activeTab === 'special' && (
                        <>
                          <p><strong>Đơn ưu tiên / Đặc biệt</strong></p>
                          <p>Mở đơn: {formatDateTime(activeSemester?.registration_special_open_date)}</p>
                          <p>Đóng đơn: {formatDateTime(activeSemester?.registration_special_close_date)}</p>
                        </>
                      )}
                      {activeTab === 'extension' && (
                        <>
                          <p><strong>Gia hạn chỗ ở</strong></p>
                          <p>Mở đơn: {formatDateTime(activeSemester?.renewal_open_date)}</p>
                          <p>Đóng đơn: {formatDateTime(activeSemester?.renewal_close_date)}</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {!loadingCurrentStay && activeTab === 'regular' && !hasActiveRoom && !activeRoomInfo && registrationStatus === 'open' && (
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
                        <Input
                          readOnly
                          value={user.mssv || ''}
                          prefix={<span className="material-symbols-outlined text-gray-400 text-lg">lock</span>}
                          disabled
                          className="h-11"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-bold">Họ và tên</span>
                        <Input
                          readOnly
                          value={user.name}
                          prefix={<span className="material-symbols-outlined text-gray-400 text-lg">lock</span>}
                          disabled
                          className="h-11"
                        />
                      </div>
                      {/* <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-bold">Lớp sinh hoạt</span>
                        <Input
                          placeholder="Ví dụ: CNTT2024"
                          className="h-11"
                          prefix={<span className="hidden" />}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-bold">Số điện thoại</span>
                        <Input
                          placeholder="09xx xxx xxx"
                          type="tel"
                          className="h-11"
                          prefix={<span className="hidden" />}
                        />
                      </div> */}
                    </div>
                  </div>

                  {/* Section 3: Room Selection */}
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3 border-b border-dashed border-border-color dark:border-gray-700 pb-3">
                      <span className="material-symbols-outlined text-primary text-2xl font-bold">apartment</span>
                      <h2 className="text-text-main dark:text-white text-xl font-bold">Chọn phòng ở</h2>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800 p-6 rounded-2xl">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-primary text-3xl">info</span>
                          <div className="flex-1">
                            <h3 className="font-bold text-text-main dark:text-white text-base mb-2">
                              Chọn phòng cụ thể và thanh toán
                            </h3>
                            <p className="text-sm text-text-secondary dark:text-gray-400 leading-relaxed">
                              Bạn có thể xem danh sách phòng trống tại <span className="font-semibold text-blue-600 dark:text-blue-400">các tầng từ tầng 3 trở lên</span>. Sau khi chọn phòng, hệ thống sẽ tạo hóa đơn thanh toán.
                              <span className="font-semibold text-orange-600 dark:text-orange-400"> Bạn có 24 giờ để hoàn tất thanh toán</span>,
                              sau đó sẽ được tự động thêm vào phòng.
                            </p>
                          </div>
                        </div>

                        {selectedRoom ? (
                          /* Display selected room */
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-border-color dark:border-gray-700">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="size-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
                                </div>
                                <div>
                                  <h4 className="font-bold text-text-main dark:text-white text-lg">
                                    Phòng {selectedRoom.room_number}
                                  </h4>
                                  <p className="text-sm text-text-secondary dark:text-gray-400">
                                    {selectedRoom.building_name} - Tầng {selectedRoom.floor}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={handleClearRoom}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 text-sm font-semibold"
                              >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                                Bỏ chọn
                              </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-text-secondary dark:text-gray-400">Sức chứa</span>
                                <span className="font-semibold text-text-main dark:text-white">
                                  {selectedRoom.current_occupancy}/{selectedRoom.max_capacity} người
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-text-secondary dark:text-gray-400">Còn trống</span>
                                <span className="font-semibold text-green-600">
                                  {selectedRoom.available_slots} chỗ
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-text-secondary dark:text-gray-400">Giá/kỳ</span>
                                <span className="font-semibold text-blue-600">
                                  {formatPrice(selectedRoom.price_per_semester)}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-text-secondary dark:text-gray-400">Tiện nghi</span>
                                <div className="flex gap-1 flex-wrap">
                                  {selectedRoom.has_ac === 1 && (
                                    <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-xs rounded">AC</span>
                                  )}
                                  {selectedRoom.has_heater === 1 && (
                                    <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded">Nóng lạnh</span>
                                  )}
                                  {selectedRoom.has_washer === 1 && (
                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">Máy giặt</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-600 text-[20px]">schedule</span>
                                <p className="text-xs text-amber-800 dark:text-amber-200">
                                  Sau khi đăng ký, bạn sẽ nhận được mã hóa đơn và có <strong>24 giờ</strong> để thanh toán.
                                  Nếu không thanh toán đúng hạn, đơn đăng ký sẽ bị tự động hủy.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Button to select room */
                          <Button
                            type="primary"
                            size="large"
                            onClick={() => setRoomSelectionModalVisible(true)}
                            className="w-full h-12 text-base font-semibold"
                          >
                            <span className="material-symbols-outlined text-[20px]">search</span>
                            Xem danh sách phòng trống và chọn phòng
                          </Button>
                        )}
                      </div>
                    </div>
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
                        <Input disabled value={user.name} className="h-11" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-medium">Mã số sinh viên</span>
                        <Input disabled value={user.mssv || ''} className="h-11" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-medium">Lớp sinh hoạt</span>
                        <Input disabled value="K65 - Công nghệ thông tin 01" className="h-11" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="text-text-main dark:text-gray-200 text-sm font-medium">Giới tính</span>
                        <Input disabled value="Nam" className="h-11" />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Room Selection for Priority */}
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3 border-b border-dashed border-border-color dark:border-gray-700 pb-3">
                      <span className="material-symbols-outlined text-primary text-2xl font-bold bg-primary/10 rounded-full p-1">bedroom_parent</span>
                      <h2 className="text-text-main dark:text-white text-xl font-bold">Chọn phòng ưu tiên</h2>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800 p-6 rounded-2xl">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-amber-600 text-3xl">star</span>
                          <div className="flex-1">
                            <h3 className="font-bold text-text-main dark:text-white text-base mb-2">
                              Quyền ưu tiên chọn phòng
                            </h3>
                            <p className="text-sm text-text-secondary dark:text-gray-400 leading-relaxed">
                              Sinh viên thuộc diện ưu tiên được <span className="font-semibold text-amber-700 dark:text-amber-400">chọn phòng ở tất cả các tầng</span>, bao gồm cả các tầng thấp thuận tiện di chuyển.
                              <span className="font-semibold text-green-600 dark:text-green-400">Đầy đủ tiện nghi</span> (điều hòa, nóng lạnh, máy giặt).
                            </p>
                          </div>
                        </div>

                        {selectedRoom ? (
                          /* Display selected room */
                          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-border-color dark:border-gray-700">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="size-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-green-600 text-2xl">check_circle</span>
                                </div>
                                <div>
                                  <h4 className="font-bold text-text-main dark:text-white text-lg">
                                    Phòng {selectedRoom.room_number}
                                  </h4>
                                  <p className="text-sm text-text-secondary dark:text-gray-400">
                                    {selectedRoom.building_name} - Tầng {selectedRoom.floor}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={handleClearRoom}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 text-sm font-semibold"
                              >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                                Bỏ chọn
                              </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-text-secondary dark:text-gray-400">Sức chứa</span>
                                <span className="font-semibold text-text-main dark:text-white">
                                  {selectedRoom.current_occupancy}/{selectedRoom.max_capacity} người
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-text-secondary dark:text-gray-400">Còn trống</span>
                                <span className="font-semibold text-green-600">
                                  {selectedRoom.available_slots} chỗ
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-text-secondary dark:text-gray-400">Giá ưu đãi/kỳ</span>
                                <span className="font-semibold text-amber-600">
                                  {formatPrice(selectedRoom.price_per_semester)}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-xs text-text-secondary dark:text-gray-400">Tiện nghi</span>
                                <div className="flex gap-1 flex-wrap">
                                  <span className="px-2 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-xs rounded">AC</span>
                                  <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded">Nóng lạnh</span>
                                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">Máy giặt</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Button to select room */
                          <Button
                            type="primary"
                            size="large"
                            icon={<span className="material-symbols-outlined text-[20px]">search</span>}
                            onClick={() => setRoomSelectionModalVisible(true)}
                            className="w-full h-12 text-base font-semibold"
                            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
                          >
                            Xem phòng khu ưu tiên P1
                          </Button>
                        )}
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
                    <div className={`w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full ${showLoadingSpinner && "animate-spin"} mb-4`}></div>
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
                          Lý do gia hạn (Tùy chọn)
                        </label>
                        <Input.TextArea
                          placeholder="Ví dụ: Em tiếp tục học hè tại trường, hoặc chưa tìm được chỗ ở mới..."
                          rows={5}
                          value={extensionReason}
                          onChange={(e) => setExtensionReason(e.target.value)}
                        />
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

      {/* Room Selection Modal */}
      <RoomSelectionModal
        visible={roomSelectionModalVisible}
        onClose={() => setRoomSelectionModalVisible(false)}
        onSelectRoom={handleSelectRoom}
        registrationType={activeTab === 'regular' ? 'NORMAL' : activeTab === 'special' ? 'PRIORITY' : 'RENEWAL'}
      />
    </RoleBasedLayout>
  );
};

export default StudentRegistration;