// src/components/Sidebar.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);

  // Get user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const menuItems = [
    { path: '/', label: 'หน้าแรก', icon: 'bi bi-house' },
    { path: '/users', label: 'ผู้ใช้งาน', icon: 'bi bi-person' },
    { path: '/export-fabric', label: 'รายงานสินค้าส่งออกจากคลัง', icon: 'bi bi-box-arrow-up' },
    { path: '/ExportFabricServerExport', label: 'รายงานสินค้าเข้า/ออก คลัง', icon: 'bi bi-box-arrow-up' },
    { path: '/ExportFabricA4', label: 'รายงานคลัง', icon: 'bi bi-box-arrow-up' },
    
    { path: '/orders', label: 'ออเดอร์', icon: 'bi bi-cart' },
    // { path: '/stock', label: 'สต็อกผ้า', icon: 'bi bi-box' },
    { path: '/instant', label: 'สินค้าสำเร็จรูป', icon: 'bi bi-archive' },
    { path: '/rawmaterialinventory', label: 'สต็อกวัตถุดิบ', icon: 'bi bi-layers' },
    { path: '/settings', label: 'ตั้งค่า', icon: 'bi bi-gear' },
      // ⭐ เพิ่มเมนูใหม่ ⭐
  { 
    path: 'external-ast',
    label: 'ระบบบันทึกข้อมูล',
    icon: 'bi bi-journal-text',
    external: true,
    url: 'https://ast-manufacturing.com/'
  }
  ];

const handleNavigation = (item) => {
  if (item.external) {
    window.open(item.url, '_blank');
  } else {
    navigate(item.path);
  }
};

  // const handleNavigation = (path) => {
  //   navigate(path);
  // };

  const isActive = (path) => {
    return location.pathname === path;
  };
  return (
    <div 
      className="d-flex flex-column position-fixed vh-100 text-white"
      style={{
        width: '250px',
        backgroundColor: 'rgb(14,30,139)',
        zIndex: 1000
      }}
    >
      {/* Header Section */}
      <div className="p-3 border-bottom border-secondary">
        <div className="d-flex align-items-center mb-3">
          <div 
            className="d-flex align-items-center justify-content-center me-3 bg-secondary rounded"
            style={{ width: '40px', height: '40px' }}
          >
            <i className="fas fa-building text-white"></i>
          </div>
          <div>
            <h6 className="mb-0 fw-bold">ASIA TEXTILE CO.,LTD</h6>
          </div>
        </div>
        
        <div className="d-flex align-items-center  p-2 rounded" style={{ backgroundColor: 'rgb(205,220,234)' }}>
          <div 
            className="d-flex align-items-center justify-content-center bg-secondary rounded-circle flex-shrink-0 overflow-hidden"
            style={{ width: '32px', height: '32px' }}
          >
           <img 
             src="https://img.sistacafe.com/resizer?url=https://i.pinimg.com/736x/d7/04/66/d7046646be502e2a0fbdb0537ddeba30.jpg&w=700" 
             alt={currentUser?.name || "User"} 
             style={{ 
               width: '100%', 
               height: '100%', 
               objectFit: 'cover',
               borderRadius: '50%'
             }}
           />
          </div>
          <div className="ms-3">
             <span className="text-black fw-bold" style={{ fontSize: '14px' }}>
               {currentUser?.name || 'Loading...'}
             </span>
             <div>
               <small className="text-muted" style={{ fontSize: '12px' }}>
                 {currentUser?.userType || ''}
               </small>
             </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-grow-1 p-3"> 
        <ul className="list-unstyled mb-0">
          {menuItems.map((item, index) => (
            <li key={index} className="mb-2">
              <button
                className={`btn w-100 text-start d-flex align-items-center px-3 py-2 border-0 ${
                  isActive(item.path) 
                    ? 'bg-light text-primary' 
                    : 'text-white hover-bg-secondary'
                }`}
                style={{
                  borderRadius: '8px',
                  transition: 'all 0.2s ease'
                }}
                // onClick={() => handleNavigation(item.path)}
onClick={() => handleNavigation(item)}

                onMouseEnter={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = '';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(item.path)) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <i className={`${item.icon} me-3`} style={{ width: '20px' }}></i>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-top border-secondary">
        <div className="d-flex align-items-center justify-content-between">
     
          <button 
            className="btn btn-danger"
            style={{ fontSize: '14px' , fontWeight: '500' ,width: '100%' }}
            onClick={() => {
              if (window.confirm('คุณต้องการออกจากระบบหรือไม่?')) {
                // Clear localStorage
                localStorage.removeItem('user');
                localStorage.removeItem('isAuthenticated');
                // Navigate to login
                navigate('/login');
                // Reload the page to reset all states
                window.location.reload();
              }
            }}
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;