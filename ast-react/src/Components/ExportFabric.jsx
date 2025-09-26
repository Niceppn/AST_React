// File: ExportFabric.jsx

import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Badge } from 'react-bootstrap';
import axios from 'axios';

const ExportFabric = () => {
  const [fabricouts, setFabricouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    vatType: ''
  });

  useEffect(() => {
    fetchFabricouts();
  }, []);

  // Function to group and sum data by bill number
  const groupAndSumData = (data) => {
    const grouped = {};
    
    data.forEach(item => {
      const billNumber = `${item.vatType}${item.vatNo}`;
      
      if (grouped[billNumber]) {
        // Sum the values for existing bill
        grouped[billNumber].fold = (parseInt(grouped[billNumber].fold) || 0) + (parseInt(item.fold) || 0);
        grouped[billNumber].sumYard = (parseInt(grouped[billNumber].sumYard) || 0) + (parseInt(item.sumYard) || 0);
      } else {
        // Create new entry for new bill
        grouped[billNumber] = {
          ...item,
          fold: parseInt(item.fold) || 0,
          sumYard: parseInt(item.sumYard) || 0,
          billNumber: billNumber
        };
      }
    });
    
    return Object.values(grouped);
  };

  const fetchFabricouts = async (searchFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching fabricouts data...');
      
      // Build query parameters
      const params = new URLSearchParams({
        limit: '15000'  // Get all data without pagination
      });
      
      // Add filters if they exist
      if (searchFilters.month) {
        params.append('month', searchFilters.month);
      }
      if (searchFilters.year) {
        params.append('year', searchFilters.year);
      }
      if (searchFilters.vatType) {
        params.append('vatType', searchFilters.vatType);
      }
      
      const response = await axios.get(`http://localhost:8000/api/fabricouts?${params.toString()}`);
      
      console.log('📊 API Response:', response.data);
      console.log('🔍 Applied filters:', searchFilters);
      
      let rawData = [];
      // Check if response has pagination structure
      if (response.data.data && response.data.pagination) {
        rawData = response.data.data;
      } else {
        // Handle old format or direct array
        rawData = Array.isArray(response.data) ? response.data : [];
      }
      
      // Group and sum the data by bill number
      const groupedData = groupAndSumData(rawData);
      setFabricouts(groupedData);
      setPagination(null); // No pagination needed
      
    } catch (error) {
      console.error('❌ Error fetching fabricouts:', error);
      setError('ไม่สามารถโหลดข้อมูลได้');
      
      // Mock data as fallback - with duplicate bills for testing
      const mockData = [
        
      ];
      
      // Group and sum the mock data
      const groupedMockData = groupAndSumData(mockData);
      setFabricouts(groupedMockData);
      setPagination(null); // No pagination for mock data
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    console.log('🔍 Searching with filters:', filters);
    fetchFabricouts(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      month: '',
      year: '',
      vatType: ''
    };
    setFilters(clearedFilters);
    fetchFabricouts(clearedFilters);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const getStatusBadge = (receiveType) => {
    switch (receiveType) {
      case 'receiver':
        return <Badge bg="success" style={{ borderRadius: '20px' }}>รับแล้ว</Badge>;
      case 'sender':
        return <Badge bg="warning" style={{ borderRadius: '20px' }}>ส่งแล้ว</Badge>;
      case 'pending':
        return <Badge bg="info" style={{ borderRadius: '20px' }}>รอดำเนินการ</Badge>;
      default:
        return <Badge bg="secondary" style={{ borderRadius: '20px' }}>{receiveType || 'ไม่ทราบสถานะ'}</Badge>;
    }
  };

  return (
    <div className='' >
      <div className=" text-white p-1 mb-1">
        <div className='text-black p-4 bg-white  mb-4'
        style={{ borderRadius: '15px', border: '2px solid #eee' }} >

        <h5 className="fw-bold">เลือกรายการสินค้าที่ต้องการดูคลัง</h5>
        <p className="text-muted pt-2">เรียงตามเลขที่บิลที่ส่ง</p>
        <div className='d-flex  align-items-center pb-2'>
            <div className='pt-2'>
                <h6>เลือกประเภทบิล</h6>
                <select 
                  className='form-select' 
                  style={{ borderRadius: '8px', border: '2px solid #eee', width: 'auto' }} 
                  name="typebill" 
                  value={filters.vatType}
                  onChange={(e) => handleFilterChange('vatType', e.target.value)}
                >
                    <option value="">เลือกประเภทบิล</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                </select>
            </div>
            <div className='pt-2 px-3'>
                <h6>เดือน</h6>
                <select 
                  className='form-select' 
                  style={{ borderRadius: '8px', border: '2px solid #eee', width: '350px' }} 
                  name="เดือน" 
                  value={filters.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                >
                    <option value="">เลือกเดือน</option>
                    <option value="1">มกราคม</option>
                    <option value="2">กุมภาพันธ์</option>
                    <option value="3">มีนาคม</option>
                    <option value="4">เมษายน</option>
                    <option value="5">พฤษภาคม</option>
                    <option value="6">มิถุนายน</option>
                    <option value="7">กรกฎาคม</option>
                    <option value="8">สิงหาคม</option>
                    <option value="9">กันยายน</option>
                    <option value="10">ตุลาคม</option>
                    <option value="11">พฤศจิกายน</option>
                    <option value="12">ธันวาคม</option>
                </select>
            </div>
            <div className='pt-2 px-1'>
                 <h6>เลือกปี</h6>
                <select 
                  className='form-select' 
                  style={{ borderRadius: '8px', border: '2px solid #eee', width: 'auto' }} 
                  name="ปี" 
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                >
                    <option value="">เลือกปี</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                    <option value="2027">2027</option>
                </select>
            </div>
            
        </div>
        <div className='pt1 px-1'>
                <br />
                <div className="d-flex gap-2">
                  <button 
                    className='btn' 
                    style={{ backgroundColor: 'rgb(14,30,139)', color: '#fff', width: '120px', height: '40px', borderRadius:'20px'}} 
                    onClick={handleSearch}
                    disabled={loading}
                  >
                    {loading ? 'กำลังค้นหา...' : '🔍 ค้นหา'}
                  </button>
                  <button 
                    className='btn  btn-danger' 
                    style={{ width: '120px', height: '40px', borderRadius:'20px'}} 
                    onClick={handleClearFilters}
                    disabled={loading}
                  >
                    
                     ล้างตัวกรอง
                  </button>
                </div>
            </div>
        </div>

      
        <div className="table ">
          <table className="table table" style={{ borderRadius: '15px', overflow: 'hidden', border: 'none' }}>
            <thead style={{ backgroundColor: '#ff8c00' }}>
              <tr>
                <th className="text-center" style={{ 
                  width: '7%', 
                  borderTop: 'none',
                  borderBottom: '2px solid #e67e22',
                  padding: '15px 8px',
                  fontWeight: '600',
                  color: 'black'
                  
                }}>เลขที่บิล</th>
                <th className="text-center" style={{ 
                  width: '10%', 
                  borderTop: 'none',
                  borderBottom: '2px solid #e67e22',
                  padding: '15px 8px',
                  fontWeight: '600',
                  color: 'black'
                }}>วัน/เดือน/ปี</th>
                <th className="text-center" style={{ 
                  width: '20%', 
                  borderTop: 'none',
                  borderBottom: '2px solid #e67e22',
                  padding: '15px 8px',
                  fontWeight: '600',
                  color: 'black'
                }}>รหัสผ้า</th>
                <th className="text-center" style={{ 
                  width: '25%', 
                  borderTop: 'none',
                  borderBottom: '2px solid #e67e22',
                  padding: '15px 8px',
                  fontWeight: '600',
                  color: 'black'
                }}>ชื่อผู้สั่ง</th>
                <th className="text-center" style={{ 
                  width: '12%', 
                  borderTop: 'none',
                  borderBottom: '2px solid #e67e22',
                  padding: '15px 8px',
                  fontWeight: '600',
                  color: 'black'
                }}>ชื่อผู้รับ</th>
                <th className="text-center" style={{ 
                  width: '5%', 
                  borderTop: 'none',
                  borderBottom: '2px solid #e67e22',
                  padding: '15px 8px',
                  fontWeight: '600',
                  color: 'black'
                }}>พับ</th>
                <th className="text-center" style={{ 
                  width: '10%', 
                  borderTop: 'none',
                  borderBottom: '2px solid #e67e22',
                  padding: '15px 8px',
                  fontWeight: '600',
                  color: 'black'
                }}>หลา</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center" style={{ padding: '20px' }}>
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="text-center text-danger" style={{ padding: '20px' }}>
                    {error}
                  </td>
                </tr>
              ) : fabricouts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center" style={{ padding: '20px' }}>
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                fabricouts.map((item, index) => (
                  <tr key={`${item.vatType}-${item.vatNo}-${index}`} style={{ backgroundColor: '#fff' }}>
                    <td className="text-center fw-bold " style={{ padding: '12px 8px', border: '1px solid #f1f3f4' }}>
                      {item.vatType} {item.vatNo}
                    </td>
                    <td className="text-center" style={{ padding: '12px 8px', border: '1px solid #f1f3f4' }}>
                      {formatDate(item.createDate)}
                    </td>
                    <td style={{ padding: '12px 8px', border: '1px solid #f1f3f4' }}>
                      {item.fabricStruct || item.vatType || '-'}
                    </td>
                    <td className="text-center" style={{ padding: '12px 8px', border: '1px solid #f1f3f4' }}>
                      {item.customerName || '-'}
                    </td>
                    <td className="text-center" style={{ padding: '12px 8px', border: '1px solid #f1f3f4' }}>
                      {item.receiveName || '-'}
                    </td>
                    <td className="text-center" style={{ padding: '12px 8px', border: '1px solid #f1f3f4' }}>
                      <span className="fw-bold text-primary">{item.fold}</span>
                    </td>
                    <td className="text-center" style={{ padding: '12px 8px', border: '1px solid #f1f3f4' }}>
                      <span className="fw-bold text-success">{item.sumYard}</span> หลา
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExportFabric;
