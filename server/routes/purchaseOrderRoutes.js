const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Database configuration (สำหรับทดสอบ)
const dbConfig = {
  host: process.env.DATABASE_HOST || '128.199.238.141',
  user: process.env.DATABASE_USER || 'astReact',
  password: process.env.DATABASE_PASSWORD || '12345678Q',
  database: process.env.DATABASE_NAME || 'ast',
  port: process.env.DATABASE_PORT || 3306
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// GET /api/purchase-orders - ดึงข้อมูล purchase orders ทั้งหมด
router.get('/', async (req, res) => {
  try {
    console.log('🔍 Fetching all purchase orders...');
    
    const query = 'SELECT * FROM ast_purchaseorders ORDER BY created_at DESC';
    const [rows] = await pool.execute(query);
    
    console.log(`✅ Found ${rows.length} purchase orders`);
    
    res.json({
      success: true,
      message: 'ดึงข้อมูล Purchase Orders สำเร็จ',
      data: rows,
      count: rows.length
    });
    
  } catch (error) {
    console.error('❌ Error fetching purchase orders:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Purchase Orders',
      error: error.message
    });
  }
});

// GET /api/purchase-orders/:id - ดึงข้อมูล purchase order ตาม ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching purchase order with ID: ${id}`);
    
    const query = 'SELECT * FROM ast_purchaseorders WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบ Purchase Order ที่ระบุ'
      });
    }
    
    console.log('✅ Purchase order found');
    
    res.json({
      success: true,
      message: 'ดึงข้อมูล Purchase Order สำเร็จ',
      data: rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error fetching purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Purchase Order',
      error: error.message
    });
  }
});

// POST /api/purchase-orders - สร้าง purchase order ใหม่
router.post('/', async (req, res) => {
  try {
    const purchaseOrderData = req.body;
    console.log('🆕 Creating new purchase order:', purchaseOrderData);
    
    // ดึง columns ทั้งหมดจากตาราง
    const [tableInfo] = await pool.execute('DESCRIBE ast_purchaseorders');
    const columns = tableInfo
      .filter(col => col.Field !== 'id' && col.Field !== 'created_at' && col.Field !== 'updated_at')
      .map(col => col.Field);
    
    // สร้าง query แบบ dynamic
    const values = columns.map(col => purchaseOrderData[col] || null);
    const placeholders = columns.map(() => '?').join(', ');
    const columnNames = columns.join(', ');
    
    const query = `INSERT INTO ast_purchaseorders (${columnNames}) VALUES (${placeholders})`;
    
    const [result] = await pool.execute(query, values);
    
    console.log('✅ Purchase order created with ID:', result.insertId);
    
    res.status(201).json({
      success: true,
      message: 'สร้าง Purchase Order สำเร็จ',
      data: {
        id: result.insertId,
        ...purchaseOrderData
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้าง Purchase Order',
      error: error.message
    });
  }
});

module.exports = router;
