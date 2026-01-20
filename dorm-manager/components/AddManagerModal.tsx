import React from 'react';
import { Modal, Input, Select, message, Spin } from 'antd';
import { createManager, updateManager, getManagerById, ManagerProfile } from '../api/managerApi';

interface NewManagerForm {
  full_name: string;
  email: string;
  phone_number: string;
  building_id: string;
}

interface AddManagerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingData?: ManagerProfile;
  buildings?: any[];
}

const AddManagerModal: React.FC<AddManagerModalProps> = ({ isVisible, onClose, onSuccess, editingData, buildings = [] }) => {
  const [isCreating, setIsCreating] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(false);
  const isEditMode = Boolean(editingData?.id);
  const [form, setForm] = React.useState<NewManagerForm>({
    full_name: '',
    email: '',
    phone_number: '',
    building_id: '',
  });

  // Building options mapped from props or fallback to empty
  const buildingOptions = buildings.map((building: any) => ({
    label: building.building_name || building.name,
    value: building.id || building.building_id,
  }));

  // Fetch manager data when editingData changes
  React.useEffect(() => {
    if (isEditMode && editingData?.id) {
      const fetchManagerData = async () => {
        setIsLoadingData(true);
        try {
          const data = await getManagerById(editingData.id);
          setForm({
            full_name: data.full_name || '',
            email: data.email || '',
            phone_number: data.phone_number || '',
            building_id: data.building_id || '',
          });
        } catch (error: any) {
          message.error('Lỗi khi tải dữ liệu cán bộ');
          console.error('Error fetching manager data:', error);
        } finally {
          setIsLoadingData(false);
        }
      };

      fetchManagerData();
    }
  }, [editingData?.id, isEditMode]);

  const handleOpenChange = (visible: boolean) => {
    if (!visible) {
      handleClose();
    }
  };

  const handleClose = () => {
    setForm({
      full_name: '',
      email: '',
      phone_number: '',
      building_id: '',
    });
    onClose();
  };

  const handleCreateManager = async () => {
    if (!form.full_name || !form.email || !form.phone_number || !form.building_id) {
      message.error('Vui lòng nhập đầy đủ thông tin bắt buộc');
      return;
    }

    setIsCreating(true);
    try {
      const submitData: any = {
        full_name: form.full_name,
        email: form.email,
        phone_number: form.phone_number,
        building_id: form.building_id,
      };

      if (isEditMode && editingData) {
        await updateManager(editingData.id, submitData);
        message.success('Cập nhật cán bộ thành công');
      } else {
        await createManager(submitData);
        message.success('Thêm cán bộ mới thành công');
      }
      
      handleClose();
      onSuccess();
    } catch (error: any) {
      message.error(isEditMode ? 'Lỗi khi cập nhật cán bộ' : 'Lỗi khi thêm cán bộ mới');
      console.error(isEditMode ? 'Error updating manager:' : 'Error creating manager:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 size-10">
            <span className="material-symbols-outlined text-[20px]">{isEditMode ? 'edit' : 'add_circle'}</span>
          </div>
          <span className="text-base font-bold text-text-main dark:text-white">{isEditMode ? 'Chỉnh sửa cán bộ' : 'Thêm cán bộ mới'}</span>
        </div>
      }
      open={isVisible}
      onCancel={handleClose}
      onOpenChange={handleOpenChange}
      footer={[
        <button
          key="cancel"
          onClick={handleClose}
          className="h-10 px-6 mr-2 rounded-lg border border-border-light dark:border-border-dark text-text-main dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          disabled={isCreating || isLoadingData}
        >
          Hủy
        </button>,
        <button
          key="submit"
          onClick={handleCreateManager}
          className="h-10 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isCreating || isLoadingData}
        >
          {isCreating ? (isEditMode ? 'Đang cập nhật...' : 'Đang thêm...') : (isEditMode ? 'Cập nhật cán bộ' : 'Thêm cán bộ')}
        </button>,
      ]}
      width={600}
      centered
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      {isLoadingData ? (
        <div className="flex justify-center items-center py-12">
          <Spin tip="Đang tải dữ liệu..." />
        </div>
      ) : (
      <div className="py-4">
        {/* Row 1: Full Name, Email */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Nhập họ và tên"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="h-10"
              prefix={<span className="hidden" />}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="Nhập email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-10"
              prefix={<span className="hidden" />}
            />
          </div>
        </div>

        {/* Row 2: Phone, Building */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Nhập số điện thoại"
              value={form.phone_number}
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
              className="h-10"
              prefix={<span className="hidden" />}
            />
          </div>

          {/* Building */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Tòa nhà <span className="text-red-500">*</span>
            </label>
            <Select
              className='h-10'
              style={{ width: '100%' }}
              placeholder="Chọn tòa nhà"
              value={form.building_id || undefined}
              onChange={(value) => setForm({ ...form, building_id: value })}
              options={buildingOptions}
            />
          </div>
        </div>


      </div>
      )}
    </Modal>
  );
};

export default AddManagerModal;
