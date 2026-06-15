import {
  AU,
  CA,
  CN,
  EU,
  GB,
  HK,
  JP,
  NG,
  SG,
  TR,
  US,
} from "country-flag-icons/react/3x2";
import { enUS, zhCN } from "date-fns/locale";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Bell,
  CalendarDays,
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Copy,
  Edit3,
  ImagePlus,
  ListChecks,
  Moon,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sun,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  addCycle,
  accountMethodOptions,
  billingCycleOptions,
  categoryOptions,
  CurrencyCode,
  currencyOptions,
  daysUntil,
  formatMoney,
  iconPath,
  loadSubscriptions,
  makeCustomSubscription,
  makeSubscriptionFromTemplate,
  normalizeSubscription,
  paymentMethodOptions,
  parseLocalDate,
  ReminderDays,
  saveSubscriptions,
  ServiceTemplate,
  serviceTemplates,
  subscriptionStatus,
  Subscription,
  SubscriptionCategory,
  toCny,
  toISODate,
} from "./lib/subscriptions";
import { cn } from "./lib/utils";

type DraftMode = "add" | "edit";
type MainView = "overview" | "detailSubscriptions" | "accounts" | "detail" | "addSelect" | "settings";
type SettingsTab = "basic" | "accounts" | "exchange";
type LanguageCode = "zh" | "en";
type ThemePreference = "system" | "light" | "dark";
type DetailSubscriptionSort = "endDate" | "startDate" | "monthlyPrice" | "annualPrice";
type TableSubscriptionSort = "price" | "endDate";
type SortDirection = "asc" | "desc";
type DetailDisplayMode = "cards" | "table";
type DetailedSubscriptionGroup = {
  key: string;
  subscription: Subscription;
  count: number;
  members: Subscription[];
};

type PreferencesContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
  t: (key: string) => string;
};

const customPlanValue = "custom";
const templatePlanConfigs = {
  "tencent-video": {
    defaultValue: "VIP",
    options: ["VIP", "SVIP"],
  },
  iqiyi: {
    defaultValue: "黄金VIP",
    options: ["黄金VIP", "白金VIP", "钻石VIP"],
  },
} as const;

const exchangeRateDate = "2026-06-12";
const flagComponents = { AU, CA, CN, EU, GB, HK, JP, NG, SG, TR, US };
const languageStorageKey = "sub-account.language";
const themeStorageKey = "sub-account.theme";

const translations: Record<LanguageCode, Record<string, string>> = {
  zh: {
    "nav.overview": "总览",
    "nav.detailSubscriptions": "详细订阅",
    "nav.accounts": "账号情况",
    "nav.upcoming": "最近到期",
    "nav.settings": "设置",
    "common.back": "返回",
    "common.custom": "自定义",
    "common.cancel": "取消",
    "common.save": "保存",
    "common.search": "搜索",
    "common.enabled": "开启",
    "common.disabled": "关闭",
    "settings.basic": "基础设置",
    "settings.accounts": "常用账号",
    "settings.exchange": "汇率设置",
    "settings.account.hint": "管理你常用的登录账号，添加订阅时可快速选择",
    "settings.account.addPlaceholder": "输入账号…",
    "settings.account.add": "添加",
    "settings.language": "语言",
    "settings.theme": "主题",
    "settings.language.zh": "中文",
    "settings.language.en": "English",
    "settings.theme.system": "跟随系统",
    "settings.theme.light": "浅色",
    "settings.theme.dark": "深色",
    "exchange.baseCurrency": "主币种",
    "exchange.rateDate": "数据日期",
    "exchange.currency": "币种",
    "exchange.amount": "等值金额",
    "metrics.monthly": "当前月成本",
    "metrics.annual": "年化成本",
    "metrics.upcoming": "30 天内结束",
    "metrics.items": "项",
    "overview.totalSubscriptions": "订阅总数",
    "overview.activeSubscriptions": "订阅中",
    "overview.inactiveSubscriptions": "已取消",
    "overview.monthlyCost": "单月费用",
    "overview.annualCost": "一年费用",
    "overview.due7": "未来 7 天支付",
    "overview.due30": "未来 30 天支付",
    "overview.categoryShare": "类别月费占比",
    "overview.monthlyDistribution": "月度费用分布",
    "overview.monthlyDistribution.histogram": "月度费用分布",
    "overview.cashflowTimeline": "每月真实支出",
    "overview.cashflowTimelineDescription": "过去 12 个月真实扣费，右侧浅灰为未来 3 个月预计",
    "overview.cashflowForecast": "预计",
    "overview.upcomingPayments": "最近到期或续费",
    "overview.noUpcomingPayments": "30 天内没有到期或续费",
    "overview.upcoming.all": "全部",
    "overview.upcoming.expiring": "到期",
    "overview.upcoming.renewing": "续费",
    "overview.expiringSuffix": "到期",
    "overview.renewingSuffix": "自动续费",
    "overview.coverage": "管理覆盖",
    "overview.autoRenewCoverage": "自动续费",
    "overview.reminderCoverage": "到期提醒",
    "overview.monthlySubscriptions": "月度订阅",
    "overview.yearlySubscriptions": "年度订阅",
    "overview.topMonthly": "最高月均",
    "overview.noCategorySpend": "暂无类别支出",
    "overview.noActiveSpend": "暂无活跃费用",
    "empty.noSubscriptions": "暂无订阅",
    "empty.title": "还没有订阅",
    "empty.description": "先添加一个订阅，之后这里会显示费用、周期和结束日期。",
    "empty.add": "新增订阅",
    "filter.searchSubscriptions": "搜索订阅",
    "filter.cycle": "订阅方式",
    "filter.payment": "付款方式",
    "filter.category": "类别",
    "filter.autoRenew": "续费",
    "filter.allCycles": "全部方式",
    "filter.allPayments": "全部付款",
    "filter.allCategories": "全部类别",
    "filter.allAutoRenew": "全部续费",
    "filter.autoRenewOn": "自动续费",
    "filter.autoRenewOff": "非自动续费",
    "filter.allReminders": "全部提醒",
    "filter.reminderOn": "开启提醒",
    "filter.reminderOff": "关闭提醒",
    "filter.noResults": "没有符合条件的订阅",
    "view.cards": "卡片视图",
    "view.table": "表格视图",
    "table.subscription": "订阅",
    "table.quantity": "数量",
    "table.cycle": "周期",
    "table.autoRenew": "续费",
    "table.reminder": "提醒",
    "table.endDate": "结束日期",
    "pagination.previous": "上一页",
    "pagination.next": "下一页",
    "add.searchPlatform": "搜索平台",
    "add.allCategories": "全部",
    "add.noResults": "没有找到匹配的平台",
    "editor.category": "类别",
    "editor.customCategory": "自定义类别",
    "editor.cycle": "订阅周期",
    "editor.customDays": "自定义天数",
    "editor.autoRenew": "自动续费",
    "editor.startDate": "开始日期",
    "editor.endDate": "结束日期",
    "editor.currency": "货币",
    "editor.price": "价格",
    "editor.paymentMethod": "支付方式",
    "editor.planName": "套餐名称",
    "editor.accountMethod": "登录方式",
    "editor.accountInfo": "账号信息",
    "editor.pinned": "置顶订阅",
    "sidebar.noUpcoming": "暂无订阅",
    "sidebar.noPinned": "暂无置顶订阅",
    "editor.reminder": "到期提醒",
    "reminder.sameDay": "当天",
    "reminder.previousDay": "前一天",
    "reminder.threeDays": "前 3 天",
    "reminder.sevenDays": "前 7 天",
    "editor.notes": "备注",
    "editor.delete": "删除订阅",
    "detail.edit": "编辑",
    "detail.plan": "套餐",
    "detail.notSet": "未填写",
    "detail.convertedCny": "折合人民币",
    "detail.monthlyCny": "月均人民币",
    "detail.annualCny": "年均人民币",
    "detail.autoRenew": "自动续费",
    "detail.start": "开始",
    "detail.end": "结束",
    "detail.price": "价格",
    "detail.category": "类别",
    "detail.billingInfo": "订阅信息",
    "detail.accountInfo": "账号与管理",
    "detail.payment": "付款",
    "detail.loginMethod": "登录方式",
    "detail.account": "账号",
    "detail.reminder": "提醒",
    "detail.pinned": "置顶",
    "sort.by": "排序",
    "sort.endDate": "按结束日期",
    "sort.startDate": "按开始日期",
    "sort.monthlyPrice": "按每月单价",
    "sort.annualPrice": "按每年单价",
    "sort.asc": "升序",
    "sort.desc": "降序",
    "relative.expiredPrefix": "已过期",
    "relative.days": "天",
    "relative.today": "今天结束",
    "relative.after": "天后",
    "status.active": "订阅中",
    "status.cancelled": "已取消",
    "category.video": "视频",
    "category.ai": "AI",
    "category.developer": "开发",
    "category.cloud": "云服务",
    "category.tool": "工具",
    "category.music": "音乐",
    "category.social": "社交",
    "category.shopping": "购物",
    "category.custom": "自定义",
    "cycle.monthly": "每月",
    "cycle.yearly": "每年",
    "cycle.customDays": "自定义",
    "service.tencent-video": "腾讯视频",
    "service.iqiyi": "爱奇艺",
    "service.bilibili": "哔哩哔哩",
    "service.youku": "优酷视频",
    "service.mango-tv": "芒果TV",
    "service.youtube": "YouTube",
    "service.netflix": "Netflix",
    "service.disney-plus": "Disney+",
    "service.icloud": "iCloud+",
    "service.baidu-netdisk": "百度网盘",
    "service.quark": "夸克",
    "service.xunlei": "迅雷",
    "service.notion": "Notion",
    "service.capcut": "剪映",
    "service.netease-music": "网易云音乐",
    "service.qq-music": "QQ音乐",
    "service.qishui-music": "汽水音乐",
    "service.kugou-music": "酷狗音乐",
    "service.apple-music": "Apple Music",
    "service.spotify": "Spotify",
    "service.qq": "QQ",
    "service.telegram": "Telegram",
    "service.jd": "京东",
    "service.taobao": "淘宝",
    "service.x": "X",
    "service.linkedin": "LinkedIn",
    "service.apple-tv": "Apple TV+",
    "service.zoom": "Zoom",
    "service.chatgpt": "ChatGPT",
    "service.claude": "Claude",
    "service.gemini": "Gemini",
    "service.minimax": "MiniMax",
    "service.mimo": "Mimo",
    "service.perplexity": "Perplexity",
    "service.grok": "Grok",
    "service.jimeng": "即梦",
    "service.vercel": "Vercel",
    "service.supabase": "Supabase",
    "service.trae": "Trae",
    "service.coze": "Coze",
    "service.netlify": "Netlify",
    "service.deno": "Deno",
    "service.cloudflare": "Cloudflare",
    "service.tencent-cloud": "腾讯云",
    "service.alibaba-cloud": "阿里云",
    "service.volcengine": "火山引擎",
    "service.azure": "Azure",
    "service.aws": "AWS",
    "service.cursor": "Cursor",
    "service.midjourney": "MidJourney",
    "service.suno": "Suno",
    "service.figma": "Figma",
    "service.wps": "WPS",
    "service.keep": "Keep",
    "service.obsidian": "Obsidian",
    "service.115-netdisk": "115网盘",
    "payment.appStore": "App Store",
    "payment.wechat": "微信",
    "payment.alipay": "支付宝",
    "payment.douyin": "抖音",
    "payment.creditCard": "信用卡",
    "payment.giftCard": "礼品卡",
    "payment.googlePay": "Google Pay",
    "payment.paypal": "PayPal",
    "account.phone": "手机",
    "account.wechat": "微信",
    "account.email": "邮箱",
    "account.qq": "QQ",
    "account.gmail": "Gmail",
    "account.appleId": "Apple ID",
    "account.github": "GitHub",
    "currency.CNY": "人民币",
    "currency.USD": "美元",
    "currency.EUR": "欧元",
    "currency.JPY": "日元",
    "currency.GBP": "英镑",
    "currency.HKD": "港币",
    "currency.AUD": "澳元",
    "currency.CAD": "加元",
    "currency.SGD": "新加坡元",
    "currency.TRY": "土耳其里拉",
    "currency.NGN": "尼日利亚奈拉",
  },
  en: {
    "nav.overview": "Overview",
    "nav.detailSubscriptions": "Details",
    "nav.accounts": "Accounts",
    "nav.upcoming": "Upcoming",
    "nav.settings": "Settings",
    "common.back": "Back",
    "common.custom": "Custom",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.search": "Search",
    "common.enabled": "On",
    "common.disabled": "Off",
    "settings.basic": "Basic",
    "settings.accounts": "Accounts",
    "settings.exchange": "Rates",
    "settings.account.hint": "Manage your frequently used login accounts for quick selection when adding subscriptions",
    "settings.account.addPlaceholder": "Enter account…",
    "settings.account.add": "Add",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.language.zh": "中文",
    "settings.language.en": "English",
    "settings.theme.system": "System",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "exchange.baseCurrency": "Base Currency",
    "exchange.rateDate": "Rate date",
    "exchange.currency": "Currency",
    "exchange.amount": "Amount",
    "metrics.monthly": "Monthly Cost",
    "metrics.annual": "Annualized",
    "metrics.upcoming": "Ending in 30 Days",
    "metrics.items": "items",
    "overview.totalSubscriptions": "Total",
    "overview.activeSubscriptions": "Active",
    "overview.inactiveSubscriptions": "Cancelled",
    "overview.monthlyCost": "Monthly Cost",
    "overview.annualCost": "Annual Cost",
    "overview.due7": "Due in 7 Days",
    "overview.due30": "Due in 30 Days",
    "overview.categoryShare": "Monthly Share by Category",
    "overview.monthlyDistribution": "Monthly Cost Distribution",
    "overview.monthlyDistribution.histogram": "Monthly Cost Distribution",
    "overview.cashflowTimeline": "Monthly Cashflow",
    "overview.cashflowTimelineDescription": "Actual payments over the past 12 months; muted bars forecast the next 3 months",
    "overview.cashflowForecast": "Forecast",
    "overview.upcomingPayments": "Expiring or Renewing Soon",
    "overview.noUpcomingPayments": "No expiring or renewing subscriptions in 30 days",
    "overview.upcoming.all": "All",
    "overview.upcoming.expiring": "Expiring",
    "overview.upcoming.renewing": "Renewing",
    "overview.expiringSuffix": "to expire",
    "overview.renewingSuffix": "to auto-renew",
    "overview.coverage": "Coverage",
    "overview.autoRenewCoverage": "Auto-Renew",
    "overview.reminderCoverage": "Reminder",
    "overview.monthlySubscriptions": "Monthly",
    "overview.yearlySubscriptions": "Yearly",
    "overview.topMonthly": "Highest Monthly",
    "overview.noCategorySpend": "No category spend yet",
    "overview.noActiveSpend": "No active cost yet",
    "empty.noSubscriptions": "No subscriptions",
    "empty.title": "No subscriptions yet",
    "empty.description": "Add a subscription first. Costs, cycle, and end date will appear here.",
    "empty.add": "Add Subscription",
    "filter.searchSubscriptions": "Search subscriptions",
    "filter.cycle": "Cycle",
    "filter.payment": "Payment",
    "filter.category": "Category",
    "filter.autoRenew": "Renewal",
    "filter.allCycles": "All cycles",
    "filter.allPayments": "All payments",
    "filter.allCategories": "All categories",
    "filter.allAutoRenew": "All renewals",
    "filter.autoRenewOn": "Auto-renew",
    "filter.autoRenewOff": "No auto-renew",
    "filter.allReminders": "All reminders",
    "filter.reminderOn": "Reminder on",
    "filter.reminderOff": "Reminder off",
    "filter.noResults": "No matching subscriptions",
    "view.cards": "Card view",
    "view.table": "Table view",
    "table.subscription": "Subscription",
    "table.quantity": "Qty",
    "table.cycle": "Cycle",
    "table.autoRenew": "Renewal",
    "table.reminder": "Reminder",
    "table.endDate": "End Date",
    "pagination.previous": "Previous",
    "pagination.next": "Next",
    "add.searchPlatform": "Search platforms",
    "add.allCategories": "All",
    "add.noResults": "No matching platforms",
    "editor.category": "Category",
    "editor.customCategory": "Custom Category",
    "editor.cycle": "Cycle",
    "editor.customDays": "Custom Days",
    "editor.autoRenew": "Auto-Renew",
    "editor.startDate": "Start Date",
    "editor.endDate": "End Date",
    "editor.currency": "Currency",
    "editor.price": "Price",
    "editor.paymentMethod": "Payment Method",
    "editor.planName": "Plan Name",
    "editor.accountMethod": "Login Method",
    "editor.accountInfo": "Account Info",
    "editor.pinned": "Pinned",
    "sidebar.noUpcoming": "No upcoming subscriptions",
    "sidebar.noPinned": "No pinned subscriptions",
    "editor.reminder": "Reminder",
    "reminder.sameDay": "Same day",
    "reminder.previousDay": "1 day before",
    "reminder.threeDays": "3 days before",
    "reminder.sevenDays": "7 days before",
    "editor.notes": "Notes",
    "editor.delete": "Delete Subscription",
    "detail.edit": "Edit",
    "detail.plan": "Plan",
    "detail.notSet": "Not set",
    "detail.convertedCny": "In CNY",
    "detail.monthlyCny": "Monthly CNY",
    "detail.annualCny": "Annual CNY",
    "detail.autoRenew": "Auto-Renew",
    "detail.start": "Start",
    "detail.end": "End",
    "detail.price": "Price",
    "detail.category": "Category",
    "detail.billingInfo": "Subscription Info",
    "detail.accountInfo": "Account & Management",
    "detail.payment": "Payment",
    "detail.loginMethod": "Login Method",
    "detail.account": "Account",
    "detail.reminder": "Reminder",
    "detail.pinned": "Pinned",
    "sort.by": "Sort",
    "sort.endDate": "End Date",
    "sort.startDate": "Start Date",
    "sort.monthlyPrice": "Monthly Price",
    "sort.annualPrice": "Annual Price",
    "sort.asc": "Ascending",
    "sort.desc": "Descending",
    "relative.expiredPrefix": "Expired",
    "relative.days": "days",
    "relative.today": "Ends today",
    "relative.after": "days later",
    "status.active": "Active",
    "status.cancelled": "Cancelled",
    "category.video": "Video",
    "category.ai": "AI",
    "category.developer": "Developer",
    "category.cloud": "Cloud",
    "category.tool": "Tools",
    "category.music": "Music",
    "category.social": "Social",
    "category.shopping": "Shopping",
    "category.custom": "Custom",
    "cycle.monthly": "Monthly",
    "cycle.yearly": "Yearly",
    "cycle.customDays": "Custom",
    "service.tencent-video": "WeTV",
    "service.iqiyi": "iQIYI",
    "service.bilibili": "bilibili",
    "service.youku": "youku",
    "service.mango-tv": "Mango TV",
    "service.youtube": "YouTube",
    "service.netflix": "Netflix",
    "service.disney-plus": "Disney+",
    "service.icloud": "iCloud+",
    "service.baidu-netdisk": "Baidu Netdisk",
    "service.quark": "Quark",
    "service.xunlei": "Xunlei",
    "service.notion": "Notion",
    "service.capcut": "CapCut",
    "service.netease-music": "NetEase Cloud Music",
    "service.qq-music": "QQ Music",
    "service.qishui-music": "Qishui Music",
    "service.kugou-music": "Kugou Music",
    "service.apple-music": "Apple Music",
    "service.spotify": "Spotify",
    "service.qq": "QQ",
    "service.telegram": "Telegram",
    "service.jd": "JD.com",
    "service.taobao": "Taobao",
    "service.x": "X",
    "service.linkedin": "LinkedIn",
    "service.apple-tv": "Apple TV+",
    "service.zoom": "Zoom",
    "service.chatgpt": "ChatGPT",
    "service.claude": "Claude",
    "service.gemini": "Gemini",
    "service.minimax": "MiniMax",
    "service.mimo": "Mimo",
    "service.perplexity": "Perplexity",
    "service.grok": "Grok",
    "service.jimeng": "Jimeng",
    "service.vercel": "Vercel",
    "service.supabase": "Supabase",
    "service.trae": "Trae",
    "service.coze": "Coze",
    "service.netlify": "Netlify",
    "service.deno": "Deno",
    "service.cloudflare": "Cloudflare",
    "service.tencent-cloud": "Tencent Cloud",
    "service.alibaba-cloud": "Alibaba Cloud",
    "service.volcengine": "Volcengine",
    "service.azure": "Azure",
    "service.aws": "AWS",
    "service.cursor": "Cursor",
    "service.midjourney": "MidJourney",
    "service.suno": "Suno",
    "service.figma": "Figma",
    "service.wps": "WPS",
    "service.keep": "Keep",
    "service.obsidian": "Obsidian",
    "service.115-netdisk": "115 Netdisk",
    "payment.appStore": "App Store",
    "payment.wechat": "WeChat",
    "payment.alipay": "Alipay",
    "payment.douyin": "Douyin",
    "payment.creditCard": "Credit Card",
    "payment.giftCard": "Gift Card",
    "payment.googlePay": "Google Pay",
    "payment.paypal": "PayPal",
    "account.phone": "Phone",
    "account.wechat": "WeChat",
    "account.email": "Email",
    "account.qq": "QQ",
    "account.gmail": "Gmail",
    "account.appleId": "Apple ID",
    "account.github": "GitHub",
    "currency.CNY": "Chinese Yuan",
    "currency.USD": "US Dollar",
    "currency.EUR": "Euro",
    "currency.JPY": "Japanese Yen",
    "currency.GBP": "British Pound",
    "currency.HKD": "Hong Kong Dollar",
    "currency.AUD": "Australian Dollar",
    "currency.CAD": "Canadian Dollar",
    "currency.SGD": "Singapore Dollar",
    "currency.TRY": "Turkish Lira",
    "currency.NGN": "Nigerian Naira",
  },
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readStoredLanguage(): LanguageCode {
  const value = localStorage.getItem(languageStorageKey);
  return value === "en" ? "en" : "zh";
}

function readStoredTheme(): ThemePreference {
  const value = localStorage.getItem(themeStorageKey);
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used inside PreferencesContext");
  return value;
}

function normalizeServiceText(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function serviceTemplateFor(item: Pick<Subscription, "sourceTemplateId" | "iconName" | "serviceName"> | ServiceTemplate) {
  const itemWithId = item as { id?: string };
  const templateByOwnId = itemWithId.id ? serviceTemplates.find((template) => template.id === itemWithId.id) : undefined;
  if (templateByOwnId) return templateByOwnId;

  const subscriptionLike = item as Partial<Pick<Subscription, "sourceTemplateId" | "iconName" | "serviceName">>;
  const sourceTemplateId = normalizeServiceText(subscriptionLike.sourceTemplateId);
  const iconName = normalizeServiceText(subscriptionLike.iconName);
  const serviceName = normalizeServiceText(subscriptionLike.serviceName);

  return serviceTemplates.find((template) => {
    const serviceNames = [
      template.id,
      template.iconName,
      template.serviceName,
      translations.zh[`service.${template.id}`],
      translations.en[`service.${template.id}`],
    ].map(normalizeServiceText);

    return (
      template.id === sourceTemplateId ||
      (iconName !== "custom" && template.iconName === iconName) ||
      serviceNames.includes(serviceName)
    );
  });
}

function resolveServiceKey(item: Pick<Subscription, "sourceTemplateId" | "iconName" | "serviceName"> | ServiceTemplate) {
  return serviceTemplateFor(item)?.id ?? item.iconName;
}

function serviceLabel(item: Pick<Subscription, "sourceTemplateId" | "iconName" | "serviceName"> | ServiceTemplate, t: (key: string) => string) {
  const template = serviceTemplateFor(item);
  const key = template?.id ?? resolveServiceKey(item);
  const translated = t(`service.${key}`);
  return translated.startsWith("service.") ? item.serviceName : translated;
}

function isBuiltInService(item: Pick<Subscription, "sourceTemplateId" | "iconName" | "serviceName">) {
  return Boolean(serviceTemplateFor(item));
}

function categoryText(category: Subscription["category"], customCategoryName: string | undefined, t: (key: string) => string) {
  if (category === "custom" && customCategoryName?.trim()) return customCategoryName.trim();
  return t(`category.${category}`);
}

function cycleText(cycle: Subscription["billingCycle"], t: (key: string) => string) {
  return t(`cycle.${cycle}`);
}

function statusText(status: ReturnType<typeof subscriptionStatus>, t: (key: string) => string) {
  return t(`status.${status}`);
}

function formatDisplayDate(value: string, language: LanguageCode) {
  const date = parseLocalDate(value);
  const locale = language === "en" ? "en-US" : "zh-CN";
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function formatTableEndDate(value: string, language: LanguageCode) {
  const date = parseLocalDate(value);
  const locale = language === "en" ? "en-US" : "zh-CN";
  return {
    date: new Intl.DateTimeFormat(locale, { month: language === "en" ? "short" : "long", day: "numeric" }).format(date),
    year: language === "en" ? new Intl.DateTimeFormat(locale, { year: "numeric" }).format(date) : `${date.getFullYear()}年`,
  };
}

function currencyDisplayLabel(currency: (typeof currencyOptions)[number], t: (key: string) => string) {
  return `${t(`currency.${currency.value}`)} ${currency.value}`;
}

function currencySymbol(currency: CurrencyCode) {
  const symbols: Record<CurrencyCode, string> = {
    CNY: "￥",
    USD: "$",
    EUR: "€",
    JPY: "¥",
    GBP: "£",
    HKD: "HK$",
    AUD: "A$",
    CAD: "C$",
    SGD: "S$",
    TRY: "₺",
    NGN: "₦",
  };
  return symbols[currency];
}

function localizedPaymentOptions(t: (key: string) => string) {
  return paymentMethodOptions.map((option) => ({ ...option, label: t(`payment.${option.value}`) }));
}

function localizedAccountOptions(t: (key: string) => string) {
  return accountMethodOptions.map((option) => ({ ...option, label: t(`account.${option.value}`) }));
}

function localizedCategoryOptions(t: (key: string) => string) {
  return categoryOptions.map((option) => ({ ...option, label: t(`category.${option.value}`) }));
}

function localizedCycleOptions(t: (key: string) => string) {
  return billingCycleOptions.map((option) => ({ ...option, label: t(`cycle.${option.value}`) }));
}

function localizedReminderOptions(t: (key: string) => string): Array<{ value: string; label: string }> {
  return [
    { value: "0", label: t("reminder.sameDay") },
    { value: "1", label: t("reminder.previousDay") },
    { value: "3", label: t("reminder.threeDays") },
    { value: "7", label: t("reminder.sevenDays") },
  ];
}

function planConfigForTemplateId(templateId?: string) {
  if (!templateId) return undefined;
  return templatePlanConfigs[templateId as keyof typeof templatePlanConfigs];
}

function inferTemplatePlanValue(planName: string, templateId?: string) {
  const config = planConfigForTemplateId(templateId);
  if (!config) return customPlanValue;
  if (config.options.some((option) => option === planName)) return planName;
  if (planName.trim()) return customPlanValue;
  return config.defaultValue;
}

async function startWindowDrag(event: React.MouseEvent<HTMLDivElement>) {
  if (event.button !== 0) return;
  const target = event.target as HTMLElement;
  if (target.closest("button, input, select, textarea, a")) return;

  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().startDragging();
  } catch (error) {
    console.warn("Window drag is only available inside Tauri.", error);
  }
}

async function lockWindowWidth() {
  try {
    const { getCurrentWindow, LogicalSize } = await import("@tauri-apps/api/window");
    await getCurrentWindow().setSizeConstraints({
      minWidth: 900,
      maxWidth: 900,
      minHeight: 720,
      maxHeight: 1100,
    });
    await getCurrentWindow().setSize(new LogicalSize(900, 980));
  } catch (error) {
    console.warn("Window sizing is only available inside Tauri.", error);
  }
}

export default function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => loadSubscriptions());
  const [selectedId, setSelectedId] = useState<string | null>(() => loadSubscriptions()[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [mainView, setMainView] = useState<MainView>("overview");
  const [previousView, setPreviousView] = useState<MainView>("overview");

  function navigateTo(view: MainView) {
    setPreviousView(mainView);
    setMainView(view);
  }
  const [draft, setDraft] = useState<Subscription | null>(null);
  const [draftMode, setDraftMode] = useState<DraftMode>("add");
  const [templateQuery, setTemplateQuery] = useState("");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("basic");
  const [detailDisplayMode, setDetailDisplayMode] = useState<DetailDisplayMode>("cards");
  const [isSidebarUpcomingOpen, setIsSidebarUpcomingOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>(() => readStoredLanguage());
  const [theme, setTheme] = useState<ThemePreference>(() => readStoredTheme());

  useEffect(() => {
    saveSubscriptions(subscriptions);
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem(languageStorageKey, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(themeStorageKey, theme);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const isDark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    };

    applyTheme();
    if (theme !== "system") return;

    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    void lockWindowWidth();
  }, []);

  useEffect(() => {
    const preventDevtoolsShortcut = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isInspectorShortcut =
        event.key === "F12" ||
        ((event.metaKey || event.ctrlKey) && event.shiftKey && (key === "i" || key === "j" || key === "c")) ||
        (event.metaKey && event.altKey && key === "i");

      if (isInspectorShortcut) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("keydown", preventDevtoolsShortcut, true);
    return () => window.removeEventListener("keydown", preventDevtoolsShortcut, true);
  }, []);

  const preferences = useMemo<PreferencesContextValue>(
    () => ({
      language,
      setLanguage,
      theme,
      setTheme,
      t: (key) => translations[language][key] ?? key,
    }),
    [language, theme],
  );
  const t = preferences.t;

  const filteredSubscriptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    const pinnedSubscriptions = subscriptions.filter((item) => item.isPinned);
    if (!term) return pinnedSubscriptions;
    return pinnedSubscriptions.filter((item) => {
      return `${item.serviceName} ${serviceLabel(item, t)} ${item.planName} ${categoryText(item.category, item.customCategoryName, t)}`.toLowerCase().includes(term);
    });
  }, [query, subscriptions, t]);

  const selected = subscriptions.find((item) => item.id === selectedId) ?? subscriptions[0] ?? null;
  const sidebarUpcomingSubscriptions = useMemo(() => {
    return subscriptions
      .filter((subscription) => subscriptionStatus(subscription) === "active" && daysUntil(subscription.endDate) >= 0)
      .sort((a, b) => parseLocalDate(a.endDate).getTime() - parseLocalDate(b.endDate).getTime())
      .slice(0, 5);
  }, [subscriptions]);

  function openAdd(subscription: Subscription) {
    setDraft(normalizeSubscription(subscription));
    setDraftMode("add");
    navigateTo("detail");
  }

  function openAddSelect() {
    setDraft(null);
    setTemplateQuery("");
    navigateTo("addSelect");
  }

  function openEdit(subscription: Subscription) {
    setDraft(normalizeSubscription({ ...subscription }));
    setDraftMode("edit");
    navigateTo("detail");
  }

  function saveDraft() {
    if (!draft) return;
    const normalized = normalizeSubscription(draft);
    if (draftMode === "add") {
      setSubscriptions((items) => sortSubscriptions([...items, normalized]));
      setSelectedId(normalized.id);
    } else {
      setSubscriptions((items) => sortSubscriptions(items.map((item) => (item.id === normalized.id ? normalized : item))));
    }
    setDraft(null);
    navigateTo("detail");
  }

  function cancelDraft() {
    setDraft(null);
    setMainView(draftMode === "add" ? "addSelect" : previousView);
  }

  function deleteSubscription(subscription: Subscription) {
    setSubscriptions((items) => {
      const next = items.filter((item) => item.id !== subscription.id);
      if (selectedId === subscription.id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
    setDraft(null);
  }

  function toggleThemeMode() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  function toggleLanguageMode() {
    setLanguage(language === "zh" ? "en" : "zh");
  }

  return (
    <PreferencesContext.Provider value={preferences}>
      <main className="grid h-screen grid-cols-[220px_1fr] bg-background text-foreground">
      <aside className="flex min-h-0 flex-col border-r border-border bg-sidebar">
        <div className="border-b border-border px-3 pb-3 pt-3">
          <div className="relative z-40 mb-3 flex h-7 items-center justify-end">
            <button
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={openAddSelect}
            >
              <Plus className="h-[18px] w-[18px] stroke-[2.5]" />
            </button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <Input
              className="search-input relative z-0 h-7 w-full rounded-full border-transparent bg-zinc-200 pl-8 pr-2 text-left font-normal leading-none text-zinc-700 placeholder:text-zinc-500 focus:border-zinc-300 focus:bg-zinc-100 focus:ring-0"
              placeholder={t("common.search")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button
            className={cn(
              "mt-2 flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-bold transition",
              mainView === "overview" && !draft
                ? "bg-zinc-100 text-zinc-900"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            onClick={() => {
              setDraft(null);
              navigateTo("overview");
            }}
          >
            <BarChart3 className="h-3.5 w-3.5 text-current" />
            {t("nav.overview")}
          </button>
          <button
            className={cn(
              "mt-1 flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-bold transition",
              mainView === "detailSubscriptions" && !draft
                ? "bg-zinc-100 text-zinc-900"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            onClick={() => {
              setDraft(null);
              navigateTo("detailSubscriptions");
            }}
          >
            <ListChecks className="h-3.5 w-3.5 text-current" />
            {t("nav.detailSubscriptions")}
          </button>
          <button
            className={cn(
              "mt-1 flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-bold transition",
              mainView === "accounts" && !draft
                ? "bg-zinc-100 text-zinc-900"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            onClick={() => {
              setDraft(null);
              navigateTo("accounts");
            }}
          >
            <UserRound className="h-3.5 w-3.5 text-current" />
            {t("nav.accounts")}
          </button>
          <button
            className="mt-1 flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-bold text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => setIsSidebarUpcomingOpen((open) => !open)}
          >
            {isSidebarUpcomingOpen ? <ChevronDown className="h-3.5 w-3.5 text-current" /> : <ChevronRight className="h-3.5 w-3.5 text-current" />}
            {t("nav.upcoming")}
          </button>
          {isSidebarUpcomingOpen ? (
            <div className="mt-1 flex flex-col gap-1">
              {sidebarUpcomingSubscriptions.length === 0 ? (
                <div className="pl-8 py-1.5 text-[11px] text-muted-foreground">{t("sidebar.noUpcoming")}</div>
              ) : sidebarUpcomingSubscriptions.map((subscription) => {
                const timingText = overviewUpcomingTimingText(daysUntil(subscription.endDate), subscription.isAutoRenewEnabled, language, t);
                return (
                  <button
                    key={subscription.id}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg py-1.5 pl-8 pr-2 text-left transition",
                      mainView === "detail" && selected?.id === subscription.id && !draft
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                    onClick={() => {
                      setSelectedId(subscription.id);
                      setDraft(null);
                      navigateTo("detail");
                    }}
                  >
                    <ServiceIcon subscription={subscription} size="sm" framed={false} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">{serviceLabel(subscription, t)}</div>
                      <div
                        className={cn(
                          "truncate text-[11px]",
                          mainView === "detail" && selected?.id === subscription.id && !draft ? "text-zinc-500" : "text-muted-foreground",
                        )}
                      >
                        {timingText}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-2">
          {filteredSubscriptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">{t("sidebar.noPinned")}</div>
          ) : (
            <div className="space-y-1">
              {filteredSubscriptions.map((subscription) => (
                <button
                  key={subscription.id}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                    mainView === "detail" && selected?.id === subscription.id && !draft
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                  onClick={() => {
                    setSelectedId(subscription.id);
                    setDraft(null);
                    navigateTo("detail");
                  }}
                >
                  <ServiceIcon subscription={subscription} size="sm" framed={false} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{serviceLabel(subscription, t)}</div>
                    <div className={cn(
                      "truncate text-xs",
                      mainView === "detail" && selected?.id === subscription.id && !draft ? "text-zinc-500" : "text-muted-foreground",
                    )}>
                      {statusText(subscriptionStatus(subscription), t)} · {relativeEnd(subscription, t)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-2">
          <button
            className={cn(
              "flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-bold transition",
              mainView === "settings" && !draft
                ? "bg-zinc-100 text-zinc-900"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            onClick={() => {
              setDraft(null);
              navigateTo("settings");
            }}
          >
            <Settings className="h-3.5 w-3.5 text-current" />
            {t("nav.settings")}
          </button>
        </div>
      </aside>

      <section className="flex min-h-0 flex-col overflow-hidden bg-background">
        <div
          className="z-40 flex h-12 shrink-0 items-center justify-between gap-1 border-b border-border bg-background/95 px-3"
          data-tauri-drag-region
          onMouseDown={startWindowDrag}
        >
          {mainView === "addSelect" ? (
            <>
              <Button className="topbar-small-button" variant="secondary" size="xs" onClick={() => { setDraft(null); setMainView(previousView); }}>
                <ArrowLeft data-icon="inline-start" />
                <span className="topbar-button-label">{t("common.back")}</span>
              </Button>
              <Button className="topbar-small-button" size="xs" onClick={() => openAdd(makeCustomSubscription())} title={t("common.custom")}>
                <Plus data-icon="inline-start" />
                <span className="topbar-button-label">{t("common.custom")}</span>
              </Button>
            </>
          ) : draft ? (
            <>
              <Button className="topbar-small-button" variant="secondary" size="xs" onClick={cancelDraft}>
                <ArrowLeft data-icon="inline-start" />
                <span className="topbar-button-label">{t("common.back")}</span>
              </Button>
              <div />
            </>
          ) : mainView === "detail" ? (
            <>
              <Button className="topbar-small-button" variant="secondary" size="xs" onClick={() => setMainView(previousView)}>
                <ArrowLeft data-icon="inline-start" />
                <span className="topbar-button-label">{t("common.back")}</span>
              </Button>
              <QuickPreferenceButtons
                language={language}
                theme={theme}
                t={t}
                onToggleTheme={toggleThemeMode}
                onToggleLanguage={toggleLanguageMode}
              />
            </>
          ) : mainView === "settings" ? (
            <>
              <ToggleGroup
                type="single"
                value={settingsTab}
                onValueChange={(value) => {
                  if (value) setSettingsTab(value as SettingsTab);
                }}
                variant="outline"
                size="sm"
                spacing={0}
              >
                <ToggleGroupItem className="settings-segment-button w-20 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950" value="basic">
                  {t("settings.basic")}
                </ToggleGroupItem>
                <ToggleGroupItem className="settings-segment-button w-20 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950" value="accounts">
                  {t("settings.accounts")}
                </ToggleGroupItem>
                <ToggleGroupItem className="settings-segment-button w-20 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950" value="exchange">
                  {t("settings.exchange")}
                </ToggleGroupItem>
              </ToggleGroup>
              <QuickPreferenceButtons
                language={language}
                theme={theme}
                t={t}
                onToggleTheme={toggleThemeMode}
                onToggleLanguage={toggleLanguageMode}
              />
            </>
          ) : mainView === "detailSubscriptions" ? (
            <>
              <div className="flex items-center gap-1">
                <Button
                  className={cn("h-8 w-8 rounded-md p-0", detailDisplayMode === "cards" ? "bg-zinc-200 text-foreground dark:bg-zinc-700" : "text-muted-foreground")}
                  variant="ghost"
                  size="icon"
                  title={t("view.cards")}
                  onClick={() => setDetailDisplayMode("cards")}
                >
                  <MaskedIcon path="/other-icons/grid.svg" className="h-[18px] w-[18px]" />
                </Button>
                <Button
                  className={cn("h-8 w-8 rounded-md p-0", detailDisplayMode === "table" ? "bg-zinc-200 text-foreground dark:bg-zinc-700" : "text-muted-foreground")}
                  variant="ghost"
                  size="icon"
                  title={t("view.table")}
                  onClick={() => setDetailDisplayMode("table")}
                >
                  <MaskedIcon path="/other-icons/list.svg" className="h-[19px] w-[19px]" />
                </Button>
              </div>
              <QuickPreferenceButtons
                language={language}
                theme={theme}
                t={t}
                onToggleTheme={toggleThemeMode}
                onToggleLanguage={toggleLanguageMode}
              />
            </>
          ) : (
            <>
              <div />
              <QuickPreferenceButtons
                language={language}
                theme={theme}
                t={t}
                onToggleTheme={toggleThemeMode}
                onToggleLanguage={toggleLanguageMode}
              />
            </>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <div
            className={cn(
              "mx-auto flex w-full flex-col gap-4 px-3 py-4",
              mainView === "detailSubscriptions" && detailDisplayMode === "table" ? "h-full min-h-0 overflow-hidden" : "min-h-full",
            )}
          >
            {mainView === "addSelect" ? (
              <AddSelectPage
                query={templateQuery}
                onQueryChange={setTemplateQuery}
                onPickTemplate={(template) => openAdd(makeSubscriptionFromTemplate(template))}
              />
            ) : draft ? (
              <Editor
                draft={draft}
                onChange={setDraft}
                onCancel={cancelDraft}
                onSave={saveDraft}
                onDelete={draftMode === "edit" ? () => deleteSubscription(draft) : undefined}
              />
            ) : mainView === "settings" ? (
              <SettingsPage activeTab={settingsTab} />
            ) : mainView === "detailSubscriptions" ? (
              <DetailedSubscriptionsPage
                subscriptions={subscriptions}
                displayMode={detailDisplayMode}
                onOpen={(subscription) => {
                  setSelectedId(subscription.id);
                  setMainView("detail");
                }}
                onAdd={openAddSelect}
              />
            ) : mainView === "accounts" ? (
              <AccountsPage
                subscriptions={subscriptions}
                onOpen={(subscription) => {
                  setSelectedId(subscription.id);
                  setMainView("detail");
                }}
              />
            ) : mainView === "detail" && selected ? (
              <SubscriptionDetail
                subscription={selected}
                onEdit={() => openEdit(selected)}
                onChange={(next) => setSubscriptions((items) => sortSubscriptions(items.map((item) => (item.id === next.id ? normalizeSubscription(next) : item))))}
              />
            ) : (
              <OverviewDashboard subscriptions={subscriptions} onAdd={openAddSelect} onOpen={(subscription) => {
                setSelectedId(subscription.id);
                setMainView("detail");
              }} />
            )}
          </div>
        </div>
      </section>
    </main>
    </PreferencesContext.Provider>
  );
}

function SettingsPage({ activeTab }: { activeTab: SettingsTab }) {
  if (activeTab === "exchange") return <ExchangeSettings />;
  if (activeTab === "accounts") return <AccountSettings />;
  return <BasicSettings />;
}

function QuickPreferenceButtons({
  language,
  theme,
  t,
  onToggleTheme,
  onToggleLanguage,
}: {
  language: LanguageCode;
  theme: ThemePreference;
  t: (key: string) => string;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button className="h-7 w-7 rounded-full p-0" variant="ghost" size="icon" title={t("settings.theme")} onClick={onToggleTheme}>
        {theme === "dark" ? <Moon data-icon="inline-start" /> : <Sun data-icon="inline-start" />}
      </Button>
      <Button className="h-7 min-w-8 rounded-full px-2 text-[11px] font-semibold" variant="ghost" size="sm" title={t("settings.language")} onClick={onToggleLanguage}>
        {language === "zh" ? "中" : "EN"}
      </Button>
    </div>
  );
}

function BlankPage() {
  return <div className="min-h-full" />;
}

// ─── Accounts Page ───────────────────────────────────────────────────────────

type AccountsView = "by-account" | "by-platform";

type AccountGroup = {
  identifier: string;
  note: string;
  subscriptions: Subscription[];
};

type MethodGroup = {
  method: (typeof accountMethodOptions)[number];
  accounts: AccountGroup[];
  totalSubs: number;
  monthlyCny: number;
};

function AccountsPage({
  subscriptions,
  onOpen,
}: {
  subscriptions: Subscription[];
  onOpen: (subscription: Subscription) => void;
}) {
  const { t, language } = usePreferences();
  const [view, setView] = useState<AccountsView>("by-account");
  const accountStore = useMemo(() => loadAccountStore(), []);

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((s) => subscriptionStatus(s) === "active"),
    [subscriptions],
  );

  const methodGroups = useMemo<MethodGroup[]>(() => {
    const methodMap = new Map<string, Map<string, AccountGroup>>();

    // Seed from AccountStore (enabled methods + saved accounts)
    for (const [method, entries] of Object.entries(accountStore)) {
      if (!methodMap.has(method)) methodMap.set(method, new Map());
      for (const entry of entries) {
        if (!methodMap.get(method)!.has(entry.value)) {
          methodMap.get(method)!.set(entry.value, { identifier: entry.value, note: entry.note, subscriptions: [] });
        }
      }
    }

    // Attach subscriptions to their accounts
    for (const sub of activeSubscriptions) {
      const method = sub.accountMethod;
      const id = sub.accountIdentifier.trim();
      if (!id) continue; // unlinked handled separately
      if (!methodMap.has(method)) methodMap.set(method, new Map());
      if (!methodMap.get(method)!.has(id)) {
        const note = (accountStore[method] ?? []).find((e) => e.value === id)?.note ?? "";
        methodMap.get(method)!.set(id, { identifier: id, note, subscriptions: [] });
      }
      methodMap.get(method)!.get(id)!.subscriptions.push(sub);
    }

    return accountMethodOptions
      .filter((opt) => methodMap.has(opt.value) && methodMap.get(opt.value)!.size > 0)
      .map((opt) => {
        const accounts = Array.from(methodMap.get(opt.value)!.values()).sort(
          (a, b) => b.subscriptions.length - a.subscriptions.length,
        );
        const totalSubs = accounts.reduce((s, a) => s + a.subscriptions.length, 0);
        const monthlyCny = accounts.reduce(
          (s, a) => s + a.subscriptions.reduce((ss, sub) => ss + monthlyUnitCny(sub), 0),
          0,
        );
        return { method: opt, accounts, totalSubs, monthlyCny };
      });
  }, [activeSubscriptions, accountStore]);

  const unlinkedSubs = useMemo(
    () => activeSubscriptions.filter((s) => !s.accountIdentifier.trim()),
    [activeSubscriptions],
  );

  const uniqueAccountCount = useMemo(
    () =>
      new Set(
        activeSubscriptions.filter((s) => s.accountIdentifier.trim()).map((s) => `${s.accountMethod}::${s.accountIdentifier}`),
      ).size,
    [activeSubscriptions],
  );

  const viewLabel = (v: AccountsView) =>
    language === "zh"
      ? v === "by-account" ? "账号视角" : "平台视角"
      : v === "by-account" ? "By Account" : "By Platform";

  return (
    <div className="flex flex-col gap-4">
      {/* Summary row + toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{activeSubscriptions.length}</span>{" "}
            {language === "zh" ? "个订阅" : "subscriptions"}
          </span>
          <span>·</span>
          <span>
            <span className="font-semibold text-foreground">{uniqueAccountCount}</span>{" "}
            {language === "zh" ? "个账号" : "accounts"}
          </span>
          {unlinkedSubs.length > 0 && (
            <>
              <span>·</span>
              <span className="font-medium text-amber-500">
                {unlinkedSubs.length} {language === "zh" ? "个未关联" : "unlinked"}
              </span>
            </>
          )}
        </div>
        <ToggleGroup
          type="single"
          value={view}
          onValueChange={(v) => { if (v) setView(v as AccountsView); }}
          variant="outline"
          size="sm"
          spacing={0}
        >
          <ToggleGroupItem
            className="w-28 px-5 !text-[11px] font-semibold data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950"
            value="by-account"
          >
            {viewLabel("by-account")}
          </ToggleGroupItem>
          <ToggleGroupItem
            className="w-28 px-5 !text-[11px] font-semibold data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950"
            value="by-platform"
          >
            {viewLabel("by-platform")}
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {view === "by-account" ? (
        <AccountsByAccountView methodGroups={methodGroups} unlinkedSubs={unlinkedSubs} onOpen={onOpen} t={t} language={language} />
      ) : (
        <AccountsByPlatformView subscriptions={activeSubscriptions} onOpen={onOpen} t={t} language={language} />
      )}
    </div>
  );
}

function AccountsByAccountView({
  methodGroups,
  unlinkedSubs,
  onOpen,
  t,
  language,
}: {
  methodGroups: MethodGroup[];
  unlinkedSubs: Subscription[];
  onOpen: (s: Subscription) => void;
  t: (k: string) => string;
  language: LanguageCode;
}) {
  if (methodGroups.length === 0 && unlinkedSubs.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        {language === "zh" ? "暂无订阅数据" : "No subscriptions yet"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {methodGroups.map((group) => (
        <Card key={group.method.value} className="gap-0 p-0 overflow-hidden">
          {/* Method header */}
          <div className="flex items-center justify-between px-4 py-3 bg-muted border-b border-border">
            <div className="flex items-center gap-2.5">
              <PaymentIcon path={group.method.iconPath} />
              <span className="text-sm font-semibold">{t(`account.${group.method.value}`)}</span>
              <span className="text-xs text-muted-foreground">
                {group.accounts.length} {language === "zh" ? "个账号" : "accounts"} · {group.totalSubs} {language === "zh" ? "个订阅" : "subs"}
              </span>
            </div>
            {group.monthlyCny > 0 && (
              <span className="text-xs font-semibold text-muted-foreground">
                {formatMoney(group.monthlyCny, "CNY")}/{language === "zh" ? "月" : "mo"}
              </span>
            )}
          </div>

          {/* Accounts within this method */}
          {group.accounts.map((account, accIdx) => (
            <div key={account.identifier || `__empty__${accIdx}`} className={cn(accIdx > 0 && "border-t border-border")}>
              {/* Account identifier row */}
              <div className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex flex-1 min-w-0 items-center gap-2">
                  <span className="text-sm font-medium truncate">{account.identifier || (language === "zh" ? "未填写" : "Not set")}</span>
                  {account.note && (
                    <span className="shrink-0 text-xs text-muted-foreground">· {account.note}</span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {account.subscriptions.length > 0 ? (
                    <>
                      <span>{account.subscriptions.length} {language === "zh" ? "个" : ""}</span>
                      <span className="font-semibold text-foreground">
                        {formatMoney(account.subscriptions.reduce((s, sub) => s + monthlyUnitCny(sub), 0), "CNY")}
                        /{language === "zh" ? "月" : "mo"}
                      </span>
                    </>
                  ) : (
                    <span className="italic">{language === "zh" ? "暂无订阅" : "No subs"}</span>
                  )}
                </div>
              </div>

              {/* Subscriptions for this account */}
              {account.subscriptions.map((sub, subIdx) => {
                const days = daysUntil(sub.endDate);
                const urgent = days >= 0 && days <= 7;
                return (
                  <button
                    key={sub.id}
                    className={cn(
                      "flex w-full items-center gap-3 border-t border-border/50 px-4 py-2 pl-8 text-left transition hover:bg-muted/40",
                    )}
                    onClick={() => onOpen(sub)}
                  >
                    <ServiceIcon subscription={sub} size="sm" framed={false} />
                    <div className="flex flex-1 min-w-0 items-center gap-2">
                      <span className="text-xs font-semibold truncate">{serviceLabel(sub, t)}</span>
                      <Badge variant="secondary" className="shrink-0 px-1 py-0 text-[10px]">
                        {categoryText(sub.category, sub.customCategoryName, t)}
                      </Badge>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-xs">
                      <span className={cn("text-muted-foreground", urgent && "font-medium text-amber-500")}>
                        {days < 0
                          ? language === "zh" ? "已过期" : "Expired"
                          : days === 0
                          ? language === "zh" ? "今天" : "Today"
                          : language === "zh" ? `${days}天后` : `${days}d`}
                        {" "}
                        {sub.isAutoRenewEnabled
                          ? language === "zh" ? "续费" : "renews"
                          : language === "zh" ? "到期" : "expires"}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatMoney(monthlyUnitCny(sub), "CNY")}/{language === "zh" ? "月" : "mo"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </Card>
      ))}

      {/* Subscriptions with no account info */}
      {unlinkedSubs.length > 0 && (
        <Card className="gap-0 p-0 overflow-hidden">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-muted border-b border-border">
            <span className="text-sm font-semibold text-amber-500">
              {language === "zh" ? "未关联账号" : "No Account Set"}
            </span>
            <span className="text-xs text-muted-foreground">
              {unlinkedSubs.length} {language === "zh" ? "个订阅未填写账号信息" : "subscriptions missing account info"}
            </span>
          </div>
          {unlinkedSubs.map((sub, idx) => (
            <button
              key={sub.id}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-muted/40",
                idx < unlinkedSubs.length - 1 && "border-b border-border",
              )}
              onClick={() => onOpen(sub)}
            >
              <ServiceIcon subscription={sub} size="sm" framed={false} />
              <span className="flex-1 text-sm font-medium truncate">{serviceLabel(sub, t)}</span>
              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                {categoryText(sub.category, sub.customCategoryName, t)}
              </Badge>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </Card>
      )}
    </div>
  );
}

function AccountsByPlatformView({
  subscriptions,
  onOpen,
  t,
  language,
}: {
  subscriptions: Subscription[];
  onOpen: (s: Subscription) => void;
  t: (k: string) => string;
  language: LanguageCode;
}) {
  const grouped = useMemo(() => {
    const map = new Map<SubscriptionCategory, Subscription[]>();
    for (const sub of subscriptions) {
      if (!map.has(sub.category)) map.set(sub.category, []);
      map.get(sub.category)!.push(sub);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [subscriptions]);

  if (subscriptions.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        {language === "zh" ? "暂无订阅数据" : "No subscriptions yet"}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {grouped.map(([category, subs]) => (
        <Card key={category} className="gap-0 p-0 overflow-hidden">
          {/* Category header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-muted border-b border-border">
            <span className="text-sm font-semibold">{categoryText(category, "", t)}</span>
            <span className="text-xs text-muted-foreground">
              {subs.length} {language === "zh" ? "个" : "items"}
            </span>
          </div>

          {/* Subscription rows */}
          {subs.map((sub, idx) => {
            const methodOpt = accountMethodOptions.find((m) => m.value === sub.accountMethod);
            const days = daysUntil(sub.endDate);
            const urgent = days >= 0 && days <= 7;
            const hasAccount = sub.accountIdentifier.trim();

            return (
              <button
                key={sub.id}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-muted/40",
                  idx < subs.length - 1 && "border-b border-border",
                )}
                onClick={() => onOpen(sub)}
              >
                <ServiceIcon subscription={sub} size="sm" framed={false} />

                {/* Service name + plan */}
                <div className="w-36 min-w-0 shrink-0">
                  <div className="truncate text-sm font-semibold">{serviceLabel(sub, t)}</div>
                  {sub.planName && (
                    <div className="truncate text-xs text-muted-foreground">{sub.planName}</div>
                  )}
                </div>

                {/* Account info */}
                <div className="flex flex-1 min-w-0 items-center gap-1.5">
                  {methodOpt && <PaymentIcon path={methodOpt.iconPath} />}
                  {hasAccount ? (
                    <span className="truncate text-xs text-muted-foreground">{sub.accountIdentifier}</span>
                  ) : (
                    <span className="text-xs font-medium text-amber-500">
                      {language === "zh" ? "未设置账号" : "No account"}
                    </span>
                  )}
                </div>

                {/* End date + cost */}
                <div className="shrink-0 text-right text-xs">
                  <div className={cn("font-medium", urgent ? "text-amber-500" : "text-muted-foreground")}>
                    {days < 0
                      ? language === "zh" ? "已过期" : "Expired"
                      : days === 0
                      ? language === "zh" ? "今天" : "Today"
                      : language === "zh" ? `${days}天后` : `${days}d`}
                    {" "}
                    {sub.isAutoRenewEnabled
                      ? language === "zh" ? "续费" : "renews"
                      : language === "zh" ? "到期" : "expires"}
                  </div>
                  <div className="font-semibold text-foreground">
                    {formatMoney(monthlyUnitCny(sub), "CNY")}/{language === "zh" ? "月" : "mo"}
                  </div>
                </div>
              </button>
            );
          })}
        </Card>
      ))}
    </div>
  );
}

function OverviewDashboard({
  subscriptions,
  onAdd,
  onOpen,
}: {
  subscriptions: Subscription[];
  onAdd: () => void;
  onOpen: (subscription: Subscription) => void;
}) {
  const { language, t } = usePreferences();
  const [upcomingFilter, setUpcomingFilter] = useState<"all" | "expiring" | "renewing">("all");
  const stats = useMemo(() => {
    const active = subscriptions.filter((subscription) => subscriptionStatus(subscription) === "active");
    const cancelledCount = subscriptions.length - active.length;
    const monthlyCny = active.reduce((sum, subscription) => sum + monthlyUnitCny(subscription), 0);
    const annualCny = monthlyCny * 12;
    const upcoming = active
      .map((subscription) => ({ subscription, days: daysUntil(subscription.endDate), amountCny: toCny(subscription.price, subscription.currency) }))
      .filter((item) => item.days >= 0)
      .sort((a, b) => parseLocalDate(a.subscription.endDate).getTime() - parseLocalDate(b.subscription.endDate).getTime());
    const upcoming30 = upcoming.filter((item) => item.days <= 30);
    const due7Cny = upcoming30.filter((item) => item.days <= 7).reduce((sum, item) => sum + item.amountCny, 0);
    const due30Cny = upcoming30.reduce((sum, item) => sum + item.amountCny, 0);
    const categoryRows = categoryOptions
      .map((category) => {
        const amountCny = active
          .filter((subscription) => subscription.category === category.value)
          .reduce((sum, subscription) => sum + monthlyUnitCny(subscription), 0);
        return {
          value: category.value,
          label: categoryText(category.value, "", t),
          amountCny,
          share: monthlyCny > 0 ? amountCny / monthlyCny : 0,
        };
      })
      .filter((item) => item.amountCny > 0)
      .sort((a, b) => b.amountCny - a.amountCny);
    const autoRenewCount = active.filter((subscription) => subscription.isAutoRenewEnabled).length;
    const reminderCount = active.filter((subscription) => subscription.isReminderEnabled).length;
    const monthlySubscriptionCount = active.filter((subscription) => subscription.billingCycle === "monthly").length;
    const yearlySubscriptionCount = active.filter((subscription) => subscription.billingCycle === "yearly").length;
    const topMonthly = [...active].sort((a, b) => monthlyUnitCny(b) - monthlyUnitCny(a))[0] ?? null;
    const monthlyDistribution = buildMonthlyCostDistribution(active);
    const cashflowTimeline = buildMonthlyCashflowTimeline(active, language);

    return {
      active,
      activeCount: active.length,
      cancelledCount,
      monthlyCny,
      annualCny,
      due7Cny,
      due30Cny,
      upcoming,
      categoryRows,
      autoRenewCount,
      reminderCount,
      monthlySubscriptionCount,
      yearlySubscriptionCount,
      topMonthly,
      monthlyDistribution,
      cashflowTimeline,
    };
  }, [language, subscriptions, t]);
  const filteredUpcoming = useMemo(() => {
    return stats.upcoming.filter(({ subscription }) => {
      if (upcomingFilter === "expiring") return !subscription.isAutoRenewEnabled;
      if (upcomingFilter === "renewing") return subscription.isAutoRenewEnabled;
      return true;
    });
  }, [stats.upcoming, upcomingFilter]);
  const visibleUpcoming = filteredUpcoming.slice(0, 5);
  const visibleUpcomingAmountCny = visibleUpcoming.reduce((sum, item) => sum + item.amountCny, 0);

  return (
    <div className="flex flex-col gap-3">
      {subscriptions.length === 0 ? <EmptyDetail onAdd={onAdd} /> : null}
      <div className="grid grid-cols-4 gap-3">
        <OverviewMetricCard
          icon={<BarChart3 className="h-4 w-4" />}
          label={t("overview.totalSubscriptions")}
          value={`${subscriptions.length}`}
          detail={`${stats.activeCount} ${t("overview.activeSubscriptions")} · ${stats.cancelledCount} ${t("overview.inactiveSubscriptions")}`}
        />
        <OverviewMetricCard
          icon={<CircleDollarSign className="h-4 w-4" />}
          label={t("overview.monthlyCost")}
          value={formatMoney(stats.monthlyCny, "CNY")}
          detail={`${t("overview.annualCost")} ${formatMoney(stats.annualCny, "CNY")}`}
        />
        <OverviewMetricCard
          icon={<CalendarDays className="h-4 w-4" />}
          label={t("overview.due7")}
          value={formatMoney(stats.due7Cny, "CNY")}
          detail={`${t("overview.due30")} ${formatMoney(stats.due30Cny, "CNY")}`}
        />
        <OverviewMetricCard
          icon={<Clock3 className="h-4 w-4" />}
          label={t("overview.topMonthly")}
          value={stats.topMonthly ? formatMoney(monthlyUnitCny(stats.topMonthly), "CNY") : "-"}
          detail={stats.topMonthly ? serviceLabel(stats.topMonthly, t) : t("overview.noActiveSpend")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="gap-0 border border-border p-0 ring-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="text-sm font-bold">{t("overview.categoryShare")}</div>
            <Badge variant="secondary">{formatMoney(stats.monthlyCny, "CNY")}</Badge>
          </div>
          {stats.categoryRows.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm font-medium text-muted-foreground">
              {t("overview.noCategorySpend")}
            </div>
          ) : (
            <div className="flex flex-col gap-3 p-4">
              {stats.categoryRows.map((category) => (
                <OverviewCategoryRow key={category.value} label={category.label} amount={formatMoney(category.amountCny, "CNY")} share={category.share} />
              ))}
            </div>
          )}
        </Card>
        <OverviewHistogramCard buckets={stats.monthlyDistribution} title={t("overview.monthlyDistribution.histogram")} />
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card className="col-span-3 gap-0 border border-border p-0 ring-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="text-sm font-bold">{t("overview.upcomingPayments")}</div>
              <Badge variant="secondary">{overviewMoneyLabel(visibleUpcomingAmountCny)}</Badge>
            </div>
            <ToggleGroup
              type="single"
              value={upcomingFilter}
              onValueChange={(value) => {
                if (value) setUpcomingFilter(value as "all" | "expiring" | "renewing");
              }}
              variant="outline"
              size="sm"
              spacing={0}
            >
              <ToggleGroupItem className="h-7 min-w-12 px-3 text-[11px] font-semibold data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950" value="all">
                {t("overview.upcoming.all")}
              </ToggleGroupItem>
              <ToggleGroupItem className="h-7 px-3 text-[11px] font-semibold data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950" value="expiring">
                {t("overview.upcoming.expiring")}
              </ToggleGroupItem>
              <ToggleGroupItem className="h-7 px-3 text-[11px] font-semibold data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950" value="renewing">
                {t("overview.upcoming.renewing")}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          {visibleUpcoming.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm font-medium text-muted-foreground">
              {t("overview.noUpcomingPayments")}
            </div>
          ) : (
            <Table className="text-xs">
              <TableBody>
                {visibleUpcoming.map(({ subscription, days, amountCny }) => {
                  const actionText = overviewUpcomingTimingText(days, subscription.isAutoRenewEnabled, language, t);
                  return (
                    <TableRow key={subscription.id} className="cursor-pointer" onClick={() => onOpen(subscription)}>
                      <TableCell className="w-10 py-2 pl-4">
                        <ServiceIcon subscription={subscription} size="sm" framed={false} />
                      </TableCell>
                      <TableCell className="max-w-40 py-2">
                        <div className="truncate font-semibold">{serviceLabel(subscription, t)}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {cycleText(subscription.billingCycle, t)} · {actionText}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 text-right text-muted-foreground">
                        <div className="font-semibold text-foreground">{overviewMoneyLabel(amountCny)}</div>
                        <div className="text-[11px]">{formatDisplayDate(subscription.endDate, language)}</div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
        <Card className="gap-3 border border-border p-4 ring-0">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold">{t("overview.coverage")}</div>
          </div>
          <OverviewCoverageRow
            icon={<RefreshCw className="h-3.5 w-3.5" />}
            label={t("overview.autoRenewCoverage")}
            count={stats.autoRenewCount}
            total={stats.activeCount}
          />
          <OverviewCoverageRow
            icon={<Bell className="h-3.5 w-3.5" />}
            label={t("overview.reminderCoverage")}
            count={stats.reminderCount}
            total={stats.activeCount}
          />
          <OverviewCoverageRow
            icon={<Clock3 className="h-3.5 w-3.5" />}
            label={t("overview.monthlySubscriptions")}
            count={stats.monthlySubscriptionCount}
            total={stats.activeCount}
          />
          <OverviewCoverageRow
            icon={<CalendarDays className="h-3.5 w-3.5" />}
            label={t("overview.yearlySubscriptions")}
            count={stats.yearlySubscriptionCount}
            total={stats.activeCount}
          />
        </Card>
      </div>

      <OverviewCashflowTimelineCard items={stats.cashflowTimeline} title={t("overview.cashflowTimeline")} description={t("overview.cashflowTimelineDescription")} />
    </div>
  );
}

function OverviewMetricCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: string; detail: string }) {
  return (
    <Card className="gap-2 border border-border p-4 ring-0">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="truncate text-xl font-bold tracking-tight">{value}</div>
      <div className="truncate text-[11px] font-medium text-muted-foreground">{detail}</div>
    </Card>
  );
}

function overviewUpcomingTimingText(days: number, isAutoRenewEnabled: boolean, language: LanguageCode, t: (key: string) => string) {
  const action = isAutoRenewEnabled ? t("overview.renewingSuffix") : t("overview.expiringSuffix");
  if (language === "zh") return days === 0 ? `今天${action}` : `${days}天后${action}`;
  return days === 0 ? `Today ${action}` : `${days} ${t("relative.days")} later ${action}`;
}

function overviewMoneyLabel(amountCny: number) {
  return amountCny === 0 ? "Free" : formatMoney(amountCny, "CNY");
}

function OverviewCoverageRow({ icon, label, count, total }: { icon: ReactNode; label: string; count: number; total: number }) {
  const ratio = total > 0 ? count / total : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold">
        <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
          {icon}
          <span className="truncate">{label}</span>
        </div>
        <span>{count}/{total}</span>
      </div>
      <OverviewProgress value={ratio} />
    </div>
  );
}

function OverviewCategoryRow({ label, amount, share }: { label: string; amount: string; share: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold">
        <span className="truncate text-foreground">{label}</span>
        <span className="shrink-0 text-muted-foreground">{amount} · {formatPercent(share)}</span>
      </div>
      <OverviewProgress value={share} />
    </div>
  );
}

function OverviewHistogramCard({ buckets, title }: { buckets: Array<{ label: string; count: number }>; title: string }) {
  const maxCount = Math.max(...buckets.map((bucket) => bucket.count), 1);

  return (
    <Card className="gap-0 border border-border p-0 ring-0">
      <div className="border-b border-border px-4 py-3">
        <div className="text-sm font-bold">{title}</div>
      </div>
      <div className="flex flex-col gap-2 p-4">
        {buckets.map((bucket) => {
          const widthPercent = bucket.count === 0 ? 6 : Math.max((bucket.count / maxCount) * 100, 14);
          return (
            <div key={bucket.label} className="grid grid-cols-[58px_minmax(0,1fr)_24px] items-center gap-2 text-xs font-semibold">
              <span className="text-right text-muted-foreground">{bucket.label}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/80 transition"
                  style={{ width: `${widthPercent}%`, opacity: bucket.count === 0 ? 0.22 : 1 }}
                />
              </div>
              <span className="text-right text-foreground">{bucket.count}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function OverviewCashflowTimelineCard({
  items,
  title,
  description,
}: {
  items: Array<{ key: string; label: string; amountCny: number; isForecast: boolean; yearLabel: string }>;
  title: string;
  description: string;
}) {
  const maxAmount = Math.max(...items.map((item) => item.amountCny), 1);
  const historicalItems = items.filter((item) => !item.isForecast);
  const firstHistorical = historicalItems[0];
  const currentMonth = historicalItems[historicalItems.length - 1];
  const { t } = usePreferences();

  return (
    <Card className="gap-0 border border-border p-0 ring-0">
      <div className="flex items-center border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-baseline gap-3">
          <div className="text-sm font-bold">{title}</div>
          <div className="truncate text-[11px] font-medium text-muted-foreground">{description}</div>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 pt-3 text-[11px] font-semibold text-muted-foreground">
        <span>{firstHistorical?.yearLabel}</span>
        <span>{currentMonth?.yearLabel}</span>
      </div>
      <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] items-end gap-2 px-4 pb-5 pt-5">
        {items.map((item, index) => {
          const height = item.amountCny === 0 ? 8 : Math.max((item.amountCny / maxAmount) * 120, 16);
          const isFirstForecast = item.isForecast && !items[index - 1]?.isForecast;
          return (
            <div key={item.key} className={cn("flex min-w-0 flex-col items-center gap-2", isFirstForecast && "border-l border-dashed border-border pl-2")}>
              <div className="relative flex h-36 w-full items-end justify-center">
                <div
                  className={cn("absolute w-full truncate text-center text-[10px] font-semibold", item.isForecast ? "text-muted-foreground" : "text-foreground")}
                  style={{ bottom: height + 6 }}
                >
                  {item.amountCny === 0 ? "Free" : formatMoney(item.amountCny, "CNY")}
                </div>
                <div
                  className={cn(
                    "w-full max-w-7 rounded-t-md transition",
                    item.isForecast ? "bg-muted" : "bg-primary",
                    item.amountCny === 0 && "bg-muted",
                  )}
                  style={{ height }}
                />
              </div>
              <div className="w-full truncate text-center text-[10px] font-semibold text-muted-foreground">
                {item.label}
                {item.isForecast ? <span className="sr-only"> {t("overview.cashflowForecast")}</span> : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function OverviewProgress({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(value, 1)) * 100}%` }} />
    </div>
  );
}

function BasicSettings() {
  const { language, setLanguage, theme, setTheme, t } = usePreferences();

  return (
    <Card className="gap-0 px-5">
      <FieldRow label={t("settings.language")}>
        <ToggleGroup
          type="single"
          value={language}
          onValueChange={(value) => {
            if (value) setLanguage(value as LanguageCode);
          }}
          variant="outline"
          size="sm"
          spacing={0}
        >
          <ToggleGroupItem className="w-20 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950" value="zh">
            {t("settings.language.zh")}
          </ToggleGroupItem>
          <ToggleGroupItem className="w-20 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950" value="en">
            {t("settings.language.en")}
          </ToggleGroupItem>
        </ToggleGroup>
      </FieldRow>
      <FieldRow label={t("settings.theme")}>
        <ToggleGroup
          type="single"
          value={theme}
          onValueChange={(value) => {
            if (value) setTheme(value as ThemePreference);
          }}
          variant="outline"
          size="sm"
          spacing={0}
        >
          <ToggleGroupItem className="w-20 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950" value="system">
            {t("settings.theme.system")}
          </ToggleGroupItem>
          <ToggleGroupItem className="w-16 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950" value="light">
            {t("settings.theme.light")}
          </ToggleGroupItem>
          <ToggleGroupItem className="w-16 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950" value="dark">
            {t("settings.theme.dark")}
          </ToggleGroupItem>
        </ToggleGroup>
      </FieldRow>
    </Card>
  );
}

function ExchangeSettings() {
  const { t } = usePreferences();
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>("CNY");
  const [baseAmount, setBaseAmount] = useState("100");
  const amount = Number(baseAmount) || 0;
  const baseRate = currencyOptions.find((currency) => currency.value === baseCurrency)?.unitPerCny ?? 1;

  function convertedAmount(target: CurrencyCode) {
    const targetRate = currencyOptions.find((currency) => currency.value === target)?.unitPerCny ?? 1;
    return (amount / baseRate) * targetRate;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{t("exchange.baseCurrency")}</div>
            <div className="mt-1 text-xs text-muted-foreground">{t("exchange.rateDate")} {exchangeRateDate}</div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              className="w-20 text-right"
              inputMode="decimal"
              value={baseAmount}
              onChange={(event) => setBaseAmount(parseDecimalTextInput(event.target.value))}
            />
            <ExchangeCurrencySelect className="w-36" variant="boxed" value={baseCurrency} onValueChange={setBaseCurrency} />
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("exchange.currency")}</TableHead>
              <TableHead className="text-right">{t("exchange.amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencyOptions
              .filter((currency) => currency.value !== baseCurrency)
              .map((currency) => (
                <TableRow key={currency.value}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FlagIcon countryCode={currency.countryCode} />
                      <CurrencyLabel label={currencyDisplayLabel(currency, t)} code={currency.value} className="font-medium" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatExchangeAmount(convertedAmount(currency.value))}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

const accountStorageKey = "jiojio.accounts.v1";

type AccountEntry = { value: string; note: string };
type AccountStore = Record<string, AccountEntry[]>;

function loadAccountStore(): AccountStore {
  try {
    const raw = localStorage.getItem(accountStorageKey);
    if (!raw) {
      const defaults: AccountStore = {};
      for (const method of accountMethodOptions) {
        defaults[method.value] = [];
      }
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    // Migrate old string[] format to AccountEntry[]
    const result: AccountStore = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          typeof item === "string" ? { value: item, note: "" } : item
        );
      }
    }
    return result;
  } catch {
    return {};
  }
}

function saveAccountStore(store: AccountStore) {
  localStorage.setItem(accountStorageKey, JSON.stringify(store, null, 2));
}

function AccountSettings() {
  const { t, language } = usePreferences();
  const [store, setStore] = useState<AccountStore>(loadAccountStore);
  const [addingMethod, setAddingMethod] = useState<string | null>(null);
  const [addValue, setAddValue] = useState("");
  const [addNote, setAddNote] = useState("");
  const [editingKey, setEditingKey] = useState<{ method: string; index: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editNote, setEditNote] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const allMethods = accountMethodOptions;
  const noNoteLabel = "无";
  const notePlaceholder = language === "zh" ? "请输入备注" : "Add a note";

  function isEnabled(method: string) {
    return store[method] !== undefined;
  }

  function toggleMethod(method: string) {
    setStore((prev) => {
      const next = { ...prev };
      if (next[method] !== undefined) {
        delete next[method];
      } else {
        next[method] = [];
      }
      saveAccountStore(next);
      return next;
    });
    setAddingMethod(null);
    setEditingKey(null);
  }

  function startAdding(method: string) {
    setEditingKey(null);
    setAddingMethod(method);
    setAddValue("");
    setAddNote("");
  }

  function cancelAdding() {
    setAddingMethod(null);
    setAddValue("");
    setAddNote("");
  }

  function addAccount(method: string) {
    const value = addValue.trim();
    if (!value) return;
    setStore((prev) => {
      const current = prev[method] ?? [];
      if (current.some((e) => e.value === value)) return prev;
      const next = { ...prev, [method]: [...current, { value, note: addNote.trim() }] };
      saveAccountStore(next);
      return next;
    });
    cancelAdding();
  }

  function startEditing(method: string, index: number, entry: AccountEntry) {
    setAddingMethod(null);
    setEditingKey({ method, index });
    setEditValue(entry.value);
    setEditNote(entry.note);
  }

  function cancelEditing() {
    setEditingKey(null);
  }

  function saveEdit(method: string, index: number) {
    const value = editValue.trim();
    if (!value) { cancelEditing(); return; }
    setStore((prev) => {
      const current = prev[method] ?? [];
      const next = current.map((e, i) => i === index ? { value, note: editNote.trim() } : e);
      const updated = { ...prev, [method]: next };
      saveAccountStore(updated);
      return updated;
    });
    cancelEditing();
  }

  function removeAccount(method: string, index: number) {
    setStore((prev) => {
      const next = { ...prev, [method]: (prev[method] ?? []).filter((_, i) => i !== index) };
      saveAccountStore(next);
      return next;
    });
  }

  function copyAccount(key: string, value: string) {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  return (
    <div className="flex flex-col gap-3">
      {allMethods.map((method) => {
        const enabled = isEnabled(method.value);
        const accounts = store[method.value] ?? [];
        const isAdding = addingMethod === method.value;

        return (
          <Card key={method.value} className="gap-0 p-0 overflow-hidden">
            {/* Method header */}
            <div className={cn("flex items-center justify-between px-4 py-3 bg-muted", enabled && "border-b border-border")}>
              <div className="flex items-center gap-2.5">
                <PaymentIcon path={method.iconPath} />
                <span className={cn("text-sm font-semibold", !enabled && "text-muted-foreground")}>
                  {t(`account.${method.value}`)}
                </span>
                {enabled && accounts.length > 0 && (
                  <span className="text-xs text-muted-foreground">{accounts.length}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {enabled && (
                  <button
                    className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-background hover:text-foreground"
                    onClick={() => isAdding ? cancelAdding() : startAdding(method.value)}
                  >
                    {isAdding ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  </button>
                )}
                <Switch checked={enabled} onCheckedChange={() => toggleMethod(method.value)} />
              </div>
            </div>

            {/* Account rows */}
            {enabled && accounts.map((entry, idx) => {
              const isEditingThis = editingKey?.method === method.value && editingKey?.index === idx;
              const copyKey = `${method.value}-${idx}`;
              const isCopied = copiedKey === copyKey;
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5",
                    idx < accounts.length - 1 && "border-b border-border",
                  )}
                >
                  {isEditingThis ? (
                    <>
                      <Input
                        autoFocus
                        className="h-8 w-24 shrink-0 text-sm"
                        placeholder={notePlaceholder}
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(method.value, idx);
                          if (e.key === "Escape") cancelEditing();
                        }}
                      />
                      <Input
                        className="h-8 flex-1 text-sm"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(method.value, idx);
                          if (e.key === "Escape") cancelEditing();
                        }}
                      />
                      <Button className="h-8 px-3 text-xs" size="sm" onClick={() => saveEdit(method.value, idx)}>
                        {t("common.save")}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="w-20 shrink-0 truncate text-xs text-muted-foreground">
                        {entry.note.trim() || noNoteLabel}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-sm text-foreground">{entry.value}</span>
                      <button
                        className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
                        title={isCopied ? "已复制" : "复制"}
                        onClick={() => copyAccount(copyKey, entry.value)}
                      >
                        {isCopied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                      </button>
                      <button
                        className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
                        onClick={() => startEditing(method.value, idx, entry)}
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                      <button
                        className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground/60 transition hover:bg-muted hover:text-foreground"
                        onClick={() => removeAccount(method.value, idx)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              );
            })}

            {/* Inline add input */}
            {enabled && isAdding && (
              <div className={cn("flex items-center gap-2 px-4 py-2.5", accounts.length > 0 && "border-t border-border")}>
                <Input
                  autoFocus
                  className="h-8 w-24 shrink-0 text-sm"
                  placeholder={notePlaceholder}
                  value={addNote}
                  onChange={(e) => setAddNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addAccount(method.value);
                    if (e.key === "Escape") cancelAdding();
                  }}
                />
                <Input
                  className="h-8 flex-1 text-sm"
                  placeholder={t("settings.account.addPlaceholder")}
                  value={addValue}
                  onChange={(e) => setAddValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addAccount(method.value);
                    if (e.key === "Escape") cancelAdding();
                  }}
                />
                <Button className="h-8 px-3 text-xs" size="sm" onClick={() => addAccount(method.value)}>
                  {t("settings.account.add")}
                </Button>
              </div>
            )}

            {/* Empty hint when enabled but no accounts */}
            {enabled && accounts.length === 0 && !isAdding && (
              <div className="px-4 py-2.5 text-xs text-muted-foreground">
                {t("settings.account.hint").split("，")[0]}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function ExchangeCurrencySelect({
  value,
  className,
  variant = "subtle",
  onValueChange,
}: {
  value: CurrencyCode;
  className?: string;
  variant?: "subtle" | "boxed";
  onValueChange: (value: CurrencyCode) => void;
}) {
  const { t } = usePreferences();
  const selectedCurrency = currencyOptions.find((currency) => currency.value === value);

  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as CurrencyCode)}>
      <SelectTrigger
        className={cn(
          "w-[70px] gap-1 px-1.5",
          variant === "subtle"
            ? "!border-0 !bg-transparent !shadow-none !ring-0 hover:bg-muted focus-visible:!border-0 focus-visible:!ring-0 dark:!bg-transparent dark:hover:bg-muted/50"
            : null,
          className,
        )}
        size="sm"
      >
        <span className="flex min-w-0 items-center gap-1">
          {selectedCurrency ? <FlagIcon countryCode={selectedCurrency.countryCode} /> : null}
          {selectedCurrency ? <span className="font-medium">{selectedCurrency.value}</span> : null}
        </span>
      </SelectTrigger>
      <SelectContent className="detail-select-content" position="popper" side="bottom" align="end" avoidCollisions={false}>
        <SelectGroup>
          {currencyOptions.map((currency) => (
            <SelectItem key={currency.value} value={currency.value}>
              <span className="flex items-center gap-1.5">
                <FlagIcon countryCode={currency.countryCode} />
                <CurrencyLabel label={currencyDisplayLabel(currency, t)} code={currency.value} />
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function FlagIcon({ countryCode }: { countryCode: string }) {
  const Flag = flagComponents[countryCode as keyof typeof flagComponents];
  if (!Flag) return null;
  return <Flag className="h-3 w-4 shrink-0 overflow-hidden rounded-[2px]" />;
}

function CurrencyLabel({ label, code, className }: { label: string; code: string; className?: string }) {
  const name = label.endsWith(` ${code}`) ? label.slice(0, -code.length - 1) : label;

  return (
    <span className={cn("min-w-0 truncate", className)}>
      {name} <span className="text-muted-foreground">{code}</span>
    </span>
  );
}

function formatExchangeAmount(amount: number) {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

const detailSortOptions: DetailSubscriptionSort[] = ["endDate", "startDate", "monthlyPrice", "annualPrice"];

function DetailSortSelect({
  value,
  onValueChange,
}: {
  value: DetailSubscriptionSort;
  onValueChange: (value: DetailSubscriptionSort) => void;
}) {
  const { t } = usePreferences();

  return (
    <Select value={value} onValueChange={(next) => onValueChange(next as DetailSubscriptionSort)}>
      <SelectTrigger className="detail-sort-select-trigger h-7 w-fit min-w-28 border-0 bg-transparent px-2 font-semibold shadow-none hover:bg-muted focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent dark:hover:bg-muted/50" size="sm">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate">{t(`sort.${value}`)}</span>
        </span>
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" align="end" avoidCollisions={false}>
        <SelectGroup>
          {detailSortOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {t(`sort.${option}`)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function FilterSelect({
  value,
  options,
  onValueChange,
}: {
  value: string;
  options: Array<{ value: string; label: string; iconPath?: string }>;
  onValueChange: (value: string) => void;
}) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="detail-filter-select-trigger h-7 w-fit min-w-20 max-w-36 border-0 bg-muted px-2 font-semibold shadow-none hover:bg-muted/80 focus-visible:border-0 focus-visible:ring-0 dark:bg-muted dark:hover:bg-muted/80" size="sm">
        <span className="flex min-w-0 items-center gap-1.5">
          {selectedOption?.iconPath ? <PaymentIcon path={selectedOption.iconPath} /> : null}
          <span className="truncate">{selectedOption?.label}</span>
        </span>
      </SelectTrigger>
      <SelectContent className="detail-select-content" position="popper" side="bottom" align="start" avoidCollisions={false}>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex min-w-0 items-center gap-1.5">
                {option.iconPath ? <PaymentIcon path={option.iconPath} /> : null}
                <span className="truncate">{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function DetailedSubscriptionsPage({
  subscriptions,
  displayMode,
  onOpen,
  onAdd,
}: {
  subscriptions: Subscription[];
  displayMode: DetailDisplayMode;
  onOpen: (subscription: Subscription) => void;
  onAdd: () => void;
}) {
  const { language, t } = usePreferences();
  const [detailQuery, setDetailQuery] = useState("");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [autoRenewFilter, setAutoRenewFilter] = useState("all");
  const [reminderFilter, setReminderFilter] = useState("all");
  const [sort, setSort] = useState<DetailSubscriptionSort>("endDate");
  const [direction, setDirection] = useState<SortDirection>("asc");
  const [tableSort, setTableSort] = useState<TableSubscriptionSort>("endDate");
  const [tableDirection, setTableDirection] = useState<SortDirection>("asc");
  const paymentOptions = useMemo(() => localizedPaymentOptions(t), [t]);
  const categoryOptionsForLanguage = useMemo(() => localizedCategoryOptions(t), [t]);
  const cycleOptionsForLanguage = useMemo(() => localizedCycleOptions(t), [t]);
  const filteredAndSortedSubscriptions = useMemo(() => {
    const query = detailQuery.trim().toLowerCase();
    const filtered = subscriptions.filter((subscription) => {
      const paymentOption = paymentOptions.find((option) => option.value === subscription.paymentMethod);
      const searchableText = [
        serviceLabel(subscription, t),
        subscription.serviceName,
        subscription.planName,
        categoryText(subscription.category, subscription.customCategoryName, t),
        paymentOption?.label,
        subscription.accountIdentifier,
      ].join(" ").toLowerCase();

      if (query && !searchableText.includes(query)) return false;
      if (cycleFilter !== "all" && subscription.billingCycle !== cycleFilter) return false;
      if (paymentFilter !== "all" && subscription.paymentMethod !== paymentFilter) return false;
      if (categoryFilter !== "all" && subscription.category !== categoryFilter) return false;
      if (displayMode === "cards" && autoRenewFilter === "on" && !subscription.isAutoRenewEnabled) return false;
      if (displayMode === "cards" && autoRenewFilter === "off" && subscription.isAutoRenewEnabled) return false;
      if (reminderFilter === "on" && !subscription.isReminderEnabled) return false;
      if (reminderFilter === "off" && subscription.isReminderEnabled) return false;
      return true;
    });

    return displayMode === "table" ? sortTableSubscriptions(filtered, tableSort, tableDirection) : sortDetailedSubscriptions(filtered, sort, direction);
  }, [autoRenewFilter, categoryFilter, cycleFilter, detailQuery, direction, displayMode, paymentFilter, paymentOptions, reminderFilter, sort, subscriptions, t, tableDirection, tableSort]);
  const groupedDetailedSubscriptions = useMemo(() => groupDetailedSubscriptions(filteredAndSortedSubscriptions), [filteredAndSortedSubscriptions]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const totalPages = Math.max(Math.ceil(groupedDetailedSubscriptions.length / pageSize), 1);
  const visibleGroups = useMemo(() => groupedDetailedSubscriptions.slice((page - 1) * pageSize, page * pageSize), [groupedDetailedSubscriptions, page]);

  useEffect(() => {
    setPage(1);
  }, [detailQuery, cycleFilter, paymentFilter, categoryFilter, autoRenewFilter, reminderFilter, sort, direction, tableSort, tableDirection]);

  if (subscriptions.length === 0) {
    return <EmptyDetail onAdd={onAdd} />;
  }

  return (
    <div className={cn("flex flex-col gap-3", displayMode === "table" ? "h-full min-h-0 overflow-hidden" : null)}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="h-8 rounded-full pl-8 text-xs"
              placeholder={t("filter.searchSubscriptions")}
              value={detailQuery}
              onChange={(event) => setDetailQuery(event.target.value)}
            />
          </div>
        </div>
        {displayMode === "cards" ? (
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              value={cycleFilter}
              options={[
                { value: "all", label: t("filter.allCycles") },
                ...cycleOptionsForLanguage.map((option) => ({ value: option.value, label: option.label })),
              ]}
              onValueChange={setCycleFilter}
            />
            <FilterSelect
              value={paymentFilter}
              options={[
                { value: "all", label: t("filter.allPayments") },
                ...paymentOptions.map((option) => ({ value: option.value, label: option.label, iconPath: option.iconPath })),
              ]}
              onValueChange={setPaymentFilter}
            />
            <FilterSelect
              value={categoryFilter}
              options={[
                { value: "all", label: t("filter.allCategories") },
                ...categoryOptionsForLanguage.map((option) => ({ value: option.value, label: option.label })),
              ]}
              onValueChange={setCategoryFilter}
            />
            <FilterSelect
              value={autoRenewFilter}
              options={[
                { value: "all", label: t("filter.allAutoRenew") },
                { value: "on", label: t("filter.autoRenewOn") },
                { value: "off", label: t("filter.autoRenewOff") },
              ]}
              onValueChange={setAutoRenewFilter}
            />
            <div className="ml-auto flex items-center gap-1">
              <Button
                className="h-7 w-7 rounded-full p-0"
                variant="ghost"
                size="icon"
                title={t(`sort.${direction}`)}
                onClick={() => setDirection((current) => (current === "asc" ? "desc" : "asc"))}
              >
                {direction === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
              </Button>
              <DetailSortSelect value={sort} onValueChange={setSort} />
            </div>
          </div>
        ) : null}
      </div>

      {displayMode === "table" ? (
        <DetailedSubscriptionsTable
          groups={visibleGroups}
          paymentOptions={paymentOptions}
          categoryOptions={categoryOptionsForLanguage}
          cycleOptions={cycleOptionsForLanguage}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          cycleFilter={cycleFilter}
          onCycleFilterChange={setCycleFilter}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          reminderFilter={reminderFilter}
          onReminderFilterChange={setReminderFilter}
          sort={tableSort}
          direction={tableDirection}
          onSortChange={(nextSort) => {
            if (tableSort === nextSort) {
              setTableDirection((current) => (current === "asc" ? "desc" : "asc"));
              return;
            }
            setTableSort(nextSort);
            setTableDirection("asc");
          }}
          onOpen={onOpen}
        />
      ) : filteredAndSortedSubscriptions.length === 0 ? (
        <Card className="flex min-h-40 items-center justify-center p-6 text-sm font-medium text-muted-foreground">
          {t("filter.noResults")}
        </Card>
      ) : (
        <DetailedSubscriptionsCards groups={visibleGroups} paymentOptions={paymentOptions} onOpen={onOpen} />
      )}

      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text={t("pagination.previous")}
                onClick={(event) => {
                  event.preventDefault();
                  setPage((current) => Math.max(current - 1, 1));
                }}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((pageNumber) => {
                if (totalPages <= 7) return true;
                if (pageNumber === 1 || pageNumber === totalPages) return true;
                if (Math.abs(pageNumber - page) <= 1) return true;
                return false;
              })
              .flatMap((pageNumber, index, array) => {
                const prev = array[index - 1];
                const items: React.ReactNode[] = [];
                if (prev !== undefined && pageNumber - prev > 1) {
                  items.push(
                    <PaginationItem key={`ellipsis-${pageNumber}`}>
                      <PaginationEllipsis />
                    </PaginationItem>,
                  );
                }
                items.push(
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === page}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>,
                );
                return items;
              })}
            <PaginationItem>
              <PaginationNext
                href="#"
                text={t("pagination.next")}
                onClick={(event) => {
                  event.preventDefault();
                  setPage((current) => Math.min(current + 1, totalPages));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}

function DetailedSubscriptionsCards({
  groups,
  paymentOptions,
  onOpen,
}: {
  groups: DetailedSubscriptionGroup[];
  paymentOptions: ReturnType<typeof localizedPaymentOptions>;
  onOpen: (subscription: Subscription) => void;
}) {
  const { language, t } = usePreferences();

  return (
    <div className="grid grid-cols-2 gap-4">
      {groups.map((group) => {
        const subscription = group.subscription;
        const paymentOption = paymentOptions.find((option) => option.value === subscription.paymentMethod);
        const planBadge = subscription.planName.trim() || (subscription.price === 0 ? "Free" : "");
        const isGroupPinned = group.members.some((item) => item.isPinned);

        return (
          <button
            key={group.key}
            className="group text-left"
            onClick={() => onOpen(subscription)}
          >
            <Card className="gap-0 overflow-hidden border-border bg-card p-4 shadow-sm transition group-hover:-translate-y-0.5 group-hover:border-foreground/20 group-hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <ServiceIcon subscription={subscription} size="md" />
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2 text-base font-bold text-card-foreground">
                      <span className="truncate">{serviceLabel(subscription, t)}</span>
                      {group.count > 1 ? (
                        <span className="shrink-0 rounded-[4px] bg-muted px-1.5 py-0.5 text-base font-bold leading-none text-blue-500">
                          {group.count}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 truncate text-xs font-medium text-muted-foreground">
                      {cycleText(subscription.billingCycle, t)} · {categoryText(subscription.category, subscription.customCategoryName, t)}
                    </div>
                  </div>
                </div>
                <div className="mt-1 grid shrink-0 grid-cols-2 gap-x-1.5 gap-y-1.5">
                  <RefreshCw className={cn("h-3.5 w-3.5", subscription.isAutoRenewEnabled ? "text-blue-500" : "text-muted-foreground/45")} />
                  <Bell className={cn("h-4 w-4", subscription.isReminderEnabled ? "text-blue-500" : "text-muted-foreground/45")} />
                  <Pin className={cn("h-3.5 w-3.5", isGroupPinned ? "text-blue-500" : "text-muted-foreground/45")} />
                  <span className="h-3.5 w-3.5" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2">
                <div className="flex min-w-0 items-baseline gap-1.5 self-end">
                  <span className="truncate text-2xl font-bold leading-none tracking-tight text-card-foreground">
                    {formatMoney(subscription.price, subscription.currency)}
                  </span>
                  {planBadge ? <span className="shrink-0 text-xs font-semibold leading-none text-muted-foreground">{planBadge}</span> : null}
                </div>
                <div className="flex max-w-32 items-center justify-end gap-1.5 self-end text-xs font-semibold leading-none text-muted-foreground">
                  {paymentOption?.iconPath ? <PaymentIcon path={paymentOption.iconPath} /> : null}
                  <span className="truncate">{paymentOption?.label ?? subscription.paymentMethod}</span>
                </div>
                <div className="text-xs font-semibold leading-none text-muted-foreground">{t("detail.end")}</div>
                <div className="truncate text-right text-xs font-semibold leading-none text-muted-foreground">
                  {formatDisplayDate(subscription.endDate, language)}
                </div>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
}

function TableHeaderFilterSelect({
  value,
  options,
  align = "start",
  compactCenter = false,
  onValueChange,
}: {
  value: string;
  options: Array<{ value: string; label: string; iconPath?: string }>;
  align?: "start" | "center" | "end";
  compactCenter?: boolean;
  onValueChange: (value: string) => void;
}) {
  const selectedOption = options.find((option) => option.value === value) ?? options[0];
  const triggerAlignmentClass = align === "end" ? "ml-auto" : align === "center" ? "mx-auto" : null;
  const contentAlign = align === "center" ? "center" : align;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          "table-header-select-trigger h-6 max-w-28 border-0 bg-transparent px-0 text-xs font-semibold shadow-none hover:bg-transparent focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent",
          compactCenter && "relative w-14 max-w-none [&>svg]:absolute [&>svg]:right-0 [&>svg]:size-3",
          triggerAlignmentClass,
        )}
        size="sm"
      >
        <span
          className={cn(
            "flex min-w-0 items-center gap-1.5",
            align === "end" ? "justify-end" : align === "center" ? "justify-center" : null,
            compactCenter && "pointer-events-none absolute inset-x-0 justify-center px-3 text-center",
          )}
        >
          {selectedOption?.iconPath ? <PaymentIcon path={selectedOption.iconPath} /> : null}
          <span className="truncate">{selectedOption?.label}</span>
        </span>
      </SelectTrigger>
      <SelectContent className="detail-select-content" position="popper" side="bottom" align={contentAlign} avoidCollisions={false}>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex min-w-0 items-center gap-1.5">
                {option.iconPath ? <PaymentIcon path={option.iconPath} /> : null}
                <span className="truncate">{option.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function TableHeaderSortButton({
  active,
  direction,
  align = "start",
  onClick,
  children,
}: {
  active: boolean;
  direction: SortDirection;
  align?: "start" | "end";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-6 items-center gap-1 text-xs font-semibold text-foreground transition hover:text-foreground",
        align === "end" ? "ml-auto justify-end" : null,
        active ? "text-foreground" : "text-muted-foreground",
      )}
      onClick={onClick}
    >
      <span>{children}</span>
      {active && direction === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className={cn("h-3 w-3", active ? null : "opacity-40")} />}
    </button>
  );
}

function DetailedSubscriptionsTable({
  groups,
  paymentOptions,
  categoryOptions,
  cycleOptions,
  categoryFilter,
  onCategoryFilterChange,
  cycleFilter,
  onCycleFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  reminderFilter,
  onReminderFilterChange,
  sort,
  direction,
  onSortChange,
  onOpen,
}: {
  groups: DetailedSubscriptionGroup[];
  paymentOptions: ReturnType<typeof localizedPaymentOptions>;
  categoryOptions: ReturnType<typeof localizedCategoryOptions>;
  cycleOptions: ReturnType<typeof localizedCycleOptions>;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  cycleFilter: string;
  onCycleFilterChange: (value: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (value: string) => void;
  reminderFilter: string;
  onReminderFilterChange: (value: string) => void;
  sort: TableSubscriptionSort;
  direction: SortDirection;
  onSortChange: (sort: TableSubscriptionSort) => void;
  onOpen: (subscription: Subscription) => void;
}) {
  const { language, t } = usePreferences();

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <Card className="shrink-0 gap-0 overflow-hidden border border-border p-0 ring-0">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 pl-14 pr-0">
                <TableHeaderFilterSelect
                  value={categoryFilter}
                  options={[
                    { value: "all", label: t("table.subscription") },
                    ...categoryOptions.map((option) => ({ value: option.value, label: option.label })),
                  ]}
                  onValueChange={onCategoryFilterChange}
                />
              </TableHead>
              <TableHead className="h-8">{t("detail.plan")}</TableHead>
              <TableHead className="h-8 text-center">{t("table.quantity")}</TableHead>
              <TableHead className="h-8 text-right">
                <TableHeaderFilterSelect
                  value={cycleFilter}
                  align="end"
                  options={[
                    { value: "all", label: t("table.cycle") },
                    ...cycleOptions.map((option) => ({ value: option.value, label: option.label })),
                  ]}
                  onValueChange={onCycleFilterChange}
                />
              </TableHead>
              <TableHead className="h-8 text-right">
                <TableHeaderSortButton active={sort === "price"} direction={direction} align="end" onClick={() => onSortChange("price")}>
                  {t("detail.price")}
                </TableHeaderSortButton>
              </TableHead>
              <TableHead className="h-8 text-right">
                <TableHeaderSortButton active={sort === "endDate"} direction={direction} align="end" onClick={() => onSortChange("endDate")}>
                  {t("table.endDate")}
                </TableHeaderSortButton>
              </TableHead>
              <TableHead className="h-8 pr-0">
                <TableHeaderFilterSelect
                  value={paymentFilter}
                  options={[
                    { value: "all", label: t("editor.paymentMethod") },
                    ...paymentOptions.map((option) => ({ value: option.value, label: option.label, iconPath: option.iconPath })),
                  ]}
                  onValueChange={onPaymentFilterChange}
                />
              </TableHead>
              <TableHead className="h-8 w-16 pl-0 pr-2 text-center">
                <TableHeaderFilterSelect
                  value={reminderFilter}
                  align="center"
                  compactCenter
                  options={[
                    { value: "all", label: t("table.reminder") },
                    { value: "on", label: t("common.enabled") },
                    { value: "off", label: t("common.disabled") },
                  ]}
                  onValueChange={onReminderFilterChange}
                />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  {t("filter.noResults")}
                </TableCell>
              </TableRow>
            ) : groups.map((group) => {
              const subscription = group.subscription;
              const paymentOption = paymentOptions.find((option) => option.value === subscription.paymentMethod);
              const planBadge = subscription.planName.trim() || (subscription.price === 0 ? "Free" : "-");
              const endDate = formatTableEndDate(subscription.endDate, language);

              return (
                <TableRow key={group.key} className="cursor-pointer" onClick={() => onOpen(subscription)}>
                  <TableCell className="max-w-32 py-1.5 pl-3 pr-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <ServiceIcon subscription={subscription} size="sm" framed={false} />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{serviceLabel(subscription, t)}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {categoryText(subscription.category, subscription.customCategoryName, t)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-24 truncate py-1.5 text-muted-foreground">{planBadge}</TableCell>
                  <TableCell className="py-1.5 text-center font-semibold text-muted-foreground">{group.count}</TableCell>
                  <TableCell className="py-1.5 text-right text-muted-foreground">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>{cycleText(subscription.billingCycle, t)}</span>
                      <RefreshCw className={cn("h-3.5 w-3.5", subscription.isAutoRenewEnabled ? "text-blue-500" : "text-muted-foreground/45")} />
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5 text-right font-semibold">{formatMoney(subscription.price, subscription.currency)}</TableCell>
                  <TableCell className="py-1.5 text-right text-muted-foreground">
                    <div className="flex flex-col items-end leading-tight">
                      <span>{endDate.date}</span>
                      <span className="text-[11px]">{endDate.year}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5 pr-0">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      {paymentOption?.iconPath ? <PaymentIcon path={paymentOption.iconPath} /> : null}
                      <span className="max-w-20 truncate">{paymentOption?.label ?? subscription.paymentMethod}</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-16 py-1.5 pl-0 pr-2 text-center">
                    <div className="inline-flex items-center justify-center text-muted-foreground">
                      <Bell className={cn("h-3.5 w-3.5", subscription.isReminderEnabled ? "text-blue-500" : "text-muted-foreground/45")} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function SubscriptionDetail({
  subscription,
  onEdit,
  onChange,
}: {
  subscription: Subscription;
  onEdit: () => void;
  onChange: (subscription: Subscription) => void;
}) {
  const { language, t } = usePreferences();
  const paymentOptions = useMemo(() => localizedPaymentOptions(t), [t]);
  const accountOptions = useMemo(() => localizedAccountOptions(t), [t]);
  const reminderOptions = useMemo(() => localizedReminderOptions(t), [t]);
  const paymentOption = paymentOptions.find((option) => option.value === subscription.paymentMethod);
  const accountOption = accountOptions.find((option) => option.value === subscription.accountMethod);
  const reminderOption = reminderOptions.find((option) => option.value === String(subscription.reminderDays));
  const monthlyCny = monthlyUnitCny(subscription);
  const annualCny = annualUnitCny(subscription);
  const planText = subscription.planName.trim() || (subscription.price === 0 ? "Free" : t("detail.notSet"));
  const updateSubscription = (patch: Partial<Subscription>) => {
    onChange({ ...subscription, ...patch, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <ServiceIcon subscription={subscription} size="lg" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{serviceLabel(subscription, t)}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {categoryText(subscription.category, subscription.customCategoryName, t)} · {statusText(subscriptionStatus(subscription), t)} · {relativeEnd(subscription, t)}
            </p>
          </div>
        </div>
        <Button className="h-8 px-3 text-xs font-semibold" variant="secondary" onClick={onEdit}>
          <Edit3 data-icon="inline-start" />
          {t("detail.edit")}
        </Button>
      </div>

      <Card className="gap-0 overflow-hidden border-border p-0 ring-0">
        <div className="grid grid-cols-3 divide-x divide-border">
          <DetailMetric label={t("detail.price")} value={subscription.price === 0 ? "Free" : formatMoney(subscription.price, subscription.currency)} detail={cycleText(subscription.billingCycle, t)} />
          <DetailMetric label={t("detail.end")} value={relativeEnd(subscription, t)} detail={formatDisplayDate(subscription.endDate, language)} />
          <DetailMetric label={t("detail.monthlyCny")} value={formatMoney(monthlyCny, "CNY")} detail={`${t("detail.annualCny")} ${formatMoney(annualCny, "CNY")}`} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="gap-0 overflow-hidden border-border p-0 ring-0">
          <div className="border-b border-border px-4 py-3 text-sm font-bold">{t("detail.billingInfo")}</div>
          <DetailInfoRow label={t("detail.category")} value={categoryText(subscription.category, subscription.customCategoryName, t)} />
          <DetailInfoRow label={t("detail.plan")} value={planText} />
          <DetailInfoRow label={t("editor.cycle")} value={cycleText(subscription.billingCycle, t)} />
          <DetailInfoRow label={t("detail.start")} value={formatDisplayDate(subscription.startDate, language)} />
          <DetailInfoRow label={t("detail.end")} value={formatDisplayDate(subscription.endDate, language)} />
          <DetailInfoRow label={t("detail.convertedCny")} value={formatMoney(toCny(subscription.price, subscription.currency), "CNY")} />
        </Card>

        <Card className="gap-0 overflow-hidden border-border p-0 ring-0">
          <div className="border-b border-border px-4 py-3 text-sm font-bold">{t("detail.accountInfo")}</div>
          <DetailInfoRow
            label={t("detail.payment")}
            value={paymentOption?.label ?? subscription.paymentMethod}
            icon={paymentOption?.iconPath ? <PaymentIcon path={paymentOption.iconPath} /> : undefined}
          />
          <DetailInfoRow
            label={t("detail.loginMethod")}
            value={accountOption?.label ?? subscription.accountMethod}
            icon={accountOption?.iconPath ? <PaymentIcon path={accountOption.iconPath} /> : undefined}
          />
          <DetailInfoRow label={t("detail.account")} value={subscription.accountIdentifier.trim() || t("detail.notSet")} />
          <DetailSwitchRow
            label={t("detail.autoRenew")}
            checked={subscription.isAutoRenewEnabled}
            value={subscription.isAutoRenewEnabled ? t("common.enabled") : t("common.disabled")}
            icon={<RefreshCw className={cn("h-3.5 w-3.5", subscription.isAutoRenewEnabled ? "text-blue-500" : "text-muted-foreground")} />}
            onCheckedChange={(checked) => updateSubscription({ isAutoRenewEnabled: checked })}
          />
          <DetailSwitchRow
            label={t("detail.reminder")}
            checked={subscription.isReminderEnabled}
            value={subscription.isReminderEnabled ? reminderOption?.label ?? t("common.enabled") : t("common.disabled")}
            icon={<Bell className={cn("h-3.5 w-3.5", subscription.isReminderEnabled ? "text-blue-500" : "text-muted-foreground")} />}
            onCheckedChange={(checked) => updateSubscription({ isReminderEnabled: checked })}
          />
          <DetailSwitchRow
            label={t("detail.pinned")}
            checked={subscription.isPinned}
            value={subscription.isPinned ? t("common.enabled") : t("common.disabled")}
            icon={<Pin className={cn("h-3.5 w-3.5", subscription.isPinned ? "text-blue-500" : "text-muted-foreground")} />}
            onCheckedChange={(checked) => updateSubscription({ isPinned: checked })}
          />
        </Card>
      </div>

      {subscription.notes ? (
        <Card className="border-border p-4 ring-0">
          <div className="mb-2 text-sm font-semibold text-foreground">{t("editor.notes")}</div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{subscription.notes}</p>
        </Card>
      ) : null}
    </div>
  );
}

function DetailMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0 px-4 py-3">
      <div className="truncate text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="mt-2 truncate text-xl font-bold text-foreground">{value}</div>
      <div className="mt-1 truncate text-xs font-medium text-muted-foreground">{detail}</div>
    </div>
  );
}

function DetailInfoRow({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="grid min-h-11 grid-cols-[104px_1fr] items-center gap-3 border-b border-border px-4 last:border-b-0">
      <div className="truncate text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="flex min-w-0 items-center justify-end gap-1.5 text-right text-xs font-semibold text-foreground">
        {icon}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function DetailSwitchRow({
  label,
  value,
  checked,
  icon,
  onCheckedChange,
}: {
  label: string;
  value: string;
  checked: boolean;
  icon: ReactNode;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="grid min-h-11 grid-cols-[104px_1fr] items-center gap-3 border-b border-border px-4 last:border-b-0">
      <div className="truncate text-xs font-semibold text-muted-foreground">{label}</div>
      <div className="flex min-w-0 items-center justify-end gap-2">
        {icon}
        <span className="min-w-0 truncate text-right text-xs font-semibold text-muted-foreground">{value}</span>
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}

function Editor({
  draft,
  onChange,
  onCancel,
  onSave,
  onDelete,
}: {
  draft: Subscription;
  onChange: (draft: Subscription) => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete?: () => void;
}) {
  const { t } = usePreferences();
  const categoryOptionsForLanguage = useMemo(() => localizedCategoryOptions(t), [t]);
  const cycleOptionsForLanguage = useMemo(() => localizedCycleOptions(t), [t]);
  const paymentOptionsForLanguage = useMemo(() => localizedPaymentOptions(t), [t]);
  const accountOptionsForLanguage = useMemo(() => localizedAccountOptions(t), [t]);
  const accountStore = loadAccountStore();
  const enabledAccountOptions = useMemo(
    () => accountOptionsForLanguage.filter((option) => accountStore[option.value] !== undefined),
    [accountOptionsForLanguage, accountStore],
  );
  const savedAccounts = useMemo(() => accountStore[draft.accountMethod] ?? [], [accountStore, draft.accountMethod]);
  const [accountInputFocused, setAccountInputFocused] = useState(false);

  useEffect(() => {
    if (enabledAccountOptions.length > 0 && !enabledAccountOptions.some((option) => option.value === draft.accountMethod)) {
      patch({ accountMethod: enabledAccountOptions[0].value });
    }
  }, [enabledAccountOptions, draft.accountMethod]);

  const reminderOptionsForLanguage = useMemo(() => localizedReminderOptions(t), [t]);
  const template = serviceTemplateFor(draft);
  const templatePlanConfig = planConfigForTemplateId(template?.id);
  const [priceText, setPriceText] = useState(() => formatEditableNumber(draft.price));
  const [notesEnabled, setNotesEnabled] = useState(() => Boolean(draft.notes.trim()));
  const [templatePlanValue, setTemplatePlanValue] = useState(() => inferTemplatePlanValue(draft.planName, template?.id));

  useEffect(() => {
    setPriceText(formatEditableNumber(draft.price));
    setNotesEnabled(Boolean(draft.notes.trim()));
    setTemplatePlanValue(inferTemplatePlanValue(draft.planName, serviceTemplateFor(draft)?.id));
  }, [draft.id]);

  function patch(update: Partial<Subscription>) {
    const next = normalizeSubscription({ ...draft, ...update });
    onChange(next);
  }

  function daysInMonth(year: number, monthIndex: number) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  function dateInMonth(year: number, monthIndex: number, desiredDay: number) {
    return new Date(year, monthIndex, Math.min(desiredDay, daysInMonth(year, monthIndex)));
  }

  function endDateFromStartDate(startDate: string, currentEndDate: string) {
    const start = parseLocalDate(startDate);
    const currentEnd = parseLocalDate(currentEndDate);
    const desiredEndDay = start.getDate() > 1 ? start.getDate() - 1 : 31;
    let year = currentEnd.getFullYear();
    let month = currentEnd.getMonth();
    let candidate = dateInMonth(year, month, desiredEndDay);

    while (candidate.getTime() <= start.getTime()) {
      month += 1;
      if (month > 11) {
        month = 0;
        year += 1;
      }
      candidate = dateInMonth(year, month, desiredEndDay);
    }

    return toISODate(candidate);
  }

  function minimumEndDateForCycle(startDate: string, billingCycle: Subscription["billingCycle"], customCycleDays: number) {
    const date = parseLocalDate(addCycle(startDate, billingCycle, customCycleDays));
    date.setDate(date.getDate() - 1);
    return toISODate(date);
  }

  function endDateFromStartDateForCycle(
    startDate: string,
    currentEndDate: string,
    billingCycle: Subscription["billingCycle"],
    customCycleDays: number,
  ) {
    const candidate = endDateFromStartDate(startDate, currentEndDate);
    const minimumEndDate = minimumEndDateForCycle(startDate, billingCycle, customCycleDays);
    if (parseLocalDate(candidate).getTime() >= parseLocalDate(minimumEndDate).getTime()) return candidate;
    return minimumEndDate;
  }

  function startDateFromEndDate(endDate: string, currentStartDate: string) {
    const end = parseLocalDate(endDate);
    const currentStart = parseLocalDate(currentStartDate);
    const desiredStartDay = end.getDate() < 31 ? end.getDate() + 1 : 1;
    let year = currentStart.getFullYear();
    let month = currentStart.getMonth();
    let candidate = dateInMonth(year, month, desiredStartDay);

    while (candidate.getTime() >= end.getTime()) {
      month -= 1;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
      candidate = dateInMonth(year, month, desiredStartDay);
    }

    return toISODate(candidate);
  }

  const isTemplate = Boolean(template);
  const priceSymbol = currencySymbol(draft.currency);
  const priceInputPaddingLeft = Math.max(priceSymbol.length + 1.1, 2.1);
  const priceInputWidth = Math.min(Math.max(priceText.length + priceInputPaddingLeft + 1.25, 5.5), 16);
  const headerSubscription = template
    ? {
        ...draft,
        sourceTemplateId: template.id,
        serviceName: template.serviceName,
        iconName: template.iconName,
        iconDataUrl: "",
      }
    : draft;

  return (
    <div className="flex flex-col gap-5">
      <Card className="gap-0 px-4 pb-0 pt-4">
        <div className="flex flex-row items-center gap-4">
          {isTemplate ? (
            <ServiceIcon subscription={headerSubscription} size="lg" />
          ) : (
            <CustomIconUploadButton
              subscription={draft}
              onUpload={(iconDataUrl) => patch({ iconDataUrl })}
            />
          )}
          <div className="min-w-0 flex-1">
            {isTemplate ? (
              <div className="truncate text-xl font-bold">{serviceLabel(headerSubscription, t)}</div>
            ) : (
              <Input className="w-56 text-left text-xl font-bold" value={draft.serviceName} onChange={(event) => patch({ serviceName: event.target.value })} />
            )}
          </div>
        </div>
        <div className="mt-3 grid min-h-10 grid-cols-[140px_1fr] items-center gap-4 border-t border-border">
          <div className="text-sm font-semibold text-muted-foreground">{t("editor.category")}</div>
          <div className="flex justify-end">
            <OptionSelect className="w-fit min-w-16 max-w-32" value={draft.category} options={categoryOptionsForLanguage} onValueChange={(value) => patch({ category: value as Subscription["category"] })} />
          </div>
        </div>
        {draft.category === "custom" ? (
          <div className="grid min-h-10 grid-cols-[140px_1fr] items-center gap-4 border-t border-border">
            <div className="text-sm font-semibold text-muted-foreground">{t("editor.customCategory")}</div>
            <div className="flex justify-end">
              <Input className="w-36" value={draft.customCategoryName ?? ""} placeholder={t("editor.customCategory")} onChange={(event) => patch({ customCategoryName: event.target.value })} />
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="gap-0 px-5 py-1">
        <FieldRow label={t("editor.cycle")}>
          <ToggleGroup
            type="single"
            value={draft.billingCycle}
            onValueChange={(value) => {
              if (!value) return;
              const billingCycle = value as Subscription["billingCycle"];
              const customCycleDays = billingCycle === "yearly" ? 365 : billingCycle === "monthly" ? 30 : draft.customCycleDays;
              patch({
                billingCycle,
                customCycleDays,
                endDate: endDateFromStartDateForCycle(draft.startDate, draft.endDate, billingCycle, customCycleDays),
              });
            }}
            variant="outline"
            size="sm"
            spacing={0}
          >
            {cycleOptionsForLanguage.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                className="w-16 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </FieldRow>
        {draft.billingCycle === "customDays" ? (
          <FieldRow label={t("editor.customDays")}>
            <Input
              className="w-[60px] text-right"
              type="text"
              inputMode="numeric"
              value={draft.customCycleDays}
              onChange={(event) => {
                const customCycleDays = parseIntegerInput(event.target.value);
                patch({
                  customCycleDays,
                  endDate: endDateFromStartDateForCycle(draft.startDate, draft.endDate, draft.billingCycle, customCycleDays),
                });
              }}
            />
          </FieldRow>
        ) : null}
        <FieldRow label={t("editor.autoRenew")}>
          <Switch
            checked={draft.isAutoRenewEnabled}
            onCheckedChange={(checked) =>
              patch({
                isAutoRenewEnabled: checked,
                endDate: endDateFromStartDateForCycle(draft.startDate, draft.endDate, draft.billingCycle, draft.customCycleDays),
              })
            }
          />
        </FieldRow>
        <FieldRow label={t("editor.startDate")}>
          <DatePicker
            value={draft.startDate}
            onChange={(value) =>
              patch({
                startDate: value,
                endDate: endDateFromStartDateForCycle(value, draft.endDate, draft.billingCycle, draft.customCycleDays),
              })
            }
          />
        </FieldRow>
        <FieldRow label={t("editor.endDate")}>
          <DatePicker
            value={draft.endDate}
            onChange={(value) =>
              patch({
                endDate: value,
                startDate: startDateFromEndDate(value, draft.startDate),
              })
            }
          />
        </FieldRow>
        <FieldRow label={t("editor.planName")}>
          {templatePlanConfig ? (
            <OptionSelect
              className="w-fit min-w-12 max-w-24 px-1.5"
              variant="subtle"
              value={templatePlanValue}
              options={[
                ...templatePlanConfig.options.map((option) => ({ value: option, label: option })),
                { value: customPlanValue, label: t("common.custom") },
              ]}
              onValueChange={(value) => {
                setTemplatePlanValue(value);
                patch({ planName: value === customPlanValue ? "" : value });
              }}
            />
          ) : (
            <Input className="w-36 text-right" placeholder={t("editor.planName")} value={draft.planName} onChange={(event) => patch({ planName: event.target.value })} />
          )}
        </FieldRow>
        {templatePlanConfig && templatePlanValue === customPlanValue ? (
          <FieldRow label={t("common.custom")}>
            <Input className="w-36 text-right" placeholder={t("editor.planName")} value={draft.planName} onChange={(event) => patch({ planName: event.target.value })} />
          </FieldRow>
        ) : null}
        <FieldRow label={t("editor.currency")}>
          <ExchangeCurrencySelect value={draft.currency} onValueChange={(value) => patch({ currency: value })} />
        </FieldRow>
        <FieldRow label={t("editor.price")}>
          <div
            className="relative"
            style={{ width: `${priceInputWidth}ch` }}
          >
            <span className="pointer-events-none absolute left-1.5 top-1/2 z-10 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              {priceSymbol}
            </span>
            <Input
              className="w-full !border-0 !bg-transparent pr-1.5 text-right !shadow-none !ring-0 focus-visible:!border-0 focus-visible:!ring-0 dark:!bg-transparent"
              type="text"
              inputMode="decimal"
              style={{ paddingLeft: `${priceInputPaddingLeft}ch` }}
              value={priceText}
              onBlur={() => setPriceText(formatEditableNumber(parsePriceInput(priceText)))}
              onChange={(event) => {
                const nextPriceText = parseDecimalTextInput(event.target.value);
                setPriceText(nextPriceText);
                patch({ price: parsePriceInput(nextPriceText) });
              }}
            />
          </div>
        </FieldRow>
        <FieldRow label={t("editor.paymentMethod")}>
          <OptionSelect className="w-fit min-w-20 max-w-36" variant="subtle" value={draft.paymentMethod} options={paymentOptionsForLanguage} onValueChange={(value) => patch({ paymentMethod: value })} />
        </FieldRow>
        <FieldRow label={t("editor.accountMethod")}>
          <OptionSelect className="w-fit min-w-20 max-w-36" variant="subtle" value={draft.accountMethod} options={enabledAccountOptions} onValueChange={(value) => patch({ accountMethod: value })} />
        </FieldRow>
        <FieldRow label={t("editor.accountInfo")}>
          <div className="relative w-48">
            <Input
              className="w-48 text-right"
              placeholder={t("editor.accountInfo")}
              value={draft.accountIdentifier}
              onChange={(event) => patch({ accountIdentifier: event.target.value })}
              onFocus={() => setAccountInputFocused(true)}
              onBlur={() => setTimeout(() => setAccountInputFocused(false), 150)}
            />
            {accountInputFocused && savedAccounts.length > 0 && !savedAccounts.some((account) => account.value === draft.accountIdentifier) ? (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-md">
                {savedAccounts.map((account) => (
                  <button
                    key={account.value}
                    className="flex w-full items-center px-3 py-2 text-left text-xs transition hover:bg-accent"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      patch({ accountIdentifier: account.value });
                      setAccountInputFocused(false);
                    }}
                  >
                    {account.value}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </FieldRow>
        <FieldRow label={t("editor.pinned")}>
          <Switch checked={draft.isPinned} onCheckedChange={(checked) => patch({ isPinned: checked })} />
        </FieldRow>
        <FieldRow label={t("editor.reminder")}>
          <div className="flex items-center gap-2">
            {draft.isReminderEnabled ? (
              <OptionSelect
                className="w-fit min-w-20 max-w-28"
                variant="subtle"
                value={String(draft.reminderDays)}
                options={reminderOptionsForLanguage}
                onValueChange={(value) => patch({ reminderDays: Number(value) as ReminderDays })}
              />
            ) : null}
            <Switch checked={draft.isReminderEnabled} onCheckedChange={(checked) => patch({ isReminderEnabled: checked })} />
          </div>
        </FieldRow>
        <FieldRow label={t("editor.notes")}>
          <Switch checked={notesEnabled} onCheckedChange={setNotesEnabled} />
        </FieldRow>
        {notesEnabled ? (
          <div className="border-b border-border pb-3 pt-2 last:border-b-0">
            <Textarea value={draft.notes} onChange={(event) => patch({ notes: event.target.value })} />
          </div>
        ) : null}
      </Card>

      <div className="-mt-3 flex justify-center gap-2">
        <Button className="bottom-action-button cancel-action-button" variant="secondary" size="xs" onClick={onCancel}>
          <X data-icon="inline-start" />
          <span className="bottom-action-label">{t("common.cancel")}</span>
        </Button>
        <Button className="bottom-action-button" size="xs" onClick={onSave}>
          <Check data-icon="inline-start" />
          <span className="bottom-action-label">{t("common.save")}</span>
        </Button>
      </div>

      {onDelete ? (
        <div className="flex justify-end">
          <Button variant="destructive" onClick={onDelete}>
            <Trash2 data-icon="inline-start" />
            {t("editor.delete")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function AddSelectPage({
  query,
  onQueryChange,
  onPickTemplate,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onPickTemplate: (template: ServiceTemplate) => void;
}) {
  const { t } = usePreferences();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const filteredTemplates = serviceTemplates.filter((template) => {
    const term = query.trim().toLowerCase();
    const matchesQuery = !term || `${template.serviceName} ${serviceLabel(template, t)} ${categoryText(template.category, undefined, t)}`.toLowerCase().includes(term);
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });
  const [page, setPage] = useState(1);
  const pageSize = 48;
  const totalPages = Math.max(Math.ceil(filteredTemplates.length / pageSize), 1);
  const visibleTemplates = filteredTemplates.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, categoryFilter]);

  return (
    <div className="flex min-h-[calc(100vh-160px)] flex-1 flex-col">
      <div className="pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            className="h-8 w-full rounded-full border-transparent bg-zinc-100 pl-8 pr-3 text-left text-[11px] font-normal text-zinc-700 placeholder:text-[11px] placeholder:text-zinc-500 focus:border-zinc-200 focus:bg-white focus:ring-0"
            placeholder={t("add.searchPlatform")}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[{ value: "all", label: t("add.allCategories") }, ...categoryOptions].map((option) => (
            <button
              key={option.value}
              className={cn(
                "category-filter-button rounded-full px-3 py-1.5 font-semibold transition",
                categoryFilter === option.value
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
              )}
              onClick={() => setCategoryFilter(option.value)}
            >
              {option.value === "all" ? t("add.allCategories") : categoryText(option.value as SubscriptionCategory, undefined, t)}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto pb-4">
        {filteredTemplates.length === 0 ? (
          <Card className="flex min-h-[260px] items-center justify-center p-8 text-center text-sm text-zinc-500">{t("add.noResults")}</Card>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {visibleTemplates.map((template) => {
              const subscription = makeSubscriptionFromTemplate(template);
              return (
                <button
                  key={template.id}
                  className="flex min-h-[64px] items-center gap-2 rounded-2xl border border-border bg-card py-2 pl-3 pr-2 text-left transition hover:bg-muted"
                  onClick={() => onPickTemplate(template)}
                >
                  <ServiceIcon subscription={subscription} size="sm" framed={false} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-card-foreground">{serviceLabel(template, t)}</div>
                    <div className="mt-0.5 truncate text-[10px] text-zinc-500">{categoryText(template.category, undefined, t)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                text={t("pagination.previous")}
                onClick={(event) => {
                  event.preventDefault();
                  setPage((current) => Math.max(current - 1, 1));
                }}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((pageNumber) => {
                if (totalPages <= 7) return true;
                if (pageNumber === 1 || pageNumber === totalPages) return true;
                if (Math.abs(pageNumber - page) <= 1) return true;
                return false;
              })
              .flatMap((pageNumber, index, array) => {
                const prev = array[index - 1];
                const items: React.ReactNode[] = [];
                if (prev !== undefined && pageNumber - prev > 1) {
                  items.push(
                    <PaginationItem key={`ellipsis-${pageNumber}`}>
                      <PaginationEllipsis />
                    </PaginationItem>,
                  );
                }
                items.push(
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={pageNumber === page}
                      onClick={(event) => {
                        event.preventDefault();
                        setPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>,
                );
                return items;
              })}
            <PaginationItem>
              <PaginationNext
                href="#"
                text={t("pagination.next")}
                onClick={(event) => {
                  event.preventDefault();
                  setPage((current) => Math.min(current + 1, totalPages));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  );
}

function EmptyDetail({ onAdd }: { onAdd: () => void }) {
  const { t } = usePreferences();

  return (
    <Card className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-200">
        <Plus className="h-7 w-7 text-zinc-600" />
      </div>
      <div className="text-xl font-bold">{t("empty.title")}</div>
      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">{t("empty.description")}</p>
      <Button className="mt-5" onClick={onAdd}>
        {t("empty.add")}
      </Button>
    </Card>
  );
}

function ServiceIcon({
  subscription,
  size,
  framed = true,
}: {
  subscription: Pick<Subscription, "serviceName" | "iconName" | "iconDataUrl">;
  size: "sm" | "md" | "lg" | "xl";
  framed?: boolean;
}) {
  const sizeClass = {
    sm: "h-9 w-9 rounded-lg",
    md: "h-11 w-11 rounded-xl",
    lg: "h-16 w-16 rounded-2xl",
    xl: "h-24 w-24 rounded-3xl",
  }[size];
  const iconScaleOverrides: Record<string, string> = {
    capcut: "scale-125",
    cloudflare: "scale-125",
    gemini: "scale-110",
    claude: "scale-110",
    chatgpt: "scale-110",
  };
  const iconScaleClass = iconScaleOverrides[subscription.iconName];
  const shouldInvertInDarkMode = subscription.iconName === "chatgpt" || subscription.iconName === "deno";

  if (subscription.iconDataUrl) {
    return (
      <div className={cn("flex shrink-0 items-center justify-center overflow-hidden bg-white", framed ? "border border-zinc-200 p-1" : "p-1", sizeClass)}>
        <img className="h-full w-full object-contain" src={subscription.iconDataUrl} alt="" />
      </div>
    );
  }

  if (subscription.iconName === "custom") {
    return <div className={cn("flex shrink-0 items-center justify-center bg-zinc-200 text-sm font-bold text-zinc-600", sizeClass)}>{subscription.serviceName.slice(0, 1)}</div>;
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        framed ? "border border-zinc-200 bg-white p-2" : "p-1",
        framed && shouldInvertInDarkMode ? "dark:border-zinc-700 dark:bg-zinc-950" : null,
        sizeClass,
      )}
    >
      <img className={cn("h-full w-full object-contain", iconScaleClass, shouldInvertInDarkMode ? "dark:invert" : null)} src={iconPath(subscription.iconName)} alt="" />
    </div>
  );
}

function CustomIconUploadButton({
  subscription,
  onUpload,
}: {
  subscription: Subscription;
  onUpload: (iconDataUrl: string) => void;
}) {
  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onUpload(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <label className="group relative block cursor-pointer" title="上传 icon">
      <input
        className="sr-only"
        type="file"
        accept="image/*"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      {subscription.iconDataUrl ? (
        <ServiceIcon subscription={subscription} size="lg" />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-100 text-zinc-500 transition group-hover:border-zinc-400 group-hover:bg-zinc-200">
          <ImagePlus className="h-5 w-5" />
        </div>
      )}
    </label>
  );
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-h-12 grid-cols-[140px_1fr] items-center gap-4 border-b border-border last:border-b-0">
      <div className="text-sm font-semibold text-muted-foreground">{label}</div>
      <div className="flex justify-end">{children}</div>
    </div>
  );
}

function DatePicker({ value, disabled, onChange }: { value: string; disabled?: boolean; onChange: (value: string) => void }) {
  const { language } = usePreferences();
  const selected = parseLocalDate(value);
  const currentYear = new Date().getFullYear();
  const calendarLocale = language === "en" ? enUS : zhCN;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="w-36 justify-between font-normal" variant="outline" size="sm" disabled={disabled}>
          {formatDisplayDate(value, language)}
          <CalendarIcon data-icon="inline-end" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end" side="bottom" avoidCollisions={false}>
        <Calendar
          key={value}
          mode="single"
          locale={calendarLocale}
          selected={selected}
          defaultMonth={selected}
          captionLayout="dropdown"
          startMonth={new Date(currentYear - 20, 0)}
          endMonth={new Date(currentYear + 20, 11)}
          onSelect={(date) => {
            if (date) onChange(toISODate(date));
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function OptionSelect<TValue extends string>({
  value,
  options,
  className,
  variant = "boxed",
  onValueChange,
}: {
  value: TValue;
  options: Array<{ value: TValue; label: string; iconPath?: string }>;
  className?: string;
  variant?: "subtle" | "boxed";
  onValueChange: (value: TValue) => void;
}) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          variant === "subtle"
            ? "border-0 bg-transparent shadow-none hover:bg-muted focus-visible:border-0 dark:bg-transparent dark:hover:bg-muted/50"
            : null,
          className,
        )}
        size="sm"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {selectedOption?.iconPath ? <PaymentIcon path={selectedOption.iconPath} /> : null}
          <span className="truncate">{selectedOption?.label}</span>
        </span>
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" avoidCollisions={false}>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-1.5">
                {option.iconPath ? <PaymentIcon path={option.iconPath} /> : null}
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

function PaymentIcon({ path }: { path: string }) {
  return (
    <span
      className="inline-block size-3.5 shrink-0 bg-current opacity-80"
      style={{
        WebkitMask: `url("${path}") center / contain no-repeat`,
        mask: `url("${path}") center / contain no-repeat`,
      }}
    />
  );
}

function MaskedIcon({ path, className }: { path: string; className?: string }) {
  return (
    <span
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        WebkitMask: `url("${path}") center / contain no-repeat`,
        mask: `url("${path}") center / contain no-repeat`,
      }}
    />
  );
}

function relativeEnd(subscription: Subscription, t: (key: string) => string) {
  const days = daysUntil(subscription.endDate);
  if (days < 0) return `${t("relative.expiredPrefix")} ${Math.abs(days)} ${t("relative.days")}`;
  if (days === 0) return t("relative.today");
  return `${days} ${t("relative.after")}`;
}

function parsePriceInput(value: string) {
  const normalized = value
    .replace(/。/g, ".")
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1")
    .replace(/^(\d*\.?\d{0,2}).*$/, "$1");
  const parsed = Number(normalized);
  return normalized === "" || Number.isNaN(parsed) ? 0 : parsed;
}

function parseDecimalTextInput(value: string) {
  return value
    .replace(/。/g, ".")
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1")
    .replace(/^(\d*\.?\d{0,2}).*$/, "$1");
}

function formatEditableNumber(value: number) {
  return Number.isFinite(value) ? String(value) : "0";
}

function parseIntegerInput(value: string) {
  const normalized = value.replace(/\D/g, "");
  return normalized === "" ? 0 : Number(normalized);
}

function monthlyUnitCny(subscription: Subscription) {
  const amount = toCny(subscription.price, subscription.currency);
  if (subscription.billingCycle === "yearly") return amount / 12;
  if (subscription.billingCycle === "customDays") return amount * (30 / Math.max(subscription.customCycleDays, 1));
  return amount;
}

function annualUnitCny(subscription: Subscription) {
  return monthlyUnitCny(subscription) * 12;
}

function buildMonthlyCostDistribution(subscriptions: Subscription[]) {
  const buckets = [
    { label: "Free", min: 0, max: 0, count: 0 },
    { label: "0-20", min: 0, max: 20, count: 0 },
    { label: "21-50", min: 20, max: 50, count: 0 },
    { label: "50-100", min: 50, max: 100, count: 0 },
    { label: "100-200", min: 100, max: 200, count: 0 },
    { label: "201-300", min: 200, max: 300, count: 0 },
    { label: "301-500", min: 300, max: 500, count: 0 },
    { label: "500-1000", min: 500, max: 1000, count: 0 },
    { label: "1000+", min: 1000, max: Infinity, count: 0 },
  ];

  subscriptions.forEach((subscription) => {
    const monthlyCost = monthlyUnitCny(subscription);
    if (monthlyCost === 0) {
      buckets[0].count += 1;
      return;
    }

    const bucket = buckets.find((item) => monthlyCost > item.min && monthlyCost <= item.max);
    if (bucket) bucket.count += 1;
  });

  return buckets;
}

function buildMonthlyCashflowTimeline(subscriptions: Subscription[], language: LanguageCode) {
  const today = parseLocalDate(toISODate(new Date()));
  const periodStart = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const periodEnd = new Date(today.getFullYear(), today.getMonth() + 4, 0);
  const formatter = new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", { month: "short" });
  const rangeFormatter = new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", { year: "numeric" });
  const months = Array.from({ length: 15 }, (_, index) => {
    const date = new Date(periodStart.getFullYear(), periodStart.getMonth() + index, 1);
    return {
      key: monthKey(date),
      label: formatter.format(date),
      amountCny: 0,
      isForecast: date > currentMonthEnd,
      yearLabel: rangeFormatter.format(date),
    };
  });
  const monthMap = new Map(months.map((month) => [month.key, month]));

  subscriptions.forEach((subscription) => {
    const amountCny = toCny(subscription.price, subscription.currency);
    if (amountCny === 0) return;

    if (!subscription.isAutoRenewEnabled) {
      const paymentDate = parseLocalDate(subscription.startDate);
      if (paymentDate >= periodStart && paymentDate <= periodEnd) {
        const month = monthMap.get(monthKey(paymentDate));
        if (month) month.amountCny += amountCny;
      }
      return;
    }

    let paymentDate = parseLocalDate(subscription.startDate);
    while (paymentDate < periodStart) {
      paymentDate = parseLocalDate(addCycle(toISODate(paymentDate), subscription.billingCycle, subscription.customCycleDays));
    }

    while (paymentDate <= periodEnd) {
      const month = monthMap.get(monthKey(paymentDate));
      if (month) month.amountCny += amountCny;
      paymentDate = parseLocalDate(addCycle(toISODate(paymentDate), subscription.billingCycle, subscription.customCycleDays));
    }
  });

  return months;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function detailedGroupKey(subscription: Subscription) {
  const serviceIdentity = subscription.sourceTemplateId
    || [
      "custom",
      subscription.serviceName.trim().toLowerCase(),
      subscription.iconName,
      subscription.iconDataUrl ?? "",
    ].join(":");
  const cycleIdentity = subscription.billingCycle === "customDays" ? `${subscription.billingCycle}:${subscription.customCycleDays}` : subscription.billingCycle;
  return `${serviceIdentity}::${cycleIdentity}`;
}

function groupDetailedSubscriptions(subscriptions: Subscription[]): DetailedSubscriptionGroup[] {
  const groups = new Map<string, DetailedSubscriptionGroup>();

  subscriptions.forEach((subscription) => {
    const key = detailedGroupKey(subscription);
    const existing = groups.get(key);

    if (existing) {
      existing.count += 1;
      existing.members.push(subscription);
      return;
    }

    groups.set(key, {
      key,
      subscription,
      count: 1,
      members: [subscription],
    });
  });

  return Array.from(groups.values());
}

function sortDetailedSubscriptions(subscriptions: Subscription[], sort: DetailSubscriptionSort, direction: SortDirection) {
  const directionMultiplier = direction === "asc" ? 1 : -1;

  return [...subscriptions].sort((a, b) => {
    let diff = 0;

    if (sort === "startDate") {
      diff = parseLocalDate(a.startDate).getTime() - parseLocalDate(b.startDate).getTime();
    } else if (sort === "monthlyPrice") {
      diff = monthlyUnitCny(a) - monthlyUnitCny(b);
    } else if (sort === "annualPrice") {
      diff = annualUnitCny(a) - annualUnitCny(b);
    } else {
      diff = parseLocalDate(a.endDate).getTime() - parseLocalDate(b.endDate).getTime();
    }

    if (diff !== 0) return diff * directionMultiplier;
    return serviceLabel(a, (key) => translations.zh[key] ?? key).localeCompare(serviceLabel(b, (key) => translations.zh[key] ?? key), "zh-CN");
  });
}

function sortTableSubscriptions(subscriptions: Subscription[], sort: TableSubscriptionSort, direction: SortDirection) {
  const directionMultiplier = direction === "asc" ? 1 : -1;

  return [...subscriptions].sort((a, b) => {
    const diff = sort === "price"
      ? toCny(a.price, a.currency) - toCny(b.price, b.currency)
      : parseLocalDate(a.endDate).getTime() - parseLocalDate(b.endDate).getTime();

    if (diff !== 0) return diff * directionMultiplier;
    return serviceLabel(a, (key) => translations.zh[key] ?? key).localeCompare(serviceLabel(b, (key) => translations.zh[key] ?? key), "zh-CN");
  });
}

function sortSubscriptions(subscriptions: Subscription[]) {
  return [...subscriptions].sort((a, b) => {
    const dateDiff = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.serviceName.localeCompare(b.serviceName, "zh-CN");
  });
}
