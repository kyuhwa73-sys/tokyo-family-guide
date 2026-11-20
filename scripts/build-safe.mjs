import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

/**
 * Node.js v24 + Windows OneDrive 환경에서 fs.rmSync/fs.cpSync의 네이티브 경로 크래시를 피하기 위해
 * 기본 unlinkSync/rmdirSync/copyFileSync만 사용하는 순수 디렉토리 복사/정리 헬퍼
 */
function removeDirSafe(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      removeDirSafe(full);
    } else {
      fs.unlinkSync(full);
    }
  }
  fs.rmdirSync(dirPath);
}

function copyDirSafe(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyDirSafe(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function runSafeBuild() {
  const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), 'tokyo-guide-build-'));

  try {
    console.log(`임시 디스크 경로에서 안전 빌드 수행 중: ${tmpOut}`);
    await build({
      configFile: false,
      root: ROOT_DIR,
      plugins: [react()],
      base: './',
      build: {
        outDir: tmpOut,
        emptyOutDir: true,
        assetsDir: 'bundle',
        minify: 'esbuild',
        cssMinify: 'esbuild',
      },
    });

    // bundle/ 내 생성된 .js/.css 상대경로 수집
    const bundleDir = path.join(tmpOut, 'bundle');
    let bundleAssets = [];
    if (fs.existsSync(bundleDir)) {
      bundleAssets = fs
        .readdirSync(bundleDir)
        .filter((f) => f.endsWith('.js') || f.endsWith('.css'))
        .sort()
        .map((f) => `bundle/${f}`);
    }

    // assets/spots/ 내 현장 실물사진 상대경로 수집
    const spotsDir = path.join(tmpOut, 'assets', 'spots');
    let spotPhotos = [];
    if (fs.existsSync(spotsDir)) {
      spotPhotos = fs
        .readdirSync(spotsDir)
        .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
        .sort()
        .map((f) => `assets/spots/${f}`);
    }

    // tmpOut/sw.js 내 BUNDLE_ASSETS 및 SPOT_PHOTOS 주입
    const swPath = path.join(tmpOut, 'sw.js');
    if (fs.existsSync(swPath)) {
      const swContent = fs.readFileSync(swPath, 'utf-8');
      const updatedSw = swContent
        .replace(
          /const BUNDLE_ASSETS = \[\];/,
          `const BUNDLE_ASSETS = ${JSON.stringify(bundleAssets)};`
        )
        .replace(
          /const SPOT_PHOTOS = \[\];/,
          `const SPOT_PHOTOS = ${JSON.stringify(spotPhotos)};`
        );
      fs.writeFileSync(swPath, updatedSw, 'utf-8');
    }

    // GitHub Pages용 .nojekyll 및 404.html 생성
    fs.writeFileSync(path.join(tmpOut, '.nojekyll'), '', 'utf-8');
    const indexPath = path.join(tmpOut, 'index.html');
    if (fs.existsSync(indexPath)) {
      fs.copyFileSync(indexPath, path.join(tmpOut, '404.html'));
    }

    // dist/bundle 및 dist/assets 내 잔여 번들 파일 정리
    console.log('dist/ 대상 폴더 정리 및 복사 시작...');
    fs.mkdirSync(DIST_DIR, { recursive: true });
    const distBundleDir = path.join(DIST_DIR, 'bundle');
    if (fs.existsSync(distBundleDir)) {
      for (const f of fs.readdirSync(distBundleDir)) {
        const p = path.join(distBundleDir, f);
        if (fs.statSync(p).isDirectory()) removeDirSafe(p);
        else fs.unlinkSync(p);
      }
    }
    const distAssetsDir = path.join(DIST_DIR, 'assets');
    if (fs.existsSync(distAssetsDir)) {
      for (const f of fs.readdirSync(distAssetsDir)) {
        if (/^index-.*\.(js|css)$/.test(f)) {
          fs.unlinkSync(path.join(distAssetsDir, f));
        }
      }
    }

    // 최종 산출물을 dist/로 복사
    copyDirSafe(tmpOut, DIST_DIR);
    console.log('✅ dist/ 안전 빌드 및 PWA·GitHub Pages 후처리 완료!');
    console.log('주입된 BUNDLE_ASSETS:', bundleAssets);
    console.log(`주입된 SPOT_PHOTOS: ${spotPhotos.length}장`);
  } finally {
    try {
      removeDirSafe(tmpOut);
    } catch {
      // 임시 디렉토리 정리 실패 시 무시
    }
  }
}

runSafeBuild().catch((err) => {
  console.error('빌드 실패:', err);
  process.exit(1);
});
