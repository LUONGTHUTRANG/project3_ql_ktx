import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import DashboardLayout from '../layouts/DashboardLayout';
import { STUDENT_NAV_ITEMS } from './StudentDashboard';
import { Select } from 'antd';
import Pagination from '../components/Pagination';

type TabType = 'unpaid' | 'paid' | 'overdue';

const BillsAndPayments: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('unpaid');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [semester, setSemester] = useState('hk1-2023');

  if (!user) return null;

  const mockBills = [
    { 
      id: 'EL-202310-089', 
      type: 'Tiền điện', 
      icon: 'electric_bolt', 
      iconColor: 'text-yellow-600', 
      iconBg: 'bg-yellow-50 dark:bg-yellow-900/20', 
      period: 'Tháng 10/2023', 
      amount: '450.000₫', 
      deadline: '15/11/2023', 
      status: 'new', 
      statusLabel: 'Mới',
      statusClass: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
      tab: 'unpaid'
    },
    { 
      id: 'RM-2023HK1-002', 
      type: 'Phí phòng ở', 
      icon: 'bedroom_parent', 
      iconColor: 'text-purple-600', 
      iconBg: 'bg-purple-50 dark:bg-purple-900/20', 
      period: 'Học kỳ I - 2023', 
      amount: '2.000.000₫', 
      deadline: '10/11/2023', 
      status: 'expiring', 
      statusLabel: 'Sắp hết hạn',
      statusClass: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
      tab: 'unpaid'
    },
    { 
      id: 'WT-202309-112', 
      type: 'Tiền nước', 
      icon: 'water_drop', 
      iconColor: 'text-cyan-600', 
      iconBg: 'bg-cyan-50 dark:bg-cyan-900/20', 
      period: 'Tháng 09/2023', 
      amount: '120.000₫', 
      deadline: '05/11/2023', 
      status: 'overdue', 
      statusLabel: 'Quá hạn',
      statusClass: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
      tab: 'overdue'
    },
    { 
      id: 'INT-202309-55', 
      type: 'Internet', 
      icon: 'wifi', 
      iconColor: 'text-green-600', 
      iconBg: 'bg-green-50 dark:bg-green-900/20', 
      period: 'Tháng 09/2023', 
      amount: '80.000₫', 
      deadline: '01/10/2023', 
      status: 'paid', 
      statusLabel: 'Đã thanh toán',
      statusClass: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
      tab: 'paid'
    }
  ];

  const filteredBills = mockBills.filter(bill => bill.tab === activeTab || activeTab === (bill.status === 'overdue' ? 'overdue' : activeTab));

  const handleRowClick = (id: string) => {
    navigate(`/student/bills/${id}`);
  };

  return (
    <DashboardLayout 
      navItems={STUDENT_NAV_ITEMS.map(item => ({...item, isActive: item.link === '/student/bills'}))}
      searchPlaceholder="Tìm kiếm hóa đơn..."
      headerTitle="Hóa đơn & Thanh toán"
    >
      <div className="mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black leading-tight tracking-tight text-text-main dark:text-white md:text-4xl">Hóa đơn & Thanh toán</h1>
            <p className="text-text-secondary text-base font-normal dark:text-gray-400">Quản lý các khoản phí sinh hoạt và ký túc xá của bạn</p>
          </div>
          <div className="flex items-center gap-3">
            <Select 
              className="min-w-[200px] h-11"
              value={semester}
              onChange={setSemester}
              suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">calendar_month</span>}
              options={[
                { value: 'hk1-2023', label: 'Học kỳ I - 2023' },
                { value: 'hk2-2023', label: 'Học kỳ II - 2023' },
                { value: 'all', label: 'Tất cả học kỳ' },
              ]}
            />
          </div>
        </div>

        {/* Debt Summary Card */}
        <div className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm border border-border-color dark:bg-surface-dark dark:border-gray-700">
          <div className="absolute right-0 top-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-primary/5 blur-3xl"></div>
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-text-secondary dark:text-gray-400">Tổng dư nợ hiện tại</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text-main dark:text-white">2.450.000₫</span>
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30">Cần thanh toán</span>
              </div>
            </div>
            <button className="flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-hover active:scale-[0.98]">
              <span className="material-symbols-outlined text-[20px]">payments</span>
              Thanh toán tất cả
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-border-color dark:border-gray-800">
          <nav className="-mb-px flex gap-8">
            <button 
              onClick={() => setActiveTab('unpaid')}
              className={`group flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-bold transition-all ${
                activeTab === 'unpaid' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main hover:border-gray-300 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <span>Chưa thanh toán</span>
              <span className={`ml-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${activeTab === 'unpaid' ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-text-secondary'}`}>2</span>
            </button>
            <button 
              onClick={() => setActiveTab('paid')}
              className={`group flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-bold transition-all ${
                activeTab === 'paid' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-main hover:border-gray-300 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <span>Đã thanh toán</span>
            </button>
            <button 
              onClick={() => setActiveTab('overdue')}
              className={`group flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-bold transition-all ${
                activeTab === 'overdue' ? 'border-primary text-red-600' : 'border-transparent text-text-secondary hover:text-text-main hover:border-gray-300 dark:text-gray-400 dark:hover:text-white'
              }`}
            >
              <span>Quá hạn</span>
              <span className="ml-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">1</span>
            </button>
          </nav>
        </div>

        {/* Table Container */}
        <div className="overflow-hidden rounded-xl border border-border-color bg-white shadow-sm dark:border-gray-700 dark:bg-surface-dark">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="bg-gray-50 text-text-secondary dark:bg-gray-800/50 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs" scope="col">Loại hóa đơn</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs" scope="col">Số hóa đơn</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs" scope="col">Kỳ/Tháng</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs" scope="col">Tổng tiền</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs" scope="col">Hạn thanh toán</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs" scope="col">Trạng thái</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right" scope="col">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-surface-dark">
                {mockBills
                  .filter(bill => {
                    if (activeTab === 'unpaid') return bill.tab === 'unpaid';
                    if (activeTab === 'paid') return bill.tab === 'paid';
                    if (activeTab === 'overdue') return bill.tab === 'overdue';
                    return true;
                  })
                  .map((bill) => (
                    <tr key={bill.id} onClick={() => handleRowClick(bill.id)} className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex size-10 items-center justify-center rounded-full ${bill.iconBg} ${bill.iconColor}`}>
                            <span className="material-symbols-outlined text-xl">{bill.icon}</span>
                          </div>
                          <span className="font-bold text-text-main dark:text-white">{bill.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-text-secondary dark:text-gray-400">#{bill.id}</td>
                      <td className="px-6 py-4 text-text-main dark:text-white">{bill.period}</td>
                      <td className={`px-6 py-4 font-bold ${bill.status === 'overdue' ? 'text-red-600' : bill.status === 'paid' ? 'text-green-600' : 'text-primary'}`}>
                        {bill.amount}
                      </td>
                      <td className={`px-6 py-4 font-medium ${bill.status === 'overdue' ? 'text-red-600' : bill.status === 'expiring' ? 'text-orange-600' : 'text-text-main dark:text-white'}`}>
                        {bill.deadline}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold border ${bill.statusClass} border-current/10`}>
                          {bill.statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {bill.status === 'paid' ? (
                            <button className="rounded-lg border border-border-color bg-white px-4 py-2 text-xs font-bold text-text-main transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 shadow-sm">
                              Xem biên lai
                            </button>
                          ) : (
                            <button className={`rounded-lg px-4 py-2 text-xs font-bold text-white transition-all shadow-sm active:scale-95 ${bill.status === 'overdue' ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-hover'}`}>
                              Thanh toán {bill.status === 'overdue' ? 'ngay' : ''}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                ))}
                {mockBills.filter(bill => {
                  if (activeTab === 'unpaid') return bill.tab === 'unpaid';
                  if (activeTab === 'paid') return bill.tab === 'paid';
                  if (activeTab === 'overdue') return bill.tab === 'overdue';
                  return true;
                }).length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-text-secondary dark:text-gray-500">
                      Không có hóa đơn nào trong mục này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination 
            currentPage={currentPage}
            totalPages={1}
            totalItems={filteredBills.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>

        {/* Note / Support */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-text-secondary dark:text-gray-500 text-center">
            Bạn gặp vấn đề về hóa đơn? <a href="#/student/requests/create" className="text-primary font-bold hover:underline">Gửi yêu cầu hỗ trợ ngay</a>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BillsAndPayments;