// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)), // ใช้ "@/..." ได้ทุกไฟล์
    },
  },
  server: {
    host: true,           // optional: ให้เครื่องอื่นในแลนเข้าถึง dev server ได้
    port: 5173,           // เปลี่ยนได้ตามสะดวก
    proxy: {
      // เรียกจาก frontend เป็น /api/... แล้ว dev server จะ proxy ไป backend ให้
      "/api": {
        target: "http://128.199.238.141:8000", // ที่คุณตั้งไว้ใน .env.production
        changeOrigin: true,
        // ถ้าหลังบ้านอยู่ใต้ path อื่น ค่อยใช้ rewrite:
        // rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});

// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
