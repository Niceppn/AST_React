// File: ExportFabricLedgerPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { API_BASE_URL } from "@/config/apiBase";

const ExportFabricLedgerPage = () => {
  const [fabricouts, setFabricouts] = useState([]);
  const [stockfabrics, setStockfabrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [exportFilters, setExportFilters] = useState({
    companyLocation: "",
    fabricCode: "ALL",
    vatType: "",
    fromMonth: "",
    fromYear: "",
    toMonth: "",
    toYear: "",
  });

  const [availableFabricCodes, setAvailableFabricCodes] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);

  // ===== โหลด stockfabrics =====
  useEffect(() => {
    const fetchStockfabrics = async () => {
      try {
        const url = `${API_BASE_URL}/api/stockfabrics?limit=50000&year=2025`;
        const res = await axios.get(url);
        let rows = [];
        if (Array.isArray(res.data?.data)) rows = res.data.data;
        else if (Array.isArray(res.data)) rows = res.data;
        setStockfabrics(rows);
      } catch (err) {
        console.error("❌ Error stockfabrics:", err);
        setStockfabrics([]);
      }
    };
    fetchStockfabrics();
  }, []);

  // ===== สร้างรายการรหัสผ้าใน dropdown =====
  useEffect(() => {
    const codes = [
      ...new Set(
        fabricouts
          .map((i) => i.fabricStruct || i.fabricId || i.refId)
          .filter(Boolean)
      ),
    ];
    setAvailableFabricCodes(codes);
  }, [fabricouts]);

// ======= โหลดรหัสผ้าตั้งแต่เข้ามาครั้งแรก =======
useEffect(() => {
  const fetchInitialFabricCodes = async () => {
    try {
      // ถ้า API ของคุณรองรับ ไม่ระบุ year จะดึงทั้งหมด
      // ถ้าอยากจำกัดปี เช่น 2025 ก็ปรับ URL ได้
      const url = `${API_BASE_URL}/api/fabricouts?limit=20000`;
      const res = await axios.get(url);

      let rows = [];
      if (Array.isArray(res.data?.data)) rows = res.data.data;
      else if (Array.isArray(res.data)) rows = res.data;

      const codes = [
        ...new Set(
          rows
            .map((i) => i.fabricStruct || i.fabricId || i.refId)
            .filter(Boolean)
        ),
      ];

      setAvailableFabricCodes(codes);
    } catch (err) {
      console.error("❌ Error initial fabric codes:", err);
      setAvailableFabricCodes([]); // กัน dropdown พัง
    }
  };

  fetchInitialFabricCodes();
}, []);


  const handleExportFilterChange = (name, value) => {
    setExportFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "-";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const getMonthName = (month) => {
    const m = String(month);
    const map = {
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
    return map[m] || m;
  };

  const buildFabricInfo = (item = {}) => {
    const parts = [
      item.fabricStruct,
      item.fabricFace ||
        item.fabricWidth ||
        item.face ||
        item.fabricW ||
        item.width,
      item.fabricPattern ||
        item.fabricDesign ||
        item.design ||
        item.pattern,
    ].filter(Boolean);
    return parts.join(" - ");
  };

  const getFabricKey = (item = {}) => {
    const info = buildFabricInfo(item);
    return (
      info ||
      item.fabricStruct ||
      item.fabricId ||
      item.refId ||
      "UNKNOWN_FABRIC"
    );
  };

  // ===== ดึง fabricouts ตามปี =====
  const loadFabricoutsForYear = async () => {
    const { fromYear, vatType } = exportFilters;
    if (!fromYear) {
      alert("กรุณาเลือกปี (จากปี) ก่อน");
      return [];
    }

    const params = new URLSearchParams({ limit: "20000", year: fromYear });
    if (vatType) params.append("vatType", vatType);

    try {
      const url = `${API_BASE_URL}/api/fabricouts?${params.toString()}`;
      const res = await axios.get(url);
      let rows = [];
      if (Array.isArray(res.data?.data)) rows = res.data.data;
      else if (Array.isArray(res.data)) rows = res.data;

      rows.sort((a, b) => new Date(a.createDate) - new Date(b.createDate));
      setFabricouts(rows);
      return rows;
    } catch (err) {
      console.error("❌ Error fabricouts:", err);
      setFabricouts([]);
      throw err;
    }
  };

  // ===== สร้างโครงรายงาน (logic หลัก) =====
  const buildReportRows = (baseData) => {
    const {
      fabricCode,
      vatType,
      fromMonth,
      fromYear,
      toMonth,
      toYear,
    } = exportFilters;

    let filtered = [...baseData];

    // ===== ช่วงวันที่ =====
    let fromDate = null;
    let toDate = null;

    if (fromMonth && fromYear) {
      const fy = Number(fromYear);
      const fm = Number(fromMonth);
      fromDate = new Date(fy, fm - 1, 1);

      if (toMonth && toYear) {
        const ty = Number(toYear);
        const tm = Number(toMonth);
        toDate = new Date(ty, tm, 0);
      } else {
        toDate = new Date(fy, fm, 0);
      }
    }

    const isWithinRange = (dateStr) => {
      if (!fromDate || !toDate) return true;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return false;
      return d >= fromDate && d <= toDate;
    };

    // ===== filter รหัสผ้า / ประเภทบิล =====
    const hasFabricFilter = fabricCode && fabricCode !== "ALL";

    if (hasFabricFilter) {
      filtered = filtered.filter((i) => {
        const code = i.fabricStruct || i.fabricId || i.refId;
        return code === fabricCode;
      });
    }

    if (vatType) {
      filtered = filtered.filter((i) => i.vatType === vatType);
    }

    if (fromDate && toDate) {
      filtered = filtered.filter((i) => isWithinRange(i.createDate));
    }

    // ===== กลุ่มตามเดือนฝั่งรับ =====
    const monthlyData = {};
    filtered.forEach((item) => {
      const d = new Date(item.createDate);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          monthName: `${getMonthName(d.getMonth() + 1)} ${d.getFullYear()}`,
          items: [],
          totalReceived: 0,
        };
      }
      monthlyData[monthKey].items.push(item);
      monthlyData[monthKey].totalReceived += parseInt(item.sumYard) || 0;
    });

    // ===== ฝั่งจ่าย (stockfabrics) =====
    const allStockoutByMonth = {};
    const allStockouts = stockfabrics.filter((s) => {
      if (!s.createDate) return false;
      if (!isWithinRange(s.createDate)) return false;

      if (hasFabricFilter) {
        const code = s.fabricStruct || s.fabricId || s.refId;
        return code === fabricCode;
      }
      return true;
    });

    allStockouts.forEach((s) => {
      const d = new Date(s.createDate);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;

      if (!allStockoutByMonth[monthKey]) {
        allStockoutByMonth[monthKey] = {
          monthName: `${getMonthName(d.getMonth() + 1)} ${d.getFullYear()}`,
          stockouts: [],
          totalStockout: 0,
        };
      }

      const qty = parseInt(s.sumYard) || 0;
      const fabricKey = hasFabricFilter ? "SELECTED_FABRIC" : getFabricKey(s);
      const fabricInfo = buildFabricInfo(s);

      allStockoutByMonth[monthKey].stockouts.push({
        date: s.createDate,
        quantity: qty,
        fabricKey,
        fabricInfo,
      });
      allStockoutByMonth[monthKey].totalStockout += qty;
    });

    // ===== รวมเดือนทั้งหมดที่มีเข้า/ออก =====
    const allMonthKeys = new Set([
      ...Object.keys(monthlyData),
      ...Object.keys(allStockoutByMonth),
    ]);

    const rows = [];
    const runningBalanceByFabric = {}; // key → balance

    const sampleItem = filtered[0] || baseData[0];
    const defaultFabricInfo = sampleItem ? buildFabricInfo(sampleItem) : "";

    Array.from(allMonthKeys)
      .sort()
      .forEach((monthKey) => {
        const monthReceive = monthlyData[monthKey] || {
          monthName: allStockoutByMonth[monthKey]?.monthName || monthKey,
          items: [],
          totalReceived: 0,
        };
        const monthStock = allStockoutByMonth[monthKey] || {
          stockouts: [],
          totalStockout: 0,
        };

        let monthlyOut = 0;

        // ---- รับ ----
        monthReceive.items.sort(
          (a, b) => new Date(a.createDate) - new Date(b.createDate)
        );

        monthReceive.items.forEach((item) => {
          const qty = parseInt(item.sumYard) || 0;
          const fabricInfo = buildFabricInfo(item);
          const key = hasFabricFilter ? "SELECTED_FABRIC" : getFabricKey(item);

          const prev = runningBalanceByFabric[key] || 0;
          const next = prev + qty;
          runningBalanceByFabric[key] = next;

          rows.push({
            type: "receive",
            fabricInfo,
            docNo: "",
            date: item.createDate,
            qtyIn: qty,
            qtyOut: "",
            balance: next,
            note: "รับ",
            monthLabel: monthReceive.monthName,
          });
        });

        // ---- จ่าย ----
        monthStock.stockouts.sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        monthStock.stockouts.forEach((s) => {
          monthlyOut += s.quantity;

          const key = hasFabricFilter ? "SELECTED_FABRIC" : s.fabricKey;
          const prev = runningBalanceByFabric[key] || 0;
          let next = prev - s.quantity;
          if (next < 0) next = 0;
          runningBalanceByFabric[key] = next;

          const fabricInfo = s.fabricInfo || defaultFabricInfo;

          rows.push({
            type: "stockout",
            fabricInfo,
            docNo: "",
            date: s.date,
            qtyIn: "",
            qtyOut: s.quantity,
            balance: next,
            note: "จ่าย",
            monthLabel: monthReceive.monthName,
          });
        });

        // ---- สรุปรายเดือน: ใช้ยอดสะสม ณ สิ้นเดือน ----
        const monthEndBalance = Object.values(runningBalanceByFabric).reduce(
          (sum, v) => sum + (v || 0),
          0
        );

        rows.push({
          type: "monthSummary",
          fabricInfo: "",
          docNo: `รวม ${monthReceive.monthName}`,
          date: "",
          qtyIn: monthReceive.totalReceived,
          qtyOut: monthlyOut,
          balance: Math.max(0, monthEndBalance), // ✅ ใช้ยอดสะสม (ไม่ใช่รับ-จ่ายของเดือน)
          note: "",
          monthLabel: monthReceive.monthName,
        });
      });

    // ===== รวมทั้งหมดทุกเดือน (เฉพาะช่วงที่เลือก) =====
    const totalQty = filtered.reduce(
      (sum, it) => sum + (parseInt(it.sumYard) || 0),
      0
    );
    const totalStockoutAll = Object.values(allStockoutByMonth).reduce(
      (sum, m) => sum + (m.totalStockout || 0),
      0
    );
    const finalBalance = totalQty - totalStockoutAll;

    rows.push({
      type: "grandTotal",
      fabricInfo: "",
      docNo: "รวมทั้งหมดทุกเดือน",
      date: "",
      qtyIn: totalQty,
      qtyOut: totalStockoutAll,
      balance: Math.max(0, finalBalance),
      note: "",
      monthLabel: "",
    });

    return { filtered, rows };
  };

  // ===== Preview =====
  const handlePreview = async () => {
    const { fromMonth, fromYear } = exportFilters;
    if (!fromMonth || !fromYear) {
      alert("กรุณาเลือก 'จากเดือน' และ 'ปี' ก่อน");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const baseData = await loadFabricoutsForYear();
      const { rows } = buildReportRows(baseData);
      setPreviewRows(rows);
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถสร้างตารางตัวอย่างได้");
      setPreviewRows([]);
    } finally {
      setLoading(false);
    }
  };

  
  // ===== Export Excel =====
  // ====== เมื่อกด “📊 ส่งออก Excel” ======
const handleExportExcel = async () => {
  try {
    setLoading(true);

    // ถ้า state fabricouts ยังว่าง ให้ดึงใหม่ตามปี/ประเภทบิล
    let baseData = fabricouts;
    if (!baseData.length) {
      baseData = await loadFabricoutsForYear();
    }

    // ใช้ logic เดียวกับหน้า preview
    const { rows } = buildReportRows(baseData);

    // -------- สร้าง Workbook / Worksheet --------
    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet("รายงานสินค้าและสำเร็จรูป");

    ws.pageSetup = {
      paperSize: 9, // A4
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    };

    // -------- เตรียมข้อความช่วงเวลา --------
    const { fromMonth, fromYear, toMonth, toYear, vatType } = exportFilters;

    let periodLabel = "";
    if (fromMonth && fromYear) {
      const startLabel = `${getMonthName(Number(fromMonth))} ${fromYear}`;

      if (toMonth && toYear) {
        const endLabel = `${getMonthName(Number(toMonth))} ${toYear}`;
        if (startLabel === endLabel) {
          periodLabel = startLabel;
        } else {
          periodLabel = `${startLabel} - ${endLabel}`;
        }
      } else {
        periodLabel = startLabel;
      }
    }

    // -------- เตรียมข้อความประเภทบิล --------
    let vatLabel = "ทั้งหมด";
    if (vatType === "A" || vatType === "B" || vatType === "C") {
      vatLabel = vatType;
    }

    // -------- หัวรายงานด้านบน (จัดรูปแบบเหมือนเดิม) --------
    ws.mergeCells("A1:F1");
    ws.getCell("A1").value = "รายงานสินค้าและสำเร็จรูป";
    ws.getCell("A1").font = { bold: true, size: 16 };
    ws.getCell("A1").alignment = { horizontal: "center" };

    ws.addRow([]);
    ws.addRow(["ชื่อผู้ประกอบการ", "บริษัท เอเชียเท็กซ์ไทล์ จำกัด"]);
    ws.addRow(["ชื่อสถานประกอบการ", exportFilters.companyLocation || ""]);

    // ✅ แถวแสดงช่วงเวลา (ถ้ามีเลือก)
    if (periodLabel) {
      ws.addRow(["ช่วงเวลา", periodLabel]);
    }

    // ✅ แถวแสดงประเภทบิล (จัดแบบเดียวกับของเดิม)
    ws.addRow(["ประเภทบิล", vatLabel]);

    ws.addRow([]);
    ws.addRow([]);

    ws.addRow(["รหัสผ้า", codeLabel]);

    // -------- หัวคอลัมน์หลัก --------
    const headerRow = ws.addRow([
      "โครงสร้างผ้า / หน้าผ้า / ลายผ้า",
      "วัน เดือน ปี",
      "จำนวนรับ",
      "จำนวนจ่าย",
      "จำนวนเหลือ",
      "หมายเหตุ",
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // -------- เติมข้อมูลจาก rows --------
    rows.forEach((r) => {
      const row = ws.addRow([
        r.fabricInfo || r.docNo,
        r.date ? formatDate(r.date) : "",
        r.qtyIn ?? "",
        r.qtyOut ?? "",
        r.balance ?? "",
        r.note ?? "",
      ]);

      row.eachCell((cell, col) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        if (col === 1 || col === 2 || col === 6) {
          cell.alignment = { horizontal: "center" };
        } else {
          cell.alignment = { horizontal: "right" };
          if (typeof cell.value === "number") {
            cell.numFmt = "#,##0";
          }
        }
      });

      if (r.type === "monthSummary") {
        row.font = { bold: true };
      }

      if (r.type === "grandTotal") {
        row.font = { bold: true, size: 12 };
      }
    });

    // -------- กำหนดความกว้างคอลัมน์ --------
    ws.columns = [
      { width: 40 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 20 },
    ];

    // -------- สร้างไฟล์ .xlsx และดาวน์โหลด --------
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const codeLabel =
      !exportFilters.fabricCode || exportFilters.fabricCode === "ALL"
        ? "ทั้งหมด"
        : exportFilters.fabricCode;

    const fileName = `รายงานสินค้า_${codeLabel}_${formatDate(
      new Date().toISOString()
    ).replace(/\//g, "-")}.xlsx`;

    saveAs(blob, fileName);
  } catch (err) {
    console.error("❌ export error:", err);
    alert("เกิดข้อผิดพลาดในการส่งออก Excel");
  } finally {
    setLoading(false);
  }
};

  const handleExportExcel_backup = async () => {
    try {
      setLoading(true);
      let baseData = fabricouts;
      if (!baseData.length) {
        baseData = await loadFabricoutsForYear();
      }

      const { rows } = buildReportRows(baseData);

      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet("รายงานสินค้าและสำเร็จรูป");

      ws.pageSetup = {
        paperSize: 9,
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      };

      ws.mergeCells("A1:F1");
      ws.getCell("A1").value = "รายงานสินค้าและสำเร็จรูป";
      ws.getCell("A1").font = { bold: true, size: 16 };
      ws.getCell("A1").alignment = { horizontal: "center" };

      ws.addRow([]);
      ws.addRow(["ชื่อผู้ประกอบการ", "บริษัท เอเชียเท็กซ์ไทล์ จำกัด"]);
      ws.addRow(["ชื่อสถานประกอบการ", exportFilters.companyLocation || ""]);
      ws.addRow([]);
      ws.addRow([]);

      const header1 = ws.addRow([
        "โครงสร้างผ้า / หน้าผ้า / ลายผ้า",
        "วัน เดือน ปี",
        "จำนวนรับ",
        "จำนวนจ่าย",
        "จำนวนเหลือ",
        "หมายเหตุ",
      ]);

      header1.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      rows.forEach((r) => {
        const row = ws.addRow([
          r.fabricInfo || r.docNo,
          r.date ? formatDate(r.date) : "",
          r.qtyIn || "",
          r.qtyOut || "",
          r.balance || "",
          r.note || "",
        ]);

        row.eachCell((cell, col) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          if (col === 1 || col === 2 || col === 6) {
            cell.alignment = { horizontal: "center" };
          } else {
            cell.alignment = { horizontal: "right" };
            if (typeof cell.value === "number") {
              cell.numFmt = "#,##0";
            }
          }
        });

        if (r.type === "monthSummary") {
          row.font = { bold: true };
        }
        if (r.type === "grandTotal") {
          row.font = { bold: true, size: 12 };
        }
      });

      ws.columns = [
        { width: 40 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
        { width: 15 },
      ];

      const codeLabel =
        !exportFilters.fabricCode || exportFilters.fabricCode === "ALL"
          ? "ทั้งหมด"
          : exportFilters.fabricCode;

      const fileName = `รายงานสินค้า_${codeLabel}_${formatDate(
        new Date().toISOString()
      ).replace(/\//g, "-")}.xlsx`;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, fileName);
    } catch (err) {
      console.error("❌ export error:", err);
      alert("เกิดข้อผิดพลาดในการส่งออก Excel");
    } finally {
      setLoading(false);
    }
  };

  // ===== JSX =====
  return (
    <div className="container py-4">
      <div
        className="bg-white p-4 mb-4"
        style={{ borderRadius: 15, border: "2px solid #e9ecef" }}
      >
        <h5 className="fw-bold mb-3">📊 เลือกเงื่อนไขการส่งออก Excel</h5>

        <div className="row g-3">
          <div className="col-12">
            <label className="form-label fw-bold text-dark">
              ชื่อสถานประกอบการ:
            </label>
            <input
              type="text"
              className="form-control"
              value={exportFilters.companyLocation}
              onChange={(e) =>
                handleExportFilterChange("companyLocation", e.target.value)
              }
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold text-dark">รหัสผ้า:</label>
            <select
              className="form-select"
              value={exportFilters.fabricCode}
              onChange={(e) =>
                handleExportFilterChange("fabricCode", e.target.value)
              }
            >
              <option value="ALL">เลือกรหัสผ้า (ทั้งหมด)</option>
              {availableFabricCodes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-bold text-dark">ประเภทบิล:</label>
            <select
              className="form-select"
              value={exportFilters.vatType}
              onChange={(e) =>
                handleExportFilterChange("vatType", e.target.value)
              }
            >
              <option value="">เลือกประเภทบิล (ทั้งหมด)</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>

          <div className="col-12">
            <div
              className="border rounded p-3"
              style={{ background: "#f8f9fa" }}
            >
              <h6 className="fw-bold mb-3">ช่วงเวลา:</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">จากเดือน:</label>
                  <div className="row g-2">
                    <div className="col-8">
                      <select
                        className="form-select"
                        value={exportFilters.fromMonth}
                        onChange={(e) =>
                          handleExportFilterChange(
                            "fromMonth",
                            e.target.value
                          )
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
                        value={exportFilters.fromYear}
                        onChange={(e) =>
                          handleExportFilterChange("fromYear", e.target.value)
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

                <div className="col-md-6">
                  <label className="form-label fw-semibold">ถึงเดือน:</label>
                  <div className="row g-2">
                    <div className="col-8">
                      <select
                        className="form-select"
                        value={exportFilters.toMonth}
                        onChange={(e) =>
                          handleExportFilterChange("toMonth", e.target.value)
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
                        value={exportFilters.toYear}
                        onChange={(e) =>
                          handleExportFilterChange("toYear", e.target.value)
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

                  <small className="text-muted">
                    💡 หากไม่เลือก "ถึงเดือน" จะใช้เฉพาะเดือน/ปี เริ่มต้น
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => {
              setExportFilters({
                companyLocation: "",
                fabricCode: "ALL",
                vatType: "",
                fromMonth: "",
                fromYear: "",
                toMonth: "",
                toYear: "",
              });
              setPreviewRows([]);
            }}
          >
            ล้างค่า
          </button>
          <button
            className="btn btn-primary"
            onClick={handlePreview}
            disabled={loading}
          >
            {loading ? "กำลังประมวลผล..." : "ค้นหา"}
          </button>
          <button
            className="btn btn-success"
            onClick={handleExportExcel}
            disabled={loading || !previewRows.length}
          >
            📊 ส่งออก Excel
          </button>
        </div>
      </div>

      {/* ตาราง preview */}
      <div
        className="bg-white p-3"
        style={{ borderRadius: 15, border: "1px solid #e9ecef" }}
      >
        <h6 className="fw-bold mb-3">
          ตารางสินค้าคงคลัง (โครงสร้างผ้า / หน้าผ้า / ลายผ้า)
        </h6>

        <div className="table-responsive">
          <table className="table table-sm table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th className="text-center">
                  โครงสร้างผ้า / หน้าผ้า / ลายผ้า
                </th>
                <th className="text-center">วัน เดือน ปี</th>
                <th className="text-center">จำนวนรับ</th>
                <th className="text-center">จำนวนจ่าย</th>
                <th className="text-center">คงเหลือ</th>
                <th className="text-center">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-3">
                    กำลังประมวลผล...
                  </td>
                </tr>
              ) : !previewRows.length ? (
                <tr>
                  <td colSpan="6" className="text-center py-3">
                    ยังไม่มีข้อมูล กรุณาเลือกเงื่อนไขแล้วกด "ค้นหา"
                  </td>
                </tr>
              ) : (
                previewRows.map((r, idx) => (
                  <tr
                    key={idx}
                    style={
                      r.type === "monthSummary"
                        ? { background: "#f8f9fa", fontWeight: 600 }
                        : r.type === "grandTotal"
                        ? { background: "#ffeeba", fontWeight: 700 }
                        : {}
                    }
                  >
                    <td>{r.fabricInfo || r.docNo}</td>
                    <td className="text-center">
                      {r.date ? formatDate(r.date) : ""}
                    </td>
                    <td className="text-end">
                      {r.qtyIn ? r.qtyIn.toLocaleString() : ""}
                    </td>
                    <td className="text-end">
                      {r.qtyOut ? r.qtyOut.toLocaleString() : ""}
                    </td>
                    <td className="text-end">
                      {r.balance !== "" && r.balance !== undefined
                        ? Number(r.balance).toLocaleString()
                        : ""}
                    </td>
                    <td className="text-center">{r.note}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExportFabricLedgerPage;
