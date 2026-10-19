# 部署到 Cloudflare

本项目是纯静态站点（无后端、无构建步骤），部署很简单。下面按**推荐程度**给出三种方式。

---

## 准备：打包产物

```bash
node tools/build-dist.js
```

会生成 `dist/` 目录（15 个文件，约 750 KB），并自动自检：

- `index.html` 的所有引用是否都存在
- `sw.js` 预缓存清单里的文件是否都存在

自检不通过会直接报错退出，不会让你把坏产物传上去。

> **为什么要有这一步**：`dist/` 是**白名单**打包，只包含网站真正需要的文件。
> 测试脚本（`test-*.js`）、开发工具（`tools/`）、截图（`demo/`）、README
> 都不会被上传——既减小体积，也避免把测试代码暴露到公网。

---

## 方式一：Cloudflare Pages + Git（推荐）

推送到 GitHub/GitLab 后，Cloudflare 每次提交自动重新部署，还能拿到预览链接。

### 1. 建仓库并推送

```bash
cd ziwei
git init
git add .
git commit -m "紫微斗数排盘站"

# 在 GitHub 上建一个空仓库，然后：
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git branch -M main
git push -u origin main
```

建议加 `.gitignore`（若尚无）：

```
node_modules/
dist/
*.log
```

> `dist/` 不入库：它由 `build-dist.js` 生成，交给 Cloudflare 现跑即可。

### 2. 在 Cloudflare 建 Pages 项目

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧 **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. 授权并选择你的仓库
4. 构建配置填：

   | 字段 | 值 |
   |---|---|
   | Framework preset | `None` |
   | Build command | `node tools/build-dist.js` |
   | Build output directory | `dist` |

5. **Save and Deploy**

首次部署约 1 分钟。完成后会给你一个 `https://<项目名>.pages.dev` 地址。

### 3. 后续更新

```bash
git add .
git commit -m "更新说明"
git push
```

Cloudflare 自动重新部署。

> ⚠️ **每次发版记得改 `sw.js` 里的 `VERSION`**（例如 `ziwei-v2` → `ziwei-v3`）。
> 不改的话，已经访问过的用户会一直用旧缓存，看不到你的更新。
> （旧缓存会在新 SW 激活时被自动清理，页面也会弹出「有新版本可用」提示。）

---

## 方式二：Wrangler 直接上传（不建仓库）

适合只想快速上线一次。

```bash
# 打包
node tools/build-dist.js

# 登录（会打开浏览器授权）
npx wrangler login

# 部署
npx wrangler pages deploy dist --project-name=ziwei
```

第一次会让你创建项目，之后每次改完重新跑这两条命令即可。

> `npx wrangler` 会临时下载 wrangler，不需要预先全局安装。

---

## 方式三：拖拽上传（最快，但每次都要手动）

```bash
node tools/build-dist.js
```

然后：

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**
2. 项目名填 `ziwei`
3. 把 `dist/` 目录**里的内容**拖进去（不是拖 `dist` 文件夹本身）
4. **Deploy**

缺点：每次更新都要手动重传，且没有 Git 历史。

---

## 部署后必须验证的事

Cloudflare 会分配一个域名，但 **HTTPS 是 Service Worker 的硬性前提**——`http://` 下无法注册。`*.pages.dev` 默认带 HTTPS，所以这一步通常自动满足。

部署完成后请实际打开站点确认：

1. **能正常排盘** —— 输入生日，出盘
2. **Service Worker 已激活** —— F12 → Application → Service Workers，状态应为 `activated`
3. **离线可用** —— Application → Cache Storage → 应看到 `ziwei-v2`；勾选 Network 的 Offline 后刷新，**仍能排盘**
4. **可安装** —— 地址栏右侧出现安装图标（Chrome/Edge）

本仓库提供了一个自动化的同款验证脚本，可以直接对着线上地址跑：

```bash
# 把 CDP 测试指向线上站点
$env:ZW_SITE="https://<你的项目>.pages.dev"   # PowerShell
# export ZW_SITE="https://<你的项目>.pages.dev"  # bash

node tools/run-sw-test.js
```

> `run-sw-test.js` 会自己起浏览器与调试端口。注意它默认连本地服务，
> 用 `ZW_SITE` 指向线上时，本地的 `serve.js` 起不起来都不影响测试结果。

---

## 已包含的 Cloudflare 配置

仓库里的 `_headers` 文件会被 Cloudflare Pages 自动识别，作用是：

| 配置 | 为什么需要 |
|---|---|
| `/sw.js` → `no-store` | **关键**。SW 若被缓存，用户永远拿不到新版本 |
| `manifest.webmanifest` → 正确 MIME | 否则浏览器可能不认 PWA 清单 |
| `/vendor/*` → 一年长缓存 | iztro 引擎不会变，避免重复下载 |
| HTML → `no-cache` | 保证入口总是最新 |
| 安全响应头 | `nosniff`、`Referrer-Policy`、`X-Frame-Options` 等 |

`_redirects` 目前**不需要**：本站是单页，且没有前端路由，
所有分享链接都是 `?d=...` 查询串形式，Cloudflare 默认就能正确处理。

---

## 常见问题

**Q：部署后样式/脚本 404？**
检查构建输出目录是否填了 `dist`（而不是仓库根目录）。可以用 `node tools/build-dist.js` 的自检先本地确认。

**Q：改了代码，线上还是旧的？**
两件事都要做：① 推送新代码；② 改 `sw.js` 的 `VERSION`。只做①的话，老用户会被 SW 缓存挡住。

**Q：能用自己域名吗？**
可以。Pages 项目 → Custom domains → 添加域名。若域名已托管在 Cloudflare，会自动配好 DNS 与证书。

**Q：需要配置 CORS 或环境变量吗？**
不需要。本站无后端、无外部 API，全部计算在浏览器本地完成，连生辰都不上传。

**Q：国内访问速度如何？**
`*.pages.dev` 在国内的可达性不稳定。若主要面向国内用户，建议绑定自己的域名并接入 CDN，或改用国内托管（注意：国内托管需要 ICP 备案）。