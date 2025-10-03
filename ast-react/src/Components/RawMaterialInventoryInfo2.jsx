// src/components/RawMaterialInventoryInfo.jsx
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const RawMaterialInventoryInfo2 = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Date filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterApplied, setIsFilterApplied] = useState(false);
  
  // แยกตัวแปรสำหรับแต่ละประเภท - Import
  const [importPalletSteel, setImportPalletSteel] = useState(0);
  const [importPalletWood, setImportPalletWood] = useState(0);
  const [importSpoolPaper, setImportSpoolPaper] = useState(0);
  const [importSpoolPlastic, setImportSpoolPlastic] = useState(0);
  const [importCylinderPaper, setImportCylinderPaper] = useState(0);
  const [importCylinderPlastic, setImportCylinderPlastic] = useState(0);
  const [importPartition, setImportPartition] = useState(0);
  const [importSack, setImportSack] = useState(0);
  const [importBox, setImportBox] = useState(0);

  // แยกตัวแปรสำหรับแต่ละประเภท - Return
  const [returnPalletSteel, setReturnPalletSteel] = useState(0);
  const [returnPalletWood, setReturnPalletWood] = useState(0);
  const [returnSpoolPaper, setReturnSpoolPaper] = useState(0);
  const [returnedSteelPallet , setReturnedSteelPallet] = useState(0);
  const [returnedWoodPallet , setReturnedWoodPallet] = useState(0);
  const [returnedSpoolPaper , setReturnedSpoolPaper] = useState(0);
  const [returnSpoolPlastic, setReturnSpoolPlastic] = useState(0);
  const [returnCylinderPaper, setReturnCylinderPaper] = useState(0);
  const [returnCylinderPlastic, setReturnCylinderPlastic] = useState(0);
  const [returnPartition, setReturnPartition] = useState(0);
  const [returnSack, setReturnSack] = useState(0);
  const [returnBox, setReturnBox] = useState(0);

  // แยกตัวแปรสำหรับแต่ละประเภท - History
  const [historyPalletSteel, setHistoryPalletSteel] = useState(0);
  const [historyPalletWood, setHistoryPalletWood] = useState(0);
  const [historySpoolPaper, setHistorySpoolPaper] = useState(0);
  const [historySpoolPlastic, setHistorySpoolPlastic] = useState(0);
  const [historyCylinderPaper, setHistoryCylinderPaper] = useState(0);
  const [historyCylinderPlastic, setHistoryCylinderPlastic] = useState(0);
  const [historyPartition, setHistoryPartition] = useState(0);
  const [historySack, setHistorySack] = useState(0);
  const [historyBox, setHistoryBox] = useState(0);

  // Get default date range (last 30 days to today)
  const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    return {
      start: thirtyDaysAgo.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };

  // Set quick date filters
  const setQuickDateFilter = (days) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    
    setStartDate(pastDate.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  // Format number with commas
  const formatNumber = (num) => {
    return num ? num.toLocaleString('th-TH') : '0';
  };

  // Export to Excel function
  const exportToExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('ตรวจสอบวัตถุดิบ-แพ็คเกจ');

      // Set worksheet properties
      worksheet.properties.defaultRowHeight = 20;
      
      // Add title
      worksheet.mergeCells('A1:E2');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'รายงานตรวจสอบวัตถุดิบ - แพ็คเกจ';
      titleCell.font = { size: 16, bold: true, color: { argb: '2F5496' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'E7F3FF' }
      };

      // Add date
      worksheet.mergeCells('A3:E3');
      const dateCell = worksheet.getCell('A3');
      dateCell.value = `วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`;
      dateCell.font = { size: 12, italic: true };
      dateCell.alignment = { horizontal: 'center' };

      // Add date range info to Excel if filter is applied
      let headerRowStart = 5;
      if (isFilterApplied && startDate && endDate) {
        worksheet.mergeCells('A4:E4');
        const dateRangeCell = worksheet.getCell('A4');
        dateRangeCell.value = `ช่วงวันที่: ${new Date(startDate).toLocaleDateString('th-TH')} - ${new Date(endDate).toLocaleDateString('th-TH')}`;
        dateRangeCell.font = { size: 10, italic: true, color: { argb: '0066CC' } };
        dateRangeCell.alignment = { horizontal: 'center' };
        headerRowStart = 6;
      }

      // Add headers
      const headerRow = worksheet.getRow(headerRowStart);
      headerRow.values = [
        'ชนิด',
        'นำเข้า',
        'ต้องส่งคืน',
        'ส่งคืนแล้ว',
        'คงเหลือ'
      ];

      // Style headers
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4472C4' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Prepare data rows
      const data = [
        {
          type: 'พาเลทเหล็ก',
          import: importPalletSteel,
          shouldReturn: returnPalletSteel,
          returned: returnedSteelPallet,
          remaining: returnPalletSteel - returnedSteelPallet
        },
        {
          type: 'พาเลทไม้',
          import: importPalletWood,
          shouldReturn: returnPalletWood,
          returned: returnedWoodPallet,
          remaining: returnPalletWood - returnedWoodPallet
        },
        {
          type: 'กรวยกระดาษ',
          import: importSpoolPaper,
          shouldReturn: returnSpoolPaper,
          returned: returnedSpoolPaper,
          remaining: returnSpoolPaper - returnedSpoolPaper
        },
        {
          type: 'กรวยพลาสติก',
          import: importSpoolPlastic,
          shouldReturn: returnSpoolPlastic,
          returned: historySpoolPlastic,
          remaining: returnSpoolPlastic - historySpoolPlastic
        },
        {
          type: 'กระบอกกระดาษ',
          import: importCylinderPaper,
          shouldReturn: returnCylinderPaper,
          returned: historyCylinderPaper,
          remaining: returnCylinderPaper - historyCylinderPaper
        },
        {
          type: 'กระบอกพลาสติก',
          import: importCylinderPlastic,
          shouldReturn: returnCylinderPlastic,
          returned: historyCylinderPlastic,
          remaining: returnCylinderPlastic - historyCylinderPlastic
        },
        {
          type: 'กระดาษกั้น',
          import: importPartition,
          shouldReturn: returnPartition,
          returned: historyPartition,
          remaining: returnPartition - historyPartition
        },
        {
          type: 'กระสอบ',
          import: importSack,
          shouldReturn: returnSack,
          returned: historySack,
          remaining: returnSack - historySack
        },
        {
          type: 'กล่อง',
          import: importBox,
          shouldReturn: returnBox,
          returned: historyBox,
          remaining: returnBox - historyBox
        }
      ];

      // Add data rows
      data.forEach((item, index) => {
        const rowNum = headerRowStart + 1 + index;
        const row = worksheet.getRow(rowNum);
        
        row.values = [
          item.type,
          item.import,
          item.shouldReturn,
          item.returned,
          item.remaining
        ];

        // Style data rows
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          
          if (colNumber === 1) {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          }

          // Alternate row colors
          if (index % 2 === 0) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F8F9FA' }
            };
          }
        });
      });

      // Add summary row
      const summaryRowNum = headerRowStart + 1 + data.length;
      const summaryRow = worksheet.getRow(summaryRowNum + 1);
      summaryRow.values = [
        'รวมทั้งหมด',
        data.reduce((sum, item) => sum + item.import, 0),
        data.reduce((sum, item) => sum + item.shouldReturn, 0),
        data.reduce((sum, item) => sum + item.returned, 0),
        data.reduce((sum, item) => sum + item.remaining, 0)
      ];

      // Style summary row
      summaryRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE699' }
        };
        cell.border = {
          top: { style: 'thick' },
          left: { style: 'thin' },
          bottom: { style: 'thick' },
          right: { style: 'thin' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // Set column widths
      worksheet.columns = [
        { width: 20 }, // ชนิด
        { width: 15 }, // นำเข้า
        { width: 15 }, // ต้องส่งคืน
        { width: 15 }, // ส่งคืนแล้ว
        { width: 15 }  // คงเหลือ
      ];

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const fileName = `รายงานตรวจสอบวัตถุดิบ-แพ็คเกจ_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.xlsx`;
      saveAs(blob, fileName);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  const fetchPalletData = async (dateFilter = null) => {
    setLoading(true);
    setError(null);

    try {
      // สร้าง URL พร้อม query parameters สำหรับ date filter
      let url = `${API_BASE_URL}/api/raw-materials`;
      if (dateFilter && dateFilter.start && dateFilter.end) {
        const params = new URLSearchParams({
          startDate: dateFilter.start,
          endDate: dateFilter.end
        });
        url += `?${params.toString()}`;
        console.log('Filtering data from:', dateFilter.start, 'to:', dateFilter.end);
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error จ้า: ${response.status}`);
      }
      
      const result = await response.json();
      
     if (result.success) {
  // รวมข้อมูลจากทั้งสองตาราง
  const allData = [
    ...(result.data.packageasts || []),
    ...(result.data.htrpackages || [])
  ];

  // คำนวณยอดรวมตามประเภท
  const importData = allData.filter(item => item.package_status === 'packageImport');
  const returnData = allData.filter(item => item.package_status === 'packageReturn');

  //พาเลทเหล็ก
  const importDataSteel = importData
    .filter(item => item.pallet_type === 'steel' && item.pallet !== null && item.pallet !== '')
    .reduce((sum, item) => sum + (parseInt(item.pallet) || 0), 0);
    

  const returnedDataSteel = allData
    .filter(item => item.pallet_steel && item.pallet_steel !== null && item.pallet_steel !== '')
    .reduce((sum, item) => sum + (parseInt(item.pallet_steel) || 0), 0);


  const returnedDataWood = allData
    .filter(item => item.pallet_wood && item.pallet_wood !== null && item.pallet_wood !== '')
    .reduce((sum, item) => sum + (parseInt(item.pallet_wood) || 0), 0);

  const returnedDataSpool = allData
    .filter(item => item.spool_paper && item.spool_paper !== null && item.spool_paper !== '')
    .reduce((sum, item) => sum + (parseInt(item.spool_paper) || 0), 0);

  const importDataSpool = importData
    .filter(item => item.spool_type === 'spool_paper' && item.spool !== null && item.spool !== '')
    .reduce((sum, item) => sum + (parseInt(item.spool) || 0), 0);
  const returnDataSpool = returnData
    .filter(item => item.spool_type === 'spool_paper' && item.spool !== null && item.spool !== '')
    .reduce((sum, item) => sum + (parseInt(item.spool) || 0), 0);

    
  const historyData = allData.filter(item => item.package_status === 'packageHistory');


  //กรวยพลาสติก
  const importDataSpoolPlastic = importData
  .filter(item => item.spool_type === 'spool_plastic' && item.spool !== null && item.spool !== '')
  .reduce((sum, item) => sum + (parseInt(item.spool) || 0), 0);

  const returnDataSpoolPlastic = returnData
  .filter(item => item.spool_type === 'spool_plastic' && item.spool !== null && item.spool !== '')
  .reduce((sum, item) => sum + (parseInt(item.spool) || 0), 0);

  const returnedDataSpoolPlastic = allData
  .filter(item => item.spool_plastic && item.spool_plastic !== null && item.spool_plastic !== '')
  .reduce((sum, item) => sum + (parseInt(item.spool_plastic) || 0), 0);

  //กระบอกกระดาษ
  const importDataSpoolCPaper = importData
  .filter(item => item.spool_type === 'spoolC_paper' && item.spool !== null && item.spool !== '')
  .reduce((sum, item) => sum + (parseInt(item.spool) || 0), 0);

  const returnDataSpoolCPaper = returnData
  .filter(item => item.spool_type === 'spoolC_paper' && item.spool !== null && item.spool !== '')
  .reduce((sum, item) => sum + (parseInt(item.spool) || 0), 0);

  const returnedDataSpoolCPaper = allData
  .filter(item => item.spoolC_paper && item.spoolC_paper !== null && item.spoolC_paper !== '')
  .reduce((sum, item) => sum + (parseInt(item.spoolC_paper) || 0), 0);


  //กระบอกพลาสติก
  const importDataSpoolCPlastic = importData
  .filter(item => item.spool_type === 'spoolC_plastic' && item.spool !== null && item.spool !== '')
  .reduce((sum, item) => sum + (parseInt(item.spool) || 0), 0);

  const returnDataSpoolCPlastic = returnData
  .filter(item => item.spool_type === 'spoolC_plastic' && item.spool !== null && item.spool !== '')
  .reduce((sum, item) => sum + (parseInt(item.spool) || 0), 0);

  const returnedDataSpoolCPlastic = allData
  .filter(item => item.spoolC_plastic && item.spoolC_plastic !== null && item.spoolC_plastic !== '')
  .reduce((sum, item) => sum + (parseInt(item.spoolC_plastic) || 0), 0);

    //กระดาษกั้น (partition)
   const importDataPartition = importData
    .filter(item => item.partition !== null && item.partition !== '' && 
            (result.data.packageasts || []).some(ast => ast.id === item.id))
    .reduce((sum, item) => sum + (parseInt(item.partition) || 0), 0);


  const returnDataPartition = returnData
    .filter(item => item.partition !== null && item.partition !== '' && 
            (result.data.packageasts || []).some(ast => ast.id === item.id))
    .reduce((sum, item) => sum + (parseInt(item.partition) || 0), 0);

  const returnedDataPartition = (result.data.htrpackages || [])
    .filter(item => item.partition !== null && item.partition !== '')
    .reduce((sum, item) => sum + (parseInt(item.partition) || 0), 0);

  //กระสอบ (sack)
  const importDataSack = importData
    .filter(item => item.sack !== null && item.sack !== '' && 
            (result.data.packageasts || []).some(ast => ast.id === item.id))
    .reduce((sum, item) => sum + (parseInt(item.sack) || 0), 0);

  const returnDataSack = returnData
    .filter(item => item.sack !== null && item.sack !== '' && 
            (result.data.packageasts || []).some(ast => ast.id === item.id))
    .reduce((sum, item) => sum + (parseInt(item.sack) || 0), 0);

  const returnedDataSack = (result.data.htrpackages || [])
    .filter(item => item.sack !== null && item.sack !== '')
    .reduce((sum, item) => sum + (parseInt(item.sack) || 0), 0);


  // กล่อง (box)
  const importDataBox = importData
    .filter(item => item.box !== null && item.box !== '' && 
            (result.data.packageasts || []).some(ast => ast.id === item.id))
    .reduce((sum, item) => sum + (parseInt(item.box) || 0), 0);

  const returnDataBox = returnData
    .filter(item => item.box !== null && item.box !== '' && 
            (result.data.packageasts || []).some(ast => ast.id === item.id))
    .reduce((sum, item) => sum + (parseInt(item.box) || 0), 0);

const returnedDataBox = (result.data.htrpackages || [])
    .filter(item => item.box !== null && item.box !== '')
    .reduce((sum, item) => sum + (parseInt(item.box) || 0), 0);


  // ฟังก์ชันสำหรับรวมค่าตามเงื่อนไข
  const sumByCondition = (data, palletType, field = '') => {
    return data
      .filter(item => item.pallet_type === palletType)
      .reduce((sum, item) => sum + (parseInt(item[field]) || 0), 0);
  };



  

  // ฟังก์ชันสำหรับรวมค่าตามเงื่อนไข spool_type
  const sumBySpoolType = (data, spoolType, field = '') => {
    return data
      .filter(item => item.spool_type === spoolType)
      .reduce((sum, item) => sum + (parseInt(item[field]) || 0), 0);
  };

  // คำนวณสำหรับ พาเลทเหล็ก (steel)
  const importSteelPallet = importDataSteel
  const returnSteelPallet = sumByCondition(returnData, 'steel', 'pallet');
  const returnedSteelPallet = returnedDataSteel; 
  const historySteelPallet = sumByCondition(historyData, 'steel', 'pallet');

  // คำนวณสำหรับ พาเลทไม้ (wood)
  const importWoodPallet = sumByCondition(importData, 'wood', 'pallet');
  const returnWoodPallet = sumByCondition(returnData, 'wood', 'pallet');
  const returnedWoodPallet = returnedDataWood;
  const historyWoodPallet = sumByCondition(historyData, 'wood', 'pallet');

  // คำนวณสำหรับ กรวยกระดาษ (paper spool)
  const importSpoolPaper = importDataSpool; // ใช้ค่าที่ sum แล้วจาก spool_type = 'spoolC_paper'
  const returnSpoolPaper = returnDataSpool
  const returnedSpoolPaper = returnedDataSpool; // ใช้ค่าที่ sum แล้วจาก spool
  const historySpoolPaper = sumBySpoolType(historyData, 'paper', 'spool');

  // คำนวณสำหรับ กรวยพลาสติก (plastic spool)
  const importSpoolPlastic = importDataSpoolPlastic
  const returnSpoolPlastic = returnDataSpoolPlastic
  const historySpoolPlastic = returnedDataSpoolPlastic

  // คำนวณสำหรับ กระบอกกระดาษ (paper cylinder)
  const importCylinderPaper = importDataSpoolCPaper
  const returnCylinderPaper = returnDataSpoolCPaper
  const historyCylinderPaper = returnedDataSpoolCPaper

  // คำนวณสำหรับ กระบอกพลาสติก (plastic cylinder)
  const importCylinderPlastic = importDataSpoolCPlastic
  const returnCylinderPlastic = returnDataSpoolCPlastic
  const historyCylinderPlastic = returnedDataSpoolCPlastic

  // คำนวณสำหรับ กระดาษกั้น (partition)
  const importPartition = importDataPartition
  const returnPartition = returnDataPartition
  const historyPartition = returnedDataPartition

  // คำนวณสำหรับ กระสอบ (sack)
  const importSack = importDataSack
  const returnSack = returnDataSack
  const historySack =returnedDataSack

  // คำนวณสำหรับ กล่อง (box)
  const importBox = importDataBox;
  const returnBox = returnDataBox;
  const historyBox = returnedDataBox;

  // คำนวณและ Set ค่า Import
  setImportPalletSteel(importSteelPallet);
  setImportPalletWood(importWoodPallet);
  setImportSpoolPaper(importSpoolPaper);
  setImportSpoolPlastic(importSpoolPlastic);
  setImportCylinderPaper(importCylinderPaper);
  setImportCylinderPlastic(importCylinderPlastic);
  setImportPartition(importPartition);
  setImportSack(importSack);
  setImportBox(importBox);

  // คำนวณและ Set ค่า Return
  setReturnPalletSteel(returnSteelPallet);
  setReturnPalletWood(returnWoodPallet);
  setReturnedSteelPallet(returnedSteelPallet);
  setReturnedWoodPallet(returnedWoodPallet);
  setReturnSpoolPaper(returnSpoolPaper);
  setReturnedSpoolPaper(returnedSpoolPaper);
  setReturnSpoolPlastic(returnSpoolPlastic);
  setReturnCylinderPaper(returnCylinderPaper);
  setReturnCylinderPlastic(returnCylinderPlastic);
  setReturnPartition(returnPartition);
  setReturnSack(returnSack);
  setReturnBox(returnBox);

  // คำนวณและ Set ค่า History
  setHistoryPalletSteel(historySteelPallet);
  setHistoryPalletWood(historyWoodPallet);
  setHistorySpoolPaper(historySpoolPaper);
  setHistorySpoolPlastic(historySpoolPlastic);
  setHistoryCylinderPaper(historyCylinderPaper);
  setHistoryCylinderPlastic(historyCylinderPlastic);
  setHistoryPartition(historyPartition);
  setHistorySack(historySack);
  setHistoryBox(historyBox);

  // Log ค่าการคำนวณ totalRemaining สำหรับ Info2
  console.log('🔍 Info2 - การคำนวณคงเหลือ:');
  console.log('พาเลทเหล็ก:', { return: returnSteelPallet, returned: returnedSteelPallet, remaining: returnSteelPallet - returnedSteelPallet });
  console.log('พาเลทไม้:', { return: returnWoodPallet, returned: returnedWoodPallet, remaining: returnWoodPallet - returnedWoodPallet });
  console.log('กรวยกระดาษ:', { return: returnSpoolPaper, returned: returnedSpoolPaper, remaining: returnSpoolPaper - returnedSpoolPaper });
  console.log('กรวยพลาสติก:', { return: returnSpoolPlastic, history: historySpoolPlastic, remaining: returnSpoolPlastic - historySpoolPlastic });
  console.log('กระบอกกระดาษ:', { return: returnCylinderPaper, history: historyCylinderPaper, remaining: returnCylinderPaper - historyCylinderPaper });
  console.log('กระบอกพลาสติก:', { return: returnCylinderPlastic, history: historyCylinderPlastic, remaining: returnCylinderPlastic - historyCylinderPlastic });
  console.log('กระดาษกั้น:', { return: returnPartition, history: historyPartition, remaining: returnPartition - historyPartition });
  console.log('กระสอบ:', { return: returnSack, history: historySack, remaining: returnSack - historySack });
  console.log('กล่อง:', { return: returnBox, history: historyBox, remaining: returnBox - historyBox });
  
  const totalRemainingInfo2 = (returnSteelPallet - returnedSteelPallet) + 
                               (returnWoodPallet - returnedWoodPallet) + 
                               (returnSpoolPaper - returnedSpoolPaper) + 
                               (returnSpoolPlastic - historySpoolPlastic) + 
                               (returnCylinderPaper - historyCylinderPaper) + 
                               (returnCylinderPlastic - historyCylinderPlastic) + 
                               (returnPartition - historyPartition) + 
                               (returnSack - historySack) + 
                               (returnBox - historyBox);
  
  console.log('📊 Info2 - ผลรวมคงเหลือ:', totalRemainingInfo2);

} else {
        throw new Error(result.message || 'ไม่สามารถดึงข้อมูลได้');
      }
    } catch (err) {
      console.error('Error fetching pallet data:', err);
      setError(err.message);
      
      // ข้อมูลตัวอย่างเมื่อ API ไม่ทำงาน
      
    } finally {
      setLoading(false);
    }
  };

  // Handle date filter
  const handleDateFilter = () => {
    if (!startDate || !endDate) {
      alert('กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด');
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      alert('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด');
      return;
    }

    const dateFilter = {
      start: startDate,
      end: endDate
    };
    
    setIsFilterApplied(true);
    fetchPalletData(dateFilter);
  };

  // Clear date filter
  const clearDateFilter = () => {
    setStartDate('');
    setEndDate('');
    setIsFilterApplied(false);
    fetchPalletData();
  };

  // เรียกใช้เมื่อ component โหลด
  useEffect(() => {
    fetchPalletData();
  }, []);

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="fw-bold text-dark mb-0">
            <i className="bi bi-layers me-3 text-primary"></i>
            ตรวจสอบวัตถุดิบ
          </h2>
          <p className="text-muted mt-2">ข้อมูลรายละเอียดวัตถุดิบในระบบ</p>
        </div>
      </div>

      {/* Date Filter Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <h6 className="fw-bold text-dark mb-3">
                <i className="bi bi-funnel me-2 text-primary"></i>
                ตัวกรองข้อมูล
              </h6>
              
              {/* Quick Filter Buttons */}
              <div className="row mb-3">
                <div className="col-12">
                  <div className="d-flex gap-2 flex-wrap">
                    <button 
                      className="btn btn-outline-info btn-sm"
                      onClick={() => setQuickDateFilter(7)}
                      style={{ borderRadius: '20px' }}
                    >
                      7 วันที่แล้ว
                    </button>
                    <button 
                      className="btn btn-outline-info btn-sm"
                      onClick={() => setQuickDateFilter(30)}
                      style={{ borderRadius: '20px' }}
                    >
                      30 วันที่แล้ว
                    </button>
                    <button 
                      className="btn btn-outline-info btn-sm"
                      onClick={() => setQuickDateFilter(90)}
                      style={{ borderRadius: '20px' }}
                    >
                      3 เดือนที่แล้ว
                    </button>
                    <button 
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        const defaultRange = getDefaultDateRange();
                        setStartDate(defaultRange.start);
                        setEndDate(defaultRange.end);
                      }}
                      style={{ borderRadius: '20px' }}
                    >
                      ค่าเริ่มต้น (30 วัน)
                    </button>
                  </div>
                </div>
              </div>

              <div className="row align-items-end">
                <div className="col-md-3">
                  <label htmlFor="startDate" className="form-label fw-semibold text-dark">
                    <i className="bi bi-calendar-event me-2 text-primary"></i>
                    วันที่เริ่มต้น
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    className="form-control"
                    style={{ borderRadius: '8px' }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]} // ไม่ให้เลือกวันในอนาคต
                  />
                </div>
                <div className="col-md-3">
                  <label htmlFor="endDate" className="form-label fw-semibold text-dark">
                    <i className="bi bi-calendar-check me-2 text-primary"></i>
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    className="form-control"
                    style={{ borderRadius: '8px' }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                    max={new Date().toISOString().split('T')[0]} // ไม่ให้เลือกวันในอนาคต
                  />
                </div>
                <div className="col-md-4">
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-primary"
                      style={{ borderRadius: '8px' }}
                      onClick={handleDateFilter}
                      disabled={loading || !startDate || !endDate}
                    >
                      <i className="bi bi-search me-2"></i>
                      กรองข้อมูล
                    </button>
                    <button 
                      className="btn btn-outline-secondary"
                      style={{ borderRadius: '8px' }}
                      onClick={clearDateFilter}
                      disabled={loading}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      ล้างตัวกรอง
                    </button>
                  </div>
                </div>
                <div className="col-md-2 text-end">
                  {isFilterApplied && (
                    <span className="badge bg-info fs-6">
                      <i className="bi bi-funnel me-1"></i>
                      กรองแล้ว
                    </span>
                  )}
                </div>
              </div>
              
              {/* Warning about Backend Support */}
              <div className="row mt-3">
                <div className="col-12">
                 
                </div>
              </div>

              {/* Filter Info */}
              {isFilterApplied && startDate && endDate && (
                <div className="row mt-2">
                  <div className="col-12">
                    <div className="alert alert-info py-2 mb-0" style={{ borderRadius: '8px' }}>
                      <i className="bi bi-info-circle me-2"></i>
                      <small>
                        แสดงข้อมูลตั้งแต่วันที่ <strong>{new Date(startDate).toLocaleDateString('th-TH')}</strong> 
                        ถึงวันที่ <strong>{new Date(endDate).toLocaleDateString('th-TH')}</strong>
                      </small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-warning alert-dismissible fade show mb-4" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          <strong>แจ้งเตือน:</strong> {error} (กำลังแสดงข้อมูลตัวอย่าง)
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setError(null)}
          ></button>
        </div>
      )}

      {/* Main Table Card */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
            <div className="card-body p-0">
              {/* Table Header */}
              <div className="p-4 border-bottom" style={{ backgroundColor: '#ffffff' }}>
                <h5 className="card-title fw-bold text-dark mb-0 d-flex align-items-center">
                  <i className="bi bi-graph-up me-2 text-primary"></i>
                  ตรวจสอบวัตถุดิบ
                </h5>
              </div>

              {/* Table Content */}
              <div className="table-responsive">
                <table className="table table-hover mb-2" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                      <th className="text-center py-4 px-3" style={{ 
                        fontWeight: '600', 
                        color: '#495057',
                        borderTop: 'none',
                        fontSize: '1rem',
                        width: '25%'
                        
                      }}>
                        ชนิด
                      </th>
                      
                      <th className="text-center py-4 px-2" style={{ 
                        fontWeight: '600', 
                        color: '#495057',
                        borderTop: 'none',
                        fontSize: '1rem',
                        width: '18%'
                      }}>
                        นำเข้า
                      </th>
                      <th className="text-center py-4 px-2" style={{ 
                        fontWeight: '600', 
                        color: '#495057',
                        borderTop: 'none',
                        fontSize: '1rem',
                        width: '20%'
                      }}>
                        ต้องส่งคืน
                      </th>
                      <th className="text-center py-4 px-2" style={{ 
                        fontWeight: '600', 
                        color: '#495057',
                        borderTop: 'none',
                        fontSize: '1rem',
                        width: '18%'
                      }}>
                        ส่งคืนแล้ว
                      </th>
                      <th className="text-center py-4 px-2" style={{ 
                        fontWeight: '600', 
                        color: '#495057',
                        borderTop: 'none',
                        fontSize: '1rem',
                        width: '19%'
                      }}>
                        คงเหลือ
                      </th>
                    </tr>
                    
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">กำลังโหลด...</span>
                          </div>
                          <p className="mt-2 text-muted">กำลังดึงข้อมูล...</p>
                        </td>
                      </tr>
                    ) : (
                      <>
                        <tr>
                          <td className="py-3 px-3" style={{ fontSize: '0.95rem' }}>พาเลทเหล็ก</td>
            
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-success">{formatNumber(importPalletSteel)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-warning">{formatNumber(returnPalletSteel)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-info">{formatNumber(returnedSteelPallet)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-primary">{formatNumber(returnPalletSteel - returnedSteelPallet)}</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3" style={{ fontSize: '0.95rem' }}>พาเลทไม้</td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-success">{formatNumber(importPalletWood)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-warning">{formatNumber(returnPalletWood)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-info">{formatNumber(returnedWoodPallet)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-primary">{formatNumber(returnPalletWood - returnedWoodPallet)}</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3" style={{ fontSize: '0.95rem' }}>กรวยกระดาษ</td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-success">{formatNumber(importSpoolPaper)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-warning">{formatNumber(returnSpoolPaper)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-info">{formatNumber(returnedSpoolPaper)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-primary">{formatNumber(returnSpoolPaper - returnedSpoolPaper)}</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3" style={{ fontSize: '0.95rem' }}>กรวยพลาสติก</td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-success">{formatNumber(importSpoolPlastic)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-warning">{formatNumber(returnSpoolPlastic)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-info">{formatNumber(historySpoolPlastic)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-primary">{formatNumber(returnSpoolPlastic - historySpoolPlastic)}</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3" style={{ fontSize: '0.95rem' }}>กระบอกกระดาษ</td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-success">{formatNumber(importCylinderPaper)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-warning">{formatNumber(returnCylinderPaper)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-info">{formatNumber(historyCylinderPaper)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-primary">{formatNumber(returnCylinderPaper - historyCylinderPaper)}</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3" style={{ fontSize: '0.95rem' }}>กระบอกพลาสติก</td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-success">{formatNumber(importCylinderPlastic)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-warning">{formatNumber(returnCylinderPlastic)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-info">{formatNumber(historyCylinderPlastic)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-primary">{formatNumber(returnCylinderPlastic - historyCylinderPlastic)}</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3" style={{ fontSize: '0.95rem' }}>กระดาษกั้น</td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-success">{formatNumber(importPartition)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-warning">{formatNumber(returnPartition)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-info">{formatNumber(historyPartition)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-primary">{formatNumber(returnPartition - historyPartition)}</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3" style={{ fontSize: '0.95rem' }}>กระสอบ</td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-success">{formatNumber(importSack)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-warning">{formatNumber(returnSack)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-info">{formatNumber(historySack)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-primary">{formatNumber(returnSack - historySack)}</span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 px-3" style={{ fontSize: '0.95rem' }}>กล่อง</td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-success">{formatNumber(importBox)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-warning">{formatNumber(returnBox)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-info">{formatNumber(historyBox)}</span>
                          </td>
                          <td className="text-center py-3 px-2">
                            <span className="fw-bold text-primary">{formatNumber(returnBox - historyBox)}</span>
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="p-4 border-top" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      แสดงข้อมูลทั้งหมด 9 รายการ
                      {isFilterApplied && (
                        <span className="ms-2 badge bg-secondary">
                          <i className="bi bi-calendar-range me-1"></i>
                          กรองตามวันที่
                        </span>
                      )}
                    </small>
                  </div>
                  <div className="col-md-6 text-end">
                    <button 
                      className="btn btn-outline-primary btn-sm me-2" 
                      style={{ borderRadius: '8px' }}
                      onClick={() => fetchPalletData(isFilterApplied ? { start: startDate, end: endDate } : null)}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      รีเฟรช
                    </button>
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ borderRadius: '8px' }}
                      onClick={exportToExcel}
                    >
                      <i className="bi bi-download me-1"></i>
                      ส่งออกข้อมูล
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mt-4">
        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '10px' }}>
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="bi bi-boxes text-primary" style={{ fontSize: '2rem' }}></i>
              </div>
              <h6 className="text-muted mb-2">รายการทั้งหมด</h6>
              <h4 className="fw-bold text-primary mb-0">9</h4>
              <small className="text-muted">ชนิดวัตถุดิบ</small>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '10px' }}>
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="bi bi-arrow-down-circle text-success" style={{ fontSize: '2rem' }}></i>
              </div>
              <h6 className="text-muted mb-2">นำเข้าทั้งหมด</h6>
              <h4 className="fw-bold text-success mb-0">
                {formatNumber(
                  importPalletSteel + importPalletWood + importSpoolPaper + 
                  importSpoolPlastic + importCylinderPaper + importCylinderPlastic + 
                  importPartition + importSack + importBox
                )}
              </h4>
              <small className="text-muted">ลูก</small>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '10px' }}>
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="bi bi-arrow-up-circle text-warning" style={{ fontSize: '2rem' }}></i>
              </div>
              <h6 className="text-muted mb-2">ส่งออกทั้งหมด</h6>
              <h4 className="fw-bold text-warning mb-0">
                {formatNumber(
                  returnPalletSteel + returnPalletWood + returnSpoolPaper + 
                  returnSpoolPlastic + returnCylinderPaper + returnCylinderPlastic + 
                  returnPartition + returnSack + returnBox
                )}
              </h4>
              <small className="text-muted">ลูก</small>
            </div>
          </div>
        </div>

        <div className="col-md-3 mb-3">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '10px' }}>
            <div className="card-body text-center p-4">
              <div className="mb-3">
                <i className="bi bi-check-circle text-info" style={{ fontSize: '2rem' }}></i>
              </div>
              <h6 className="text-muted mb-2">คงเหลือทั้งหมด</h6>
              <h4 className="fw-bold text-info mb-0">
                {formatNumber(
                  (returnPalletSteel - returnedSteelPallet) + 
                  (returnPalletWood - returnedWoodPallet) + 
                  (returnSpoolPaper - returnedSpoolPaper) + 
                  (returnSpoolPlastic - historySpoolPlastic) + 
                  (returnCylinderPaper - historyCylinderPaper) + 
                  (returnCylinderPlastic - historyCylinderPlastic) + 
                  (returnPartition - historyPartition) + 
                  (returnSack - historySack) + 
                  (returnBox - historyBox)
                )}
              </h4>
              <small className="text-muted">ลูก</small>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hover-row:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .table th {
          border-bottom: 2px solid #dee2e6;
        }
        
        .table td {
          border-bottom: 1px solid #dee2e6;
        }
      `}</style>
    </div>
  );
};

export default RawMaterialInventoryInfo2;
