// server/model/user.js

const { pool } = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  // Get all users
  static async findAll() {
    try {
      const [rows] = await pool.execute('SELECT * FROM users ORDER BY created_at DESC');
      return rows;
    } catch (error) {
      console.error('Error in User.findAll:', error);
      throw error;
    }
  }

  // Get user by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error in User.findById:', error);
      throw error;
    }
  }

  // Create new user
  static async create(userData) {
    try {
      const { name, email, password, user_type } = userData;
      
      const [result] = await pool.execute(
        'INSERT INTO users (name, email, user_type, password, created_at) VALUES (?, ?, ?, ?, NOW())',
        [name, email, user_type || 'materialstaff', password]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error in User.create:', error);
      throw error;
    }
  }

  // Update user
  static async update(id, userData) {
    try {
      const { name, email, role } = userData;
      // แปลง role เป็น user_type ตาม database structure
      const userType = role === 'admin' ? 'admin' : 'materialstaff';
      
      const [result] = await pool.execute(
        'UPDATE users SET name = ?, email = ?, user_type = ?, updated_at = NOW() WHERE id = ?',
        [name, email, userType, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in User.update:', error);
      throw error;
    }
  }

  // Delete user
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in User.delete:', error);
      throw error;
    }
  }

  // Get user count
  static async getCount() {
    try {
      const [rows] = await pool.execute('SELECT COUNT(*) as count FROM users');
      return rows[0]?.count || 0;
    } catch (error) {
      console.error('Error in User.getCount:', error);
      throw error;
    }
  }

  // Find user by email for login
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error in User.findByEmail:', error);
      throw error;
    }
  }

  // Authenticate user
  static async authenticate(email, password) {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        console.log('❌ User not found:', email);
        return null;
      }

      console.log('🔍 Found user:', user.name, 'Email:', user.email);
      
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (isPasswordValid) {
        console.log('✅ Password validation successful');
        // ลบ password ออกจาก response เพื่อความปลอดภัย
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
      
      console.log('❌ Password validation failed');
      return null;
    } catch (error) {
      console.error('Error in User.authenticate:', error);
      throw error;
    }
  }
}

module.exports = User;
