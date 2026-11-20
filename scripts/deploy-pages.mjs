import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const DEFAULT_REMOTE = 'https://github.com/kyuhwa73-sys/tokyo-family-guide.git';

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

function runGit(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function getOriginUrl() {
  try {
    const url = runGit(['-c', 'safe.directory=*', 'remote', 'get-url', 'origin'], ROOT_DIR);
    if (url) return url;
  } catch {
    // origin이 없으면 기본 URL 사용
  }
  return DEFAULT_REMOTE;
}

if (!fs.existsSync(DIST_DIR)) {
  console.error('dist 디렉토리가 없습니다. 먼저 npm run build를 실행하세요.');
  process.exit(1);
}

const remoteUrl = getOriginUrl();
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tokyo-gh-pages-'));

try {
  console.log(`GitHub Pages 배포 준비 중... (대상: ${remoteUrl})`);
  copyDirSafe(DIST_DIR, tmpDir);

  runGit(['init'], tmpDir);
  runGit(['checkout', '-b', 'gh-pages'], tmpDir);
  runGit(['config', 'user.name', 'kyuhwa73-sys'], tmpDir);
  runGit(['config', 'user.email', 'kyuhwa73-sys@users.noreply.github.com'], tmpDir);
  runGit(['add', '-A'], tmpDir);
  runGit(['commit', '-m', `Deploy Tokyo Family Guide (${new Date().toISOString()})`], tmpDir);
  runGit(['remote', 'add', 'origin', remoteUrl], tmpDir);
  runGit(['push', '-f', 'origin', 'gh-pages'], tmpDir);

  console.log('✅ gh-pages 브랜치 배포 푸시 완료!');
} finally {
  try {
    removeDirSafe(tmpDir);
  } catch {
    // 임시 디렉토리 정리 실패 시 무시
  }
}
