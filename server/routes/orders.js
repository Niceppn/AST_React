const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM ast_purchaseorders';
        const [rows] = await pool.execute(query);

        res.json({
            success: true,
            message: 'ดึงข้อมูล Purchase Orders สำเร็จ',
            data: {
                astPurchaseorder: rows
            },
            count: {
                astPurchaseorder: rows.length
            }
        });
    } catch (error) {
        console.error('Failed to fetch purchase orders:', error);
        res.status(500).json({
            success: false,
            message: 'ไม่สามารถโหลดข้อมูล Purchase Orders ได้',
            error: error.message
        });
    }
});



module.exports = router;