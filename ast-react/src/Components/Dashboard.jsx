// src/components/Dashboard.jsx
import { API_BASE_URL } from "@/config/apiBase";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  BarElement,
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  BarElement
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalStock: 0,
    totalMaterial: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topFabrics, setTopFabrics] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [threadData, setThreadData] = useState([]);

  const API_URL = `${API_BASE_URL}/api`;

  useEffect(() => {
    fetchDashboardStats();
    fetchTopFabrics();
    fetchCustomerData();
    fetchThreadData();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/dashboard/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      
      // Fallback data
      setStats({
      
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTopFabrics = async () => {
    try {
      console.log('Fetching top fabrics from:', `${API_URL}/orders`);
      const response = await axios.get(`${API_URL}/orders`);
      
      const purchaseOrders = response.data.data.astPurchaseorder || [];
      console.log('Processing', purchaseOrders.length, 'purchase orders for top fabrics');
      
      if (purchaseOrders.length > 0) {
        // แยกด้ายยืนจาก fabricStructure
        const extractedTextArray = purchaseOrders.map((order) => {
          const fabricStructure = order.fabricStructure || "";
          return fabricStructure.split(" * ")[0].trim(); // ข้อความก่อน '*'
        }).filter(text => text && text !== "");

        // นับความถี่ของด้ายยืน
        const fabricCounts = {};
        extractedTextArray.forEach(fabric => {
          fabricCounts[fabric] = (fabricCounts[fabric] || 0) + 1;
        });

        // แปลงเป็น array และเรียงตามจำนวน แล้วเอา 20 อันดับแรก
        const sortedFabrics = Object.entries(fabricCounts)
          .map(([fabricCode, count]) => ({ fabricCode, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20); // เอา 20 อันดับแรกเท่านั้น
        
        console.log('Top 20 fabrics:', sortedFabrics);
        setTopFabrics(sortedFabrics);
      } else {
        // Mock data หากไม่มีข้อมูล
        const mockTopFabrics = 
        
        setTopFabrics(mockTopFabrics);
      }
    } catch (error) {
      console.error('Failed to fetch top fabrics:', error);
      // Mock data หากเกิดข้อผิดพลาด
      const mockTopFabrics = [
        { fabricCode: 'CP40', count: 44 },
        { fabricCode: 'OE20', count: 39 },
        { fabricCode: 'TC45', count: 34 },
        { fabricCode: 'CP60', count: 21 },
        { fabricCode: 'XE20', count: 16 }
      ];
      setTopFabrics(mockTopFabrics);
    }
  };

  const fetchCustomerData = async () => {
    try {
      console.log('Fetching customer data from:', `${API_URL}/orders`);
      const response = await axios.get(`${API_URL}/orders`);
      
      const purchaseOrders = response.data.data.astPurchaseorder || [];
      console.log('Processing', purchaseOrders.length, 'purchase orders for customer data');
      
      if (purchaseOrders.length > 0) {
        // จัดกลุ่มลูกค้า
        const customerCounts = {};
        purchaseOrders.forEach((order) => {
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

        // แปลงเป็น array และเรียงตามจำนวน แล้วเอา 20 อันดับแรก
        const sortedCustomers = Object.values(customerCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 20); // เอา 20 อันดับแรกเท่านั้น

        console.log('Top 20 customers:', sortedCustomers);
        setCustomerData(sortedCustomers);
      } else {
        // Mock data หากไม่มีข้อมูล
        const mockCustomerData = [

        ];
        setCustomerData(mockCustomerData);
      }
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
      // Mock data หากเกิดข้อผิดพลาด
      const mockCustomerData = [
      
      ];
      setCustomerData(mockCustomerData);
    }
  };

  const fetchThreadData = async () => {
    try {
      console.log('Fetching thread data from:', `${API_URL}/orders`);
      const response = await axios.get(`${API_URL}/orders`);
      
      const purchaseOrders = response.data.data.astPurchaseorder || [];
      console.log('Processing', purchaseOrders.length, 'purchase orders for thread data');
      
      if (purchaseOrders.length > 0) {
        // แยกด้ายพุ่งจาก fabricStructure
        const extractedAfterTextArray = purchaseOrders.map((order) => {
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

        // แปลงเป็น array และเรียงตามจำนวน แล้วเอา 20 อันดับแรก
        const sortedThreads = Object.entries(threadCounts)
          .map(([threadCode, count]) => ({ threadCode, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20); // เอา 20 อันดับแรกเท่านั้น
        
        console.log('Top 20 threads:', sortedThreads);
        setThreadData(sortedThreads);
      } else {
        // Mock data หากไม่มีข้อมูล
        const mockThreadData = [
        
        ];
        setThreadData(mockThreadData);
      }
    } catch (error) {
      console.error('Failed to fetch thread data:', error);
      // Mock data หากเกิดข้อผิดพลาด
      const mockThreadData = [
     
      ];
      setThreadData(mockThreadData);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  // สร้างข้อมูลสำหรับ Pie Chart ของ Fabrics
  const pieChartData = {
    labels: topFabrics.map(fabric => fabric.fabricCode),
    datasets: [
      {
        label: 'จำนวนการใช้งาน',
        data: topFabrics.map(fabric => fabric.count),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F43', '#10AC84', '#5F27CD', '#00D2D3', '#FF3838',
          '#FF6348', '#2ED573', '#5742D3', '#F8B500', '#B33771',
          '#3C40C6', '#05C46B', '#FFC312', '#C44569', '#F8B500'
        ],
        borderColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F43', '#10AC84', '#5F27CD', '#00D2D3', '#FF3838',
          '#FF6348', '#2ED573', '#5742D3', '#F8B500', '#B33771',
          '#3C40C6', '#05C46B', '#FFC312', '#C44569', '#F8B500'
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          '#FF6384CC', '#36A2EBCC', '#FFCE56CC', '#4BC0C0CC', '#9966FFCC',
          '#FF9F43CC', '#10AC84CC', '#5F27CDCC', '#00D2D3CC', '#FF3838CC',
          '#FF6348CC', '#2ED573CC', '#5742D3CC', '#F8B500CC', '#B33771CC',
          '#3C40C6CC', '#05C46BCC', '#FFC312CC', '#C44569CC', '#F8B500CC'
        ],
      },
    ],
  };

  // สร้างข้อมูลสำหรับ Pie Chart ของลูกค้า
  const customerPieChartData = {
    labels: customerData.map(customer => {
      // ตัดชื่อให้สั้นลง
      const shortName = customer.customerName.length > 25 
        ? customer.customerName.substring(0, 25) + '...' 
        : customer.customerName;
      return shortName;
    }),
    datasets: [
      {
        label: 'จำนวนออเดอร์',
        data: customerData.map(customer => customer.count),
        backgroundColor: [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', 
          '#FF9F43', '#10AC84', '#5F27CD', '#00D2D3', '#FF3838',
          '#FF6348', '#2ED573', '#5742D3', '#F8B500', '#B33771',
          '#3C40C6', '#05C46B', '#FFC312', '#C44569', '#F8B500'
        ],
        borderColor: [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
          '#FF9F43', '#10AC84', '#5F27CD', '#00D2D3', '#FF3838',
          '#FF6348', '#2ED573', '#5742D3', '#F8B500', '#B33771',
          '#3C40C6', '#05C46B', '#FFC312', '#C44569', '#F8B500'
        ],
        borderWidth: 3,
        hoverBackgroundColor: [
          '#FF6B6BDD', '#4ECDC4DD', '#45B7D1DD', '#FFA07ADD', '#98D8C8DD',
          '#FF9F43DD', '#10AC84DD', '#5F27CDDD', '#00D2D3DD', '#FF3838DD',
          '#FF6348DD', '#2ED573DD', '#5742D3DD', '#F8B500DD', '#B33771DD',
          '#3C40C6DD', '#05C46BDD', '#FFC312DD', '#C44569DD', '#F8B500DD'
        ],
        hoverBorderWidth: 4,
      },
    ],
  };

  // สร้างข้อมูลสำหรับ Pie Chart ของด้ายพุ่ง
  const threadPieChartData = {
    labels: threadData.map(thread => thread.threadCode),
    datasets: [
    {
      label: 'จำนวนการใช้งาน',
      data: threadData.map(thread => thread.count),
      backgroundColor: [
        '#E74C3C', '#3498DB', '#F39C12', '#27AE60', '#9B59B6', 
        '#E67E22', '#1ABC9C', '#34495E', '#F1C40F', '#E91E63',
        '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4',
        '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39'
      ],
      borderColor: [
        '#E74C3C', '#3498DB', '#F39C12', '#27AE60', '#9B59B6',
        '#E67E22', '#1ABC9C', '#34495E', '#F1C40F', '#E91E63',
        '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4',
        '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39'
      ],
      borderWidth: 2,
      hoverBackgroundColor: [
        '#E74C3CCC', '#3498DBCC', '#F39C12CC', '#27AE60CC', '#9B59B6CC',
        '#E67E22CC', '#1ABC9CCC', '#34495ECC', '#F1C40FCC', '#E91E63CC',
        '#9C27B0CC', '#673AB7CC', '#3F51B5CC', '#2196F3CC', '#03A9F4CC',
        '#00BCD4CC', '#009688CC', '#4CAF50CC', '#8BC34ACC', '#CDDC39CC'
      ],
    },
  ],
}

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display:false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = topFabrics[context.dataIndex]?.fabricCode || '';
            const value = context.raw;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} ครั้ง (${percentage}%)`;
          }
        }
      }
    },
  };

  const customerPieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // ปิด legend เพื่อไม่ให้แออัด เนื่องจากมีข้อมูล 20 รายการ
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const customer = customerData[context.dataIndex];
            const value = context.raw;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return [
              `บริษัท: ${customer?.customerName || ''}`,
              `ออเดอร์: ${value} รายการ (${percentage}%)`,
              `อนุมัติ: ${customer?.approvedCount || 0} รายการ`,
              `ยอดขาย: ${customer ? formatCurrency(customer.totalAmount) : '฿0'}`
            ];
          }
        }
      }
    },
  };

  const threadPieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // ปิด legend เพื่อไม่ให้แออัด เนื่องจากมีข้อมูล 20 รายการ
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = threadData[context.dataIndex]?.threadCode || '';
            const value = context.raw;
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} ครั้ง (${percentage}%)`;
          }
        }
      }
    },
  };

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
        <h1 className="h2 mb-0">Dashboard</h1>
        {/* <div className="d-flex">
          <button className="btn btn-outline-primary me-2">
            <i className="bi bi-download me-1"></i>Export
          </button>
          <button className="btn btn-primary">
            <i className="bi bi-plus-lg me-1"></i>Add New
          </button>
        </div> */}
      </div>

      {/* Stats Cards */}
      {/* <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-primary text-uppercase mb-1">
                    ผู้ใช้งานทั้งหมด
                  </div>
                  <div className="h5 mb-0 fw-bold text-gray-800">{stats.totalUsers}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-people fs-2 text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-success shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-success text-uppercase mb-1">
                    ออเดอร์ทั้งหมด
                  </div>
                  <div className="h5 mb-0 fw-bold text-gray-800">{stats.totalOrders}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-cart fs-2 text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-info shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-info text-uppercase mb-1">
                    สต๊อกผ้า
                  </div>
                  <div className="h5 mb-0 fw-bold text-gray-800">{stats.totalStock}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-box fs-2 text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-warning shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-warning text-uppercase mb-1">
                    วัตถุดิบ
                  </div>
                  <div className="h5 mb-0 fw-bold text-gray-800">{stats.totalMaterial}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-layers fs-2 text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div> */}

      {/* Charts Row */}
      <div className="row">
        <div className="col-xl-8 col-lg-7">
          <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 fw-bold text-primary">20 อันดับใบสั่งขายสูงสุด</h6>
              <div className="dropdown no-arrow">
                <button 
                  className="btn btn-link btn-sm text-muted" 
                  onClick={fetchCustomerData}
                  title="รีเฟรชข้อมูล"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-pie pt-3 pb-2" style={{ height: '350px' }}>
                {customerData.length > 0 ? (
                  <Pie data={customerPieChartData} options={customerPieChartOptions} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    <div className="text-center">
                      <i className="bi bi-pie-chart fs-1 mb-3"></i>
                      <p>กำลังโหลดข้อมูล...</p>
                    </div>
                  </div>
                )}
              </div>
              
              
              {/* แสดงรายละเอียด Top 20 Customers */}
              {customerData.length > 0 && (
                <div className="mt-4 pt-3 border-top">
                  <h6 className="fw-bold text-secondary mb-3">รายละเอียด 20 อันดับแรก:</h6>
                  <div className="row" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {customerData.map((customer, index) => (
                      <div key={index} className="col-12 mb-3">
                        <div className="d-flex align-items-center justify-content-between p-3 bg-light rounded">
                          <div className="d-flex align-items-center">
                            <div 
                              className="me-3 rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                              style={{ 
                                width: '40px', 
                                height: '40px', 
                                backgroundColor: customerPieChartData.datasets[0].backgroundColor[index % customerPieChartData.datasets[0].backgroundColor.length],
                                fontSize: '0.9rem'
                              }}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>
                                {customer.customerName.length > 50 
                                  ? customer.customerName.substring(0, 50) + '...' 
                                  : customer.customerName}
                              </div>
                              <small className="text-muted">
                                อนุมัติ: {customer.approvedCount} จาก {customer.count} รายการ
                              </small>
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold text-primary mb-1" style={{ fontSize: '1.1rem' }}>
                              {customer.count} ออเดอร์
                            </div>
                            <div className="text-success fw-medium" style={{ fontSize: '0.9rem' }}>
                              {formatCurrency(customer.totalAmount)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-xl-4 col-lg-5">
          {/* ด้ายยืน Chart */}
          <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 fw-bold text-primary">ด้ายยืนที่ใช้มากที่สุด 20 อันดับ</h6>
              <div className="dropdown no-arrow">
                <button 
                  className="btn btn-link btn-sm text-muted" 
                  onClick={fetchTopFabrics}
                  title="รีเฟรชข้อมูล"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-pie pt-2 pb-2" style={{ height: '250px' }}>
                {topFabrics.length > 0 ? (
                  <Pie data={pieChartData} options={pieChartOptions} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    <div className="text-center">
                      <i className="bi bi-pie-chart fs-1 mb-3"></i>
                      <p>กำลังโหลดข้อมูล...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* แสดงรายละเอียดด้ายยืน */}
              {topFabrics.length > 0 && (
                <div className="mt-3 pt-2 border-top">
                  <h6 className="fw-bold text-secondary mb-2" style={{ fontSize: '0.9rem' }}>รายละเอียด 20 อันดับแรก:</h6>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {topFabrics.map((fabric, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                        <div className="d-flex align-items-center">
                          <div 
                            className="me-2 rounded-circle" 
                            style={{ 
                              width: '10px', 
                              height: '10px', 
                              backgroundColor: pieChartData.datasets[0].backgroundColor[index % pieChartData.datasets[0].backgroundColor.length] 
                            }}
                          ></div>
                          <span className="small fw-medium" style={{ fontSize: '0.8rem' }}>
                            {index + 1}. {fabric.fabricCode}
                          </span>
                        </div>
                        <span className="badge bg-primary" style={{ fontSize: '0.7rem' }}>{fabric.count} ครั้ง</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ด้ายพุ่ง Chart */}
          <div className="card shadow mb-4">
            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
              <h6 className="m-0 fw-bold text-primary">ด้ายพุ่งที่ใช้มากที่สุด 20 อันดับ</h6>
              <div className="dropdown no-arrow">
                <button 
                  className="btn btn-link btn-sm text-muted" 
                  onClick={fetchThreadData}
                  title="รีเฟรชข้อมูล"
                >
                  <i className="bi bi-arrow-clockwise"></i>
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="chart-pie pt-2 pb-2" style={{ height: '250px' }}>
                {threadData.length > 0 ? (
                  <Pie data={threadPieChartData} options={threadPieChartOptions} />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                    <div className="text-center">
                      <i className="bi bi-pie-chart fs-1 mb-3"></i>
                      <p>กำลังโหลดข้อมูล...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* แสดงรายละเอียดด้ายพุ่ง */}
              {threadData.length > 0 && (
                <div className="mt-3 pt-2 border-top">
                  <h6 className="fw-bold text-secondary mb-2" style={{ fontSize: '0.9rem' }}>รายละเอียด 20 อันดับแรก:</h6>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {threadData.map((thread, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-1">
                        <div className="d-flex align-items-center">
                          <div 
                            className="me-2 rounded-circle" 
                            style={{ 
                              width: '10px', 
                              height: '10px', 
                              backgroundColor: threadPieChartData.datasets[0].backgroundColor[index % threadPieChartData.datasets[0].backgroundColor.length] 
                            }}
                          ></div>
                          <span className="small fw-medium" style={{ fontSize: '0.8rem' }}>
                            {index + 1}. {thread.threadCode}
                          </span>
                        </div>
                        <span className="badge bg-success" style={{ fontSize: '0.7rem' }}>{thread.count} ครั้ง</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      

      {/* Recent Activities */}
     
    </div>

    
  );
};

export default Dashboard;
