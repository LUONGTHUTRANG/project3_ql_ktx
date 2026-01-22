import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import RoomTable, { Room } from '../components/RoomTable';
import { AuthContext } from '../App';
import { getAllRooms, updateRoom, deleteRoom } from '../api/roomApi';

const RoomManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // console.log('User role in RoomManagement:', user);

  // Fetch rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      setIsLoading(true);
      try {
        const data = await getAllRooms();
        setRooms(data);
      } catch (error: any) {
        message.error('Lỗi khi tải danh sách phòng');
        console.error('Error fetching rooms:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRooms();
  }, []);

  const handleEditRoom = async (updatedRoom: Room) => {
    try {
      await updateRoom(updatedRoom.id, updatedRoom);
      message.success({
        content: `Đã cập nhật phòng ${updatedRoom.room_number} thành công`,
        duration: 2,
      });
      setRooms(rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Không thể cập nhật phòng';
      message.error({
        content: `Cập nhật phòng ${updatedRoom.room_number} thất bại: ${errorMsg}`,
        duration: 3,
      });
      console.error('Error updating room:', err);
      throw err;
    }
  };

  const handleDeleteRoom = async (deletedRoom: Room) => {
    try {
      await deleteRoom(deletedRoom.id);
      message.success({
        content: `Đã xóa phòng ${deletedRoom.room_number} thành công`,
        duration: 2,
      });
      setRooms(rooms.filter(r => r.id !== deletedRoom.id));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Không thể xóa phòng';
      message.error({
        content: `Xóa phòng ${deletedRoom.room_number} thất bại: ${errorMsg}`,
        duration: 3,
      });
      console.error('Error deleting room:', err);
      throw err;
    }
  };

  const handleRoomClick = (roomId: number) => {
    navigate(`/manager/rooms/${roomId}`);
  };

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFloor = !filterFloor || room.floor.toString() === filterFloor;
    const matchStatus = !filterStatus || room.status === filterStatus;
    return matchSearch && matchFloor && matchStatus;
  });

  // Calculate stats from real data
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'AVAILABLE').length;
  const occupiedRooms = rooms.filter(r => r.status === 'FULL').length;
  const maintenanceRooms = 0; // Since we only have AVAILABLE/FULL status, we'll show 0

  // Calculate percentages
  const availablePercent = totalRooms > 0 ? Math.round((availableRooms / totalRooms) * 100) : 0;
  const occupiedPercent = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm kiếm phòng, sinh viên..."
      headerTitle="Quản lý Phòng"
    >
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        
        {/* Page Heading & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text-main dark:text-white md:text-3xl">Quản lý Phòng</h2>
            <p className="mt-1 text-sm text-text-secondary dark:text-gray-400 font-medium">Xem và cập nhật thông tin chi tiết các phòng ký túc xá.</p>
          </div>
          <div className="flex gap-3">
            <button className="inline-flex items-center gap-2 rounded-xl border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark px-5 py-2.5 text-sm font-bold text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">file_download</span>
              Xuất Excel
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Rooms */}
          <div className="rounded-2xl border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest">Tổng số phòng</p>
                <p className="mt-2 text-3xl font-bold text-text-main dark:text-white">{totalRooms}</p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 text-primary">
                <span className="material-symbols-outlined text-2xl font-bold">apartment</span>
              </div>
            </div>
          </div>
          {/* Available */}
          <div className="rounded-2xl border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest">Còn trống</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-text-main dark:text-white">{availableRooms}</p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">{availablePercent}%</span>
                </div>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4 text-emerald-600">
                <span className="material-symbols-outlined text-2xl font-bold">check_circle</span>
              </div>
            </div>
          </div>
          {/* Occupied */}
          <div className="rounded-2xl border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest">Đã ở</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-text-main dark:text-white">{occupiedRooms}</p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">{occupiedPercent}%</span>
                </div>
              </div>
              <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-4 text-purple-600">
                <span className="material-symbols-outlined text-2xl font-bold">groups</span>
              </div>
            </div>
          </div>
          {/* Maintenance */}
          <div className="rounded-2xl border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest">Bảo trì</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-text-main dark:text-white">{maintenanceRooms}</p>
                  <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">0%</span>
                </div>
              </div>
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-red-600">
                <span className="material-symbols-outlined text-2xl font-bold">build_circle</span>
              </div>
            </div>
          </div>
        </div>

        {/* Room Table Component */}
        <RoomTable
          rooms={filteredRooms}
          isLoading={isLoading}
          onEdit={handleEditRoom}
          onDelete={handleDeleteRoom}
          onRoomClick={handleRoomClick}
          userRole={user?.role.toUpperCase()}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterFloor={filterFloor}
          onFloorChange={setFilterFloor}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
        />
      </div>
    </RoleBasedLayout>
  );
};

export default RoomManagement;