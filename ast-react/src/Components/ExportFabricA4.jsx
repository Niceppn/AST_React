// File: ExportFabricA4.jsx
import React, { useState, useMemo } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { API_BASE_URL } from "@/config/apiBase";

const ExportFabricA4 = () => {
  const [fabricouts, setFabricouts] = useState([]);     // 🔴 ส่งออก
  const [stockfabrics, setStockfabrics] = useState([]); // 🟢 รับเข้า
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // เพิ่ม day สำหรับเลือก "ณ วันที่"
  const [filters, setFilters] = useState({
    day: "",
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

  const buildAsOfDate = () => {
    const { day, month, year } = filters;
    const d = Number(day);
    const m = Number(month);
    const y = Number(year);
    if (!d || !m || !y) return null;
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return null;
    return date;
  };

  // ---------- ดึง fabricouts (ส่งออก) ตาม filter ----------
  const fetchFabricouts = async () => {
    const { month, year, vatType } = filters;

    const params = new URLSearchParams({ limit: "15000" });
    if (month) params.append("month", month);
    if (year) params.append("year", year);
    if (vatType) params.append("vatType", vatType);

    const url = `${API_BASE_URL}/api/fabricouts?${params.toString()}`;
    console.log("🌐 [A4] fabricouts URL:", url);

    const res = await axios.get(url);
    let rows = [];
    if (Array.isArray(res.data?.data)) rows = res.data.data;
    else if (Array.isArray(res.data)) rows = res.data;
    else rows = [];

    rows.sort((a, b) => new Date(a.createDate) - new Date(b.createDate));
    setFabricouts(rows);
  };

  // ---------- ดึง stockfabrics (รับเข้า) ----------
  const fetchStockfabrics = async () => {
    try {
      const { year } = filters;
      const params = new URLSearchParams({ limit: "50000" });
      if (year) params.append("year", year); // ถ้ามีปี ส่งไปช่วยจำกัดข้อมูล

      const url = `${API_BASE_URL}/api/stockfabrics?${params.toString()}`;
      console.log("🌐 [A4] stockfabrics URL:", url);

      const res = await axios.get(url);
      let rows = [];
      if (Array.isArray(res.data?.data)) rows = res.data.data;
      else if (Array.isArray(res.data)) rows = res.data;
      else rows = [];

      rows.sort((a, b) => new Date(a.createDate) - new Date(b.createDate));
      setStockfabrics(rows);
    } catch (err) {
      console.error("❌ [A4] Error fetching stockfabrics:", err);
      setStockfabrics([]);
    }
  };

  const handleSearch = async () => {
    const asOfDate = buildAsOfDate();
    if (!asOfDate) {
      alert("กรุณาเลือก วันที่ / เดือน / ปี ให้ครบก่อน");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await fetchFabricouts();
      await fetchStockfabrics();
    } catch (err) {
      console.error("❌ [A4] handleSearch error:", err);
      setError("ไม่สามารถโหลดข้อมูลได้");
      setFabricouts([]);
      setStockfabrics([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      day: "",
      month: "",
      year: "",
      vatType: "",
    });
    setFabricouts([]);
    setStockfabrics([]);
    setError(null);
  };

  // ---------- สรุปข้อมูล ณ วันที่เลือก ----------
  // stockfabrics = รับเข้า, fabricouts = ส่งออก
  const summaryRows = useMemo(() => {
    const asOfDate = buildAsOfDate();
    if (!asOfDate) return [];

    const groups = new Map();

    const ensureGroup = (code) => {
      if (!groups.has(code)) {
        groups.set(code, {
          fabricCode: code,
          totalIn: 0,   // รับเข้า (จาก stockfabrics)
          totalOut: 0,  // ส่งออก (จาก fabricouts)
          balance: 0,
        });
      }
      return groups.get(code);
    };

    // 🟢 รวม "รับเข้า" จาก stockfabrics <= as-of
    stockfabrics.forEach((s) => {
      const d = new Date(s.createDate);
      if (isNaN(d.getTime()) || d > asOfDate) return;

      const code = s.fabricStruct || s.fabricId || s.refId || "ไม่ระบุ";
      const qty = parseInt(s.sumYard) || 0;
      const g = ensureGroup(code);
      g.totalIn += qty;
    });

    // 🔴 รวม "ส่งออก" จาก fabricouts <= as-of
    fabricouts.forEach((item) => {
      const d = new Date(item.createDate);
      if (isNaN(d.getTime()) || d > asOfDate) return;

      // filter vatType อีกชั้น เผื่อ backend ยังไม่ได้กรอง
      if (filters.vatType && item.vatType !== filters.vatType) return;

      const code = item.fabricStruct || "ไม่ระบุ";
      const qty = parseInt(item.sumYard) || 0;
      const g = ensureGroup(code);
      g.totalOut += qty;
    });

    // คำนวณคงเหลือ = รับเข้า - ส่งออก
    const list = Array.from(groups.values())
      .map((g) => ({
        ...g,
        balance: g.totalIn - g.totalOut,
      }))
      .filter(
        (row) =>
          row.totalIn !== 0 || row.totalOut !== 0 || row.balance !== 0
      )
      .sort((a, b) => a.fabricCode.localeCompare(b.fabricCode));

    return list;
  }, [fabricouts, stockfabrics, filters]);

  // รวมยอดทั้งหมด footer
  const totals = useMemo(
    () =>
      summaryRows.reduce(
        (acc, r) => ({
          in: acc.in + (r.totalIn || 0),
          out: acc.out + (r.totalOut || 0),
          balance: acc.balance + (r.balance || 0),
        }),
        { in: 0, out: 0, balance: 0 }
      ),
    [summaryRows]
  );

  // ---------- Export A4 (ใช้ summaryRows เดียวกับที่แสดงบนหน้า) ----------
  const exportToExcelA4 = async () => {
    try {
      if (!summaryRows || summaryRows.length === 0) {
        alert("ไม่มีข้อมูลให้ส่งออก กรุณาเลือกวันที่และกดค้นหาก่อน");
        return;
      }

      const asOfDate = buildAsOfDate();
      const hasDate = !!asOfDate;

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
      worksheet.mergeCells("A1:E1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = "บริษัท เอเซียเท็กซ์ไทล์ จำกัด";
      titleCell.font = { size: 14, bold: true };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells("A2:E2");
      const titleCell2 = worksheet.getCell("A2");
      titleCell2.value = "สรุปรายงานสินค้าและสำเร็จรูป";
      titleCell2.font = { size: 14, bold: true };
      titleCell2.alignment = { horizontal: "center", vertical: "middle" };

      worksheet.mergeCells("A3:E3");
      const dateCell = worksheet.getCell("A3");
      let periodText = "";

      if (hasDate) {
        const d = asOfDate;
        periodText = `ณ วันที่ ${String(d.getDate()).padStart(
          2,
          "0"
        )}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
      } else {
        periodText = `ณ วันที่: ${formatDate(new Date().toISOString())}`;
      }

      dateCell.value = periodText;
      dateCell.font = { size: 12, bold: true };
      dateCell.alignment = { horizontal: "center" };

      // ----- หัวตาราง -----
      const headerRowStart = 5;
      const headerRow = worksheet.getRow(headerRowStart);
      headerRow.values = [
        "ลำดับที่",
        "รายการ",
        "รับเข้า (หลา)",
        "ส่งออก (หลา)",
        "คงเหลือ (หลา)",
      ];

      ["A", "B", "C", "D", "E"].forEach((col) => {
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

      // ----- เติมข้อมูลจาก summaryRows -----
      summaryRows.forEach((item, index) => {
        const rowNum = headerRowStart + 1 + index;
        const row = worksheet.getRow(rowNum);

        row.values = [
          index + 1,
          item.fabricCode,
          item.totalIn,
          item.totalOut,
          item.balance,
        ];

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
      totalRow.values = [
        "",
        "รวมทั้งหมด",
        totals.in,
        totals.out,
        totals.balance,
      ];

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
        } else if ([3, 4, 5].includes(colNumber)) {
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.numFmt = "#,##0";
        }
      });

      worksheet.columns = [
        { width: 10 },
        { width: 40 },
        { width: 16 },
        { width: 16 },
        { width: 16 },
      ];

      // ตั้งชื่อไฟล์
      let asOfLabel = "ALL";
      const asOf = buildAsOfDate();
      if (asOf) {
        asOfLabel = `${asOf.getFullYear()}-${String(
          asOf.getMonth() + 1
        ).padStart(2, "0")}-${String(asOf.getDate()).padStart(2, "0")}`;
      }

      const fileName = `สรุปรายงานสินค้า_A4_ณวันที่_${asOfLabel}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, fileName);
      console.log("✅ Excel A4 summary exported successfully");
    } catch (err) {
      console.error("❌ Error exporting A4 summary:", err);
      alert("เกิดข้อผิดพลาดในการส่งออกไฟล์ Excel A4");
    }
  };

  const asOfDateForView = buildAsOfDate();

  // ---------- JSX ----------
  return (
    <div className="">
      <div
        className="text-black p-4 bg-white mb-4"
        style={{ borderRadius: "15px", border: "2px solid #eee" }}
      >
        <h5 className="fw-bold">สรุปรายงานสินค้า (A4)</h5>
        <p className="text-muted pt-2 mb-1">
          เลือกวันที่เพื่อดู{" "}
          <strong>ยอดรับเข้า / ส่งออก / คงเหลือสะสม ณ วันนั้น</strong> ตามรหัสผ้า
        </p>

        {/* Filter bar */}
        <div className="d-flex align-items-end pb-2 flex-wrap gap-3">
          {/* ประเภทบิล */}
          <div className="pt-2">
            <h6>เลือกประเภทบิล (สำหรับรายการส่งออก)</h6>
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

          {/* วันที่ */}
          <div className="pt-2">
            <h6>วันที่</h6>
            <select
              className="form-select"
              style={{
                borderRadius: "8px",
                border: "2px solid #eee",
                width: "90px",
              }}
              value={filters.day}
              onChange={(e) => handleFilterChange("day", e.target.value)}
            >
              <option value="">วันที่</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* เดือน */}
          <div className="pt-2">
            <h6>เดือน</h6>
            <select
              className="form-select"
              style={{
                borderRadius: "8px",
                border: "2px solid #eee",
                width: "180px",
              }}
              value={filters.month}
              onChange={(e) => handleFilterChange("month", e.target.value)}
            >
              <option value="">เดือน</option>
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

          {/* ปี */}
          <div className="pt-2">
            <h6>ปี</h6>
            <select
              className="form-select"
              style={{
                borderRadius: "8px",
                border: "2px solid #eee",  // ✅ แก้ quote ตรงนี้แล้ว
                width: "110px",
              }}
              value={filters.year}
              onChange={(e) => handleFilterChange("year", e.target.value)}
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

        {asOfDateForView && (
          <p className="mt-2 text-muted" style={{ fontSize: "0.9rem" }}>
            แสดงยอดสะสม ณ วันที่{" "}
            <strong>
              {String(asOfDateForView.getDate()).padStart(2, "0")}/
              {String(asOfDateForView.getMonth() + 1).padStart(2, "0")}/
              {asOfDateForView.getFullYear()}
            </strong>
          </p>
        )}
      </div>

      {/* Preview summary (สิ่งนี้ = สิ่งที่จะออกไฟล์) */}
      <div
        className="bg-white p-3"
        style={{ borderRadius: "15px", border: "1px solid #eee" }}
      >
        <h6 className="fw-bold mb-2">ตัวอย่างข้อมูลที่จะส่งออก</h6>
        <p className="text-muted" style={{ fontSize: "0.9rem" }}>
          ตารางด้านล่างนี้คือ{" "}
          <strong>ยอดรับเข้า, ส่งออก และคงเหลือสะสม</strong> แยกตามรหัสผ้า ณ
          วันที่ที่เลือก
        </p>

        <div className="table-responsive">
          <table className="table table-sm table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th className="text-center" style={{ width: "8%" }}>
                  ลำดับที่
                </th>
                <th className="text-center" style={{ width: "42%" }}>
                  รหัสผ้า
                </th>
                <th className="text-center" style={{ width: "16%" }}>
                  รับเข้า (หลา)
                </th>
                <th className="text-center" style={{ width: "16%" }}>
                  ส่งออก (หลา)
                </th>
                <th className="text-center" style={{ width: "18%" }}>
                  คงเหลือสะสม (หลา)
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-3">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" className="text-center text-danger py-3">
                    {error}
                  </td>
                </tr>
              ) : !filters.day || !filters.month || !filters.year ? (
                <tr>
                  <td colSpan="5" className="text-center py-3">
                    กรุณาเลือก วันที่ / เดือน / ปี แล้วกด "ค้นหา"
                  </td>
                </tr>
              ) : summaryRows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-3">
                    ไม่มีข้อมูล ณ วันที่ที่เลือก
                  </td>
                </tr>
              ) : (
                <>
                  {summaryRows.map((row, idx) => (
                    <tr key={row.fabricCode}>
                      <td className="text-center">{idx + 1}</td>
                      <td>{row.fabricCode}</td>
                      <td className="text-end">
                        {Number(row.totalIn).toLocaleString()}
                      </td>
                      <td className="text-end">
                        {Number(row.totalOut).toLocaleString()}
                      </td>
                      <td className="text-end">
                        {Number(row.balance).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="table-secondary">
                    <td></td>
                    <td className="text-end fw-bold">รวมทั้งหมด</td>
                    <td className="text-end fw-bold">
                      {totals.in.toLocaleString()}
                    </td>
                    <td className="text-end fw-bold">
                      {totals.out.toLocaleString()}
                    </td>
                    <td className="text-end fw-bold">
                      {totals.balance.toLocaleString()}
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
