import React, { useEffect, useState, useContext } from 'react';
import { Select, Spin, message, Modal } from 'antd';
import Pagination from '../components/Pagination';
import { getUtilityInvoiceCycles, getUtilityInvoicesByCycle, publishUtilityInvoiceCycle } from '../api/utilityInvoiceApi';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

interface Invoice {
  id: number;
  invoice_code: string;
  invoice_id: number;
  cycle_id: number;
  amount: number;
  status: string;
  invoice_status?: string;
  electricity_old: number;
  electricity_new: number;
  water_old: number;
  water_new: number;
  room_id: number;
  room_number?: string;
  building_name?: string;
  mssv?: string;
  full_name?: string;
  floor?: number;
  created_at?: string;
}

interface InvoiceRow {
  key: string;
  id: number;
  invoiceCode: string;
  room: string;
  building: string;
  electricity: string;
  water: string;
  amount: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  original: Invoice;
}

interface Cycle {
  id: number;
  month: number;
  year: number;
  status: string;
}

const UtilityFeeInvoiceTab: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<number | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [unrecordedCount, setUnrecordedCount] = useState(0);

  // Load cycles function (extracted for reuse)
  const loadCycles = async () => {
    try {
      const data = await getUtilityInvoiceCycles();
      const sortedCycles = (data || []).sort((a: Cycle, b: Cycle) => {
        const dateA = new Date(a.year, a.month - 1);
        const dateB = new Date(b.year, b.month - 1);
        return dateB.getTime() - dateA.getTime();
      });
      setCycles(sortedCycles);
      
      // Set default to latest cycle
      if (sortedCycles.length > 0) {
        setSelectedCycleId(sortedCycles[0].id);
      }
    } catch (err) {
      console.error('Failed to load cycles:', err);
      message.error('Không thể tải danh sách kỳ');
    }
  };

  // Load cycles on mount
  useEffect(() => {
    loadCycles();
  }, []);

  // Load invoices when cycle changes
  useEffect(() => {
    if (!selectedCycleId) return;

    const loadInvoices = async () => {
      try {
        setLoading(true);
        // Get building ID from manager's managed_building_id
        const buildingId = user?.managed_building_id || user?.building_id;
        const data = await getUtilityInvoicesByCycle(selectedCycleId, buildingId);
        setInvoices(data || []);
        setCurrentPage(1);
      } catch (err) {
        console.error('Failed to load invoices:', err);
        message.error('Không thể tải danh sách hóa đơn điện nước');
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [selectedCycleId, user]);

  // Calculate unrecorded count (rooms where electricity_new equals electricity_old or not properly recorded)
  useEffect(() => {
    const count = invoices.filter(
      (inv) => inv.electricity_new === inv.electricity_old || inv.water_new === inv.water_old
    ).length;
    setUnrecordedCount(count);
  }, [invoices]);

  const handleRecordMeters = () => {
    navigate(`/record-utility-meters`);
  };

  const handleEditMeters = (roomId: number, cycleId: number) => {
    navigate(`/record-utility-meters?mode=edit&roomId=${roomId}&cycleId=${cycleId}`);
  };

  const handlePublishCycle = async () => {
    if (unrecordedCount > 0) {
      message.error('Vui lòng ghi chỉ số cho tất cả các phòng trước khi phát hành');
      return;
    }

    Modal.confirm({
      title: 'Xác nhận phát hành',
      content: `Bạn có chắc chắn muốn phát hành hóa đơn điện nước cho tháng ${cycles.find(c => c.id === selectedCycleId)?.month}/${cycles.find(c => c.id === selectedCycleId)?.year}?`,
      okText: 'Phát hành',
      cancelText: 'Hủy',
      okButtonProps: { style: { background: '#059669', borderColor: '#059669' } },
      onOk: async () => {
        try {
          setPublishLoading(true);
          await publishUtilityInvoiceCycle(selectedCycleId!);
          message.success('Phát hành hóa đơn thành công');
          // Reload cycles to update status display
          await loadCycles();
          // Reload invoices
          const buildingId = user?.managed_building_id || user?.building_id;
          const data = await getUtilityInvoicesByCycle(selectedCycleId!, buildingId);
          setInvoices(data || []);
        } catch (err: any) {
          console.error('Failed to publish cycle:', err);
          message.error(err.response?.data?.message || 'Không thể phát hành hóa đơn');
        } finally {
          setPublishLoading(false);
        }
      },
    });
  };
  // Map invoice to row display
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'DRAFT':
        return 'Nháp';
      case 'READY':
        return 'Sẵn sàng';
      case 'PUBLISHED':
        return 'Đã phát hành';
      default:
        return status;
    }
  };

  const mapInvoiceToRow = (inv: Invoice): InvoiceRow => {
    // If status is PUBLISHED, use the status from the invoices table (invoice_status)
    // Otherwise use the status from utility_invoices table
    const status = inv.status === 'PUBLISHED' && inv.invoice_status 
      ? inv.invoice_status 
      : inv.status || 'DRAFT';
    
    let statusLabel = 'Chưa xác định';
    let statusColor = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';

    if (status === 'PAID') {
      statusLabel = 'Đã thanh toán';
      statusColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    } else if (status === 'OVERDUE') {
      statusLabel = 'Đã quá hạn';
      statusColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    } else if (status === 'PUBLISHED') {
      statusLabel = 'Chưa thanh toán';
      statusColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    } else if (status === 'DRAFT') {
      statusLabel = 'Nháp';
      statusColor = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    } else if (status === 'CANCELLED') {
      statusLabel = 'Đã hủy';
      statusColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }

    const electricity = `${(inv.electricity_new - inv.electricity_old).toFixed(2)} kWh`;
    const water = `${(inv.water_new - inv.water_old).toFixed(2)} m³`;
    const amount = inv.amount ? `${Number(inv.amount).toLocaleString('vi-VN')}₫` : '0₫';

    return {
      key: String(inv.id),
      id: inv.id,
      invoiceCode: inv.invoice_code || `UTIL-${inv.id}`,
      room: inv.room_number || `Phòng ${inv.room_id}`,
      building: inv.building_name || '-',
      electricity,
      water,
      amount,
      status: status,
      statusLabel,
      statusColor,
      original: inv,
    };
  };

  const allMappedInvoices = invoices.map(mapInvoiceToRow);
  const totalPages = Math.ceil(allMappedInvoices.length / itemsPerPage);
  const paginatedInvoices = allMappedInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Cycle Filter and Action Buttons */}
      <div className="flex flex-col lg:flex-row gap-4 lg:items-end lg:justify-between">
        <div className="flex-1 min-w-[350px]">
          <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">Tháng ở</label>
          <Select
            placeholder="Chọn tháng ở..."
            value={selectedCycleId}
            onChange={(value) => {
              setSelectedCycleId(value);
              setCurrentPage(1);
            }}
            className="w-full h-11"
            options={cycles.map((cycle) => ({
              value: cycle.id,
              label: `Tháng ${cycle.month}/${cycle.year} - ${getStatusLabel(cycle.status)}`,
            }))}
          />
        </div>

        <div className="flex flex-col w-full">
          <label className="block text-sm font-medium text-text-secondary dark:text-gray-400 mb-2">Hành động</label>
          <div className="flex gap-4 w-full">
            {/* Record Meters Button - 1 part */}
            <button
              onClick={handleRecordMeters}
              disabled={loading || !selectedCycleId || (selectedCycleId && cycles.find(c => c.id === selectedCycleId)?.status === 'PUBLISHED')}
              className={`flex-1 h-11 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:pointer-events-none transition-colors font-medium text-sm`}
            >
              <span className="material-symbols-outlined">edit</span>
              Ghi chỉ số
            </button>

            {/* Publish Button - 1 part */}
            <button
              onClick={handlePublishCycle}
              disabled={loading || publishLoading || !selectedCycleId || unrecordedCount > 0 || (selectedCycleId && cycles.find(c => c.id === selectedCycleId)?.status === 'PUBLISHED')}
              className="flex-1 flex h-11 items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 disabled:pointer-events-none transition-colors font-medium text-sm"
            >
              <span className="material-symbols-outlined">publish</span>
              {publishLoading ? 'Đang phát hành...' : 'Phát hành'}
            </button>
          </div>
        </div>
      </div>

      {/* Unrecorded Count / Completion Block */}
      {unrecordedCount > 0 ? (
        <div className="flex-[2] flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-2">
          <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">warning</span>
          <div className="flex flex-col">
            <span className="text-xs text-amber-700 dark:text-amber-300">Chưa ghi chỉ số</span>
            <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{unrecordedCount}</span>
          </div>
        </div>
      ) : selectedCycleId && cycles.find(c => c.id === selectedCycleId)?.status === 'PUBLISHED' ? (
        <div className="flex-[2] flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
          <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">check_circle</span>
          <div className="flex flex-col">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Tất cả hóa đơn điện nước cho tháng {selectedCycleId && cycles.find(c => c.id === selectedCycleId) ? `${cycles.find(c => c.id === selectedCycleId)?.month}/${cycles.find(c => c.id === selectedCycleId)?.year}` : ''} đã được phát hành
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-[2] flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-4 py-2">
          <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">check_circle</span>
          <div className="flex flex-col">
            <span className="text-sm text-emerald-700 dark:text-emerald-300">
              Tất cả các phòng đã được ghi chỉ số, nhấn nút phát hành để xác nhận hoàn thành hóa đơn điện nước cho tháng {selectedCycleId && cycles.find(c => c.id === selectedCycleId) ? `${cycles.find(c => c.id === selectedCycleId)?.month}/${cycles.find(c => c.id === selectedCycleId)?.year}` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Invoices Table Section */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spin size="large" tip="Đang tải dữ liệu..." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-color dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">STT</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Mã hóa đơn</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Phòng</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Tòa nhà</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Điện</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Nước</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Số tiền</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-gray-400">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-color dark:divide-gray-700">
                  {paginatedInvoices.map((invoice, index) => (
                    <tr 
                      key={invoice.key}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary dark:text-gray-400">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-text-main dark:text-white">{invoice.invoiceCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-secondary dark:text-gray-300">{invoice.room}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-secondary dark:text-gray-300">{invoice.building}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-secondary dark:text-gray-300">{invoice.electricity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-text-secondary dark:text-gray-300">{invoice.water}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{invoice.amount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${invoice.statusColor}`}>
                          {invoice.statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleEditMeters(invoice.original.room_id, selectedCycleId!)}
                          disabled={loading || !selectedCycleId || (selectedCycleId && cycles.find(c => c.id === selectedCycleId)?.status === 'PUBLISHED')}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:pointer-events-none transition-colors"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit_square</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedInvoices.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-20 text-center text-text-secondary dark:text-gray-500">
                        {invoices.length === 0 ? 'Không có hóa đơn điện nước cho kỳ này' : 'Không tìm thấy hóa đơn phù hợp'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={allMappedInvoices.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
              itemsPerPageOptions={[5, 10, 20, 50]}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default UtilityFeeInvoiceTab;
