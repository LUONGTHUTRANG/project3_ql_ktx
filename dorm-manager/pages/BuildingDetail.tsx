import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Select, Spin, Modal, Input, Checkbox } from 'antd';
import { App } from "antd";
import DashboardLayout from '../layouts/DashboardLayout';
import { STUDENT_NAV_ITEMS } from './StudentDashboard';
import Pagination from '../components/Pagination';
import { SearchOutlined } from "@ant-design/icons";
import { fetchBuildingById, fetchRooms, deleteRoom, updateRoom, createRoom } from '../api';

interface Building {
  id: number;
  name: string;
  location: string;
  gender_restriction?: string;
  room_count?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

interface Room {
  id: number;
  building_id: number;
  room_number: string;
  floor: number;
  max_capacity: number;
  price_per_semester: number;
  has_ac: number;
  has_heater: number;
  has_washer: number;
  status: string;
  created_at: string;
  updated_at: string;
}

const BuildingDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [building, setBuilding] = useState<Building | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Room> | null>(null);
  const [updatingRoomId, setUpdatingRoomId] = useState<number | null>(null);

  const { message } = App.useApp();

  // Load building and rooms data from API
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const [buildingData, roomsData] = await Promise.all([
          fetchBuildingById(id),
          fetchRooms()
        ]);
        
        setBuilding(buildingData);
        // Filter rooms for this building
        const buildingRooms = roomsData.filter((r: Room) => r.building_id === parseInt(id));
        setRooms(buildingRooms);
      } catch (err: any) {
        const errorMessage = err.message || 'Không thể tải dữ liệu tòa nhà';
        setError(errorMessage);
        message.error(errorMessage);
        console.error('Error loading building detail:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout 
        navItems={STUDENT_NAV_ITEMS.map(item => ({...item, isActive: item.link === '/student/buildings'}))}
        searchPlaceholder="Tìm kiếm..."
        headerTitle="Chi tiết Tòa nhà"
      >
        <div className="flex items-center justify-center p-12">
          <Spin size="large" tip="Đang tải dữ liệu..." />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !building) {
    return (
      <DashboardLayout 
        navItems={STUDENT_NAV_ITEMS.map(item => ({...item, isActive: item.link === '/student/buildings'}))}
        searchPlaceholder="Tìm kiếm..."
        headerTitle="Chi tiết Tòa nhà"
      >
        <div className="flex flex-col items-center justify-center p-12 gap-4">
          <span className="material-symbols-outlined text-4xl text-red-500">error</span>
          <div className="text-center">
            <p className="font-medium text-red-600 mb-2">Lỗi tải dữ liệu</p>
            <p className="text-sm text-text-secondary mb-4">{error || 'Không thể tải thông tin tòa nhà'}</p>
            <button 
              onClick={() => navigate('/student/buildings')}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const availableRooms = rooms.filter((r: Room) => r.status === 'AVAILABLE').length;
  const totalFloors = rooms.length > 0 ? Math.max(...rooms.map((r: Room) => r.floor)) : 0;
  const minCapacity = rooms.length > 0 ? Math.min(...rooms.map((r: Room) => r.max_capacity)) : 0;
  const maxCapacity = rooms.length > 0 ? Math.max(...rooms.map((r: Room) => r.max_capacity)) : 0;

  // Filter rooms based on search and filters
  const filteredRooms = rooms.filter((room) => {
    const matchSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFloor = !filterFloor || room.floor.toString() === filterFloor;
    const matchStatus = !filterStatus || room.status.toLowerCase() === filterStatus.toLowerCase();
    return matchSearch && matchFloor && matchStatus;
  });

  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique floors for filter dropdown
  const uniqueFloors = Array.from(new Set(rooms.map(r => r.floor))).sort((a: number, b: number) => a - b);
  const floorOptions = [
    { value: '', label: 'Tất cả các tầng' },
    ...uniqueFloors.map(floor => ({ value: floor.toString(), label: `Tầng ${floor}` }))
  ];

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'FULL':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toUpperCase()) {
      case 'AVAILABLE':
        return 'Còn trống';
      case 'FULL':
        return 'Đã đầy';
      default:
        return status;
    }
  };

  const formatPrice = (price: number) => {
    const normalized = Math.round(price);
    return normalized.toLocaleString('vi-VN');
  };

  const handleDeleteRoom = (room: Room) => {
    setRoomToDelete(room);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    try {
      setDeleting(true);
      await deleteRoom(roomToDelete.id);
      message.success({
        content: `Đã xóa phòng ${roomToDelete.room_number} thành công`,
        duration: 2,
      });
      setRooms(rooms.filter(r => r.id !== roomToDelete.id));
      setDeleteModalVisible(false);
      setRoomToDelete(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Không thể xóa phòng';
      message.error({
        content: `Xóa phòng ${roomToDelete.room_number} thất bại: ${errorMsg}`,
        duration: 3,
      });
      console.error('Error deleting room:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setEditFormData({ ...room });
  };

  const handleCancelEdit = () => {
    setEditingRoomId(null);
    setEditFormData(null);
  };

  const handleSaveEdit = async () => {
    if (!editFormData || editingRoomId === null) return;
    try {
      setUpdatingRoomId(editingRoomId);
      
      const updateData = {
        building_id: editFormData.building_id,
        room_number: editFormData.room_number,
        floor: editFormData.floor,
        max_capacity: editFormData.max_capacity,
        price_per_semester: editFormData.price_per_semester,
        has_ac: editFormData.has_ac,
        has_heater: editFormData.has_heater,
        has_washer: editFormData.has_washer,
        status: editFormData.status,
      };
      
      // Check if creating new room (editingRoomId === 0)
      if (editingRoomId === 0) {
        const result = await createRoom(updateData);
        const newRoom: Room = { ...result, id: result.id };
        setRooms([newRoom, ...rooms]);
        message.success({
          content: `Tạo phòng ${editFormData.room_number} thành công`,
          duration: 2,
        });
      } else {
        // Update existing room
        await updateRoom(editingRoomId, updateData);
        setRooms(rooms.map(r => r.id === editingRoomId ? { ...editFormData as Room } : r));
        message.success({
          content: `Cập nhật phòng ${editFormData.room_number} thành công`,
          duration: 2,
        });
      }
      
      setEditingRoomId(null);
      setEditFormData(null);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Không thể lưu phòng';
      message.error({
        content: `Lưu phòng thất bại: ${errorMsg}`,
        duration: 3,
      });
      console.error('Error saving room:', err);
    } finally {
      setUpdatingRoomId(null);
    }
  };

  const handleCreateNewRoom = () => {
    const newRoomData: Partial<Room> = {
      id: 0,
      building_id: parseInt(id || '0'),
      room_number: '',
      floor: 1,
      max_capacity: 4,
      price_per_semester: 0,
      has_ac: 0,
      has_heater: 0,
      has_washer: 0,
      status: 'AVAILABLE',
    };
    setEditingRoomId(0);
    setEditFormData(newRoomData);
  };

  return (
    <DashboardLayout 
      navItems={STUDENT_NAV_ITEMS.map(item => ({...item, isActive: item.link === '/student/buildings'}))}
      searchPlaceholder="Tìm kiếm..."
      headerTitle="Chi tiết Tòa nhà"
    >
      <button 
        onClick={() => navigate('/student/buildings')}
        className="flex items-center gap-1 mb-2 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm font-medium"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Quay lại danh sách Tòa nhà
      </button>
      <div className="mx-auto flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-text-main dark:text-white text-3xl font-black tracking-tight">Chi tiết Tòa nhà {building?.name}</h1>
          <p className="text-text-secondary dark:text-gray-400 text-base">Thông tin tổng quan và danh sách phòng tại Tòa nhà {building?.name}</p>
        </div>

        {/* Building Info Card */}
        <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-border-color dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">
                    Tòa nhà {building.name}
                    {building.gender_restriction && building.gender_restriction !== 'MIXED' && 
                      ` - ${building.gender_restriction === 'MALE' ? 'Nam' : 'Nữ'}`
                    }
                  </h2>
                  <div className="flex items-center gap-2 text-text-secondary dark:text-gray-400 text-sm">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    {building.location}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Đang hoạt động
                </span>
              </div>
              <p className="text-text-main dark:text-gray-300 text-sm leading-relaxed text-justify max-w-none">
                {building.description || `Tòa nhà ${building.name} là một trong những khu ký túc xá hiện đại, được thiết kế thoáng mát, sạch sẽ. Tòa nhà có vị trí thuận lợi cho việc di chuyển đến giảng đường và các khu tiện ích chung.`}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 border-t border-border-color dark:border-gray-700 pt-6">
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <p className="text-xs text-text-secondary dark:text-gray-400 font-bold uppercase tracking-widest">SỐ TẦNG</p>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">layers</span>
                  <span className="text-lg font-bold text-text-main dark:text-white">{totalFloors || '-'}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <p className="text-xs text-text-secondary dark:text-gray-400 font-bold uppercase tracking-widest">TỔNG SỐ PHÒNG</p>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">meeting_room</span>
                  <span className="text-lg font-bold text-text-main dark:text-white">{rooms.length}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <p className="text-xs text-text-secondary dark:text-gray-400 font-bold uppercase tracking-widest">PHÒNG TRỐNG</p>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="material-symbols-outlined text-green-500 text-xl font-bold">check_circle</span>
                  <span className="text-lg font-bold text-text-main dark:text-white">{availableRooms}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1 text-center sm:text-left">
                <p className="text-xs text-text-secondary dark:text-gray-400 font-bold uppercase tracking-widest">SỨC CHỨA PHÒNG</p>
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">bed</span>
                  <span className="text-lg font-bold text-text-main dark:text-white">{minCapacity}-{maxCapacity} giường</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Room List Header & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mt-4 px-1 sm:px-0">
          <div className="flex flex-col gap-1 shrink-0">
            <h3 className="text-xl font-bold text-text-main dark:text-white">Danh sách Phòng</h3>
            <p className="text-sm text-text-secondary dark:text-gray-400">Chọn phòng để xem chi tiết và quản lý</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handleCreateNewRoom}
              disabled={editingRoomId !== null}
              className="flex h-11 items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Tạo phòng mới"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span className="hidden sm:inline">Tạo phòng mới</span>
            </button>
            
              <Input
                placeholder="Tìm số phòng..."
                prefix={<SearchOutlined />}
                className="w-full h-11 gap-3 pl-1 flex-1"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            
            <div className="flex gap-3 w-full sm:w-auto">
              <Select 
                className="h-11 flex-1 sm:min-w-[160px]"
                value={filterFloor}
                onChange={(val) => {
                  setFilterFloor(val);
                  setCurrentPage(1);
                }}
                suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">expand_more</span>}
                options={floorOptions}
              />
              <Select 
                className="h-11 flex-1 sm:min-w-[160px]"
                value={filterStatus}
                onChange={(val) => {
                  setFilterStatus(val);
                  setCurrentPage(1);
                }}
                suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">filter_list</span>}
                options={[
                  { value: '', label: 'Trạng thái' },
                  { value: 'AVAILABLE', label: 'Còn trống' },
                  { value: 'FULL', label: 'Đã đầy' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Room Table */}
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden mb-8 min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-border-color dark:border-gray-700">
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Số phòng</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-center">Tầng</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-center">Sức chứa</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-center">Điều hòa</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-center">Nóng lạnh</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-center">Máy giặt</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Giá phòng / kỳ (VND)</th>
                  <th className="p-4 text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider text-right">Trạng thái</th>
                  <th className="p-4 text-right text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color dark:divide-gray-700">
                {/* New Room Row */}
                {editingRoomId === 0 && editFormData && (
                  <tr className="group bg-amber-50 dark:bg-amber-900/20 transition-colors">
                    <td className="p-4">
                      <Input
                        value={editFormData?.room_number || ''}
                        onChange={(e) => setEditFormData({ ...editFormData!, room_number: e.target.value })}
                        placeholder="Số phòng"
                        className="h-9"
                        prefix={<span className="hidden" />}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <Input
                        type="number"
                        value={editFormData?.floor || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val >= 0 || e.target.value === '') {
                            setEditFormData({ ...editFormData!, floor: val || 1 });
                          }
                        }}
                        placeholder="Tầng"
                        className="w-20 mx-auto h-9"
                        prefix={<span className="hidden" />}
                        min={0}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <Input
                        type="number"
                        value={editFormData?.max_capacity || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (val >= 0 || e.target.value === '') {
                            setEditFormData({ ...editFormData!, max_capacity: val || 4 });
                          }
                        }}
                        placeholder="Sức chứa"
                        className="w-20 mx-auto h-9"
                        prefix={<span className="hidden" />}
                        min={0}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <Checkbox
                        checked={editFormData?.has_ac ? true : false}
                        onChange={(e) => setEditFormData({ ...editFormData!, has_ac: e.target.checked ? 1 : 0 })}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <Checkbox
                        checked={editFormData?.has_heater ? true : false}
                        onChange={(e) => setEditFormData({ ...editFormData!, has_heater: e.target.checked ? 1 : 0 })}
                      />
                    </td>
                    <td className="p-4 text-center">
                      <Checkbox
                        checked={editFormData?.has_washer ? true : false}
                        onChange={(e) => setEditFormData({ ...editFormData!, has_washer: e.target.checked ? 1 : 0 })}
                      />
                    </td>
                    <td className="p-4">
                      <Input
                        type="number"
                        value={editFormData?.price_per_semester || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val >= 0 || e.target.value === '') {
                            setEditFormData({ ...editFormData!, price_per_semester: val || 0 });
                          }
                        }}
                        placeholder="Giá phòng"
                        className="h-9"
                        prefix={<span className="hidden" />}
                        min={0}
                      />
                    </td>
                    <td className="p-4 text-right">
                      <Select
                        value={editFormData?.status || ''}
                        onChange={(val) => setEditFormData({ ...editFormData!, status: val })}
                        options={[
                          { value: 'AVAILABLE', label: 'Còn trống' },
                          { value: 'FULL', label: 'Đã đầy' },
                        ]}
                        className="w-32 h-9"
                      />
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <button
                          onClick={handleSaveEdit}
                          disabled={updatingRoomId === 0}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                          title="Lưu"
                        >
                          <span className="material-symbols-outlined text-[20px]">save</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={updatingRoomId === 0}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                          title="Hủy"
                        >
                          <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                
                {paginatedRooms.length > 0 ? (
                  paginatedRooms.map((room) => (
                    <tr key={room.id} className={`group transition-colors ${editingRoomId === room.id ? 'bg-amber-50 dark:bg-amber-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}`}>
                      <td className="p-4">
                        {editingRoomId === room.id ? (
                          <Input
                            value={editFormData?.room_number || ''}
                            onChange={(e) => setEditFormData({ ...editFormData!, room_number: e.target.value })}
                            placeholder="Số phòng"
                            className="h-9"
                            prefix={<span className="hidden" />}
                          />
                        ) : (
                          <span className="font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">{room.room_number}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {editingRoomId === room.id ? (
                          <Input
                            type="number"
                            value={editFormData?.floor || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (val >= 0 || e.target.value === '') {
                                setEditFormData({ ...editFormData!, floor: val || 0 });
                              }
                            }}
                            placeholder="Tầng"
                            className="w-20 mx-auto h-9"
                            min={0}
                            prefix={<span className="hidden" />}
                          />
                        ) : (
                          <span className="text-sm text-text-main dark:text-white font-medium">{room.floor}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {editingRoomId === room.id ? (
                          <Input
                            type="number"
                            value={editFormData?.max_capacity || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (val >= 0 || e.target.value === '') {
                                setEditFormData({ ...editFormData!, max_capacity: val || 0 });
                              }
                            }}
                            placeholder="Sức chứa"
                            className="w-20 mx-auto h-9"
                            min={0}
                            prefix={<span className="hidden" />}
                          />
                        ) : (
                          <span className="text-sm text-text-main dark:text-white font-bold">{room.max_capacity}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {editingRoomId === room.id ? (
                          <Checkbox
                            checked={editFormData?.has_ac ? true : false}
                            onChange={(e) => setEditFormData({ ...editFormData!, has_ac: e.target.checked ? 1 : 0 })}
                          />
                        ) : (
                          <>
                            {room.has_ac ? (
                              <span className="material-symbols-outlined text-primary text-[20px] font-bold">ac_unit</span>
                            ) : (
                              <span className="material-symbols-outlined text-text-secondary/30 text-[20px]">close</span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {editingRoomId === room.id ? (
                          <Checkbox
                            checked={editFormData?.has_heater ? true : false}
                            onChange={(e) => setEditFormData({ ...editFormData!, has_heater: e.target.checked ? 1 : 0 })}
                          />
                        ) : (
                          <>
                            {room.has_heater ? (
                              <span className="material-symbols-outlined text-orange-500 text-[20px] font-bold">hot_tub</span>
                            ) : (
                              <span className="material-symbols-outlined text-text-secondary/30 text-[20px]">close</span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {editingRoomId === room.id ? (
                          <Checkbox
                            checked={editFormData?.has_washer ? true : false}
                            onChange={(e) => setEditFormData({ ...editFormData!, has_washer: e.target.checked ? 1 : 0 })}
                          />
                        ) : (
                          <>
                            {room.has_washer ? (
                              <span className="material-symbols-outlined text-blue-500 text-[20px] font-bold">local_laundry_service</span>
                            ) : (
                              <span className="material-symbols-outlined text-text-secondary/30 text-[20px]">close</span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="p-4">
                        {editingRoomId === room.id ? (
                          <Input
                            type="number"
                            value={editFormData?.price_per_semester || ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (val >= 0 || e.target.value === '') {
                                setEditFormData({ ...editFormData!, price_per_semester: val || 0 });
                              }
                            }}
                            className="h-9"
                            placeholder="Giá phòng"
                            min={0}
                            prefix={<span className="hidden" />}
                          />
                        ) : (
                          <span className="text-sm font-bold text-primary">{formatPrice(room.price_per_semester)}</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {editingRoomId === room.id ? (
                          <Select
                            value={editFormData?.status || ''}
                            onChange={(val) => setEditFormData({ ...editFormData!, status: val })}
                            options={[
                              { value: 'AVAILABLE', label: 'Còn trống' },
                              { value: 'FULL', label: 'Đã đầy' },
                            ]}
                            className="w-32 h-9"
                          />
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(room.status)} border-current/10`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${room.status.toUpperCase() === 'FULL' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                            {getStatusLabel(room.status)}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          {editingRoomId === room.id ? (
                            <>
                              <button
                                onClick={handleSaveEdit}
                                disabled={updatingRoomId === room.id}
                                className="p-1.5 rounded-lg text-text-secondary hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50"
                                title="Lưu"
                              >
                                <span className="material-symbols-outlined text-[20px]">save</span>
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={updatingRoomId === room.id}
                                className="p-1.5 rounded-lg text-text-secondary hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                title="Hủy"
                              >
                                <span className="material-symbols-outlined text-[20px]">close</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditRoom(room)}
                                className="p-1.5 rounded-lg text-text-secondary hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                title="Sửa thông tin"
                              >
                                <span className="material-symbols-outlined text-[20px]">edit_square</span>
                              </button>
                              <button onClick={() => handleDeleteRoom(room)} className="p-1.5 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Xóa phòng">
                                <span className="material-symbols-outlined text-[20px]">delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-text-secondary dark:text-gray-400">
                      Không tìm thấy phòng phù hợp với tiêu chí tìm kiếm
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {filteredRooms.length > 0 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={Math.ceil(filteredRooms.length / itemsPerPage)}
              totalItems={filteredRooms.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(val) => {
                setItemsPerPage(val);
                setCurrentPage(1);
              }}
            />
          )}
        </div>
      </div>

      <Modal
        title="Xác nhận xóa phòng"
        open={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        confirmLoading={deleting}
        okText="Xóa"
        okType="danger"
        cancelText="Hủy"
      >
        <p>Bạn có chắc chắn muốn xóa phòng <strong>{roomToDelete?.room_number}</strong>?</p>
        <p className="text-red-500 text-sm">Hành động này không thể hoàn tác.</p>
      </Modal>
    </DashboardLayout>
  );
};

export default BuildingDetail;