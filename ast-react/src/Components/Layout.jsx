// src/components/Layout.jsx

import React, { useState } from 'react';
import Sidebar from './Sidebar';


export default function Layout({ children, user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const getUserRoleDisplay = (userType) => {
    switch (userType) {
      case 'admin':
        return 'ผู้ดูแลระบบ';
      case 'materialstaff':
        return 'เจ้าหน้าที่วัสดุ';
      default:
        return 'ผู้ใช้งาน';
    }
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={sidebarOpen} />
      
      {/* Main Content */}
      <main className="flex-grow-1" style={{ marginLeft: '240px', minHeight: '100vh' }}>
        {/* Top Navigation Bar */}
        <nav className="navbar navbar-expand navbar-light bg-white shadow-sm mb-2">
          <div className="container-fluid">
            <button 
              className="btn btn-link d-md-none d-lg-none"
              onClick={toggleSidebar}
            >
              <i className="bi bi-list fs-4"></i>
            </button>
            
            <div className="navbar-nav ms-auto">
              <div className="nav-item dropdown">
                <a className="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
                  <div 
                    className="rounded-circle me-2 d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      backgroundColor: user?.user_type === 'admin' ? '#dc3545' : '#007bff',
                      fontSize: '12px'
                    }}
                  >
                    {getUserInitials(user?.name)}
                  </div>
                  <div className="d-flex flex-column align-items-start">
                    <span className="fw-semibold" style={{ fontSize: '14px' }}>
                      {user?.name || 'ผู้ใช้งาน'}
                    </span>
                    <small className="text-muted" style={{ fontSize: '12px', lineHeight: '1' }}>
                      {getUserRoleDisplay(user?.user_type)}
                    </small>
                  </div>
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <div className="dropdown-item-text">
                      <div className="fw-semibold">{user?.name}</div>
                      <small className="text-muted">{user?.email}</small>
                    </div>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><a className="dropdown-item" href="#"><i className="bi bi-person me-2"></i>โปรไฟล์</a></li>
                  <li><a className="dropdown-item" href="#"><i className="bi bi-gear me-2"></i>ตั้งค่า</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i>ออกจากระบบ
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </nav>

        <div className="container-fluid p-4">
          {children}
        </div>
      </main>
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-md-none"
          style={{ zIndex: 1040 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
