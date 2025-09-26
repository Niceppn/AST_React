const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
    try {
        // รับ date filter parameters
        const { startDate, endDate } = req.query;
        
        console.log('📊 Raw Materials API called with filters:', {
            startDate,
            endDate
        });

        let query = 'SELECT * FROM packageasts';
        let query2 = 'SELECT * FROM htrpackages';
        let queryParams = [];
        let queryParams2 = [];

        // เพิ่ม WHERE clause ถ้ามี date filter
        if (startDate && endDate) {
            // สำหรับ packageasts table - ใช้ created_at timestamp field
            query += ' WHERE DATE(created_at) BETWEEN ? AND ?';
            queryParams = [startDate, endDate];

            // สำหรับ htrpackages table - ใช้ created_at timestamp field  
            query2 += ' WHERE DATE(created_at) BETWEEN ? AND ?';
            queryParams2 = [startDate, endDate];

            console.log('🔍 Executing filtered packageasts query:', query);
            console.log('📊 Packageasts filter params:', queryParams);
            
            console.log('🔍 Executing filtered htrpackages query:', query2);
            console.log('📊 Htrpackages filter params:', queryParams2);
        } else {
            console.log('📋 No date filters applied - fetching all records');
        }

        // ดึงข้อมูลจากตาราง packageasts
        const [rows] = queryParams.length > 0 
            ? await pool.execute(query, queryParams)
            : await pool.execute(query);

        // ดึงข้อมูลจากตาราง htrpackages
        const [rows2] = queryParams2.length > 0
            ? await pool.execute(query2, queryParams2)
            : await pool.execute(query2);

        console.log('✅ Query results:', {
            packageastsCount: rows.length,
            htrpackagesCount: rows2.length,
            dateFiltered: !!(startDate && endDate)
        });

        res.json({
            success: true,
            message: startDate && endDate 
                ? `ดึงข้อมูลแพ็คเกจสำเร็จ (${startDate} ถึง ${endDate})`
                : 'ดึงข้อมูลแพ็คเกจสำเร็จ',
            data: {
                packageasts: rows,
                htrpackages: rows2
            },
            count: {
                packageasts: rows.length,
                htrpackages: rows2.length,
                total: rows.length + rows2.length
            },
            filter: {
                startDate: startDate || null,
                endDate: endDate || null,
                applied: !!(startDate && endDate)
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
        // รับ date filter parameters
        const { startDate, endDate } = req.query;
        
        console.log('📊 StockMaterial API called with filters:', {
            startDate,
            endDate
        });

        let materialsQuery = 'SELECT * FROM materials';
        let materialstoresQuery = 'SELECT * FROM materialstores';
        let queryParams = [];
        let queryParams2 = [];

        // เพิ่ม WHERE clause ถ้ามี date filter
        if (startDate && endDate) {
            // สำหรับ materials table - ใช้ created_at timestamp field
            materialsQuery += ' WHERE DATE(created_at) BETWEEN ? AND ?';
            queryParams = [startDate, endDate];

            // สำหรับ materialstores table - ใช้ created_at timestamp field  
            materialstoresQuery += ' WHERE DATE(created_at) BETWEEN ? AND ?';
            queryParams2 = [startDate, endDate];

            console.log('🔍 Executing filtered materials query:', materialsQuery);
            console.log('📊 Materials filter params:', queryParams);
            
            console.log('🔍 Executing filtered materialstores query:', materialstoresQuery);
            console.log('📊 Materialstores filter params:', queryParams2);
        } else {
            console.log('📋 No date filters applied - fetching all records');
        }

        // ดึงข้อมูลจากตาราง materials (นำเข้า)
        const [materialsRows] = queryParams.length > 0 
            ? await pool.execute(materialsQuery, queryParams)
            : await pool.execute(materialsQuery);

        // ดึงข้อมูลจากตาราง materialstores (นำออก)
        const [materialstoresRows] = queryParams2.length > 0
            ? await pool.execute(materialstoresQuery, queryParams2)
            : await pool.execute(materialstoresQuery);

        console.log('✅ Query results:', {
            materialsCount: materialsRows.length,
            materialstoresCount: materialstoresRows.length,
            dateFiltered: !!(startDate && endDate)
        });

        res.json({
            success: true,
            message: startDate && endDate 
                ? `ดึงข้อมูลวัสดุในสต็อกสำเร็จ (${startDate} ถึง ${endDate})`
                : 'ดึงข้อมูลวัสดุในสต็อกสำเร็จ',
            data: {
                materials: materialsRows,
                materialstores: materialstoresRows
            },
            count: {
                materials: materialsRows.length,
                materialstores: materialstoresRows.length,
                total: materialsRows.length + materialstoresRows.length
            },
            filter: {
                startDate: startDate || null,
                endDate: endDate || null,
                applied: !!(startDate && endDate)
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