
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Components/Dashboard';
import Users from './Components/Users';
import ExportFabric from './Components/ExportFabric';
import Orders from './Components/Orders';
import Stock from './Components/Stock';
import RawMaterialInventory from './Components/RawMaterialInventory';
import RawMaterialInventoryInfo from './Components/RawMaterialInventoryInfo';
import AdminRoute from './Components/AdminRoute';
import RawMaterialInventoryInfo2 from './Components/RawMaterialInventoryInfo2';

const MyRoute = () => {
  return (
    <Routes>
      {/* หน้าที่ทุกคนเข้าได้ */}
      <Route path="/" element={<Dashboard />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/stock" element={<Stock />} />
      <Route path="/export-fabric" element={<ExportFabric />} />
      
      {/* หน้าที่เฉพาะ Admin เท่านั้น */}
      <Route path="/users" element={
        <AdminRoute allowedRoles={['admin', 'superadmin']}>
          <Users />
        </AdminRoute>
      } />
      
      <Route path="/settings" element={
        <AdminRoute allowedRoles={['admin', 'superadmin']}>
          <div className="text-center py-5">
            <i className="bi bi-gear fs-1 text-muted"></i>
            <h3 className="mt-3">ตั้งค่า</h3>
            <p className="text-muted">กำลังพัฒนา...</p>
          </div>
        </AdminRoute>
      } />
      
      {/* หน้าที่ Admin และ Material Staff เข้าได้ */}
      <Route path="/stockcustomer" element={
        <AdminRoute allowedRoles={['admin', 'materialstaff', 'supermaterialstaff', 'superadmin']}>
          <div className="text-center py-5">
            <i className="bi bi-archive fs-1 text-muted"></i>
            <h3 className="mt-3">สต๊อกผ้าฝากจัดเก็บ</h3>
            <p className="text-muted">กำลังพัฒนา...</p>
          </div>
        </AdminRoute>
      } />
      
      <Route path="/stockmaterial" element={
        <AdminRoute allowedRoles={['admin', 'materialstaff', 'supermaterialstaff', 'superadmin']}>
          <div className="text-center py-5">
            <i className="bi bi-layers fs-1 text-muted"></i>
            <h3 className="mt-3">สต๊อกวัตถุดิบ</h3>
            <p className="text-muted">กำลังพัฒนา...</p>
          </div>
        </AdminRoute>
      } />
      
      {/* Raw Material Inventory - New Route */}
      <Route path="/rawmaterialinventory" element={
        <AdminRoute allowedRoles={['admin', 'materialstaff', 'supermaterialstaff', 'superadmin']}>
          <RawMaterialInventory />
        </AdminRoute>
      } />
      
      {/* Raw Material Inventory Info - Detail Page */}
      <Route path="/rawmaterialinventory/info" element={
        <AdminRoute allowedRoles={['admin', 'materialstaff', 'supermaterialstaff', 'superadmin']}>
          <RawMaterialInventoryInfo />
        </AdminRoute>
      } />
      <Route path="/rawmaterialinventory/info2" element={
        <AdminRoute allowedRoles={['admin', 'materialstaff', 'supermaterialstaff', 'superadmin']}>
          <RawMaterialInventoryInfo2 />
        </AdminRoute>
      } />
    </Routes>
  );
};

export default MyRoute;
