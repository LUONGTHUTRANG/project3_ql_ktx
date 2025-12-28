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

  // If user role is not in allowed roles, redirect to login
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  // User is authenticated and has correct role, render children
  return <>{children}</>;
};

export default ProtectedRoute;
