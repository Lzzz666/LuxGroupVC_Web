import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 允許外部設備訪問
    port: 5173, // 確保 ngrok 連接的端口
    strictPort: true, // 確保固定端口
    allowedHosts: ['.ngrok-free.app'], // 允許 ngrok 產生的網址
  },
});
// import fs from 'fs';

// export default {
//   server: {
//     host: '0.0.0.0',  // 設定為 0.0.0.0 或具體的 IP 地址來使其他設備可以訪問
//     port: 5173,
//     https: {
//       key: fs.readFileSync('C:/Program Files/OpenSSL-Win64/bin/server.key'),  // 修改為您的 key 文件路徑
//       cert: fs.readFileSyc('C:/Program Files/OpenSSL-Win64/bin/server.crt'),  // 修改為您的 crt 文件路徑
//     },
//   },
// };

// export default defineConfig({
//   base: '/LuxGroupVC_Web/',
//   plugins: [react()],
// })
