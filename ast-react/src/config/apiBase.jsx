// อ่านค่าจาก .env (ตอน build) + รองรับ runtime override ผ่าน window.__ENV (ถ้าอยาก)
const built = import.meta.env.VITE_API_BASE_URL || "";
const runtime = typeof window !== "undefined" && window.__ENV?.API_BASE_URL;
export const API_BASE_URL = String(runtime || built).replace(/\/+$/, ""); // ตัด '/' ท้ายกัน // ซ้อน

if (!/^https?:\/\/[^/]+/i.test(API_BASE_URL)) {
  // ช่วย debug ถ้าค่าหาย
  console.warn("API_BASE_URL is not a full URL. Current:", API_BASE_URL);
}
