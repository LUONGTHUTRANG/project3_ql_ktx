import React from 'react';
import { Modal, Input, Select, DatePicker, message, Spin } from 'antd';
import dayjs from 'dayjs';
import { createSemester, updateSemester, getSemesterById } from '../api/semesterApi';

interface NewSemesterForm {
  term: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  registration_open_date: string;
  registration_close_date: string;
  registration_special_open_date: string;
  registration_special_close_date: string;
  renewal_open_date: string;
  renewal_close_date: string;
  is_active: number;
}

interface AddSemesterModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingData?: any;
}

const AddSemesterModal: React.FC<AddSemesterModalProps> = ({ isVisible, onClose, onSuccess, editingData }) => {
  const [isCreating, setIsCreating] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(false);
  const isEditMode = Boolean(editingData?.id);
  const [form, setForm] = React.useState<NewSemesterForm>({
    term: '',
    academic_year: '',
    start_date: '',
    end_date: '',
    registration_open_date: '',
    registration_close_date: '',
    registration_special_open_date: '',
    registration_special_close_date: '',
    renewal_open_date: '',
    renewal_close_date: '',
    is_active: 1,
  });

  // Fetch semester data when editingData changes
  React.useEffect(() => {
    if (isEditMode && editingData?.id) {
      const fetchSemesterData = async () => {
        setIsLoadingData(true);
        try {
          const data = await getSemesterById(editingData.id);
          setForm({
            term: data.term || '',
            academic_year: data.academic_year || '',
            start_date: data.start_date || '',
            end_date: data.end_date || '',
            registration_open_date: data.registration_open_date || '',
            registration_close_date: data.registration_close_date || '',
            registration_special_open_date: data.registration_special_open_date || '',
            registration_special_close_date: data.registration_special_close_date || '',
            renewal_open_date: data.renewal_open_date || '',
            renewal_close_date: data.renewal_close_date || '',
            is_active: data.is_active ?? 1,
          });
        } catch (error: any) {
          message.error('Lỗi khi tải dữ liệu kỳ ở');
          console.error('Error fetching semester data:', error);
        } finally {
          setIsLoadingData(false);
        }
      };

      fetchSemesterData();
    }
  }, [editingData?.id, isEditMode]);

  const handleOpenChange = (visible: boolean) => {
    if (!visible) {
      handleClose();
    }
  };

  const handleClose = () => {
    setForm({
      term: '',
      academic_year: '',
      start_date: '',
      end_date: '',
      registration_open_date: '',
      registration_close_date: '',
      registration_special_open_date: '',
      registration_special_close_date: '',
      renewal_open_date: '',
      renewal_close_date: '',
      is_active: 1,
    });
    onClose();
  };

  const handleCreateSemester = async () => {
    if (!form.term || !form.academic_year || !form.start_date || !form.end_date || !form.registration_open_date || !form.registration_close_date || !form.registration_special_open_date || !form.registration_special_close_date || !form.renewal_open_date || !form.renewal_close_date) {
      message.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsCreating(true);
    try {
      const submitData = {
        term: form.term,
        academic_year: form.academic_year,
        start_date: form.start_date,
        end_date: form.end_date,
        registration_open_date: form.registration_open_date,
        registration_close_date: form.registration_close_date,
        registration_special_open_date: form.registration_special_open_date,
        registration_special_close_date: form.registration_special_close_date,
        renewal_open_date: form.renewal_open_date,
        renewal_close_date: form.renewal_close_date,
        is_active: form.is_active,
      };

      if (isEditMode && editingData) {
        await updateSemester(editingData.id, submitData);
        message.success(`Kỳ ${form.term} năm ${form.academic_year} đã được cập nhật thành công`);
      } else {
        await createSemester(submitData);
        message.success(`Kỳ ${form.term} năm ${form.academic_year} đã được thêm mới thành công`);
      }
      
      handleClose();
      onSuccess();
    } catch (error: any) {
      message.error(isEditMode ? 'Lỗi khi cập nhật kỳ ở' : 'Lỗi khi thêm kỳ ở mới');
      console.error(isEditMode ? 'Error updating semester:' : 'Error creating semester:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear - 2; i <= currentYear; i++) {
    yearOptions.push({ label: `${i}-${i + 1}`, value: `${i}-${i + 1}` });
  }

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 size-10">
            <span className="material-symbols-outlined text-[20px]">{isEditMode ? 'edit' : 'add_circle'}</span>
          </div>
          <span className="text-xl font-bold text-text-main dark:text-white">{isEditMode ? 'Chỉnh sửa kỳ ở' : 'Thêm kỳ ở mới'}</span>
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
          onClick={handleCreateSemester}
          className="h-10 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isCreating || isLoadingData}
        >
          {isCreating ? (isEditMode ? 'Đang cập nhật...' : 'Đang thêm...') : (isEditMode ? 'Cập nhật kỳ ở' : 'Thêm kỳ ở')}
        </button>,
      ]}
      width={700}
      centered
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      {isLoadingData ? (
        <div className="flex justify-center items-center py-12">
          <Spin tip="Đang tải dữ liệu..." />
        </div>
      ) : (
      <div className="py-4">
        {/* Row 1: Kỳ, Năm học */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          {/* Term */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Kỳ <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Ví dụ: 1, 2, 3"
              value={form.term}
              onChange={(e) => setForm({ ...form, term: e.target.value })}
              className="h-10"
              prefix={<span className="hidden" />}
            />
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Năm học <span className="text-red-500">*</span>
            </label>
            <Select
              className='h-10'
              style={{ width: '100%' }}
              placeholder="Chọn năm học"
              value={form.academic_year || undefined}
              onChange={(value) => setForm({ ...form, academic_year: value })}
              options={yearOptions}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Trạng thái <span className="text-red-500">*</span>
            </label>
            <Select
              style={{ width: '100%' }}
              value={form.is_active}
              className='h-10'
              onChange={(value) => setForm({ ...form, is_active: value })}
              options={[
                { label: 'Đang hoạt động', value: 1 },
                { label: 'Không hoạt động', value: 0 },
              ]}
            />
          </div>
        </div>

        {/* Row 2: Ngày bắt đầu, Ngày kết thúc kỳ */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Ngày bắt đầu kỳ <span className="text-red-500">*</span>
            </label>
            <DatePicker
              format="DD/MM/YYYY"
              value={form.start_date ? dayjs(form.start_date) : null}
              onChange={(date) => setForm({ ...form, start_date: date ? date.format('YYYY-MM-DD') : '' })}
              style={{ width: '100%' }}
              className='h-10'
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Ngày kết thúc kỳ <span className="text-red-500">*</span>
            </label>
            <DatePicker
              format="DD/MM/YYYY"
              value={form.end_date ? dayjs(form.end_date) : null}
              onChange={(date) => setForm({ ...form, end_date: date ? date.format('YYYY-MM-DD') : '' })}
              style={{ width: '100%' }}
              className='h-10'
            />
          </div>
        </div>

        {/* Row 3: Mở đơn đăng ký thông thường, Mở đơn đăng ký ưu tiên */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Registration Open DateTime */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Mở đơn thông thường <span className="text-red-500">*</span>
            </label>
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="DD/MM/YYYY HH:mm"
              value={form.registration_open_date ? dayjs(form.registration_open_date) : null}
              onChange={(date) => setForm({ ...form, registration_open_date: date ? date.format('YYYY-MM-DD HH:mm:ss') : '' })}
              style={{ width: '100%' }}
              className='h-10'
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Đóng đơn thông thường <span className="text-red-500">*</span>
            </label>
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="DD/MM/YYYY HH:mm"
              value={form.registration_close_date ? dayjs(form.registration_close_date) : null}
              onChange={(date) => setForm({ ...form, registration_close_date: date ? date.format('YYYY-MM-DD HH:mm:ss') : '' })}
              style={{ width: '100%' }}
              className='h-10'
            />
          </div>
        </div>

        {/* Row 3b: Mở/Đóng đơn đăng ký ưu tiên */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Priority Registration Open DateTime */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Mở đơn ưu tiên <span className="text-red-500">*</span>
            </label>
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="DD/MM/YYYY HH:mm"
              value={form.registration_special_open_date ? dayjs(form.registration_special_open_date) : null}
              onChange={(date) => setForm({ ...form, registration_special_open_date: date ? date.format('YYYY-MM-DD HH:mm:ss') : '' })}
              style={{ width: '100%' }}
              className='h-10'
            />
          </div>

          {/* Priority Registration Close DateTime */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Đóng đơn ưu tiên <span className="text-red-500">*</span>
            </label>
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="DD/MM/YYYY HH:mm"
              value={form.registration_special_close_date ? dayjs(form.registration_special_close_date) : null}
              onChange={(date) => setForm({ ...form, registration_special_close_date: date ? date.format('YYYY-MM-DD HH:mm:ss') : '' })}
              style={{ width: '100%' }}
              className='h-10'
            />
          </div>
        </div>

        {/* Row 4: Mở & Đóng đơn gia hạn */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Renewal Open DateTime */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Mở đơn gia hạn <span className="text-red-500">*</span>
            </label>
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="DD/MM/YYYY HH:mm"
              value={form.renewal_open_date ? dayjs(form.renewal_open_date) : null}
              onChange={(date) => setForm({ ...form, renewal_open_date: date ? date.format('YYYY-MM-DD HH:mm:ss') : '' })}
              style={{ width: '100%' }}
              className='h-10'
            />
          </div>

          {/* Renewal Close DateTime */}
          <div>
            <label className="block text-sm font-medium text-text-main dark:text-white mb-2">
              Đóng đơn gia hạn <span className="text-red-500">*</span>
            </label>
            <DatePicker
              showTime={{ format: 'HH:mm' }}
              format="DD/MM/YYYY HH:mm"
              value={form.renewal_close_date ? dayjs(form.renewal_close_date) : null}
              onChange={(date) => setForm({ ...form, renewal_close_date: date ? date.format('YYYY-MM-DD HH:mm:ss') : '' })}
              style={{ width: '100%' }}
              className='h-10'
            />
          </div>
        </div>
      </div>
      )}
    </Modal>
  );
};

export default AddSemesterModal;
