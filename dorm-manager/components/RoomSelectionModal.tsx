import React, { useState, useEffect } from 'react';
import { Modal, Button, message, Spin, Tag, Divider } from 'antd';
import { getAvailableRooms, AvailableRoom } from '../api_handlers/roomApi';
import { getActiveSemester } from '../api_handlers/semesterApi';
import { fetchBuildings } from '../api';

interface RoomSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectRoom: (roomId: number, roomInfo: AvailableRoom) => void;
    registrationType?: 'NORMAL' | 'PRIORITY' | 'RENEWAL';
}

const RoomSelectionModal: React.FC<RoomSelectionModalProps> = ({
    visible,
    onClose,
    onSelectRoom,
    registrationType = 'NORMAL'
}) => {
    const [loading, setLoading] = useState(false);
    const [buildings, setBuildings] = useState<any[]>([]);
    const [selectedBuildingId, setSelectedBuildingId] = useState<number | null>(null);
    const [rooms, setRooms] = useState<AvailableRoom[]>([]);
    const [semesterId, setSemesterId] = useState<number | null>(null);

    useEffect(() => {
        if (visible) {
            loadData();
        }
    }, [visible]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Get active semester
            const semester = await getActiveSemester();
            if (!semester) {
                message.error('Không có kỳ học đang hoạt động');
                return;
            }
            setSemesterId(semester.id);

            // Get all buildings
            const buildingsData = await fetchBuildings();
            
            // Both NORMAL and PRIORITY can see all buildings
            // Floor-based filtering will be applied when loading rooms
            setBuildings(buildingsData);

        } catch (error: any) {
            message.error('Lỗi khi tải dữ liệu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const loadRoomsByBuilding = async (buildingId: number) => {
        console.log('Loading rooms for building:', buildingId, semesterId);
        if (!semesterId) return;
        
        try {
            setLoading(true);
            setSelectedBuildingId(buildingId);
            
            let roomsData = await getAvailableRooms(semesterId, buildingId);
            
            // No floor restrictions - show all available rooms
            setRooms(roomsData);
            
            if (roomsData.length === 0) {
                message.info('Tòa nhà này không còn phòng trống');
            }
        } catch (error: any) {
            message.error('Lỗi khi tải danh sách phòng: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRoom = (room: AvailableRoom) => {
        onSelectRoom(room.id, room);
        onClose();
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const getGenderTag = (gender: string) => {
        const colors: any = {
            'MALE': 'blue',
            'FEMALE': 'pink',
            'MIXED': 'purple'
        };
        const labels: any = {
            'MALE': 'Nam',
            'FEMALE': 'Nữ',
            'MIXED': 'Nam/Nữ'
        };
        return <Tag color={colors[gender]}>{labels[gender]}</Tag>;
    };

    return (
        <Modal
            title="Chọn phòng ở"
            open={visible}
            onCancel={onClose}
            footer={null}
            width={900}
            style={{ top: 20 }}
        >
            <Spin spinning={loading}>
                {!selectedBuildingId ? (
                    // Step 1: Select Building
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Chọn tòa nhà:</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {buildings.map((building) => (
                                <div
                                    key={building.id}
                                    onClick={() => loadRoomsByBuilding(building.id)}
                                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all text-center"
                                >
                                    <h4 className="text-xl font-bold mb-2">{building.name}</h4>
                                    <div className="text-gray-600 dark:text-gray-400">{building.location}</div>
                                    <div className="mt-2">
                                        {getGenderTag(building.gender_restriction)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Step 2: Select Room
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                Danh sách phòng trống - {buildings.find(b => b.id === selectedBuildingId)?.name}
                            </h3>
                            <Button onClick={() => setSelectedBuildingId(null)}>
                                ← Quay lại chọn tòa
                            </Button>
                        </div>

                        <Divider />

                        {rooms.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                Không có phòng trống
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {rooms.map((room) => (
                                    <div
                                        key={room.id}
                                        onClick={() => handleSelectRoom(room)}
                                        className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-all"
                                    >
                                        <div className="text-center">
                                            <h4 className="text-xl font-bold mb-2">
                                                Phòng {room.room_number}
                                            </h4>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                Tầng {room.floor}
                                            </div>
                                            
                                            <Divider style={{ margin: '12px 0' }} />
                                            
                                            <div className="space-y-2 text-left">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Sức chứa:</span>
                                                    <span className="font-semibold">
                                                        {room.current_occupancy}/{room.max_capacity} người
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Còn trống:</span>
                                                    <span className="font-semibold text-green-600">
                                                        {room.available_slots} chỗ
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600 dark:text-gray-400">Giá/kỳ:</span>
                                                    <span className="font-semibold text-blue-600">
                                                        {formatPrice(room.price_per_semester)}
                                                    </span>
                                                </div>
                                                
                                                <Divider style={{ margin: '12px 0' }} />
                                                
                                                <div className="flex flex-wrap gap-1">
                                                    {room.has_ac === 1 && (
                                                        <Tag color="cyan">Điều hòa</Tag>
                                                    )}
                                                    {room.has_heater === 1 && (
                                                        <Tag color="orange">Nóng lạnh</Tag>
                                                    )}
                                                    {room.has_washer === 1 && (
                                                        <Tag color="blue">Máy giặt</Tag>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Spin>
        </Modal>
    );
};

export default RoomSelectionModal;
