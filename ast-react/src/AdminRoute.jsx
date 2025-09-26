// src/AdminRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  // ตรวจสอบว่าผู้ใช้เป็น admin หรือไม่
  const isAdmin = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'admin';
  };

  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  if (!isAuthenticated()) {
    
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin()) {
   
    return <Navigate to="/" replace />;
  }

  // ถ้าเป็น admin ให้แสดงหน้าที่ต้องการ
  return children;
};

export default AdminRoute;
