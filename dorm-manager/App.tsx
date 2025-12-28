import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation, BrowserRouter } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import NotificationList from './pages/NotificationList';
import NotificationDetail from './pages/NotificationDetail';
import NotificationManagement from './pages/NotificationManagement';
import CreateNotification from './pages/CreateNotification';
import SupportRequests from './pages/SupportRequests';
import CreateSupportRequest from './pages/CreateSupportRequest';
import SupportRequestDetail from './pages/SupportRequestDetail';
import EditSupportRequest from './pages/EditSupportRequest';
import BuildingList from './pages/BuildingList';
import BuildingDetail from './pages/BuildingDetail';
import StudentRegistration from './pages/StudentRegistration';
import BillsAndPayments from './pages/BillsAndPayments';
import InvoiceDetail from './pages/InvoiceDetail';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import RoomManagement from './pages/RoomManagement';
import RoomDetail from './pages/RoomDetail';
import StudentManagement from './pages/StudentManagement';
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
  login: async () => {},
  logout: () => {},
  loading: false,
  error: null,
});

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
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
              storedUser.role === 'manager' ? UserRole.MANAGER : UserRole.STUDENT,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_wkdMTY3ip__Gzs3tu96a2GRmp3Ik2u1rdqZ2hiqUDyP62djiNT1LApfxVmhRa4MEZJyW_RnLDB4pA49FhehZBcEHjGTQoLNyZA8GecVOJPIi20iBp2Xui50TdC2irNwB5VH4NyiMN5biKg0rpENpURnlLd3Eoa9WrczJm2hdUn2ebmTEmoQuz5t09aLTpVsFD-Fuik2JBwr1jenPi83pqaJ1-Q7geecQuqGsOosLjLysZlu7i4jpeK7J4vbbMM7SnYBlGErJrrc',
        subtitle: storedUser.email || storedUser.buildingId || 'User',
      });
    }
  }, []);

  const login = async (username: string, password: string, role: string) => {
    setLoading(true);
    setError(null);
    try {
      const { user: userData } = await loginUser(username, password, role);
      
      setUser({
        id: userData.id,
        name: userData.fullName || userData.username,
        role: userData.role === 'student' ? UserRole.STUDENT :
              userData.role === 'manager' ? UserRole.MANAGER : UserRole.STUDENT,
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB_wkdMTY3ip__Gzs3tu96a2GRmp3Ik2u1rdqZ2hiqUDyP62djiNT1LApfxVmhRa4MEZJyW_RnLDB4pA49FhehZBcEHjGTQoLNyZA8GecVOJPIi20iBp2Xui50TdC2irNwB5VH4NyiMN5biKg0rpENpURnlLd3Eoa9WrczJm2hdUn2ebmTEmoQuz5t09aLTpVsFD-Fuik2JBwr1jenPi83pqaJ1-Q7geecQuqGsOosLjLysZlu7i4jpeK7J4vbbMM7SnYBlGErJrrc',
        subtitle: userData.email || userData.buildingId || 'User',
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
      <Routes>
        <Route path="/login" element={user ? <Navigate to={user.role === UserRole.STUDENT ? "/student" : "/manager"} replace /> : <Login />} />
        
        <Route 
          path="/student" 
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
              ? <EditSupportRequest /> 
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
          path="/manager" 
          element={
            user && (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN)
              ? <ManagerDashboard /> 
              : <Navigate to="/login" replace />
          } 
        />

        <Route 
          path="/manager/rooms" 
          element={
            user && (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN)
              ? <RoomManagement /> 
              : <Navigate to="/login" replace />
          } 
        />

        <Route 
          path="/manager/rooms/:id" 
          element={
            user && (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN)
              ? <RoomDetail /> 
              : <Navigate to="/login" replace />
          } 
        />

        <Route 
          path="/manager/students" 
          element={
            user && (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN)
              ? <StudentManagement /> 
              : <Navigate to="/login" replace />
          } 
        />

        <Route 
          path="/manager/students/:mssv" 
          element={
            user && (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN)
              ? <Profile isManager={true} /> 
              : <Navigate to="/login" replace />
          } 
        />

        <Route 
          path="/manager/settings" 
          element={
            user && (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN)
              ? <Settings /> 
              : <Navigate to="/login" replace />
          } 
        />

        <Route 
          path="/manager/requests" 
          element={
            user && (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN)
              ? <SupportRequests /> 
              : <Navigate to="/login" replace />
          } 
        />

        <Route 
          path="/manager/requests/:id" 
          element={
            user && (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN)
              ? <SupportRequestDetail /> 
              : <Navigate to="/login" replace />
          } 
        />

        <Route 
          path="/manager/notifications" 
          element={
            user && (user.role === UserRole.MANAGER || user.role === UserRole.ADMIN)
              ? <NotificationManagement /> 
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

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
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