# 事间

事间是一个本地优先的个人工作台。用它随手记下待办，在月历里回顾做完的事，也给喝水和走动留一点时间。

[产品介绍](https://itcwc.github.io/shijian-workbench/) · [打开网页版](https://itcwc.github.io/shijian-workbench/app/)

## 功能

- **任务管理**　按关键词、颜色和完成状态查找任务，支持置顶与拖动排序。
- **快捷记录**　可拖动的悬浮按钮，靠近窗口边缘时可吸附。
- **月历复盘**　按日期和彩点查看已完成的任务，支持按颜色筛选和悬停预览。
- **健康提醒**　分别设置喝水和走动的时间范围与间隔。使用桌面通知时，请允许浏览器通知并保持页面打开。
- **主题与备份**　支持浅色、暗色主题，可将任务和主题偏好导出为 JSON 文件并导入恢复。

无需登录即可使用。数据保存在当前浏览器中。换设备、换访问地址或清理浏览器数据前，可先在「系统设置 → 数据备份」导出备份。

## 本地运行

使用 Node.js 24 和 npm。

```sh
npm ci
npm run dev
```

在浏览器打开 `http://127.0.0.1:5188`。

- `npm run dev:site` 在 `http://127.0.0.1:5189` 单独开发宣传页；同时运行工作台时，“打开网页版”会跳转到 5188。
- `npm run typecheck` 检查 Web 工作台类型。
- `npm run build:web` 单独构建工作台至 `dist/`，`npm run preview` 预览该产物。
- `npm run build:site` 仅构建宣传页至 `product-site/dist/`，不构建或清除其中已有的工作台。
- `npm run build` 构建宣传页及工作台至 `product-site/dist/`，用于完整预览及 GitHub Pages 发布。
- `npm run preview:site` 在 `http://127.0.0.1:5181` 预览完整站点；请先运行 `npm run build`。

当前可使用网页版。桌面版与 Android 版筹备中。

## 目录结构

```text
web/             Vue 工作台源码、入口、Vite 与 TypeScript 配置
site/            宣传页内容、样式、截图及开发配置
desktop/         桌面客户端预留
mobile/          移动客户端预留
packages/brand/  两端共用的品牌标识样式与图标
scripts/         宣传页构建与完整站点组装
docs/            设计审计、交付和目录迁移记录
```

根目录统一管理依赖、锁文件与命令，暂不引入 workspaces 或新增客户端框架。Web 的全局组件及自动导入声明生成在 `web/`。当前静态公共资源来自 `packages/brand/`；宣传页专用 Tokens 和工作台主题独立维护。

源码目录与发布地址独立：宣传页部署在站点根路径，工作台仍部署在 `/app/`。目录迁移保留现有本地端口、存储键、JSON 格式和业务行为。完整发布流程见 `.github/workflows/pages.yml`，目录职责与迁移验收见 [目录说明](docs/PROJECT_STRUCTURE.md)。

## 视觉规范与验收

宣传页采用冷静克制的蓝色。宣传页的颜色、字体、圆角及阴影集中在 `site/tokens.css`，页面样式位于 `site/product.css`。品牌标识位于 `packages/brand/`，宣传页通过自身样式设置蓝色。工作台保留原有界面与功能，视觉与计划任务改造暂缓。

宣传页的 `site/screenshots/` 使用实际 App 截图，尺寸为 1440 × 1000。手机宣传页按比例展示同一张真实截图，支持打开大图。界面调整后，应使用不含个人数据的本地预览重新截图，并运行 `npm run build:site` 复制资源。截图说明见该目录的 README。

设计审计见 [DESIGN_AUDIT.md](docs/DESIGN_AUDIT.md)，宣传页改造和验收记录见 [VISUAL_UPDATE_REPORT.md](docs/VISUAL_UPDATE_REPORT.md)。这两份文档保留各自记录时的历史路径，当前目录以目录说明为准。

## 许可证

[MIT](LICENSE)
