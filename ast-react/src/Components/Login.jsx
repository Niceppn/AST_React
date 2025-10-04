// File: Login.jsx
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
import { API_BASE_URL } from "@/config/apiBase";

import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('กรุณากรอก email และ password');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('🔐 Attempting login with:', { email: formData.email });
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: formData.email,
        password: formData.password
      });

      console.log('✅ Login response:', response.data);

      if (response.data.success) {
        setSuccess(response.data.message);
        
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Call parent onLogin function
        if (onLogin) {
          onLogin(response.data.user);
        }
        
        console.log('✅ Login successful, user data stored');
      } else {
        setError(response.data.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 401) {
        setError('Email หรือ Password ไม่ถูกต้อง');
      } else {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh',
      width: '100%' 
    }}>
      <div style={{
        display: 'flex',
        width: '100%'
      }}>
        {/* Left Side - Background Image with Company Info */}
        <div style={{
          width: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'url("/63ee57e3-e1f0-4d61-9578-f68c1e238f14.png")', // แก้ไข path ให้ถูกต้อง
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Optional overlay for better text readability */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: ')', // overlay สีน้ำเงินโปร่งใสเพื่อให้อ่านข้อความได้ชัด
            zIndex: 1
          }}></div>
          
          <div style={{ 
            textAlign: 'center', 
            color: 'white', 
            padding: '40px',
            position: 'relative',
            zIndex: 2
          }}>
            {/* Company Logo */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                border: '3px solid white',
                borderRadius: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                <span>LOGO</span>
              </div>
            </div>
            
            <h5 style={{ 
              marginBottom: '24px', 
              fontWeight: 'normal',
              fontSize: '16px', 
              opacity: 0.9 
            }}>
              ยินดีต้อนรับสู่ระบบ
            </h5>
            
            <h2 style={{ 
              fontWeight: 'bold', 
              marginBottom: '32px',
              fontSize: '28px', 
              lineHeight: '1.3' 
            }}>
              ระบบบริหารจัดการโรงงานเอเซียเท็กซ์ไทล์ จำกัด
            </h2>
            
            <h4 style={{ 
              fontWeight: '600', 
              marginBottom: '40px',
              fontSize: '20px', 
              color: '#e0f2fe' 
            }}>
              AST Management
            </h4>
            
            <div style={{ marginTop: '80px', paddingTop: '40px' }}>
              <small style={{ opacity: 0.8, fontSize: '14px' }}>
                บริษัท เอเซียเท็กซ์ไทล์ จำกัด
              </small>
              <br />
              <small style={{ opacity: 0.8, fontSize: '14px' }}>
                ASIA TEXTILE CO. LTD.
              </small>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div style={{
          width: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white'
        }}>
          <div style={{ 
            width: '100%', 
            maxWidth: '400px', 
            padding: '40px' 
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ 
                fontWeight: 'bold', 
                marginBottom: '16px',
                color: '#1f2937', 
                fontSize: '32px' 
              }}>
                Sign in 👤
              </h2>
              <p style={{ 
                color: '#6b7280', 
                marginBottom: '8px',
                fontSize: '14px' 
              }}>
                Don't have an account? 
                <a href="#" style={{ 
                  color: '#3b82f6', 
                  textDecoration: 'none', 
                  fontWeight: '600' 
                }}> Sign up</a>
              </p>
            </div>

            {error && (
              <Alert variant="danger" style={{ 
                marginBottom: '24px',
                borderRadius: '8px',
                border: '1px solid #f87171',
                backgroundColor: '#fef2f2',
                color: '#dc2626'
              }}>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                {error}
              </Alert>
            )}

            {success && (
              <Alert variant="success" style={{ 
                marginBottom: '24px',
                borderRadius: '8px',
                border: '1px solid #34d399',
                backgroundColor: '#f0fdf4',
                color: '#059669'
              }}>
                <i className="bi bi-check-circle-fill me-2"></i>
                {success}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group style={{ marginBottom: '24px' }}>
                <Form.Label style={{ 
                  fontWeight: '600', 
                  marginBottom: '8px',
                  color: '#374151', 
                  fontSize: '14px',
                  display: 'block'
                }}>
                  User Name or Email*
                </Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="User Name or Email"
                  required
                  style={{ 
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    padding: '12px 16px',
                    fontSize: '14px',
                    backgroundColor: '#f9fafb',
                    transition: 'all 0.2s ease',
                    width: '100%'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </Form.Group>

              <Form.Group style={{ marginBottom: '24px' }}>
                <Form.Label style={{ 
                  fontWeight: '600', 
                  marginBottom: '8px',
                  color: '#374151', 
                  fontSize: '14px',
                  display: 'block'
                }}>
                  Password*
                </Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  required
                  style={{ 
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    padding: '12px 16px',
                    fontSize: '14px',
                    backgroundColor: '#f9fafb',
                    transition: 'all 0.2s ease',
                    width: '100%'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.backgroundColor = 'white';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                    e.target.style.backgroundColor = '#f9fafb';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </Form.Group>

              <div style={{ 
                textAlign: 'right', 
                marginBottom: '32px' 
              }}>
                <a href="#" style={{ 
                  color: '#3b82f6', 
                  textDecoration: 'none',
                  fontSize: '14px' 
                }}>
                  Forgot password ?
                </a>
              </div>

              <Button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  fontWeight: '600',
                  backgroundColor: '#3b82f6',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#2563eb';
                    e.target.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.backgroundColor = '#3b82f6';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in ➜
                  </>
                )}
              </Button>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
