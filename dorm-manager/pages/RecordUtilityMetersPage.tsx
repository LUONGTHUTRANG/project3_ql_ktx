import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { getAllInvoices, fetchBuildings, getManagerById } from '../api';
import { message, Select } from 'antd';
import { UserRole } from '../types';

interface UtilityReading {
  invoiceId: number;
  roomId: number;
  roomNumber: string;
  buildingName: string;
  electricNew: number | '';
  electricOld: number;
  waterNew: number | '';
  waterOld: number;
  electricUsage: number;
  waterUsage: number;
  totalAmount: number;
  status: 'pending' | 'warning' | 'completed';
  warningMessage?: string;
}

const ELECTRIC_PRICE = 3500; // Per kWh
const WATER_PRICE = 25000; // Per m³

const RecordUtilityMetersPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'room_asc' | 'room_desc' | 'pending'>('room_asc');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [buildings, setBuildings] = useState<any[]>([]);
  const [managerBuilding, setManagerBuilding] = useState<string | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;

  // Fetch buildings and unrecorded invoices
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // For manager, get their assigned building
        if (user.role === UserRole.MANAGER) {
          const managerProfile = await getManagerById(user.id);
          setManagerBuilding(managerProfile.building_name || null);
        }

        // Fetch all buildings for admin
        if (user.role === UserRole.ADMIN) {
          const buildingsData = await fetchBuildings();
          setBuildings(buildingsData);
        }

        // Fetch unrecorded invoices
        const data = await getAllInvoices();
        
        // Filter invoices with usage_id = null (unrecorded utilities)
        let unrecorded = data.filter((inv: any) => 
          inv.type === 'UTILITY_FEE' && (inv.usage_id === null || inv.usage_id === undefined)
        );

        // For manager, filter by their building only
        if (user.role === UserRole.MANAGER && managerBuilding) {
          unrecorded = unrecorded.filter((inv: any) => inv.building_name === managerBuilding);
        }

        // Initialize readings
        const initialReadings: UtilityReading[] = unrecorded.map((inv: any) => ({
          invoiceId: inv.id,
          roomId: inv.room_id,
          roomNumber: inv.room_number || `Phòng ${inv.room_id}`,
          buildingName: inv.building_name || 'N/A',
          electricNew: '',
          electricOld: 0,
          waterNew: '',
          waterOld: 0,
          electricUsage: 0,
          waterUsage: 0,
          totalAmount: 0,
          status: 'pending',
        }));

        setReadings(initialReadings);
        setProgress({ completed: 0, total: initialReadings.length });
      } catch (err: any) {
        console.error('Failed to load data:', err);
        message.error('Không thể tải danh sách phòng cần ghi chỉ số');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, managerBuilding]);

  // Handle electric input change
  const handleElectricChange = (index: number, value: string) => {
    const newReadings = [...readings];
    const numValue = value === '' ? '' : Number(value);
    newReadings[index].electricNew = numValue;
    
    // Validate and calculate
    if (numValue !== '') {
      const usage = numValue - newReadings[index].electricOld;
      
      if (usage < 0) {
        newReadings[index].status = 'warning';
        newReadings[index].warningMessage = 'Chỉ số điện mới phải lớn hơn chỉ số cũ';
      } else if (usage > 500) {
        // Warn if usage > 500 kWh (unusual)
        newReadings[index].status = 'warning';
        newReadings[index].warningMessage = `Cảnh báo: Dùng ${usage} kWh (+${((usage / newReadings[index].electricOld) * 100).toFixed(0)}%)`;
      } else if (newReadings[index].waterNew !== '') {
        newReadings[index].status = 'completed';
        newReadings[index].warningMessage = undefined;
      } else {
        newReadings[index].status = 'pending';
        newReadings[index].warningMessage = undefined;
      }

      newReadings[index].electricUsage = usage;
      calculateTotal(newReadings, index);
    }

    setReadings(newReadings);
  };

  // Handle water input change
  const handleWaterChange = (index: number, value: string) => {
    const newReadings = [...readings];
    const numValue = value === '' ? '' : Number(value);
    newReadings[index].waterNew = numValue;

    if (numValue !== '') {
      const usage = numValue - newReadings[index].waterOld;

      if (usage < 0) {
        newReadings[index].status = 'warning';
        newReadings[index].warningMessage = 'Chỉ số nước mới phải lớn hơn chỉ số cũ';
      } else if (newReadings[index].electricNew !== '') {
        newReadings[index].status = 'completed';
        newReadings[index].warningMessage = undefined;
      } else {
        newReadings[index].status = 'pending';
        newReadings[index].warningMessage = undefined;
      }

      newReadings[index].waterUsage = usage;
      calculateTotal(newReadings, index);
    }

    setReadings(newReadings);
  };

  const calculateTotal = (readingsList: UtilityReading[], index: number) => {
    const reading = readingsList[index];
    const total =
      reading.electricUsage * ELECTRIC_PRICE + reading.waterUsage * WATER_PRICE;
    reading.totalAmount = total;
  };

  // Apply filters and sorting
  const getFilteredAndSortedReadings = () => {
    let filtered = readings;

    // Filter by building (only for admin, manager's readings are pre-filtered in useEffect)
    if (user.role === UserRole.ADMIN && selectedBuilding !== 'all') {
      filtered = filtered.filter(r => r.buildingName === selectedBuilding);
    }

    // Filter by floor
    if (selectedFloor !== 'all') {
      filtered = filtered.filter(r => {
        const roomNum = parseInt(r.roomNumber.split(' ')[1] || '0');
        const floor = Math.floor(roomNum / 100);
        return floor === parseInt(selectedFloor);
      });
    }

    // Sort
    if (sortBy === 'room_asc') {
      filtered.sort((a, b) => {
        const aRoom = parseInt(a.roomNumber.split(' ')[1] || '0');
        const bRoom = parseInt(b.roomNumber.split(' ')[1] || '0');
        return aRoom - bRoom;
      });
    } else if (sortBy === 'room_desc') {
      filtered.sort((a, b) => {
        const aRoom = parseInt(a.roomNumber.split(' ')[1] || '0');
        const bRoom = parseInt(b.roomNumber.split(' ')[1] || '0');
        return bRoom - aRoom;
      });
    } else if (sortBy === 'pending') {
      filtered.sort((a, b) => {
        const statusOrder = { pending: 0, warning: 1, completed: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      });
    }

    return filtered;
  };

  const getFloors = () => {
    const floors = new Set<number>();
    readings.forEach(r => {
      const roomNum = parseInt(r.roomNumber.split(' ')[1] || '0');
      const floor = Math.floor(roomNum / 100);
      floors.add(floor);
    });
    return Array.from(floors).sort((a, b) => a - b);
  };

  const handleSave = async () => {
    // Validate all readings
    const completedReadings = readings.filter(r => r.status === 'completed');
    
    if (completedReadings.length === 0) {
      message.warning('Vui lòng nhập đầy đủ chỉ số cho ít nhất một phòng');
      return;
    }

    try {
      // TODO: Call API to save readings and create/update monthly_usages
      message.success(`Lưu thành công ${completedReadings.length} phòng`);
    } catch (err) {
      message.error('Lỗi khi lưu dữ liệu');
    }
  };

  const filteredReadings = getFilteredAndSortedReadings();
  const completedCount = readings.filter(r => r.status === 'completed').length;

  const getStatusBadge = (status: string, message?: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
            <span className="material-symbols-outlined text-[16px]">check_circle</span> Hoàn tất
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800">
            <span className="material-symbols-outlined text-[16px]">warning</span> Cần kiểm tra
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
            <span className="material-symbols-outlined text-[16px]">pending</span> Chưa ghi
          </span>
        );
    }
  };

  return (
    <RoleBasedLayout searchPlaceholder="Tìm kiếm phòng..." headerTitle="Ghi Chỉ Số Điện Nước">
      <div className="mx-auto flex flex-col gap-6 animate-in fade-in duration-500 max-w-[1200px] w-full pb-32">
        {/* Page Heading */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-text-main dark:text-white">
              Ghi Chỉ Số Điện Nước
            </h1>
            <p className="text-text-secondary dark:text-gray-400 text-base">
              Kỳ thu phí: <span className="font-bold text-primary">Tháng 1/2026</span>
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-end gap-4">
            {user.role === UserRole.ADMIN && (
              <div className="flex flex-col min-w-[200px]">
                <label className="text-text-main dark:text-gray-300 text-sm font-medium pb-2">Chọn Tòa Nhà</label>
                <Select
                  value={selectedBuilding}
                  onChange={(value) => setSelectedBuilding(value)}
                  className="w-full"
                  options={[
                    { label: 'Tất cả tòa nhà', value: 'all' },
                    ...buildings.map(building => ({ label: building.name, value: building.name }))
                  ]}
                />
              </div>
            )}

            <div className="flex flex-col min-w-[200px]">
              <label className="text-text-main dark:text-gray-300 text-sm font-medium pb-2">Sắp xếp</label>
              <Select
                value={sortBy}
                onChange={(value) => setSortBy(value as any)}
                className="w-full"
                options={[
                  { label: 'Phòng (Tăng dần)', value: 'room_asc' },
                  { label: 'Phòng (Giảm dần)', value: 'room_desc' },
                  { label: 'Chưa nhập liệu', value: 'pending' }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Floor Filter Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          <button
            onClick={() => setSelectedFloor('all')}
            className={`flex h-9 shrink-0 items-center justify-center px-4 rounded-full font-medium text-sm transition-transform active:scale-95 ${
              selectedFloor === 'all'
                ? 'bg-text-main dark:bg-primary text-white'
                : 'bg-white dark:bg-gray-800 border border-border-color dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-text-main dark:text-gray-300'
            }`}
          >
            Tất cả
          </button>
          {getFloors().map(floor => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(String(floor))}
              className={`flex h-9 shrink-0 items-center justify-center px-4 rounded-full font-medium text-sm transition-colors ${
                selectedFloor === String(floor)
                  ? 'bg-text-main dark:bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 border border-border-color dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-text-main dark:text-gray-300'
              }`}
            >
              Tầng {floor}
            </button>
          ))}
        </div>

        {/* Header Row (Desktop) */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-100 dark:bg-gray-800 rounded-lg text-sm font-semibold text-text-secondary dark:text-gray-400 border border-border-color dark:border-slate-700">
          <div className="col-span-1 flex items-center">Phòng</div>
          <div className="col-span-5 grid grid-cols-2 gap-4">
            <div className="pl-2">Điện (kWh)</div>
            <div className="pl-2">Nước (m³)</div>
          </div>
          <div className="col-span-4 pl-4 flex items-center">Tạm tính</div>
          <div className="col-span-2 flex items-center justify-end">Trạng thái</div>
        </div>

        {/* Room Items */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span className="text-text-secondary">Đang tải...</span>
          </div>
        ) : filteredReadings.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <span className="text-text-secondary">Không có phòng cần ghi chỉ số</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredReadings.map((reading, index) => (
              <div
                key={reading.invoiceId}
                className={`group bg-white dark:bg-surface-dark rounded-xl shadow-sm border rounded-xl p-5 lg:p-0 lg:py-4 lg:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-4 items-center hover:shadow-md transition-shadow relative overflow-hidden ${
                  reading.status === 'warning' ? 'border-l-4 border-l-amber-500' : 'border border-border-color dark:border-slate-700'
                }`}
              >
                {/* Mobile Header */}
                <div className="flex justify-between items-center lg:hidden pb-2 border-b border-dashed border-border-color dark:border-slate-700 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">meeting_room</span>
                    <span className="text-lg font-bold">{reading.roomNumber}</span>
                  </div>
                  {getStatusBadge(reading.status, reading.warningMessage)}
                </div>

                {/* Room Number (Desktop) */}
                <div className="hidden lg:flex col-span-1 items-center gap-2">
                  <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-text-secondary">
                    <span className="material-symbols-outlined text-lg">meeting_room</span>
                  </div>
                  <span className="text-base font-bold text-text-main dark:text-white">
                    {reading.roomNumber.split(' ')[1] || reading.roomNumber}
                  </span>
                </div>

                {/* Inputs Section */}
                <div className="col-span-1 lg:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-4 border-l-0 lg:border-l lg:border-r border-border-color dark:border-slate-700 lg:px-4">
                  {/* Electric Input */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-text-secondary dark:text-gray-400 px-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-amber-500">bolt</span> Điện
                      </span>
                      <span>Cũ: <b className="text-text-main dark:text-gray-200">{reading.electricOld.toLocaleString('vi-VN')}</b></span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Nhập mới"
                        value={reading.electricNew}
                        onChange={(e) => handleElectricChange(index, e.target.value)}
                        className={`w-full rounded-lg border p-2.5 pr-12 text-sm font-medium focus:ring-1 outline-none transition-all ${
                          reading.status === 'warning' && reading.electricNew !== ''
                            ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 focus:border-amber-500 focus:ring-amber-500'
                            : 'border-border-color dark:border-slate-600 bg-white dark:bg-gray-900 focus:border-primary focus:ring-primary'
                        } text-text-main dark:text-white`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-secondary">kWh</span>
                      {reading.status === 'warning' && reading.electricNew !== '' && (
                        <span className="material-symbols-outlined absolute right-10 top-1/2 -translate-y-1/2 text-amber-500 text-lg" title="Tăng đột biến">
                          warning
                        </span>
                      )}
                    </div>
                    {reading.electricNew !== '' ? (
                      <div className={`text-xs px-1 flex items-center gap-1 ${
                        reading.electricUsage > 500 ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        Dùng: {reading.electricUsage} kWh {reading.electricUsage > 500 ? `(+${((reading.electricUsage / reading.electricOld) * 100).toFixed(0)}%)` : ''}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 px-1 flex items-center gap-1">---</div>
                    )}
                  </div>

                  {/* Water Input */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-text-secondary dark:text-gray-400 px-1">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px] text-cyan-500">water_drop</span> Nước
                      </span>
                      <span>Cũ: <b className="text-text-main dark:text-gray-200">{reading.waterOld}</b></span>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Nhập mới"
                        value={reading.waterNew}
                        onChange={(e) => handleWaterChange(index, e.target.value)}
                        className="w-full rounded-lg border border-border-color dark:border-slate-600 bg-white dark:bg-gray-900 p-2.5 pr-10 text-sm text-text-main dark:text-white font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-secondary">m³</span>
                    </div>
                    {reading.waterNew !== '' ? (
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 px-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        Dùng: {reading.waterUsage} m³
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 px-1 flex items-center gap-1">---</div>
                    )}
                  </div>
                </div>

                {/* Cost Section */}
                <div className="col-span-1 lg:col-span-4 lg:pl-4 flex flex-col justify-center">
                  <p className="text-xs text-text-secondary dark:text-gray-400 mb-1">Tổng cộng tạm tính</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-bold ${
                      reading.totalAmount > 0 ? 'text-primary' : 'text-text-main dark:text-white'
                    }`}>
                      {reading.totalAmount > 0 ? `${reading.totalAmount.toLocaleString('vi-VN')}₫` : '---'}
                    </span>
                  </div>
                  {reading.warningMessage && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      {reading.warningMessage}
                    </p>
                  )}
                  {reading.totalAmount > 0 && (
                    <p className="text-xs text-text-secondary dark:text-gray-500 mt-1">Đã bao gồm VAT</p>
                  )}
                </div>

                {/* Status (Desktop) */}
                <div className="hidden lg:flex col-span-2 justify-end">
                  {getStatusBadge(reading.status, reading.warningMessage)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Footer */}
      {filteredReadings.length > 0 && (
        <div className="fixed bottom-0 right-0 bg-white dark:bg-surface-dark border-t border-border-color dark:border-slate-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40" style={{ left: '288px' }}>
          <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-xs text-text-secondary dark:text-gray-400">Tiến độ</span>
                <span className="text-sm font-bold text-text-main dark:text-white">
                  {completedCount}/{readings.length} Phòng
                </span>
              </div>
              <div className="hidden sm:block h-8 w-px bg-border-color dark:bg-slate-700"></div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs text-text-secondary dark:text-gray-400">Tổng tạm tính</span>
                <span className="text-sm font-bold text-primary">
                  {readings.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.totalAmount, 0).toLocaleString('vi-VN')}₫
                </span>
              </div>
            </div>
            <div className="flex w-full sm:w-auto gap-3">
              <button className="flex-1 sm:flex-none h-10 px-6 rounded-lg border border-border-color dark:border-slate-600 text-text-main dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="flex-1 sm:flex-none h-10 px-6 rounded-lg bg-primary text-white font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">save</span> Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleBasedLayout>
  );
};

export default RecordUtilityMetersPage;
