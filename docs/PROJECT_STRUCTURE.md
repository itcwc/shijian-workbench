# 事间目录结构与维护约定

目录整理日期：2026-11-25。

## 目录职责

| 目录 | 职责 |
| --- | --- |
| `web/` | 实际 Vue 工作台、业务组件、数据模块、工作台样式及配置 |
| `site/` | 宣传页内容、专用 Tokens、布局、截图和开发预览配置 |
| `desktop/` | 桌面客户端预留，目前仅有说明文件 |
| `mobile/` | 移动客户端预留，目前仅有说明文件 |
| `packages/brand/` | 共享品牌样式 `brand.css` 与图标 `shijian-icon.svg` |
| `scripts/` | 宣传页静态构建与完整站点组装 |
| `docs/` | 设计、交付与结构说明 |

根目录保留一份 `package.json` 和 `package-lock.json`，不增加工作区包、框架或依赖。后续客户端落地后，再按实际复用需求提取业务模块。

## 依赖边界

- 宣传页和工作台分别使用 `packages/brand/`，宣传页不读取 `web/src/`。
- Web 通过 `web/src/main.ts` 导入共享品牌样式；两端 Vite 的公共资源目录指向 `packages/brand/`，图标访问路径仍为 `shijian-icon.svg`。
- 宣传页通过自身 `tokens.css` 和 `product.css` 定义主题；工作台继续使用原有 `web/src/styles.css` 及主题模块。
- 工作台业务组件与数据模块保持原内容；仅入口中的品牌样式导入路径调整。
- 桌面与移动端不复制 Web 业务代码，不在本次目录整理中实现新功能。

## 开发和构建

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Web，地址 `http://127.0.0.1:5188` |
| `npm run dev:site` | 启动宣传页，地址 `http://127.0.0.1:5189` |
| `npm run typecheck` | 按 `web/tsconfig.json` 检查工作台类型 |
| `npm run build:web` | 类型检查后构建独立 Web 至根目录 `dist/` |
| `npm run build:site` | 复制宣传页及品牌资源至 `product-site/dist/` |
| `npm run build` | 类型检查后构建完整发布站点至 `product-site/dist/` |
| `npm run preview` | 预览独立 Web 构建 |
| `npm run preview:site` | 在 5181 端口预览完整发布站点 |

宣传页开发服务中的 `/app/` 入口会跳转到 5188 的 Web 开发服务，因此联调时需同时运行两个开发命令。正式构建与完整预览仍使用相对路径 `/app/`，不包含此开发跳转。

宣传页独立构建不构建 Web，也不清除输出目录内已有的 `app/`。全新检出后，如需预览工作台入口，应先执行完整构建。组合构建只清理并重建 `product-site/dist/app/` 中的工作台产物。

Web 的独立构建输出继续位于根目录 `dist/`。发布输出继续为：

```text
product-site/dist/
├─ index.html                 宣传页
├─ product.css
├─ tokens.css
├─ brand.css
├─ preview.js
├─ shijian-icon.svg
├─ screenshots/
└─ app/                       Web 工作台
   ├─ index.html
   ├─ shijian-icon.svg
   └─ assets/
```

GitHub Pages 工作流使用 `npm ci`、`npm run build`，上传目录仍为 `product-site/dist/`。

## 配置与生成文件

- Web 的 Vite 和 TypeScript 配置位于 `web/`，宣传页 Vite 配置位于 `site/`。
- 自动导入和全局组件声明分别生成在 `web/auto-imports.d.ts`、`web/components.d.ts`，组件扫描范围限定为 `web/src/components/`。
- Node 配置的临时输出定位到根目录 `node_modules/.tmp/`。
- 两端配置与构建脚本通过 `scripts/project-paths.mjs` 统一解析仓库绝对路径；其类型声明位于同目录，不新增 Node 类型依赖。
- 品牌目录当前只放可公开的 CSS 和 SVG 资源，两端开发与构建会将其作为公共静态资源。
- 构建产物、依赖和本地验收截图继续按根目录 `.gitignore` 忽略。

## 行为与数据约束

此次仅移动文件和调整工程路径，不修改工作台视觉、任务操作、提醒逻辑、主题行为、存储键或 JSON 备份格式。保留用户原有的 5188 端口设置。

线上仍为站点根路径宣传页、`/app/` 工作台；`mobile/` 是源码目录名称，不代表线上访问路径。目录迁移不迁移浏览器数据，也不修改访问域名或协议。

`DESIGN_AUDIT.md` 和 `VISUAL_UPDATE_REPORT.md` 保留撰写时的历史内容，其中提到的根目录 `src/`、`public/` 等旧路径以本说明为准。

## 迁移验收

验收覆盖工作台类型检查、独立 Web 构建、宣传页独立构建、完整站点构建、公共资源及源码一致性核对，并通过浏览器验证开发与发布预览。

| 检查 | 执行结果 |
| --- | --- |
| Web 类型检查 | `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p web/tsconfig.json` 通过 |
| Vite 配置类型检查 | `node node_modules/typescript/bin/tsc --build web/tsconfig.node.json --pretty false` 通过 |
| 独立 Web 构建 | `node node_modules/vite/bin/vite.js build --config web/vite.config.ts` 通过，输出根目录 `dist/` |
| 宣传页独立构建 | `node scripts/build-site.mjs` 通过；前后比对 `app/` 中全部文件摘要，未发生改变 |
| 完整站点构建 | `node scripts/build-product-site.mjs` 通过，输出目录与发布路径保持一致 |
| 源码一致性 | 除入口导入路径外，17 个源文件逐字节保持一致；图标内容与原版一致 |
| 主产物一致性 | 工作台 CSS 和 JS 文件仍为 `index-CubG5ryn.css`、`index-OjVEk_0_.js` |
| 依赖一致性 | 原有依赖与锁文件保持不变 |
| 资源与路径 | 品牌资源复制正确，工作台 HTML 引用的构建资源均存在，声明文件留在 `web/` |
| 宣传页开发预览 | 5189 页面、品牌样式、截图页签正常；使用入口跳转 5188 工作台成功 |
| 发布预览 | 5181 宣传页及 `/app/` 工作台正常，任务、复盘、健康提醒入口可见 |
| 响应式核对 | 宣传页 1440 和 390 宽度实览通过，手机无横向溢出 |
| 浏览器日志 | 本次预览检查未发现 warning 或 error |
| 差异格式检查 | `git diff --check` 通过 |

当前执行环境提供 Node，未提供 npm 命令，因此验证使用上述脚本对应的 Node 命令；根目录 npm 脚本及 GitHub Actions 使用标准 npm 环境运行。项目没有现成测试脚本或测试框架，本次未新增测试框架。

本地验收截图保存于 `.screenshots/structure-migration/`，不随源码发布。GitHub 提交与线上部署状态以仓库提交和发布记录为准。
