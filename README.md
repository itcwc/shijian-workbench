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

- `npm run build` 构建工作台至 `dist/`。
- `npm run build:site` 构建宣传页及工作台至 `product-site/dist/`。
- `npm run preview:site` 在本地预览完整站点。

当前可使用网页版。桌面版与 Android 版筹备中。

## 视觉规范与验收

本次改造仅涉及 Landing Page，采用冷静克制的蓝色。宣传页的颜色、字体、圆角及阴影集中在 `site/tokens.css`，页面样式位于 `site/product.css`。沿用原有 `src/brand.css` 品牌标识，通过宣传页自身样式设置蓝色。App 已还原，后续视觉与计划任务改造暂缓。

宣传页的 `site/screenshots/` 使用还原后的实际 App 截图，尺寸为 1440 × 1000。手机宣传页按比例展示同一张真实截图，支持打开大图。界面调整后，应使用不含个人数据的本地预览重新截图，并运行 `npm run build:site` 复制资源。截图说明见该目录的 README。

设计审计见 `DESIGN_AUDIT.md`，本次改造和验收记录见 `VISUAL_UPDATE_REPORT.md`。

## 许可证

[MIT](LICENSE)
