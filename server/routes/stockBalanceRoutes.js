// server/routes/stockBalanceRoutes.js
const express = require('express');
const router = express.Router();
const { getStockBalance } = require('../controller/stockBalanceController');

router.get('/', getStockBalance);

module.exports = router;
