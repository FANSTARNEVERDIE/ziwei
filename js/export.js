/* ============================================================
 * 命盘导出为图片
 *
 * 用 Canvas 2D 直接绘制，不依赖任何外部库（离线可用）。
 * 之所以不用 SVG/foreignObject 方案：那会受字体与样式限制，
 * 且在不同浏览器下渲染差异很大；直接绘制结果完全可控。
 * ============================================================ */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.ZWExport = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {

  /* 配色：与页面主题保持一致 */
  const C = {
    bg: '#0a0908',
    panel: '#16130f',
    cellA: '#1e1a15',
    cellB: '#16130f',
    cellMing: '#2e2415',
    line: 'rgba(184,148,74,0.28)',
    lineSoft: 'rgba(184,148,74,0.12)',
    gold: '#b8944a',
    goldBright: '#dcbb6e',
    goldDim: '#7d6531',
    txt1: '#ebe5d8',
    txt2: '#a69d8c',
    txt3: '#6b6359',
    sha: '#96705f',
    lu: '#5f7f6a',
    quan: '#c9a24a',
    ke: '#5b7386',
    ji: '#a8503f',
  };

  const SERIF = '"Songti SC","STSong","SimSun","Noto Serif SC",serif';
  const SANS = '"PingFang SC","Microsoft YaHei",system-ui,sans-serif';

  /* 十二地支在 4×4 网格中的位置（与页面一致：寅在左下，顺时针） */
  const GRID_POS = {
    '巳': [1, 1], '午': [1, 2], '未': [1, 3], '申': [1, 4],
    '辰': [2, 1], '酉': [2, 4],
    '卯': [3, 1], '戌': [3, 4],
    '寅': [4, 1], '丑': [4, 2], '子': [4, 3], '亥': [4, 4],
  };

  const HUA_COLOR = { '禄': C.lu, '权': C.quan, '科': C.ke, '忌': C.ji };

  /**
   * 宫位显示名
   * iztro 的宫名里只有「命宫」自带「宫」字，其余是「田宅」「官禄」等，
   * 直接拼「宫」会得到「命宫宫」。
   */
  function palaceLabel(name) {
    if (!name) return '';
    return /宫$/.test(name) ? name : name + '宫';
  }

  /** 文本超宽时截断并加省略号 */
  function fitText(ctx, text, maxW) {
    if (!text) return '';
    if (ctx.measureText(text).width <= maxW) return text;
    let s = text;
    while (s.length > 1 && ctx.measureText(s + '…').width > maxW) {
      s = s.slice(0, -1);
    }
    return s + '…';
  }

  /** 圆角矩形路径 */
  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  /**
   * 把命盘绘制到 canvas
   * @param {object} astrolabe iztro 命盘
   * @param {object} opts { scale, liunian(horoscope), subtitle }
   * @returns {HTMLCanvasElement}
   */
  function drawChart(astrolabe, opts) {
    const o = opts || {};
    const scale = o.scale || 2;             // 2 倍分辨率，导出更清晰
    const cell = 210;                        // 单格逻辑尺寸
    const gap = 1;
    const pad = 30;
    const headH = 92;
    const footH = 54;

    const gridW = cell * 4 + gap * 3;
    const W = gridW + pad * 2;
    const H = headH + gridW + footH + pad;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    /* 背景 */
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    /* 顶部信息 */
    const a = astrolabe;
    let y = pad + 6;
    ctx.textBaseline = 'top';

    ctx.fillStyle = C.goldBright;
    ctx.font = `500 26px ${SERIF}`;
    ctx.fillText('紫微斗數 · 命盤', pad, y);
    y += 38;

    ctx.font = `400 14px ${SANS}`;
    ctx.fillStyle = C.txt2;
    const line1 = `${a.gender}命 · ${a.fiveElementsClass}　|　阳历 ${a.solarDate}　|　农历 ${a.lunarDate}　|　${a.time || ''}`;
    ctx.fillText(fitText(ctx, line1, W - pad * 2), pad, y);
    y += 22;

    ctx.fillStyle = C.txt3;
    const line2 = `四柱 ${a.chineseDate}　|　命宫 ${a.earthlyBranchOfSoulPalace}　|　身宫 ${a.earthlyBranchOfBodyPalace}　|　命主 ${a.soul}　|　身主 ${a.body}`;
    ctx.fillText(fitText(ctx, line2, W - pad * 2), pad, y);

    /* 盘面 */
    const gridX = pad;
    const gridY = pad + headH;

    const h = o.liunian;
    const lnNames = h && h.yearly.palaceNames ? h.yearly.palaceNames : null;
    const curDx = findCurrentDaxian(a, h);

    // 12 宫
    a.palaces.forEach((p) => {
      const pos = GRID_POS[p.earthlyBranch];
      if (!pos) return;
      const [row, col] = pos;
      const x = gridX + (col - 1) * (cell + gap);
      const yy = gridY + (row - 1) * (cell + gap);

      const isMing = p.name === '命宫';
      const isLnMing = !!(lnNames && lnNames[p.index] === '命宫');
      const isCurDx = p.index === curDx;

      // 底色
      ctx.fillStyle = isMing ? C.cellMing : C.cellA;
      ctx.fillRect(x, yy, cell, cell);

      // 高亮描边
      if (isLnMing) {
        ctx.strokeStyle = C.ji;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, yy + 1, cell - 2, cell - 2);
      } else if (isCurDx) {
        ctx.strokeStyle = C.gold;
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 1, yy + 1, cell - 2, cell - 2);
      } else if (isMing) {
        ctx.strokeStyle = 'rgba(184,148,74,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, yy + 0.5, cell - 1, cell - 1);
      }

      // 宫头：宫名 + 干支
      const tx = x + 12;
      let ty = yy + 11;
      ctx.font = `500 15px ${SERIF}`;
      ctx.fillStyle = isMing ? C.goldBright : C.gold;
      ctx.textAlign = 'left';
      ctx.fillText(fitText(ctx, palaceLabel(p.name), cell - 70), tx, ty);

      ctx.font = `500 13px ${SERIF}`;
      ctx.fillStyle = C.txt3;
      ctx.textAlign = 'right';
      ctx.fillText(p.heavenlyStem + p.earthlyBranch, x + cell - 12, ty);
      ctx.textAlign = 'left';

      // 分隔线
      ty += 24;
      ctx.strokeStyle = C.lineSoft;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, ty - 7);
      ctx.lineTo(x + cell - 12, ty - 7);
      ctx.stroke();

      // 大限区间
      ctx.font = `400 11px ${SANS}`;
      ctx.fillStyle = isCurDx ? C.goldBright : C.txt3;
      const dxRange = p.decadal ? p.decadal.range.join('-') + '岁' : '';
      ctx.fillText(dxRange, tx, ty);
      ty += 20;

      // 星曜
      const drawStars = (list, kind) => {
        list.forEach((s) => {
          if (ty > yy + cell - 30) return;   // 超出格子的不再画
          const size = kind === 'major' ? 15 : 13;
          const weight = kind === 'major' ? 600 : 500;
          ctx.font = `${weight} ${size}px ${SERIF}`;
          const nameW = ctx.measureText(s.name).width;

          ctx.fillStyle = kind === 'major' ? C.txt1
            : kind === 'aux' ? '#b3a996' : C.sha;
          ctx.fillText(s.name, tx, ty);

          // 亮度
          let cx = tx + nameW + 3;
          if (s.brightness && ['庙', '旺', '得', '利', '平', '不', '陷'].includes(s.brightness)) {
            ctx.font = `400 10px ${SANS}`;
            ctx.fillStyle = kind === 'major' ? C.goldDim : C.txt3;
            ctx.fillText(s.brightness, cx, ty + 3);
            cx += ctx.measureText(s.brightness).width + 4;
          }

          // 四化标记
          if (s.mutagen) {
            const t = s.mutagen;
            ctx.font = `700 10px ${SANS}`;
            const tw = 11;
            ctx.fillStyle = HUA_COLOR[t] || C.gold;
            roundRect(ctx, cx, ty + 1, tw, 14, 2);
            ctx.fill();
            ctx.fillStyle = t === '科' ? '#eef3f7' : '#17120a';
            ctx.textAlign = 'center';
            ctx.fillText(t, cx + tw / 2, ty + 4);
            ctx.textAlign = 'left';
          }
          ty += size + 7;
        });
      };

      const major = p.majorStars;
      const soft = p.minorStars.filter((s) => s.type === 'soft' || s.type === 'lucun' || s.type === 'tianma');
      const tough = p.minorStars.filter((s) => s.type === 'tough');

      if (major.length) {
        drawStars(major, 'major');
      } else {
        ctx.font = `400 13px ${SANS}`;
        ctx.fillStyle = 'rgba(166,157,140,0.45)';
        ctx.fillText('无主星', tx, ty);
        ty += 20;
      }
      ty += 3;
      drawStars(soft, 'aux');
      ty += 3;
      drawStars(tough, 'sha');

      // 身宫 / 流年命宫角标
      ctx.font = `500 10px ${SERIF}`;
      if (p.isBodyPalace) {
        ctx.fillStyle = C.ji;
        ctx.textAlign = 'right';
        ctx.fillText('身宫', x + cell - 12, yy + cell - 18);
        ctx.textAlign = 'left';
      }
      if (isLnMing) {
        ctx.fillStyle = C.ji;
        ctx.fillText('流年命宫', tx, yy + cell - 18);
      }
    });

    /* 中心区 */
    const cx0 = gridX + (cell + gap);
    const cy0 = gridY + (cell + gap);
    const cw = cell * 2 + gap;
    ctx.fillStyle = '#0f0c0a';
    ctx.fillRect(cx0, cy0, cw, cw);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(cx0 + 0.5, cy0 + 0.5, cw - 1, cw - 1);

    let my = cy0 + cw / 2 - 74;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.goldBright;
    ctx.font = `500 19px ${SERIF}`;
    ctx.fillText('紫微命盤', cx0 + cw / 2, my);
    my += 34;

    ctx.font = `400 13px ${SANS}`;
    const rows = [
      ['命宫', a.earthlyBranchOfSoulPalace],
      ['身宫', a.earthlyBranchOfBodyPalace],
      ['五行局', a.fiveElementsClass],
      ['命主', a.soul],
      ['身主', a.body],
    ];
    rows.forEach(([k, v]) => {
      ctx.fillStyle = C.txt3;
      ctx.font = `400 13px ${SANS}`;
      ctx.textAlign = 'right';
      ctx.fillText(k, cx0 + cw / 2 - 8, my);
      ctx.fillStyle = C.goldBright;
      ctx.font = `500 13px ${SERIF}`;
      ctx.textAlign = 'left';
      ctx.fillText(String(v), cx0 + cw / 2 + 8, my);
      my += 21;
    });

    // 本命四化
    my += 8;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.goldDim;
    ctx.font = `400 11px ${SANS}`;
    ctx.fillText('本命四化', cx0 + cw / 2, my);
    my += 18;

    const sihua = [];
    a.palaces.forEach((p) => {
      [...p.majorStars, ...p.minorStars].forEach((s) => {
        if (s.mutagen) sihua.push({ star: s.name, hua: s.mutagen, palace: p.name });
      });
    });
    // 化忌排最前（最需要注意），其余按 禄→权→科
    const order = { '忌': 0, '禄': 1, '权': 2, '科': 3 };
    sihua.sort((x, y) => order[x.hua] - order[y.hua]);

    sihua.forEach((x) => {
      const label = `${x.star}化${x.hua}`;
      ctx.textAlign = 'right';
      ctx.font = `500 12.5px ${SERIF}`;
      ctx.fillStyle = HUA_COLOR[x.hua] || C.gold;
      ctx.fillText(label, cx0 + cw / 2 - 8, my);

      ctx.textAlign = 'left';
      ctx.font = `400 11.5px ${SANS}`;
      ctx.fillStyle = C.txt3;
      ctx.fillText(palaceLabel(x.palace), cx0 + cw / 2 + 8, my);
      my += 18;
    });
    ctx.textAlign = 'left';

    /* 页脚 */
    const fy = gridY + gridW + 24;
    ctx.font = `400 11.5px ${SANS}`;
    ctx.fillStyle = C.txt3;
    ctx.textAlign = 'center';
    ctx.fillText('命理內容為傳統文化參考，不構成決策依據', W / 2, fy);
    if (o.subtitle) {
      ctx.fillText(fitText(ctx, o.subtitle, W - pad * 2), W / 2, fy + 18);
    }
    ctx.textAlign = 'left';

    return canvas;
  }

  /** 找到当前虚岁所处的大限宫位 */
  function findCurrentDaxian(astrolabe, horoscope) {
    if (!horoscope || !horoscope.age) return -1;
    const age = horoscope.age.nominalAge;
    const p = astrolabe.palaces.find((x) =>
      x.decadal && age >= x.decadal.range[0] && age <= x.decadal.range[1]);
    return p ? p.index : -1;
  }

  /** 触发下载 */
  function downloadCanvas(canvas, filename) {
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('toBlob failed')); return; }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename || 'ziwei-chart.png';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(() => URL.revokeObjectURL(url), 4000);
          resolve(true);
        }, 'image/png');
      } catch (e) { reject(e); }
    });
  }

  return { drawChart, downloadCanvas, findCurrentDaxian, fitText, GRID_POS };
});