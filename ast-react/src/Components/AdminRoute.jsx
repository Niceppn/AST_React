// File: AdminRoute.jsx

// Component สำหรับตรวจสอบสิทธิ์การเข้าถึงหน้าต่างๆ
// รองรับการกำหนดสิทธิ์หลายประเภท

import React from 'react';

// allowedRoles: array ของ user_type ที่ได้รับอนุญาต
// เช่น ['admin'], ['admin', 'materialstaff'], ['admin', 'materialstaff', 'supermaterialstaff']
const AdminRoute = ({ children, allowedRoles = ['admin'] }) => {
  // ตรวจสอบ user จาก localStorage
  const userStr = localStorage.getItem('user');
  
  if (!userStr) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-shield-exclamation fs-1 text-warning"></i>
        <h3 className="mt-3 text-warning">ไม่ได้รับอนุญาต</h3>
        <p className="text-muted">กรุณาเข้าสู่ระบบเพื่อเข้าถึงหน้านี้</p>
      </div>
    );
  }

  let user;
  try {
    user = JSON.parse(userStr);
  } catch (error) {
    return (
      <div className="text-center py-5">
        <i className="bi bi-shield-exclamation fs-1 text-danger"></i>
        <h3 className="mt-3 text-danger">ข้อมูลผู้ใช้ไม่ถูกต้อง</h3>
        <p className="text-muted">กรุณาเข้าสู่ระบบใหม่</p>
      </div>
    );
  }

  // ตรวจสอบสิทธิ์ตาม allowedRoles
  if (!allowedRoles.includes(user.user_type)) {
    const roleNames = {
      'admin': 'ผู้ดูแลระบบ',
      'materialstaff': 'เจ้าหน้าที่วัสดุ',
      'supermaterialstaff': 'หัวหน้าเจ้าหน้าที่วัสดุ',
      'superadmin': 'ผู้ดูแลระบบอาวุโส'
    };

    const currentRole = roleNames[user.user_type] || user.user_type;
    const allowedRoleNames = allowedRoles.map(role => roleNames[role] || role).join(', ');

    return (
      <div className="text-center py-5">
        <i className="bi bi-shield-exclamation fs-1 text-danger"></i>
        <h3 className="mt-3 text-danger">ไม่มีสิทธิ์เข้าถึง</h3>
        <p className="text-muted">คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้</p>
        <div className="mt-3">
          <div className="mb-2">
            <span className="badge bg-secondary">สิทธิ์ปัจจุบัน: {currentRole}</span>
          </div>
          <div>
            <span className="badge bg-primary">ต้องมีสิทธิ์: {allowedRoleNames}</span>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
