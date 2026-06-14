# SubAccount

一款本地优先、跨平台的订阅管理桌面应用，基于 **Tauri 2 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui** 构建。

集中管理你的所有订阅 —— 视频流媒体、AI 工具、云服务、音乐等。所有数据仅保存在本地设备上。

## 功能特性

### 订阅管理
- **40+ 内置服务模板** —— Netflix、YouTube、ChatGPT、Claude、Spotify、iCloud+、Notion、Vercel 等
- **9 大类别** —— 视频、AI、开发、云服务、工具、音乐、社交、购物、自定义
- **灵活计费周期** —— 每月、每年、自定义天数
- **自动续费追踪** —— 标记哪些订阅会自动续费
- **置顶重要订阅** —— 优先显示关键订阅

### 财务总览
- **仪表盘关键指标** —— 当月费用、年化成本、即将到期
- **多币种支持** —— 人民币、美元、欧元、日元、英镑、港币、澳元、加元、新加坡元、土耳其里拉、尼日利亚奈拉
- **自动折合人民币** —— 所有费用统一换算为 CNY，一目了然
- **类别占比分析** —— 看清钱花在哪里
- **现金流时间线** —— 过去 12 个月实际支出 + 未来 3 个月预测

### 视图与筛选
- **卡片视图 & 表格视图** —— 自由切换布局
- **排序方式** —— 按结束日期、开始日期、月费、年费
- **筛选条件** —— 计费周期、支付方式、类别、续费状态、提醒状态
- **搜索** —— 快速查找订阅

### 账号与提醒
- **登录方式记录** —— 手机、微信、邮箱、QQ、Gmail、Apple ID、GitHub
- **到期提醒** —— 当天、提前 1 天、3 天、7 天
- **支付方式记录** —— App Store、微信、支付宝、信用卡、PayPal 等

### 个性化设置
- **双语界面** —— 中文 / English
- **主题切换** —— 跟随系统、浅色、深色
- **自定义汇率** —— 手动调整币种转换比率

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | [Tauri 2](https://v2.tauri.app/) |
| 前端 | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| 样式 | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| 图标 | [Lucide React](https://lucide.dev/) + 自定义 SVG |
| 构建 | [Vite](https://vite.dev/) |
| 后端 | [Rust](https://www.rust-lang.org/) |

## 项目结构

```
subaccount/
├── src/                    # 前端源码
│   ├── App.tsx             # 主应用（视图、路由、国际化）
│   ├── main.tsx            # React 入口
│   ├── styles.css          # 全局样式 + Tailwind 配置
│   ├── components/ui/      # shadcn/ui 组件
│   └── lib/
│       ├── subscriptions.ts # 数据模型、服务模板、工具函数
│       └── utils.ts         # 通用辅助函数
├── src-tauri/              # Tauri / Rust 后端
│   ├── src/
│   │   ├── main.rs         # Rust 入口
│   │   └── lib.rs          # Tauri 插件配置
│   ├── tauri.conf.json     # Tauri 配置文件
│   └── Cargo.toml          # Rust 依赖
├── public/                 # 静态资源
│   ├── icons/              # 服务图标 (SVG)
│   ├── payment-icons/      # 支付方式图标
│   └── loginmethod-icons/  # 登录方式图标
├── asset/                  # 本地素材资源（已 git 忽略）
├── package.json
├── vite.config.ts
├── tsconfig.json
└── components.json         # shadcn/ui 配置
```

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)（最新稳定版）
- [Tauri 依赖](https://v2.tauri.app/start/prerequisites/) —— 平台相关的构建工具

### 安装

```bash
# 克隆仓库
git clone https://github.com/AnsirStudio/subaccount.git
cd subaccount

# 安装依赖
npm install
```

### 开发调试

```bash
# 启动 Tauri 开发服务器（打开桌面应用）
npm run tauri dev
```

### 构建打包

```bash
# 构建生产版桌面应用
npm run tauri build
```

### 仅 Web 模式（不使用 Tauri）

```bash
# 启动 Vite 开发服务器（浏览器访问）
npm run dev

# Web 构建
npm run build
```

## 数据存储

所有订阅数据存储在浏览器的 **localStorage** 中，键名为 `sub-account.subscriptions.v2`。不会向任何服务器发送数据。

## 支持的服务

SubAccount 目前收录了 **40+ 常见订阅服务**，涵盖视频、AI、开发、云服务、工具、音乐、社交、购物共 9 大类别，持续更新中。也支持通过**自定义**选项手动添加任意服务。

## 支持的货币

开箱即用支持 10+ 常用货币，所有费用可自动折算为用户指定的主币种，统一查看。

## 免责声明

本应用中出现的第三方品牌名称、商标和 Logo 仅用于帮助用户识别其订阅服务。所有商标和 Logo 均归其各自所有者所有。本应用与这些品牌方不存在从属、赞助、授权或官方合作关系，除非另有明确说明。

## 许可证

[MIT License](https://opensource.org/licenses/MIT) — © AnsirStudio
