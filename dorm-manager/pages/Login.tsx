import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { App } from "antd";

const Login: React.FC = () => {
  const { notification } = App.useApp();
  const { login, loading, error } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      const errorMsg = 'Vui lòng nhập tên đăng nhập và mật khẩu';
      notification.error({
        message: 'Lỗi đăng nhập',
        description: errorMsg,
        placement: 'topRight',
        duration: 2,
      });
      return;
    }

    try {
      await login(username, password, selectedRole === UserRole.STUDENT ? 'student' : 'manager');
      // Notification thành công
      notification.success({
        message: 'Đăng nhập thành công',
        description: 'Chào mừng bạn đến với hệ thống quản lý ký túc xá',
        placement: 'topRight',
        duration: 2,
      });
      // Navigate to appropriate dashboard after successful login
      navigate(selectedRole === UserRole.STUDENT ? '/student' : '/manager');
    } catch (err: any) {
      const errorMsg = err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại vai trò, tên đăng nhập và mật khẩu.';
      notification.error({
        message: 'Đăng nhập thất bại',
        description: errorMsg,
        placement: 'topRight',
        duration: 2,
      });
    }
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden font-display bg-background-light dark:bg-background-dark text-text-main">
      {/* Left Side - Image */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-end bg-primary group/design-root overflow-hidden">
        <div 
          className="absolute inset-0 w-full h-full bg-center bg-no-repeat bg-cover"
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD8YY9zDIck5aKhSIQH_M6whmU9NerCVMEAgHF7_vQyFTnZ8_C4WGVMtvDQaFML1I_PgP_H592FwNOD3plkf3hDJg_mT3SqNG2ocCFKanypMfMsNmvqK9qEVxoErHt3ItUHLtZNUllAbKJUyZ5qtpbNxsFOA4xmXC48GuGoJ72i5ptPGyw8hxvsLXsQ7lC6tHUtl_hfNeWewV04NrgG_Ee8_z5tucW-1nmOsxFUfLoFURzfDTmohBvF3NnAYDvJ4vonVB72LR7G3Nk")' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 to-primary/30 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className="relative z-10 p-12 mb-10 max-w-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-lg">
              <span className="material-symbols-outlined text-white text-3xl">apartment</span>
            </div>
            <h2 className="text-white text-2xl font-bold tracking-tight">Dormitory Manager</h2>
          </div>
          <h1 className="text-white text-4xl font-bold leading-tight mb-4">
            Quản lý ký túc xá<br />hiệu quả và tiện lợi
          </h1>
          <p className="text-white/90 text-lg font-medium leading-relaxed">
            Hệ thống tích hợp giúp sinh viên đăng ký phòng, thanh toán hóa đơn và gửi yêu cầu sửa chữa một cách nhanh chóng.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 bg-background-light dark:bg-background-dark overflow-y-auto">
        <div className="w-full max-w-[480px] flex flex-col">
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-border-color dark:border-gray-700 overflow-hidden">
            <div className="p-8 pt-8">
              <div className="mb-8 text-center">
                <h2 className="text-text-main dark:text-white text-2xl font-bold mb-2">Chào mừng trở lại!</h2>
                <p className="text-text-secondary dark:text-gray-400 text-sm">Vui lòng đăng nhập để tiếp tục vào hệ thống</p>
              </div>

              <div className="mb-6">
                <div className="flex p-1 bg-[#f0f2f4] dark:bg-gray-800 rounded-lg">
                  <label className="flex-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="role" 
                      className="peer sr-only" 
                      value={UserRole.STUDENT}
                      checked={selectedRole === UserRole.STUDENT}
                      onChange={() => setSelectedRole(UserRole.STUDENT)}
                      disabled={loading}
                    />
                    <div className="flex items-center justify-center py-2 rounded-md text-sm font-medium text-text-secondary dark:text-gray-400 transition-all peer-checked:bg-white dark:peer-checked:bg-gray-700 peer-checked:text-primary peer-checked:shadow-sm">
                      <span className="material-symbols-outlined text-[18px] mr-2">school</span>
                      Sinh viên
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input 
                      type="radio" 
                      name="role" 
                      className="peer sr-only" 
                      value={UserRole.MANAGER}
                      checked={selectedRole === UserRole.MANAGER}
                      onChange={() => setSelectedRole(UserRole.MANAGER)}
                      disabled={loading}
                    />
                    <div className="flex items-center justify-center py-2 rounded-md text-sm font-medium text-text-secondary dark:text-gray-400 transition-all peer-checked:bg-white dark:peer-checked:bg-gray-700 peer-checked:text-primary peer-checked:shadow-sm">
                      <span className="material-symbols-outlined text-[18px] mr-2">badge</span>
                      Cán bộ
                    </div>
                  </label>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <label className="block group">
                  <span className="block text-text-main dark:text-gray-200 text-sm font-medium mb-2">Tên đăng nhập hoặc Email</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-text-secondary">person</span>
                    </div>
                    <input 
                      type="text" 
                      className="form-input block w-full rounded-lg border-border-color dark:border-gray-600 bg-white dark:bg-gray-800 pl-10 h-12 text-base text-text-main dark:text-white placeholder:text-text-secondary/60 focus:border-primary focus:ring-primary dark:focus:border-primary dark:focus:ring-primary transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
                      placeholder={selectedRole === UserRole.STUDENT ? "Ví dụ: 20240001" : "Nhập username hoặc email của bạn"}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                </label>

                <label className="block group">
                  <span className="block text-text-main dark:text-gray-200 text-sm font-medium mb-2">Mật khẩu</span>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-text-secondary">lock</span>
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="form-input block w-full rounded-lg border-border-color dark:border-gray-600 bg-white dark:bg-gray-800 pl-10 pr-10 h-12 text-base text-text-main dark:text-white placeholder:text-text-secondary/60 focus:border-primary focus:ring-primary dark:focus:border-primary dark:focus:ring-primary transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" 
                      placeholder="Nhập mật khẩu của bạn" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-main disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </label>

                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary/20 h-4 w-4" disabled={loading} />
                    <span className="ml-2 text-sm text-text-secondary dark:text-gray-400">Ghi nhớ đăng nhập</span>
                  </label>
                  <a href="#" className="text-sm font-semibold text-primary hover:text-primary-hover hover:underline">
                    Quên mật khẩu?
                  </a>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 flex items-center justify-center bg-primary hover:bg-primary-hover text-white rounded-lg text-base font-bold shadow-md shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2 material-symbols-outlined text-[20px]">refresh</span>
                      Đang xử lý...
                    </>
                  ) : (
                    'Đăng nhập'
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-text-secondary dark:text-gray-400 text-sm">
              Bạn chưa có tài khoản?{' '}
              <a href="#" className="font-bold text-primary hover:text-primary-hover hover:underline">Liên hệ quản trị viên</a>
            </p>
            <div className="mt-6 flex justify-center gap-6 text-xs text-text-secondary/60">
              <a href="#" className="hover:text-text-secondary">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-text-secondary">Chính sách bảo mật</a>
              <a href="#" className="hover:text-text-secondary">Trợ giúp</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;