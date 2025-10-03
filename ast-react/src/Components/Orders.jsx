import React, { useState, useEffect } from 'react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import axios from 'axios';


const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [astPurchaseorder, setAstPurchaseorder] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [fabricData, setFabricData] = useState([]);
  const [threadData, setThreadData] = useState([]);
  const [stats, setStats] = useState({ approved: 0, returned: 0, noData: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  const API_URL = `${API_BASE_URL}/api`;

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (astPurchaseorder.length > 0) {
      processOrderData();
    }
  }, [selectedYear, astPurchaseorder]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching data from:', `${API_URL}/orders`);
      const response = await axios.get(`${API_URL}/orders`);
      console.log('API Response:', response.data);
      
      // แก้ไขให้ตรงกับโครงสร้างข้อมูลจาก API
      const purchaseOrders = response.data.data.astPurchaseorder || [];
      console.log('Purchase Orders:', purchaseOrders);
      console.log('Number of orders:', purchaseOrders.length);
      
      setAstPurchaseorder(purchaseOrders);
      
      if (purchaseOrders.length === 0) {
        console.log('No purchase orders found, using mock data');
        throw new Error('No data available');
      }

      processOrderData(purchaseOrders);
      
    } catch (error) {
      console.error('Failed to fetch purchase orders:', error);
      setError('ไม่สามารถโหลดข้อมูล Purchase Orders ได้');
      
      // ใช้ข้อมูลตัวอย่างหากเกิดข้อผิดพลาด
      const mockCustomerData = [
        { customerName: 'บริษัท มหาราช เทรดดิ้ง จำกัด (สำนักงานใหญ่)', count: 82, approvedCount: 78, totalAmount: 41936600.00 },
        { customerName: 'บริษัท พี. เค เท็กซ์ไทล์ (1978) จำกัด สาขาที่ 1', count: 33, approvedCount: 30, totalAmount: 19656200.00 },
        { customerName: 'บริษัท อาร์.เอ.แพบริค จำกัด (สำนักงานใหญ่)', count: 23, approvedCount: 21, totalAmount: 9053200.00 },
        { customerName: 'บริษัท ฮี. เอ.เอ็กซ์ปอร์ต (ไทยแลนด์) จำกัด (สำนักงานใหญ่)', count: 22, approvedCount: 13, totalAmount: 5026525.00 },
        { customerName: 'TOOTAL FABRIC', count: 15, approvedCount: 14, totalAmount: 458984.98 },
        { customerName: 'บริษัท เอ.เอ็ม เท็กซ์ไทล์ จำกัด (สำนักงานใหญ่)', count: 13, approvedCount: 10, totalAmount: 8406000.00 },
        { customerName: 'AST', count: 12, approvedCount: 12, totalAmount: 0.00 }
      ];
      
      const mockFabricData = [
        { fabricCode: 'CP40', count: 44 },
        { fabricCode: 'OE20', count: 39 },
        { fabricCode: 'TC45', count: 34 },
        { fabricCode: 'CP60', count: 21 },
        { fabricCode: 'XE20', count: 16 },
        { fabricCode: 'OE7', count: 15 },
        { fabricCode: 'CD40', count: 13 }
      ];

      const mockThreadData = [
        { threadCode: 'OE20', count: 33 },
        { threadCode: 'TC45', count: 26 }
      ];

      setCustomerData(mockCustomerData);
      setFabricData(mockFabricData);
      setThreadData(mockThreadData);
      setStats({ approved: 307, returned: 0, noData: 49 });
      setOrders(mockCustomerData);
    } finally {
      setLoading(false);
    }
  };

  const processOrderData = (purchaseOrders = astPurchaseorder) => {
    try {
      // 1. การกรองตามปี
      const filterOrders = () => {
        let filteredOrders = purchaseOrders;
        
        if (selectedYear !== 'all') {
          filteredOrders = purchaseOrders.filter(order => {
            // ตรวจสอบวันที่จากฟิลด์ต่างๆ ที่อาจมีวันที่
            const orderDate = order.orderDate || order.createdAt || order.created_at || order.date;
            if (orderDate) {
              const year = new Date(orderDate).getFullYear();
              return year.toString() === selectedYear;
            }
            return false;
          });
        }
        
        return filteredOrders;
      };

      const filteredPurchaseorders = filterOrders();
      console.log('Filtered orders for year', selectedYear, ':', filteredPurchaseorders.length);

      // 2. นับสถานะ
      const counts = filteredPurchaseorders.reduce((acc, order) => {
        const status = order.status || "no data";
        if (status === "อนุมัติให้ผลิต") acc.approved++;
        else if (status === "กลับมาใหม่สั่งซื้อ") acc.returned++;
        else acc.noData++;
        return acc;
      }, { approved: 0, returned: 0, noData: 0 });

      setStats(counts);

      // 3. จัดกลุ่มลูกค้า
      const customerCounts = {};
      filteredPurchaseorders.forEach((order) => {
        const name = order.customerName || "no data";
        const isApproved = order.status === "อนุมัติให้ผลิต";
        const value = isApproved ? (parseFloat(order.orderSumYard || 0) * parseFloat(order.priceYard || 0)) : 0;
        
        if (customerCounts[name]) {
          customerCounts[name].count += 1;
          customerCounts[name].approvedCount += isApproved ? 1 : 0;
          customerCounts[name].totalAmount += value;
        } else {
          customerCounts[name] = {
            customerName: name,
            count: 1,
            approvedCount: isApproved ? 1 : 0,
            totalAmount: value
          };
        }
      });

      console.log('Customer Counts:', customerCounts);

      // แปลงเป็น array และเรียงตามจำนวน
      const sortedCustomers = Object.values(customerCounts)
        .sort((a, b) => b.count - a.count);
      
      setCustomerData(sortedCustomers);

      // 4. แยกด้ายยืน
      const extractedTextArray = filteredPurchaseorders.map((order) => {
        const fabricStructure = order.fabricStructure || "";
        return fabricStructure.split(" * ")[0].trim(); // ข้อความก่อน '*'
      }).filter(text => text && text !== "");

      // นับความถี่ของด้ายยืน
      const fabricCounts = {};
      extractedTextArray.forEach(fabric => {
        fabricCounts[fabric] = (fabricCounts[fabric] || 0) + 1;
      });

      const sortedFabrics = Object.entries(fabricCounts)
        .map(([fabricCode, count]) => ({ fabricCode, count }))
        .sort((a, b) => b.count - a.count);
      
      setFabricData(sortedFabrics);

      // 5. แยกด้ายพุ่ง
      const extractedAfterTextArray = filteredPurchaseorders.map((order) => {
        const fabricStructure = order.fabricStructure || "";
        const parts = fabricStructure.split(" * ");
        if (parts.length > 1) {
          return parts[1].split(" / ")[0].trim(); // ข้อความระหว่าง '*' และ '/'
        }
        return "";
      }).filter(text => text && text !== "");

      // นับความถี่ของด้ายพุ่ง
      const threadCounts = {};
      extractedAfterTextArray.forEach(thread => {
        threadCounts[thread] = (threadCounts[thread] || 0) + 1;
      });

      const sortedThreads = Object.entries(threadCounts)
        .map(([threadCode, count]) => ({ threadCode, count }))
        .sort((a, b) => b.count - a.count);
      
      setThreadData(sortedThreads);
      setOrders(sortedCustomers);
      
    } catch (error) {
      console.error('Error processing order data:', error);
    }
  };

  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  // สร้างรายการปีจากข้อมูลที่มี
  const getAvailableYears = () => {
    const years = new Set();
    astPurchaseorder.forEach(order => {
      const orderDate = order.orderDate || order.createdAt || order.created_at || order.date;
      if (orderDate) {
        const year = new Date(orderDate).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // เรียงจากปีล่าสุด
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { class: 'bg-warning', text: 'รอดำเนินการ' },
      processing: { class: 'bg-info', text: 'กำลังดำเนินการ' },
      completed: { class: 'bg-success', text: 'เสร็จสิ้น' },
      cancelled: { class: 'bg-danger', text: 'ยกเลิก' }
    };
    
    const config = statusConfig[status] || { class: 'bg-secondary', text: status };
    return <span className={`badge ${config.class}`}>{config.text}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">บริษัทที่มีการออกใบสั่งขาย</h1>
        <select 
          className="form-select" 
          style={{ width: 'auto' }}
          value={selectedYear}
          onChange={handleYearChange}
        >
          <option value="all">ทุกปี</option>
          {getAvailableYears().map(year => (
            <option key={year} value={year.toString()}>{year}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error} (แสดงข้อมูลตัวอย่าง)
        </div>
      )}

      {/* Summary Stats */}
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h6>อนุมัติให้ผลิต: {stats.approved}</h6>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h6>กลับมาใหม่สั่งซื้อ: {stats.returned}</h6>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h6>No Data: {stats.noData}</h6>
            </div>
          </div>
        </div>
      </div>

      {/* จำนวนลูกค้า Section */}
      <div className="card shadow mb-4">
        <div className="card-header">
          <h5 className="m-0 fw-bold text-primary">จำนวนลูกค้า</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <table className="table table-hover">
              <thead className="table-light sticky-top">
                <tr>
                  <th>บริษัท</th>
                  <th className="text-center">จำนวน</th>
                  <th className="text-center">จำนวนอนุมัติ</th>
                  <th className="text-center">ยอดขาย</th>
                </tr>
              </thead>
              <tbody>
                {customerData.map((customer, index) => (
                  <tr key={index}>
                    <td>{customer.customerName}</td>
                    <td className="text-center">{customer.count}</td>
                    <td className="text-center">{customer.approvedCount}</td>
                    <td className="text-center">{formatCurrency(customer.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ใช้ด้ายยีน Section */}
      <div className="card shadow mb-4">
        <div className="card-header">
          <h5 className="m-0 fw-bold text-primary">ใช้ด้ายยืน</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table className="table table-hover">
              <thead className="table-light sticky-top">
                <tr>
                  <th>ด้ายยีน</th>
                  <th className="text-center">จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {fabricData.map((fabric, index) => (
                  <tr key={index}>
                    <td>{fabric.fabricCode}</td>
                    <td className="text-center">{fabric.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ใช้ด้ายยุง Section */}
      <div className="card shadow">
        <div className="card-header">
          <h5 className="m-0 fw-bold text-primary">ใช้ด้ายพุ่ง</h5>
        </div>
        <div className="card-body">
          <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table className="table table-hover">
              <thead className="table-light sticky-top">
                <tr>
                  <th>ด้ายยีน</th>
                  <th className="text-center">จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {threadData.map((thread, index) => (
                  <tr key={index}>
                    <td>{thread.threadCode}</td>
                    <td className="text-center">{thread.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Orders;
