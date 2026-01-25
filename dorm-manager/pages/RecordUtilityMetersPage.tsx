import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { fetchBuildings, getManagerById } from '../api';
import { getServicePriceByName } from '../api';
import { getUtilityInvoiceCycles, getUtilityInvoicesByCycle, recordBulkUtilityReadings } from '../api';
import { message, Select } from 'antd';
import { UserRole } from '../types';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface UtilityReading {
  roomId: number;
  roomNumber: string;
  buildingName: string;
  floor: number;
  electricNew: number | '';
  electricOld: number | null;
  electricOldInitial: number | null; // Track initial value from API
  waterNew: number | '';
  waterOld: number | null;
  waterOldInitial: number | null; // Track initial value from API
  electricUsage: number;
  waterUsage: number;
  totalAmount: number;
  status: 'pending' | 'warning' | 'error' | 'completed';
  warningMessage?: string;
}

const ELECTRIC_PRICE = 3500; // Per kWh (fallback)
const WATER_PRICE = 25000; // Per m³ (fallback)

const RecordUtilityMetersPage: React.FC = () => {
  const { user } = useContext(AuthContext);
  // console.log('User in RecordUtilityMetersPage:', user);  
  const [readings, setReadings] = useState<UtilityReading[]>([]);
  const [roomsData, setRoomsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'room_asc' | 'room_desc' | 'pending'>('room_asc');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [buildings, setBuildings] = useState<any[]>([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [electricPrice, setElectricPrice] = useState<number>(ELECTRIC_PRICE);
  const [waterPrice, setWaterPrice] = useState<number>(WATER_PRICE);
  const [currentCycle, setCurrentCycle] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get('mode') === 'edit';
  const editRoomId = searchParams.get('roomId') ? parseInt(searchParams.get('roomId')!) : null;
  const editCycleId = searchParams.get('cycleId') ? parseInt(searchParams.get('cycleId')!) : null;

  const navigate = useNavigate();

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;

  // Fetch buildings and rooms
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Get manager's building ID if manager
        let managerBuildingId: number | null = null;
        if (user.role === UserRole.MANAGER) {
          const managerProfile = await getManagerById(user.id);
          const buildingsData = await fetchBuildings();
          const managerBuild = buildingsData?.find((b: any) => b.name === managerProfile.building_name);
          managerBuildingId = managerBuild?.id || null;
        }

        // Determine which cycle to use
        let cycleToUse: any;
        if (editMode && editCycleId) {
          // Edit mode: fetch the specified cycle to get month and year
          const allCycles = await getUtilityInvoiceCycles();
          cycleToUse = allCycles.find((c: any) => c.id === editCycleId);
        } else {
          // Normal mode: use current month's cycle
          const now = new Date();
          const currentMonth = now.getMonth() + 1;
          const currentYear = now.getFullYear();
          const cycles = await getUtilityInvoiceCycles();
          cycleToUse = cycles.find((c: any) => c.month === currentMonth && c.year === currentYear);
        }
        
        if (!cycleToUse) {
          message.info('Không có kỳ hóa đơn nào');
          setReadings([]);
          return;
        }

        // Store cycle data for display
        setCurrentCycle(cycleToUse);

        // Get utility invoices for cycle
        const allInvoices = await getUtilityInvoicesByCycle(cycleToUse.id, managerBuildingId);

        // Filter invoices
        let filteredInvoices = allInvoices;
        if (editMode && editRoomId) {
          // Edit mode: show only the specified room
          filteredInvoices = allInvoices.filter((inv: any) => inv.room_id === editRoomId);
        } else {
          // Normal mode: show only unrecorded invoices
          filteredInvoices = allInvoices.filter((inv: any) => {
            const hasElectricReading = inv.electricity_new !== null && inv.electricity_new !== inv.electricity_old;
            const hasWaterReading = inv.water_new !== null && inv.water_new !== inv.water_old;
            return !hasElectricReading || !hasWaterReading;
          });
        }

        // Transform invoices to room data
        const filteredRooms = filteredInvoices.map((inv: any) => ({
          id: inv.room_id,
          room_number: inv.room_number,
          floor: inv.floor,
          building_id: inv.building_id,
          building_name: inv.building_name,
          old_electricity: inv.electricity_old,
          old_water: inv.water_old,
          current_electricity: inv.electricity_new,
          current_water: inv.water_new,
        }));

        // Fetch service prices and buildings in parallel
        const [elecPriceData, waterPriceData, buildingsData] = await Promise.all([
          getServicePriceByName('ELECTRICITY'),
          getServicePriceByName('WATER'),
          fetchBuildings()
        ]);

        // Set service prices
        const finalElecPrice = elecPriceData?.unit_price || ELECTRIC_PRICE;
        const finalWaterPrice = waterPriceData?.unit_price || WATER_PRICE;
        
        setElectricPrice(finalElecPrice);
        setWaterPrice(finalWaterPrice);

        setBuildings(buildingsData);
        setRoomsData(filteredRooms);

        // Initialize readings
        const initialReadings: UtilityReading[] = filteredRooms.map((room: any) => {
          const building = buildingsData?.find((b: any) => b.id === room.building_id);
          
          // Calculate usage and amount in edit mode
          let electricUsage = 0;
          let waterUsage = 0;
          let totalAmount = 0;
          
          if (editMode && room.current_electricity !== null && room.current_water !== null) {
            electricUsage = Math.max(0, room.current_electricity - (room.old_electricity || 0));
            waterUsage = Math.max(0, room.current_water - (room.old_water || 0));
            totalAmount = electricUsage * finalElecPrice + waterUsage * finalWaterPrice;
          }
          
          return {
            roomId: room.id,
            roomNumber: room.room_number || `Phòng ${room.id}`,
            buildingName: building?.name || 'N/A',
            floor: room.floor || 0,
            electricNew: editMode && room.current_electricity !== null ? room.current_electricity : '',
            electricOld: room.old_electricity,
            electricOldInitial: room.old_electricity,
            waterNew: editMode && room.current_water !== null ? room.current_water : '',
            waterOld: room.old_water,
            waterOldInitial: room.old_water,
            electricUsage: electricUsage,
            waterUsage: waterUsage,
            totalAmount: totalAmount,
            status: 'pending',
          };
        });

        setReadings(initialReadings);
        setProgress({ completed: 0, total: initialReadings.length });
      } catch (err: any) {
        console.error('Failed to load data:', err);
        message.error('Không thể tải danh sách phòng');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Handle old electric input change
  const handleElectricOldChange = (index: number, value: string) => {
    const newReadings = [...readings];
    const numValue = value === '' ? '' : Number(value);
    
    // Validate >= 0
    if (numValue !== '' && numValue < 0) {
      message.warning('Chỉ số không thể là số âm');
      return;
    }
    
    newReadings[index].electricOld = numValue === '' ? null : numValue;
    setReadings(newReadings);
  };

  // Handle electric input change
  const handleElectricChange = (index: number, value: string) => {
    const newReadings = [...readings];
    const numValue = value === '' ? '' : Number(value);
    
    // Validate >= 0
    if (numValue !== '' && numValue < 0) {
      message.warning('Chỉ số không thể là số âm');
      return;
    }
    
    newReadings[index].electricNew = numValue;
    
    // Validate and calculate only if old reading is available
    if (numValue !== '' && newReadings[index].electricOld !== null) {
      const usage = numValue - newReadings[index].electricOld;
      
      if (usage < 0) {
        // Error: new reading is less than old reading
        newReadings[index].status = 'error';
        newReadings[index].warningMessage = 'Chỉ số điện mới phải lớn hơn chỉ số cũ';
      } else if (usage > 500) {
        // Warning: usage is unusually high
        newReadings[index].status = 'warning';
        newReadings[index].warningMessage = `Cảnh báo: Dùng ${usage} kWh (+${((usage / newReadings[index].electricOld!) * 100).toFixed(0)}%)`;
      } else if (newReadings[index].waterNew !== '') {
        newReadings[index].status = 'completed';
        newReadings[index].warningMessage = undefined;
      } else {
        newReadings[index].status = 'pending';
        newReadings[index].warningMessage = undefined;
      }

      newReadings[index].electricUsage = usage;
      calculateTotal(newReadings, index);
    } else if (numValue !== '' && newReadings[index].electricOld === null) {
      // Old reading not set yet
      newReadings[index].status = 'pending';
      newReadings[index].warningMessage = 'Vui lòng nhập chỉ số điện cũ trước';
      newReadings[index].electricUsage = 0;
    }

    setReadings(newReadings);
  };

  // Handle old water input change
  const handleWaterOldChange = (index: number, value: string) => {
    const newReadings = [...readings];
    const numValue = value === '' ? '' : Number(value);
    
    // Validate >= 0
    if (numValue !== '' && numValue < 0) {
      message.warning('Chỉ số không thể là số âm');
      return;
    }
    
    newReadings[index].waterOld = numValue === '' ? null : numValue;
    setReadings(newReadings);
  };

  // Handle water input change
  const handleWaterChange = (index: number, value: string) => {
    const newReadings = [...readings];
    const numValue = value === '' ? '' : Number(value);
    
    // Validate >= 0
    if (numValue !== '' && numValue < 0) {
      message.warning('Chỉ số không thể là số âm');
      return;
    }
    
    newReadings[index].waterNew = numValue;

    // Validate and calculate only if old reading is available
    if (numValue !== '' && newReadings[index].waterOld !== null) {
      const usage = numValue - newReadings[index].waterOld;

      if (usage < 0) {
        // Error: new reading is less than old reading
        newReadings[index].status = 'error';
        newReadings[index].warningMessage = 'Chỉ số nước mới phải lớn hơn chỉ số cũ';
      } else if (usage > 20) {
        // Warning: water usage is unusually high (>20m3)
        newReadings[index].status = 'warning';
        newReadings[index].warningMessage = `Cảnh báo: Dùng ${usage} m³ (+${((usage / newReadings[index].waterOld!) * 100).toFixed(0)}%)`;
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
      reading.electricUsage * electricPrice + reading.waterUsage * waterPrice;
    reading.totalAmount = total;
  };

  // Apply filters and sorting
  const getFilteredAndSortedReadings = () => {
    let filtered = readings;

    // In edit mode, show only the single room being edited (already filtered in useEffect)
    if (editMode) {
      return filtered;
    }

    // Filter by building (only for admin, manager's readings are pre-filtered in useEffect)
    if (user.role === UserRole.ADMIN && selectedBuilding !== 'all') {
      filtered = filtered.filter(r => r.buildingName === selectedBuilding);
    }

    // Filter by floor
    if (selectedFloor !== 'all') {
      filtered = filtered.filter(r => r.floor === parseInt(selectedFloor));
    }

    // Sort
    if (sortBy === 'room_asc') {
      filtered.sort((a, b) => {
        const aRoom = parseInt(a.roomNumber.split(' ')[1] || a.roomNumber || '0');
        const bRoom = parseInt(b.roomNumber.split(' ')[1] || b.roomNumber || '0');
        return aRoom - bRoom;
      });
    } else if (sortBy === 'room_desc') {
      filtered.sort((a, b) => {
        const aRoom = parseInt(a.roomNumber.split(' ')[1] || a.roomNumber || '0');
        const bRoom = parseInt(b.roomNumber.split(' ')[1] || b.roomNumber || '0');
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
    roomsData.forEach(room => {
      if (room.floor !== null && room.floor !== undefined) {
        floors.add(room.floor);
      }
    });
    return Array.from(floors).sort((a, b) => a - b);
  };

  const handleSave = async () => {
    // Validate: no error status readings should be saved
    const errorReadings = readings.filter(r => r.status === 'error' && r.electricNew !== '' && r.waterNew !== '');
    if (errorReadings.length > 0) {
      message.error(`Có ${errorReadings.length} phòng có lỗi. Vui lòng kiểm tra lại chỉ số.`);
      return;
    }

    // Get only readings with both electric and water values entered
    const readingsToSave = readings
      .filter(r => r.electricNew !== '' && r.waterNew !== '' && r.status !== 'error')
      .map(r => ({
        room_id: r.roomId,
        electricity_old: r.electricOld,
        electricity_new: r.electricNew as number,
        water_old: r.waterOld,
        water_new: r.waterNew as number,
      }));
    
    if (readingsToSave.length === 0) {
      message.warning('Vui lòng nhập đầy đủ chỉ số điện và nước cho ít nhất một phòng');
      return;
    }

    if (!currentCycle) {
      message.error('Không tìm thấy kỳ hóa đơn hiện tại');
      return;
    }

    try {
      setLoading(true);

      // Call the new API to record bulk utility readings
      const response = await recordBulkUtilityReadings({
        cycle_id: currentCycle.id,
        readings: readingsToSave,
      });

      message.success(
        `Lưu thành công ${readingsToSave.length} phòng`
      );

      // If in edit mode, redirect back to invoice tab after successful save
      if (editMode) {
        setTimeout(() => {
          navigate(`/${user?.role}/invoices/utility-fee`);
        }, 1000);
        return;
      }

      // Reload data - get rooms with unrecorded usage for current cycle
      let managerBuildingId: number | null = null;
      if (user.role === UserRole.MANAGER) {
        const managerProfile = await getManagerById(user.id);
        const buildingsData = await fetchBuildings();
        const managerBuild = buildingsData?.find((b: any) => b.name === managerProfile.building_name);
        managerBuildingId = managerBuild?.id || null;
      }

      // Get utility invoices for current cycle
      const allInvoices = await getUtilityInvoicesByCycle(currentCycle.id, managerBuildingId);

      // Filter to get only invoices where readings haven't been recorded
      const unrecordedInvoices = allInvoices.filter((inv: any) => {
        const hasElectricReading = inv.electricity_new !== null && inv.electricity_new !== inv.electricity_old;
        const hasWaterReading = inv.water_new !== null && inv.water_new !== inv.water_old;
        return !hasElectricReading || !hasWaterReading;
      });

      // Transform invoices to room data
      const filteredRooms = unrecordedInvoices.map((inv: any) => ({
        id: inv.room_id,
        room_number: inv.room_number,
        floor: inv.floor,
        building_id: inv.building_id,
        building_name: inv.building_name,
        old_electricity: inv.electricity_old,
        old_water: inv.water_old,
      }));

      // Get buildings data for display
      const buildingsData = await fetchBuildings();

      const initialReadings: UtilityReading[] = filteredRooms.map((room: any) => {
        const building = buildingsData.find((b: any) => b.id === room.building_id);
        
        return {
          roomId: room.id,
          roomNumber: room.room_number || `Phòng ${room.id}`,
          buildingName: building?.name || 'N/A',
          floor: room.floor || 0,
          electricNew: '',
          electricOld: room.old_electricity,
          electricOldInitial: room.old_electricity, // Store initial value from API
          waterNew: '',
          waterOld: room.old_water,
          waterOldInitial: room.old_water, // Store initial value from API
          electricUsage: 0,
          waterUsage: 0,
          totalAmount: 0,
          status: 'pending',
        };
      });

      setReadings(initialReadings);
      setProgress({ completed: 0, total: initialReadings.length });
    } catch (err: any) {
      console.error('Error saving data:', err);
      message.error(err.response?.data?.message || 'Lỗi khi lưu dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const filteredReadings = getFilteredAndSortedReadings();
  console.log('Filtered Readings:', filteredReadings);
  const completedCount = readings.filter(r => r.status === 'completed').length;
  const pendingCount = readings.filter(r => r.status === 'pending').length;
  const warningCount = readings.filter(r => r.status === 'warning').length;

  const getStatusBadge = (status: string, message?: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
            <span className="material-symbols-outlined text-[16px]">check_circle</span> Hoàn tất
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/30 px-3 py-1 text-xs font-semibold text-red-700 dark:text-red-400 border border-red-100 dark:border-red-800">
            <span className="material-symbols-outlined text-[16px]">error</span> Lỗi
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
      <button
        onClick={() => navigate(`/${user?.role}/invoices/utility-fee`)}
        className="group flex items-center gap-2 mb-2 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
      >
        <div className="flex items-center justify-center size-8 rounded-full group-hover:bg-primary/10 transition-colors">
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </div>
        <span className="text-sm font-bold leading-normal">Quay lại danh sách hóa đơn</span>
      </button>
      <div className="mx-auto flex flex-col gap-6 animate-in fade-in duration-500 w-full pb-32">
        {/* Page Heading */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-text-main dark:text-white">
              {editMode ? 'Chỉnh Sửa Chỉ Số Điện Nước' : 'Ghi Chỉ Số Điện Nước'}
            </h1>
            <p className="text-text-secondary dark:text-gray-400 text-base">
              Kỳ thu phí: <span className="font-bold text-primary">
                {currentCycle ? `Tháng ${currentCycle.month}/${currentCycle.year}` : 'Đang tải...'}
              </span>
            </p>
          </div>

          {/* Controls */}
          {!editMode && (
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

              {/* <div className="flex flex-col min-w-[200px]">
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
            </div> */}
            </div>
          )}
        </div>

        {/* Floor Filter Chips */}
        {!editMode && (
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
          )}

        {/* Header Row (Desktop) */}
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-100 dark:bg-gray-800 rounded-lg text-sm font-semibold text-text-secondary dark:text-gray-400 border border-border-color dark:border-slate-700">
          <div className="col-span-1 flex items-center">Phòng</div>
          <div className="col-span-7 grid grid-cols-2 gap-4">
            <div className="pl-2">Điện (kWh)</div>
            <div className="pl-2">Nước (m³)</div>
          </div>
          <div className="col-span-2 flex items-center">Tạm tính</div>
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
                key={reading.roomId}
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
                <div className="col-span-1 lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-4 border-l-0 lg:border-l lg:border-r border-border-color dark:border-slate-700 lg:px-4">
                  {/* Electric Input */}
                  <div className="flex flex-col gap-1.5">
                    {reading.electricOldInitial !== null ? (
                      <div className="flex justify-between text-xs text-text-secondary dark:text-gray-400 px-1">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-amber-500">bolt</span> Điện
                        </span>
                        <span>Cũ: <b className="text-text-main dark:text-gray-200">{reading.electricOld?.toLocaleString('vi-VN')}</b></span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-1 text-xs text-text-secondary dark:text-gray-400 px-1">
                          <span className="material-symbols-outlined text-[14px] text-amber-500">bolt</span> Điện
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="Nhập chỉ số điện cũ"
                            value={reading.electricOld === null ? '' : reading.electricOld}
                            onChange={(e) => handleElectricOldChange(index, e.target.value)}
                            className="w-full rounded-lg border border-border-color dark:border-slate-600 bg-white dark:bg-gray-900 p-2.5 pr-12 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-text-main dark:text-white"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-secondary">kWh</span>
                        </div>
                      </div>
                    )}
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Nhập chỉ số điện mới"
                        value={reading.electricNew}
                        onChange={(e) => handleElectricChange(index, e.target.value)}
                        className={`w-full rounded-lg border p-2.5 pr-12 text-sm font-medium focus:ring-1 outline-none transition-all ${
                          reading.status === 'error' && reading.electricNew !== ''
                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500'
                            : reading.status === 'warning' && reading.electricNew !== ''
                            ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 focus:border-amber-500 focus:ring-amber-500'
                            : 'border-border-color dark:border-slate-600 bg-white dark:bg-gray-900 focus:border-primary focus:ring-primary'
                        } text-text-main dark:text-white`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-secondary">kWh</span>
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
                    {reading.waterOldInitial !== null ? (
                      <div className="flex justify-between text-xs text-text-secondary dark:text-gray-400 px-1">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-cyan-500">water_drop</span> Nước
                        </span>
                        <span>Cũ: <b className="text-text-main dark:text-gray-200">{reading.waterOld}</b></span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <label className="flex items-center gap-1 text-xs text-text-secondary dark:text-gray-400 px-1">
                          <span className="material-symbols-outlined text-[14px] text-cyan-500">water_drop</span> Nước
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            placeholder="Nhập chỉ số nước cũ"
                            value={reading.waterOld === null ? '' : reading.waterOld}
                            onChange={(e) => handleWaterOldChange(index, e.target.value)}
                            className="w-full rounded-lg border border-border-color dark:border-slate-600 bg-white dark:bg-gray-900 p-2.5 pr-12 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-text-main dark:text-white"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-text-secondary">m³</span>
                        </div>
                      </div>
                    )}
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Nhập chỉ số nước mới"
                        value={reading.waterNew}
                        onChange={(e) => handleWaterChange(index, e.target.value)}
                        className={`w-full rounded-lg border p-2.5 pr-10 text-sm text-text-main dark:text-white font-medium focus:ring-1 outline-none transition-all ${
                          reading.status === 'error' && reading.waterNew !== ''
                            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500'
                            : reading.status === 'warning' && reading.waterNew !== ''
                            ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 focus:border-amber-500 focus:ring-amber-500'
                            : 'border-border-color dark:border-slate-600 bg-white dark:bg-gray-900 focus:border-primary focus:ring-primary'
                        }`}
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
                <div className="col-span-2 flex flex-col justify-center">
                  <p className="text-xs text-text-secondary dark:text-gray-400 mb-1">Tổng cộng tạm tính</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-bold ${
                      reading.totalAmount > 0 ? 'text-primary' : 'text-text-main dark:text-white'
                    }`}>
                      {reading.totalAmount > 0 ? `${reading.totalAmount.toLocaleString('vi-VN')}₫` : '---'}
                    </span>
                  </div>
                  {reading.warningMessage && (
                    <p className={`text-xs mt-1 font-medium flex items-center gap-1 ${
                      reading.status === 'error'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      <span className="material-symbols-outlined text-[14px]">{reading.status === 'error' ? 'error' : 'info'}</span>
                      {reading.warningMessage}
                    </p>
                  )}
                  {reading.totalAmount > 0 && (
                    <p className="text-xs text-text-secondary dark:text-gray-500 mt-1">Đã bao gồm VAT</p>
                  )}
                </div>

                {/* Status (Desktop) */}
                <div className="hidden lg:flex col-span-2 justify-end items-center">
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
            {/* Action Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-text-secondary dark:text-gray-400">Tổng phòng</span>
                  <span className="text-sm font-bold text-text-main dark:text-white">{readings.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-emerald-600 dark:text-emerald-400">✓ Đã ghi</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-500 dark:text-slate-400">⊙ Chưa ghi</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{pendingCount}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-amber-600 dark:text-amber-400">⚠ Cảnh báo</span>
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{warningCount}</span>
                </div>
              </div>
              <div className="flex w-full sm:w-auto gap-3">
                <button 
                  onClick={() => navigate(`/${user?.role}/invoices/utility-fee`)}
                  className="flex-1 sm:flex-none h-10 px-6 rounded-lg border border-border-color dark:border-slate-600 text-text-main dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
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
