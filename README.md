# JioJio — Subscription & Account Manager

A local-first, cross-platform subscription management desktop app built with **Tauri 2 + React 19 + TypeScript + Tailwind CSS v4 + shadcn/ui**.

Track all your subscriptions — video streaming, AI tools, cloud services, music, and more — in one place. All data stays on your device.

## Features

### Subscription Management
- **40+ built-in service templates** — Netflix, YouTube, ChatGPT, Claude, Spotify, iCloud+, Notion, Vercel, and many more
- **9 categories** — Video, AI, Developer, Cloud, Tools, Music, Social, Shopping, Custom
- **Flexible billing cycles** — Monthly, Yearly, or Custom (N days)
- **Auto-renew tracking** — Know which subscriptions renew automatically
- **Pin important subscriptions** — Keep priority items at the top

### Financial Overview
- **Dashboard with key metrics** — Monthly cost, annualized cost, upcoming payments
- **Multi-currency support** — CNY, USD, EUR, JPY, GBP, HKD, AUD, CAD, SGD, TRY, NGN
- **Auto CNY conversion** — All costs normalized to CNY for a unified view
- **Category breakdown** — See where your money goes
- **Cashflow timeline** — Past 12 months actual + 3 months forecast

### Views & Filtering
- **Card view & Table view** — Switch between visual layouts
- **Sort by** — End date, start date, monthly price, annual price
- **Filter by** — Billing cycle, payment method, category, auto-renew status, reminder status
- **Search** — Find subscriptions quickly

### Account & Reminders
- **Login method tracking** — Phone, WeChat, Email, QQ, Gmail, Apple ID, GitHub
- **Expiry reminders** — Same day, 1 day, 3 days, or 7 days before expiry
- **Payment method tracking** — App Store, WeChat Pay, Alipay, Credit Card, PayPal, and more

### Preferences
- **Bilingual UI** — Chinese (中文) and English
- **Theme** — System, Light, Dark
- **Custom exchange rates** — Adjust currency conversion rates

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Tauri 2](https://v2.tauri.app/) |
| Frontend | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Icons | [Lucide React](https://lucide.dev/) + custom SVGs |
| Build | [Vite](https://vite.dev/) |
| Language | [Rust](https://www.rust-lang.org/) (backend) + TypeScript (frontend) |

## Project Structure

```
subaccount/
├── src/                    # Frontend source
│   ├── App.tsx             # Main application (views, routing, i18n)
│   ├── main.tsx            # React entry point
│   ├── styles.css          # Global styles + Tailwind config
│   ├── components/ui/      # shadcn/ui components
│   └── lib/
│       ├── subscriptions.ts # Data models, service templates, utilities
│       └── utils.ts         # Helper functions
├── src-tauri/              # Tauri / Rust backend
│   ├── src/
│   │   ├── main.rs         # Rust entry point
│   │   └── lib.rs          # Tauri plugin setup
│   ├── tauri.conf.json     # Tauri configuration
│   └── Cargo.toml          # Rust dependencies
├── public/                 # Static assets
│   ├── icons/              # Service icons (SVG)
│   ├── payment-icons/      # Payment method icons
│   └── loginmethod-icons/  # Login method icons
├── asset/                  # Local source assets (git-ignored)
├── package.json
├── vite.config.ts
├── tsconfig.json
└── components.json         # shadcn/ui configuration
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Tauri Prerequisites](https://v2.tauri.app/start/prerequisites/) — platform-specific build tools

### Install

```bash
# Clone the repository
git clone https://github.com/AnsirStudio/subaccount.git
cd subaccount

# Install dependencies
npm install
```

### Development

```bash
# Start the Tauri dev server (opens the desktop app)
npm run tauri dev
```

### Build

```bash
# Build the production desktop app
npm run tauri build
```

### Web Only (without Tauri)

```bash
# Start the Vite dev server (browser)
npm run dev

# Build for web
npm run build
```

## Data Storage

All subscription data is stored in the browser's **localStorage** under the key `sub-account.subscriptions.v2`. No data is sent to any server.

## Supported Services

SubAccount currently includes **40+ common subscription services** across 9 categories — Video, AI, Developer, Cloud, Tools, Music, Social, Shopping, and Custom. The template library is continuously expanding. You can also add any service manually via the **Custom** option.

## Supported Currencies

10+ common currencies are supported, with automatic conversion to your preferred base currency for a unified cost overview.

## Disclaimer

Third-party brand names, trademarks, and logos appearing in this application are used solely to help users identify their subscription services. All trademarks and logos are the property of their respective owners. This application is not affiliated with, sponsored by, authorized by, or in any official partnership with these brands, unless explicitly stated otherwise.

## License

[MIT License](https://opensource.org/licenses/MIT) — © AnsirStudio
