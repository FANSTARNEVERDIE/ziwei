/* ============================================================
 * Service Worker：离线可用
 *
 * 策略：
 *   - 应用外壳（HTML/CSS/JS/引擎）：预缓存，cache-first
 *     → 断网也能完整排盘，这正是本项目「纯本地运算」的优势
 *   - 版本号变更时清理旧缓存，避免用户卡在旧版本
 *
 * 注意：本应用没有任何后端请求，所以不需要处理 API 缓存。
 *
 * 部署提示：每次发版请改动 VERSION（例如 v1 -> v2），
 * 否则已安装的用户会一直用旧缓存。
 * ============================================================ */

const VERSION = 'ziwei-v2';
const SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/store.js',
  './js/lunar-table.js',
  './js/leap.js',
  './js/interpret.js',
  './js/export.js',
  './js/app.js',
  './vendor/iztro.min.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];

/* 安装：预缓存应用外壳 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => {
      // 单个资源失败不应让整个安装失败（例如某张图标缺失）
      return Promise.all(
        SHELL.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] 预缓存失败:', url, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

/* 激活：清理旧版本缓存 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* 请求：外壳走 cache-first，其余走网络并回退缓存 */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // 只处理同源 GET
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  // 带查询串的导航请求（分享链接 ?d=...）也要能用，
  // 否则离线打开分享链接会失败 —— 统一回退到缓存的 index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match('./index.html').then((r) => r || caches.match('./'))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // 只缓存成功的同源响应
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const copy = res.clone();
        caches.open(VERSION).then((cache) => cache.put(req, copy)).catch(() => { });
        return res;
      }).catch(() => cached);
    })
  );
});

/* 允许页面主动触发更新 */
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});