import React, { useContext, useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import QRCode from 'react-qr-code';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { getInvoiceById } from '../api/invoiceApi';
import { downloadOtherInvoiceFile } from '@/api/otherInvoiceApi';
import { getMonthlyUsageById } from '../api/monthlyUsageApi';
import { getStudentById } from '../api/studentApi';
import { generateQRCode } from '../api/paymentApi';
import formatters from '@/utils/formatters';

const InvoiceDetail: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isQrZoomed, setIsQrZoomed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [monthlyUsage, setMonthlyUsage] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [qrCode, setQrCode] = useState<any>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!user) return null;

  useEffect(() => {
    const fetchInvoiceData = async () => {
      setIsLoading(true);
      try {
        // Fetch invoice data
        if (id) {
          const invoiceData = await getInvoiceById(id);
          setInvoice(invoiceData);

          // Fetch monthly usage data if usage_id exists in invoice
          if (invoiceData.usage_id) {
            try {
              const usage = await getMonthlyUsageById(invoiceData.usage_id);
              setMonthlyUsage(usage);
            } catch (err) {
              console.log('Monthly usage data not available');
            }
          }
        }

        // Fetch student information to get current room and building details
        if (user.id) {
          try {
            const student = await getStudentById(user.id);
            setStudentInfo(student);
          } catch (err) {
            console.log('Student information not available');
          }
        }

        // Check for payment success param
        const paymentSuccess = searchParams.get('paymentSuccess');
        if (paymentSuccess === 'true') {
          setPaymentSuccess(true);
          // message.success('Thanh toán thành công!');
        }
      } catch (error: any) {
        message.error('Lỗi khi tải thông tin hóa đơn');
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceData();
  }, [id, user.id, searchParams]);

  const handleGenerateQR = async () => {
    if (!id) return;
    
    setIsGeneratingQR(true);
    try {
      const qrData = await generateQRCode(id, user.id);
      setQrCode(qrData);
      message.success('Mã QR được tạo thành công!');
    } catch (err: any) {
      message.error('Lỗi khi tạo mã QR');
      console.error('Error:', err);
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handlePaymentClick = () => {
    if (!qrCode) {
      handleGenerateQR();
      return;
    }

    // Navigate to payment confirmation page
    navigate(`/student/payment-confirmation?ref=${qrCode.paymentRef}&invoiceId=${id}`);
  };

  const handleDownloadFile = async () => {
    if (!invoice?.other_invoice_id || !invoice?.file_name) return;
    
    try {
      console.log("Downloading file for invoice id:", invoice.other_invoice_id, "file name:", invoice.file_name);
      await downloadOtherInvoiceFile(invoice.other_invoice_id, invoice.file_name);
      message.success('Tệp đã được tải xuống thành công');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Lỗi khi tải tệp');
    }
  };

  if (isLoading) {
    return (
      <RoleBasedLayout 
        searchPlaceholder="Tìm kiếm..."
        headerTitle="Chi tiết Hóa đơn"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Spin size="large" />
        </div>
      </RoleBasedLayout>
    );
  }

  if (!invoice) {
    return (
      <RoleBasedLayout 
        searchPlaceholder="Tìm kiếm..."
        headerTitle="Chi tiết Hóa đơn"
      >
        <div className="text-center py-12">
          <p className="text-text-secondary dark:text-gray-400">Không tìm thấy hóa đơn</p>
        </div>
      </RoleBasedLayout>
    );
  }

  // Format date function
  // const formatDate = (dateString: string) => {
  //   if (!dateString) return '';
  //   try {
  //     const date = new Date(dateString);
  //     return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  //   } catch {
  //     return dateString;
  //   }
  // };

  // Build invoice items based on invoice type
  const buildInvoiceItems = () => {
    const items: any[] = [];

    // Handle based on invoice_category (from new API format)
    const category = invoice.invoice_category?.toUpperCase();
    const amount = parseFloat(invoice.total_amount || invoice.amount || '0');

    if (category === 'ROOM_FEE') {
      // Room fee
      if (amount > 0) {
        const semesterLabel = invoice.semester_term && invoice.semester_academic_year 
          ? `Kỳ ${invoice.semester_term} - ${invoice.semester_academic_year}`
          : `Kỳ ${invoice.semester_id || ''}`;
        items.push({
          name: 'Tiền phòng',
          desc: semesterLabel,
          unit: '1 kỳ',
          price: amount,
          total: amount,
        });
      }
    } else if (category === 'UTILITY') {
      // Utility fees - use data from invoice object (enriched from backend with service_prices)
      const electricityOld = invoice.electricity_old;
      const electricityNew = invoice.electricity_new;
      const waterOld = invoice.water_old;
      const waterNew = invoice.water_new;
      const electricityPrice = invoice.electricity_price ? parseFloat(invoice.electricity_price) : null;
      const electricityUnit = invoice.electricity_unit || 'kWh';
      const waterPrice = invoice.water_price ? parseFloat(invoice.water_price) : null;
      const waterUnit = invoice.water_unit || 'm³';

      // Electricity section
      if (electricityOld !== null && electricityOld !== undefined && 
          electricityNew !== null && electricityNew !== undefined) {
        const electricityUsage = electricityNew - electricityOld;
        
        // Header row for Tiền điện
        const electricityTotal = electricityUsage * electricityPrice;
        items.push({
          name: 'Tiền điện',
          desc: `Chỉ số: ${electricityOld} → ${electricityNew}`,
          unit: `${electricityUsage} ${electricityUnit}`,
          price: electricityPrice,
          total: electricityTotal,
          isHeader: true,
        });
      }

      // Water section
      if (waterOld !== null && waterOld !== undefined && 
          waterNew !== null && waterNew !== undefined) {
        const waterUsage = waterNew - waterOld;
        
        // Header row for Tiền nước
        const waterTotal = waterUsage * waterPrice;
        items.push({
          name: 'Tiền nước',
          desc: `Chỉ số: ${waterOld} → ${waterNew}`,
          unit: `${waterUsage} ${waterUnit}`,
          price: waterPrice,
          total: waterTotal,
          isHeader: true,
        });
      }

      // If no meter readings from backend, fallback to total amount
      if ((!electricityOld && !waterOld) && amount > 0) {
        items.push({
          name: 'Tiền điện nước',
          desc: `Tháng ${invoice.month || '-'}/${invoice.year || '-'}`,
          unit: '1 tháng',
          price: amount,
          total: amount,
        });
      }
    } else if (category === 'OTHER') {
      // Other fees
      if (amount > 0) {
        items.push({
          name: invoice.description || 'Khoản phí khác',
          desc: invoice.description || '',
          unit: '1',
          price: amount,
          total: amount,
        });
      }
    }

    return items;
  };

  const invoiceItems = buildInvoiceItems();
  const subtotal = invoiceItems.reduce((sum, item) => {
    console.log("check subtotal item", item);
    return sum + (item.total || item.price);
  }, 0);
  const total = subtotal;

  console.log("check user", user);

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm kiếm..."
      headerTitle="Chi tiết Hóa đơn"
    >
      <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-in fade-in duration-500">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-2 text-sm font-medium">
          <Link className="text-text-secondary dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-1" to="/student/bills">
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            Hóa đơn
          </Link>
          <span className="material-symbols-outlined text-base text-text-secondary dark:text-gray-600">chevron_right</span>
          <span className="text-text-main dark:text-white font-bold">Chi tiết #{invoice.invoice_code}</span>
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Invoice Detail */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Invoice Paper Card */}
            <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden">
              
              {/* Header Section */}
              <div className="p-6 md:p-10 border-b border-border-color dark:border-gray-700 flex flex-col md:flex-row justify-between md:items-start gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-3xl font-bold">school</span>
                    </div>
                    <h1 className="text-xl font-black text-text-main dark:text-white tracking-tight">Hệ thống Quản lý Ký túc xá</h1>
                  </div>
                  <div className="space-y-1">
                    <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">Demo - Bài tập lớn</p>
                    <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">Phiên bản: 1.0</p>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <h2 className="text-3xl font-black tracking-tight text-text-main dark:text-white mb-1">HÓA ĐƠN</h2>
                  <p className="text-lg font-bold text-primary">#{invoice.invoice_code}</p>
                  <p className="text-sm text-text-secondary dark:text-gray-400 mt-2 font-medium">Ngày lập: {formatters.formatDateTime(invoice.created_at)}</p>
                </div>
              </div>

              {/* Customer & Info Section */}
              <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-10">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500 mb-3">Thông tin Sinh viên</p>
                  <div className="flex flex-col gap-1">
                    <p className="text-xl font-bold text-text-main dark:text-white">{user.name || studentInfo?.full_name}</p>
                    <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">MSSV: {user.mssv || studentInfo?.mssv}</p>
                    <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">{user.email || studentInfo?.email || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500 mb-3">Thông tin Phòng ở</p>
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-primary border border-blue-100 dark:border-blue-800">
                      <span className="material-symbols-outlined text-2xl">meeting_room</span>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-text-main dark:text-white">Phòng {studentInfo?.room_number || invoice.room_number || 'N/A'}</p>
                      <p className="text-text-secondary dark:text-gray-400 text-sm font-medium">Tòa {studentInfo?.building_name || invoice.building_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                {invoice.invoice_category?.toUpperCase() === 'OTHER' && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-text-secondary dark:text-gray-500 mb-3">Phạm vi nhận</p>
                    <div className="flex items-center gap-4">
                      {/* <div className={`size-12 rounded-xl flex items-center justify-center border ${
                        invoice.target_type === 'STUDENT' 
                          ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800' 
                          : invoice.target_type === 'ROOM'
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'
                          : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800'
                      }`}>
                        <span className="material-symbols-outlined text-2xl">
                          {invoice.target_type === 'STUDENT' ? 'person' : invoice.target_type === 'ROOM' ? 'door_open' : 'apartment'}
                        </span>
                      </div> */}
                      <div>
                        <p className="text-lg font-bold text-text-main dark:text-white">
                          {invoice.target_type === 'STUDENT' 
                            ? 'Cá nhân sinh viên'
                            : invoice.target_type === 'ROOM'
                            ? 'Phòng sinh viên'
                            : 'Toàn bộ tòa nhà'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Description Section */}
              {invoice.description && (
                <div className="px-6 md:px-10 py-6 border-b border-t border-border-color dark:border-gray-700">
                  <p className="text-lg font-bold uppercase dark:text-gray-500 mb-3">Mô tả</p>
                  <p className="text-text-main dark:text-white text-sm leading-relaxed font-medium">{invoice.description}</p>
                </div>
              )}

              {/* Line Items Table */}
              <div className="px-6 md:px-10 pb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-border-color dark:border-gray-700">
                        <th className="py-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400 w-1/2">Khoản mục</th>
                        <th className="py-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400 text-center">Đơn vị</th>
                        <th className="py-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400 text-right">Đơn giá</th>
                        <th className="py-4 text-xs font-bold uppercase tracking-wider text-text-secondary dark:text-gray-400 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="text-text-main dark:text-white">
                      {invoiceItems.map((item, idx) => (
                        <tr key={idx} className={item.isHeader ? 'bg-primary/5 dark:bg-primary/10 border-b border-border-color dark:border-gray-700' : 'border-b border-dashed border-border-color dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors'}>
                          <td className="py-5">
                            {item.name && <p className="font-bold text-sm">{item.name}</p>}
                            {item.desc && <p className={item.isHeader ? 'text-[10px] text-text-secondary dark:text-gray-500 mt-0.5 font-medium' : 'text-[11px] text-text-secondary dark:text-gray-500 mt-1 font-medium italic'}>{item.desc}</p>}
                          </td>
                          <td className="py-5 text-center text-sm font-medium text-text-secondary dark:text-gray-400">{item.unit}</td>
                          <td className="py-5 text-right text-sm font-medium">{item.price > 0 ? item.price.toLocaleString() + ' đ' : '-'}</td>
                          <td className="py-5 text-right font-bold text-sm">{item.total > 0 ? item.total.toLocaleString() + ' đ' : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Section */}
              <div className="bg-gray-50 dark:bg-black/20 p-6 md:p-10 flex flex-col items-end gap-3">
                <div className="flex justify-between w-full md:w-1/2 text-sm font-medium">
                  <span className="text-text-secondary dark:text-gray-400">Tổng cộng:</span>
                  <span className="text-text-main dark:text-white">{subtotal.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between w-full md:w-1/2 text-sm font-medium">
                  <span className="text-text-secondary dark:text-gray-400">Thuế GTGT (0%):</span>
                  <span className="text-text-main dark:text-white">0 đ</span>
                </div>
                <div className="w-full h-px bg-border-color dark:bg-gray-700 my-2 md:w-1/2"></div>
                <div className="flex justify-between w-full md:w-1/2 items-end">
                  <span className="text-base font-black text-text-main dark:text-white">TỔNG CỘNG:</span>
                  <span className="text-3xl font-black text-primary">{total.toLocaleString()} đ</span>
                </div>
              </div>
            </div>

            {/* Attachment Section */}
            {invoice.attachment_path && (
              <div className="px-6 py-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 shadow-sm">
                <p className="text-sm font-bold uppercase dark:text-gray-500 mb-4">Tệp đính kèm</p>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-900/50">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-2xl">description</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-text-main dark:text-white">{invoice.file_name || 'Tệp đính kèm'}</p>
                    {invoice.file_size && (
                      <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">
                        Kích thước: {(invoice.file_size / 1024).toFixed(2)} KB
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={handleDownloadFile}
                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 transition-colors"
                    title="Tải về"
                  >
                    <span className="material-symbols-outlined">download</span>
                  </button>
                </div>
              </div>
            )}

            {/* Note Section */}
            {invoice.status !== 'PAID' && (<div className="flex gap-4 p-5 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30 shadow-sm animate-pulse-subtle">
              <div className="size-10 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
                <span className="material-symbols-outlined font-bold">info</span>
              </div>
              <div>
                <p className="text-sm font-black text-orange-800 dark:text-orange-300">Lưu ý quan trọng</p>
                <p className="text-sm text-orange-700 dark:text-orange-400/90 mt-1 leading-relaxed font-medium">
                  Vui lòng thanh toán trước ngày <strong>{formatters.formatDateTime(invoice.due_date)}</strong> để tránh bị tính phí phạt chậm thanh toán (2% trên tổng hóa đơn) và đảm bảo các quyền lợi lưu trú.
                </p>
              </div>
            </div>)}
          </div>

          {/* Right Column: Actions & Payment */}
          <div className="lg:col-span-1 flex flex-col gap-6 sticky top-24">
            
            {/* Status Card */}
            <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-border-color dark:border-gray-700 shadow-sm">
              <h3 className="text-[11px] font-bold text-text-secondary dark:text-gray-400 uppercase tracking-widest mb-5">Trạng thái thanh toán</h3>
              <div className="flex items-center gap-3 mb-6">
                <div className={`flex h-11 items-center justify-center gap-x-2 rounded-full pl-4 pr-5 border w-full ${
                  invoice.status === 'PAID' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30'
                }`}>
                  <div className={`size-2.5 rounded-full animate-pulse ${
                    invoice.status === 'PAID' 
                      ? 'bg-green-600 shadow-[0_0_8px_rgba(34,197,94,0.5)]' 
                      : 'bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.5)]'
                  }`}></div>
                  <p className={`text-sm font-black leading-normal ${
                    invoice.status === 'PAID' 
                      ? 'text-green-700 dark:text-green-400' 
                      : 'text-red-700 dark:text-red-400'
                  }`}>{invoice.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}</p>
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-border-color dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-text-secondary dark:text-gray-400">Hạn thanh toán:</span>
                  <span className="text-sm font-bold text-red-600">{formatters.formatDateTime(invoice.due_date) || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-text-secondary dark:text-gray-400">Kỳ thanh toán:</span>
                  <span className="text-sm font-bold text-text-main dark:text-white">
                    {invoice.invoice_category?.toUpperCase() === 'UTILITY' 
                      ? `Tháng ${invoice.month}/${invoice.year || '-'}`
                      : `Kỳ ${invoice.semester_term ? invoice.semester_term + ' - ' + invoice.semester_academic_year : invoice.semester_id || '-'}`
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-white dark:bg-surface-dark p-8 rounded-2xl border border-border-color dark:border-gray-700 shadow-sm flex flex-col items-center text-center">
              <h3 className="text-lg font-black text-text-main dark:text-white mb-1">Thanh toán</h3>
              <p className="text-xs text-text-secondary dark:text-gray-400 mb-6 font-medium">
                {invoice.status === 'PAID' ? 'Hóa đơn đã thanh toán' : qrCode ? 'Quét mã QR để thanh toán' : 'Nhấn nút bên dưới để tạo mã QR'}
              </p>
              
              {/* QR Code Display */}
              {qrCode && invoice.status !== 'PAID' ? (
                <div 
                  className="p-4 bg-white rounded-2xl border-2 border-primary/20 shadow-xl mb-6 relative group cursor-zoom-in transition-all hover:scale-105 active:scale-95"
                  onClick={() => setIsQrZoomed(true)}
                >
                  <div className="flex justify-center">
                    <QRCode 
                      value={JSON.stringify({
                        invoiceId: invoice.id,
                        invoiceCode: invoice.invoice_code,
                        amount: invoice.total_amount,
                        ref: qrCode.paymentRef,
                      })}
                      size={200}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/5 dark:bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/90 backdrop-blur-sm text-text-main text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-tighter">Phóng to</span>
                  </div>
                </div>
              ) : (
                <div className="w-full h-52 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6 border-2 border-dashed border-gray-300 dark:border-gray-700">
                  <div className="text-center">
                    <span className="material-symbols-outlined text-5xl text-text-secondary dark:text-gray-500 mb-2 block">qr_code_2</span>
                    <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">
                      {isGeneratingQR ? 'Đang tạo mã QR...' : 'Mã QR sẽ hiển thị ở đây'}
                    </p>
                  </div>
                </div>
              )}

              {/* QR Expiry Time */}
              {qrCode && (
                <div className="w-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-xl p-3 mb-6 text-center">
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 font-bold">
                    ⏱️ Mã QR hết hạn trong: <span className="text-orange-600">{new Date(qrCode.expiresAt).toLocaleTimeString('vi-VN')}</span>
                  </p>
                </div>
              )}

              {/* Payment Success Alert */}
              {paymentSuccess && (
                <div className="w-full bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-xl p-4 mb-6 flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-2xl">check_circle</span>
                  <div className="text-left">
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">Thanh toán thành công!</p>
                    <p className="text-xs text-green-600 dark:text-green-300">Hóa đơn của bạn đã được thanh toán</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {invoice.status !== 'PAID' ? (
                <div className="w-full flex gap-3">
                  {qrCode ? (
                    <button 
                      onClick={handlePaymentClick}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-black py-4 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[20px]">payment</span>
                      Thanh toán ngay
                    </button>
                  ) : (
                    <button 
                      onClick={handleGenerateQR}
                      disabled={isGeneratingQR}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-black py-4 px-4 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                    >
                      {isGeneratingQR ? (
                        <>
                          <Spin size="small" />
                          Đang tạo mã QR...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">qr_code</span>
                          Tạo mã QR
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <button className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-black py-4 px-4 rounded-xl transition-all shadow-lg shadow-green-600/20 active:scale-95">
                  <span className="material-symbols-outlined text-[22px]">verified</span>
                  Đã thanh toán
                </button>
              )}
              
              <button className="w-full mt-4 flex items-center justify-center gap-2 bg-white dark:bg-gray-800 text-text-secondary dark:text-gray-300 font-bold py-3 px-4 rounded-xl border border-border-color dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-xs active:scale-95">
                <span className="material-symbols-outlined text-[20px]">download</span>
                Tải hóa đơn PDF
              </button>
            </div>

            {/* Support Card */}
            <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30 flex gap-4 items-start shadow-sm">
              <div className="size-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-primary shadow-sm">
                <span className="material-symbols-outlined text-xl">support_agent</span>
              </div>
              <div>
                <p className="text-sm font-black text-text-main dark:text-white leading-tight">Cần hỗ trợ?</p>
                <p className="text-xs text-text-secondary dark:text-gray-400 mt-1.5 mb-3 leading-relaxed font-medium">Nếu có sai sót về chỉ số điện nước hoặc phí, vui lòng báo ngay.</p>
                <Link to="/student/requests/create" className="text-xs font-black text-primary hover:underline flex items-center gap-1">
                  Gửi yêu cầu hỗ trợ <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* QR Zoom Modal */}
      {isQrZoomed && qrCode && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200"
          onClick={() => setIsQrZoomed(false)}
        >
          <button className="absolute top-6 right-6 size-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          <div 
            className="max-w-[500px] w-full bg-white p-10 rounded-3xl animate-in zoom-in-95 duration-300 shadow-2xl shadow-primary/20 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCode 
              value={JSON.stringify({
                invoiceId: invoice.id,
                invoiceCode: invoice.invoice_code,
                amount: invoice.total_amount,
                ref: qrCode.paymentRef,
              })}
              size={350}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
              includeMargin={true}
            />
            <div className="mt-8 text-center w-full">
              <p className="text-text-main font-black text-xl mb-1">Mã QR Thanh toán</p>
              <p className="text-text-secondary text-sm font-medium mb-4">Mã hóa đơn: <strong className="text-primary">{invoice.invoice_code}</strong></p>
              <p className="text-text-secondary text-xs font-medium">Hết hạn: {new Date(qrCode.expiresAt).toLocaleTimeString('vi-VN')}</p>
            </div>
          </div>
        </div>
      )}
    </RoleBasedLayout>
  );
};

export default InvoiceDetail;