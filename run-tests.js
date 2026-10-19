/* 跑全部测试
 *
 * 用法：node run-tests.js   或   npm test
 *
 * 分组原因：部分测试较慢（闰月表比对约 3.4 秒），
 * 分开跑便于定位是哪一组挂了。
 */
const { spawnSync } = require('child_process');
const path = require('path');

const ROOT = __dirname;

/* [脚本, 是否默认运行]
 * SW 离线测试需要浏览器，单独用 npm run test:sw 跑 */
const SUITES = [
  ['test-e2e.js', true],
  ['test-chart-html.js', true],
  ['test-interpret.js', true],
  ['test-daily.js', true],
  ['test-compat.js', true],
  ['test-store.js', true],
  ['test-pwa.js', true],
  ['test-edge.js', true],
  ['test-truesolar-v2.js', true],
  ['test-fixes.js', true],
  ['test-leap.js', true],
  ['test-leap-e2e.js', true],
];

const results = [];
let failed = 0;

console.log('运行测试套件…\n');

SUITES.forEach(([file, enabled]) => {
  if (!enabled) return;
  const name = file.replace(/^test-/, '').replace(/\.js$/, '');
  process.stdout.write('  ' + name.padEnd(16));
  const t0 = Date.now();
  const r = spawnSync(process.execPath, [path.join(ROOT, file)], {
    cwd: ROOT, encoding: 'utf8',
  });
  const ms = Date.now() - t0;
  const out = (r.stdout || '') + (r.stderr || '');

  // 取最后一行的结果摘要
  const lines = out.trim().split('\n').filter((l) => l.trim());
  const last = lines[lines.length - 1] || '';

  if (r.status === 0) {
    console.log('✓ ' + last.replace(/^结果:\s*/, '').replace(/^===\s*|\s*===$/g, '') +
      '  (' + ms + 'ms)');
    results.push({ name, ok: true, ms });
  } else {
    console.log('✗ 失败 (exit ' + r.status + ', ' + ms + 'ms)');
    console.log('--- 输出 ---');
    console.log(out.split('\n').slice(-25).join('\n'));
    console.log('------------');
    failed++;
    results.push({ name, ok: false, ms });
  }
});

console.log('\n' + '='.repeat(46));
const totalMs = results.reduce((s, r) => s + r.ms, 0);
console.log(results.length + ' 组套件，' + failed + ' 组失败，共 ' + (totalMs / 1000).toFixed(1) + 's');
console.log('='.repeat(46));

if (failed) {
  console.log('\n失败的套件: ' + results.filter((r) => !r.ok).map((r) => r.name).join(', '));
}
console.log('\n提示: Service Worker 离线测试需真实浏览器，单独运行 npm run test:sw');

process.exit(failed ? 1 : 0);