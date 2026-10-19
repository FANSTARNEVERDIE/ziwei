/* 验证真太阳时校正（修复版） */
function hourToTimeIndex(hour) {
  const h = ((hour % 24) + 24) % 24;
  if (h === 23) return 12;
  return Math.floor((h + 1) / 2);
}
function applyTrueSolar(dateStr, timeIndex, longitude) {
  const [yy, mm, dd] = dateStr.split('-').map(Number);
  const lonDiff = (longitude - 120) * 4;
  const dt = new Date(Date.UTC(yy, mm - 1, dd));
  const doy = Math.floor((dt - Date.UTC(yy, 0, 1)) / 86400000) + 1;
  const B = (2 * Math.PI * (doy - 81)) / 364;
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const SHICHEN_MID = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 23];
  const midHour = SHICHEN_MID[timeIndex] !== undefined ? SHICHEN_MID[timeIndex] : 12;
  let totalMin = midHour * 60 + 30 + lonDiff + eot;
  let dayShift = 0;
  while (totalMin < 0) { totalMin += 1440; dayShift--; }
  while (totalMin >= 1440) { totalMin -= 1440; dayShift++; }
  const nd = new Date(Date.UTC(yy, mm - 1, dd + dayShift));
  const newDateStr = nd.getUTCFullYear() + '-' + (nd.getUTCMonth() + 1) + '-' + nd.getUTCDate();
  return { dateStr: newDateStr, timeIndex: hourToTimeIndex(Math.floor(totalMin / 60)) };
}

const NAMES = ['早子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时',
  '申时', '酉时', '戌时', '亥时', '晚子时'];

console.log('=== 真太阳时校正（修复后）===\n');
const tests = [
  ['1995-3-15', 0, 87.6, '乌鲁木齐 早子时'],
  ['1995-3-15', 6, 87.6, '乌鲁木齐 午时'],
  ['1995-3-15', 6, 120, '东经120 午时(基准)'],
  ['1995-3-15', 11, 134, '黑龙江 亥时'],
  ['1995-6-21', 6, 79, '喀什 午时'],
  ['2000-8-16', 6, 116.4, '北京 午时'],
  ['2000-8-16', 0, 121.5, '上海 早子时'],
];
for (const [d, t, lon, note] of tests) {
  const c = applyTrueSolar(d, t, lon);
  const changed = c.dateStr !== d || c.timeIndex !== t;
  console.log(
    note.padEnd(20) +
    '原 ' + d + ' ' + NAMES[t].padEnd(4) +
    ' -> 校正 ' + c.dateStr + ' ' + NAMES[c.timeIndex].padEnd(4) +
    (changed ? ' [已修正]' : ' [无变化]')
  );
}

let pass = 0, fail = 0;
function check(label, cond, detail) {
  console.log((cond ? '  OK  ' : '  FAIL') + ' ' + label + (detail ? ' | ' + detail : ''));
  cond ? pass++ : fail++;
}

console.log('\n=== 关键用例 ===');
const c1 = applyTrueSolar('1995-3-15', 0, 87.6);
check('乌鲁木齐早子时 -> 前一日亥时',
  c1.dateStr === '1995-3-14' && c1.timeIndex === 11,
  c1.dateStr + ' ' + NAMES[c1.timeIndex]);

const c2 = applyTrueSolar('2000-8-16', 12, 87.6);
check('乌鲁木齐晚子时(23:30) -> 同日亥时',
  c2.dateStr === '2000-8-16' && c2.timeIndex === 11,
  c2.dateStr + ' ' + NAMES[c2.timeIndex]);

const c3 = applyTrueSolar('2000-8-16', 6, 120);
check('东经120 午时 -> 不变',
  c3.dateStr === '2000-8-16' && c3.timeIndex === 6,
  c3.dateStr + ' ' + NAMES[c3.timeIndex]);

const c4 = applyTrueSolar('2000-8-16', 6, 135);
check('东经135 午时 -> 未时(经度+60分)',
  c4.timeIndex === 7, NAMES[c4.timeIndex]);

console.log('\n结果: ' + pass + ' 通过, ' + fail + ' 失败');