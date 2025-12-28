import React, { useContext, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button } from 'antd';
import { AuthContext } from '../App';
import DashboardLayout from '../layouts/DashboardLayout';
import { MANAGER_NAV_ITEMS } from './ManagerDashboard';
import { SearchOutlined } from "@ant-design/icons";

type NotificationFormValues = {
  title: string;
  audience: string;
  target: string;
  content: string;
};

type UploadedFile = {
  name: string;
  size: string;
  file: File;
};

const CreateNotification: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [form] = Form.useForm<NotificationFormValues>();
  const [audience, setAudience] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const isAllStudents = audience === 'all';
  const isBuildingScope = audience === 'building';
  const isRoomScope = audience === 'room';
  const isStudentScope = audience === 'student';

  const getTargetOptions = () => {
    if (isBuildingScope) {
      return [
        { value: 'A1', label: 'Tòa A1' },
        { value: 'A2', label: 'Tòa A2' },
        { value: 'B1', label: 'Tòa B1' },
      ];
    } else if (isRoomScope) {
      return [
        { value: 'A101', label: 'Phòng A101' },
        { value: 'A102', label: 'Phòng A102' },
        { value: 'A201', label: 'Phòng A201' },
        { value: 'B101', label: 'Phòng B101' },
      ];
    } else if (isStudentScope) {
      return [
        { value: 'student1', label: 'Nguyễn Văn A - MSSV: 123456' },
        { value: 'student2', label: 'Trần Thị B - MSSV: 123457' },
        { value: 'student3', label: 'Lê Văn C - MSSV: 123458' },
      ];
    }
    return [];
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles: UploadedFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`Tệp ${file.name} vượt quá 10MB, vui lòng chọn tệp khác`);
          continue;
        }
        newFiles.push({
          name: file.name,
          size: formatFileSize(file.size),
          file: file,
        });
      }
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleDropZone = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files) {
      const newFiles: UploadedFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`Tệp ${file.name} vượt quá 10MB, vui lòng chọn tệp khác`);
          continue;
        }
        newFiles.push({
          name: file.name,
          size: formatFileSize(file.size),
          file: file,
        });
      }
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (values: NotificationFormValues) => {
    console.log('Form values:', values);
    // Simulate API call
    alert('Thông báo đã được gửi thành công!');
    navigate('/notifications');
  };

  return (
    <DashboardLayout 
      navItems={MANAGER_NAV_ITEMS}
      searchPlaceholder="Tìm sinh viên, phòng tại Tòa A1..."
      headerTitle="Tạo thông báo"
      sidebarTitle="A1 Manager"
    >
      <div className="flex flex-col w-full mx-auto px-2 md:px-0">
        
        {/* Header Section */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <button 
              onClick={() => navigate('/notifications')}
              className="flex items-center gap-1 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Quay lại danh sách
            </button>
          </div>
          <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">Tạo Thông báo Mới</h1>
          <p className="text-text-secondary dark:text-gray-400 text-base font-normal leading-normal">Soạn thảo nội dung và gửi thông báo đến sinh viên, các tòa nhà hoặc phòng cụ thể.</p>
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
                  placeholder={isAllStudents ? '--- Không cần chọn ---' : '--- Chọn đối tượng cụ thể ---'}
                  options={getTargetOptions()}
                  className='h-11 mb-1'
                  disabled={isAllStudents}
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

            {/* File Upload (Mock) */}
            <div className="flex flex-col gap-2 mb-6">
              <label className="text-sm font-bold text-text-main dark:text-white">Đính kèm tệp/hình ảnh</label>
              <input 
                ref={fileInputRef}
                type="file" 
                multiple 
                onChange={handleFileSelect}
                className="!hidden"
                accept=".png,.jpg,.jpeg,.pdf"
              />
              <div 
                onClick={handleDropZoneClick}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropZone}
                className="mt-1 flex justify-center rounded-xl border-2 border-dashed border-border-color dark:border-gray-700 px-6 py-8 hover:bg-background-light dark:hover:bg-gray-800/30 hover:border-primary/50 transition-all cursor-pointer group"
              >
                <div className="text-center">
                  <span className="material-symbols-outlined text-5xl text-[#94a3b8] dark:text-gray-600 group-hover:text-primary transition-colors mb-4">cloud_upload</span>
                  <div className="flex flex-col sm:flex-row items-center justify-center text-sm leading-6 text-text-secondary dark:text-gray-400 gap-1">
                    <span className="font-semibold text-primary hover:underline">Nhấn để tải lên</span>
                    <span>hoặc kéo thả tệp vào đây</span>
                  </div>
                  <p className="text-xs leading-5 text-[#94a3b8] dark:text-gray-500 mt-2">PNG, JPG, PDF (Tối đa 10MB)</p>
                </div>
              </div>
              
              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="flex flex-col gap-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-background-light dark:bg-gray-800 border border-border-color dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="size-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                          <span className="material-symbols-outlined">
                            {file.name.toLowerCase().endsWith('.pdf') ? 'description' : 'image'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-text-main dark:text-white line-clamp-1">{file.name}</span>
                          <span className="text-xs text-text-secondary dark:text-gray-400">{file.size}</span>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteFile(index)}
                        className="size-8 flex items-center justify-center text-text-secondary hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Form>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 md:px-8 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-border-color dark:border-gray-800">
            <button 
              onClick={() => navigate('/notifications')}
              className="h-10 px-6 rounded-lg border border-border-color dark:border-gray-600 text-text-main dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={() => form.submit()}
              className="h-10 px-6 rounded-lg bg-primary text-white font-bold hover:bg-primary-hover shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
              Gửi thông báo
            </button>
          </div>
        </div>
        
        {/* Extra spacing at the bottom */}
        <div className="h-12"></div>
      </div>
    </DashboardLayout>
  );
};

export default CreateNotification;