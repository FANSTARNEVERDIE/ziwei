/* 用 CDP 真实验证 Service Worker 离线能力
 *
 * 为什么需要这个测试：
 *   headless --dump-dom / --screenshot 都在页面早期就快照，
 *   早于 Service Worker 生命周期完成，因此测不了「缓存是否真的生效」。
 *   CDP 能等待异步、能读 Cache Storage、能模拟离线 —— 这些是关键。
 *
 * 前置条件：需要先启动带调试端口的浏览器与服务。
 *   推荐直接运行：node tools/run-sw-test.js
 *   它会自动起服务与浏览器、跑完再清理。
 *
 * 手动方式：
 *   node serve.js
 *   msedge --headless=new --remote-debugging-port=9222 --user-data-dir=<临时目录> about:blank
 *   node test-sw-cdp.js
 */
const http = require('http');

const CDP_PORT = Number(process.env.CDP_PORT || 9222);
const SITE = process.env.ZW_SITE || 'http://127.0.0.1:8899';

function httpJson(path, method) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: CDP_PORT, path, method: method || 'GET' }, (res) => {
      let d = '';
      res.on('data', (c) => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { reject(new Error('非 JSON 响应: ' + d.slice(0, 120))); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

/** 复用一个已有的 page target（/json/new 需要 PUT，且并非所有版本都启用） */
async function pickTarget() {
  const list = await httpJson('/json/list');
  const pages = (list || []).filter((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!pages.length) throw new Error('没有可用的 page target');
  // 优先复用 about:blank，避免干扰其它页
  return pages.find((p) => p.url === 'about:blank') || pages[0];
}

/* 极简 WebSocket 客户端（避免引入依赖） */
const crypto = require('crypto');
const net = require('net');

class WS {
  constructor(url) {
    const u = new URL(url);
    this.host = u.hostname;
    this.port = Number(u.port) || 80;
    this.path = u.pathname + u.search;
    this.buf = Buffer.alloc(0);
    this.handlers = new Map();
    this.id = 0;
    this.pending = new Map();
    this.sock = null;
  }
  connect() {
    return new Promise((resolve, reject) => {
      const key = crypto.randomBytes(16).toString('base64');
      this.sock = net.connect(this.port, this.host, () => {
        this.sock.write(
          `GET ${this.path} HTTP/1.1\r\n` +
          `Host: ${this.host}:${this.port}\r\n` +
          `Upgrade: websocket\r\nConnection: Upgrade\r\n` +
          `Sec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`
        );
      });
      let handshook = false;
      this.sock.on('data', (chunk) => {
        if (!handshook) {
          const s = chunk.toString('latin1');
          const idx = s.indexOf('\r\n\r\n');
          if (idx < 0) return;
          handshook = true;
          if (!/101/.test(s.split('\r\n')[0])) return reject(new Error('握手失败: ' + s.split('\r\n')[0]));
          const rest = chunk.slice(idx + 4);
          if (rest.length) this._feed(rest);
          return resolve();
        }
        this._feed(chunk);
      });
      this.sock.on('error', reject);
    });
  }
  _feed(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    while (this.buf.length >= 2) {
      const b0 = this.buf[0], b1 = this.buf[1];
      const op = b0 & 0x0f;
      let len = b1 & 0x7f, off = 2;
      if (len === 126) { if (this.buf.length < 4) return; len = this.buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (this.buf.length < 10) return; len = Number(this.buf.readBigUInt64BE(2)); off = 10; }
      if (this.buf.length < off + len) return;
      const payload = this.buf.slice(off, off + len);
      this.buf = this.buf.slice(off + len);
      if (op === 1) this._msg(payload.toString('utf8'));
    }
  }
  _msg(text) {
    let m;
    try { m = JSON.parse(text); } catch (e) { return; }
    if (m.id && this.pending.has(m.id)) {
      const { resolve, reject } = this.pending.get(m.id);
      this.pending.delete(m.id);
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result);
    }
    if (m.method && this.handlers.has(m.method)) {
      this.handlers.get(m.method).forEach((f) => f(m.params));
    }
  }
  send(method, params) {
    const id = ++this.id;
    const data = Buffer.from(JSON.stringify({ id, method, params: params || {} }));
    const mask = crypto.randomBytes(4);
    let header;
    if (data.length < 126) {
      header = Buffer.alloc(6);
      header[0] = 0x81; header[1] = 0x80 | data.length;
      mask.copy(header, 2);
    } else {
      header = Buffer.alloc(8);
      header[0] = 0x81; header[1] = 0x80 | 126;
      header.writeUInt16BE(data.length, 2);
      mask.copy(header, 4);
    }
    const masked = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i++) masked[i] = data[i] ^ mask[i % 4];
    this.sock.write(Buffer.concat([header, masked]));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }
  close() { try { this.sock.destroy(); } catch (e) { } }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let pass = 0, fail = 0;
  const t = (name, cond, detail) => {
    console.log((cond ? '  OK  ' : '  FAIL') + ' ' + name + (detail ? ' | ' + detail : ''));
    cond ? pass++ : fail++;
  };

  // 复用已有的 page target
  const tgt = await pickTarget();
  const ws = new WS(tgt.webSocketDebuggerUrl);
  await ws.connect();
  await ws.send('Runtime.enable');
  await ws.send('Page.enable');
  await ws.send('Network.enable');

  const evalJs = async (expr, awaitPromise) => {
    const r = await ws.send('Runtime.evaluate', {
      expression: expr, returnByValue: true, awaitPromise: !!awaitPromise,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' +
      (r.exceptionDetails.exception && r.exceptionDetails.exception.description || ''));
    return r.result && r.result.value;
  };

  console.log('=== 1. 打开页面，等待 SW 注册 ===\n');
  await ws.send('Page.navigate', { url: SITE + '/index.html' });
  await sleep(4000);

  const swState = await evalJs(`(async () => {
    if (!('serviceWorker' in navigator)) return { supported: false };
    const reg = await navigator.serviceWorker.getRegistration();
    return {
      supported: true,
      hasReg: !!reg,
      scope: reg ? reg.scope : null,
      active: reg && reg.active ? reg.active.state : null,
      controller: !!navigator.serviceWorker.controller,
    };
  })()`, true);

  t('浏览器支持 Service Worker', swState.supported === true);
  t('已注册', swState.hasReg === true, swState.scope);
  t('SW 状态为 activated', swState.active === 'activated', String(swState.active));

  console.log('\n=== 2. 缓存内容 ===\n');

  const cacheInfo = await evalJs(`(async () => {
    const keys = await caches.keys();
    const out = {};
    for (const k of keys) {
      const c = await caches.open(k);
      const reqs = await c.keys();
      out[k] = reqs.map(r => new URL(r.url).pathname).sort();
    }
    return out;
  })()`, true);

  const names = Object.keys(cacheInfo || {});
  t('存在缓存空间', names.length > 0, names.join(', '));

  const cached = names.length ? cacheInfo[names[0]] : [];
  console.log('  缓存资源 (' + cached.length + ' 项):');
  cached.forEach((p) => console.log('    ' + p));

  const need = ['/index.html', '/js/app.js', '/js/interpret.js', '/js/leap.js',
    '/js/lunar-table.js', '/js/store.js', '/js/export.js',
    '/vendor/iztro.min.js', '/css/style.css', '/manifest.webmanifest'];
  const missing = need.filter((n) => !cached.includes(n));
  t('核心资源全部已缓存', missing.length === 0,
    missing.length ? '缺: ' + missing.join(', ') : need.length + ' 项齐全');

  console.log('\n=== 3. 模拟离线后仍可使用 ===\n');

  await ws.send('Network.emulateNetworkConditions', {
    offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0,
  });
  await sleep(600);

  const offlineNav = await evalJs(`(async () => {
    try {
      const r = await fetch('./js/app.js', { cache: 'no-store' });
      const txt = await r.text();
      return { ok: r.ok, status: r.status, len: txt.length };
    } catch (e) { return { ok: false, err: String(e) }; }
  })()`, true);
  t('离线时 fetch 仍成功（走 SW 缓存）', offlineNav.ok === true,
    'status=' + offlineNav.status + ' len=' + offlineNav.len);

  // 关键：离线重新加载整个页面
  let navOk = false, navDetail = '';
  try {
    await ws.send('Page.navigate', { url: SITE + '/index.html' });
    await sleep(3500);
    const afterReload = await evalJs(`({
      ready: document.readyState,
      hasChart: !!document.getElementById('chart'),
      hasIztro: typeof window.iztro !== 'undefined',
      title: document.title,
    })`);
    navOk = afterReload.hasIztro === true && afterReload.hasChart === true;
    navDetail = 'readyState=' + afterReload.ready + ' iztro=' + afterReload.hasIztro +
      ' chart=' + afterReload.hasChart;
  } catch (e) {
    navDetail = '导航失败: ' + e.message;
  }
  t('离线状态下整页可加载（引擎已就位）', navOk, navDetail);

  // 更硬的验证：离线时真的能排盘
  const offlineChart = await evalJs(`(() => {
    try {
      if (!window.iztro) return { ok: false, why: 'iztro 未加载' };
      const a = window.iztro.astro.bySolar('2000-8-16', 6, '男', true, 'zh-CN');
      return { ok: true, ming: a.earthlyBranchOfSoulPalace, ju: a.fiveElementsClass };
    } catch (e) { return { ok: false, why: String(e) }; }
  })()`);
  t('离线时能完成排盘', offlineChart.ok === true,
    offlineChart.ok ? ('命宫 ' + offlineChart.ming + ' · ' + offlineChart.ju) : offlineChart.why);

  console.log('\n=== 4. 恢复网络 ===\n');
  await ws.send('Network.emulateNetworkConditions', {
    offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
  });
  await sleep(500);
  const backOnline = await evalJs(`navigator.onLine`);
  t('网络已恢复', backOnline === true, 'onLine=' + backOnline);

  ws.close();
  console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => {
  console.error('测试异常:', e.message);
  process.exit(2);
});