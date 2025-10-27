import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 讓打包後的資源用相對路徑，部署到子路徑也能正確載入
  base: './',
})
