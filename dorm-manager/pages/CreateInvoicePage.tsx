import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { message, Input, Select, DatePicker } from 'antd';
import dayjs from 'dayjs';

interface CreateInvoiceForm {
  title: string;
  amount: string;
  dueDate: string;
  description: string;
  building: string;
  floor: string;
  room: string;
  student: string;
  attachment?: File;
}

const CreateInvoicePage: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateInvoiceForm>({
    title: '',
    amount: '',
    dueDate: '',
    description: '',
    building: 'all',
    floor: 'all',
    room: 'all',
    student: 'all',
  });
  const [fileName, setFileName] = useState<string>('');
  const [filePreview, setFilePreview] = useState<{name: string, size: string} | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmountChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      amount: value
    }));
  };

  const handleDateChange = (date: any) => {
    const dateString = date ? dayjs(date).format('YYYY-MM-DD') : '';
    setFormData(prev => ({
      ...prev,
      dueDate: dateString
    }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      description: e.target.value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        message.error('Kích thước tệp không được vượt quá 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        attachment: file
      }));
      setFileName(file.name);
      setFilePreview({
        name: file.name,
        size: (file.size / 1024).toFixed(2)
      });
    }
  };

  const handleRemoveFile = () => {
    setFormData(prev => ({
      ...prev,
      attachment: undefined
    }));
    setFileName('');
    setFilePreview(null);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      message.error('Vui lòng nhập tiêu đề hóa đơn');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      message.error('Vui lòng nhập số tiền hợp lệ');
      return;
    }

    if (!formData.dueDate) {
      message.error('Vui lòng chọn ngày đến hạn');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement API call to create invoice
      message.success('Tạo hóa đơn thành công');
      navigate(-1);
    } catch (error) {
      console.error('Error creating invoice:', error);
      message.error('Lỗi khi tạo hóa đơn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleBasedLayout user={user} headerTitle="Tạo Hóa đơn">
      <div className="min-h-screen bg-background-light dark:bg-background-dark mb-20">
        <button
            onClick={() => navigate(`/${user?.role}/invoices/utility-fee`)}
            className="group flex items-center gap-2 mb-2 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
        >
            <div className="flex items-center justify-center size-8 rounded-full group-hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </div>
            <span className="text-sm font-bold leading-normal">Quay lại danh sách hóa đơn</span>
        </button>
        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center">
          <div className="layout-content-container flex flex-col w-full gap-6">
            {/* PageHeading Component */}
            <div className="flex flex-wrap justify-between items-end gap-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-[#111418] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
                  Tạo Hóa đơn Mới
                </h1>
                <p className="text-[#617589] dark:text-slate-400 text-base font-normal">
                  Tạo và gửi hóa đơn thanh toán cho sinh viên hoặc khu vực ký túc xá.
                </p>
              </div>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[#dbe0e6] dark:border-slate-800 px-6 md:px-8 py-6 flex flex-col gap-8">
              {/* Billing Info */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                    Thông tin hóa đơn
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title Field */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[#111418] dark:text-slate-200 text-md font-semibold">
                      Tiêu đề hóa đơn
                    </label>
                    <Input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Ví dụ: Tiền điện tháng 10/2023"
                      className="dark:bg-slate-800 dark:border-slate-700 h-10"
                      prefix={<span className="hidden" />}
                    />
                  </div>

                  {/* Amount Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-slate-200 text-md font-semibold">
                      Giá tiền (VNĐ)
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="dark:bg-slate-800 dark:border-slate-700 h-10"
                        addonAfter="VNĐ"
                        prefix={<span className="hidden" />}
                      />
                    </div>
                  </div>

                  {/* Due Date Field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-slate-200 text-md font-semibold">
                      Ngày đến hạn
                    </label>
                    <DatePicker
                      value={formData.dueDate ? dayjs(formData.dueDate) : null}
                      onChange={handleDateChange}
                      format="DD/MM/YYYY"
                      placeholder="Chọn ngày đến hạn"
                      className="w-full dark:bg-slate-800 dark:border-slate-700 h-10"
                      prefix={<span className="hidden" />}
                    />
                  </div>

                  {/* Description Field */}
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-[#111418] dark:text-slate-200 text-md font-semibold">
                      Nội dung mô tả chi tiết
                    </label>
                    <Input.TextArea
                      name="description"
                      value={formData.description}
                      onChange={handleDescriptionChange}
                      placeholder="Nhập chi tiết các khoản thu, chỉ số điện nước..."
                      rows={4}
                      className="dark:bg-slate-800 dark:border-slate-700"
                    />
                  </div>
                </div>
              </section>

              {/* Attachment Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">attach_file</span>
                  <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                    Tệp đính kèm
                  </h2>
                </div>
                <div className="flex flex-col gap-4">
                  <p className="text-[#617589] dark:text-slate-400 text-sm">
                    Tải lên hình ảnh biên lai hoặc các tài liệu liên quan (tối đa 5MB).
                  </p>
                  {!filePreview ? (
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-[#dbe0e6] dark:border-slate-700 rounded-xl cursor-pointer bg-[#fcfcfd] dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <span className="material-symbols-outlined text-4xl text-primary mb-3 group-hover:scale-110 transition-transform">
                            cloud_upload
                          </span>
                          <p className="mb-2 text-sm text-[#111418] dark:text-white font-semibold">
                            Nhấn để tải lên hoặc kéo thả tệp
                          </p>
                          <p className="text-xs text-[#617589] dark:text-slate-400">
                            PNG, JPG hoặc PDF
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept=".png,.jpg,.jpeg,.pdf"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                        description
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 truncate">
                          {filePreview.name}
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          {filePreview.size} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="flex-shrink-0 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">close</span>
                      </button>
                    </div>
                  )}
                </div>
              </section>

              {/* Recipient Selection Section */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">groups</span>
                  <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
                    Đối tượng nhận hóa đơn
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Building Select */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                      Tòa nhà
                    </label>
                    <Select
                      value={formData.building}
                      onChange={(value) => handleSelectChange('building', value)}
                      className="dark:bg-slate-800 h-10"
                      options={[
                        { value: 'all', label: 'Tất cả Tòa' },
                        { value: 'A1', label: 'Tòa A1' },
                        { value: 'A2', label: 'Tòa A2' },
                        { value: 'B1', label: 'Tòa B1' },
                      ]}
                    />
                  </div>

                  {/* Floor Select */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                      Tầng
                    </label>
                    <Select
                      value={formData.floor}
                      onChange={(value) => handleSelectChange('floor', value)}
                      className="dark:bg-slate-800 h-10"
                      options={[
                        { value: 'all', label: 'Tất cả Tầng' },
                        { value: '1', label: 'Tầng 1' },
                        { value: '2', label: 'Tầng 2' },
                        { value: '3', label: 'Tầng 3' },
                      ]}
                    />
                  </div>

                  {/* Room Select */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                      Phòng
                    </label>
                    <Select
                      value={formData.room}
                      onChange={(value) => handleSelectChange('room', value)}
                      className="dark:bg-slate-800 h-10"
                      options={[
                        { value: 'all', label: 'Tất cả Phòng' },
                        { value: '101', label: 'Phòng 101' },
                        { value: '102', label: 'Phòng 102' },
                        { value: '103', label: 'Phòng 103' },
                      ]}
                    />
                  </div>

                  {/* Student Select */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[#111418] dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
                      Sinh viên
                    </label>
                    <Select
                      value={formData.student}
                      onChange={(value) => handleSelectChange('student', value)}
                      className="dark:bg-slate-800 h-10"
                      options={[
                        { value: 'all', label: 'Tất cả sinh viên' },
                        { value: 'student1', label: 'Nguyễn Văn A' },
                        { value: 'student2', label: 'Trần Thị B' },
                      ]}
                    />
                  </div>
                </div>

                {/* Info Alert */}
                <div className="mt-4 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-sm">
                    info
                  </span>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Hệ thống sẽ tạo{' '}
                    <strong>
                      {formData.building === 'all' ? 'tất cả hóa đơn' : '12 hóa đơn'}
                    </strong>{' '}
                    cho toàn bộ sinh viên tại{' '}
                    <strong>
                      {formData.building === 'all' ? 'toàn bộ tòa' : `Tòa ${formData.building}`}
                    </strong>
                    .
                  </p>
                </div>
              </section>
            </form>
          </div>
        </main>
      </div>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 right-0 bg-white dark:bg-surface-dark border-t border-border-color dark:border-slate-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40" style={{ left: '288px' }}>
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex min-w-[120px] items-center justify-center rounded-lg h-12 px-6 bg-white dark:bg-slate-900 border border-[#dbe0e6] dark:border-slate-700 text-[#111418] dark:text-white text-base font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex min-w-[200px] items-center justify-center rounded-lg h-12 px-8 bg-primary text-white text-base font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined mr-2">
              {loading ? 'hourglass_empty' : 'send'}
            </span>
            {loading ? 'Đang tạo...' : 'Tạo hóa đơn'}
          </button>
        </div>
      </div>
    </RoleBasedLayout>
  );
};

export default CreateInvoicePage;
