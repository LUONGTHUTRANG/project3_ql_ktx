import React, { useContext, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { MANAGER_NAV_ITEMS } from './ManagerDashboard';
import { AuthContext } from '../App';
import Pagination from '../components/Pagination';

const RoomDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  if (!user) return null;

  // Mock student data
  const students = [
    { name: 'Nguyễn Văn An', mssv: '20215001', class: 'CNTT K65', phone: '0987 654 321', email: 'an.nv@sms.edu', joinDate: '15/08/2023', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRNrzWxoWkpmBbsiWz3SIvEha1B1QP46db-M-tLriTbW9OnVV8UswJ6hRAHsbKOYHTnMqjMNvDvd1XaMJEWeX_P7yOef9SGHjbJ-R7T9_fnBhiJyVRmp8neir6NyyeGuUMM79DDdKt_zDSAhvfq6095Jie6OHWij-oDjfsRnz9bt_U9wKQ738NXEo8vBiq24vR_704LHUYNKKq15K5xf14Z3qA4IIFaBZagNahZVlozsoBL7g8zz7VvI4MoLe70YlkNg7CeF5CYp4' },
    { name: 'Trần Minh Bảo', mssv: '20204123', class: 'Cơ khí K64', phone: '0912 345 678', email: 'bao.tm@sms.edu', joinDate: '01/09/2023', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5owfB26z_zPzsWBzXTWfY0IPAo7dN8VvxAwke4DU45MNzXPenR6MKb_m6wQeSygakE0zik8kCbr7kLnRJg_nU61F620trwyvxk2psap0B2Z9bYxpTE6U06zoAMvHznXEoZwCfb1T3-kgPzYEDfzjDnxRscQd7eq26Am1rY5X3WkflW9I7to_EuMDym2hFd18XdpIdgXFu_Yl1dGPfjqkea5Q1BIfwNlJw3Q-N2l1kcVV-1tJEOTEBhCtHYycC6iILm56xKrXcv_g' },
    { name: 'Lê Văn Cường', mssv: '20226789', class: 'Điện tử K66', phone: '0909 009 999', email: 'cuong.lv@sms.edu', joinDate: '10/09/2023', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgm9XiIM0T2GSj2uA9zZ_wuW9RCHkNFHc2bP3D1-pi36Gfrokca0zpCuleiXQGKvOBvcSXpMunnOg3A37rtOvVvV3hkXqJuE_nXkZ5RgJUGY8Ml3OgKFoz6B05Qq3Lq_R5XAaZ8fpO5FigPddxRBbOLt1pEAHWwDrfR6R9g2peS9H3gJLx6w31l7tnySeNLP9mvKMgcL97RgOejUwZqTRaPckxR2sIUW_sFvVaqFAZu4qzCv1wvQbzc_3RL-j2ojcuSzMwTU0y4rY' },
    { name: 'Phạm Đức Duy', mssv: '20218890', class: 'Kinh tế K65', phone: '0933 444 555', email: 'duy.pd@sms.edu', joinDate: '20/09/2023', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSazvqRQ6vjNqSFyQTcjU2MypT_ZesnS9GyeHSiljnj5AIKSVC4qUDetpREOibH5tDPHlezWGi4qXSFhskdJG1c2LnCTbKzChzY7oNI8ALoxxCUUwn2nTofALtb_CcGOsQEHXuCdRWhY7rooAM2zKj7d7dAVbfhVHIlXIC_SJRGzs9jZAti1HsaqtFYnWVGewEb-krzozFOggSmF2wMHJlmZMgiijRVrQEv6FoAbRb7KLBulolUeX4MzIR2xZqDPfv1wh0vIvEZ98' },
  ];

  const totalItems = students.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <DashboardLayout 
      navItems={MANAGER_NAV_ITEMS.map(item => ({...item, isActive: item.link === '/manager/rooms'}))}
      searchPlaceholder="Tìm sinh viên trong phòng..."
      headerTitle="Thông tin Phòng"
      sidebarTitle="A1 Manager"
    >
      <div className="flex flex-col max-w-[1200px] mx-auto gap-8 animate-in fade-in duration-500">
        
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap gap-2 px-1 text-sm font-medium">
          <Link className="text-text-secondary dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-1" to="/manager">
            <span className="material-symbols-outlined text-[18px]">dashboard</span>
            Trang chủ
          </Link>
          <span className="text-text-secondary dark:text-gray-600">/</span>
          <Link className="text-text-secondary dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-1" to="/manager/rooms">
            <span className="material-symbols-outlined text-[18px]">meeting_room</span>
            Quản lý Phòng
          </Link>
          <span className="text-text-secondary dark:text-gray-600">/</span>
          <span className="text-text-main dark:text-white font-bold">Phòng {id}</span>
        </nav>

        {/* Page Header & Actions */}
        <div className="flex flex-col lg:flex-row justify-between gap-6 px-1 items-start lg:items-end border-b border-border-color dark:border-gray-700 pb-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-text-main dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">Phòng {id} - Tòa A1</h1>
            <div className="flex flex-wrap items-center gap-4 text-text-secondary dark:text-gray-400 text-sm md:text-base font-medium">
              <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[20px] text-primary">layers</span> Khu Nam - Tầng 1</span>
              <span className="size-1.5 rounded-full bg-border-color"></span>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs font-black border border-green-100 dark:border-green-800 uppercase tracking-widest">
                <span className="size-2 rounded-full bg-green-500 animate-pulse"></span>
                Còn trống 2 chỗ
              </span>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button className="flex items-center justify-center gap-2 rounded-xl h-11 px-5 bg-white dark:bg-gray-800 border border-border-color dark:border-gray-700 text-text-main dark:text-white text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              Cấu hình
            </button>
            <button className="flex items-center justify-center gap-2 rounded-xl h-11 px-5 bg-white dark:bg-gray-800 border border-border-color dark:border-gray-700 text-text-main dark:text-white text-sm font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Chỉnh sửa
            </button>
            <button className="flex items-center justify-center gap-2 rounded-xl h-11 px-6 bg-primary text-white text-sm font-black shadow-lg shadow-primary/20 hover:bg-primary-hover transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
              Thêm sinh viên
            </button>
          </div>
        </div>

        {/* Info Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Overview */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-sm p-6 flex flex-col gap-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 border-b border-border-color dark:border-gray-700 pb-4">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-primary">
                <span className="material-symbols-outlined font-bold">info</span>
              </div>
              <h3 className="text-lg font-black text-text-main dark:text-white tracking-tight">Thông tin chung</h3>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-text-secondary dark:text-gray-500 font-black uppercase tracking-widest">Diện tích</span>
                <div className="flex items-center gap-2 text-text-main dark:text-white font-bold text-lg">
                  <span className="material-symbols-outlined text-text-secondary/50 text-xl">square_foot</span>
                  25m²
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-text-secondary dark:text-gray-500 font-black uppercase tracking-widest">Sức chứa</span>
                <div className="flex items-center gap-2 text-text-main dark:text-white font-bold text-lg">
                  <span className="material-symbols-outlined text-text-secondary/50 text-xl">group</span>
                  4/6
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-text-secondary dark:text-gray-500 font-black uppercase tracking-widest">Tầng</span>
                <div className="flex items-center gap-2 text-text-main dark:text-white font-bold text-lg">
                  <span className="material-symbols-outlined text-text-secondary/50 text-xl">layers</span>
                  1
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-text-secondary dark:text-gray-500 font-black uppercase tracking-widest">Loại phòng</span>
                <div className="flex items-center gap-2 text-text-main dark:text-white font-bold text-lg">
                  <span className="material-symbols-outlined text-text-secondary/50 text-xl">wc</span>
                  Nam
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Costs */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-sm p-6 flex flex-col gap-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 border-b border-border-color dark:border-gray-700 pb-4">
              <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-xl text-green-600">
                <span className="material-symbols-outlined font-bold">payments</span>
              </div>
              <h3 className="text-lg font-black text-text-main dark:text-white tracking-tight">Chi phí hàng tháng</h3>
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400">
                  <span className="material-symbols-outlined text-[20px]">bedroom_parent</span>
                  <span className="text-sm font-bold">Giá phòng</span>
                </div>
                <span className="text-text-main dark:text-white font-black text-base">1.200.000 đ</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400">
                  <span className="material-symbols-outlined text-[20px]">bolt</span>
                  <span className="text-sm font-bold">Điện (Kwh)</span>
                </div>
                <span className="text-text-main dark:text-white font-black text-base">3.500 đ</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400">
                  <span className="material-symbols-outlined text-[20px]">water_drop</span>
                  <span className="text-sm font-bold">Nước (m³)</span>
                </div>
                <span className="text-text-main dark:text-white font-black text-base">15.000 đ</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-dashed border-border-color dark:border-gray-700">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-[20px]">wifi</span>
                  <span className="text-sm font-black">Xem biểu giá dịch vụ</span>
                </div>
                <span className="material-symbols-outlined text-primary text-xl">arrow_right_alt</span>
              </div>
            </div>
          </div>

          {/* Card 3: Facilities */}
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-sm p-6 flex flex-col gap-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 border-b border-border-color dark:border-gray-700 pb-4">
              <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl text-purple-600">
                <span className="material-symbols-outlined font-bold">chair</span>
              </div>
              <h3 className="text-lg font-black text-text-main dark:text-white tracking-tight">Trang thiết bị</h3>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-border-color/50 dark:border-gray-700 group/item hover:border-primary/50 transition-colors">
                <span className="material-symbols-outlined text-text-secondary text-[18px] group-hover/item:text-primary transition-colors">ac_unit</span>
                <span className="text-xs font-bold text-text-main dark:text-gray-300">1 Điều hòa</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-border-color/50 dark:border-gray-700 group/item hover:border-primary/50 transition-colors">
                <span className="material-symbols-outlined text-text-secondary text-[18px] group-hover/item:text-primary transition-colors">bed</span>
                <span className="text-xs font-bold text-text-main dark:text-gray-300">3 Giường tầng</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-border-color/50 dark:border-gray-700 group/item hover:border-primary/50 transition-colors">
                <span className="material-symbols-outlined text-text-secondary text-[18px] group-hover/item:text-primary transition-colors">table_restaurant</span>
                <span className="text-xs font-bold text-text-main dark:text-gray-300">6 Bàn học</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-border-color/50 dark:border-gray-700 group/item hover:border-primary/50 transition-colors">
                <span className="material-symbols-outlined text-text-secondary text-[18px] group-hover/item:text-primary transition-colors">kitchen</span>
                <span className="text-xs font-bold text-text-main dark:text-gray-300">1 Tủ lạnh</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-border-color/50 dark:border-gray-700 group/item hover:border-primary/50 transition-colors">
                <span className="material-symbols-outlined text-text-secondary text-[18px] group-hover/item:text-primary transition-colors">router</span>
                <span className="text-xs font-bold text-text-main dark:text-gray-300">Wi-Fi 6</span>
              </div>
            </div>
            <button className="mt-auto text-xs font-black text-text-secondary dark:text-gray-500 hover:text-primary transition-colors uppercase tracking-widest text-center">
              Quản lý tài sản
            </button>
          </div>
        </div>

        {/* Student List Section */}
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
            <div className="flex flex-col gap-1">
              <h2 className="text-text-main dark:text-white tracking-tight text-xl font-black">Danh sách sinh viên hiện tại ({students.length})</h2>
              <p className="text-sm text-text-secondary dark:text-gray-400">Theo dõi thông tin và tình trạng cư trú của sinh viên</p>
            </div>
            <div className="relative min-w-[240px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
                <span className="material-symbols-outlined text-[20px]">search</span>
              </span>
              <input 
                className="w-full h-11 pl-10 pr-4 py-2 text-sm font-bold border-none bg-white dark:bg-surface-dark rounded-xl shadow-sm ring-1 ring-inset ring-border-color dark:ring-gray-700 focus:ring-2 focus:ring-primary transition-all text-text-main dark:text-white" 
                placeholder="Tìm tên, MSSV..." 
                type="text"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-border-color dark:border-gray-700">
                    <th className="py-5 px-6 text-[11px] font-black uppercase tracking-widest text-text-secondary dark:text-gray-400">Sinh viên</th>
                    <th className="py-5 px-6 text-[11px] font-black uppercase tracking-widest text-text-secondary dark:text-gray-400 text-center">MSSV</th>
                    <th className="py-5 px-6 text-[11px] font-black uppercase tracking-widest text-text-secondary dark:text-gray-400">Thông tin liên hệ</th>
                    <th className="py-5 px-6 text-[11px] font-black uppercase tracking-widest text-text-secondary dark:text-gray-400">Ngày vào ở</th>
                    <th className="py-5 px-6 text-[11px] font-black uppercase tracking-widest text-text-secondary dark:text-gray-400 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color dark:divide-gray-700">
                  {students.map((student, index) => (
                    <tr key={index} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-5 px-6">
                        <div className="flex items-center gap-4">
                          <div 
                            className="size-11 rounded-full bg-cover bg-center border-2 border-white dark:border-gray-700 shadow-sm shrink-0" 
                            style={{ backgroundImage: `url('${student.avatar}')` }}
                          ></div>
                          <div className="flex flex-col">
                            <span className="font-black text-text-main dark:text-white group-hover:text-primary transition-colors">{student.name}</span>
                            <span className="text-[11px] font-bold text-text-secondary dark:text-gray-500 uppercase tracking-tighter">{student.class}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 text-center">
                        <span className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-black text-text-main dark:text-gray-300 border border-border-color/50 dark:border-gray-700">
                          {student.mssv}
                        </span>
                      </td>
                      <td className="py-5 px-6">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-text-main dark:text-gray-400">
                            <span className="material-symbols-outlined text-[16px] text-text-secondary">call</span>
                            {student.phone}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold text-text-main dark:text-gray-400">
                            <span className="material-symbols-outlined text-[16px] text-text-secondary">mail</span>
                            {student.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6">
                        <span className="text-sm font-bold text-text-main dark:text-white">{student.joinDate}</span>
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                          <button className="size-9 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-primary/10 hover:text-primary text-text-secondary dark:text-gray-400 transition-all" title="Xem hồ sơ">
                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                          </button>
                          <button className="size-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-500 hover:text-white text-red-500 transition-all" title="Rời phòng">
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </div>

        <div className="h-12"></div>
      </div>
    </DashboardLayout>
  );
};

export default RoomDetail;