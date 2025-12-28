
import React, { useContext, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../App';
import DashboardLayout from '../layouts/DashboardLayout';
import { STUDENT_NAV_ITEMS } from './StudentDashboard';

const EditSupportRequest: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data to pre-fill the form
  const [selectedCategory, setSelectedCategory] = useState('elec');
  const [title, setTitle] = useState('Bóng đèn phòng tắm bị nhấp nháy');
  const [description, setDescription] = useState('Bóng đèn phòng tắm bị nhấp nháy liên tục từ tối qua, thỉnh thoảng có mùi khét nhẹ khi bật lâu. Cần kiểm tra gấp để tránh chập cháy điện trong phòng.');
  const [images, setImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=200&auto=format&fit=crop"
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Fix: Explicitly type 'file' as 'File' to resolve type error with URL.createObjectURL
      const newImages = Array.from(files).map((file: File) => URL.createObjectURL(file));
      setImages(prev => [...prev, ...newImages].slice(0, 3));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (!user) return null;

  return (
    <DashboardLayout 
      navItems={STUDENT_NAV_ITEMS}
      searchPlaceholder="Tìm kiếm dịch vụ..."
      headerTitle="Chỉnh sửa yêu cầu"
    >
      <div className="flex flex-col w-full mx-auto px-2 md:px-0">
        
        {/* Breadcrumbs & Title */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <button 
              onClick={() => navigate(`/student/requests/${id}`)}
              className="flex items-center gap-1 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Quay lại chi tiết
            </button>
          </div>
          <h1 className="text-text-main dark:text-white text-2xl md:text-3xl font-black leading-tight tracking-tight">Cập nhật yêu cầu #{id}</h1>
          <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base">Bạn có thể thay đổi thông tin hoặc bổ sung thêm chi tiết cho yêu cầu đã gửi.</p>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col gap-6">
            
            {/* Category Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-text-main dark:text-white">Loại sự cố <span className="text-red-500">*</span></label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'elec', label: 'Điện', icon: 'bolt', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                  { id: 'water', label: 'Nước', icon: 'water_drop', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                  { id: 'net', label: 'Internet', icon: 'wifi', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
                  { id: 'other', label: 'Khác', icon: 'more_horiz', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-700/50' },
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
              <label className="text-sm font-bold text-text-main dark:text-white">Hình ảnh minh chứng</label>
              
              <div className="flex flex-wrap gap-4 items-start">
                {/* Previews appear first */}
                {images.map((img, idx) => (
                  <div key={idx} className="relative group size-24 md:size-32 shrink-0">
                    <img src={img} className="w-full h-full object-cover rounded-lg border border-border-color dark:border-gray-700" alt={`Evidence ${idx}`} />
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
                      <span className="text-[10px] font-bold text-text-secondary dark:text-gray-400 mt-1 uppercase tracking-tighter">Tải thêm</span>
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
              onClick={() => navigate(`/student/requests/${id}`)}
              className="h-10 px-6 rounded-lg border border-border-color dark:border-gray-600 text-text-main dark:text-white font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={() => navigate(`/student/requests/${id}`)}
              className="h-10 px-8 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-hover shadow-sm hover:shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">save</span>
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditSupportRequest;
