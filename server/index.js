// server/index.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

const { testConnection } = require('./config/database');

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
app.use(cors());
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

    console.log(`🔍 Authenticating user: ${email}`);
    
    // Debug: ตรวจสอบข้อมูลผู้ใช้ในฐานข้อมูลก่อน
    const [debugRows] = await pool.execute('SELECT id, name, email, user_type, LEFT(password, 20) as password_preview FROM users WHERE email = ?', [email]);
    if (debugRows.length > 0) {
      console.log('🔍 User found in database:', {
        id: debugRows[0].id,
        name: debugRows[0].name,
        email: debugRows[0].email,
        user_type: debugRows[0].user_type,
        password_preview: debugRows[0].password_preview
      });
    } else {
      console.log('❌ User not found in database');
      return res.status(401).json({
        success: false,
        message: 'Email หรือ Password ไม่ถูกต้อง'
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

    console.log(`Login successful for user: ${user.name}`);
    
    res.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
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

// Update user password (for testing/admin purposes)
app.post('/api/auth/update-password', async (req, res) => {
  console.log('🔑 Password update attempt');
  
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอก email และ password ใหม่'
      });
    }

    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const [result] = await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE email = ?',
      [hashedPassword, email]
    );
    
    if (result.affectedRows > 0) {
      console.log(`✅ Password updated for: ${email}`);
      res.json({
        success: true,
        message: 'อัปเดตรหัสผ่านสำเร็จ',
        hashedPassword: hashedPassword
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้งาน'
      });
    }
    
  } catch (error) {
    console.error('❌ Password update error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในระบบ'
    });
  }
});

// Debug endpoint to check user data
app.post('/api/auth/debug-user', async (req, res) => {
  try {
    const { email } = req.body;
    const [rows] = await pool.execute('SELECT id, name, email, user_type, LEFT(password, 60) as password_hash FROM users WHERE email = ?', [email]);
    
    if (rows.length > 0) {
      res.json({
        found: true,
        user: rows[0]
      });
    } else {
      res.json({
        found: false,
        message: 'User not found'
      });
    }
  } catch (error) {
    console.error('Debug user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/raw-materials', rawMaterialRoutes);
app.use('/api/orders', orders);

// Fabricouts API endpoint
app.get('/api/fabricouts', async (req, res) => {
  console.log('📊 Fabricouts API called');
  
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
    const { month, year, vatType } = req.query;
    
    // Build WHERE clause for filters
    let whereClause = [];
    let queryParams = [];
    
    if (month && month !== '') {
      whereClause.push('MONTH(createDate) = ?');
      queryParams.push(parseInt(month));
    }
    
    if (year && year !== '') {
      whereClause.push('YEAR(createDate) = ?');
      queryParams.push(parseInt(year));
    }
    
    if (vatType && vatType !== '') {
      whereClause.push('vatType = ?');
      queryParams.push(vatType);
    }
    
    const whereSQL = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';
    
    // Build main query
    const mainQuery = `SELECT * FROM fabricouts ${whereSQL} ORDER BY createDate DESC LIMIT ? OFFSET ?`;
    const countQuery = `SELECT COUNT(*) as total FROM fabricouts ${whereSQL}`;
    
    console.log(`🔍 Executing filtered query: ${mainQuery}`);
    console.log(`📊 Filter params:`, { month, year, vatType });
    
    // Execute main query with filters
    const [rows] = await pool.execute(mainQuery, [...queryParams, limit, offset]);
    console.log(`✅ Query successful, found ${rows.length} rows`);
    
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
    
    console.log(`📄 Returning page ${page} of ${response.pagination.totalPages}, ${rows.length} items`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error fetching fabricouts:', error.message);
    console.error('Error details:', error);
    
    // Return mock data on error
    const mockData = {
      data: [
        
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 3,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      }
    };
    console.log('🔄 Returning mock data due to error');
    res.json(mockData);
  }
});

// Stockfabrics API endpoint
app.get('/api/stockfabrics', async (req, res) => {
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
    
    //
    console.log('🔄 Returning mock stockfabrics data due to error');
    res.json(mockData);
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
