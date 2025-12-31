import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user } = React.useContext(AuthContext);

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user role is not in allowed roles, redirect to appropriate home page
  if (!allowedRoles.includes(user.role)) {
    const homeRoute = 
      user.role === UserRole.ADMIN ? '/admin/home' :
      user.role === UserRole.MANAGER ? '/manager/home' :
      '/student/home';
    return <Navigate to={homeRoute} replace />;
  }

  // User is authenticated and has correct role, render children
  return <>{children}</>;
};

export default ProtectedRoute;
