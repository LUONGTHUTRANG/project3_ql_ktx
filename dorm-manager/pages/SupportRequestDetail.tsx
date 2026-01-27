import React, { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { UserRole } from '../types';
import { getSupportRequestById, updateSupportRequestStatus } from '../api';
import { message, Spin } from 'antd';

const SupportRequestDetail: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestData, setRequestData] = useState<any>(null);
  const [status, setStatus] = useState<string>('pending');
  const [processingNotes, setProcessingNotes] = useState('');
  const [showProcessingForm, setShowProcessingForm] = useState(false);
  const [tempNotes, setTempNotes] = useState('');
  const [tempStatus, setTempStatus] = useState<string>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is a manager
  const isManager = user?.role === UserRole.MANAGER || user?.role === UserRole.ADMIN;

  // Fetch request detail
  useEffect(() => {
    const loadRequest = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const response = await getSupportRequestById(id);
        const data = response.data || response;
        setRequestData(data);
        setStatus(data.status || 'pending');
        setProcessingNotes(data.notes || '');
        setTempNotes(data.notes || '');
        setTempStatus(data.status || 'pending');
      } catch (err: any) {
        console.error('Failed to load support request:', err);
        setError(err.response?.data?.error || err.message || 'Lỗi khi tải yêu cầu hỗ trợ');
      } finally {
        setLoading(false);
      }
    };
    loadRequest();
  }, [id]);

  const getTypeInfo = (type: string) => {
    let typeLabel = 'Khác';
    let icon = 'help';
    let iconColor = 'text-primary';
    let iconBg = 'bg-primary/10';

    if (type === 'COMPLAINT') {
      typeLabel = 'Khiếu nại';
      icon = 'report_problem';
      iconColor = 'text-red-600 dark:text-red-400';
      iconBg = 'bg-red-50 dark:bg-red-900/20';
    } else if (type === 'REPAIR') {
      typeLabel = 'Sửa chữa';
      icon = 'construction';
      iconColor = 'text-orange-600 dark:text-orange-400';
      iconBg = 'bg-orange-50 dark:bg-orange-900/20';
    } else if (type === 'PROPOSAL') {
      typeLabel = 'Đề xuất';
      icon = 'lightbulb';
      iconColor = 'text-yellow-600 dark:text-yellow-400';
      iconBg = 'bg-yellow-50 dark:bg-yellow-900/20';
    }
    return { typeLabel, icon, iconColor, iconBg };
  };

  const getStatusInfo = (statusValue: string) => {
    let statusLabel = 'Chưa xác định';
    let statusColor = 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800';
    let statusDot = 'bg-gray-500';

    if (statusValue === 'PENDING' || statusValue === 'pending') {
      statusLabel = 'Đang chờ';
      statusColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      statusDot = 'bg-yellow-500';
    } else if (statusValue === 'PROCESSING' || statusValue === 'processing') {
      statusLabel = 'Đang xử lý';
      statusColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      statusDot = 'bg-blue-500';
    } else if (statusValue === 'COMPLETED' || statusValue === 'completed') {
      statusLabel = 'Đã hoàn thành';
      statusColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800';
      statusDot = 'bg-green-500';
    }
    return { statusLabel, statusColor, statusDot };
  };

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

  const handleSaveProcessing = async () => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      await updateSupportRequestStatus(id, tempStatus);
      setStatus(tempStatus);
      setProcessingNotes(tempNotes);
      setShowProcessingForm(false);
      message.success('Cập nhật trạng thái thành công!');
    } catch (err: any) {
      console.error('Error updating status:', err);
      message.error(err.response?.data?.error || 'Lỗi khi cập nhật trạng thái');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <RoleBasedLayout 
        searchPlaceholder="Tìm kiếm..."
        headerTitle="Chi tiết yêu cầu"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Spin tip="Đang tải yêu cầu hỗ trợ..." />
        </div>
      </RoleBasedLayout>
    );
  }

  if (error || !requestData) {
    return (
      <RoleBasedLayout 
        searchPlaceholder="Tìm kiếm..."
        headerTitle="Chi tiết yêu cầu"
      >
        <div className="flex items-center justify-center min-h-[400px] text-red-600">
          {error || 'Không tìm thấy yêu cầu'}
        </div>
      </RoleBasedLayout>
    );
  }

  const typeInfo = getTypeInfo(requestData.type);
  const statusInfo = getStatusInfo(status);
  const createdDate = requestData.created_at ? new Date(requestData.created_at).toLocaleDateString('vi-VN') : '-';
  const createdTime = requestData.created_at ? new Date(requestData.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm kiếm..."
      headerTitle="Chi tiết yêu cầu"
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-text-main dark:text-white text-2xl md:text-3xl font-bold leading-tight tracking-tight">Chi tiết yêu cầu #{requestData.id}</h1>
              <p className="text-text-secondary dark:text-gray-400 text-sm mt-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                Ngày gửi: {createdDate} - {createdTime}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusInfo.statusColor} border self-start md:self-center`}>
              <span className={`size-2 rounded-full ${statusInfo.statusDot} ${status === 'PROCESSING' || status === 'processing' ? 'animate-pulse' : ''}`}></span>
              {statusInfo.statusLabel}
            </span>
          </div>
        </div>

        {/* Manager Processing Section */}
        {isManager && !showProcessingForm && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm overflow-hidden mb-6">
            <div className="px-8 py-4 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                <span className={`inline-block size-2 rounded-full ${statusInfo.statusDot}`}></span>
                Trạng thái: <span className="font-bold">{statusInfo.statusLabel}</span>
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
              <div className={`size-12 rounded-full ${typeInfo.iconBg} ${typeInfo.iconColor} flex items-center justify-center shrink-0`}>
                <span className="material-symbols-outlined text-2xl">{typeInfo.icon}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Loại yêu cầu</p>
                <p className="text-base font-bold text-text-main dark:text-white">{typeInfo.typeLabel}</p>
              </div>
            </div>

            {/* Content Display */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-text-secondary dark:text-gray-400">Tiêu đề</h3>
                <p className="text-lg font-bold text-text-main dark:text-white">{requestData.title}</p>
              </div>
              
              <div className="flex flex-col gap-1">
                <h3 className="text-sm font-bold text-text-secondary dark:text-gray-400">Nội dung chi tiết</h3>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-text-main dark:text-gray-300 text-sm leading-relaxed border border-border-color/50 dark:border-gray-700">
                  {requestData.content}
                </div>
              </div>
            </div>

            {/* Images Display */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-text-secondary dark:text-gray-400">Hình ảnh đính kèm</h3>
              {requestData.attachment_url ? (
                <div className="flex flex-wrap gap-3">
                  <div 
                    onClick={() => setZoomedImage(requestData.attachment_url)}
                    className="size-24 md:size-32 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden cursor-zoom-in hover:ring-2 ring-primary transition-all group relative"
                  >
                    <img src={requestData.attachment_url} alt="Evidence" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="material-symbols-outlined text-white">zoom_in</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary dark:text-gray-400">Không có hình ảnh đính kèm</p>
              )}
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
              <div className="relative">
                {/* Timeline Dot */}
                <div className="absolute -left-[43px] top-0 size-7 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-surface-dark bg-primary text-white">
                  <span className="material-symbols-outlined text-[16px]">add_comment</span>
                </div>
                {/* Content */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold text-text-secondary dark:text-gray-500 uppercase tracking-widest">{createdDate} - {createdTime}</span>
                  <h4 className="text-sm font-bold text-text-main dark:text-white">Yêu cầu đã được gửi</h4>
                  <p className="text-xs text-text-secondary dark:text-gray-400">Hệ thống đã ghi nhận yêu cầu của bạn</p>
                </div>
              </div>
              {processingNotes && (
                <div className="relative">
                  <div className="absolute -left-[43px] top-0 size-7 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-surface-dark bg-blue-600 text-white">
                    <span className="material-symbols-outlined text-[16px]">notes</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-text-secondary dark:text-gray-500 uppercase tracking-widest">Ghi chú xử lý</span>
                    <h4 className="text-sm font-bold text-text-main dark:text-white">Tình trạng cập nhật</h4>
                    <p className="text-xs text-text-secondary dark:text-gray-400">{processingNotes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Footer */}
        {!isManager && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/10">
            <p className="text-sm text-text-main dark:text-gray-300 font-medium">Bạn muốn bổ sung thêm thông tin hoặc thay đổi yêu cầu?</p>
            <button 
              onClick={() => navigate(`/student/requests/${requestData.id}/edit`)}
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
    </RoleBasedLayout>
  );
};

export default SupportRequestDetail;