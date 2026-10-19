/* 一键运行 Service Worker 离线测试
 *
 * 自动完成：起静态服务 -> 起带调试端口的浏览器 -> 跑 CDP 测试 -> 清理
 *
 * 用法：node tools/run-sw-test.js
 */
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const PORT = 8899;
const CDP_PORT = 9222;

/* 常见 Edge / Chrome 安装位置 */
const CANDIDATES = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

function findBrowser() {
  for (const p of CANDIDATES) if (fs.existsSync(p)) return p;
  return null;
}

function waitFor(url, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve) => {
    const tick = () => {
      const req = http.get(url, (res) => { res.resume(); resolve(true); });
      req.on('error', () => {
        if (Date.now() - started > timeoutMs) return resolve(false);
        setTimeout(tick, 250);
      });
    };
    tick();
  });
}

/** 杀掉占用端口的进程（上一次异常退出可能留下孤儿） */
function freePort(port) {
  if (process.platform !== 'win32') return;
  try {
    const r = spawnSync('powershell', ['-NoProfile', '-Command',
      `(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue).OwningProcess`],
      { encoding: 'utf8' });
    (r.stdout || '').trim().split(/\s+/).filter(Boolean).forEach((pid) => {
      if (pid !== String(process.pid)) {
        spawnSync('taskkill', ['/PID', pid, '/T', '/F'], { stdio: 'ignore' });
      }
    });
  } catch (e) { /* 尽力而为 */ }
}

(async () => {
  const browser = findBrowser();
  if (!browser) {
    console.error('✗ 未找到 Edge 或 Chrome，无法运行此测试');
    process.exit(2);
  }
  console.log('浏览器:', browser);

  freePort(PORT);
  freePort(CDP_PORT);
  await new Promise((r) => setTimeout(r, 600));

  // 1) 静态服务
  console.log('启动静态服务…');
  const server = spawn(process.execPath, [path.join(ROOT, 'serve.js')], {
    cwd: ROOT, stdio: 'ignore', detached: false,
  });
  const serverOk = await waitFor(`http://127.0.0.1:${PORT}/index.html`, 8000);
  if (!serverOk) {
    console.error('✗ 静态服务启动失败');
    try { server.kill(); } catch (e) { }
    process.exit(2);
  }
  console.log('静态服务已就绪 http://127.0.0.1:' + PORT);

  // 2) 浏览器（独立 profile，避免影响用户数据）
  const profile = path.join(os.tmpdir(), 'zw-sw-test-' + Date.now());
  console.log('启动浏览器…');
  const proc = spawn(browser, [
    '--headless=new', '--disable-gpu', '--no-first-run',
    '--remote-debugging-port=' + CDP_PORT,
    '--user-data-dir=' + profile,
    'about:blank',
  ], { stdio: 'ignore' });

  const cdpOk = await waitFor(`http://127.0.0.1:${CDP_PORT}/json/version`, 15000);
  if (!cdpOk) {
    console.error('✗ 浏览器调试端口未就绪');
    try { proc.kill(); } catch (e) { }
    try { server.kill(); } catch (e) { }
    process.exit(2);
  }
  console.log('浏览器已就绪 (CDP ' + CDP_PORT + ')');
  console.log('');

  // 3) 跑测试
  const r = spawnSync(process.execPath, [path.join(ROOT, 'test-sw-cdp.js')], {
    cwd: ROOT, stdio: 'inherit',
    env: Object.assign({}, process.env, { CDP_PORT: String(CDP_PORT), ZW_SITE: `http://127.0.0.1:${PORT}` }),
  });

  // 4) 清理
  console.log('\n清理…');
  try { proc.kill(); } catch (e) { }
  try { server.kill(); } catch (e) { }
  await new Promise((r2) => setTimeout(r2, 800));
  freePort(CDP_PORT);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { }
  console.log('完成');

  process.exit(r.status === null ? 2 : r.status);
})();