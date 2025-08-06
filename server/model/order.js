// server/model/order.js

const { pool } = require('../config/database');

class Order {
  // Get all orders
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT o.*, u.name as user_name 
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        ORDER BY o.created_at DESC
      `);
      return rows;
    } catch (error) {
      console.error('Error in Order.findAll:', error);
      throw error;
    }
  }

  // Get order by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT o.*, u.name as user_name 
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        WHERE o.id = ?
      `, [id]);
      return rows[0] || null;
    } catch (error) {
      console.error('Error in Order.findById:', error);
      throw error;
    }
  }

  // Create new order
  static async create(orderData) {
    try {
      const { user_id, product_name, quantity, price, status } = orderData;
      const [result] = await pool.execute(
        'INSERT INTO orders (user_id, product_name, quantity, price, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [user_id, product_name, quantity, price, status || 'pending']
      );
      return result.insertId;
    } catch (error) {
      console.error('Error in Order.create:', error);
      throw error;
    }
  }

  // Update order
  static async update(id, orderData) {
    try {
      const { status, quantity, price } = orderData;
      const [result] = await pool.execute(
        'UPDATE orders SET status = ?, quantity = ?, price = ?, updated_at = NOW() WHERE id = ?',
        [status, quantity, price, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Order.update:', error);
      throw error;
    }
  }

  // Delete order
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Order.delete:', error);
      throw error;
    }
  }

  // Get order count
  static async getCount() {
    try {
      const [rows] = await pool.execute('SELECT COUNT(*) as count FROM orders');
      return rows[0]?.count || 0;
    } catch (error) {
      console.error('Error in Order.getCount:', error);
      throw error;
    }
  }
}

module.exports = Order;
