import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, BrowserRouter } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerProfile from './pages/ManagerProfile';
import AdminDashboard from './pages/AdminDashboard';
import NotificationList from './pages/NotificationList';
import NotificationDetail from './pages/NotificationDetail';
import NotificationManagement from './pages/NotificationManagement';
import CreateNotification from './pages/CreateNotification';
import SupportRequests from './pages/SupportRequests';
import CreateSupportRequest from './pages/CreateSupportRequest';
import SupportRequestDetail from './pages/SupportRequestDetail';
import BuildingList from './pages/BuildingList';
import BuildingDetail from './pages/BuildingDetail';
import StudentRegistration from './pages/StudentRegistration';
import BillsAndPayments from './pages/BillsAndPayments';
import InvoiceDetail from './pages/InvoiceDetail';
import InvoiceManagementAdmin from './pages/InvoiceManagementAdmin';
import RecordUtilityMetersPage from './pages/RecordUtilityMetersPage';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import RoomManagement from './pages/RoomManagement';
import RoomDetail from './pages/RoomDetail';
import StudentManagement from './pages/StudentManagement';
import ServicePriceManagement from './pages/ServicePriceManagement';
import SemesterManagement from './pages/SemesterManagement';
import ManagerManagement from './pages/ManagerManagement';
import RegistrationManagement from './pages/RegistrationManagement';
import { User, UserRole } from './types';
import { loginUser, logout as logoutUser, getStoredUser } from './api/auth';

// Context to manage auth state
interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, role: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  login: async () => { },
  logout: () => { },
  loading: false,
  error: null,
});

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Khôi phục user từ localStorage khi app load
  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser({
        id: storedUser.id,
        name: storedUser.fullName || storedUser.username,
        role: storedUser.role === 'student' ? UserRole.STUDENT :
          storedUser.role === 'admin' ? UserRole.ADMIN :
            storedUser.role === 'manager' ? UserRole.MANAGER : UserRole.STUDENT,
        avatar: storedUser.avatar,
        subtitle: storedUser.email || 'User',
        mssv: storedUser.mssv,
      });
    }
    // Kết thúc quá trình kiểm tra auth
    setAuthLoading(false);
  }, []);

  const login = async (username: string, password: string, role: string) => {
    setLoading(true);
    setError(null);
    try {
      const { user: userData } = await loginUser(username, password, role);
      console.log('Logged in user data:', userData);
      setUser({
        id: userData.id,
        name: userData.fullName || userData.username,
        role: userData.role === 'student' ? UserRole.STUDENT :
          userData.role === 'admin' ? UserRole.ADMIN :
            userData.role === 'manager' ? UserRole.MANAGER : UserRole.STUDENT,
        avatar: userData.avatar,
        subtitle: userData.email || 'User',
        mssv: userData.mssv,
      });
    } catch (err: any) {
      const errorMessage = err.message || 'Đăng nhập thất bại';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    logoutUser();
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {authLoading ? (
        // Hiển thị loading screen khi đang kiểm tra authentication
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-text-secondary dark:text-gray-400">Đang tải...</p>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/login" element={user ? <Navigate to={user.role === UserRole.STUDENT ? "/student/home" : user.role === UserRole.ADMIN ? "/admin/home" : "/manager/home"} replace /> : <Login />} />

          <Route
            path="/student/home"
            element={
              user && user.role === UserRole.STUDENT
                ? <StudentDashboard />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/student/profile"
            element={
              user && user.role === UserRole.STUDENT
                ? <Profile />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/student/my-room"
            element={
              user && user.role === UserRole.STUDENT
                ? <RoomDetail />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/student/register"
            element={
              user && user.role === UserRole.STUDENT
                ? <StudentRegistration />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/student/buildings"
            element={
              user && user.role === UserRole.STUDENT
                ? <BuildingList />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/student/buildings/:id"
            element={
              user && user.role === UserRole.STUDENT
                ? <BuildingDetail />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/student/requests"
            element={
              user && user.role === UserRole.STUDENT
                ? <SupportRequests />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/student/requests/create"
            element={
              user && user.role === UserRole.STUDENT
                ? <CreateSupportRequest />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/student/requests/:id"
            element={
              user && user.role === UserRole.STUDENT
                ? <SupportRequestDetail />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/student/requests/:id/edit"
            element={
              user && user.role === UserRole.STUDENT
                ? <CreateSupportRequest />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/student/bills"
            element={
              user && user.role === UserRole.STUDENT
                ? <BillsAndPayments />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/student/bills/:id"
            element={
              user && user.role === UserRole.STUDENT
                ? <InvoiceDetail />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/student/settings"
            element={
              user && user.role === UserRole.STUDENT
                ? <Settings />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/manager/home"
            element={
              user && user.role === UserRole.MANAGER
                ? <ManagerDashboard />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/manager/rooms"
            element={
              user && user.role === UserRole.MANAGER
                ? <RoomManagement />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/manager/rooms/:id"
            element={
              user && user.role === UserRole.MANAGER
                ? <RoomDetail />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/manager/students"
            element={
              user && user.role === UserRole.MANAGER
                ? <StudentManagement />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/manager/students/:id"
            element={
              user && user.role === UserRole.MANAGER
                ? <Profile isManager={true} />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/manager/profile"
            element={
              user && user.role === UserRole.MANAGER
                ? <ManagerProfile />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/manager/settings"
            element={
              user && user.role === UserRole.MANAGER
                ? <Settings />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/manager/invoices"
            element={
              user && user.role === UserRole.MANAGER
                ? <InvoiceManagementAdmin />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/record-utility-meters"
            element={
              user && (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER)
                ? <RecordUtilityMetersPage />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/manager/requests"
            element={
              user && user.role === UserRole.MANAGER
                ? <SupportRequests />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/manager/requests/:id"
            element={
              user && user.role === UserRole.MANAGER
                ? <SupportRequestDetail />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/manager/registrations"
            element={
              user && user.role === UserRole.MANAGER
                ? <RegistrationManagement />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/manager/notifications"
            element={
              user && user.role === UserRole.MANAGER
                ? <NotificationManagement />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/manager/notifications/:id"
            element={
              user && user.role === UserRole.MANAGER
                ? <NotificationDetail isManager={true} />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/manager/notifications/:id/edit"
            element={
              user && user.role === UserRole.MANAGER
                ? <CreateNotification mode="edit" />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/notifications"
            element={
              user ? <NotificationList /> : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/notifications/:id"
            element={
              user ? <NotificationDetail /> : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/notifications/create"
            element={
              user && (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN)
                ? <CreateNotification />
                : <Navigate to="/login" replace />
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/home"
            element={
              user && user.role === UserRole.ADMIN
                ? <AdminDashboard />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/profile"
            element={
              user && user.role === UserRole.ADMIN
                ? <ManagerProfile />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/buildings"
            element={
              user && user.role === UserRole.ADMIN
                ? <BuildingList />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/buildings/:id"
            element={
              user && user.role === UserRole.ADMIN
                ? <BuildingDetail />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/rooms"
            element={
              user && user.role === UserRole.ADMIN
                ? <RoomManagement />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/rooms/:id"
            element={
              user && user.role === UserRole.ADMIN
                ? <RoomDetail />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/students"
            element={
              user && user.role === UserRole.ADMIN
                ? <StudentManagement />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/students/:id"
            element={
              user && user.role === UserRole.ADMIN
                ? <Profile isManager={true} />
                : <Navigate to="/login" replace />
            }
          />

          <Route path="/admin/managers"
            element={
              user && user.role === UserRole.ADMIN
                ? <ManagerManagement />
                : <Navigate to="/login" replace />
            }
          />

          <Route path="/admin/service-prices"
            element={
              user && user.role === UserRole.ADMIN
                ? <ServicePriceManagement />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/semesters"
            element={
              user && user.role === UserRole.ADMIN
                ? <SemesterManagement />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/requests"
            element={
              user && user.role === UserRole.ADMIN
                ? <SupportRequests />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/requests/:id"
            element={
              user && user.role === UserRole.ADMIN
                ? <SupportRequestDetail />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/registrations"
            element={
              user && user.role === UserRole.ADMIN
                ? <RegistrationManagement />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/notifications"
            element={
              user && user.role === UserRole.ADMIN
                ? <NotificationManagement />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/notifications/:id"
            element={
              user && user.role === UserRole.ADMIN
                ? <NotificationDetail isManager={true} />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/notifications/:id/edit"
            element={
              user && user.role === UserRole.ADMIN
                ? <CreateNotification mode="edit" />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/notifications/create"
            element={
              user && user.role === UserRole.ADMIN
                ? <CreateNotification />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/settings"
            element={
              user && user.role === UserRole.ADMIN
                ? <Settings />
                : <Navigate to="/login" replace />
            }
          />

          <Route
            path="/admin/invoices"
            element={
              user && user.role === UserRole.ADMIN
                ? <InvoiceManagementAdmin />
                : <Navigate to="/login" replace />
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </AuthContext.Provider>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;