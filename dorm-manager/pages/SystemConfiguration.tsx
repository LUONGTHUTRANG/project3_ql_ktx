import React, { useState, useEffect } from 'react';
import { Button, Form, Input, InputNumber, Select, App, Row, Col, message } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import RoleBasedLayout from '../layouts/RoleBasedLayout';
import { getSystemConfig, updateSystemConfig, SystemConfig as ISystemConfig } from '../api/systemConfigApi';
import { useSystemConfig } from '../contexts/SystemConfigContext';

interface SystemConfig {
  billingStartDate: number;
  billingEndDate: number;
  billingEndDateMonth: 'current' | 'next';
  retentionValue: number;
  dormitoryName: string;
  hotlinePhone: string;
  supportEmail: string;
  dormitoryAddress: string;
}

const SystemConfiguration: React.FC = () => {
  const { notification } = App.useApp();
  const { refetchSystemConfig } = useSystemConfig();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [billingStartDate, setBillingStartDate] = useState<number>(5);

  // Fetch system config from API
  useEffect(() => {
    const fetchSystemConfig = async () => {
      try {
        setPageLoading(true);
        const apiData = await getSystemConfig();
        
        const formData: SystemConfig = {
          billingStartDate: apiData.utility_start_day || 5,
          billingEndDate: apiData.utility_end_day || 25,
          billingEndDateMonth: (apiData.utility_end_day || 25) >= (apiData.utility_start_day || 5) ? 'current' : 'next',
          retentionValue: apiData.max_reservation_time || 72,
          dormitoryName: apiData.system_name,
          hotlinePhone: apiData.hotline,
          supportEmail: apiData.email,
          dormitoryAddress: apiData.address,
        };
        
        form.setFieldsValue(formData);
        setBillingStartDate(formData.billingStartDate);
      } catch (error: any) {
        console.error('Error fetching system config:', error);
        notification.error({
          message: 'Lỗi tải cấu hình',
          description: error.message || 'Lỗi khi tải cấu hình hệ thống!',
          duration: 4.5,
        });
      } finally {
        setPageLoading(false);
      }
    };

    fetchSystemConfig();
  }, [form, notification]);

  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      // Validate billing dates
      if (values.billingEndDateMonth === 'current' && values.billingEndDate < values.billingStartDate) {
        notification.error({
          message: 'Lỗi xác thực',
          description: 'Ngày kết thúc (tháng này) phải lớn hơn hoặc bằng ngày bắt đầu!',
          duration: 4.5,
        });
        return;
      }

      // Convert form data to API format
      const apiData: ISystemConfig = {
        system_name: values.dormitoryName,
        hotline: values.hotlinePhone,
        email: values.supportEmail,
        address: values.dormitoryAddress,
        utility_start_day: values.billingStartDate,
        utility_end_day: values.billingEndDate,
        max_reservation_time: values.retentionValue,
      };

      // Call API to update
      await updateSystemConfig(apiData);

      // Refresh system config in context for other components
      await refetchSystemConfig();

      notification.success({
        message: 'Thành công',
        description: 'Cấu hình hệ thống đã được lưu thành công!',
        duration: 4.5,
      });
      
      setIsEditing(false);
    } catch (error: any) {
      notification.error({
        message: 'Lỗi lưu cấu hình',
        description: error.message || 'Lỗi khi lưu cấu hình hệ thống!',
        duration: 4.5,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPageLoading(true);
    const fetchAndReset = async () => {
      try {
        const apiData = await getSystemConfig();
        const formData: SystemConfig = {
          billingStartDate: apiData.utility_start_day || 5,
          billingEndDate: apiData.utility_end_day || 25,
          billingEndDateMonth: (apiData.utility_end_day || 25) >= (apiData.utility_start_day || 5) ? 'current' : 'next',
          retentionValue: apiData.max_reservation_time || 72,
          dormitoryName: apiData.system_name,
          hotlinePhone: apiData.hotline,
          supportEmail: apiData.email,
          dormitoryAddress: apiData.address,
        };
        form.setFieldsValue(formData);
        setBillingStartDate(formData.billingStartDate);
        message.info('Đã khôi phục cấu hình từ database');
      } catch (error: any) {
        notification.error({
          message: 'Lỗi khôi phục cấu hình',
          description: error.message || 'Lỗi khi khôi phục cấu hình!',
          duration: 4.5,
        });
      } finally {
        setPageLoading(false);
      }
    };
    fetchAndReset();
  };

  const dateOptions = Array.from({ length: 31 }, (_, i) => ({
    label: `Ngày ${String(i + 1).padStart(2, '0')}`,
    value: i + 1,
  }));

  return (
    <RoleBasedLayout 
      searchPlaceholder="Tìm cấu hình..."
      headerTitle="Quản lý cấu hình hệ thống"
    >
      <div className="flex flex-col w-full mx-auto animate-in fade-in duration-500">
        {/* Page Heading */}
        <div className="flex flex-col gap-2 pb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-text-main dark:text-white text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
              Quản lý cấu hình hệ thống
            </h1>
            <Button
              type={isEditing ? 'primary' : 'default'}
              onClick={() => setIsEditing(!isEditing)}
              className="h-12"
            >
                <span className="material-symbols-outlined">edit</span>
              {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa cấu hình'}
            </Button>
          </div>
          <p className="text-text-secondary dark:text-gray-400 text-base">
            Quản lý thông số kỹ thuật và cấu hình cơ bản cho toàn bộ hệ thống quản lý ký túc xá.
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="flex flex-col gap-6"
        >
          {/* Section 1: Dormitory Information */}
          <div className="bg-white dark:bg-[#1a2634] rounded-xl border border-[#dbe0e6] dark:border-[#2d3a4a] shadow-md overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary text-2xl">
                apartment
              </span>
              <span className="text-lg font-bold text-text-main dark:text-white">1. Thông tin ký túc xá</span>
            </div>
            <p className="text-text-secondary dark:text-gray-400 text-sm mb-6">
              Thông tin cơ bản của ký túc xá được sử dụng trên hệ thống.
            </p>
            <Row gutter={[24, 16]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="Tên ký túc xá"
                  name="dormitoryName"
                  rules={[{ required: true, message: 'Vui lòng nhập tên ký túc xá' }]}
                >
                  <Input 
                    placeholder="Ví dụ: Ký túc xá A"
                    className={`rounded-lg h-11 ${!isEditing && "pointer-events-none"}`}
                    prefix={<span className="hidden" />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="Số điện thoại Hotline"
                  name="hotlinePhone"
                  rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                >
                  <Input 
                    placeholder="Ví dụ: +84 (0)123 456 789"
                    className={`rounded-lg h-11 ${!isEditing && "pointer-events-none"}`}
                    prefix={<span className="hidden" />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="Email hỗ trợ"
                  name="supportEmail"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email' },
                    { type: 'email', message: 'Email không hợp lệ' }
                  ]}
                >
                  <Input 
                    placeholder="Ví dụ: support@dorm.edu.vn"
                    className={`rounded-lg h-11 ${!isEditing && "pointer-events-none"}`}
                    type="email"
                    prefix={<span className="hidden" />}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="Địa chỉ"
                  name="dormitoryAddress"
                  rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                >
                  <Input 
                    placeholder="Ví dụ: 123 Đường Nguyễn Huệ, Quận 1, TP.HCM"
                    className={`rounded-lg h-11 ${!isEditing && "pointer-events-none"}`}
                    prefix={<span className="hidden" />}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          {/* Section 2: Billing Configuration */}
          <div className="bg-white dark:bg-[#1a2634] rounded-xl border border-[#dbe0e6] dark:border-[#2d3a4a] shadow-md overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary text-2xl">
                calendar_month
              </span>
              <span className="text-lg font-bold text-text-main dark:text-white">2. Cấu hình thu tiền điện nước</span>
            </div>
            <p className="text-text-secondary dark:text-gray-400 text-sm mb-6">
              Quy định chu kỳ ghi nhận và thanh toán tiền tiện ích hàng tháng.
            </p>
            <Row gutter={[24, 16]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="Ngày bắt đầu thu hàng tháng"
                  name="billingStartDate"
                  rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}
                >
                  <Select 
                    placeholder="Chọn ngày"
                    options={dateOptions}
                    className={`h-11 ${!isEditing && "pointer-events-none"}`}
                    onChange={(value) => setBillingStartDate(value)}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="Ngày kết thúc thu hàng tháng"
                  required
                >
                  <div className="flex gap-3">
                    <Form.Item
                      name="billingEndDate"
                      noStyle
                      rules={[
                        { required: true, message: 'Vui lòng chọn ngày' },
                        {
                          validator: (_, value) => {
                            const billingEndDateMonth = form.getFieldValue('billingEndDateMonth');
                            const billingStartDate = form.getFieldValue('billingStartDate');
                            
                            // Nếu chọn "tháng này" và billingStartDate chưa được set
                            if (billingEndDateMonth === 'current' && !billingStartDate) {
                              return Promise.reject(new Error('Vui lòng chọn ngày bắt đầu trước'));
                            }
                            
                            // Nếu chọn "tháng này" và ngày kết thúc nhỏ hơn ngày bắt đầu
                            if (billingEndDateMonth === 'current' && value < billingStartDate) {
                              return Promise.reject(new Error(`Ngày kết thúc phải lớn hơn hoặc bằng ngày ${billingStartDate}`));
                            }
                            
                            return Promise.resolve();
                          }
                        }
                      ]}
                    >
                      <Select 
                        placeholder="Chọn ngày"
                        options={dateOptions}
                        className={`flex-1 h-11 ${!isEditing && "pointer-events-none"}`}
                      />
                    </Form.Item>
                    <Form.Item
                      name="billingEndDateMonth"
                      noStyle
                      rules={[{ required: true, message: 'Vui lòng chọn tháng' }]}
                    >
                      <Select
                        className={`w-28 ${!isEditing && "pointer-events-none"}`}
                        options={[
                          { label: 'Tháng này', value: 'current' },
                          { label: 'Tháng sau', value: 'next' }
                        ]}
                        onChange={() => {
                          // Trigger validation khi thay đổi tháng
                          form.validateFields(['billingEndDate']);
                        }}
                      />
                    </Form.Item>
                  </div>
                </Form.Item>
              </Col>
            </Row>
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex gap-3">
              <span className="material-symbols-outlined text-primary text-sm flex-shrink-0">
                info
              </span>
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                Hệ thống sẽ tự động chốt số vào ngày cuối cùng của tháng trước và thông báo nợ vào ngày bắt đầu đã cấu hình.
                {form.getFieldValue('billingEndDateMonth') === 'current' && (
                  <>
                    <br />
                    <strong>Lưu ý:</strong> Ngày kết thúc tháng này phải từ {billingStartDate} trở lên.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Section 3: Retention Configuration */}
          <div className="bg-white dark:bg-[#1a2634] rounded-xl border border-[#dbe0e6] dark:border-[#2d3a4a] shadow-md overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="material-symbols-outlined text-primary text-2xl">
                timer
              </span>
              <span className="text-lg font-bold text-text-main dark:text-white">3. Thời hạn giữ chỗ</span>
            </div>
            <p className="text-text-secondary dark:text-gray-400 text-sm mb-6">
              Khoảng thời gian sinh viên được phép giữ chỗ chờ thanh toán sau khi đăng ký.
            </p>
            <Row gutter={[24, 16]}>
              <Col xs={24} lg={12}>
                <Form.Item
                  label="Thời hạn thanh toán tối đa (Giờ)"
                  name="retentionValue"
                  rules={[
                    { required: true, message: 'Vui lòng nhập giá trị' },
                    { type: 'number', min: 1, message: 'Giá trị phải lớn hơn 0' }
                  ]}
                >
                  <InputNumber 
                    className={`w-full ${!isEditing && "pointer-events-none"}`}
                    min={1} 
                    max={999}
                    size="large"
                    placeholder="Nhập số giờ"
                  />
                </Form.Item>
                <p className="text-xs text-text-secondary dark:text-gray-400 italic">
                  * Đơn đăng ký sẽ tự động hủy nếu quá thời hạn này mà chưa nhận được thanh toán phí giữ chỗ.
                </p>
              </Col>
            </Row>
          </div>

          {/* Footer Actions */}
          <div 
            className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a2634] border-t border-[#dbe0e6] dark:border-[#2d3a4a] py-4 px-8 flex justify-end gap-4 z-40 w-full transition-all duration-300 ${
              isEditing ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
            }`}
          >
            {/* <Button 
              type="default" 
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleReset}
              className="h-12"
            >
              Khôi phục mặc định
            </Button> */}
            <Button 
              type="primary" 
              size="large"
              icon={<SaveOutlined />}
              loading={loading}
              onClick={() => form.submit()}
              className="h-12 px-8"
            >
              Lưu thay đổi
            </Button>
          </div>

          {/* Spacer for fixed footer */}
          {isEditing && <div className="h-14" />}
        </Form>
      </div>
    </RoleBasedLayout>
  );
};

export default SystemConfiguration;
