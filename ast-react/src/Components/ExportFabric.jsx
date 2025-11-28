// File: ExportFabric.jsx
import { API_BASE_URL } from "@/config/apiBase";

import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Badge, Modal } from 'react-bootstrap';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const ExportFabric = () => {
  const [fabricouts, setFabricouts] = useState([]);
  const [stockfabrics, setStockfabrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    vatType: ''
  });

  // Export Modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    fabricCode: '',
    fromMonth: '',
    fromYear: '',
    toMonth: '',
    toYear: '',
    vatType: '',
    companyLocation: ''
  });
  const [availableFabricCodes, setAvailableFabricCodes] = useState([]);

  useEffect(() => {
    // fetchFabricouts();
    setLoading(false);
    fetchStockfabrics();
  }, []);

  // ===============================
  // Fetch stockfabrics (รับข้อมูลจ่ายออก)
  // ===============================
  const fetchStockfabrics = async () => {
    try {
      console.log('🔍 Fetching stockfabrics data...');

      const url = `${API_BASE_URL}/api/stockfabrics?limit=50000&year=2025`;
      console.log('🌐 Stockfabrics URL:', url);

      const response = await axios.get(url);
      console.log('📊 Stockfabrics API Response:', response.data);
      
      let stockData = [];
      if (response.data?.data && response.data?.pagination) {
        stockData = response.data.data;
      } else if (Array.isArray(response.data)) {
        stockData = response.data;
      } else {
        stockData = [];
      }

      setStockfabrics(stockData);
    } catch (error) {
      console.error('❌ Error fetching stockfabrics:', error);
      setStockfabrics([]);
    }
  };

  // ===============================
  // คำนวณยอดจ่าย (stockout) จาก stockfabrics
  // ===============================
  const getStockoutQuantity = (fabricStruct, createDate) => {
    if (!stockfabrics.length) return { total: 0, details: [] };
    
    console.log('🔍 DEBUG - Looking for fabric:', { fabricStruct });
    
    const matchingStocks = stockfabrics.filter(stock => {
      const fabricMatch =
        stock.fabricStruct === fabricStruct ||
        stock.fabricId === fabricStruct ||
        stock.refId === fabricStruct;
      
      console.log('🧩 DEBUG - Checking stock:', {
        stockFabricStruct: stock.fabricStruct,
        stockFabricId: stock.fabricId,
        stockRefId: stock.refId,
        stockCreateDate: stock.createDate,
        targetFabricStruct: fabricStruct,
        fabricMatch: fabricMatch
      });
      
      return fabricMatch;
    });
    
    console.log('🧾 DEBUG - All matching stocks found:', matchingStocks);
    console.log('📊 DEBUG - Stock count:', matchingStocks.length);
    
    const dateGroups = {};
    let totalStockout = 0;
    
    matchingStocks.forEach(stock => {
      const yardValue = parseInt(stock.sumYard) || 0;
      const stockDate = stock.createDate;
      
      if (stockDate) {
        const dateKey = new Date(stockDate).toISOString().split('T')[0];
        
        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = {
            date: stockDate,
            quantity: 0,
            count: 0
          };
        }
        
        dateGroups[dateKey].quantity += yardValue;
        dateGroups[dateKey].count += 1;
        totalStockout += yardValue;
        
        console.log('💰 DEBUG - Adding sumYard:', yardValue, 'for date:', stockDate);
      }
    });
    
    const details = Object.values(dateGroups).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    console.log('💰 DEBUG - Total stockout for fabric', fabricStruct, ':', totalStockout);
    console.log('📅 DEBUG - Details by date:', details);
    console.log('======================================');
    
    return { total: totalStockout, details: details };
  };

  // ===============================
  // Fetch fabricouts (ใช้ข้อมูลที่ backend group แล้ว)
  // ===============================
  const fetchFabricouts = async (searchFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching fabricouts data...');
      
      const params = new URLSearchParams({ limit: '15000' });

      if (searchFilters.month) params.append('month', searchFilters.month);
      if (searchFilters.year) params.append('year', searchFilters.year);
      if (searchFilters.vatType) params.append('vatType', searchFilters.vatType);

      const url = `${API_BASE_URL}/api/fabricouts?${params.toString()}`;
      console.log('🌐 Request URL:', url);

      const response = await axios.get(url);
      
      console.log('📊 API Response:', response.data);
      console.log('🔍 Applied filters:', searchFilters);

      let rows = [];
      if (Array.isArray(response.data?.data)) {
        rows = response.data.data;
      } else if (Array.isArray(response.data)) {
        rows = response.data;
      } else {
        rows = [];
      }

      // ❌ ไม่ group ซ้ำ – แค่ sort ตามวันที่
      const sortedData = rows.sort((a, b) => {
        const dateA = new Date(a.createDate);
        const dateB = new Date(b.createDate);
        return dateA - dateB;
      });

      setFabricouts(sortedData);
      setPagination(null);
    } catch (error) {
      console.error('❌ Error fetching fabricouts:', error);
      setError('ไม่สามารถโหลดข้อมูลได้');

      setFabricouts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // Filter handlers
  // ===============================
  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = () => {
    console.log('🔍 Searching with filters:', filters);
    fetchFabricouts(filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      month: '',
      year: '',
      vatType: ''
    };
    setFilters(clearedFilters);
    fetchFabricouts(clearedFilters);
  };

  // ===============================
  // Export Modal Functions
  // ===============================
  const handleShowExportModal = () => {
    const fabricCodes = [
      ...new Set(
        fabricouts
          .map(item => item.fabricStruct || item.vatType)
          .filter(Boolean)
      )
    ];
    setAvailableFabricCodes(fabricCodes);
    setShowExportModal(true);
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
    setExportFilters({
      fabricCode: '',
      fromMonth: '',
      fromYear: '',
      toMonth: '',
      toYear: '',
      vatType: '',
      companyLocation: ''
    });
  };

  const handleExportFilterChange = (name, value) => {
    setExportFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ===============================
  // Helpers
  // ===============================
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${date.getFullYear()}`;
  };

  const getStatusBadge = (receiveType) => {
    switch (receiveType) {
      case 'receiver':
        return <Badge bg="success" style={{ borderRadius: '20px' }}>รับแล้ว</Badge>;
      case 'sender':
        return <Badge bg="warning" style={{ borderRadius: '20px' }}>ส่งแล้ว</Badge>;
      case 'pending':
        return <Badge bg="info" style={{ borderRadius: '20px' }}>รอดำเนินการ</Badge>;
      default:
        return <Badge bg="secondary" style={{ borderRadius: '20px' }}>{receiveType || 'ไม่ทราบสถานะ'}</Badge>;
    }
  };

  const getMonthName = (month) => {
    const months = {
      '1': 'มกราคม',
      '2': 'กุมภาพันธ์',
      '3': 'มีนาคม',
      '4': 'เมษายน',
      '5': 'พฤษภาคม',
      '6': 'มิถุนายน',
      '7': 'กรกฎาคม',
      '8': 'สิงหาคม',
      '9': 'กันยายน',
      '10': 'ตุลาคม',
      '11': 'พฤศจิกายน',
      '12': 'ธันวาคม'
    };
    return months[month] || month;
  };

  // ===============================
  // Excel Export (แบบละเอียดรายเดือน + รับ/จ่าย/คงเหลือ)
  // ===============================
  const exportToExcel = async () => {
    try {
      let filteredData = [...fabricouts];
      
      if (exportFilters.fabricCode) {
        filteredData = filteredData.filter(item => 
          (item.fabricStruct || item.vatType) === exportFilters.fabricCode
        );
      }
      
      if (exportFilters.vatType) {
        filteredData = filteredData.filter(item => item.vatType === exportFilters.vatType);
      }
      
      if (exportFilters.fromMonth && exportFilters.fromYear) {
        filteredData = filteredData.filter(item => {
          const itemDate = new Date(item.createDate);
          const fromDate = new Date(
            exportFilters.fromYear,
            exportFilters.fromMonth - 1,
            1
          );
          
          let toDate;
          if (exportFilters.toMonth && exportFilters.toYear) {
            toDate = new Date(exportFilters.toYear, exportFilters.toMonth, 0);
          } else {
            toDate = new Date(exportFilters.fromYear, exportFilters.fromMonth, 0);
          }
          
          return itemDate >= fromDate && itemDate <= toDate;
        });
      }

      filteredData.sort((a, b) => {
        const dateA = new Date(a.createDate);
        const dateB = new Date(b.createDate);
        return dateA - dateB;
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('รายงานสินค้าและสำเร็จรูป');

      worksheet.pageSetup = {
        paperSize: 9,
        orientation: 'portrait',
        margins: {
          left: 0.5,
          right: 0.5,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3
        },
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        scale: 100,
        horizontalCentered: true,
        verticalCentered: false
      };

      const titleRow = worksheet.addRow(['รายงานสินค้าและสำเร็จรูป']);
      worksheet.mergeCells('A1:F1');
      titleRow.getCell(1).font = { bold: true, size: 16 };
      titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.addRow(['']);
      const companyRow = worksheet.addRow(['ชื่อผู้ประกอบการ', 'บริษัท เอเชียเท็กซ์ไทล์ จำกัด']);
      worksheet.mergeCells('B3:F3');

      const locationRow = worksheet.addRow(['ชื่อสถานประกอบการ', exportFilters.companyLocation || '']);
      worksheet.mergeCells('B5:F5');
      
      const numberRow = worksheet.addRow([
        'ชื่อสินค้า/จำนวนขาย',
        exportFilters.fabricCode ||
          (filteredData.length > 0 ? filteredData[0].fabricStruct : 'ผ้า') ||
          'ผ้า',
        '#10062 64'
      ]);
      worksheet.mergeCells('B6:E6');
      
      const categoryRow = worksheet.addRow(['รายการ/ชนิด', 'บริษัทมีใบกำกับเต็ม', 'ลาย']);
      worksheet.mergeCells('B7:E7');

      worksheet.addRow(['']);
      worksheet.addRow(['']);

      const headerRow1 = worksheet.addRow([
        'เลขที่ใบสำคัญ',
        'วัน เดือน ปี',
        'ปริมาณ',
        '',
        '',
        'หมายเหตุ'
      ]);

      const headerRow2 = worksheet.addRow([
        '',
        '',
        'จำนวนรับ',
        'จำนวนจ่าย',
        'จำนวนเหลือ',
        ''
      ]);

      worksheet.mergeCells('A10:A11');
      worksheet.mergeCells('B10:B11');
      worksheet.mergeCells('C10:E10');
      worksheet.mergeCells('F10:F11');

      [headerRow1, headerRow2].forEach(headerRow => {
        headerRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' }
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.font = {
            bold: true,
            size: 11
          };
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
          };
        });
        headerRow.height = 20;
      });

      let runningBalance = 0;
      let totalStockout = 0;
      let monthlyData = {};
      let allStockoutData = {};
      
      if (exportFilters.fabricCode) {
        const allStockouts = stockfabrics.filter(stock => {
          const fabricMatch =
            stock.fabricStruct === exportFilters.fabricCode ||
            stock.fabricId === exportFilters.fabricCode ||
            stock.refId === exportFilters.fabricCode;
          return fabricMatch;
        });
        
        allStockouts.forEach(stock => {
          if (stock.createDate) {
            const stockDate = new Date(stock.createDate);
            const monthKey = `${stockDate.getFullYear()}-${(stockDate.getMonth() + 1)
              .toString()
              .padStart(2, '0')}`;
            
            if (!allStockoutData[monthKey]) {
              allStockoutData[monthKey] = {
                monthName: `${getMonthName(
                  (stockDate.getMonth() + 1).toString()
                )} ${stockDate.getFullYear()}`,
                stockouts: [],
                totalStockout: 0
              };
            }
            
            const yardValue = parseInt(stock.sumYard) || 0;
            allStockoutData[monthKey].stockouts.push({
              date: stock.createDate,
              quantity: yardValue
            });
            allStockoutData[monthKey].totalStockout += yardValue;
          }
        });
      }
      
      filteredData.forEach((item) => {
        const itemDate = new Date(item.createDate);
        const monthKey = `${itemDate.getFullYear()}-${(itemDate.getMonth() + 1)
          .toString()
          .padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            monthName: `${getMonthName((itemDate.getMonth() + 1).toString())} ${
              itemDate.getFullYear()
            }`,
            items: [],
            totalReceived: 0,
            totalStockout: 0
          };
        }
        
        monthlyData[monthKey].items.push(item);
        monthlyData[monthKey].totalReceived += parseInt(item.sumYard) || 0;
      });
      
      const allMonths = new Set([
        ...Object.keys(monthlyData),
        ...Object.keys(allStockoutData)
      ]);
      
      Array.from(allMonths).sort().forEach((monthKey) => {
        const monthReceiveData = monthlyData[monthKey] || { 
          monthName: allStockoutData[monthKey]?.monthName || monthKey,
          items: [], 
          totalReceived: 0, 
          totalStockout: 0 
        };
        const monthStockoutData = allStockoutData[monthKey] || { 
          stockouts: [], 
          totalStockout: 0 
        };
        
        let monthlyStockoutTotal = 0;
        
        monthReceiveData.items.forEach((item) => {
          const quantity = parseInt(item.sumYard) || 0;
          const stockoutResult = getStockoutQuantity(item.fabricStruct, item.createDate);
          const stockoutQty = stockoutResult.total;
          
          const balance = quantity - stockoutQty;
          runningBalance = Math.max(0, runningBalance + balance);
          
          totalStockout += stockoutQty;
          
          const receiveRow = worksheet.addRow([
            ``,
            formatDate(item.createDate),
            quantity,
            '',
            runningBalance,
            'รับ'
          ]);

          receiveRow.eachCell((cell, colNumber) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            if ([1, 2, 3, 4, 5, 6].includes(colNumber)) {
              cell.alignment = {
                horizontal: 'center',
                vertical: 'middle'
              };
            }
            if ([3, 4, 5].includes(colNumber)) {
              cell.numFmt = '#,##0';
            }
          });
        });
        
        monthStockoutData.stockouts.forEach(stockout => {
          monthlyStockoutTotal += stockout.quantity;
          
          const stockoutRow = worksheet.addRow([
            ``,
            formatDate(stockout.date),
            '',
            stockout.quantity,
            '',
            'จ่าย'
          ]);

          stockoutRow.eachCell((cell, colNumber) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            if ([1, 2, 3, 4, 5, 6].includes(colNumber)) {
              cell.alignment = {
                horizontal: 'center',
                vertical: 'middle'
              };
            }
            if ([3, 4, 5].includes(colNumber)) {
              cell.numFmt = '#,##0';
            }
          });
        });
        
        const monthlyBalance = monthReceiveData.totalReceived - monthlyStockoutTotal;
        const monthlySummaryRow = worksheet.addRow([
          `รวม ${monthReceiveData.monthName}`,
          '',
          monthReceiveData.totalReceived,
          monthlyStockoutTotal,
          Math.max(0, monthlyBalance),
          ''
        ]);

        monthlySummaryRow.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'medium' },
            left: { style: 'thin' },
            bottom: { style: 'medium' },
            right: { style: 'thin' }
          };
          cell.font = { bold: true, size: 11 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6F3FF' }
          };
          if ([1, 2, 3, 4, 5].includes(colNumber)) {
            cell.alignment = {
              horizontal: 'center',
              vertical: 'middle'
            };
          }
          if ([3, 4, 5].includes(colNumber)) {
            cell.numFmt = '#,##0';
          }
        });
        
        worksheet.addRow(['']);
      });

      const totalQuantity = filteredData.reduce(
        (sum, item) => sum + (parseInt(item.sumYard) || 0),
        0
      );
      const totalStockoutFromAllMonths = Object.values(allStockoutData).reduce(
        (sum, monthData) => sum + monthData.totalStockout,
        0
      );
      const finalBalance = totalQuantity - totalStockoutFromAllMonths;
      const totalRow = worksheet.addRow([
        'รวมทั้งหมดทุกเดือน',
        '',
        totalQuantity,
        totalStockoutFromAllMonths,
        Math.max(0, finalBalance),
        ''
      ]);

      totalRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'double' },
          left: { style: 'thick' },
          bottom: { style: 'double' },
          right: { style: 'thick' }
        };
        cell.font = { bold: true, size: 12 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFCC00' }
        };
        if ([1, 2, 3, 4, 5].includes(colNumber)) {
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle'
          };
        }
        if ([3, 4, 5].includes(colNumber)) {
          cell.numFmt = '#,##0';
        }
      });

      worksheet.columns = [
        { width: 20 },
        { width: 15 },
        { width: 12 },
        { width: 12 },
        { width: 12 },
        { width: 15 }
      ];

      worksheet.getCell('A3').font = { bold: true };
      worksheet.getCell('A4').font = { bold: true };
      worksheet.getCell('A5').font = { bold: true };
      worksheet.getCell('A6').font = { bold: true };
      worksheet.getCell('A7').font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const filename = `รายงานสินค้าและจำนวนขาย_${exportFilters.fabricCode || 'ทั้งหมด'}_${exportFilters.fromMonth ? getMonthName(exportFilters.fromMonth) : 'ทั้งหมด'}_${exportFilters.fromYear || new Date().getFullYear()}_${formatDate(new Date().toISOString()).replace(/\//g, '-')}.xlsx`;
      
      saveAs(blob, filename);
      
      console.log('✅ Excel file exported successfully');
      handleCloseExportModal();
    } catch (error) {
      console.error('❌ Error exporting to Excel:', error);
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel');
    }
  };

  // ===============================
  // Excel Export V2 (สรุป A4 3 คอลัมน์)
  // ===============================
  const exportToExcelV2 = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('สรุปรายงานสินค้า V2');

      worksheet.properties.defaultRowHeight = 18;
      
      worksheet.pageSetup = {
        paperSize: 9,
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.5,
          right: 0.5,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3
        },
        scale: 100,
        horizontalCentered: true,
        verticalCentered: false
      };

      worksheet.views = [{
        showGridLines: true,
        showRowColHeaders: false,
        zoomScale: 100
      }];
      
      worksheet.mergeCells('A1:C1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'บริษัท เอเซียเท็กซ์ไทล์ จำกัด';
      titleCell.font = { size: 14, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.mergeCells('A2:C2');
      const titleCell2 = worksheet.getCell('A2');
      titleCell2.value = 'สรุปรายงานสินค้าและสำเร็จรูป';
      titleCell2.font = { size: 14, bold: true };
      titleCell2.alignment = { horizontal: 'center', vertical: 'middle' };
      
      worksheet.mergeCells('A3:C3');
      const dateCell = worksheet.getCell('A3');
      dateCell.value = `ณ วันที่: ${formatDate(new Date().toISOString())}`;
      dateCell.font = { size: 12, bold: true };
      dateCell.alignment = { horizontal: 'center' };

      const headerRowStart = 5;
      const headerRow1 = worksheet.getRow(headerRowStart);
      headerRow1.values = [
        'ลำดับที่',
        'รายการ',
        'จำนวน (หลา)'
      ];

      const headerCells = [`A${headerRowStart}`, `B${headerRowStart}`, `C${headerRowStart}`];
      headerCells.forEach(cellAddr => {
        const cell = worksheet.getCell(cellAddr);
        cell.font = { bold: true, color: { argb: 'FFFFFF' }, size: 10 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1F4E79' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'medium' },
          left: { style: 'medium' },
          bottom: { style: 'medium' },
          right: { style: 'medium' }
        };
      });

      const groupedData = {};
      fabricouts.forEach(item => {
        const fabricCode = item.fabricStruct || 'ไม่ระบุ';
        if (!groupedData[fabricCode]) {
          groupedData[fabricCode] = {
            fabricCode: fabricCode,
            totalYards: 0
          };
        }
        groupedData[fabricCode].totalYards += parseInt(item.sumYard) || 0;
      });

      const sortedData = Object.values(groupedData).sort((a, b) => 
        a.fabricCode.localeCompare(b.fabricCode)
      );

      sortedData.forEach((item, index) => {
        const rowNum = headerRowStart + 1 + index;
        const row = worksheet.getRow(rowNum);
        
        row.values = [
          index + 1,
          item.fabricCode,
          item.totalYards
        ];

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'B7B7B7' } },
            left: { style: 'thin', color: { argb: 'B7B7B7' } },
            bottom: { style: 'thin', color: { argb: 'B7B7B7' } },
            right: { style: 'thin', color: { argb: 'B7B7B7' } }
          };
          
          if (colNumber === 1) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { bold: true, size: 9 };
          } else if (colNumber === 2) {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
            cell.font = { bold: true, size: 9 };
          } else {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { size: 9 };
            cell.numFmt = '#,##0';
          }

          if (index % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFF' }
            };
          } else {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F8F9FA' }
            };
          }
        });
      });

      worksheet.columns = [
        { width: 10 },
        { width: 35 },
        { width: 30 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const fileName = `สรุปรายงานสินค้า_A4_${formatDate(new Date().toISOString()).replace(/\//g, '-')}.xlsx`;
      saveAs(blob, fileName);
      
      console.log('✅ Excel V2 file exported successfully');
    } catch (error) {
      console.error('❌ Error exporting to Excel V2:', error);
      alert('เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel V2');
    }
  };

  // ===============================
  // Export ตามหน้าจอ (Current View)
  // ===============================
  const exportCurrentViewToExcel = async () => {
    try {
      if (!fabricouts || fabricouts.length === 0) {
        alert('ไม่มีข้อมูลให้ส่งออก');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Export Fabric (Current View)');

      worksheet.pageSetup = {
        paperSize: 9,
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.5,
          right: 0.5,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3
        }
      };

      worksheet.mergeCells('A1:G1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'รายงานรายการสินค้าส่งออกจากคลัง ';
      titleCell.font = { bold: true, size: 14 };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      const filterText = [
        `ประเภทบิล: ${filters.vatType || 'ทั้งหมด'}`,
        `เดือน: ${filters.month ? getMonthName(String(filters.month)) : 'ทั้งหมด'}`,
        `ปี: ${filters.year || 'ทั้งหมด'}`
      ].join(' | ');

      worksheet.mergeCells('A2:G2');
      const filterCell = worksheet.getCell('A2');
      filterCell.value = filterText;
      filterCell.font = { size: 11, italic: true, color: { argb: 'FF555555' } };
      filterCell.alignment = { horizontal: 'center', vertical: 'middle' };

      worksheet.addRow([]);

      const headerRow = worksheet.addRow([
        'เลขที่บิล',
        'วัน/เดือน/ปี',
        'รหัสผ้า',
        'ชื่อผู้สั่ง',
        'ชื่อผู้รับ',
        'พับ',
        'หลา'
      ]);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 11 };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC000' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      fabricouts.forEach((item) => {
        // ✅ บังคับใช้เลขที่บิลแบบ A 4804 (vatType + vatNo) เป็นหลัก
        const invoiceNumber =
          `${item.vatType || ''} ${item.vatNo || ''}`.trim() ||
          item.billNumber ||
          item.refId ||
          '';

        const row = worksheet.addRow([
          invoiceNumber,
          formatDate(item.createDate),
          item.fabricStruct || item.vatType || '-',
          item.customerName || '-',
          item.receiveName || '-',
          item.fold || 0,
          item.sumYard || 0
        ]);

        row.eachCell((cell, col) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };

          if ([6, 7].includes(col)) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
            cell.numFmt = '#,##0';
          } else {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });
      });

      const totalFold = fabricouts.reduce(
        (sum, i) => sum + (Number(i.fold) || 0),
        0
      );
      const totalYard = fabricouts.reduce(
        (sum, i) => sum + (Number(i.sumYard) || 0),
        0
      );

      const totalRow = worksheet.addRow([
        'รวมทั้งหมด',
        '',
        '',
        '',
        '',
        totalFold,
        totalYard
      ]);

      totalRow.eachCell((cell, col) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2EFDA' }
        };
        cell.border = {
          top: { style: 'medium' },
          left: { style: 'thin' },
          bottom: { style: 'medium' },
          right: { style: 'thin' }
        };
        cell.alignment = {
          horizontal: col >= 6 ? 'right' : 'center',
          vertical: 'middle'
        };
        if ([6, 7].includes(col)) {
          cell.numFmt = '#,##0';
        }
      });

      worksheet.columns = [
        { width: 15 },
        { width: 15 },
        { width: 25 },
        { width: 30 },
        { width: 25 },
        { width: 10 },
        { width: 12 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const fileName = `export-fabric-screen_${filters.vatType || 'ALL'}_${filters.year || 'ALL'}_${filters.month || 'ALL'}.xlsx`;
      saveAs(blob, fileName);

      console.log('✅ Export current view excel success');
    } catch (err) {
      console.error('❌ Error exporting current view excel:', err);
      alert('เกิดข้อผิดพลาดในการส่งออก Excel ตามหน้าจอ');
    }
  };

  // ===============================
  // JSX
  // ===============================
  return (
    <div className=''>
      <div className=" text-white p-1 mb-1">
        <div
          className='text-black p-4 bg-white  mb-4'
          style={{ borderRadius: '15px', border: '2px solid #eee' }}
        >
          <h5 className="fw-bold">รายงานส่งผ้าออกจากคลัง</h5>
          <p className="text-muted pt-2">เรียงตามเลขที่บิลที่ส่ง</p>

          <div className='d-flex  align-items-center pb-2'>
            <div className='pt-2'>
              <h6>เลือกประเภทบิล</h6>
              <select
                className='form-select'
                style={{ borderRadius: '8px', border: '2px solid #eee', width: 'auto' }}
                name="typebill"
                value={filters.vatType}
                onChange={(e) => handleFilterChange('vatType', e.target.value)}
              >
                <option value="">เลือกประเภทบิล</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>

            <div className='pt-2 px-3'>
              <h6>เดือน</h6>
              <select
                className='form-select'
                style={{ borderRadius: '8px', border: '2px solid #eee', width: '350px' }}
                name="เดือน"
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
              >
                <option value="">เลือกเดือน</option>
                <option value="1">มกราคม</option>
                <option value="2">กุมภาพันธ์</option>
                <option value="3">มีนาคม</option>
                <option value="4">เมษายน</option>
                <option value="5">พฤษภาคม</option>
                <option value="6">มิถุนายน</option>
                <option value="7">กรกฎาคม</option>
                <option value="8">สิงหาคม</option>
                <option value="9">กันยายน</option>
                <option value="10">ตุลาคม</option>
                <option value="11">พฤศจิกายน</option>
                <option value="12">ธันวาคม</option>
              </select>
            </div>

            <div className='pt-2 px-1'>
              <h6>เลือกปี</h6>
              <select
                className='form-select'
                style={{ borderRadius: '8px', border: '2px solid #eee', width: 'auto' }}
                name="ปี"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
              >
                <option value="">เลือกปี</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
              </select>
            </div>
          </div>

          <div className='pt1 px-1'>
            <br />
            <div className="d-flex gap-2">
              <button
                className='btn'
                style={{
                  backgroundColor: 'rgb(14,30,139)',
                  color: '#fff',
                  width: '120px',
                  height: '40px',
                  borderRadius: '20px'
                }}
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? 'กำลังค้นหา...' : '🔍 ค้นหา'}
              </button>

              <button
                className='btn  btn-danger'
                style={{ width: '120px', height: '40px', borderRadius: '20px' }}
                onClick={handleClearFilters}
                disabled={loading}
              >
                ล้างตัวกรอง
              </button>

              {/* <button
                className='btn btn-success'
                style={{ width: '150px', height: '40px', borderRadius: '20px' }}
                onClick={handleShowExportModal}
                disabled={loading || fabricouts.length === 0}
              >
                📊 ส่งออก Excel
              </button>

              <button
                className='btn btn-info ms-2'
                style={{ width: '180px', height: '40px', borderRadius: '20px' }}
                onClick={exportToExcelV2}
                disabled={loading || fabricouts.length === 0}
              >
                📋 ส่งออก A4 (สรุป)
              </button>
 */}
                              <button
                className='btn btn-success'
                style={{ width: '150px', height: '40px', borderRadius: '20px' }}
                onClick={exportCurrentViewToExcel}
                disabled={loading || fabricouts.length === 0}
              >
                📊 ส่งออก Excel
              </button>
            </div>
          </div>
        </div>

        <div className="table ">
          <table
            className="table table"
            style={{ borderRadius: '15px', overflow: 'hidden', border: 'none' }}
          >
            <thead style={{ backgroundColor: '#ff8c00' }}>
              <tr>
                <th
                  className="text-center"
                  style={{
                    width: '7%',
                    borderTop: 'none',
                    borderBottom: '2px solid #e67e22',
                    padding: '15px 8px',
                    fontWeight: '600',
                    color: 'black'
                  }}
                >
                  เลขที่บิล
                </th>
                <th
                  className="text-center"
                  style={{
                    width: '10%',
                    borderTop: 'none',
                    borderBottom: '2px solid #e67e22',
                    padding: '15px 8px',
                    fontWeight: '600',
                    color: 'black'
                  }}
                >
                  วัน/เดือน/ปี
                </th>
                <th
                  className="text-center"
                  style={{
                    width: '20%',
                    borderTop: 'none',
                    borderBottom: '2px solid #e67e22',
                    padding: '15px 8px',
                    fontWeight: '600',
                    color: 'black'
                  }}
                >
                  รหัสผ้า
                </th>
                <th
                  className="text-center"
                  style={{
                    width: '25%',
                    borderTop: 'none',
                    borderBottom: '2px solid #e67e22',
                    padding: '15px 8px',
                    fontWeight: '600',
                    color: 'black'
                  }}
                >
                  ชื่อผู้สั่ง
                </th>
                <th
                  className="text-center"
                  style={{
                    width: '12%',
                    borderTop: 'none',
                    borderBottom: '2px solid #e67e22',
                    padding: '15px 8px',
                    fontWeight: '600',
                    color: 'black'
                  }}
                >
                  ชื่อผู้รับ
                </th>
                <th
                  className="text-center"
                  style={{
                    width: '5%',
                    borderTop: 'none',
                    borderBottom: '2px solid #e67e22',
                    padding: '15px 8px',
                    fontWeight: '600',
                    color: 'black'
                  }}
                >
                  พับ
                </th>
                <th
                  className="text-center"
                  style={{
                    width: '10%',
                    borderTop: 'none',
                    borderBottom: '2px solid #e67e22',
                    padding: '15px 8px',
                    fontWeight: '600',
                    color: 'black'
                  }}
                >
                  หลา
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center" style={{ padding: '20px' }}>
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center text-danger"
                    style={{ padding: '20px' }}
                  >
                    {error}
                  </td>
                </tr>
              ) : fabricouts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center" style={{ padding: '20px' }}>
                    ไม่มีข้อมูล
                  </td>
                </tr>
              ) : (
                fabricouts.map((item, index) => {
                  // ✅ ใช้รูปแบบ A 4804 เป็นหลักบนหน้าจอเหมือนกัน
                  const invoiceNumber =
                    `${item.vatType || ''} ${item.vatNo || ''}`.trim() ||
                    item.billNumber ||
                    item.refId ||
                    '';

                  return (
                    <tr
                      key={`${item.refId || `${item.vatType}-${item.vatNo}`}-${index}`}
                      style={{ backgroundColor: '#fff' }}
                    >
                      <td
                        className="text-center fw-bold "
                        style={{ padding: '12px 8px', border: '1px solid #f1f3f4' }}
                      >
                        {invoiceNumber}
                      </td>
                      <td
                        className="text-center"
                        style={{ padding: '12px 8px', border: '1px solid #f1f3f4' }}
                      >
                        {formatDate(item.createDate)}
                      </td>
                      <td
                        style={{ padding: '12px 8px', border: '1px solid #f1f3f4' }}
                      >
                        {item.fabricStruct || item.vatType || '-'}
                      </td>
                      <td
                        className="text-center"
                        style={{ padding: '12px 8px', border: '1px solid #f1f3f4' }}
                      >
                        {item.customerName || '-'}
                      </td>
                      <td
                        className="text-center"
                        style={{ padding: '12px 8px', border: '1px solid #f1f3f4' }}
                      >
                        {item.receiveName || '-'}
                      </td>
                      <td
                        className="text-center"
                        style={{ padding: '12px 8px', border: '1px solid #f1f3f4' }}
                      >
                        <span className="fw-bold text-primary">
                          {item.fold ?? 0}
                        </span>
                      </td>
                      <td
                        className="text-center"
                        style={{ padding: '12px 8px', border: '1px solid #f1f3f4' }}
                      >
                        <span className="fw-bold text-success">
                          {item.sumYard ?? 0}
                        </span>{' '}
                        หลา
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Modal */}
      <Modal show={showExportModal} onHide={handleCloseExportModal} size="lg" centered>
        <Modal.Header
          closeButton
          style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}
        >
          <Modal.Title style={{ color: '#495057', fontWeight: 'bold' }}>
            📊 เลือกเงื่อนไขการส่งออกรายงาน Excel
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#ffffff', padding: '30px' }}>
          <div className="container-fluid">
            <div className="row g-3">
              {/* Company Location Input */}
              <div className="col-12">
                <label className="form-label fw-bold text-dark">
                  ชื่อสถานประกอบการ:
                </label>
                <input
                  type="text"
                  className="form-control"
                  style={{ borderRadius: '8px', border: '2px solid #e9ecef' }}
                  placeholder="ระบุชื่อสถานประกอบการ"
                  value={exportFilters.companyLocation}
                  onChange={(e) =>
                    handleExportFilterChange('companyLocation', e.target.value)
                  }
                />
              </div>

              {/* Fabric Code Selection */}
              <div className="col-md-6">
                <label className="form-label fw-bold text-dark">รหัสผ้า:</label>
                <select
                  className="form-select"
                  style={{ borderRadius: '8px', border: '2px solid #e9ecef' }}
                  value={exportFilters.fabricCode}
                  onChange={(e) =>
                    handleExportFilterChange('fabricCode', e.target.value)
                  }
                >
                  <option value="">เลือกรหัสผ้า (ทั้งหมด)</option>
                  {availableFabricCodes.map((code, index) => (
                    <option key={index} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
              </div>

              {/* VAT Type Selection */}
              <div className="col-md-6">
                <label className="form-label fw-bold text-dark">ประเภทบิล:</label>
                <select
                  className="form-select"
                  style={{ borderRadius: '8px', border: '2px solid #e9ecef' }}
                  value={exportFilters.vatType}
                  onChange={(e) =>
                    handleExportFilterChange('vatType', e.target.value)
                  }
                >
                  <option value="">เลือกประเภทบิล (ทั้งหมด)</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>

              {/* Date Range Selection */}
              <div className="col-12">
                <div
                  className="border rounded p-3"
                  style={{ backgroundColor: '#f8f9fa' }}
                >
                  <h6 className="fw-bold text-dark mb-3">ช่วงเวลา:</h6>

                  <div className="row g-3">
                    {/* From Date */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">จากเดือน:</label>
                      <div className="row g-2">
                        <div className="col-8">
                          <select
                            className="form-select"
                            style={{
                              borderRadius: '8px',
                              border: '2px solid #e9ecef'
                            }}
                            value={exportFilters.fromMonth}
                            onChange={(e) =>
                              handleExportFilterChange('fromMonth', e.target.value)
                            }
                          >
                            <option value="">เลือกเดือน</option>
                            <option value="1">มกราคม</option>
                            <option value="2">กุมภาพันธ์</option>
                            <option value="3">มีนาคม</option>
                            <option value="4">เมษายน</option>
                            <option value="5">พฤษภาคม</option>
                            <option value="6">มิถุนายน</option>
                            <option value="7">กรกฎาคม</option>
                            <option value="8">สิงหาคม</option>
                            <option value="9">กันยายน</option>
                            <option value="10">ตุลาคม</option>
                            <option value="11">พฤศจิกายน</option>
                            <option value="12">ธันวาคม</option>
                          </select>
                        </div>
                        <div className="col-4">
                          <select
                            className="form-select"
                            style={{
                              borderRadius: '8px',
                              border: '2px solid #e9ecef'
                            }}
                            value={exportFilters.fromYear}
                            onChange={(e) =>
                              handleExportFilterChange('fromYear', e.target.value)
                            }
                          >
                            <option value="">ปี</option>
                            <option value="2023">2023</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* To Date */}
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">ถึงเดือน:</label>
                      <div className="row g-2">
                        <div className="col-8">
                          <select
                            className="form-select"
                            style={{
                              borderRadius: '8px',
                              border: '2px solid #e9ecef'
                            }}
                            value={exportFilters.toMonth}
                            onChange={(e) =>
                              handleExportFilterChange('toMonth', e.target.value)
                            }
                            disabled={
                              !exportFilters.fromMonth || !exportFilters.fromYear
                            }
                          >
                            <option value="">เลือกเดือน (ไม่บังคับ)</option>
                            <option value="1">มกราคม</option>
                            <option value="2">กุมภาพันธ์</option>
                            <option value="3">มีนาคม</option>
                            <option value="4">เมษายน</option>
                            <option value="5">พฤษภาคม</option>
                            <option value="6">มิถุนายน</option>
                            <option value="7">กรกฎาคม</option>
                            <option value="8">สิงหาคม</option>
                            <option value="9">กันยายน</option>
                            <option value="10">ตุลาคม</option>
                            <option value="11">พฤศจิกายน</option>
                            <option value="12">ธันวาคม</option>
                          </select>
                        </div>
                        <div className="col-4">
                          <select
                            className="form-select"
                            style={{
                              borderRadius: '8px',
                              border: '2px solid #e9ecef'
                            }}
                            value={exportFilters.toYear}
                            onChange={(e) =>
                              handleExportFilterChange('toYear', e.target.value)
                            }
                            disabled={!exportFilters.toMonth}
                          >
                            <option value="">ปี</option>
                            <option value="2023">2023</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                            <option value="2027">2027</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <small className="text-muted">
                      💡 หากไม่เลือก "ถึงเดือน" จะส่งออกเฉพาะข้อมูลในเดือนที่เลือก
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer
          style={{ backgroundColor: '#f8f9fa', borderTop: '2px solid #dee2e6' }}
        >
          <Button
            variant="secondary"
            onClick={handleCloseExportModal}
            style={{ borderRadius: '20px', width: '120px' }}
          >
            ❌ ยกเลิก
          </Button>
          <Button
            variant="success"
            onClick={exportToExcel}
            style={{ borderRadius: '20px', width: '150px' }}
            disabled={
              !exportFilters.fromMonth &&
              !exportFilters.fabricCode &&
              !exportFilters.vatType
            }
          >
            📊 ส่งออก Excel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ExportFabric;
