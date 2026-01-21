import React, { useContext, useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { message, Spin } from 'antd';
import QRCode from 'react-qr-code';
import { AuthContext } from '../App';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { confirmPayment, verifyPaymentRef } from '../api/paymentApi';

const PaymentConfirmation: React.FC = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const paymentRef = searchParams.get('ref');
  const invoiceId = searchParams.get('invoiceId');

  if (!user) return null;

  useEffect(() => {
    const verifyPayment = async () => {
      setIsLoading(true);
      try {
        if (!paymentRef) {
          setError('Thiếu thông tin thanh toán');
          setIsLoading(false);
          return;
        }

        // Verify payment reference
        const data = await verifyPaymentRef(paymentRef);
        setPaymentData(data);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Lỗi xác thực thanh toán');
      } finally {
        setIsLoading(false);
      }
    };

    verifyPayment();
  }, [paymentRef]);

  const handleConfirmPayment = async () => {
    if (!paymentRef || !invoiceId) {
      message.error('Thiếu thông tin cần thiết');
      return;
    }

    setIsConfirming(true);
    try {
      const result = await confirmPayment(paymentRef, invoiceId, user.id);
      message.success('Thanh toán thành công!');
      
      // Redirect back to invoice detail with success
      setTimeout(() => {
        navigate(`/student/bills/${invoiceId}?paymentSuccess=true`);
      }, 1500);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Lỗi khi xác nhận thanh toán');
      setError(err.response?.data?.message || 'Lỗi khi xác nhận thanh toán');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <RoleBasedLayout 
        searchPlaceholder="Tìm kiếm..."
        headerTitle="Xác nhận Thanh toán"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Spin size="large" tip="Đang xác thực thanh toán..." />
        </div>
      </RoleBasedLayout>
    );
  }

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm kiếm..."
      headerTitle="Xác nhận Thanh toán"
    >
      <div className="max-w-[600px] mx-auto">
        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 text-center">
            <div className="size-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
              <span className="material-symbols-outlined text-4xl">close_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">Lỗi Xác thực</h2>
            <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all"
            >
              Quay lại
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-border-color dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Success State */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-8 text-center">
              <div className="size-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                <span className="material-symbols-outlined text-5xl">verified_user</span>
              </div>
              
              <h1 className="text-3xl font-black text-text-main dark:text-white mb-2">Xác nhận Thanh toán</h1>
              <p className="text-text-secondary dark:text-gray-400 mb-8">Kiểm tra thông tin và xác nhận thanh toán</p>

              {/* Payment Details */}
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-6 mb-8 text-left">
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-border-color dark:border-gray-700">
                    <span className="text-text-secondary dark:text-gray-400">Mã Hóa đơn:</span>
                    <span className="font-bold text-primary">{paymentData?.invoiceCode}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border-color dark:border-gray-700">
                    <span className="text-text-secondary dark:text-gray-400">Số tiền:</span>
                    <span className="text-2xl font-black text-primary">
                      {paymentData?.amount?.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary dark:text-gray-400">Hạn sử dụng:</span>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                      {paymentData?.expiresAt ? new Date(paymentData.expiresAt).toLocaleTimeString('vi-VN') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-xl p-4 mb-8 flex gap-3">
                <div className="text-yellow-600 dark:text-yellow-400 shrink-0">
                  <span className="material-symbols-outlined">info</span>
                </div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                  Đây là trang xác nhận thanh toán demo. Nhấn "Xác nhận" để hoàn tất thanh toán.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleCancel}
                  disabled={isConfirming}
                  className="flex-1 px-6 py-4 bg-gray-100 dark:bg-gray-800 text-text-main dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={isConfirming}
                  className="flex-1 px-6 py-4 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isConfirming ? (
                    <>
                      <Spin size="small" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">check_circle</span>
                      Xác nhận Thanh toán
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleBasedLayout>
  );
};

export default PaymentConfirmation;
