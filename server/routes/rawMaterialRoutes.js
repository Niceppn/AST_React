const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const query = 'SELECT * FROM packageasts';
        const query2 = 'SELECT * FROM htrpackages';
        const [rows] = await pool.execute(query);
        const [rows2] = await pool.execute(query2);

        res.json({
            success: true,
            message: 'ดึงข้อมูลแพ็คเกจสำเร็จ',
            data: {
                packageasts: rows,
                htrpackages: rows2
            },
            count: {
                packageasts: rows.length,
                htrpackages: rows2.length,
                total: rows.length + rows2.length
            }
        });
    } catch (error) {
        console.error('Error fetching package data:', error);
        res.status(500).json({
            success: false,
            message: 'ไม่สามารถดึงข้อมูลแพ็คเกจได้',
            error: error.message
        });
    }
});

router.get('/stockMaterial', async (req, res) => {
    try {
        // ดึงข้อมูลจากตาราง materials (นำเข้า)
        const materialsQuery = 'SELECT * FROM materials';
        const [materialsRows] = await pool.execute(materialsQuery);

        // ดึงข้อมูลจากตาราง materialstores (นำออก)
        const materialstoresQuery = 'SELECT * FROM materialstores';
        const [materialstoresRows] = await pool.execute(materialstoresQuery);

        res.json({
            success: true,
            message: 'ดึงข้อมูลวัสดุในสต็อกสำเร็จ',
            data: {
                materials: materialsRows,
                materialstores: materialstoresRows
            },
            count: {
                materials: materialsRows.length,
                materialstores: materialstoresRows.length,
                total: materialsRows.length + materialstoresRows.length
            }
        });
    } catch (error) {
        console.error('Error fetching stock materials:', error);
        res.status(500).json({
            success: false,
            message: 'ไม่สามารถดึงข้อมูลวัสดุในสต็อกได้',
            error: error.message
        });
    }
});

module.exports = router;