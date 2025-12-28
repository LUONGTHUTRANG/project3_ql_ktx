import React, { useContext, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../App';
import DashboardLayout from '../layouts/DashboardLayout';
import { STUDENT_NAV_ITEMS } from './StudentDashboard';
import { MANAGER_NAV_ITEMS } from './ManagerDashboard';
import { UserRole } from '../types';

const SupportRequestDetail: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed'>('processing');
  const [processingNotes, setProcessingNotes] = useState('Kỹ thuật viên đang kiểm tra dây điện và bóng đèn.');
  const [showProcessingForm, setShowProcessingForm] = useState(false);
  const [tempNotes, setTempNotes] = useState(processingNotes);
  const [tempStatus, setTempStatus] = useState(status);

  // Check if user is a manager
  const isManager = user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN;

  const requestDetail = {
    id: id || 'REQ-2023-001',
    category: 'Điện',
    categoryIcon: 'bolt',
    categoryColor: 'text-orange-600',
    categoryBg: 'bg-orange-50 dark:bg-orange-900/20',
    title: 'Bóng đèn phòng tắm bị nhấp nháy',
    description: 'Bóng đèn phòng tắm bị nhấp nháy liên tục từ tối qua, thỉnh thoảng có mùi khét nhẹ khi bật lâu. Cần kiểm tra gấp để tránh chập cháy điện trong phòng.',
    createdAt: '20/10/2023 - 09:30 AM',
    status: 'processing',
    statusLabel: 'Đang xử lý',
    statusColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    statusDot: 'bg-blue-500',
    images: [
      "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800&auto=format&fit=crop"
    ],
    timeline: [
      { date: '20/10/2023 - 14:15 PM', title: 'Cán bộ kỹ thuật đã tiếp nhận', desc: 'Kỹ thuật viên Nguyễn Văn Nam đã được phân công xử lý.', icon: 'person_check', active: true },
      { date: '20/10/2023 - 09:35 AM', title: 'Đã gửi yêu cầu', desc: 'Hệ thống đã ghi nhận yêu cầu của bạn.', icon: 'send', active: false },
    ]
  };

  const handleSaveProcessing = () => {
    setStatus(tempStatus);
    setProcessingNotes(tempNotes);
    setShowProcessingForm(false);
  };

  return (
    <DashboardLayout 
      navItems={isManager ? MANAGER_NAV_ITEMS : STUDENT_NAV_ITEMS}
      searchPlaceholder="Tìm kiếm..."
      headerTitle="Chi tiết yêu cầu"
    >
      <div className="flex flex-col w-full mx-auto px-2 md:px-0">
        
        {/* Breadcrumbs & Title */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-text-main dark:text-white text-2xl md:text-3xl font-black leading-tight tracking-tight">Chi tiết yêu cầu #{requestDetail.id}</h1>
              <p className="text-text-secondary dark:text-gray-400 text-sm mt-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                Ngày gửi: {requestDetail.createdAt}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${requestDetail.statusColor} border border-blue-200 dark:border-blue-800 self-start md:self-center`}>
              <span className={`size-2 rounded-full ${requestDetail.statusDot} animate-pulse`}></span>
              {requestDetail.statusLabel}
            </span>
          </div>
        </div>

        {/* Manager Processing Section */}
        {isManager && !showProcessingForm && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm overflow-hidden mb-6">
            <div className="px-8 py-4 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                <span className={`inline-block size-2 rounded-full ${status === 'pending' ? 'bg-yellow-500' : status === 'processing' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                Trạng thái: <span className="font-bold">{status === 'pending' ? 'Đang chờ' : status === 'processing' ? 'Đang xử lý' : 'Đã hoàn thành'}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
                    <span className="material-symbols-outlined">assignment_turned_in</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-text-main dark:text-white mb-1">Ghi chú xử lý</h3>
                    <p className="text-sm text-text-secondary dark:text-gray-300 leading-relaxed">{processingNotes}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setTempNotes(processingNotes);
                  setTempStatus(status);
                  setShowProcessingForm(true);
                }}
                className="self-start h-9 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Cập nhật
              </button>
            </div>
          </div>
        )}

        {/* Manager Processing Edit Form */}
        {isManager && showProcessingForm && (
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-blue-300 dark:border-blue-700 shadow-md overflow-hidden mb-6">
            <div className="p-6 md:p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">edit</span>
                  Cập nhật ghi chú xử lý
                </h3>
                <button
                  onClick={() => setShowProcessingForm(false)}
                  className="text-text-secondary dark:text-gray-400 hover:text-text-main dark:hover:text-white"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Status Update */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-text-main dark:text-white">Trạng thái xử lý</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'pending' as const, label: 'Đang chờ', color: 'yellow' },
                    { value: 'processing' as const, label: 'Đang xử lý', color: 'blue' },
                    { value: 'completed' as const, label: 'Đã hoàn thành', color: 'green' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTempStatus(option.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        tempStatus === option.value
                          ? `bg-${option.color}-600 text-white shadow-md`
                          : `bg-gray-100 dark:bg-gray-800 text-text-secondary dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700`
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Processing Notes */}
              <div className="flex flex-col gap-3">
                <label className="text-sm font-bold text-text-main dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">notes</span>
                  Ghi chú xử lý
                </label>
                <textarea
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="Nhập ghi chú xử lý (VD: Đã thay thế bóng đèn, kiểm tra điện áp, chạy thử...)..."
                  className="w-full min-h-[120px] p-4 rounded-lg border border-border-color dark:border-gray-700 bg-white dark:bg-gray-800 text-text-main dark:text-white placeholder-text-secondary dark:placeholder-gray-500 font-normal resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-text-secondary dark:text-gray-400">Mô tả chi tiết các bước xử lý hoặc vấn đề phát hiện được</p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setShowProcessingForm(false)}
                  className="h-10 px-6 rounded-lg bg-white dark:bg-gray-800 border border-border-color dark:border-gray-700 text-text-main dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveProcessing}
                  className="h-10 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors flex items-center gap-2 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  Lưu cập nhật
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Info Card */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden mb-6">
          <div className="p-6 md:p-8 flex flex-col gap-6">
            
            {/* Category Info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-background-light dark:bg-gray-800/50">
              <div className={`size-12 rounded-full ${requestDetail.categoryBg} ${requestDetail.categoryColor} flex items-center justify-center shrink-0`}>
                <span className="material-symbols-outlined text-2xl">{requestDetail.categoryIcon}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Danh mục</p>
                <p className="text-base font-bold text-text-main dark:text-white">{requestDetail.category}</p>
              </div>
            </div>

            {/* Content Display */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-text-secondary dark:text-gray-400">Tiêu đề</h3>
                <p className="text-lg font-bold text-text-main dark:text-white">{requestDetail.title}</p>
              </div>
              
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-text-secondary dark:text-gray-400">Nội dung chi tiết</h3>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-text-main dark:text-gray-300 text-sm leading-relaxed border border-border-color/50 dark:border-gray-700">
                  {requestDetail.description}
                </div>
              </div>
            </div>

            {/* Images Display */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-text-secondary dark:text-gray-400">Hình ảnh đính kèm</h3>
              <div className="flex flex-wrap gap-3">
                {requestDetail.images.map((img, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setZoomedImage(img)}
                    className="size-24 md:size-32 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden cursor-zoom-in hover:ring-2 ring-primary transition-all group relative"
                  >
                    <img src={img} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="material-symbols-outlined text-white">zoom_in</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="flex flex-col gap-4 mb-10">
          <h2 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2 px-2">
            <span className="material-symbols-outlined text-primary">history</span>
            Tiến độ xử lý
          </h2>
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm p-6">
            <div className="relative flex flex-col gap-8 ml-4 border-l-2 border-gray-100 dark:border-gray-700 pl-8 py-2">
              {requestDetail.timeline.map((event, index) => (
                <div key={index} className="relative">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[43px] top-0 size-7 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-surface-dark ${event.active ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-text-secondary'}`}>
                    <span className="material-symbols-outlined text-[16px]">{event.icon}</span>
                  </div>
                  {/* Content */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-text-secondary dark:text-gray-500 uppercase tracking-widest">{event.date}</span>
                    <h4 className={`text-sm font-bold ${event.active ? 'text-text-main dark:text-white' : 'text-text-secondary dark:text-gray-400'}`}>{event.title}</h4>
                    <p className="text-xs text-text-secondary dark:text-gray-400">{event.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        {!isManager && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10">
            <p className="text-sm text-text-main dark:text-gray-300 font-medium">Bạn muốn bổ sung thêm thông tin hoặc thay đổi yêu cầu?</p>
            <button 
              onClick={() => navigate(`/student/requests/${requestDetail.id}/edit`)}
              className="h-10 px-6 rounded-lg bg-white dark:bg-surface-dark border border-primary/30 text-primary font-bold text-sm hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2 active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Phản hồi thêm
            </button>
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
          onClick={() => setZoomedImage(null)}
        >
          <button className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors">
            <span className="material-symbols-outlined text-[32px]">close</span>
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoomed evidence" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
          />
        </div>
      )}
    </DashboardLayout>
  );
};

export default SupportRequestDetail;