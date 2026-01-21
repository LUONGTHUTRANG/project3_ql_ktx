import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { message, Input, Select, DatePicker, Spin } from 'antd';
import dayjs from 'dayjs';
import { createOtherInvoice, getOtherInvoiceById, updateOtherInvoice } from '../api/otherInvoiceApi';
import { fetchBuildings } from '../api/buildingApi';
import { fetchRoomsByBuilding } from '../api/roomApi';
import { getStudentsByRoomId } from '../api/studentApi';
import { UserRole } from '../types';

interface CreateInvoiceForm {
  title: string;
  amount: string;
  dueDate: string;
  description: string;
  building: string;
  floor: string;
  room: string;
  student: string;
  attachment?: File;
}

const CreateInvoicePage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const isEditMode = !!invoiceId;
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [editInvoiceData, setEditInvoiceData] = useState<any>(null);
  
  // State for dynamic data
  const [buildings, setBuildings] = useState<any[]>([]);
  const [floors, setFloors] = useState<string[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<CreateInvoiceForm>({
    title: '',
    amount: '',
    dueDate: '',
    description: '',
    building: 'all',
    floor: 'all',
    room: 'all',
    student: 'all',
  });
  const [fileName, setFileName] = useState<string>('');
  const [filePreview, setFilePreview] = useState<{name: string, size: string} | null>(null);

  // Load buildings on component mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingData(true);
        const buildingsData = await fetchBuildings();
        setBuildings(buildingsData);

        // Set default building for manager
        let defaultBuilding = 'all';
        console.log("User info:", user);
        if (user?.role === UserRole.MANAGER && user?.building_id) {
          defaultBuilding = String(user.building_id);
        }
        console.log("Default building set to:", defaultBuilding);

        // If in edit mode, load invoice data
        if (isEditMode && invoiceId) {
          const invoiceData = await getOtherInvoiceById(invoiceId);
          setEditInvoiceData(invoiceData);
          console.log("Loaded invoice data for editing:", invoiceData.floor.toString() || 'all');
          // Pre-fill form with invoice data
          setFormData(prev => ({
            ...prev,
            title: invoiceData.title || '',
            description: invoiceData.description || '',
            amount: invoiceData.amount ? `${invoiceData.amount}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '',
            dueDate: invoiceData.deadline_at ? dayjs(invoiceData.deadline_at).format('YYYY-MM-DD') : '',
            // Will set building/floor/room/student based on target type
            building: defaultBuilding,
            floor: invoiceData.floor.toString() || 'all',
            room: invoiceData.target_type === 'ROOM' ? String(invoiceData.target_room_id) : 'all',
            student: invoiceData.target_type === 'STUDENT' ? String(invoiceData.target_student_id) : 'all',
          }));
        } else {
          // Set default building for manager on create mode
          setFormData(prev => ({
            ...prev,
            building: defaultBuilding,
          }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        message.error('Lỗi khi tải dữ liệu');
      } finally {
        setLoadingData(false);
      }
    };
    
    loadInitialData();
  }, [isEditMode, invoiceId, user]);

  // Load rooms and floors when building changes
  useEffect(() => {
    const loadRoomsAndFloors = async () => {
      if (formData.building === 'all') {
        setRooms([]);
        setFloors([]);
        setFormData(prev => ({
          ...prev,
          floor: 'all',
          room: 'all',
          student: 'all'
        }));
        return;
      }

      try {
        const roomsData = await fetchRoomsByBuilding(formData.building);
        setRooms(roomsData);
        
        // Extract unique floors from rooms and sort them
        const uniqueFloors = Array.from(new Set(roomsData.map((r: any) => r.floor)))
          .sort((a: number, b: number) => (a as number) - (b as number));
        setFloors(uniqueFloors as any[]);
        
        // In edit mode, restore floor value from loaded data
        // In create mode, reset floor to 'all'
        if (isEditMode && editInvoiceData) {
          setFormData(prev => ({
            ...prev,
            floor: editInvoiceData.floor?.toString() || 'all',
            room: editInvoiceData.target_type === 'ROOM' ? String(editInvoiceData.target_room_id) : 'all',
            student: editInvoiceData.target_type === 'STUDENT' ? String(editInvoiceData.target_student_id) : 'all',
          }));
        } else {
          // Reset dependent fields in create mode
          setFormData(prev => ({
            ...prev,
            floor: 'all',
            room: 'all',
            student: 'all'
          }));
        }
      } catch (error) {
        console.error('Error loading rooms:', error);
        message.error('Lỗi khi tải danh sách phòng');
      }
    };

    loadRoomsAndFloors();
  }, [formData.building, isEditMode, editInvoiceData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmountChange = (value: string) => {
    // Remove all non-digit characters
    const numericValue = value.replace(/\D/g, '');
    
    // Format with thousand separators using Vietnamese locale
    let formattedValue = '';
    if (numericValue) {
      formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
    
    setFormData(prev => ({
      ...prev,
      amount: formattedValue
    }));
  };

  const handleDateChange = (date: any) => {
    const dateString = date ? dayjs(date).format('YYYY-MM-DD') : '';
    setFormData(prev => ({
      ...prev,
      dueDate: dateString
    }));
  };

  const disabledDate = (current: any) => {
    // Disable ngày trước ngày hiện tại
    return current && current < dayjs().startOf('day');
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      description: e.target.value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Load students when room changes
  useEffect(() => {
    const loadStudents = async () => {
      if (formData.room === 'all') {
        setStudents([]);
        setFormData(prev => ({
          ...prev,
          student: 'all'
        }));
        return;
      }

      try {
        const studentsData = await getStudentsByRoomId(formData.room);
        setStudents(studentsData);
        setFormData(prev => ({
          ...prev,
          student: 'all'
        }));
      } catch (error) {
        console.error('Error loading students:', error);
        message.error('Lỗi khi tải danh sách sinh viên');
      }
    };

    loadStudents();
  }, [formData.room]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        message.error('Kích thước tệp không được vượt quá 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        attachment: file
      }));
      setFileName(file.name);
      setFilePreview({
        name: file.name,
        size: (file.size / 1024).toFixed(2)
      });
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      attachment: undefined
    }));
    setFileName('');
    setFilePreview(null);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      message.error('Vui lòng nhập tiêu đề hóa đơn');
      return;
    }

    if (!formData.amount || parseInt(formData.amount.replace(/,/g, '')) <= 0) {
      message.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (!formData.dueDate) {
      message.error('Vui lòng chọn ngày đến hạn');
      return;
    }

    // Check if recipient is selected (student or specific room)
    if (formData.student === 'all' && formData.room === 'all') {
      message.error('Vui lòng chọn sinh viên hoặc phòng để tạo hóa đơn');
      return;
    }

    // Determine target type and ID
    let targetType = 'STUDENT';
    let targetId: string | number | undefined;

    // Priority: student > room (including 'all') > error
    if (formData.student !== 'all' && formData.student) {
      targetType = 'STUDENT';
      targetId = formData.student;
    } else if (formData.room !== 'all') {
      targetType = 'ROOM';
      // Convert room string to number if it's a room ID
      targetId = parseInt(formData.room, 10) || formData.room;
      
      // Validation: room_id must be a valid number
      if (isNaN(parseInt(formData.room, 10))) {
        message.error('Phòng không hợp lệ. Vui lòng chọn phòng từ danh sách.');
        return;
      }
    } else if (formData.room === 'all' && formData.building !== 'all') {
      // User selected "Tất cả Phòng" - create invoice for all rooms in building
      targetType = 'BUILDING';
      targetId = formData.building;
    } else {
      message.error('Vui lòng chọn sinh viên hoặc phòng để tạo hóa đơn');
      return;
    }

    setLoading(true);
    try {
      console.log("Submitting invoice with data:", formData);
      const invoicePayload: any = {
        target_type: targetType as 'STUDENT' | 'ROOM' | 'BUILDING',
        title: formData.title,
        description: formData.description,
        amount: parseInt(formData.amount.replace(/\./g, ''), 10),
        attachment: formData.attachment,
        file_name: formData.attachment?.name,
        file_size: formData.attachment?.size,
        due_date: formData.dueDate,
      };
      
      if (targetType === 'STUDENT') {
        invoicePayload.target_student_id = String(targetId);
      } else if (targetType === 'ROOM') {
        invoicePayload.target_room_id = String(targetId);
      } else if (targetType === 'BUILDING') {
        invoicePayload.target_building_id = String(targetId);
      }
      console.log("Final invoice payload:", invoicePayload);

      if (isEditMode && invoiceId) {
        // Update existing invoice
        await updateOtherInvoice(invoiceId, invoicePayload);
        message.success('Cập nhật hóa đơn thành công!');
      } else {
        // Create new invoice
        await createOtherInvoice(invoicePayload);
        message.success('Tạo hóa đơn thành công!');
      }
      navigate(-1);
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Lỗi khi lưu hóa đơn';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleBasedLayout user={user} headerTitle={isEditMode ? "Chỉnh sửa Hóa đơn" : "Tạo Hóa đơn"}>
      <div className="min-h-screen bg-background-light dark:bg-background-dark mb-20">
        <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2 mb-2 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
        >
            <div className="flex items-center justify-center size-8 rounded-full group-hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </div>
            <span className="text-sm font-bold leading-normal">Quay lại danh sách hóa đơn</span>
        </button>
        
        {loadingData ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Spin size="large" tip="Đang tải dữ liệu..." />
          </div>
        ) : (
          <div className="layout-content-container flex flex-col w-full gap-6">
            {/* PageHeading Component */}
            <div className="flex flex-wrap justify-between items-end gap-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-[#111418] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
                  {isEditMode ? 'Chỉnh sửa Hóa đơn' : 'Tạo Hóa đơn Mới'}
                </h1>
                <p className="text-[#617589] dark:text-slate-400 text-base font-normal">
                  {isEditMode ? 'Cập nhật thông tin hóa đơn' : 'Tạo và gửi hóa đơn thanh toán cho sinh viên hoặc khu vực ký túc xá.'}
                </p>
              </div>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[#dbe0e6] dark:border-slate-800 px-6 md:px-8 py-6 flex flex-col gap-8">
              {/* Billing Info */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                    Thông tin hóa đơn
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title Field */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[#111418] dark:text-slate-200 text-md font-semibold">
                      Tiêu đề hóa đơn <span className="text-red-500">*</span>
                    </label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: Tiền điện tháng 10/2023"
                      className="dark:bg-slate-800 dark:border-slate-700 h-10"
                      prefix={<span className="hidden" />}
                    />
                  </div>

                  {/* Amount Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-slate-200 text-md font-semibold">
                      Giá tiền (VNĐ) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        name="amount"
                        value={formData.amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0"
                        className="dark:bg-slate-800 dark:border-slate-700 h-10"
                        addonAfter="VNĐ"
                        prefix={<span className="hidden" />}
                      />
                    </div>
                  </div>

                  {/* Due Date Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-slate-200 text-md font-semibold">
                      Ngày đến hạn <span className="text-red-500">*</span>
                    </label>
                    <DatePicker
                      value={formData.dueDate ? dayjs(formData.dueDate) : null}
                      onChange={handleDateChange}
                      disabledDate={disabledDate}
                      name="dueDate"
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày đến hạn"
                      className="w-full dark:bg-slate-800 dark:border-slate-700 h-10"
                      prefix={<span className="hidden" />}
                    />
                  </div>

                  {/* Description Field */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[#111418] dark:text-slate-200 text-md font-semibold">
                      Nội dung mô tả chi tiết
                    </label>
                    <Input.TextArea
                      name="description"
                      value={formData.description}
                      onChange={handleDescriptionChange}
                      placeholder="Nhập chi tiết các khoản thu, chỉ số điện nước..."
                      rows={4}
                      className="dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                </div>
              </section>

              {/* Attachment Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">attach_file</span>
                  <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                    Tệp đính kèm
                  </h2>
                </div>
                <div className="flex flex-col gap-4">
                  <p className="text-[#617589] dark:text-slate-400 text-sm">
                    Tải lên hình ảnh biên lai hoặc các tài liệu liên quan (tối đa 5MB).
                  </p>
                  {!filePreview ? (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#dbe0e6] dark:border-slate-700 rounded-xl cursor-pointer bg-[#fcfcfd] dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <span className="material-symbols-outlined text-4xl text-primary mb-3 group-hover:scale-110 transition-transform">
                            cloud_upload
                          </span>
                          <p className="mb-2 text-sm text-[#111418] dark:text-white font-semibold">
                            Nhấn để tải lên hoặc kéo thả tệp
                          </p>
                          <p className="text-xs text-[#617589] dark:text-slate-400">
                            PNG, JPG hoặc PDF
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".png,.jpg,.jpeg,.pdf"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                        description
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 truncate">
                          {filePreview.name}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {filePreview.size} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="flex-shrink-0 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">close</span>
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Recipient Selection Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">groups</span>
                  <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                    Đối tượng nhận hóa đơn <span className="text-red-500">*</span>
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Building Select */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                      Tòa nhà
                    </label>
                    {user?.role === UserRole.MANAGER ? (
                      <div className="flex items-center h-10 px-3 rounded-lg bg-gray-100 dark:bg-slate-800 border border-[#dbe0e6] dark:border-slate-700 text-[#111418] dark:text-slate-200">
                        {buildings.find((b: any) => String(b.id) === formData.building)?.name || 'N/A'}
                      </div>
                    ) : (
                      <Select
                        value={formData.building}
                        onChange={(value) => handleSelectChange('building', value)}
                        className="dark:bg-slate-800 h-10"
                        options={[
                          { value: 'all', label: 'Tất cả Tòa' },
                          ...buildings.map((building: any) => ({
                            value: building.id.toString(),
                            label: building.name,
                          })),
                        ]}
                      />
                    )}
                  </div>

                  {/* Floor Select */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                      Tầng
                    </label>
                    <Select
                      value={formData.floor}
                      onChange={(value) => handleSelectChange('floor', value)}
                      className="dark:bg-slate-800 h-10"
                      disabled={formData.building === 'all'}
                      options={[
                        { value: 'all', label: 'Tất cả Tầng' },
                        ...floors.map((floor: any) => ({
                          value: floor.toString(),
                          label: `Tầng ${floor}`,
                        })),
                      ]}
                    />
                  </div>

                  {/* Room Select */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                      Phòng
                    </label>
                    <Select
                      value={formData.room}
                      onChange={(value) => handleSelectChange('room', value)}
                      className="dark:bg-slate-800 h-10"
                      disabled={formData.building === 'all'}
                      options={[
                        { value: 'all', label: 'Tất cả Phòng' },
                        ...rooms
                          .filter((room: any) => formData.floor === 'all' || room.floor.toString() === formData.floor)
                          .map((room: any) => ({
                            value: room.id.toString(),
                            label: `Phòng ${room.room_number}`,
                          })),
                      ]}
                    />
                  </div>

                  {/* Student Select */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                      Sinh viên
                    </label>
                    <Select
                      value={formData.student}
                      onChange={(value) => handleSelectChange('student', value)}
                      className="dark:bg-slate-800 h-10"
                      disabled={formData.room === 'all' || formData.building === 'all'}
                      options={[
                        { value: 'all', label: 'Tất cả sinh viên' },
                        ...students.map((student: any) => ({
                          value: student.id,
                          label: student.full_name,
                        })),
                      ]}
                    />
                  </div>
                </div>

                {/* Info Alert */}
                <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-sm">
                    info
                  </span>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Hệ thống sẽ tạo hóa đơn cho{' '}
                    <strong>
                      {formData.student !== 'all' && formData.student
                        ? 'sinh viên được chọn'
                        : formData.room !== 'all'
                          ? `phòng ${formData.room}`
                          : formData.building !== 'all'
                            ? `tất cả phòng trong tòa ${formData.building}`
                            : 'tất cả tòa'}
                    </strong>
                    .
                  </p>
                </div>
              </section>
            </form>
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 right-0 bg-white dark:bg-surface-dark border-t border-border-color dark:border-slate-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40" style={{ left: '288px' }}>
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex min-w-[120px] items-center justify-center rounded-lg h-12 px-6 bg-white dark:bg-slate-900 border border-[#dbe0e6] dark:border-slate-700 text-[#111418] dark:text-white text-base font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex min-w-[200px] items-center justify-center rounded-lg h-12 px-8 bg-primary text-white text-base font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined mr-2">
              {loading ? 'hourglass_empty' : 'send'}
            </span>
            {loading ? 'Đang xử lý...' : (isEditMode ? 'Lưu thay đổi' : 'Tạo hóa đơn')}
          </button>
        </div>
      </div>
    </RoleBasedLayout>
  );
};

export default CreateInvoicePage;
