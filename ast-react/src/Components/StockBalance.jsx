// src/Components/StockBalance.jsx
import { API_BASE_URL } from '@/config/apiBase';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const StockBalance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [filters, setFilters] = useState({
    customer: '',
    fabricStruct: '',
    search: '',
    page: 1,
    limit: 50,
  });

  const API_URL = `${API_BASE_URL}/api/stock-balance`;

  const fetchData = useCallback(async (currentFilters) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (currentFilters.customer) params.append('customer', currentFilters.customer);
      if (currentFilters.fabricStruct) params.append('fabricStruct', currentFilters.fabricStruct);
      if (currentFilters.search) params.append('search', currentFilters.search);
      params.append('page', currentFilters.page);
      params.append('limit', currentFilters.limit);

      console.log('🔍 Fetching stock balance:', params.toString());
      const response = await axios.get(`${API_URL}?${params.toString()}`);
      setData(response.data.data || []);
      setPagination(response.data.pagination || null);
    } catch (err) {
      console.error('❌ Error fetching stock balance:', err);
      setError('ไม่สามารถโหลดข้อมูล Stock Balance ได้');
      setData([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchData(filters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    const updated = { ...filters, page: 1 };
    setFilters(updated);
    fetchData(updated);
  };

  const handleClearFilters = () => {
    const cleared = { customer: '', fabricStruct: '', search: '', page: 1, limit: 50 };
    setFilters(cleared);
    fetchData(cleared);
  };

  const handlePageChange = (newPage) => {
    const updated = { ...filters, page: newPage };
    setFilters(updated);
    fetchData(updated);
  };

  const handleLimitChange = (newLimit) => {
    const updated = { ...filters, limit: parseInt(newLimit), page: 1 };
    setFilters(updated);
    fetchData(updated);
  };

  // ===============================
  // Badge
  // ===============================
  const getBalanceStatus = (balance) => {
    const val = parseFloat(balance) || 0;
    if (val <= 0) return { cls: 'bg-danger', text: 'หมด', icon: 'exclamation-triangle-fill' };
    if (val <= 100) return { cls: 'bg-warning', text: 'ใกล้หมด', icon: 'exclamation-circle-fill' };
    return { cls: 'bg-success', text: 'มี', icon: 'check-circle-fill' };
  };

  const formatNumber = (num) => {
    const n = parseFloat(num) || 0;
    return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // ===============================
  // Summary stats (current page)
  // ===============================
  const totalItems = pagination?.total ?? data.length;
  const outOfStock = data.filter((d) => (parseFloat(d.balance) || 0) <= 0).length;
  const lowStock = data.filter((d) => {
    const v = parseFloat(d.balance) || 0;
    return v > 0 && v <= 100;
  }).length;
  const totalBalance = data.reduce((sum, d) => sum + (parseFloat(d.balance) || 0), 0);

  // ===============================
  // Export Excel
  // ===============================
  const exportToExcel = async () => {
    try {
      setExporting(true);

      // Fetch all rows matching current filters
      const params = new URLSearchParams({ page: 1, limit: 99999 });
      if (filters.customer) params.append('customer', filters.customer);
      if (filters.fabricStruct) params.append('fabricStruct', filters.fabricStruct);
      if (filters.search) params.append('search', filters.search);

      console.log('📥 Fetching all data for export...');
      const response = await axios.get(`${API_URL}?${params.toString()}`);
      const exportData = response.data.data || [];

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('ยอดคงเหลือผ้า');

      worksheet.pageSetup = {
        paperSize: 9,
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
      };

      // Title row
      worksheet.mergeCells('A1:H1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'รายงานยอดคงเหลือผ้า (Stock Balance)';
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      worksheet.getRow(1).height = 28;

      // Date row
      worksheet.mergeCells('A2:H2');
      const dateCell = worksheet.getCell('A2');
      dateCell.value = `วันที่พิมพ์: ${new Date().toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric',
      })}`;
      dateCell.alignment = { horizontal: 'right' };

      worksheet.addRow([]);

      // Header row
      const headerRow = worksheet.addRow([
        '#', 'ลูกค้า', 'โครงสร้างผ้า', 'ลาย', 'หน้ากว้าง',
        'เข้า (หลา)', 'ออก (หลา)', 'คงเหลือ (หลา)',
      ]);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E1E8B' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' },
        };
      });
      headerRow.height = 22;

      worksheet.columns = [
        { width: 6 }, { width: 28 }, { width: 22 }, { width: 22 },
        { width: 14 }, { width: 16 }, { width: 16 }, { width: 18 },
      ];

      // Data rows
      exportData.forEach((item, idx) => {
        const balanceVal = parseFloat(item.balance) || 0;
        const bgColor = balanceVal <= 0 ? 'FFFCE4EC' : balanceVal <= 100 ? 'FFFFF9C4' : 'FFFFFFFF';

        const row = worksheet.addRow([
          idx + 1,
          item.customer || 'AST',
          item.fabricStruct || '',
          item.fabricPattern || '',
          item.fabricW || '',
          parseFloat(item.totalIn) || 0,
          parseFloat(item.totalOut) || 0,
          balanceVal,
        ]);

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' },
          };
          if (colNumber >= 6) {
            cell.numFmt = '#,##0.00';
            cell.alignment = { horizontal: 'right' };
          }
          if (colNumber === 8) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
            cell.font = { bold: true };
          }
        });
      });

      // Total row
      const sumIn = exportData.reduce((s, d) => s + (parseFloat(d.totalIn) || 0), 0);
      const sumOut = exportData.reduce((s, d) => s + (parseFloat(d.totalOut) || 0), 0);
      const sumBal = exportData.reduce((s, d) => s + (parseFloat(d.balance) || 0), 0);

      const totalRow = worksheet.addRow(['รวม', '', '', '', '', sumIn, sumOut, sumBal]);
      totalRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
        cell.border = {
          top: { style: 'medium' }, left: { style: 'thin' },
          bottom: { style: 'medium' }, right: { style: 'thin' },
        };
        if (colNumber >= 6) {
          cell.numFmt = '#,##0.00';
          cell.alignment = { horizontal: 'right' };
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        `stock_balance_${new Date().toISOString().split('T')[0]}.xlsx`
      );
      console.log('✅ Export complete');
    } catch (err) {
      console.error('❌ Export error:', err);
      alert('ไม่สามารถ Export ได้');
    } finally {
      setExporting(false);
    }
  };

  // ===============================
  // Skeleton loader
  // ===============================
  const SkeletonRows = () => (
    <>
      {[...Array(10)].map((_, i) => (
        <tr key={i}>
          {[...Array(9)].map((_, j) => (
            <td key={j}>
              <div className="placeholder-glow">
                <span className="placeholder col-10 rounded"></span>
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  // ===============================
  // Pagination
  // ===============================
  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;
    const { page, totalPages } = pagination;

    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);
    const pages = [];
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return (
      <nav aria-label="pagination">
        <ul className="pagination pagination-sm justify-content-end mb-0">
          <li className={`page-item ${!pagination.hasPrev ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(page - 1)}>
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>

          {startPage > 1 && (
            <>
              <li className="page-item">
                <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
              </li>
              {startPage > 2 && (
                <li className="page-item disabled"><span className="page-link">…</span></li>
              )}
            </>
          )}

          {pages.map((p) => (
            <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(p)}>{p}</button>
            </li>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <li className="page-item disabled"><span className="page-link">…</span></li>
              )}
              <li className="page-item">
                <button className="page-link" onClick={() => handlePageChange(totalPages)}>
                  {totalPages}
                </button>
              </li>
            </>
          )}

          <li className={`page-item ${!pagination.hasNext ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => handlePageChange(page + 1)}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  // ===============================
  // Render
  // ===============================
  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h2 mb-0">ยอดคงเหลือผ้า (Stock Balance)</h1>
        <button
          className="btn btn-success"
          onClick={exportToExcel}
          disabled={exporting || loading}
        >
          {exporting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              กำลัง Export...
            </>
          ) : (
            <>
              <i className="bi bi-file-earmark-excel me-2"></i>Export Excel
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-primary shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-primary text-uppercase mb-1">รายการทั้งหมด</div>
                  <div className="h5 mb-0 fw-bold text-gray-800">{totalItems.toLocaleString('th-TH')}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-box fs-2 text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-danger shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-danger text-uppercase mb-1">สต็อกหมด</div>
                  <div className="h5 mb-0 fw-bold text-gray-800">{outOfStock}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-exclamation-triangle fs-2 text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-warning shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-warning text-uppercase mb-1">ใกล้หมด (≤ 100 หลา)</div>
                  <div className="h5 mb-0 fw-bold text-gray-800">{lowStock}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-exclamation-circle fs-2 text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card border-left-success shadow h-100 py-2">
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col me-2">
                  <div className="text-xs fw-bold text-success text-uppercase mb-1">ยอดคงเหลือรวม (หลา)</div>
                  <div className="h5 mb-0 fw-bold text-gray-800">
                    {totalBalance.toLocaleString('th-TH', { maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-stack fs-2 text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-md-3">
              <label className="form-label fw-semibold">ค้นหาทั่วไป</label>
              <input
                type="text"
                className="form-control"
                placeholder="ค้นหาลูกค้า / โครงสร้าง / ลาย..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">ลูกค้า</label>
              <input
                type="text"
                className="form-control"
                placeholder="กรอกชื่อลูกค้า"
                value={filters.customer}
                onChange={(e) => handleFilterChange('customer', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label fw-semibold">โครงสร้างผ้า</label>
              <input
                type="text"
                className="form-control"
                placeholder="กรอกโครงสร้างผ้า"
                value={filters.fabricStruct}
                onChange={(e) => handleFilterChange('fabricStruct', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="col-md-3">
              <div className="d-flex gap-2">
                <button className="btn btn-primary flex-fill" onClick={handleSearch}>
                  <i className="bi bi-search me-2"></i>ค้นหา
                </button>
                <button className="btn btn-outline-secondary flex-fill" onClick={handleClearFilters}>
                  <i className="bi bi-x-circle me-2"></i>ล้าง
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6 className="m-0 fw-bold text-primary">รายการยอดคงเหลือผ้า</h6>
          {pagination && (
            <small className="text-muted">
              แสดง{' '}
              {((pagination.page - 1) * pagination.limit) + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
              จาก {pagination.total.toLocaleString('th-TH')} รายการ
            </small>
          )}
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>ลูกค้า</th>
                  <th>โครงสร้างผ้า</th>
                  <th>ลาย</th>
                  <th>หน้ากว้าง</th>
                  <th className="text-end">เข้า (หลา)</th>
                  <th className="text-end">ออก (หลา)</th>
                  <th className="text-end">คงเหลือ (หลา)</th>
                  <th className="text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-5 text-muted">
                      <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                ) : (
                  data.map((item, idx) => {
                    const status = getBalanceStatus(item.balance);
                    const rowNum = ((filters.page - 1) * filters.limit) + idx + 1;
                    return (
                      <tr key={idx}>
                        <td className="text-muted text-center">{rowNum}</td>
                        <td><strong>{item.customer || 'AST'}</strong></td>
                        <td>{item.fabricStruct || '-'}</td>
                        <td>{item.fabricPattern || '-'}</td>
                        <td>{item.fabricW || '-'}</td>
                        <td className="text-end text-success">{formatNumber(item.totalIn)}</td>
                        <td className="text-end text-danger">{formatNumber(item.totalOut)}</td>
                        <td className="text-end fw-bold">{formatNumber(item.balance)}</td>
                        <td className="text-center">
                          <span className={`badge ${status.cls}`}>
                            <i className={`bi bi-${status.icon} me-1`}></i>
                            {status.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom controls */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              <select
                className="form-select form-select-sm"
                style={{ width: 'auto' }}
                value={filters.limit}
                onChange={(e) => handleLimitChange(e.target.value)}
              >
                <option value={25}>25 รายการ</option>
                <option value={50}>50 รายการ</option>
                <option value={100}>100 รายการ</option>
              </select>
            </div>
            {renderPagination()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockBalance;
