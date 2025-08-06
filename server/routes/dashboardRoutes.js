// server/routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/dashboardController');

// GET /api/dashboard/stats - Get dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
