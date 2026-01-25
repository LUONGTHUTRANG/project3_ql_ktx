import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, Select, Button, Spin, message } from 'antd';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { SearchOutlined } from "@ant-design/icons";
import { createNotification, getNotificationById, fetchBuildings, fetchRooms, getAllStudents } from '../api';

type NotificationFormValues = {
  title: string;
  audience: string;
  target: string;
  content: string;
};

interface CreateNotificationProps {
  mode?: 'create' | 'edit';
}

const CreateNotification: React.FC<CreateNotificationProps> = ({ mode = 'create' }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm<NotificationFormValues>();
  const [audience, setAudience] = useState<string>('');
  const [filePreview, setFilePreview] = useState<string>('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'document' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [targetOptions, setTargetOptions] = useState<any[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(mode === 'edit' ? true : false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  // Load notification data when in edit mode
  useEffect(() => {
    const loadNotificationData = async () => {
      if (mode === 'edit' && id) {
        try {
          const notification = await getNotificationById(id);
          
          // Map target_scope back to audience
          const audienceMap: Record<string, string> = {
            'ALL': 'all',
            'BUILDING': 'building',
            'ROOM': 'room',
            'INDIVIDUAL': 'student'
          };
          
          const mappedAudience = audienceMap[notification.target_scope] || '';
          setAudience(mappedAudience);
          
          form.setFieldsValue({
            title: notification.title,
            audience: mappedAudience,
            target: notification.target_value,
            content: notification.content
          });
        } catch (error: any) {
          message.error('Lỗi khi tải thông báo');
          console.error('Error loading notification:', error);
        } finally {
          setPageLoading(false);
        }
      }
    };

    loadNotificationData();
  }, [mode, id, form]);

  // Load target options based on audience
  useEffect(() => {
    const loadTargetOptions = async () => {
      if (!audience || audience === 'all') {
        setTargetOptions([]);
        return;
      }

      setOptionsLoading(true);
      try {
        if (audience === 'building') {
          const response = await fetchBuildings();
          const buildings = Array.isArray(response) ? response : response.data || [];
          const options = buildings.map((building: any) => ({
            value: building.id,
            label: building.name
          }));
          setTargetOptions(options);
        } else if (audience === 'room') {
          const response = await fetchRooms();
          const rooms = Array.isArray(response) ? response : response.data || [];
          const options = rooms.map((room: any) => ({
            value: room.id,
            label: room.room_number
          }));
          setTargetOptions(options);
        } else if (audience === 'student') {
          const response = await getAllStudents(1, 1000);
          const students = Array.isArray(response) ? response : response.data || [];
          const options = students.map((student: any) => ({
            value: student.id,
            label: `${student.full_name} - MSSV: ${student.mssv}`
          }));
          setTargetOptions(options);
        }
      } catch (error: any) {
        console.error('Error loading target options:', error);
        message.error('Không thể tải danh sách đối tượng');
      } finally {
        setOptionsLoading(false);
      }
    };

    loadTargetOptions();
  }, [audience]);

  const isAllStudents = audience === 'all';
  const isBuildingScope = audience === 'building';
  const isRoomScope = audience === 'room';
  const isStudentScope = audience === 'student';

  const getTargetOptions = () => {
    return targetOptions;
  };

  const handleAudienceChange = (value: string) => {
    setAudience(value);
    // Clear target field when audience changes
    form.setFieldValue('target', undefined);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 10) / 10 + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        message.error(`Tệp ${file.name} vượt quá 10MB, vui lòng chọn tệp khác`);
        return;
      }
      
      // Determine file type
      const extension = file.name.split('.').pop()?.toLowerCase();
      const isImageFile = ['png', 'jpg', 'jpeg'].includes(extension || '');
      const isDocumentFile = ['pdf', 'doc', 'docx'].includes(extension || '');
      
      if (isImageFile) {
        setFileType('image');
        setFilePreview(URL.createObjectURL(file));
      } else if (isDocumentFile) {
        setFileType('document');
        setFilePreview(file.name); // Store filename for document preview
      }
      
      setFileToUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = () => {
    if (filePreview && fileType === 'image') {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview('');
    setFileToUpload(null);
    setFileType(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (values: NotificationFormValues) => {
    try {
      setIsLoading(true);
      
      // Map audience to target_scope
      const targetScopeMap: Record<string, string> = {
        'all': 'ALL',
        'building': 'BUILDING',
        'room': 'ROOM',
        'student': 'INDIVIDUAL'
      };
      
      const notificationData = {
        title: values.title,
        content: values.content,
        target_scope: targetScopeMap[values.audience] || 'ALL',
        target_value: values.audience === 'all' ? null : values.target,
        type: 'ANNOUNCEMENT',
      };
      
      const response = await createNotification(notificationData, fileToUpload);
      message.success('Thông báo đã được gửi thành công!');
      navigate('/manager/notifications');
    } catch (error: any) {
      console.error('Error creating notification:', error);
      message.error(error.response?.data?.message || 'Lỗi khi tạo thông báo. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm sinh viên, phòng tại Tòa A1..."
      headerTitle={mode === 'edit' ? 'Chỉnh sửa thông báo' : 'Tạo thông báo'}
    >
      {pageLoading ? (
        <div className="flex items-center justify-center h-96">
          <Spin tip="Đang tải dữ liệu..." />
        </div>
      ) : (
      <div className="flex flex-col w-full mx-auto px-2 md:px-0">
        
        {/* Header Section */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={() => navigate(mode === 'edit' ? `/${user.role}/notifications` : `/${user.role}/notifications`)}
              className="flex items-center gap-1 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Quay lại danh sách
            </button>
          </div>
          <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-bold leading-tight tracking-[-0.033em]">
            {mode === 'edit' ? 'Chỉnh sửa Thông báo' : 'Tạo Thông báo Mới'}
          </h1>
          <p className="text-text-secondary dark:text-gray-400 text-base font-normal leading-normal">
            {mode === 'edit' ? 'Chỉnh sửa nội dung thông báo đã tạo.' : 'Soạn thảo nội dung và gửi thông báo đến sinh viên, các tòa nhà hoặc phòng cụ thể.'}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden mb-10">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="p-6 md:p-8"
          >
            {/* Title Input */}
            <Form.Item
              label={<span className="text-sm font-bold text-text-main dark:text-white">Tiêu đề thông báo</span>}
              name="title"
              validateTrigger={['onBlur', 'onChange']}
              rules={[
                { required: true, message: 'Vui lòng nhập tiêu đề thông báo' },
                { min: 5, message: 'Tiêu đề phải có ít nhất 5 ký tự' }
              ]}
              className="mb-6"
            >
              <Input 
                placeholder="Ví dụ: Thông báo đóng tiền điện tháng 10/2023"
                className="h-11 mb-1"
                prefix={<span className="hidden" />}
              />
            </Form.Item>

            {/* Audience & Building Select */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item
                label={<span className="text-sm font-bold text-text-main dark:text-white">Phạm vi nhận</span>}
                name="audience"
                validateTrigger={['onBlur', 'onChange']}
                rules={[{ required: true, message: 'Vui lòng chọn phạm vi nhận' }]}
              >
                <Select
                  placeholder="--- Chọn phạm vi ---"
                  options={[
                    { value: 'all', label: 'Tất cả sinh viên' },
                    { value: 'building', label: 'Tòa nhà' },
                    { value: 'room', label: 'Phòng' },
                    {value: 'student', label: 'Sinh viên' }
                  ]}
                  className='h-11 mb-1'
                  onChange={handleAudienceChange}
                />
              </Form.Item>

              <Form.Item
                label={<span className="text-sm font-bold text-text-main dark:text-white">Đối tượng cụ thể {!isAllStudents && <span className="text-red-500">*</span>}</span>}
                name="target"
                validateTrigger={['onBlur', 'onChange']}
                rules={[
                  {
                    validator: (_, value) => {
                      if (!isAllStudents && !value) {
                        return Promise.reject(new Error('Vui lòng chọn đối tượng cụ thể'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Select
                  placeholder={isAllStudents ? '--- Không cần chọn ---' : optionsLoading ? 'Đang tải...' : '--- Chọn đối tượng cụ thể ---'}
                  options={getTargetOptions()}
                  className='h-11 mb-1'
                  disabled={isAllStudents || optionsLoading}
                  loading={optionsLoading}
                />
              </Form.Item>
            </div>

            {/* Content Textarea */}
            <Form.Item
              label={<span className="text-sm font-bold text-text-main dark:text-white">Nội dung chi tiết</span>}
              name="content"
              validateTrigger={['onBlur', 'onChange']}
              rules={[
                { required: true, message: 'Vui lòng nhập nội dung thông báo' },
                { min: 10, message: 'Nội dung phải có ít nhất 10 ký tự' }
              ]}
              className="mb-6"
            >
              <Input.TextArea
                placeholder="Nhập nội dung đầy đủ của thông báo..."
                rows={8}
                className="mb-1"
              />
            </Form.Item>

            {/* File Upload (Similar to CreateSupportRequest) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-main dark:text-white">Đính kèm tệp/hình ảnh (nếu có)</label>
              
              {fileType === 'document' ? (
                // Full-width document preview
                <div className="relative w-full">
                  <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-background-light dark:bg-gray-800 border border-border-color dark:border-gray-700">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="size-12 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                        <span className="material-symbols-outlined text-2xl">
                          {filePreview.endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                        </span>
                      </div>
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm font-medium text-text-main dark:text-white truncate">{filePreview}</span>
                        <span className="text-xs text-text-secondary dark:text-gray-400 mt-0.5">
                          {fileToUpload ? formatFileSize(fileToUpload.size) : ''}
                        </span>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={removeFile}
                      className="ml-3 size-8 flex items-center justify-center text-text-secondary hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                </div>
              ) : (
                // Horizontal layout for image or empty state
                <div className="flex flex-wrap gap-4 items-start w-full">
                  {/* Image preview */}
                  {fileType === 'image' && filePreview && (
                    <div className="relative group shrink-0">
                      <div className="size-24 md:size-32">
                        <img src={filePreview} className="w-full h-full object-cover rounded-lg border border-border-color dark:border-gray-700" alt="File preview" />
                      </div>
                      <button 
                        type="button"
                        onClick={removeFile}
                        className="absolute -top-2 -right-2 size-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  )}

                  {/* Upload Box appears when no file */}
                  {!filePreview && (
                    <>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        className="!hidden" 
                        accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                        onChange={handleFileChange}
                        name="attachment"
                      />
                      <div 
                        onClick={triggerFileInput}
                        className="size-24 md:size-32 rounded-xl border-2 border-dashed border-border-color dark:border-gray-700 flex flex-col items-center justify-center hover:bg-background-light dark:hover:bg-gray-800/30 hover:border-primary/50 transition-all cursor-pointer group shrink-0"
                      >
                        <span className="material-symbols-outlined text-3xl text-[#94a3b8] dark:text-gray-600 group-hover:text-primary transition-colors">cloud_upload</span>
                        <span className="text-[10px] font-bold text-text-secondary dark:text-gray-400 mt-1 uppercase tracking-tighter">Tải lên</span>
                      </div>
                    </>
                  )}
                </div>
              )}
              <p className="text-[10px] text-[#94a3b8] dark:text-gray-500 mt-1 uppercase tracking-wider">PNG, JPG, PDF, DOC (Tối đa 10MB)</p>
            </div>
          </Form>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 md:px-8 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-border-color dark:border-gray-800">
            <button 
              onClick={() => navigate(mode === 'edit' ? `/manager/notifications` : '/manager/notifications')}
              className="h-10 px-6 rounded-lg border border-border-color dark:border-gray-600 text-text-main dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={() => form.submit()}
              disabled={isLoading}
              className="h-10 px-6 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Spin size="small" style={{ color: 'white' }} />
                  Đang {mode === 'edit' ? 'cập nhật' : 'gửi'}...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">{mode === 'edit' ? 'save' : 'send'}</span>
                  {mode === 'edit' ? 'Cập nhật thông báo' : 'Gửi thông báo'}
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Extra spacing at the bottom */}
        <div className="h-12"></div>
      </div>
      )}
    </RoleBasedLayout>
  );
};

export default CreateNotification;