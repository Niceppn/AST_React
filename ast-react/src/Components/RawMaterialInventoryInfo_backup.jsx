// src/components/RawMaterialInventoryInfo.jsx
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

const RawMaterialInventoryInfo = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawMaterialData, setRawMaterialData] = useState([]);
  const [totalRecords, setTotalRecords] = useState(0);
  
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



  // Format number with commas
  const formatNumber = (num) => {
    return num ? num.toLocaleString('th-TH') : '0';
  };

  const fetchPalletData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/raw-materials/stockMaterial`);
      
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
          .filter(item => item.yarnType && item.yarnType.trim() !== '' && item.yarnType !== 'null')
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
          .filter(item => item.yarnType && item.yarnType.trim() !== '' && item.yarnType !== 'null')
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
          yarnType !== 'null' && 
          yarnType !== 'undefined' && 
          yarnType !== 'N/A' && 
          yarnType.trim() !== ''
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
                            {/* นำเข้า */}
                            <td className="text-center py-2 px-1" style={{ fontSize: '0.85rem', borderRight: '1px solid #dee2e6' }}>
                              <span className="fw-bold text-dark">{formatNumber(item.importTotalSpool || 0)}</span>
                            </td>
                            <td className="text-center py-2 px-1" style={{ fontSize: '0.85rem', borderRight: '1px solid #dee2e6' }}>
                              <span className="fw-bold text-success">{formatNumber(parseFloat(item.importTotalWeightPNet || 0).toFixed(2))}</span>
                            </td>
                            <td className="text-center py-2 px-1" style={{ fontSize: '0.85rem', borderRight: '1px solid #dee2e6' }}>
                              <span className="fw-bold text-success">{formatNumber(parseFloat(item.importTotalWeightKgNet || 0).toFixed(2))}</span>
                            </td>
                            {/* นำออก */}
                            <td className="text-center py-2 px-1" style={{ fontSize: '0.85rem', borderRight: '1px solid #dee2e6' }}>
                              <span className="fw-bold text-warning">{formatNumber(parseFloat(item.exportTotalWeightPNet || 0).toFixed(2))}</span>
                            </td>
                            <td className="text-center py-2 px-1" style={{ fontSize: '0.85rem', borderRight: '1px solid #dee2e6' }}>
                              <span className="fw-bold text-warning">{formatNumber(parseFloat(item.exportTotalWeightKgNet || 0).toFixed(2))}</span>
                            </td>
                            {/* คงเหลือ */}
                            <td className="text-center py-2 px-1" style={{ fontSize: '0.85rem', borderRight: '1px solid #dee2e6' }}>
                              <span className="fw-bold text-primary">{formatNumber(parseFloat(item.remainingWeightPNet || 0).toFixed(2))}</span>
                            </td>
                            <td className="text-center py-2 px-1" style={{ fontSize: '0.85rem' }}>
                              <span className="fw-bold text-primary">{formatNumber(parseFloat(item.remainingWeightKgNet || 0).toFixed(2))}</span>
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
                    </small>
                  </div>
                  <div className="col-md-6 text-end">
                    <button 
                      className="btn btn-outline-primary btn-sm me-2" 
                      style={{ borderRadius: '8px' }}
                      onClick={fetchPalletData}
                      disabled={loading}
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      รีเฟรช
                    </button>
                    <button className="btn btn-primary btn-sm" style={{ borderRadius: '8px' }}>
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
                  (returnPalletSteel - historyPalletSteel) + 
                  (returnPalletWood - historyPalletWood) + 
                  (returnSpoolPaper - historySpoolPaper) + 
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

export default RawMaterialInventoryInfo;
