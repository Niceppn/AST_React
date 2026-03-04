// server/controller/stockBalanceController.js
const { pool } = require('../config/database');

const getStockBalance = async (req, res) => {
  console.log('📊 Stock Balance API called, query:', req.query);

  try {
    if (!pool) throw new Error('Database pool not available');

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { customer, fabricStruct, search } = req.query;

    const isEmpty = (v) => v === undefined || v === null || v === '';

    const where = [];
    const params = [];

    if (!isEmpty(customer)) {
      where.push('sf.customer LIKE ?');
      params.push(`%${customer}%`);
    }

    if (!isEmpty(fabricStruct)) {
      where.push('sf.fabricStruct LIKE ?');
      params.push(`%${fabricStruct}%`);
    }

    if (!isEmpty(search)) {
      where.push('(sf.customer LIKE ? OR sf.fabricStruct LIKE ? OR sf.fabricPattern LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const dataSQL = `
      SELECT
        sf.customer,
        sf.fabricStruct,
        sf.fabricPattern,
        sf.fabricW,
        COALESCE(SUM(sf.sumYard), 0) AS totalIn,
        COALESCE(SUM(fo.sumYard), 0) AS totalOut,
        (COALESCE(SUM(sf.sumYard), 0) - COALESCE(SUM(fo.sumYard), 0)) AS balance
      FROM stockfabrics sf
      LEFT JOIN fabricouts fo
        ON fo.fabricStruct = sf.fabricStruct
      ${whereSQL}
      GROUP BY sf.customer, sf.fabricStruct, sf.fabricPattern, sf.fabricW
      ORDER BY sf.customer, sf.fabricStruct
      LIMIT ? OFFSET ?
    `;

    const countSQL = `
      SELECT COUNT(*) AS total FROM (
        SELECT sf.customer
        FROM stockfabrics sf
        LEFT JOIN fabricouts fo
          ON fo.fabricStruct = sf.fabricStruct
        ${whereSQL}
        GROUP BY sf.customer, sf.fabricStruct, sf.fabricPattern, sf.fabricW
      ) AS sub
    `;

    console.log('🔍 Stock Balance SQL (data):', dataSQL.trim());
    console.log('🔍 Params:', [...params, limit, offset]);

    const [rows] = await pool.execute(dataSQL, [...params, limit, offset]);
    const [countResult] = await pool.execute(countSQL, params);
    const total = countResult[0].total;

    console.log(`✅ Stock Balance OK: ${rows.length} rows, total: ${total}`);

    res.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('❌ Error stock balance:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล stock balance',
      error: error.message,
    });
  }
};

module.exports = { getStockBalance };
