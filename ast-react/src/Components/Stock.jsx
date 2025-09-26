// src/components/Stock.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Stock = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStock, setEditingStock] = useState(null);

  const API_URL = 'http://localhost:8000/api';

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/dashboard/stockmaterial`);
      setStocks(response.data);
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
      setError('ไม่สามารถโหลดข้อมูลสต็อกได้');
      // Fallback data
      setStocks([
        {
          id: 1,
          product_name: 'ผ้าคอตตอน Premium',
          product_code: 'COT-001',
          quantity: 150,
          unit: 'เมตร',
          price: 500,
          category: 'ผ้าคอตตอน',
          location: 'คลัง A-1',
          last_updated: '2025-07-22T08:30:00Z'
        },
        {
          id: 2,
          product_name: 'ผ้าไหม Royal',
          product_code: 'SLK-001',
          quantity: 75,
          unit: 'เมตร',
          price: 3000,
          category: 'ผ้าไหม',
          location: 'คลัง B-2',
          last_updated: '2025-07-21T15:45:00Z'
        },
        {
          id: 3,
          product_name: 'ผ้าลินิน Organic',
          product_code: 'LIN-001',
          quantity: 200,
          unit: 'เมตร',
          price: 450,
          category: 'ผ้าลินิน',
          location: 'คลัง A-3',
          last_updated: '2025-07-20T12:20:00Z'
        },
        {
          id: 4,
          product_name: 'ผ้าโพลีเอสเตอร์',
          product_code: 'POL-001',
          quantity: 25,
          unit: 'เมตร',
          price: 200,
          category: 'ผ้าสังเคราะห์',
          location: 'คลัง C-1',
          last_updated: '2025-07-19T09:10:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (id, stockData) => {
    try {
      await axios.put(`${API_URL}/stock/${id}`, stockData);
      setEditingStock(null);
      fetchStocks(); // Reload data
    } catch (error) {
      console.error('Failed to update stock:', error);
      alert('ไม่สามารถอัปเดตสต็อกได้');
    }
  };

  const handleUpdateStock = async (id, newQuantity, newPrice) => {
    await updateStock(id, { quantity: newQuantity, price: newPrice });
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) {
      return { class: 'bg-danger', text: 'หมด', icon: 'exclamation-triangle' };
    } else if (quantity < 50) {
      return { class: 'bg-warning', text: 'น้อย', icon: 'exclamation-circle' };
    } else {
      return { class: 'bg-success', text: 'เพียงพอ', icon: 'check-circle' };
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const totalValue = stocks.reduce((sum, stock) => sum + (stock.quantity * stock.price), 0);
  const lowStockCount = stocks.filter(stock => stock.quantity < 50).length;

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
        <h1 className="h2 mb-0">จัดการสต๊อกผ้า</h1>
        <button className="btn btn-primary">
          <i className="bi bi-plus-lg me-2"></i>เพิ่มสต๊อกใหม่
        </button>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error} (แสดงข้อมูลตัวอย่าง)
        </div>
      )}

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-primary text-uppercase mb-1">
                    รายการทั้งหมด
                  </div>
                  <div className="h5 mb-0 fw-bold text-gray-800">{stocks.length}</div>
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
                    สต๊อกต่ำ
                  </div>
                  <div className="h5 mb-0 fw-bold text-gray-800">{lowStockCount}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-exclamation-triangle fs-2 text-gray-300"></i>
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
                    มูลค่ารวม
                  </div>
                  <div className="h5 mb-0 fw-bold text-gray-800">{formatCurrency(totalValue)}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-currency-dollar fs-2 text-gray-300"></i>
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
                    หมวดหมู่
                  </div>
                  <div className="h5 mb-0 fw-bold text-gray-800">
                    {new Set(stocks.map(s => s.category)).size}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-tags fs-2 text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="card shadow">
        <div className="card-header">
          <h6 className="m-0 fw-bold text-primary">รายการสต๊อกผ้า</h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>รหัสสินค้า</th>
                  <th>ชื่อสินค้า</th>
                  <th>หมวดหมู่</th>
                  <th>จำนวน</th>
                  <th>ราคาต่อหน่วย</th>
                  <th>มูลค่า</th>
                  <th>สถานะ</th>
                  <th>สถานที่</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => {
                  const status = getStockStatus(stock.quantity);
                  const isEditing = editingStock === stock.id;
                  
                  return (
                    <tr key={stock.id}>
                      <td>
                        <strong className="text-primary">{stock.product_code}</strong>
                      </td>
                      <td>{stock.product_name}</td>
                      <td>
                        <span className="badge bg-light text-dark">{stock.category}</span>
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            defaultValue={stock.quantity}
                            id={`qty-${stock.id}`}
                            style={{ width: '80px' }}
                          />
                        ) : (
                          <span>{stock.quantity} {stock.unit}</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            defaultValue={stock.price}
                            id={`price-${stock.id}`}
                            style={{ width: '100px' }}
                          />
                        ) : (
                          formatCurrency(stock.price)
                        )}
                      </td>
                      <td>
                        <strong className="text-success">
                          {formatCurrency(stock.quantity * stock.price)}
                        </strong>
                      </td>
                      <td>
                        <span className={`badge ${status.class}`}>
                          <i className={`bi bi-${status.icon} me-1`}></i>
                          {status.text}
                        </span>
                      </td>
                      <td>{stock.location}</td>
                      <td>
                        {isEditing ? (
                          <div className="btn-group" role="group">
                            <button 
                              className="btn btn-sm btn-success"
                              onClick={() => {
                                const newQty = document.getElementById(`qty-${stock.id}`).value;
                                const newPrice = document.getElementById(`price-${stock.id}`).value;
                                handleUpdateStock(stock.id, parseInt(newQty), parseFloat(newPrice));
                              }}
                            >
                              <i className="bi bi-check"></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-secondary"
                              onClick={() => setEditingStock(null)}
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                        ) : (
                          <div className="btn-group" role="group">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => setEditingStock(stock.id)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-info">
                              <i className="bi bi-eye"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stock;
