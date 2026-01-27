import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Checkbox,
} from "antd";
import RoleBasedLayout from "../layouts/RoleBasedLayout";
import RoomTable, { Room } from "../components/RoomTable";
import { AuthContext } from "../App";
import {
  getAllRooms,
  updateRoom,
  deleteRoom,
  createRoom,
  fetchBuildings,
} from "../api";

const RoomManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBuilding, setFilterBuilding] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // console.log('User role in RoomManagement:', user);

  // Fetch rooms and buildings on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [roomsData, buildingsData] = await Promise.all([
          getAllRooms(),
          fetchBuildings(),
        ]);
        setRooms(roomsData);
        setBuildings(buildingsData);
      } catch (error: any) {
        message.error("Lỗi khi tải dữ liệu");
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEditRoom = async (updatedRoom: Room) => {
    try {
      await updateRoom(updatedRoom.id, updatedRoom);
      message.success({
        content: `Đã cập nhật phòng ${updatedRoom.room_number} thành công`,
        duration: 2,
      });
      setRooms(rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Không thể cập nhật phòng";
      message.error({
        content: `Cập nhật phòng ${updatedRoom.room_number} thất bại: ${errorMsg}`,
        duration: 3,
      });
      console.error("Error updating room:", err);
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
      setRooms(rooms.filter((r) => r.id !== deletedRoom.id));
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "Không thể xóa phòng";
      message.error({
        content: `Xóa phòng ${deletedRoom.room_number} thất bại: ${errorMsg}`,
        duration: 3,
      });
      console.error("Error deleting room:", err);
      throw err;
    }
  };

  const handleShowModal = () => {
    setIsModalVisible(true);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCreateRoom = async (values: any) => {
    setIsSubmitting(true);
    try {
      // Convert checkbox boolean values to 0/1 for database
      const roomData = {
        ...values,
        has_ac: values.has_ac ? 1 : 0,
        has_heater: values.has_heater ? 1 : 0,
        has_washer: values.has_washer ? 1 : 0,
        status: values.status || "AVAILABLE",
      };

      const newRoom = await createRoom(roomData);
      message.success({
        content: `Đã thêm phòng ${values.room_number} thành công`,
        duration: 2,
      });
      setRooms([...rooms, newRoom]);
      setIsModalVisible(false);
      form.resetFields();
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || "Không thể thêm phòng";
      message.error({
        content: `Thêm phòng thất bại: ${errorMsg}`,
        duration: 3,
      });
      console.error("Error creating room:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoomClick = (roomId: number) => {
    navigate(`/${user.role}/rooms/${roomId}`);
  };

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    const matchSearch = room.room_number
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchBuilding =
      !filterBuilding || room.building_id.toString() === filterBuilding;
    const matchStatus = !filterStatus || room.status === filterStatus;
    return matchSearch && matchBuilding && matchStatus;
  });

  // Calculate stats from real data
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE").length;
  const occupiedRooms = rooms.filter((r) => r.status === "FULL").length;
  const maintenanceRooms = 0; // Since we only have AVAILABLE/FULL status, we'll show 0

  // Calculate percentages
  const availablePercent =
    totalRooms > 0 ? Math.round((availableRooms / totalRooms) * 100) : 0;
  const occupiedPercent =
    totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return (
    <RoleBasedLayout
      searchPlaceholder="Tìm kiếm phòng, sinh viên..."
      headerTitle="Quản lý Phòng"
    >
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        {/* Page Heading & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-text-main dark:text-white md:text-3xl">
              Quản lý Phòng
            </h2>
            <p className="mt-1 text-sm text-text-secondary dark:text-gray-400 font-medium">
              Xem và cập nhật thông tin chi tiết các phòng ký túc xá.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleShowModal}
              className="inline-flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white px-5 py-2.5 text-sm font-bold shadow-sm transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Thêm phòng mới
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark px-5 py-2.5 text-sm font-bold text-text-main dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-all active:scale-95">
              <span className="material-symbols-outlined text-[20px]">
                file_download
              </span>
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
                <p className="text-sm font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest">
                  Tổng số phòng
                </p>
                <p className="mt-2 text-3xl font-bold text-text-main dark:text-white">
                  {totalRooms}
                </p>
              </div>
              <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 text-primary">
                <span className="material-symbols-outlined text-2xl font-bold">
                  apartment
                </span>
              </div>
            </div>
          </div>
          {/* Available */}
          <div className="rounded-2xl border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest">
                  Còn trống
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-text-main dark:text-white">
                    {availableRooms}
                  </p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                    {availablePercent}%
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 p-4 text-emerald-600">
                <span className="material-symbols-outlined text-2xl font-bold">
                  check_circle
                </span>
              </div>
            </div>
          </div>
          {/* Occupied */}
          <div className="rounded-2xl border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest">
                  Đã ở
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-text-main dark:text-white">
                    {occupiedRooms}
                  </p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                    {occupiedPercent}%
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-purple-50 dark:bg-purple-900/20 p-4 text-purple-600">
                <span className="material-symbols-outlined text-2xl font-bold">
                  groups
                </span>
              </div>
            </div>
          </div>
          {/* Maintenance */}
          <div className="rounded-2xl border border-border-color dark:border-gray-700 bg-white dark:bg-surface-dark p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest">
                  Bảo trì
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-text-main dark:text-white">
                    {maintenanceRooms}
                  </p>
                  <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                    0%
                  </span>
                </div>
              </div>
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-4 text-red-600">
                <span className="material-symbols-outlined text-2xl font-bold">
                  build_circle
                </span>
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
          filterBuilding={filterBuilding}
          onBuildingChange={setFilterBuilding}
          buildings={buildings}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
        />

        {/* Modal thêm phòng mới */}
        <Modal
          title="Thêm phòng mới"
          open={isModalVisible}
          onCancel={handleCancel}
          okText="Thêm"
          cancelText="Hủy"
          confirmLoading={isSubmitting}
          onOk={() => form.submit()}
          width={600}
          centered
        >
          <Form form={form} layout="vertical" onFinish={handleCreateRoom}>
            <Form.Item
              label="Tòa nhà"
              name="building_id"
              rules={[{ required: true, message: "Vui lòng chọn tòa nhà" }]}
            >
              <Select
                placeholder="Chọn tòa nhà"
                options={buildings.map((building: any) => ({
                  value: building.id,
                  label: building.name,
                }))}
                className="h-10"
              />
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label="Mã phòng"
                name="room_number"
                rules={[
                  { required: true, message: "Vui lòng nhập mã phòng" },
                  { min: 1, message: "Mã phòng không được để trống" },
                ]}
              >
                <Input
                  placeholder="Ví dụ: A101"
                  className="h-10"
                  prefix={<span className="hidden" />}
                />
              </Form.Item>

              <Form.Item
                label="Tầng"
                name="floor"
                rules={[{ required: true, message: "Vui lòng nhập số tầng" }]}
              >
                <InputNumber
                  min={1}
                  placeholder="Ví dụ: 1"
                  className="w-full h-10"
                />
              </Form.Item>
            </div>

            <Form.Item
              label="Sức chứa (Người)"
              name="max_capacity"
              rules={[{ required: true, message: "Vui lòng nhập sức chứa" }]}
            >
              <InputNumber
                min={1}
                placeholder="Ví dụ: 4"
                className="w-full h-10"
              />
            </Form.Item>

            <Form.Item
              label="Giá phòng/Kỳ (VND)"
              name="price_per_semester"
              rules={[{ required: true, message: "Vui lòng nhập giá phòng" }]}
            >
              <InputNumber
                min={0}
                placeholder="Ví dụ: 2000000"
                className="w-full h-10"
                formatter={(value) =>
                  value ? value.toLocaleString("vi-VN") : ""
                }
                parser={(value: any) => (value ? value.replace(/\./g, "") : 0)}
              />
            </Form.Item>

            <div className="space-y-3">
              <p className="text-sm font-bold text-text-main dark:text-white">
                Tiện nghi
              </p>
              <div className="grid grid-cols-3 gap-4">
                <Form.Item
                  label={null}
                  name="has_ac"
                  valuePropName="checked"
                  className="mb-0"
                >
                  <Checkbox>Có điều hòa</Checkbox>
                </Form.Item>

                <Form.Item
                  label={null}
                  name="has_heater"
                  valuePropName="checked"
                  className="mb-0"
                >
                  <Checkbox>Có nóng lạnh</Checkbox>
                </Form.Item>

                <Form.Item
                  label={null}
                  name="has_washer"
                  valuePropName="checked"
                  className="mb-0"
                >
                  <Checkbox>Có máy giặt</Checkbox>
                </Form.Item>
              </div>
            </div>
          </Form>
        </Modal>
      </div>
    </RoleBasedLayout>
  );
};

export default RoomManagement;
