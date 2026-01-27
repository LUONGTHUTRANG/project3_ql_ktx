import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { createSupportRequest, getSupportRequestById, updateSupportRequest } from '../api_handlers/supportRequestApi';
import { message, Spin } from 'antd';

const CreateSupportRequest: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Determine if we're in edit mode
  const isEditMode = !!id;

  // States
  const [selectedCategory, setSelectedCategory] = useState<string>('COMPLAINT');
  const [images, setImages] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      const newFiles = Array.from(fileList);
      const newImages = newFiles.map((file: File) => URL.createObjectURL(file));
      // Limit to 3 images as per requirement
      const combinedFiles = [...files, ...newFiles].slice(0, 3);
      const combinedImages = [...images, ...newImages].slice(0, 3);
      setFiles(combinedFiles);
      setImages(combinedImages);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Load request data when in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;
    
    const loadRequest = async () => {
      try {
        setLoading(true);
        const response = await getSupportRequestById(id);
        const data = response.data || response;
        
        setSelectedCategory(data.type || 'COMPLAINT');
        setTitle(data.title || '');
        setDescription(data.content || '');
        
        // Load attachment if exists
        if (data.attachment_url) {
          setImages([data.attachment_url]);
        }
      } catch (err: any) {
        console.error('Failed to load support request:', err);
        message.error('Lỗi khi tải yêu cầu hỗ trợ');
      } finally {
        setLoading(false);
      }
    };
    
    loadRequest();
  }, [isEditMode, id]);

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      message.error('Vui lòng nhập tiêu đề yêu cầu');
      return;
    }
    if (!description.trim()) {
      message.error('Vui lòng nhập mô tả chi tiết');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const payload = {
        type: selectedCategory,
        title: title.trim(),
        content: description.trim(),
      };

      // Upload with first file if available
      const fileToUpload = files.length > 0 ? files[0] : undefined;
      
      if (isEditMode && id) {
        // Update existing request with all data
        await updateSupportRequest(id, payload, fileToUpload);
        message.success('Yêu cầu hỗ trợ đã được cập nhật thành công!');
      } else {
        // Create new request
        await createSupportRequest(payload, fileToUpload);
        message.success('Yêu cầu hỗ trợ đã được gửi thành công!');
      }
      
      setTimeout(() => {
        navigate('/student/requests');
      }, 1500);
    } catch (error: any) {
      console.error('Error saving support request:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Lỗi khi gửi yêu cầu';
      message.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <RoleBasedLayout 
        searchPlaceholder="Tìm kiếm dịch vụ..."
        headerTitle={isEditMode ? "Chỉnh sửa yêu cầu" : "Tạo yêu cầu mới"}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Spin tip="Đang tải yêu cầu hỗ trợ..." />
        </div>
      </RoleBasedLayout>
    );
  }

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm kiếm dịch vụ..."
      headerTitle={isEditMode ? "Chỉnh sửa yêu cầu" : "Tạo yêu cầu mới"}
    >
      <div className="flex flex-col w-full mx-auto px-2 md:px-0">
        
        {/* Breadcrumbs & Title */}
        <div className="flex flex-col gap-2 mb-6">
          <button
            onClick={() => navigate(`/${user.role}/requests`)}
            className="group flex items-center gap-2 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            <div className="flex items-center justify-center size-8 rounded-full group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </div>
            <span className="text-sm font-bold leading-normal">Quay lại danh sách yêu cầu</span>
          </button>
          <h1 className="text-text-main dark:text-white text-2xl md:text-3xl font-bold leading-tight tracking-tight">
            {isEditMode ? `Cập nhật yêu cầu #${id}` : 'Gửi yêu cầu hỗ trợ'}
          </h1>
          <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base">
            {isEditMode 
              ? 'Bạn có thể thay đổi thông tin hoặc bổ sung thêm chi tiết cho yêu cầu đã gửi.' 
              : 'Mô tả sự cố bạn đang gặp phải để Ban quản lý hỗ trợ xử lý kịp thời.'}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col gap-6">
            
            {/* Category Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-main dark:text-white">Loại sự cố <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'COMPLAINT', label: 'Khiếu nại', icon: 'report_problem', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
                  { id: 'REPAIR', label: 'Sửa chữa', icon: 'construction', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                  { id: 'PROPOSAL', label: 'Đề xuất', icon: 'lightbulb', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
                ].map((cat) => (
                  <button 
                    key={cat.id} 
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all group active:scale-95 focus:ring-2 focus:ring-primary/20 ${
                      selectedCategory === cat.id 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                        : 'border-border-color dark:border-gray-700 hover:border-primary/50'
                    }`}
                  >
                    <div className={`size-10 rounded-full ${cat.bg} ${cat.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                      <span className="material-symbols-outlined">{cat.icon}</span>
                    </div>
                    <span className={`text-xs font-bold ${selectedCategory === cat.id ? 'text-primary' : 'text-text-main dark:text-gray-200'}`}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-main dark:text-white" htmlFor="req-title">Tiêu đề yêu cầu <span className="text-red-500">*</span></label>
              <input 
                id="req-title" 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-11 px-4 rounded-lg border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark text-text-main dark:text-white placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm" 
                placeholder="Ví dụ: Hỏng vòi nước bồn rửa mặt" 
              />
            </div>

            {/* Description Textarea */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-main dark:text-white" htmlFor="req-content">Mô tả chi tiết <span className="text-red-500">*</span></label>
              <textarea 
                id="req-content" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[150px] p-4 rounded-lg border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark text-text-main dark:text-white placeholder-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none text-sm leading-relaxed" 
                placeholder="Hãy mô tả rõ tình trạng sự cố và vị trí cụ thể trong phòng..."
              ></textarea>
            </div>

            {/* Image Upload Area */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-main dark:text-white">Hình ảnh minh chứng (nếu có)</label>
              
              <div className="flex flex-wrap gap-4 items-start">
                {/* Previews appear first */}
                {images.map((img, idx) => (
                  <div key={idx} className="relative group size-24 md:size-32 shrink-0">
                    <img src={img} className="w-full h-full object-cover rounded-lg border border-border-color dark:border-gray-700" alt={`Upload ${idx}`} />
                    <button 
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 size-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}

                {/* Upload Box appears last */}
                {images.length < 3 && (
                  <>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      multiple 
                      onChange={handleFileChange} 
                    />
                    <div 
                      onClick={triggerFileInput}
                      className="size-24 md:size-32 rounded-xl border-2 border-dashed border-border-color dark:border-gray-700 flex flex-col items-center justify-center hover:bg-background-light dark:hover:bg-gray-800/30 hover:border-primary/50 transition-all cursor-pointer group shrink-0"
                    >
                      <span className="material-symbols-outlined text-3xl text-[#94a3b8] dark:text-gray-600 group-hover:text-primary transition-colors">add_a_photo</span>
                      <span className="text-[10px] font-bold text-text-secondary dark:text-gray-400 mt-1 uppercase tracking-tighter">{isEditMode ? 'Tải thêm' : 'Tải ảnh'}</span>
                    </div>
                  </>
                )}
              </div>
              <p className="text-[10px] text-[#94a3b8] dark:text-gray-500 mt-1 uppercase tracking-wider">Tối đa 3 ảnh (JPG, PNG)</p>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 px-6 md:px-8 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-border-color dark:border-gray-800">
            <button 
              onClick={() => navigate(isEditMode ? `/student/requests/${id}` : '/student/requests')}
              disabled={isSubmitting}
              className="h-10 px-6 rounded-lg border border-border-color dark:border-gray-600 text-text-main dark:text-white font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-10 px-8 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-hover shadow-sm hover:shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Spin size="small" />
                  {isEditMode ? 'Đang cập nhật...' : 'Đang gửi...'}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">{isEditMode ? 'save' : 'send'}</span>
                  {isEditMode ? 'Lưu thay đổi' : 'Gửi yêu cầu'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </RoleBasedLayout>
  );
};

export default CreateSupportRequest;
