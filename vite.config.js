import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

/**
 * 프로덕션 빌드 직후 dist/sw.js에 번들 에셋 목록을 자동 주입하고,
 * GitHub Pages용 .nojekyll 및 404.html을 생성하는 플러그인
 */
function pwaAndPagesPlugin() {
  return {
    name: 'pwa-and-pages-plugin',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist');
      const bundleDir = path.join(distDir, 'bundle');
      const swPath = path.join(distDir, 'sw.js');
      const indexPath = path.join(distDir, 'index.html');
      const notFoundPath = path.join(distDir, '404.html');
      const nojekyllPath = path.join(distDir, '.nojekyll');

      // dist/bundle 내 생성된 JS/CSS 파일 목록 수집
      let bundleAssets = [];
      if (fs.existsSync(bundleDir)) {
        const files = fs.readdirSync(bundleDir);
        bundleAssets = files
          .filter((f) => f.endsWith('.js') || f.endsWith('.css'))
          .sort()
          .map((f) => `bundle/${f}`);
      }

      // dist/sw.js의 BUNDLE_ASSETS 주입
      if (fs.existsSync(swPath)) {
        const swContent = fs.readFileSync(swPath, 'utf-8');
        const updatedSw = swContent.replace(
          /const BUNDLE_ASSETS = \[\];/,
          `const BUNDLE_ASSETS = ${JSON.stringify(bundleAssets)};`
        );
        fs.writeFileSync(swPath, updatedSw, 'utf-8');
      }

      // GitHub Pages SPA 라우팅 폴백(404.html) 및 Jekyll 비활성화(.nojekyll)
      fs.writeFileSync(nojekyllPath, '', 'utf-8');
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), pwaAndPagesPlugin()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    assetsDir: 'bundle',
    minify: 'esbuild',
    cssMinify: 'esbuild',
  },
  server: {
    port: 4317,
    host: '127.0.0.1'
  }
});
