import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — GitHub Pages의 하위 경로(/저장소이름/)에 올려도,
// 로컬에서 빌드 결과를 그냥 열어봐도 자원 경로가 깨지지 않게 상대경로로 빌드한다.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    open: true,
    port: 5173,
  },
});
