// src/components/RawMaterialInventory.jsx
import { API_BASE_URL } from "@/config/apiBase";

import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useNavigate } from 'react-router-dom';

const RawMaterialInventory = () => {
  const navigate = useNavigate();
  const [rawMaterialData, setRawMaterialData] = useState({
    thread: 0,
    pound: 0,
    kilogram: 0
  });

  const [inventoryData, setInventoryData] = useState({
    import: 0,
    export: 0,
    remaining: 0
  });

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [apiStatus, setApiStatus] = useState('loading'); // 'loading', 'success', 'error'

  // Fetch raw material data from API
  const fetchRawMaterialData = async () => {
    setLoading(true);
    setApiStatus('loading');
    try {
      console.log('🔄 กำลังดึงข้อมูลจาก API...');
      
      // ใช้ API เดียวกับ Info2 สำหรับข้อมูลบรรจุภัณฑ์
      const [materialsResponse, packagesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/raw-materials/stockMaterial`),
        fetch(`${API_BASE_URL}/api/raw-materials`)
      ]);
      
      if (!materialsResponse.ok || !packagesResponse.ok) {
        throw new Error(`HTTP Error: ${materialsResponse.status}/${packagesResponse.status}`);
      }
      
      const materialsResult = await materialsResponse.json();
      const packagesResult = await packagesResponse.json();
      
      console.log('📊 Materials Data:', materialsResult);
      console.log('📦 Packages Data:', packagesResult);
      
      if (materialsResult.success) {
        // คำนวณข้อมูลวัตถุดิบ (ลูก, ปอนด์, กิโลกรัม)
        const materialsData = materialsResult.data.materials || [];
        
        const filteredMaterials = materialsData.filter(item => {
          const yarnType = item.yarnType;
          return yarnType && 
                 typeof yarnType === 'string' &&
                 yarnType.trim() !== '' && 
                 yarnType !== 'null' &&
                 !yarnType.startsWith('{') &&
                 !yarnType.includes('null');
        });

        const materialsSpoolSum = filteredMaterials.reduce(
          (sum, item) => sum + Number(item.spool || 0), 0
        );
        const weightPNetSum = filteredMaterials.reduce(
          (sum, item) => sum + Number(item.weight_p_net || 0), 0
        );
        const weightKgNetSum = filteredMaterials.reduce(
          (sum, item) => sum + Number(item.weight_kg_net || 0), 0
        );

        setRawMaterialData({
          thread: materialsSpoolSum,
          pound: Math.round(weightPNetSum),
          kilogram: Math.round(weightKgNetSum)
        });

        console.log('🧮 คำนวณวัตถุดิบ:', {
          spool: materialsSpoolSum,
          pound: weightPNetSum,
          kilogram: weightKgNetSum
        });
      }

      if (packagesResult.success) {
        // คำนวณข้อมูลนำเข้า/ส่งออก แบบเดียวกับ Info2
        const allData = [
          ...(packagesResult.data.packageasts || []),
          ...(packagesResult.data.htrpackages || [])
        ];

        console.log('📦 All Package Data:', allData.length, 'รายการ');

        const importData = allData.filter(item => item.package_status === 'packageImport');
        const returnData = allData.filter(item => item.package_status === 'packageReturn');

        console.log('📥 Import Data:', importData.length, 'รายการ');
        console.log('📤 Return Data:', returnData.length, 'รายการ');

        // คำนวณผลรวมแต่ละประเภท
        const calculateSum = (data, conditions) => {
          return data.reduce((sum, item) => {
            let value = 0;
            conditions.forEach(condition => {
              if (condition.check(item)) {
                value += parseInt(item[condition.field] || 0) || 0;
              }
            });
            return sum + value;
          }, 0);
        };

        // กำหนดเงื่อนไขสำหรับแต่ละประเภท
        const importConditions = [
          { check: (item) => item.pallet_type === 'steel', field: 'pallet' },
          { check: (item) => item.pallet_type === 'wood', field: 'pallet' },
          { check: (item) => item.spool_type === 'spool_paper', field: 'spool' },
          { check: (item) => item.spool_type === 'spool_plastic', field: 'spool' },
          { check: (item) => item.spool_type === 'spoolC_paper', field: 'spool' },
          { check: (item) => item.spool_type === 'spoolC_plastic', field: 'spool' },
          { check: (item) => item.partition, field: 'partition' },
          { check: (item) => item.sack, field: 'sack' },
          { check: (item) => item.box, field: 'box' }
        ];

        const returnConditions = [
          { check: (item) => item.pallet_type === 'steel', field: 'pallet' },
          { check: (item) => item.pallet_type === 'wood', field: 'pallet' },
          { check: (item) => item.spool_type === 'spool_paper', field: 'spool' },
          { check: (item) => item.spool_type === 'spool_plastic', field: 'spool' },
          { check: (item) => item.spool_type === 'spoolC_paper', field: 'spool' },
          { check: (item) => item.spool_type === 'spoolC_plastic', field: 'spool' },
          { check: (item) => item.partition, field: 'partition' },
          { check: (item) => item.sack, field: 'sack' },
          { check: (item) => item.box, field: 'box' }
        ];

        // คำนวณแยกแต่ละประเภทแบบเดียวกับ Info2
        const importPalletSteel = calculateSum(importData.filter(item => item.pallet_type === 'steel'), [{ check: () => true, field: 'pallet' }]);
        const importPalletWood = calculateSum(importData.filter(item => item.pallet_type === 'wood'), [{ check: () => true, field: 'pallet' }]);
        const importSpoolPaper = calculateSum(importData.filter(item => item.spool_type === 'spool_paper'), [{ check: () => true, field: 'spool' }]);
        const importSpoolPlastic = calculateSum(importData.filter(item => item.spool_type === 'spool_plastic'), [{ check: () => true, field: 'spool' }]);
        const importCylinderPaper = calculateSum(importData.filter(item => item.spool_type === 'spoolC_paper'), [{ check: () => true, field: 'spool' }]);
        const importCylinderPlastic = calculateSum(importData.filter(item => item.spool_type === 'spoolC_plastic'), [{ check: () => true, field: 'spool' }]);
        const importPartition = calculateSum(importData.filter(item => item.partition), [{ check: () => true, field: 'partition' }]);
        const importSack = calculateSum(importData.filter(item => item.sack), [{ check: () => true, field: 'sack' }]);
        const importBox = calculateSum(importData.filter(item => item.box), [{ check: () => true, field: 'box' }]);
  const returnedDataSpool = allData
    .filter(item => item.spool_paper && item.spool_paper !== null && item.spool_paper !== '')
    .reduce((sum, item) => sum + (parseInt(item.spool_paper) || 0), 0);
  const returnedDataSteel = allData
    .filter(item => item.pallet_steel && item.pallet_steel !== null && item.pallet_steel !== '')
    .reduce((sum, item) => sum + (parseInt(item.pallet_steel) || 0), 0);


        const returnPalletSteel = calculateSum(returnData.filter(item => item.pallet_type === 'steel'), [{ check: () => true, field: 'pallet' }]);
        const returnPalletWood = calculateSum(returnData.filter(item => item.pallet_type === 'wood'), [{ check: () => true, field: 'pallet' }]);
        const returnSpoolPaper = calculateSum(returnData.filter(item => item.spool_type === 'spool_paper'), [{ check: () => true, field: 'spool' }]);
        const returnSpoolPlastic = calculateSum(returnData.filter(item => item.spool_type === 'spool_plastic'), [{ check: () => true, field: 'spool' }]);
        const returnCylinderPaper = calculateSum(returnData.filter(item => item.spool_type === 'spoolC_paper'), [{ check: () => true, field: 'spool' }]);
        const returnCylinderPlastic = calculateSum(returnData.filter(item => item.spool_type === 'spoolC_plastic'), [{ check: () => true, field: 'spool' }]);
        const returnPartition = calculateSum(returnData.filter(item => item.partition), [{ check: () => true, field: 'partition' }]);
        const returnSack = calculateSum(returnData.filter(item => item.sack), [{ check: () => true, field: 'sack' }]);
        const returnBox = calculateSum(returnData.filter(item => item.box), [{ check: () => true, field: 'box' }]);
  const returnedDataWood = allData
    .filter(item => item.pallet_wood && item.pallet_wood !== null && item.pallet_wood !== '')
    .reduce((sum, item) => sum + (parseInt(item.pallet_wood) || 0), 0);

        const historyPalletSteel = calculateSum(allData.filter(item => item.pallet_steel), [{ check: () => true, field: 'pallet_steel' }]);
        const historyPalletWood = calculateSum(allData.filter(item => item.pallet_wood), [{ check: () => true, field: 'pallet_wood' }]);
        const historySpoolPaper = calculateSum(allData.filter(item => item.spool_paper), [{ check: () => true, field: 'spool_paper' }]);
        const historySpoolPlastic = calculateSum(allData.filter(item => item.spool_plastic), [{ check: () => true, field: 'spool_plastic' }]);
        const historyCylinderPaper = calculateSum(allData.filter(item => item.spoolC_paper), [{ check: () => true, field: 'spoolC_paper' }]);
        const historyCylinderPlastic = calculateSum(allData.filter(item => item.spoolC_plastic), [{ check: () => true, field: 'spoolC_plastic' }]);
        
const historyPartition = calculateSum(
    packagesResult.data.htrpackages?.filter(item => item.partition) || [], 
    [{ check: () => true, field: 'partition' }]
);      
const historySack = calculateSum(
    packagesResult.data.htrpackages?.filter(item => item.sack && item.sack !== null && item.sack !== '') || [], 
    [{ check: () => true, field: 'sack' }]
);        

const historyBox = calculateSum(
    packagesResult.data.htrpackages?.filter(item => item.box && item.box !== null && item.box !== '') || [], 
    [{ check: () => true, field: 'box' }]
);
        const totalImport = importPalletSteel + importPalletWood + importSpoolPaper + importSpoolPlastic + importCylinderPaper + importCylinderPlastic + importPartition + importSack + importBox;
        const totalReturn = returnPalletSteel + returnPalletWood + returnSpoolPaper + returnSpoolPlastic + returnCylinderPaper + returnCylinderPlastic + returnPartition + returnSack + returnBox;
        
        // Log ค่าแต่ละตัวแปรสำหรับการคำนวณ totalRemaining
        console.log('🔍 การคำนวณคงเหลือ:');
        console.log('พาเลทเหล็ก:', { return: returnPalletSteel, returned: returnedDataSteel, remaining: returnPalletSteel - returnedDataSteel });
        console.log('พาเลทไม้:', { return: returnPalletWood, returned: returnedDataWood, remaining: returnPalletWood - returnedDataWood });
        console.log('กรวยกระดาษ:', { return: returnSpoolPaper, returned: returnedDataSpool, remaining: returnSpoolPaper - returnedDataSpool });
        console.log('กรวยพลาสติก:', { return: returnSpoolPlastic, history: historySpoolPlastic, remaining: returnSpoolPlastic - historySpoolPlastic });
        console.log('กระบอกกระดาษ:', { return: returnCylinderPaper, history: historyCylinderPaper, remaining: returnCylinderPaper - historyCylinderPaper });
        console.log('กระบอกพลาสติก:', { return: returnCylinderPlastic, history: historyCylinderPlastic, remaining: returnCylinderPlastic - historyCylinderPlastic });
        console.log('กระดาษกั้น:', { return: returnPartition, history: historyPartition, remaining: returnPartition - historyPartition });
        console.log('กระสอบ:', { return: returnSack, history: historySack, remaining: returnSack - historySack });
        console.log('กล่อง:', { return: returnBox, history: historyBox, remaining: returnBox - historyBox });
        
        // คำนวณคงเหลือแบบเดียวกับ Info2: ใช้ตัวแปรที่ถูกต้อง
        const totalRemaining = (returnPalletSteel - returnedDataSteel ) + 
                  (returnPalletWood - returnedDataWood) + 
                  (returnSpoolPaper - returnedDataSpool) + 
                  (returnSpoolPlastic - historySpoolPlastic) + 
                  (returnCylinderPaper - historyCylinderPaper) + 
                  (returnCylinderPlastic - historyCylinderPlastic) + 
                  (returnPartition - historyPartition) + 
                  (returnSack - historySack) + 
                  (returnBox - historyBox);

        console.log('📊 ผลรวมคงเหลือ:', totalRemaining);

        setInventoryData({
          import: totalImport,
          export: totalReturn, 
          remaining: Math.max(0, totalRemaining)
        });

        console.log('📈 คำนวณคลังสินค้า:', {
          import: totalImport,
          export: totalReturn,
          remaining: totalRemaining
        });
      }

      setApiStatus('success');
      setLastUpdated(new Date());
      console.log('✅ อัปเดตข้อมูลสำเร็จ!');
        
    } catch (error) {
      console.error('❌ Errปor fetching raw material data:', error);
      setApiStatus('error');
      
      // ใช้ข้อมูลตัวอย่างหาก API ไม่ทำงาน
      setRawMaterialData({
        thread: 335667,
        pound: 166608768,
        kilogram: 75576486
      });
      setInventoryData({
        import: 850000,
        export: 250000,
        remaining: 600000
      });
      console.log('🔄 ใช้ข้อมูลตัวอย่างแทน');
    } finally {
      setLoading(false);
    }
  };

  // เรียกใช้เมื่อ component โหลด
  useEffect(() => {
    fetchRawMaterialData();
  }, []);

  // Format number with commas
  const formatNumber = (num) => {
    return num.toLocaleString('th-TH');
  };

  // Format last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return 'ยังไม่ได้อัปเดต';
    return lastUpdated.toLocaleString('th-TH');
  };

  // Get status badge
  const getStatusBadge = () => {
    switch (apiStatus) {
      case 'loading':
        return <span className="badge bg-warning"><i className="bi bi-hourglass-split me-1"></i>กำลังโหลด</span>;
      case 'success':
        return <span className="badge bg-success"><i className="bi bi-check-circle me-1"></i>เชื่อมต่อสำเร็จ</span>;
      case 'error':
        return <span className="badge bg-danger"><i className="bi bi-x-circle me-1"></i>ใช้ข้อมูลตัวอย่าง</span>;
      default:
        return null;
    }
  };

  // Fetch more details for raw materials
  const handleRawMaterialDetails = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      console.log('Fetching raw material details...');
      setLoading(false);
    }, 1000);
  };

  // Fetch more details for packaging
  const handleInventoryDetails = () => {
    setLoading(true);
    setTimeout(() => {
      navigate('/rawmaterialinventory/info2');
      setLoading(false);
    }, 500);
  };

  const handlePackagingDetails = () => {
    setLoading(true);
    setTimeout(() => {
      navigate('/rawmaterialinventory/info');
      setLoading(false);
    }, 500);
  };

  return (
    <div className="container-fluid p-4" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold text-dark mb-0">
                <i className="bi bi-layers me-3 text-primary"></i>
                สต็อกวัตถุดิบ
              </h2>
             
              
            </div>
          </div>
        </div>
      </div>

      {/* Raw Material Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold text-dark mb-4">
                <i className="bi bi-box-seam me-2 text-info"></i>
                ตรวจสอบวัตถุดิบ จำนวนผ้า(ลูก, ปอนด์, กิโลกรัม)
              </h5>

              <div className="d-flex justify-content-between text-center mb-4" style={{ gap: '20px' }}>
                <div className="flex-fill position-relative" style={{ maxWidth: '300px', backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '20px' }}>
                  {loading && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  )}
                  <h2 className="fw-bold text-primary mb-2" style={{ fontSize: '2.5rem', opacity: loading ? 0.3 : 1 }}>
                    {formatNumber(rawMaterialData.thread)}
                  </h2>
                  <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>ลูก</p>
                  <small className="text-info">จำนวนผ้าทั้งหมด</small>
                </div>
                
                <div className="flex-fill position-relative" style={{ maxWidth: '300px', backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '20px' }}>
                  {loading && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  )}
                  <h2 className="fw-bold text-primary mb-2" style={{ fontSize: '2.5rem', opacity: loading ? 0.3 : 1 }}>
                    {formatNumber(rawMaterialData.pound)}
                  </h2>
                  <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>ปอนด์</p>
                  <small className="text-warning">น้ำหนักรวม(ปอนด์)</small>
                </div>
                
                <div className="flex-fill position-relative" style={{ maxWidth: '300px', backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '20px' }}>
                  {loading && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  )}
                  <h2 className="fw-bold text-primary mb-2" style={{ fontSize: '2.5rem', opacity: loading ? 0.3 : 1 }}>
                    {formatNumber(rawMaterialData.kilogram)}
                  </h2>
                  <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>กิโลกรัม</p>
                  <small className="text-success">น้ำหนักรวม(กิโลกรัม)</small>
                </div>
              </div>

              <div className="text-center">
                <button 
                  className="btn btn-primary px-4 py-2"
                  onClick={handlePackagingDetails}
                  disabled={loading}
                  style={{ borderRadius: '25px', fontWeight: '500' }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      กำลังโหลด...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-eye me-2"></i>
                      ดูรายละเอียด
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Tracking Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
            <div className="card-body p-4">
              <h5 className="card-title fw-bold text-dark mb-4">
                <i className="bi bi-clipboard-data me-2 text-success"></i>
                การติดตามสต็อก (นำเข้า, ส่งออก, คงเหลือ)
              </h5>
              
              <div className="row text-center mb-4">
                <div className="col-md-4 mb-3">
                  <div className="p-3 position-relative" style={{ backgroundColor: '#e8f5e8', borderRadius: '12px' }}>
                    {loading && (
                      <div className="position-absolute top-50 start-50 translate-middle">
                        <div className="spinner-border text-success" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    )}
                    <h2 className="fw-bold text-success mb-2" style={{ fontSize: '2.5rem', opacity: loading ? 0.3 : 1 }}>
                      {formatNumber(inventoryData.import)}
                    </h2>
                    <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>นำเข้า</p>
                    <small className="text-success">
                      <i className="bi bi-arrow-down-circle me-1"></i>
                      สินค้าเข้าคลัง
                    </small>
                  </div>
                </div>
                
                <div className="col-md-4 mb-3">
                  <div className="p-3 position-relative" style={{ backgroundColor: '#ffe8e8', borderRadius: '12px' }}>
                    {loading && (
                      <div className="position-absolute top-50 start-50 translate-middle">
                        <div className="spinner-border text-danger" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    )}
                    <h2 className="fw-bold text-danger mb-2" style={{ fontSize: '2.5rem', opacity: loading ? 0.3 : 1 }}>
                      {formatNumber(inventoryData.export)}
                    </h2>
                    <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>ส่งออก</p>
                    <small className="text-danger">
                      <i className="bi bi-arrow-up-circle me-1"></i>
                      สินค้าออกจากคลัง
                    </small>
                  </div>
                </div>
                
                <div className="col-md-4 mb-3">
                  <div className="p-3 position-relative" style={{ backgroundColor: '#e8f0ff', borderRadius: '12px' }}>
                    {loading && (
                      <div className="position-absolute top-50 start-50 translate-middle">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    )}
                    <h2 className="fw-bold text-primary mb-2" style={{ fontSize: '2.5rem', opacity: loading ? 0.3 : 1 }}>
                      {formatNumber(inventoryData.remaining)}
                    </h2>
                    <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>คงเหลือ</p>
                    <small className="text-primary">
                      <i className="bi bi-check-circle me-1"></i>
                      สินค้าคงคลัง
                    </small>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button 
                  className="btn btn-primary px-4 py-2"
                  onClick={handleInventoryDetails}
                  disabled={loading}
                  style={{ borderRadius: '25px', fontWeight: '500' }}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      กำลังโหลด...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-eye me-2"></i>
                      ดูรายละเอียด
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

   
    </div>
  );
};

export default RawMaterialInventory;
