
const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DATABASE_HOST || '128.199.238.141',
  user: process.env.DATABASE_USER || 'astReact',
  password: process.env.DATABASE_PASSWORD || '12345678Q',
  database: process.env.DATABASE_NAME || 'ast',
  port: process.env.DATABASE_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    console.log(`📊 Connected to: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️  Server will continue running but database features may not work');
    console.log(`🔧 Check your database configuration:`);
    console.log(`   - Host: ${dbConfig.host}`);
    console.log(`   - Port: ${dbConfig.port}`);
    console.log(`   - Database: ${dbConfig.database}`);
    console.log(`   - User: ${dbConfig.user}`);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
