import React from 'react';
import { Modal, Input, Select, DatePicker, message, Spin } from 'antd';
import dayjs from 'dayjs';
import { createServicePrice, updateServicePrice, getServicePriceById } from '../api/servicePriceApi';
import { ServicePrice } from '../api/servicePriceApi';

interface NewServiceForm {
  service_name: string;
  unit: string;
  unit_price: string;
  apply_date: string;
  is_active: number;
}

interface AddServicePriceModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingData?: ServicePrice;
}

const AddServicePriceModal: React.FC<AddServicePriceModalProps> = ({ isVisible, onClose, onSuccess, editingData }) => {
  const [isCreating, setIsCreating] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(false);
  const isEditMode = Boolean(editingData?.id);
  const [form, setForm] = React.useState<NewServiceForm>({
    service_name: '',
    unit: '',
    unit_price: '',
    apply_date: new Date().toISOString().split('T')[0],
    is_active: 1,
  });

  // Fetch service price data when editingData changes
  React.useEffect(() => {
    if (isEditMode && editingData?.id) {
      const fetchServiceData = async () => {
        setIsLoadingData(true);
        try {
          const data = await getServicePriceById(editingData.id);
          if (data) {
            setForm({
              service_name: data.service_name || '',
              unit: data.unit || '',
              unit_price: data.unit_price.toString() || '',
              apply_date: data.apply_date || '',
              is_active: data.is_active || 1,
            });
          }
        } catch (error: any) {
          message.error('Lỗi khi tải dữ liệu dịch vụ');
          console.error('Error fetching service price data:', error);
        } finally {
          setIsLoadingData(false);
        }
      };

      fetchServiceData();
    }
  }, [editingData?.id, isEditMode]);

  const handleOpenChange = (visible: boolean) => {
    if (!visible) {
      handleClose();
    }
  };

  const handleClose = () => {
    setForm({
      service_name: '',
      unit: '',
      unit_price: '',
      apply_date: new Date().toISOString().split('T')[0],
      is_active: 1,
    });
    onClose();
  };

  const handleCreateService = async () => {
    if (!form.service_name || !form.unit || !form.unit_price || !form.apply_date) {
      message.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsCreating(true);
    try {
      const submitData = {
        service_name: form.service_name,
        unit: form.unit,
        unit_price: parseFloat(form.unit_price),
        apply_date: form.apply_date,
        is_active: form.is_active,
      };

      if (isEditMode && editingData) {
        await updateServicePrice(editingData.id, submitData);
        message.success('Cập nhật dịch vụ thành công');
      } else {
        await createServicePrice(submitData);
        message.success('Thêm dịch vụ mới thành công');
      }
      handleClose();
      onSuccess();
    } catch (error: any) {
      message.error(isEditMode ? 'Lỗi khi cập nhật dịch vụ' : 'Lỗi khi thêm dịch vụ mới');
      console.error(isEditMode ? 'Error updating service price:' : 'Error creating service price:', error);
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
          <span className="text-base font-bold text-text-main dark:text-white">{isEditMode ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}</span>
        </div>
      }
      open={isVisible}
      onCancel={handleClose}
      onOpenChange={handleOpenChange}
      footer={[
        <button
          key="cancel"
          onClick={handleClose}
          className="h-10 px-6 mr-3 rounded-lg border border-border-light dark:border-border-dark text-text-main dark:text-white font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          disabled={isCreating || isLoadingData}
        >
          Hủy
        </button>,
        <button
          key="submit"
          onClick={handleCreateService}
          className="h-10 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isCreating || isLoadingData}
        >
          {isCreating ? (isEditMode ? 'Đang cập nhật...' : 'Đang thêm...') : (isEditMode ? 'Cập nhật dịch vụ' : 'Thêm dịch vụ')}
        </button>,
      ]}
      width={500}
      centered
    >
      {isLoadingData ? (
        <div className="flex justify-center items-center py-12">
          <Spin tip="Đang tải dữ liệu..." />
        </div>
      ) : (
      <div className="space-y-5 py-4">
        {/* Service Name */}
        <div>
          <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
            Tên dịch vụ <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="Ví dụ: Điện sinh hoạt"
            value={form.service_name}
            onChange={(e) => setForm({ ...form, service_name: e.target.value })}
            className="h-10"
            prefix={<span className="hidden" />}
          />
        </div>

        {/* Unit */}
        <div>
          <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
            Đơn vị <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="Ví dụ: kWh, m³, tháng"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            className="h-10"
            prefix={<span className="hidden" />}
          />
        </div>

        {/* Unit Price */}
        <div>
          <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
            Giá <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            placeholder="Ví dụ: 3500"
            value={form.unit_price}
            onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
            className="h-10"
            min="0"
            step="0.01"
            prefix={<span className="hidden" />}
          />
        </div>

        {/* Apply Date */}
        <div>
          <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
            Ngày áp dụng <span className="text-red-500">*</span>
          </label>
          <DatePicker
            format="DD/MM/YYYY"
            value={form.apply_date ? dayjs(form.apply_date) : null}
            onChange={(date) => setForm({ ...form, apply_date: date ? date.format('YYYY-MM-DD') : '' })}
            style={{ width: '100%' }}
            className="h-10"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
            Trạng thái <span className="text-red-500">*</span>
          </label>
          <Select
            className="h-10"
            style={{ width: '100%' }}
            value={form.is_active}
            onChange={(value) => setForm({ ...form, is_active: value })}
            options={[
              { label: 'Đang áp dụng', value: 1 },
              { label: 'Ngừng áp dụng', value: 0 },
            ]}
          />
        </div>
      </div>
      )}
    </Modal>
  );
};

export default AddServicePriceModal;
