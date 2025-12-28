import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { NavItem } from '../types';

export const MANAGER_NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan Tòa A1', icon: 'dashboard', link: '/manager' },
  { label: 'Quản lý Phòng', icon: 'meeting_room', link: '/manager/rooms', isActive: true },
  { label: 'Quản lý Sinh viên', icon: 'school', link: '/manager/students' },
  { label: 'Yêu cầu hỗ trợ', icon: 'support_agent', link: '/manager/requests' },
  { label: 'Quản lý Thông báo', icon: 'notifications', link: '/manager/notifications' },
];

const ManagerDashboard: React.FC = () => {
  // Fix: Initialize useNavigate hook
  const navigate = useNavigate();

  return (
    <>
      <DashboardLayout
        navItems={MANAGER_NAV_ITEMS.map(item => ({...item, isActive: item.link === '/manager'}))}
        searchPlaceholder="Tìm sinh viên, phòng tại Tòa A1..."
        headerTitle="Tòa nhà A1"
        headerSubtitle="Khu ký túc xá Đại học Quốc gia"
        sidebarTitle="A1 Manager"
      >
        <div className="flex flex-col gap-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                  <span className="material-symbols-outlined">groups</span>
                </div>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Tổng sinh viên</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">456</h3>
                <p className="text-xs text-green-600 font-medium mt-1">+12 sinh viên mới tháng này</p>
              </div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl">
                  <span className="material-symbols-outlined">door_front</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">Tổng: 120</span>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Phòng còn trống</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">8</h3>
                <p className="text-xs text-slate-400 mt-1">Tỷ lệ lấp đầy: 93%</p>
              </div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border-l-4 border-l-orange-500 border-y border-r border-slate-200 dark:border-slate-700 flex flex-col gap-4 hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute right-0 top-0 p-16 bg-orange-500/5 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
              <div className="flex items-center justify-between z-10">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                  <span className="material-symbols-outlined">pending_actions</span>
                </div>
                <span className="flex size-3 bg-orange-500 rounded-full animate-pulse"></span>
              </div>
              <div className="z-10">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Yêu cầu cần xử lý</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">5</h3>
                <p className="text-xs text-orange-600 font-medium mt-1">2 yêu cầu khẩn cấp</p>
              </div>
            </div>
            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                  <span className="material-symbols-outlined">handyman</span>
                </div>
              </div>
              <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Bảo trì đang thực hiện</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">2</h3>
                <p className="text-xs text-slate-400 mt-1">Dự kiến xong: 16:00 hôm nay</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Notifications Column */}
            <div className="lg:col-span-2 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">campaign</span>
                  Thông báo quan trọng Tòa A1
                </h3>
                <button className="text-primary text-sm font-medium hover:underline">Tất cả thông báo</button>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                  <div className="p-2 bg-white dark:bg-red-900/20 text-red-500 rounded-lg shrink-0">
                    <span className="material-symbols-outlined">notifications_active</span>
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2 items-center mb-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Kiểm tra PCCC định kỳ</h4>
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-full tracking-wide">Quan trọng</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Ban quản lý sẽ tiến hành kiểm tra hệ thống báo cháy tại các phòng tầng 3 đến tầng 5 vào sáng mai (8:00 - 11:00).</p>
                    <p className="text-xs text-slate-500 mt-2">Đăng 30 phút trước bởi Admin</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent">
                  <div className="p-2 bg-white dark:bg-slate-700 text-blue-500 rounded-lg shrink-0 shadow-sm">
                    <span className="material-symbols-outlined">water_drop</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Lịch tạm ngừng cấp nước</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Bảo trì đường ống nước khu vực vệ sinh chung tầng 1. Thời gian: 14:00 - 16:00 ngày 25/10.</p>
                    <p className="text-xs text-slate-500 mt-2">Đăng hôm qua</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent">
                  <div className="p-2 bg-white dark:bg-slate-700 text-emerald-500 rounded-lg shrink-0 shadow-sm">
                    <span className="material-symbols-outlined">cleaning_services</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Đánh giá vệ sinh phòng ở</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300">Đã cập nhật kết quả đánh giá vệ sinh phòng ở tuần 3 tháng 10. Các phòng chưa đạt vui lòng khắc phục.</p>
                    <p className="text-xs text-slate-500 mt-2">Đăng 2 ngày trước</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Quick Access Column */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Truy cập nhanh</h3>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => navigate('/manager/rooms')}
                  className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors text-left group"
                >
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm text-primary group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined">meeting_room</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Quản lý Phòng</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Xem danh sách, tình trạng phòng</p>
                  </div>
                  <span className="material-symbols-outlined text-primary ml-auto" style={{ fontSize: '20px' }}>arrow_forward</span>
                </button>
                <button className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left group">
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm text-blue-500 group-hover:text-blue-600">
                    <span className="material-symbols-outlined">school</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Quản lý Sinh viên</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Tra cứu thông tin, hồ sơ</p>
                  </div>
                </button>
                <button className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left group">
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm text-orange-500 group-hover:text-orange-600">
                    <span className="material-symbols-outlined">support_agent</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Xử lý Yêu cầu</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Báo hỏng, hỗ trợ sinh viên</p>
                  </div>
                </button>
                <button 
                  onClick={() => navigate('/notifications/create')}
                  className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left group"
                >
                  <div className="bg-white dark:bg-slate-700 p-2 rounded-lg shadow-sm text-purple-500 group-hover:text-purple-600">
                    <span className="material-symbols-outlined">add_alert</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Tạo thông báo mới</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Gửi tin đến sinh viên tòa A1</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Yêu cầu hỗ trợ mới nhất (Tòa A1)</h3>
              <button 
                onClick={() => navigate('/student/requests')}
                className="text-sm font-medium text-slate-500 hover:text-primary transition-colors flex items-center gap-1"
              >
                Xem tất cả <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold">
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Sinh viên</th>
                    <th className="px-6 py-4">Phòng</th>
                    <th className="px-6 py-4">Vấn đề</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Ngày tạo</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">#RQ-2034</td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <div 
                          className="size-6 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden bg-cover" 
                          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC2BBuftzQZKGz6FlN0CKR-Lrf0OCkdjRiQNmv7sdJ2vIxrv7-2BkyVoHZbnpWt7aPbC_Ej1W-G_f4bclWkuQcegUBEOya3gz1tgZ9DIL1NLrLiX1HT0N2iCGcEOfzBzcYHPrP7A8iLtPABgeGaWOml1EJcfYtV2SIGNoNcHQwiCzVSH1Vd623xtFsZ1abcsBq9WJKbz_40jxSrpJKlXlyruPhMdloOcRjuUQhu-el4fqYZ0TiQkADJCHTaShy0_97AOV2HVTk36M8")' }}
                        ></div>
                        Nguyễn Văn A
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">A1-304</td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-500" style={{ fontSize: '18px' }}>plumbing</span>
                      Hỏng vòi nước
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Đang chờ
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">10:30 AM, Hôm nay</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">edit_square</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">#RQ-2033</td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <div 
                          className="size-6 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden bg-cover" 
                          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD8hdKzQBvoaf3IlAHLdObK1s_0yMAohpnir7vxdyXTt_zdryxU64cy1IgSYLPJOxmrcQG11IPijChwGyc_mOsbjcpgexi0jaCkl3HcBospMgNcvoeYrTo2fIKqRp2-NSmrxC2uQEywpPnMc4FBuVYa--3vpty8RpEXmQ9HPYpVmfc99LXoVrpmx-d_jmu4tSe_wu7A6OuiFKst7ob85m8-gYSCjBgz_Ba6fCtOa88zfL1k4dOvYAtvOEneVq-HrQjTBxpZvn2xykU")' }}
                        ></div>
                        Trần Thị B
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">A1-102</td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-orange-500" style={{ fontSize: '18px' }}>bolt</span>
                      Mất điện
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Đang xử lý
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">09:15 AM, Hôm nay</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">edit_square</span>
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-white">#RQ-2030</td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <div 
                          className="size-6 rounded-full bg-slate-200 dark:bg-slate-600 overflow-hidden bg-cover" 
                          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDm0J2njZ4cpLGpYEBA5_Cs51NeIei3jf41X6aqDAt6aGTTOQ0OU_BexpjUGfAJZaxawgG30P5umlrD0nnfH2rZJH_eGEDcsABjdXjgyuhb2BpWiVxfsjEs6g0MlVd_RMRnEX6dyTKgJhGPa1-T_KsRnGaQBPCmJH-4M3enve4hAr_G4AZ4NLKa2AXkO3D8DxfYDuBe48olgPMWduiyDhG_6H7PVO9ikM-rTvzCMi_mhXbeO-7fQiQNLxxP3yrrcvk7MowS9zwccUc")' }}
                        ></div>
                        Lê Văn C
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">A1-405</td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-500" style={{ fontSize: '18px' }}>wifi_off</span>
                      Mất mạng Wifi
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Hoàn thành
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">Hôm qua</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">edit_square</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="h-10"></div>
        </div>

        {/* Floating Action Button */}
        <button 
          onClick={() => navigate('/student/requests/create')}
          className="fixed bottom-8 right-8 z-30 flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-2xl px-5 py-4 shadow-lg shadow-primary/20 transition-all transform hover:scale-105 active:scale-95"
        >
          <span className="material-symbols-outlined">add</span>
          <span className="font-bold pr-1">Ghi nhận sự cố</span>
        </button>
      </DashboardLayout>
    </>
  );
};

export default ManagerDashboard;