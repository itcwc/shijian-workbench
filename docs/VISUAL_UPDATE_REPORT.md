# 事间宣传页蓝色改造交付报告

日期：2026-11-25（Asia/Hong_Kong）

状态：本地实现与验证完成，等待用户验收。

## 1. 本次范围与还原结果

以用户最新要求为准：只调整宣传页，主题采用偏向冷静思考的蓝色；撤销上一轮 App 改造；App 及计划任务相关改造延后。

已按 Git HEAD 还原全部上一轮修改的 App 文件：

- `src/App.vue`、`src/main.ts`、`src/styles.css`、`src/brand.css`。
- `src/components/DataBackup.vue`、`HealthReminders.vue`、`QuickCapture.vue`、`ReviewCalendar.vue`、`TaskBoard.vue`、`TaskColorFilter.vue`、`TaskColorPicker.vue`、`ThemeSettings.vue`。
- 根目录 `index.html`、`components.d.ts`、`public/shijian-icon.svg`。
- 移除上一轮新增的 `src/tokens.css` 与 `src/data/taskPresentation.ts`。

验证命令 `git diff --exit-code -- src components.d.ts index.html public/shijian-icon.svg` 返回 0，确认上述路径与改造前版本无差异。保留用户原有 `vite.config.ts` 中端口 5188 的配置。未修改存储结构、业务数据模块、依赖与锁文件，未迁移或清理用户浏览器数据。

## 2. 宣传页设计

采用蓝色、冷白与灰蓝文字，保留安静、简洁、轻盈的表达。

| 项目 | 实施值 |
| --- | --- |
| 主色 / 悬停色 | `#2E67B2` / `#245593` |
| 浅蓝背景 | `#EAF1FB` |
| 页面 / 卡片背景 | `#F7F9FC` / `#FFFFFF` |
| 主文字 / 次文字 | `#243248` / `#596B82` |
| 分隔线 / 控件边框 | `#DCE4EF` / `#ACBBCE` |
| 字体 | 系统无衬线字体，中文优先系统中文字体 |
| 正文 / 辅文 | 16px / 14px，正文基础行高 1.6 |
| 圆角 | 小标签 6px，按钮 8px，卡片 12px，展示容器 16px |
| 阴影 | 冷色中性阴影，卡片低强度，产品展示轻浮层 |

Tokens 仅放在 `site/tokens.css`，只由宣传页加载。宣传页继续使用原有品牌标识结构，在 `site/product.css` 中限定自己的蓝色，不改 App 品牌样式。

- Hero 强调“清晰思考，从容行动”与本地优先个人工作台定位。
- 保留任务管理、月历复盘、日常提醒三组真实界面截图与页签。
- 截图已重新采集自还原后的实际 App，使用独立预览地址的内置示例数据。
- 手机宣传页等比展示真实桌面截图，点击可打开大图；不再展示已撤销改造中的手机界面。
- 明确无需登录、数据保存在浏览器，以及 JSON 备份包含任务与主题、提醒需另行配置的实际边界。
- Web 标注现已可用；Windows 与 Android 保留“筹备中”；推荐电脑浏览器使用完整工作台。
- 页签保留点击、左右方向键、Home / End、焦点状态与对应的 ARIA 语义。

## 3. 本次保留的修改文件

| 路径 | 内容 |
| --- | --- |
| `site/index.html` | 宣传页内容结构、蓝色主题元信息、真实截图、版本与入口 |
| `site/tokens.css` | 宣传页专用蓝色设计规范 |
| `site/product.css` | 宣传页排版、组件、响应式布局与品牌色覆盖 |
| `site/preview.js` | 功能介绍链接联动截图页签 |
| `site/screenshots/tasks-desktop.jpg` | 还原后的任务管理截图 |
| `site/screenshots/review-desktop.jpg` | 还原后的月历截图 |
| `site/screenshots/reminders-desktop.jpg` | 还原后的健康提醒截图 |
| `site/screenshots/README.md` | 截图来源、尺寸和更新方式 |
| `scripts/build-product-site.mjs` | 复制宣传页 Tokens 和截图；原 App 构建流程保留 |
| `README.md` | 说明仅宣传页改造、App 还原及延期范围 |
| `VISUAL_UPDATE_REPORT.md` | 当前交付与验证记录，取代上一轮已撤销交付说明 |

`DESIGN_AUDIT.md` 保留为此前审计记录，本次不重新改写。`vite.config.ts` 为用户原有配置差异，不属于本次修改。

## 4. 验证报告

项目未定义 `test` 脚本或现成自动测试套件。本次执行原构建脚本等价命令，不安装新依赖、不添加测试框架。

| 检查 | 结果 |
| --- | --- |
| `node node_modules/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json` | 通过 |
| `node node_modules/vite/bin/vite.js build` | 通过，输出 `dist/` |
| `node scripts/build-product-site.mjs` | 通过，输出 `product-site/dist/` |
| App 文件还原差异检查 | 通过，与 Git HEAD 无差异 |
| `git diff --check` | 通过 |
| 宣传页 1440 × 1000 桌面实览 | 已检查首屏和整页排版，蓝色标识与按钮生效 |
| 宣传页 768 × 1024 平板实览 | 已检查整页布局，无横向溢出 |
| 宣传页 390 × 844 手机实览 | 已检查首屏、单列布局、页签和入口，无横向溢出 |
| 宣传页 320 × 800 窄屏实览 | 已检查首屏，无横向溢出 |
| 页签交互 | 点击、方向键、Home / End、功能链接联动均通过 |
| 截图资源 | 三张均成功加载，实际尺寸 1440 × 1000 |
| Web 入口 | 实际点击成功进入原版 App |
| 浏览器控制台 | 本轮宣传页检查未发现 warning / error |
| 原版 App 预览 | 已确认任务、复盘、健康提醒界面，用于截图与还原核对 |

浏览器已恢复默认视口。验收截图保存在 `.screenshots/visual-update/landing-blue-desktop.jpg` 和 `landing-blue-mobile.jpg`（忽略目录，不作为产品资源）。

## 5. 验收入口与暂缓事项

- 宣传页：`http://127.0.0.1:5181/`。
- 原版 App：`http://127.0.0.1:5181/app/`。
- App 原有移动布局和交互保持还原后的状态，本轮不进行适配改造。
- App 视觉、计划任务和其他业务功能改造均暂缓。
- 本报告记录本地验收结果；GitHub 更新与线上发布状态以仓库提交和部署记录为准。
