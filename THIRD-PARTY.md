# 第三方组件

本项目**运行时**只依赖一个第三方库。所有计算都在浏览器本地完成，没有任何服务端依赖。

---

## iztro（紫微斗数排盘引擎）

| 项 | 值 |
|---|---|
| 版本 | 2.6.3 |
| 许可证 | MIT |
| 作者 | All Contributors |
| 仓库 | https://github.com/SylarLong/iztro |

### 使用方式

引擎以 UMD 形式打包在 `vendor/iztro.min.js`（464.7 KB），由 `index.html` 直接以 `<script>` 引入，
不使用任何包管理器，也不需要构建步骤。

浏览器端访问方式：`window.iztro.astro.bySolar(...)` / `window.iztro.astro.byLunar(...)`

### 为什么放在 vendor 里而不是用 CDN

1. **离线可用**：本站是 PWA，断网时仍要能排盘。CDN 会让离线功能失效。
2. **隐私**：加载第三方 CDN 会把访问者 IP 暴露给 CDN 提供商，与本站「生辰只在本机处理」的定位冲突。
3. **稳定性**：CDN 挂掉或改路径不会影响本站。

### npm 依赖说明

`package.json` 里 `iztro` 位于 `devDependencies`，**仅供 Node 测试脚本做对照验证**使用
（例如 `test-leap.js` 会用 iztro 实时探测闰月，与预生成的查找表比对）。

网站本身**不读取 `node_modules`**。因此部署时无需安装依赖，`npm install` 也可以完全跳过。

---

## MIT 许可证原文

iztro 采用 MIT 许可证，完整文本如下：

```
MIT License

Copyright (c) 2023 All Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 本项目自身的第三方资源

以下内容为本项目原创或从公开历法数据推导，不涉及第三方授权：

| 内容 | 说明 |
|---|---|
| 白话解读知识库 | `js/interpret.js`，本项目原创文案 |
| 农历闰月查找表 | `js/lunar-table.js`，由 `tools/gen-leap-table.js` 依据历法事实生成 |
| PWA 图标 | 由 `tools/make-icons.js` 以纯 Node 绘制生成 |
| 排盘渲染、导出、动效 | 全部本项目自写，无第三方库 |

未使用任何图标字体、UI 框架、动画库或 CSS 框架。