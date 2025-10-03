// src/components/Users.jsx
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import 'bootstrap-icons/font/bootstrap-icons.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    user_type: 'materialstaff'
  });

  const API_URL = `${API_BASE_URL}/api`;

  // Generate avatar initials
  const getAvatarInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Generate avatar color based on name
  const getAvatarColor = (name) => {
    if (!name) return '#6c757d';
    const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#e83e8c', '#fd7e14'];
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/users`);
      
      // แปลงข้อมูล API ให้ตรงกับ component
      const transformedUsers = response.data.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.user_type === 'admin' ? 'admin' : 'user'
      }));
      
      // เรียงลำดับจากน้อยไปมากอัตโนมัติ
      const sortedUsers = transformedUsers.sort((a, b) => a.id - b.id);
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
      
      // Fallback data เมื่อไม่สามารถเชื่อมต่อ API ได้
     
      setUsers(fallbackUsers);
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    try {
      await axios.delete(`${API_URL}/users/${id}`);
      setUsers(prev => prev.filter(user => user.id !== id));
      alert('ลบผู้ใช้สำเร็จ');
    } catch (error) {
      console.error('Failed to delete user:', error);
      
      // หาก API ไม่ทำงาน ให้ลบแบบ local
      setUsers(prev => prev.filter(user => user.id !== id));
      alert('ลบผู้ใช้สำเร็จ (โหมดออฟไลน์)');
    }
  };

  // Add new user
  const addUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('กรุณากรอกชื่อ อีเมล และรหัสผ่าน');
      return;
    }

    try {
      // ใช้ authentication controller สำหรับการสร้างผู้ใช้ที่จะเข้ารหัสรหัสผ่านโดยอัตโนมัติ
      const userData = {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        user_type: newUser.user_type
      };
      
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      // รีเฟรชข้อมูลใหม่จาก API
      fetchUsers();
      setNewUser({ name: '', email: '', password: '', user_type: 'materialstaff' });
      setShowAddModal(false);
      alert('เพิ่มผู้ใช้สำเร็จ');
    } catch (error) {
      console.error('Failed to add user:', error);
      
      if (error.response?.data?.error === 'User already exists') {
        alert('อีเมลนี้มีผู้ใช้งานแล้ว');
        return;
      }
      
      // หาก API ไม่ทำงาน ให้เพิ่มข้อมูลแบบ local
      const newId = Math.max(...users.map(u => u.id)) + 1;
      const localUser = { 
        id: newId, 
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.user_type === 'admin' ? 'admin' : 'user' 
      };
      const sortedUsers = [...users, localUser].sort((a, b) => a.id - b.id);
      setUsers(sortedUsers);
      setNewUser({ name: '', email: '', password: '', user_type: 'materialstaff' });
      setShowAddModal(false);
      alert('เพิ่มผู้ใช้สำเร็จ (โหมดออฟไลน์)');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '300px'}}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>จัดการผู้ใช้งาน</h2>
        <button 
          className="btn "
          style={{ backgroundColor: 'rgb(14,30,139)', color: '#fff' }}
          onClick={() => setShowAddModal(true)}
        >
          <i className="i bi bi-plus"></i>
        เพิ่มผู้ใช้ใหม่
        </button>
      </div>

      <div className="card shadow">
        <div className="card-header  text-white" style={{ backgroundColor: 'rgb(14,30,139)' }}>
          <h5 className="mb-0">รายชื่อผู้ใช้งาน</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>ชื่อ</th>
                  <th>อีเมล</th>
                  <th>บทบาท</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar me-2">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" 
                            style={{
                              width: '32px', 
                              height: '32px',
                              backgroundColor: getAvatarColor(user.name),
                              fontSize: '12px'
                            }}
                          >
                            {getAvatarInitials(user.name)}
                          </div>
                        </div>
                        {user.name}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-success'}`}>
                        {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้ใช้งาน'}
                      </span>
                    </td>
                    <td>
                      <div className="px-4">
        
                        <button 
                          className="btn btn-sm btn-outline-danger" 
                          title="ลบ"
                          onClick={() => {
                            if (window.confirm(`คุณต้องการลบผู้ใช้ "${user.name}" หรือไม่?`)) {
                              deleteUser(user.id);
                            }
                          }}
                        >
                          <i className="bi bi-trash"></i>
                          
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">เพิ่มผู้ใช้ใหม่</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">ชื่อ</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="กรอกชื่อผู้ใช้"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">อีเมล</label>
                  <input 
                    type="email" 
                    className="form-control"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="กรอกอีเมล"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">รหัสผ่าน</label>
                  <input 
                    type="password" 
                    className="form-control"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="กรอกรหัสผ่าน"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">ประเภทผู้ใช้</label>
                  <select 
                    className="form-select"
                    value={newUser.user_type}
                    onChange={(e) => setNewUser({...newUser, user_type: e.target.value})}
                  >
                    <option value="materialstaff">พนักงานทั่วไป</option>
                    <option value="admin">ผู้ดูแลระบบ</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  ยกเลิก
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={addUser}
                >
                  เพิ่มผู้ใช้
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
