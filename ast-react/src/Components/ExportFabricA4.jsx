// File: ExportFabricA4.jsx
import React, { useState, useMemo } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { API_BASE_URL } from "@/config/apiBase";

const ExportFabricA4 = () => {
  const [fabricouts, setFabricouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    month: "",
    year: "",
    vatType: "",
  });

  // ---------- Helpers ----------
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getMonthName = (month) => {
    const months = {
      "1": "มกราคม",
      "2": "กุมภาพันธ์",
      "3": "มีนาคม",
      "4": "เมษายน",
      "5": "พฤษภาคม",
      "6": "มิถุนายน",
      "7": "กรกฎาคม",
      "8": "สิงหาคม",
      "9": "กันยายน",
      "10": "ตุลาคม",
      "11": "พฤศจิกายน",
      "12": "ธันวาคม",
    };
    return months[String(month)] || month;
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // ---------- ดึง fabricouts ตาม filter ----------
  const fetchFabricouts = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ limit: "15000" });
      if (filters.month) params.append("month", filters.month);
      if (filters.year) params.append("year", filters.year);
      if (filters.vatType) params.append("vatType", filters.vatType);

      const url = `${API_BASE_URL}/api/fabricouts?${params.toString()}`;
      console.log("🌐 [A4] Request URL:", url);

      const res = await axios.get(url);
      let rows = [];
      if (Array.isArray(res.data?.data)) rows = res.data.data;
      else if (Array.isArray(res.data)) rows = res.data;
      else rows = [];

      rows.sort((a, b) => new Date(a.createDate) - new Date(b.createDate));
      setFabricouts(rows);
    } catch (err) {
      console.error("❌ [A4] Error fetching fabricouts:", err);
      setError("ไม่สามารถโหลดข้อมูลได้");
      setFabricouts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchFabricouts();
  };

  const handleClearFilters = () => {
    setFilters({
      month: "",
      year: "",
      vatType: "",
    });
    setFabricouts([]);
    setError(null);
  };

  // ---------- สรุปข้อมูลตามรหัสผ้า (ใช้ทั้ง preview + export) ----------
  const summaryRows = useMemo(() => {
    if (!fabricouts || fabricouts.length === 0) return [];

    const grouped = {};
    fabricouts.forEach((item) => {
      const fabricCode = item.fabricStruct || "ไม่ระบุ";
      if (!grouped[fabricCode]) {
        grouped[fabricCode] = 0;
      }
      grouped[fabricCode] += parseInt(item.sumYard) || 0;
    });

    const list = Object.entries(grouped)
      .map(([code, qty]) => ({
        fabricCode: code,
        totalYards: qty,
      }))
      .sort((a, b) => a.fabricCode.localeCompare(b.fabricCode));

    return list;
  }, [fabricouts]);

  const grandTotal = useMemo(
    () => summaryRows.reduce((sum, it) => sum + (it.totalYards || 0), 0),
    [summaryRows]
  );

  // ---------- Export A4 (ใช้ summaryRows เดียวกับที่แสดงบนหน้า) ----------
  const exportToExcelA4 = async () => {
    try {
      if (!summaryRows || summaryRows.length === 0) {
        alert("ไม่มีข้อมูลให้ส่งออก กรุณากดค้นหาก่อน");
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("สรุปรายงานสินค้า V2");

      worksheet.properties.defaultRowHeight = 18;

      worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.5,
          right: 0.5,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3,
        },
        scale: 100,
        horizontalCentered: true,
        verticalCentered: false,
      };

      worksheet.views = [
        {
          showGridLines: true,
          showRowColHeaders: false,
          zoomScale: 100,
        },
      ];

      // ----- หัวรายงาน -----
      worksheet.mergeCells("A1:C1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "บริษัท เอเซียเท็กซ์ไทล์ จำกัด";
      titleCell.font = { size: 14, bold: true };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells("A2:C2");
      const titleCell2 = worksheet.getCell("A2");
      titleCell2.value = "สรุปรายงานสินค้าและสำเร็จรูป";
      titleCell2.font = { size: 14, bold: true };
      titleCell2.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells("A3:C3");
      const dateCell = worksheet.getCell("A3");
      let periodText = "";

      if (filters.month && filters.year) {
        periodText = `ณ เดือน ${getMonthName(filters.month)} ${filters.year}`;
      } else if (filters.year) {
        periodText = `ณ ปี ${filters.year}`;
      } else {
        periodText = `ณ วันที่: ${formatDate(new Date().toISOString())}`;
      }

      dateCell.value = periodText;
      dateCell.font = { size: 12, bold: true };
      dateCell.alignment = { horizontal: "center" };

      // ----- หัวตาราง -----
      const headerRowStart = 5;
      const headerRow = worksheet.getRow(headerRowStart);
      headerRow.values = ["ลำดับที่", "รายการ", "จำนวน (หลา)"];

      ["A", "B", "C"].forEach((col) => {
        const cell = worksheet.getCell(`${col}${headerRowStart}`);
        cell.font = { bold: true, color: { argb: "FFFFFF" }, size: 10 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "1F4E79" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "medium" },
          left: { style: "medium" },
          bottom: { style: "medium" },
          right: { style: "medium" },
        };
      });

      // ----- เติมข้อมูลจาก summaryRows (เหมือนตารางหน้าเว็บ) -----
      summaryRows.forEach((item, index) => {
        const rowNum = headerRowStart + 1 + index;
        const row = worksheet.getRow(rowNum);

        row.values = [index + 1, item.fabricCode, item.totalYards];

        row.eachCell((cell, colNumber) => {
          cell.border = {
            top: { style: "thin", color: { argb: "B7B7B7" } },
            left: { style: "thin", color: { argb: "B7B7B7" } },
            bottom: { style: "thin", color: { argb: "B7B7B7" } },
            right: { style: "thin", color: { argb: "B7B7B7" } },
          };

          if (colNumber === 1) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.font = { bold: true, size: 9 };
          } else if (colNumber === 2) {
            cell.alignment = { horizontal: "left", vertical: "middle" };
            cell.font = { bold: true, size: 9 };
          } else {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.font = { size: 9 };
            cell.numFmt = "#,##0";
          }

          if (index % 2 === 0) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFFF" },
            };
          } else {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "F8F9FA" },
            };
          }
        });
      });

      // ----- รวมทั้งหมดด้านล่าง -----
      const totalRowIdx = headerRowStart + 1 + summaryRows.length;
      const totalRow = worksheet.getRow(totalRowIdx);
      totalRow.values = ["", "รวมทั้งหมด", grandTotal];

      totalRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true, size: 10 };
        cell.border = {
          top: { style: "medium" },
          left: { style: "medium" },
          bottom: { style: "medium" },
          right: { style: "medium" },
        };
        if (colNumber === 2) {
          cell.alignment = { horizontal: "right", vertical: "middle" };
        } else if (colNumber === 3) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.numFmt = "#,##0";
        }
      });

      worksheet.columns = [
        { width: 10 },
        { width: 40 },
        { width: 20 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = `สรุปรายงานสินค้า_A4_${filters.year || "ALL"}_${
        filters.month ? getMonthName(filters.month) : "ALL"
      }_${formatDate(new Date().toISOString()).replace(/\//g, "-")}.xlsx`;

      saveAs(blob, fileName);
      console.log("✅ Excel A4 summary exported successfully");
    } catch (err) {
      console.error("❌ Error exporting A4 summary:", err);
      alert("เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel A4");
    }
  };

  // ---------- JSX ----------
  return (
    <div className="">
      <div
        className="text-black p-4 bg-white mb-4"
        style={{ borderRadius: "15px", border: "2px solid #eee" }}
      >
        <h5 className="fw-bold">สรุปรายงานสินค้า (A4)</h5>
        <p className="text-muted pt-2">
          รวมจำนวนหลาตามรหัสผ้า (สิ่งที่แสดงด้านล่างนี้ จะถูกส่งออกไปเป็นไฟล์ A4)
        </p>

        {/* Filter bar */}
        <div className="d-flex align-items-center pb-2 flex-wrap">
          <div className="pt-2 me-3">
            <h6>เลือกประเภทบิล</h6>
            <select
              className="form-select"
              style={{
                borderRadius: "8px",
                border: "2px solid #eee",
                width: "auto",
              }}
              value={filters.vatType}
              onChange={(e) =>
                handleFilterChange("vatType", e.target.value)
              }
            >
              <option value="">ทั้งหมด</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>

          <div className="pt-2 me-3">
            <h6>เดือน</h6>
            <select
              className="form-select"
              style={{
                borderRadius: "8px",
                border: "2px solid #eee",
                width: "220px",
              }}
              value={filters.month}
              onChange={(e) => handleFilterChange("month", e.target.value)}
            >
              <option value="">ทั้งหมด</option>
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

          <div className="pt-2">
            <h6>ปี</h6>
            <select
              className="form-select"
              style={{
                borderRadius: "8px",
                border: "2px solid #eee",
                width: "auto",
              }}
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
            >
              <option value="">ทั้งหมด</option>
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-3 d-flex gap-2">
          <button
            className="btn"
            style={{
              backgroundColor: "rgb(14,30,139)",
              color: "#fff",
              width: "120px",
              height: "40px",
              borderRadius: "20px",
            }}
            onClick={handleSearch}
            disabled={loading}
          >
            {loading ? "กำลังค้นหา..." : "🔍 ค้นหา"}
          </button>

          <button
            className="btn btn-danger"
            style={{ width: "120px", height: "40px", borderRadius: "20px" }}
            onClick={handleClearFilters}
            disabled={loading}
          >
            ล้างตัวกรอง
          </button>

          <button
            className="btn btn-success"
            style={{ width: "180px", height: "40px", borderRadius: "20px" }}
            onClick={exportToExcelA4}
            disabled={loading || summaryRows.length === 0}
          >
            📋 ส่งออก A4 (สรุป)
          </button>
        </div>
      </div>

      {/* Preview summary (สิ่งนี้ = สิ่งที่จะออกไฟล์) */}
      <div
        className="bg-white p-3"
        style={{ borderRadius: "15px", border: "1px solid #eee" }}
      >
        <h6 className="fw-bold mb-2">ตัวอย่างข้อมูลที่จะส่งออก</h6>
        <p className="text-muted" style={{ fontSize: "0.9rem" }}>
          ตารางด้านล่างนี้คือข้อมูลสรุปตามรหัสผ้าที่จะถูกใช้สร้างไฟล์ Excel A4
        </p>

        <div className="table-responsive">
          <table className="table table-sm table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th className="text-center" style={{ width: "10%" }}>
                  ลำดับที่
                </th>
                <th className="text-center" style={{ width: "50%" }}>
                  รหัสผ้า
                </th>
                <th className="text-center" style={{ width: "20%" }}>
                  จำนวน (หลา)
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-3">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="3" className="text-center text-danger py-3">
                    {error}
                  </td>
                </tr>
              ) : summaryRows.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-3">
                    ยังไม่มีข้อมูล กรุณาเลือกเงื่อนไขและกดค้นหา
                  </td>
                </tr>
              ) : (
                <>
                  {summaryRows.map((row, idx) => (
                    <tr key={row.fabricCode}>
                      <td className="text-center">{idx + 1}</td>
                      <td>{row.fabricCode}</td>
                      <td className="text-end">
                        {Number(row.totalYards).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="table-secondary">
                    <td></td>
                    <td className="text-end fw-bold">รวมทั้งหมด</td>
                    <td className="text-end fw-bold">
                      {grandTotal.toLocaleString()}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExportFabricA4;
