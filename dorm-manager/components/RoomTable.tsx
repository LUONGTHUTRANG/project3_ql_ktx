import React, { useState } from 'react';
import { Input, Select, Checkbox, Modal, message, Spin } from 'antd';
import { SearchOutlined } from "@ant-design/icons";
import Pagination from './Pagination';

export interface Room {
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
}

interface RoomTableProps {
  rooms: Room[];
  isLoading?: boolean;
  onEdit?: (room: Room) => void;
  onDelete?: (room: Room) => void;
  onRoomClick?: (roomId: number) => void;
  userRole?: string;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  filterFloor?: string;
  onFloorChange?: (floor: string) => void;
  filterStatus?: string;
  onStatusChange?: (status: string) => void;
  showEditDelete?: boolean; // Show edit/delete buttons for ADMIN only
}

const RoomTable: React.FC<RoomTableProps> = ({
  rooms,
  isLoading = false,
  onEdit,
  onDelete,
  onRoomClick,
  userRole = 'ADMIN',
  searchTerm = '',
  onSearchChange,
  filterFloor = '',
  onFloorChange,
  filterStatus = '',
  onStatusChange,
  showEditDelete = true,
}) => {
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Room> | null>(null);
  const [updatingRoomId, setUpdatingRoomId] = useState<number | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const floorOptions = [
    { value: '', label: 'Tất cả Tầng' },
    { value: '1', label: 'Tầng 1' },
    { value: '2', label: 'Tầng 2' },
    { value: '3', label: 'Tầng 3' },
    { value: '4', label: 'Tầng 4' },
    { value: '5', label: 'Tầng 5' },
  ];

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
    if (!roomToDelete || !onDelete) return;
    try {
      setDeleting(true);
      await onDelete(roomToDelete);
      setDeleteModalVisible(false);
      setRoomToDelete(null);
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
    if (!editFormData || editingRoomId === null || !onEdit) return;
    try {
      setUpdatingRoomId(editingRoomId);
      await onEdit(editFormData as Room);
      setEditingRoomId(null);
      setEditFormData(null);
    } finally {
      setUpdatingRoomId(null);
    }
  };

  // Filter rooms based on search and filter criteria
  const filteredRooms = rooms.filter((room) => {
    const matchSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFloor = !filterFloor || room.floor.toString() === filterFloor;
    const matchStatus = !filterStatus || room.status.toLowerCase() === filterStatus.toLowerCase();
    return matchSearch && matchFloor && matchStatus;
  });

  // Calculate paginated rooms
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      {/* Filters & Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mt-4 px-1 sm:px-0">
        <div className="flex flex-col gap-1 shrink-0">
          <h3 className="text-xl font-bold text-text-main dark:text-white">Danh sách Phòng</h3>
          <p className="text-sm text-text-secondary dark:text-gray-400">Chọn phòng để xem chi tiết và quản lý</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <Input
            placeholder="Tìm số phòng..."
            prefix={<SearchOutlined />}
            className="w-full h-11 gap-3 pl-1 flex-1"
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
          
          <div className="flex gap-3 w-full sm:w-auto">
            <Select 
              className="h-11 flex-1 sm:min-w-[160px]"
              value={filterFloor}
              onChange={onFloorChange}
              suffixIcon={<span className="material-symbols-outlined text-[20px] text-text-secondary">expand_more</span>}
              options={floorOptions}
            />
            <Select 
              className="h-11 flex-1 sm:min-w-[160px]"
              value={filterStatus}
              onChange={onStatusChange}
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
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Spin size="large" tip="Đang tải dữ liệu..." />
          </div>
        ) : (
          <>
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
                    {userRole === 'ADMIN' || userRole === 'MANAGER' && (
                      <th className="p-4 text-right text-xs font-semibold text-text-secondary dark:text-gray-400 uppercase tracking-wider">Thao tác</th>
                    )}
                  </tr>
                </thead>
            <tbody className="divide-y divide-border-color dark:divide-gray-700">
              {paginatedRooms.length > 0 ? (
                paginatedRooms.map((room) => (
                  <tr key={room.id} className={`group transition-colors ${editingRoomId === room.id ? 'bg-amber-50 dark:bg-amber-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}>
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
                        <button 
                          onClick={() => onRoomClick?.(room.id)}
                          className="font-bold text-text-main dark:text-white hover:text-primary transition-colors"
                        >
                          {room.room_number}
                        </button>
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
                              setEditFormData({ ...editFormData!, floor: val || 1 });
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
                              setEditFormData({ ...editFormData!, max_capacity: val || 4 });
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
                          placeholder="Giá phòng"
                          className="h-9"
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
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                          room.status === 'AVAILABLE' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-900/50' 
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50'
                        }`}>
                          {getStatusLabel(room.status)}
                        </span>
                      )}
                    </td>
                    {userRole === 'ADMIN' || userRole === 'MANAGER' && (
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
                                onClick={() => onRoomClick?.(room.id)}
                                className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Xem chi tiết"
                              >
                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                              </button>
                              {showEditDelete && (
                                <>
                                  <button 
                                    onClick={() => handleEditRoom(room)}
                                    className="p-1.5 rounded-lg text-text-secondary hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                    title="Chỉnh sửa"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">edit_square</span>
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteRoom(room)}
                                    className="p-1.5 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Xóa"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={userRole === 'ADMIN' ? 9 : 8} className="p-8 text-center text-text-secondary dark:text-gray-400">
                    Không tìm thấy phòng phù hợp với tiêu chí tìm kiếm
                  </td>
                </tr>
              )}
            </tbody>
              </table>
            </div>

            {/* Pagination */}
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
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Xác nhận xóa phòng"
        open={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={() => !deleting && setDeleteModalVisible(false)}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true, loading: deleting }}
        centered
      >
        <p>Bạn có chắc chắn muốn xóa phòng <strong>{roomToDelete?.room_number}</strong>?</p>
        <p className="text-sm text-text-secondary dark:text-gray-400 mt-2">Hành động này không thể hoàn tác.</p>
      </Modal>
    </>
  );
};

export default RoomTable;
