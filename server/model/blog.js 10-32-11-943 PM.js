// server/model/blog.js

const pool = require('../database/connection');

class Blog {
  // Find all blogs
  static async findAll() {
    try {
      const [rows] = await pool.execute(`
        SELECT b.*, u.name as author_name 
        FROM blogs b 
        LEFT JOIN users u ON b.author_id = u.id 
        ORDER BY b.created_at DESC
      `);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Find blog by ID
  static async findById(id) {
    try {
      const [rows] = await pool.execute(`
        SELECT b.*, u.name as author_name 
        FROM blogs b 
        LEFT JOIN users u ON b.author_id = u.id 
        WHERE b.id = ?
      `, [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Create new blog
  static async create(blogData) {
    try {
      const { title, content, author_id, category } = blogData;
      const [result] = await pool.execute(
        'INSERT INTO blogs (title, content, author_id, category, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [title, content, author_id, category]
      );
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  // Update blog
  static async update(id, blogData) {
    try {
      const { title, content, category } = blogData;
      const [result] = await pool.execute(
        'UPDATE blogs SET title = ?, content = ?, category = ?, updated_at = NOW() WHERE id = ?',
        [title, content, category, id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Delete blog
  static async delete(id) {
    try {
      const [result] = await pool.execute('DELETE FROM blogs WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  // Find blogs by category
  static async findByCategory(category) {
    try {
      const [rows] = await pool.execute(`
        SELECT b.*, u.name as author_name 
        FROM blogs b 
        LEFT JOIN users u ON b.author_id = u.id 
        WHERE b.category = ?
        ORDER BY b.created_at DESC
      `, [category]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Find blogs by author
  static async findByAuthor(authorId) {
    try {
      const [rows] = await pool.execute(`
        SELECT b.*, u.name as author_name 
        FROM blogs b 
        LEFT JOIN users u ON b.author_id = u.id 
        WHERE b.author_id = ?
        ORDER BY b.created_at DESC
      `, [authorId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Blog;
