import React, { useContext, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { AuthContext } from '../App';
import DashboardLayout from '../layouts/DashboardLayout';
import { STUDENT_NAV_ITEMS } from './StudentDashboard';

const InvoiceDetail: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [isQrZoomed, setIsQrZoomed] = useState(false);

  if (!user) return null;

  // Mock data for the invoice
  const invoice = {
    id: id || 'INV-2023-10-001',
    date: '01/10/2023',
    deadline: '05/10/2023',
    period: 'Tháng 10/2023',
    status: 'unpaid',
    studentName: user.name,
    studentId: user.id.replace('S', ''),
    email: 'nguyenvana@student.edu.vn',
    room: 'Phòng 302',
    building: 'Khu B - Tòa Nhà B',
    items: [
      { name: 'Tiền phòng tháng 10/2023', desc: 'Phí cố định hàng tháng', unit: '1 tháng', price: 250000 },
      { name: 'Tiền điện', desc: 'Cũ: 3420 | Mới: 3480', unit: '60 kWh', price: 2500, total: 150000 },
      { name: 'Tiền nước', desc: 'Cũ: 120 | Mới: 128', unit: '8 m³', price: 6000, total: 48000 },
      { name: 'Phí vệ sinh môi trường', desc: '', unit: '1 tháng', price: 20000, total: 20000 },
    ],
    subtotal: 468000,
    tax: 0,
    total: 468000
  };

  return (
    <DashboardLayout 
      navItems={STUDENT_NAV_ITEMS.map(item => ({...item, isActive: item.link === '/student/bills'}))}
      searchPlaceholder="Tìm kiếm..."
      headerTitle="Chi tiết Hóa đơn"
    >
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-2 text-sm font-medium">
          <Link className="text-text-secondary dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-1" to="/student/bills">
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            Hóa đơn
          </Link>
          <span className="material-symbols-outlined text-base text-text-secondary dark:text-gray-600">chevron_right</span>
          <span className="text-text-main dark:text-white font-bold">Chi tiết #{invoice.id}</span>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Invoice Detail */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Invoice Paper Card */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden">
              
              {/* Header Section */}
              <div className="p-6 md:p-10 border-b border-border-color dark:border-gray-700 flex flex-col md:flex-row justify-between md:items-start gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-3xl font-bold">school</span>
                    </div>
                    <h1 className="text-xl font-black text-text-main dark:text-white tracking-tight">KTX Đại học Quốc Gia</h1>
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">Khu B, ĐHQG TP.HCM, Dĩ An, Bình Dương</p>
                    <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">Hotline: (028) 3724 4270</p>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <h2 className="text-3xl font-black tracking-tight text-text-main dark:text-white mb-1">HÓA ĐƠN</h2>
                  <p className="text-lg font-bold text-primary">#{invoice.id}</p>
                  <p className="text-sm text-text-secondary dark:text-gray-400 mt-2 font-medium">Ngày lập: {invoice.date}</p>
                </div>
              </div>

              {/* Customer & Info Section */}
              <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500 mb-3">Thông tin Sinh viên</p>
                  <div className="flex flex-col gap-1">
                    <p className="text-xl font-bold text-text-main dark:text-white">{invoice.studentName}</p>
                    <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">MSSV: {invoice.studentId}</p>
                    <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">{invoice.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500 mb-3">Thông tin Phòng ở</p>
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary border border-blue-100 dark:border-blue-800">
                      <span className="material-symbols-outlined text-2xl">meeting_room</span>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text-main dark:text-white">{invoice.room}</p>
                      <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">{invoice.building}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="px-6 md:px-10 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-border-color dark:border-gray-700">
                        <th className="py-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400 w-1/2">Khoản mục</th>
                        <th className="py-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400 text-center">Đơn vị</th>
                        <th className="py-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400 text-right">Đơn giá</th>
                        <th className="py-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="text-text-main dark:text-white">
                      {invoice.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-dashed border-border-color dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-5 pr-4">
                            <p className="font-bold text-sm">{item.name}</p>
                            {item.desc && <p className="text-[11px] text-text-secondary dark:text-gray-500 mt-1 font-medium italic">{item.desc}</p>}
                          </td>
                          <td className="py-5 text-center text-sm font-medium text-text-secondary dark:text-gray-400">{item.unit}</td>
                          <td className="py-5 text-right text-sm font-medium">{item.price.toLocaleString()} đ</td>
                          <td className="py-5 text-right font-bold text-sm">{(item.total || item.price).toLocaleString()} đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Section */}
              <div className="bg-gray-50 dark:bg-black/20 p-6 md:p-10 flex flex-col items-end gap-3">
                <div className="flex justify-between w-full md:w-1/2 text-sm font-medium">
                  <span className="text-text-secondary dark:text-gray-400">Cộng tiền hàng:</span>
                  <span className="text-text-main dark:text-white">{invoice.subtotal.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between w-full md:w-1/2 text-sm font-medium">
                  <span className="text-text-secondary dark:text-gray-400">Thuế GTGT (0%):</span>
                  <span className="text-text-main dark:text-white">0 đ</span>
                </div>
                <div className="w-full h-px bg-border-color dark:bg-gray-700 my-2 md:w-1/2"></div>
                <div className="flex justify-between w-full md:w-1/2 items-end">
                  <span className="text-base font-black text-text-main dark:text-white">TỔNG CỘNG:</span>
                  <span className="text-3xl font-black text-primary">{invoice.total.toLocaleString()} đ</span>
                </div>
              </div>
            </div>

            {/* Note Section */}
            <div className="flex gap-4 p-5 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30 shadow-sm animate-pulse-subtle">
              <div className="size-10 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                <span className="material-symbols-outlined font-bold">info</span>
              </div>
              <div>
                <p className="text-sm font-black text-orange-800 dark:text-orange-300">Lưu ý quan trọng</p>
                <p className="text-sm text-orange-700 dark:text-orange-400/90 mt-1 leading-relaxed font-medium">
                  Vui lòng thanh toán trước ngày <strong>{invoice.deadline}</strong> để tránh bị tính phí phạt chậm thanh toán (2% trên tổng hóa đơn) và đảm bảo các quyền lợi lưu trú.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Actions & Payment */}
          <div className="lg:col-span-1 flex flex-col gap-6 sticky top-24">
            
            {/* Status Card */}
            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-color dark:border-gray-700 shadow-sm">
              <h3 className="text-[11px] font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest mb-5">Trạng thái thanh toán</h3>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-11 items-center justify-center gap-x-2 rounded-full bg-red-50 dark:bg-red-900/20 pl-4 pr-5 border border-red-100 dark:border-red-900/30 w-full">
                  <div className="size-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
                  <p className="text-red-700 dark:text-red-400 text-sm font-black leading-normal">CHƯA THANH TOÁN</p>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-border-color dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-text-secondary dark:text-gray-400">Hạn thanh toán:</span>
                  <span className="text-sm font-bold text-red-600">{invoice.deadline}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-text-secondary dark:text-gray-400">Kỳ thanh toán:</span>
                  <span className="text-sm font-bold text-text-main dark:text-white">{invoice.period}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-white dark:bg-surface-dark p-8 rounded-2xl border border-border-color dark:border-gray-700 shadow-sm flex flex-col items-center text-center">
              <h3 className="text-lg font-black text-text-main dark:text-white mb-1">Thanh toán nhanh</h3>
              <p className="text-xs text-text-secondary dark:text-gray-400 mb-8 font-medium">Sử dụng App Ngân hàng quét mã VietQR</p>
              
              <div 
                className="p-4 bg-white rounded-2xl border-2 border-gray-100 dark:border-gray-700 shadow-xl mb-8 relative group cursor-zoom-in transition-all hover:scale-105 active:scale-95"
                onClick={() => setIsQrZoomed(true)}
              >
                <div 
                  className="size-48 bg-contain bg-center bg-no-repeat" 
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDoPSfm8v2dmDrkoe4hm_ldwobFjxLQC2TAM0VBEu0ho-nINNDbLo7o8W3fiRv6S5oF_Eitrn25YTvrDZWCfM5uBuUIWzq54Q1EE1OoHGhuH_b_uFMQS4g8oUPCQqlv9dkHU1zeQasF9IVJg73xc45OyWa57mzHvaEFoBnY3mG08kL1lK_8BUAaBTqE0l0pbEBLgy_OTIiLKdUM8o6bXfhAJ1bolE-LyqE1axe-gzOZ7Dbi3brxUzChihXYhzc-H6ZUiKLl0YSLSmU")' }}
                ></div>
                <div className="absolute inset-0 bg-black/5 dark:bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white/90 backdrop-blur-sm text-text-main text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-tighter">Phóng to</span>
                </div>
              </div>

              <div className="w-full bg-background-light dark:bg-gray-800/50 rounded-xl p-5 text-left mb-8 border border-border-color/50 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border-color dark:border-gray-700">
                  <div className="size-9 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200">
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6JJOLgjPbfpHz04Bk5l2fjGXXx8e5-nNsbrd8F-fHzgWkSpbgH8NY_PG7ikxpRRah1TKC_srvsQXMvphvO_9pkvqpkZX1Ihtuzng106o2NLn-Pb_tV8na71cAeYjyy4phRDE_aRQYFOjDfUIkJe_Vl4_GgyJbmazmTDIXfBh0tMZRNUT4dT8GQp-FSZgkxcrl2ZgWNqp3ZG8NecPCudVyIxPSaIU7N2us6Zb2tNYvAdSMDGsVmQawc5S3yWCLJxMIggHxP4_eJ9E" className="w-7 h-auto" alt="MB" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-text-main dark:text-white">Ngân hàng MB Bank</p>
                    <p className="text-[10px] text-text-secondary dark:text-gray-500 font-bold">Chi nhánh Thủ Đức</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center group">
                    <span className="text-[10px] font-bold text-text-secondary dark:text-gray-500 uppercase">STK:</span>
                    <span className="text-xs font-black text-text-main dark:text-white select-all group-hover:text-primary transition-colors tracking-wider">9999 8888 6666</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-text-secondary dark:text-gray-500 uppercase">Chủ TK:</span>
                    <span className="text-[10px] font-black text-text-main dark:text-white uppercase tracking-tight">Ban QL KTX DHQG</span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-dashed border-border-color/50">
                    <span className="text-[10px] font-bold text-text-secondary dark:text-gray-500 uppercase">Nội dung CK:</span>
                    <span className="text-[11px] font-black text-primary select-all bg-primary/5 px-2 py-1 rounded border border-primary/10 tracking-tight">KTX INV 2023 10 001</span>
                  </div>
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-black py-4 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95">
                <span className="material-symbols-outlined text-[22px]">check_circle</span>
                Xác nhận đã chuyển khoản
              </button>
              
              <button className="w-full mt-4 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-text-secondary dark:text-gray-300 font-bold py-3 px-4 rounded-xl border border-border-color dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-xs active:scale-95">
                <span className="material-symbols-outlined text-[20px]">download</span>
                Tải hóa đơn PDF
              </button>
            </div>

            {/* Support Card */}
            <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30 flex gap-4 items-start shadow-sm">
              <div className="size-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-primary shadow-sm">
                <span className="material-symbols-outlined text-xl">support_agent</span>
              </div>
              <div>
                <p className="text-sm font-black text-text-main dark:text-white leading-tight">Cần hỗ trợ?</p>
                <p className="text-xs text-text-secondary dark:text-gray-400 mt-1.5 mb-3 leading-relaxed font-medium">Nếu có sai sót về chỉ số điện nước hoặc phí, vui lòng báo ngay.</p>
                <Link to="/student/requests/create" className="text-xs font-black text-primary hover:underline flex items-center gap-1">
                  Gửi yêu cầu hỗ trợ <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* QR Zoom Modal */}
      {isQrZoomed && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
          onClick={() => setIsQrZoomed(false)}
        >
          <button className="absolute top-6 right-6 size-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          <div 
            className="max-w-[500px] w-full bg-white p-10 rounded-3xl animate-in zoom-in-95 duration-300 shadow-2xl shadow-primary/20"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDoPSfm8v2dmDrkoe4hm_ldwobFjxLQC2TAM0VBEu0ho-nINNDbLo7o8W3fiRv6S5oF_Eitrn25YTvrDZWCfM5uBuUIWzq54Q1EE1OoHGhuH_b_uFMQS4g8oUPCQqlv9dkHU1zeQasF9IVJg73xc45OyWa57mzHvaEFoBnY3mG08kL1lK_8BUAaBTqE0l0pbEBLgy_OTIiLKdUM8o6bXfhAJ1bolE-LyqE1axe-gzOZ7Dbi3brxUzChihXYhzc-H6ZUiKLl0YSLSmU" 
              alt="VietQR Zoomed" 
              className="w-full h-auto object-contain rounded-xl"
            />
            <div className="mt-8 text-center">
              <p className="text-text-main font-black text-xl mb-1">Mã QR Thanh toán</p>
              <p className="text-text-secondary text-sm font-medium">Quét mã để tự động điền thông tin tài khoản và nội dung</p>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default InvoiceDetail;