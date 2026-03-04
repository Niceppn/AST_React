// server/index.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { testConnection } = require('./config/database');
const { verifyToken } = require('./middleware/auth');

// Import routes
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const purchaseOrderRoutes = require('./routes/purchaseOrderRoutes');
const rawMaterialRoutes = require('./routes/rawMaterialRoutes')
const { pool } = require('./config/database');
const User = require('./model/user');
const orders = require('./routes/orders'); // Import the order route


const app = express();
const PORT = process.env.SERVER_PORT || 8000;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://dashboard.ast-manufacturing.com',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../build')));

// Authentication API endpoints
app.post('/api/auth/login', async (req, res) => {
  console.log('🔐 Login attempt');
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอก email และ password'
      });
    }

    const user = await User.authenticate(email, password);
    
    if (!user) {
      console.log('❌ Authentication failed');
      return res.status(401).json({
        success: false,
        message: 'Email หรือ Password ไม่ถูกต้อง'
      });
    }

    // intentionally not logging user details here

    const token = jwt.sign(
      { id: user.id, email: user.email, user_type: user.user_type },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: user.user_type
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในระบบ'
    });
  }
});

// Register new user
app.post('/api/auth/register', async (req, res) => {
  console.log('📝 Register attempt');
  
  try {
    const { name, email, password, user_type = 'materialstaff' } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกชื่อ อีเมล และรหัสผ่าน'
      });
    }

    console.log(`📝 Creating user: ${name} (${email}) - ${user_type}`);
    
    // ตรวจสอบว่าผู้ใช้มีอยู่แล้วหรือไม่
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      console.log('❌ User already exists');
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้มีผู้ใช้งานแล้ว'
      });
    }
    
    // เข้ารหัสรหัสผ่าน
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    console.log('🔐 Password hashed successfully');
    
    // สร้างผู้ใช้ใหม่
    const userId = await User.create({
      name,
      email,
      password: hashedPassword,
      user_type
    });
    
    console.log(`✅ User created successfully with ID: ${userId}`);
    
    res.status(201).json({
      success: true,
      message: 'สร้างผู้ใช้สำเร็จ',
      userId: userId
    });
    
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในระบบ'
    });
  }
});

// Check authentication status
app.get('/api/auth/me', async (req, res) => {
  // สำหรับตอนนี้จะ return mock data
  // ในการใช้งานจริงควรใช้ JWT token เพื่อตรวจสอบ authentication
  res.json({
    success: true,
    user: null // หรือข้อมูล user ถ้า authenticated
  });
});

// NOTE: /api/auth/update-password and /api/auth/debug-user have been removed.
// Password changes must be done through the user management page with proper authentication.

// API Routes (protected)
app.use('/api/users', verifyToken, userRoutes);
app.use('/api/order', verifyToken, orderRoutes);
app.use('/api/dashboard', verifyToken, dashboardRoutes);
app.use('/api/purchase-orders', verifyToken, purchaseOrderRoutes);
app.use('/api/raw-materials', verifyToken, rawMaterialRoutes);
app.use('/api/orders', verifyToken, orders);
app.use('/api/stock-balance', verifyToken, require('./routes/stockBalanceRoutes'));
// ===============================
// Fabricouts API (refId grouped)
// ===============================
app.get('/api/fabricouts', verifyToken, async (req, res) => {
  console.log('📊 Fabricouts API called, query:', req.query);

  // helper รวมข้อมูลต่อใบส่ง
  const groupAndSumData = (data) => {
    const grouped = {};

    data.forEach((item) => {
      const key =
        item.refId ||
        `${item.vatType || ''}-${item.vatNo || ''}-${item.createDate || ''}`;

      if (!grouped[key]) {
        grouped[key] = {
          ...item,
          billNumber:
            item.refId || `${item.vatType || ''} ${item.vatNo || ''}`.trim(),
          _rowCount: 0,
          fold: 0,
          sumYard: 0,
        };
      }

      grouped[key]._rowCount += 1;
      grouped[key].fold = grouped[key]._rowCount;

      grouped[key].sumYard += Number(item.sumYard) || 0;
    });

    return Object.values(grouped).map((item) => {
      const { _rowCount, ...rest } = item;
      return rest;
    });
  };

  try {
    if (!pool) throw new Error('Database pool not available');

    const { month, year, vatType, limit } = req.query;

    const isEmpty = (v) =>
      v === undefined || v === null || v === '' || v === 'all' || v === 'ทั้งหมด';

    const where = [];
    const params = [];

    if (!isEmpty(month)) {
      where.push('MONTH(createDate) = ?');
      params.push(parseInt(month));
    }

    if (!isEmpty(year)) {
      where.push('YEAR(createDate) = ?');
      params.push(parseInt(year));
    }

    if (!isEmpty(vatType)) {
      where.push('vatType = ?');
      params.push(vatType);
    }

    const whereSQL = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const finalLimit =
      !isNaN(parseInt(limit)) && parseInt(limit) > 0 ? parseInt(limit) : 15000;

    const sql = `
      SELECT * 
      FROM fabricouts
      ${whereSQL}
      ORDER BY createDate DESC
      LIMIT ?
    `;

    console.log('🔍 SQL:', sql.trim());
    console.log('🔍 Params:', [...params, finalLimit]);

    const [rows] = await pool.execute(sql, [...params, finalLimit]);
    console.log(`✅ Query OK: ${rows.length} raw rows`);

    const groupedData = groupAndSumData(rows);

    console.log(`📦 Grouped result: ${groupedData.length} bills`);

    return res.json({
      data: groupedData,
      pagination: null,
    });
  } catch (err) {
    console.error('❌ Error fabricouts:', err);
    return res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล fabricouts',
      error: err.message,
    });
  }
});

// Fabricouts API endpoint

// Stockfabrics API endpoint
app.get('/api/stockfabrics', verifyToken, async (req, res) => {
  console.log('📦 Stockfabrics API called');
  
  try {
    // Test if pool is available
    if (!pool) {
      throw new Error('Database pool not available');
    }
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    // Get filter parameters
    const { fabricStruct, month, year } = req.query;
    
    // Build WHERE clause for filters
    let whereClause = [];
    let queryParams = [];
    
    if (fabricStruct && fabricStruct !== '') {
      whereClause.push('(fabricStruct = ? OR fabricId = ? OR refId = ?)');
      queryParams.push(fabricStruct, fabricStruct, fabricStruct);
    }
    
    if (month && month !== '') {
      whereClause.push('MONTH(createDate) = ?');
      queryParams.push(parseInt(month));
    }
    
    if (year && year !== '') {
      whereClause.push('YEAR(createDate) = ?');
      queryParams.push(parseInt(year));
    }
    
    const whereSQL = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
    
    // Build main query
    const mainQuery = `SELECT * FROM stockfabrics ${whereSQL} ORDER BY createDate DESC LIMIT ? OFFSET ?`;
    const countQuery = `SELECT COUNT(*) as total FROM stockfabrics ${whereSQL}`;
    
    console.log(`🔍 Executing stockfabrics query: ${mainQuery}`);
    console.log(`📊 Filter params:`, { fabricStruct, month, year });
    
    // Execute main query with filters
    const [rows] = await pool.execute(mainQuery, [...queryParams, limit, offset]);
    console.log(`✅ Stockfabrics query successful, found ${rows.length} rows`);
    
    // Get total count for pagination with same filters
    const [countResult] = await pool.execute(countQuery, queryParams);
    const total = countResult[0].total;
    
    const response = {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      }
    };
    
    console.log(`📄 Returning stockfabrics page ${page} of ${response.pagination.totalPages}, ${rows.length} items`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error fetching stockfabrics:', error.message);
    console.error('Error details:', error);
    
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล stockfabrics',
      error: error.message,
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
  
  // Test database connection on startup
  await testConnection();
});

module.exports = app;
