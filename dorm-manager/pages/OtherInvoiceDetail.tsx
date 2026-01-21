import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { getOtherInvoiceById, downloadOtherInvoiceFile } from '../api/otherInvoiceApi';
import { message, Spin, Button } from 'antd';

interface OtherInvoice {
  id: number;
  invoice_id: number;
  target_type: string;
  target_student_id?: number;
  target_room_id?: number;
  title: string;
  description?: string;
  amount: number;
  status: string;
  attachment_path?: string;
  file_name?: string;
  file_size?: number;
  created_at?: string;
  room_number?: string;
  building_name?: string;
  mssv?: string;
  full_name?: string;
  floor?: number;
  due_date?: string;
}

const OtherInvoiceDetail: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [invoice, setInvoice] = useState<OtherInvoice | null>(null);
  const [loading, setLoading] = useState(false);

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) return null;

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoading(true);
        if (!invoiceId) {
          message.error('Không tìm thấy ID hóa đơn');
          navigate('/manager/invoices/other-invoice');
          return;
        }
        const data = await getOtherInvoiceById(invoiceId);
        setInvoice(data);
      } catch (err) {
        console.error('Failed to load invoice:', err);
        message.error('Không thể tải chi tiết hóa đơn');
        navigate('/manager/invoices/other-invoice');
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [invoiceId, navigate]);

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'PAID':
        return 'Đã thanh toán';
      case 'OVERDUE':
        return 'Đã quá hạn';
      case 'PUBLISHED':
        return 'Chưa thanh toán';
      case 'DRAFT':
        return 'Nháp';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'PUBLISHED':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleDownloadFile = async (invoiceId: number, fileName?: string) => {
    try {
      await downloadOtherInvoiceFile(invoiceId, fileName);
      message.success('Tệp đã được tải xuống thành công');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Lỗi khi tải tệp');
    }
  };

  const getFileInfo = (filePath: string, fileName?: string) => {
    if (!filePath) return { name: '', size: '' };
    const displayName = fileName || filePath.split('/').pop() || 'file';
    // Get actual file size would require additional API call, for now use placeholder
    return {
      name: displayName,
      size: '5'
    };
  };

  if (loading) {
    return (
      <RoleBasedLayout headerTitle="Chi tiết Hóa đơn">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spin size="large" tip="Đang tải dữ liệu..." />
        </div>
      </RoleBasedLayout>
    );
  }

  if (!invoice) {
    return (
      <RoleBasedLayout headerTitle="Chi tiết Hóa đơn">
        <div className="flex items-center justify-center min-h-[400px]">
          <span>Không tìm thấy hóa đơn</span>
        </div>
      </RoleBasedLayout>
    );
  }

  const targetDisplay = invoice?.target_type === 'STUDENT'
    ? `${invoice.full_name} (${invoice.mssv})`
    : `${invoice.room_number} - Tầng ${invoice.floor}`;

  return (
    <RoleBasedLayout headerTitle="Chi tiết Hóa đơn">
        {/* Back Button */}
        <button
          onClick={() => navigate('/manager/invoices/other-invoice')}
          className="group flex items-center gap-2 mb-2 text-text-secondary dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors w-fit"
        >
          <div className="flex items-center justify-center size-8 rounded-full group-hover:bg-primary/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </div>
          <span className="text-sm font-bold leading-normal">Quay lại danh sách hóa đơn</span>
        </button>
      <div className="flex flex-col gap-6 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-text-main dark:text-white">
              {invoice.title}
            </h1>
            <p className="text-text-secondary dark:text-gray-400 mt-2 text-base">
              Mã hóa đơn: OTH-{invoice.id}
            </p>
          </div>
          <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold border ${getStatusColor(invoice.status)}`}>
            {getStatusLabel(invoice.status)}
          </span>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm p-6">
              <h2 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">info</span>
                Thông tin cơ bản
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-semibold text-text-secondary dark:text-gray-400 block mb-1">
                    Phạm vi
                  </label>
                  <p className="text-base text-text-main dark:text-white">
                    {invoice?.target_type === 'STUDENT' ? 'Sinh viên' : 'Phòng'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-text-secondary dark:text-gray-400 block mb-1">
                    Thông tin chi tiết
                  </label>
                  <p className="text-base text-text-main dark:text-white">
                    {targetDisplay}
                  </p>
                </div>
                {invoice.building_name && (
                  <div>
                    <label className="text-sm font-semibold text-text-secondary dark:text-gray-400 block mb-1">
                      Tòa nhà
                    </label>
                    <p className="text-base text-text-main dark:text-white">
                      {invoice.building_name}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-semibold text-text-secondary dark:text-gray-400 block mb-1">
                    Ngày tạo
                  </label>
                  <p className="text-base text-text-main dark:text-white">
                    {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('vi-VN') : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount and Description */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm p-6">
              <h2 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">description</span>
                Chi tiết hóa đơn
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-text-secondary dark:text-gray-400 block mb-2">
                    Số tiền
                  </label>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {invoice.amount ? `${Number(invoice.amount).toLocaleString('vi-VN')}₫` : '0₫'}
                  </p>
                </div>
                {invoice.description && (
                  <div>
                    <label className="text-sm font-semibold text-text-secondary dark:text-gray-400 block mb-2">
                      Mô tả chi tiết
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-base text-text-main dark:text-gray-300 whitespace-pre-wrap">
                        {invoice.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attachment */}
            {invoice.attachment_path && (
              <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm p-6">
                <h2 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">attach_file</span>
                  Tệp đính kèm
                </h2>
                <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">
                    description
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 truncate">
                      {/* {getFileInfo(invoice.attachment_path, invoice.file_name, invoice.file_size).name} */}
                      {invoice.file_name || 'Tệp đính kèm'}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {/* {getFileInfo(invoice.attachment_path, invoice.file_name, invoice.file_size).size} KB */}
                      {invoice.file_size ? `${invoice.file_size} B` : 'Kích thước không xác định'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadFile(invoice.id, invoice.file_name)}
                    className="flex-shrink-0 p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-lg transition-colors"
                    title="Tải xuống tệp"
                  >
                    <span className="material-symbols-outlined text-xl">download</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-border-color dark:border-gray-700 shadow-sm p-6 space-y-6 sticky top-6">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400 block mb-2">
                  Trạng thái thanh toán
                </label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(invoice.status)}`}>
                  {getStatusLabel(invoice.status)}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400 block mb-2">
                  Loại đối tượng
                </label>
                <p className="text-sm text-text-main dark:text-white font-semibold">
                  {invoice.target_type === 'STUDENT' ? 'Sinh viên' : 'Phòng'}
                </p>
              </div>

              <div className="pt-4 border-t border-border-color dark:border-gray-700">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400 block mb-3">
                  Tổng cộng
                </label>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {invoice.amount ? `${Number(invoice.amount).toLocaleString('vi-VN')}₫` : '0₫'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleBasedLayout>
  );
};

export default OtherInvoiceDetail;
