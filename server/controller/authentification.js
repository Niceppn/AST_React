// server/controller/authentification.js

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/user');

class AuthController {
  // Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Use User.authenticate() method instead of direct bcrypt compare
      const user = await User.authenticate(email, password);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, userType: user.user_type },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          userType: user.user_type
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Register user
  async register(req, res) {
    try {
      const { name, email, password, user_type = 'materialstaff' } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = await User.create({
        name,
        email,
        password: hashedPassword,
        user_type
      });

      res.status(201).json({
        message: 'User created successfully',
        userId
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Verify token middleware
  verifyToken(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid token' });
    }
  }

  // Test password against hash
  async testPassword(req, res) {
    try {
      const { password, hash } = req.body;
      const isMatch = await bcrypt.compare(password, hash);
      
      res.json({
        password: password,
        hash: hash,
        isMatch: isMatch
      });
    } catch (error) {
      console.error('Test password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new AuthController();
