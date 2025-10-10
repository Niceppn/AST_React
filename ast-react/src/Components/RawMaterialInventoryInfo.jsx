import React, { useState, useEffect } from 'react';

import { API_BASE_URL } from "@/config/apiBase";

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const RawMaterialInventoryInfo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawMaterialData, setRawMaterialData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Date filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterApplied, setIsFilterApplied] = useState(false);

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
      const worksheet = workbook.addWorksheet('ตรวจสอบวัตถุดิบ');

      // Set worksheet properties
      worksheet.properties.defaultRowHeight = 20;
      
            // Add title
      worksheet.mergeCells('A1:C2');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'บริษัท เอเซียเท็กซ์ไทล์ จำกัด';
      titleCell.font = { size: 14, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Add date
      worksheet.mergeCells('A3:H3');
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
      if (isFilterApplied && startDate && endDate) {
        worksheet.mergeCells('A4:H4');
        const dateRangeCell = worksheet.getCell('A4');
        dateRangeCell.value = `ช่วงวันที่: ${new Date(startDate).toLocaleDateString('th-TH')} - ${new Date(endDate).toLocaleDateString('th-TH')}`;
        dateRangeCell.font = { size: 10, italic: true, color: { argb: '0066CC' } };
        dateRangeCell.alignment = { horizontal: 'center' };
      }

      // Add headers (adjust row numbers if date range is added)
      const headerRowStart = isFilterApplied ? 6 : 5;
      const headerRow1 = worksheet.getRow(headerRowStart);
      headerRow1.values = [
        'ชนิดด้าย',
        'จำนวนด้าย(ลูก)',
        'นำเข้า',
        '',
        'นำออก', 
        '',
        'คงเหลือ',
        ''
      ];

      const headerRow2 = worksheet.getRow(headerRowStart + 1);
      headerRow2.values = [
        '',
        '',
        'ปอนด์',
        'กิโลกรัม',
        'ปอนด์',
        'กิโลกรัม',
        'ปอนด์',
        'กิโลกรัม'
      ];

      // Merge header cells (adjust cell addresses based on header row start)
      worksheet.mergeCells(`A${headerRowStart}:A${headerRowStart + 1}`); // ชนิดด้าย
      worksheet.mergeCells(`B${headerRowStart}:B${headerRowStart + 1}`); // จำนวนด้าย
      worksheet.mergeCells(`C${headerRowStart}:D${headerRowStart}`); // นำเข้า
      worksheet.mergeCells(`E${headerRowStart}:F${headerRowStart}`); // นำออก
      worksheet.mergeCells(`G${headerRowStart}:H${headerRowStart}`); // คงเหลือ

      // Style headers (adjust cell addresses)
      const headerCells = [`A${headerRowStart}`, `B${headerRowStart}`, `C${headerRowStart}`, `E${headerRowStart}`, `G${headerRowStart}`];
      headerCells.forEach(cellAddr => {
        const cell = worksheet.getCell(cellAddr);
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

      // Style sub headers (adjust cell addresses)
      const subHeaderCells = [`C${headerRowStart + 1}`, `D${headerRowStart + 1}`, `E${headerRowStart + 1}`, `F${headerRowStart + 1}`, `G${headerRowStart + 1}`, `H${headerRowStart + 1}`];
      subHeaderCells.forEach(cellAddr => {
        const cell = worksheet.getCell(cellAddr);
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '70AD47' }
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Add data rows (adjust row numbers)
      rawMaterialData.forEach((item, index) => {
        const rowNum = headerRowStart + 2 + index;
        const row = worksheet.getRow(rowNum);
        
        row.values = [
          item.yarnType || 'N/A',
          item.importTotalSpool || 0,
          parseFloat(item.importTotalWeightPNet || 0).toFixed(2),
          parseFloat(item.importTotalWeightKgNet || 0).toFixed(2),
          parseFloat(item.exportTotalWeightPNet || 0).toFixed(2),
          parseFloat(item.exportTotalWeightKgNet || 0).toFixed(2),
          parseFloat(item.remainingWeightPNet || 0).toFixed(2),
          parseFloat(item.remainingWeightKgNet || 0).toFixed(2)
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

      // Add summary row (adjust row numbers)
      const summaryRowNum = headerRowStart + 2 + rawMaterialData.length;
      const summaryRow = worksheet.getRow(summaryRowNum + 1);
      summaryRow.values = [
        'รวมทั้งหมด',
        rawMaterialData.reduce((sum, item) => sum + (item.importTotalSpool || 0), 0),
        rawMaterialData.reduce((sum, item) => sum + parseFloat(item.importTotalWeightPNet || 0), 0).toFixed(2),
        rawMaterialData.reduce((sum, item) => sum + parseFloat(item.importTotalWeightKgNet || 0), 0).toFixed(2),
        rawMaterialData.reduce((sum, item) => sum + parseFloat(item.exportTotalWeightPNet || 0), 0).toFixed(2),
        rawMaterialData.reduce((sum, item) => sum + parseFloat(item.exportTotalWeightKgNet || 0), 0).toFixed(2),
        rawMaterialData.reduce((sum, item) => sum + parseFloat(item.remainingWeightPNet || 0), 0).toFixed(2),
        rawMaterialData.reduce((sum, item) => sum + parseFloat(item.remainingWeightKgNet || 0), 0).toFixed(2)
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
        { width: 25 }, // ชนิดด้าย
        { width: 15 }, // จำนวนด้าย
        { width: 15 }, // นำเข้า ปอนด์
        { width: 15 }, // นำเข้า กิโลกรัม
        { width: 15 }, // นำออก ปอนด์
        { width: 15 }, // นำออก กิโลกรัม
        { width: 15 }, // คงเหลือ ปอนด์
        { width: 15 }  // คงเหลือ กิโลกรัม
      ];

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const fileName = `รายงานตรวจสอบวัตถุดิบ_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.xlsx`;
      saveAs(blob, fileName);

    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  // Export to Excel function V2 (A4 Print - คงเหลืออย่างเดียว)
  const exportToExcelV2 = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('รายงานวัตถุดิบ V2');

      // Set worksheet properties for A4 printing
      worksheet.properties.defaultRowHeight = 18;
      
      // Set page setup for A4 printing
      worksheet.pageSetup = {
        paperSize: 9, // A4 paper size
        orientation: 'portrait', // แนวตั้งเพราะคอลัมน์น้อยลง
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

      // Set print area and other print settings
      worksheet.views = [{
        showGridLines: true,
        showRowColHeaders: false,
        zoomScale: 100
      }];
      
      // Add title
      worksheet.mergeCells('A1:C1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = 'บริษัท เอเซียเท็กซ์ไทล์ จำกัด';
      titleCell.font = { size: 14, bold: true,  };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
     

      worksheet.mergeCells('A2:C2');
      const titleCell2 = worksheet.getCell('A2');
      titleCell2.value = 'วัตถุดิบคงเหลือ ';
      titleCell2.font = { size: 14, bold: true};
      titleCell2.alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Add date range info to Excel if filter is applied
      if (isFilterApplied && startDate && endDate) {
        worksheet.mergeCells('A3:C3');
        const dateRangeCell = worksheet.getCell('A3');
        dateRangeCell.value = `ณ วันที่: ${new Date(startDate).toLocaleDateString('th-TH')} - ${new Date(endDate).toLocaleDateString('th-TH')}`;
        dateRangeCell.font = { size: 14, bold: true};
        dateRangeCell.alignment = { horizontal: 'center' };
      }

      // Add headers - เพิ่มคอลัมน์ลำดับที่
      const headerRowStart = isFilterApplied ? 6 : 5;
      const headerRow1 = worksheet.getRow(headerRowStart);
      headerRow1.values = [
        'ลำดับที่',
        'รายการ',
        'จำนวน (ปอนด์)'
      ];

      // ไม่ต้องมี header row ที่ 2 เพราะไม่มีหน่วยย่อย
      // Merge header cells
      // ไม่ต้อง merge เพราะเป็น header เดียว

      // Style headers
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

      // Add data rows - เพิ่มคอลัมน์ลำดับที่
      rawMaterialData.forEach((item, index) => {
        const rowNum = headerRowStart + 1 + index; // เปลี่ยนจาก +2 เป็น +1 เพราะไม่มี sub header
        const row = worksheet.getRow(rowNum);
        
        row.values = [
          index + 1, // ลำดับที่
          item.yarnType || 'N/A',
          parseFloat(item.remainingWeightPNet || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        ];

        // Style data rows
        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'B7B7B7' } },
            left: { style: 'thin', color: { argb: 'B7B7B7' } },
            bottom: { style: 'thin', color: { argb: 'B7B7B7' } },
            right: { style: 'thin', color: { argb: 'B7B7B7' } }
          };
          
          if (colNumber === 1) {
            // ลำดับที่ - จัดกลาง
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { bold: true, size: 9 };
          } else if (colNumber === 2) {
            // ชนิดด้าย - จัดซ้าย
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
            cell.font = { bold: true, size: 9 };
          } else {
            // น้ำหนัก - จัดกลาง
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { size: 9 };
          }

          // Alternate row colors
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
              fgColor: { argb: 'FFFFFF' }
            };
          }
        });
      });

      // Add summary row
      // const summaryRowNum = headerRowStart + 1 + rawMaterialData.length; // เปลี่ยนจาก +2 เป็น +1
      // const summaryRow = worksheet.getRow(summaryRowNum + 1);
      // summaryRow.values = [
      //   '', // เว้นว่างคอลัมน์ลำดับที่
      //   'รวมทั้งหมด',
      //   rawMaterialData.reduce((sum, item) => sum + parseFloat(item.remainingWeightPNet || 0), 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      // ];

      // // Style summary row
      // summaryRow.eachCell((cell) => {
      //   cell.font = { bold: true, size: 10 };
      //   cell.fill = {
      //     type: 'pattern',
      //     pattern: 'solid',
      //     fgColor: { argb: 'FFFFFF' }
      //   };
      //   cell.border = {
      //     top: { style: 'medium', },
      //     left: { style: 'medium', },
      //     bottom: { style: 'medium',  },
      //     right: { style: 'medium',  }
      //   };
      //   cell.alignment = { horizontal: 'center', vertical: 'middle' };
      // });

      // Set column widths optimized for A4 portrait - เพิ่มเป็น 3 คอลัมน์
      worksheet.columns = [
        { width: 10 }, // ลำดับที่ - แคบ
        { width: 35 }, // ชนิดด้าย - ขยายเพราะมีพื้นที่เหลือมาก
        { width: 30 }  // คงเหลือ ปอนด์ - ขยาย
      ];

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const fileName = `รายงานตรวจสอบวัตถุดิบ_คงเหลือ_ปอนด์_เท่านั้น_${new Date().toLocaleDateString('th-TH').replace(/\//g, '-')}.xlsx`;
      saveAs(blob, fileName);

    } catch (error) {
      console.error('Error exporting to Excel V2:', error);
      alert('เกิดข้อผิดพลาดในการส่งออกข้อมูล (คงเหลือ - ปอนด์ เท่านั้น)');
    }
  };

  const fetchPalletData = async (dateFilter = null) => {
    setLoading(true);
    setError(null);

    try {
      // สร้าง URL พร้อม query parameters สำหรับ date filter
      let url = `${API_BASE_URL}/api/raw-materials/stockMaterial`;
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
        // เก็บข้อมูลดิบจาก API
        const materialsData = result.data.materials || result.data || [];
        const materialstoresData = result.data.materialstores || [];
        
        // จัดกลุ่มข้อมูลตาม yarnType และรวมค่าน้ำหนัก สำหรับ materials (นำเข้า)
        const groupedMaterials = materialsData
          .filter(item => {
            const yarnType = item.yarnType;
            return yarnType && 
                   typeof yarnType === 'string' &&
                   yarnType.trim() !== '' && 
                   yarnType !== 'null' &&
                   !yarnType.startsWith('{') && // กรอง JSON objects
                   !yarnType.includes('null'); // กรองข้อมูลที่มี null
          })
          .reduce((acc, item) => {
          const yarnType = item.yarnType || 'N/A';
          
          if (!acc[yarnType]) {
            acc[yarnType] = {
              yarnType: yarnType,
              totalSpool: 0,
              totalWeightPNet: 0,
              totalWeightKgNet: 0,
              count: 0
            };
          }
          
          acc[yarnType].totalSpool += parseInt(item.spool || 0);
          acc[yarnType].totalWeightPNet += parseFloat(item.weight_p_net || 0);
          acc[yarnType].totalWeightKgNet += parseFloat(item.weight_kg_net || 0);
          acc[yarnType].count += 1;
          
          return acc;
        }, {});

        // จัดกลุ่มข้อมูลตาม yarnType สำหรับ materialstores (นำออก)
        const groupedMaterialstores = materialstoresData
          .filter(item => {
            const yarnType = item.yarnType;
            return yarnType && 
                   typeof yarnType === 'string' &&
                   yarnType.trim() !== '' && 
                   yarnType !== 'null' &&
                   !yarnType.startsWith('{') && // กรอง JSON objects
                   !yarnType.includes('null'); // กรองข้อมูลที่มี null
          })
          .reduce((acc, item) => {
          const yarnType = item.yarnType || 'N/A';
          
          if (!acc[yarnType]) {
            acc[yarnType] = {
              yarnType: yarnType,
              totalSpool: 0,
              totalWeightPNet: 0,
              totalWeightKgNet: 0,
              count: 0
            };
          }
          
          acc[yarnType].totalSpool += parseInt(item.spool || 0);
          acc[yarnType].totalWeightPNet += parseFloat(item.weight_p_net || 0);
          acc[yarnType].totalWeightKgNet += parseFloat(item.weight_kg_net || 0);
          acc[yarnType].count += 1;
          
          return acc;
        }, {});

        // รวมข้อมูลจากทั้งสองตาราง (กรอง null และค่าว่าง)
        const allYarnTypes = new Set([
          ...Object.keys(groupedMaterials),
          ...Object.keys(groupedMaterialstores)
        ].filter(yarnType => 
          yarnType && 
          typeof yarnType === 'string' &&
          yarnType !== 'null' && 
          yarnType !== 'undefined' && 
          yarnType !== 'N/A' && 
          yarnType.trim() !== '' &&
          !yarnType.startsWith('{') && // กรอง JSON objects เช่น {"1":null}
          !yarnType.includes('null') // กรองข้อมูลที่มี null
        ));

        const combinedData = Array.from(allYarnTypes).map(yarnType => {
          const materialsInfo = groupedMaterials[yarnType] || {
            totalSpool: 0,
            totalWeightPNet: 0,
            totalWeightKgNet: 0
          };
          const materialstoresInfo = groupedMaterialstores[yarnType] || {
            totalSpool: 0,
            totalWeightPNet: 0,
            totalWeightKgNet: 0
          };

          return {
            yarnType: yarnType,
            // ข้อมูลนำเข้า (จาก materials)
            importTotalSpool: materialsInfo.totalSpool,
            importTotalWeightPNet: materialsInfo.totalWeightPNet,
            importTotalWeightKgNet: materialsInfo.totalWeightKgNet,
            // ข้อมูลนำออก (จาก materialstores)
            exportTotalSpool: materialstoresInfo.totalSpool,
            exportTotalWeightPNet: materialstoresInfo.totalWeightPNet,
            exportTotalWeightKgNet: materialstoresInfo.totalWeightKgNet,
            // ข้อมูลคงเหลือ
            remainingSpool: materialsInfo.totalSpool - materialstoresInfo.totalSpool,
            remainingWeightPNet: materialsInfo.totalWeightPNet - materialstoresInfo.totalWeightPNet,
            remainingWeightKgNet: materialsInfo.totalWeightKgNet - materialstoresInfo.totalWeightKgNet
          };
        }).sort((a, b) => a.yarnType.localeCompare(b.yarnType));
        
        // อัปเดต rawMaterialData เป็นข้อมูลที่จัดกลุ่มแล้ว
        setRawMaterialData(combinedData);
        setTotalRecords(combinedData.length);

      } else {
        throw new Error(result.message || 'ไม่สามารถดึงข้อมูลได้');
      }
    } catch (err) {
      console.error('Error fetching raw material data:', err);
      setError(err.message);
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
          <strong>แจ้งเตือน:</strong> {error}
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
                  ตรวจสอบวัตถุดิบ น้ำหนักสุทธิ
                </h5>
              </div>

              {/* Table Content */}
              <div className="table-responsive">
                <table className="table table-hover mb-2" style={{ tableLayout: 'fixed', width: '100%' }}>
                  <thead style={{ backgroundColor: '#e8f4f8' }}>
                    <tr>
                      <th rowSpan="2" className="text-center align-middle py-3 px-2" style={{ 
                        fontWeight: '600', 
                        color: '#495057',
                        borderTop: 'none',
                        fontSize: '0.9rem',
                        width: '15%',
                        borderRight: '1px solid #dee2e6'
                      }}>
                        ชนิดด้าย
                      </th>
                      <th rowSpan="2" className="text-center align-middle py-3 px-2" style={{ 
                        fontWeight: '600', 
                        color: '#495057',
                        borderTop: 'none',
                        fontSize: '0.9rem',
                        width: '12%',
                        borderRight: '1px solid #dee2e6'
                      }}>
                        จำนวน<br />ด้าย(ลูก)
                      </th>
                      <th colSpan="2" className="text-center py-2 px-2" style={{ 
                        fontWeight: '600', 
                        color: '#495057',
                        borderTop: 'none',
                        fontSize: '0.9rem',
                        borderBottom: '1px solid #dee2e6',
                        borderRight: '1px solid #dee2e6'
                      }}>
                        นำเข้า
                      </th>
                      <th colSpan="2" className="text-center py-2 px-2" style={{ 
                        fontWeight: '600', 
                        color: '#495057',
                        borderTop: 'none',
                        fontSize: '0.9rem',
                        borderBottom: '1px solid #dee2e6',
                        borderRight: '1px solid #dee2e6'
                      }}>
                        นำออก
                      </th>
                      <th colSpan="2" className="text-center py-2 px-2" style={{ 
                        fontWeight: '600', 
                        color: '#495057',
                        borderTop: 'none',
                        fontSize: '0.9rem',
                        borderBottom: '1px solid #dee2e6'
                      }}>
                        คงเหลือ
                      </th>
                    </tr>
                    <tr>
                      <th className="text-center py-2 px-1" style={{ 
                        fontWeight: '500', 
                        color: '#495057',
                        fontSize: '0.8rem',
                        width: '12%',
                        borderRight: '1px solid #dee2e6'
                      }}>
                        ปอนด์
                      </th>
                      <th className="text-center py-2 px-1" style={{ 
                        fontWeight: '500', 
                        color: '#495057',
                        fontSize: '0.8rem',
                        width: '12%',
                        borderRight: '1px solid #dee2e6'
                      }}>
                        กิโลกรัม
                      </th>
                      <th className="text-center py-2 px-1" style={{ 
                        fontWeight: '500', 
                        color: '#495057',
                        fontSize: '0.8rem',
                        width: '12%',
                        borderRight: '1px solid #dee2e6'
                      }}>
                        ปอนด์
                      </th>
                      <th className="text-center py-2 px-1" style={{ 
                        fontWeight: '500', 
                        color: '#495057',
                        fontSize: '0.8rem',
                        width: '12%',
                        borderRight: '1px solid #dee2e6'
                      }}>
                        กิโลกรัม
                      </th>
                      <th className="text-center py-2 px-1" style={{ 
                        fontWeight: '500', 
                        color: '#495057',
                        fontSize: '0.8rem',
                        width: '12%',
                        borderRight: '1px solid #dee2e6'
                      }}>
                        ปอนด์
                      </th>
                      <th className="text-center py-2 px-1" style={{ 
                        fontWeight: '500', 
                        color: '#495057',
                        fontSize: '0.8rem',
                        width: '12%'
                      }}>
                        กิโลกรัม
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="text-center py-5">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">กำลังโหลด...</span>
                          </div>
                          <p className="mt-2 text-muted">กำลังดึงข้อมูล...</p>
                        </td>
                      </tr>
                    ) : (
                      rawMaterialData.length > 0 ? (
                        rawMaterialData.map((item, index) => (
                          <tr key={item.yarnType || index}>
                            <td className="py-2 px-2" style={{ fontSize: '0.85rem', borderRight: '1px solid #dee2e6' }}>
                              {item.yarnType || 'N/A'}
                            </td>
                            {/* จำนวนลูก */}
                            <td className="text-center py-2 px-1" style={{ fontSize: '0.85rem', borderRight: '1px solid #dee2e6' }}>
                              <span className="fw-bold text-dark">{formatNumber(item.importTotalSpool || 0)}</span>
                            </td>
                            {/* นำเข้า */}
                            <td className="text-center py-2 px-1" style={{ fontSize: '0.85rem', borderRight: '1px solid #dee2e6' }}>
                              <span className="fw-bold text-success">{parseFloat(item.importTotalWeightPNet || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
                            </td>
                            <td className="text-center py-2 px-1" style={{ fontSize: '0.85rem', borderRight: '1px solid #dee2e6' }}>
                              <span className="fw-bold text-success">{parseFloat(item.importTotalWeightKgNet || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
                            </td>
                            {/* นำออก */}
                            <td className="text-center py-2 px-1" style={{ fontSize: '0.85rem', borderRight: '1px solid #dee2e6' }}>
                              <span className="fw-bold text-warning">{parseFloat(item.exportTotalWeightPNet || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
                            </td>
                            <td className="text-center py-2 px-1" style={{ fontSize: '0.85rem', borderRight: '1px solid #dee2e6' }}>
                              <span className="fw-bold text-warning">{parseFloat(item.exportTotalWeightKgNet || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
                            </td>
                            {/* คงเหลือ */}
                            <td className="text-center py-2 px-1" style={{ fontSize: '0.85rem', borderRight: '1px solid #dee2e6' }}>
                              <span className="fw-bold text-primary">{parseFloat(item.remainingWeightPNet || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
                            </td>
                            <td className="text-center py-2 px-1" style={{ fontSize: '0.85rem' }}>
                              <span className="fw-bold text-primary">{parseFloat(item.remainingWeightKgNet || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center py-5">
                            <div className="text-muted">
                              <i className="bi bi-inbox me-2"></i>
                              ไม่พบข้อมูลในระบบ
                            </div>
                          </td>
                        </tr>
                      )
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
                      แสดงข้อมูลทั้งหมด {totalRecords.toLocaleString('th-TH')} ชนิดด้าย (จัดกลุ่มแล้ว)
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
                      className="btn btn-primary btn-sm me-2" 
                      style={{ borderRadius: '8px' }}
                      onClick={exportToExcel}
                      disabled={loading || rawMaterialData.length === 0}
                    >
                      <i className="bi bi-download me-1"></i>
                      ส่งออกข้อมูล
                    </button>
                    <button 
                      className="btn btn-success btn-sm" 
                      style={{ borderRadius: '8px' }}
                      onClick={exportToExcelV2}
                      disabled={loading || rawMaterialData.length === 0}
                    >
                      <i className="bi bi-printer me-1"></i>
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
              <h6 className="text-muted mb-2">ชนิดด้ายทั้งหมด</h6>
              <h4 className="fw-bold text-primary mb-0">{totalRecords.toLocaleString('th-TH')}</h4>
              <small className="text-muted">ชนิดด้าย (จัดกลุ่มแล้ว)</small>
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
                  rawMaterialData.reduce((sum, item) => sum + (item.importTotalSpool || 0), 0)
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
                  rawMaterialData.reduce((sum, item) => sum + (item.exportTotalSpool || 0), 0)
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
                  rawMaterialData.reduce((sum, item) => sum + (item.remainingSpool || 0), 0)
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

export default RawMaterialInventoryInfo;
