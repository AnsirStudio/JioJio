export type CurrencyCode = "CNY" | "USD" | "EUR" | "JPY" | "GBP" | "HKD" | "AUD" | "CAD" | "SGD" | "TRY" | "NGN";
export type BillingCycle = "monthly" | "yearly" | "customDays";
export type SubscriptionStatus = "active" | "cancelled";
export type SubscriptionCategory = "video" | "ai" | "developer" | "cloud" | "tool" | "music" | "social" | "shopping" | "custom";
export type PaymentMethod = "appStore" | "wechat" | "alipay" | "douyin" | "creditCard" | "giftCard" | "googlePay" | "paypal";
export type AccountMethod = "phone" | "wechat" | "email" | "qq" | "gmail" | "appleId" | "github";
export type ReminderDays = 0 | 1 | 3 | 7;

export type ServiceTemplate = {
  id: string;
  serviceName: string;
  iconName: string;
  category: SubscriptionCategory;
  defaultCycle: BillingCycle;
};

export type Subscription = {
  id: string;
  sourceTemplateId?: string;
  serviceName: string;
  iconName: string;
  iconDataUrl?: string;
  category: SubscriptionCategory;
  customCategoryName?: string;
  planName: string;
  price: number;
  currency: CurrencyCode;
  paymentMethod: PaymentMethod;
  accountMethod: AccountMethod;
  accountIdentifier: string;
  isPinned: boolean;
  isAutoRenewEnabled: boolean;
  isReminderEnabled: boolean;
  reminderDays: ReminderDays;
  billingCycle: BillingCycle;
  customCycleDays: number;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export const usdToCnyRate = 6.8;

export const currencyOptions: Array<{ value: CurrencyCode; label: string; countryCode: string; unitPerCny: number }> = [
  { value: "CNY", label: "人民币 CNY", countryCode: "CN", unitPerCny: 1 },
  { value: "USD", label: "美元 USD", countryCode: "US", unitPerCny: 0.14767 },
  { value: "EUR", label: "欧元 EUR", countryCode: "EU", unitPerCny: 0.12781 },
  { value: "JPY", label: "日元 JPY", countryCode: "JP", unitPerCny: 23.699 },
  { value: "GBP", label: "英镑 GBP", countryCode: "GB", unitPerCny: 0.11031 },
  { value: "HKD", label: "港币 HKD", countryCode: "HK", unitPerCny: 1.1585 },
  { value: "AUD", label: "澳元 AUD", countryCode: "AU", unitPerCny: 0.21069 },
  { value: "CAD", label: "加元 CAD", countryCode: "CA", unitPerCny: 0.20643 },
  { value: "SGD", label: "新加坡元 SGD", countryCode: "SG", unitPerCny: 0.19002 },
  { value: "TRY", label: "土耳其里拉 TRY", countryCode: "TR", unitPerCny: 6.8199 },
  { value: "NGN", label: "尼日利亚奈拉 NGN", countryCode: "NG", unitPerCny: 201.11 },
];

export const paymentMethodOptions: Array<{ value: PaymentMethod; label: string; iconPath: string }> = [
  { value: "appStore", label: "App Store", iconPath: "/payment-icons/appstore.svg" },
  { value: "wechat", label: "微信", iconPath: "/payment-icons/wechat.svg" },
  { value: "alipay", label: "支付宝", iconPath: "/payment-icons/alipay.svg" },
  { value: "douyin", label: "抖音", iconPath: "/payment-icons/douyin.svg" },
  { value: "creditCard", label: "信用卡", iconPath: "/payment-icons/credit-card.svg" },
  { value: "giftCard", label: "礼品卡", iconPath: "/payment-icons/giftcard.svg" },
  { value: "googlePay", label: "Google Pay", iconPath: "/payment-icons/google-pay.svg" },
  { value: "paypal", label: "PayPal", iconPath: "/payment-icons/paypal.svg" },
];

export const accountMethodOptions: Array<{ value: AccountMethod; label: string; iconPath: string }> = [
  { value: "phone", label: "手机", iconPath: "/loginmethod-icons/phone.svg" },
  { value: "wechat", label: "微信", iconPath: "/loginmethod-icons/wechat.svg" },
  { value: "email", label: "邮箱", iconPath: "/loginmethod-icons/email.svg" },
  { value: "qq", label: "QQ", iconPath: "/loginmethod-icons/qq.svg" },
  { value: "gmail", label: "Gmail", iconPath: "/loginmethod-icons/gmail.svg" },
  { value: "appleId", label: "Apple ID", iconPath: "/loginmethod-icons/apple-id.svg" },
  { value: "github", label: "GitHub", iconPath: "/loginmethod-icons/github.svg" },
];

export const categoryOptions: Array<{ value: SubscriptionCategory; label: string }> = [
  { value: "video", label: "视频" },
  { value: "ai", label: "AI" },
  { value: "developer", label: "开发" },
  { value: "cloud", label: "云服务" },
  { value: "tool", label: "工具" },
  { value: "music", label: "音乐" },
  { value: "social", label: "社交" },
  { value: "shopping", label: "购物" },
  { value: "custom", label: "自定义" },
];

export const billingCycleOptions: Array<{ value: BillingCycle; label: string }> = [
  { value: "monthly", label: "每月" },
  { value: "yearly", label: "每年" },
  { value: "customDays", label: "自定义" },
];

export const statusOptions: Array<{ value: SubscriptionStatus; label: string }> = [
  { value: "active", label: "订阅中" },
  { value: "cancelled", label: "已取消" },
];

export const serviceTemplates: ServiceTemplate[] = [
  // AI
  { id: "chatgpt", serviceName: "ChatGPT", iconName: "chatgpt", category: "ai", defaultCycle: "monthly" },
  { id: "claude", serviceName: "Claude", iconName: "claude", category: "ai", defaultCycle: "monthly" },
  { id: "gemini", serviceName: "Gemini", iconName: "gemini", category: "ai", defaultCycle: "monthly" },
  { id: "grok", serviceName: "Grok", iconName: "grok", category: "ai", defaultCycle: "monthly" },
  { id: "cursor", serviceName: "Cursor", iconName: "cursor", category: "ai", defaultCycle: "monthly" },
  { id: "midjourney", serviceName: "MidJourney", iconName: "midjourney", category: "ai", defaultCycle: "monthly" },
  { id: "perplexity", serviceName: "Perplexity", iconName: "perplexity", category: "ai", defaultCycle: "monthly" },
  { id: "minimax", serviceName: "MiniMax", iconName: "minimax", category: "ai", defaultCycle: "monthly" },
  { id: "mimo", serviceName: "Mimo", iconName: "mimo", category: "ai", defaultCycle: "monthly" },
  { id: "suno", serviceName: "Suno", iconName: "suno", category: "ai", defaultCycle: "monthly" },
  { id: "jimeng", serviceName: "即梦", iconName: "jimeng", category: "ai", defaultCycle: "monthly" },
  // Developer
  { id: "vercel", serviceName: "Vercel", iconName: "vercel", category: "developer", defaultCycle: "monthly" },
  { id: "supabase", serviceName: "Supabase", iconName: "supabase", category: "developer", defaultCycle: "monthly" },
  { id: "aws", serviceName: "AWS", iconName: "aws", category: "developer", defaultCycle: "monthly" },
  { id: "azure", serviceName: "Azure", iconName: "azure", category: "developer", defaultCycle: "monthly" },
  { id: "cloudflare", serviceName: "Cloudflare", iconName: "cloudflare", category: "developer", defaultCycle: "monthly" },
  { id: "netlify", serviceName: "Netlify", iconName: "netlify", category: "developer", defaultCycle: "monthly" },
  { id: "deno", serviceName: "Deno", iconName: "deno", category: "developer", defaultCycle: "monthly" },
  { id: "trae", serviceName: "Trae", iconName: "trae", category: "developer", defaultCycle: "monthly" },
  { id: "coze", serviceName: "Coze", iconName: "coze", category: "developer", defaultCycle: "monthly" },
  { id: "tencent-cloud", serviceName: "腾讯云", iconName: "tencent-cloud", category: "developer", defaultCycle: "monthly" },
  { id: "alibaba-cloud", serviceName: "阿里云", iconName: "alibaba-cloud", category: "developer", defaultCycle: "monthly" },
  { id: "volcengine", serviceName: "火山引擎", iconName: "volcengine", category: "developer", defaultCycle: "monthly" },
  // Tool
  { id: "notion", serviceName: "Notion", iconName: "notion", category: "tool", defaultCycle: "monthly" },
  { id: "figma", serviceName: "Figma", iconName: "figma", category: "tool", defaultCycle: "monthly" },
  { id: "wps", serviceName: "WPS", iconName: "wps", category: "tool", defaultCycle: "monthly" },
  { id: "obsidian", serviceName: "Obsidian", iconName: "obsidian", category: "tool", defaultCycle: "monthly" },
  { id: "capcut", serviceName: "剪映", iconName: "capcut", category: "tool", defaultCycle: "monthly" },
  { id: "keep", serviceName: "Keep", iconName: "keep", category: "tool", defaultCycle: "monthly" },
  { id: "zoom", serviceName: "Zoom", iconName: "zoom", category: "tool", defaultCycle: "monthly" },
  // Video
  { id: "youtube", serviceName: "YouTube", iconName: "youtube", category: "video", defaultCycle: "monthly" },
  { id: "netflix", serviceName: "Netflix", iconName: "netflix", category: "video", defaultCycle: "monthly" },
  { id: "disney-plus", serviceName: "Disney+", iconName: "disney-plus", category: "video", defaultCycle: "monthly" },
  { id: "tencent-video", serviceName: "腾讯视频", iconName: "tencent-video", category: "video", defaultCycle: "monthly" },
  { id: "iqiyi", serviceName: "爱奇艺", iconName: "iqiyi", category: "video", defaultCycle: "monthly" },
  { id: "bilibili", serviceName: "哔哩哔哩", iconName: "bilibili", category: "video", defaultCycle: "monthly" },
  { id: "youku", serviceName: "优酷视频", iconName: "youku", category: "video", defaultCycle: "monthly" },
  { id: "mango-tv", serviceName: "芒果TV", iconName: "mango-tv", category: "video", defaultCycle: "monthly" },
  { id: "apple-tv", serviceName: "Apple TV+", iconName: "apple-tv", category: "video", defaultCycle: "monthly" },
  // Music
  { id: "spotify", serviceName: "Spotify", iconName: "spotify", category: "music", defaultCycle: "monthly" },
  { id: "apple-music", serviceName: "Apple Music", iconName: "apple-music", category: "music", defaultCycle: "monthly" },
  { id: "netease-music", serviceName: "网易云音乐", iconName: "netease-music", category: "music", defaultCycle: "monthly" },
  { id: "qq-music", serviceName: "QQ音乐", iconName: "qq-music", category: "music", defaultCycle: "monthly" },
  { id: "qishui-music", serviceName: "汽水音乐", iconName: "qishui-music", category: "music", defaultCycle: "monthly" },
  { id: "kugou-music", serviceName: "酷狗音乐", iconName: "kugou-music", category: "music", defaultCycle: "monthly" },
  // Cloud
  { id: "icloud", serviceName: "iCloud+", iconName: "icloud", category: "cloud", defaultCycle: "monthly" },
  { id: "baidu-netdisk", serviceName: "百度网盘", iconName: "baidu-netdisk", category: "cloud", defaultCycle: "monthly" },
  { id: "115-netdisk", serviceName: "115网盘", iconName: "115-netdisk", category: "cloud", defaultCycle: "monthly" },
  { id: "quark", serviceName: "夸克", iconName: "quark", category: "cloud", defaultCycle: "monthly" },
  { id: "xunlei", serviceName: "迅雷", iconName: "xunlei", category: "cloud", defaultCycle: "monthly" },
  // Social
  { id: "qq", serviceName: "QQ", iconName: "qq", category: "social", defaultCycle: "monthly" },
  { id: "telegram", serviceName: "Telegram", iconName: "telegram", category: "social", defaultCycle: "monthly" },
  { id: "x", serviceName: "X", iconName: "x", category: "social", defaultCycle: "monthly" },
  { id: "linkedin", serviceName: "LinkedIn", iconName: "linkedin", category: "social", defaultCycle: "monthly" },
  // Shopping
  { id: "jd", serviceName: "京东", iconName: "jd", category: "shopping", defaultCycle: "monthly" },
  { id: "taobao", serviceName: "淘宝", iconName: "taobao", category: "shopping", defaultCycle: "monthly" },
];

const storageKey = "sub-account.subscriptions.v2";
const defaultPlanNames: Record<string, string> = {
  "tencent-video": "VIP",
  iqiyi: "黄金VIP",
};

export function todayISO() {
  return toISODate(new Date());
}

export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addCycle(startDate: string, cycle: BillingCycle, customCycleDays: number) {
  const date = parseLocalDate(startDate);
  if (cycle === "monthly") date.setMonth(date.getMonth() + 1);
  if (cycle === "yearly") date.setFullYear(date.getFullYear() + 1);
  if (cycle === "customDays") date.setDate(date.getDate() + Math.max(customCycleDays, 1));
  return toISODate(date);
}

export function endDateBeforeRenewal(startDate: string, cycle: BillingCycle, customCycleDays: number) {
  const date = parseLocalDate(addCycle(startDate, cycle, customCycleDays));
  date.setDate(date.getDate() - 1);
  return toISODate(date);
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function daysUntil(date: string) {
  const today = parseLocalDate(todayISO()).getTime();
  const target = parseLocalDate(date).getTime();
  return Math.round((target - today) / 86_400_000);
}

export function formatDate(value: string) {
  const date = parseLocalDate(value);
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

export function formatMoney(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

export function categoryLabel(category: SubscriptionCategory) {
  return categoryOptions.find((item) => item.value === category)?.label ?? "自定义";
}

export function cycleLabel(cycle: BillingCycle) {
  return billingCycleOptions.find((item) => item.value === cycle)?.label ?? "每月";
}

export function statusLabel(status: SubscriptionStatus) {
  return statusOptions.find((item) => item.value === status)?.label ?? "订阅中";
}

export function subscriptionStatus(subscription: Pick<Subscription, "endDate">): SubscriptionStatus {
  return daysUntil(subscription.endDate) < 0 ? "cancelled" : "active";
}

export function iconPath(iconName: string) {
  const aliases: Record<string, string> = {
    "tencent-video": "腾讯视频.svg",
    youku: "优酷-copy.svg",
    claude: "Claude.svg",
    vercel: "Vercel.svg",
    obsidian: "obsidian-icon.svg",
    "115-netdisk": "115网盘.svg",
  };
  return `/icons/${aliases[iconName] ?? `${iconName}.svg`}`;
}

export function makeSubscriptionFromTemplate(template: ServiceTemplate): Subscription {
  const startDate = todayISO();
  const customCycleDays = template.defaultCycle === "yearly" ? 365 : 30;
  return {
    id: crypto.randomUUID(),
    sourceTemplateId: template.id,
    serviceName: template.serviceName,
    iconName: template.iconName,
    iconDataUrl: "",
    category: template.category,
    customCategoryName: "",
    planName: defaultPlanNames[template.id] ?? "",
    price: 0,
    currency: "CNY",
    paymentMethod: "appStore",
    accountMethod: "phone",
    accountIdentifier: "",
    isPinned: false,
    isAutoRenewEnabled: true,
    isReminderEnabled: false,
    reminderDays: 1,
    billingCycle: template.defaultCycle,
    customCycleDays,
    startDate,
    endDate: endDateBeforeRenewal(startDate, template.defaultCycle, customCycleDays),
    status: "active",
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function makeCustomSubscription(): Subscription {
  const startDate = todayISO();
  return {
    id: crypto.randomUUID(),
    serviceName: "新订阅",
    iconName: "custom",
    iconDataUrl: "",
    category: "custom",
    customCategoryName: "",
    planName: "",
    price: 0,
    currency: "CNY",
    paymentMethod: "appStore",
    accountMethod: "phone",
    accountIdentifier: "",
    isPinned: false,
    isAutoRenewEnabled: true,
    isReminderEnabled: false,
    reminderDays: 1,
    billingCycle: "monthly",
    customCycleDays: 30,
    startDate,
    endDate: endDateBeforeRenewal(startDate, "monthly", 30),
    status: "active",
    notes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeSubscription(subscription: Subscription): Subscription {
  const customCycleDays = subscription.billingCycle === "yearly" ? 365 : subscription.billingCycle === "monthly" ? 30 : Math.max(subscription.customCycleDays, 1);
  const endDate = subscription.endDate;
  const templateMatch = serviceTemplates.find((template) => {
    return template.id === subscription.sourceTemplateId || template.iconName === subscription.iconName || template.serviceName === subscription.serviceName;
  });
  return {
    ...subscription,
    sourceTemplateId: subscription.sourceTemplateId ?? templateMatch?.id,
    serviceName: subscription.iconName === "icloud" && subscription.serviceName === "iCloud" ? "iCloud+" : subscription.serviceName,
    iconName: templateMatch?.iconName ?? subscription.iconName,
    iconDataUrl: subscription.iconDataUrl ?? "",
    planName: templateMatch?.id && !subscription.planName.trim() ? defaultPlanNames[templateMatch.id] ?? "" : subscription.planName,
    price: Math.max(Number(subscription.price) || 0, 0),
    paymentMethod: subscription.paymentMethod ?? "appStore",
    accountMethod: subscription.accountMethod ?? "phone",
    accountIdentifier: subscription.accountIdentifier ?? "",
    isPinned: subscription.isPinned ?? false,
    isReminderEnabled: subscription.isReminderEnabled ?? false,
    reminderDays: [0, 1, 3, 7].includes(subscription.reminderDays) ? subscription.reminderDays : 1,
    status: subscriptionStatus({ endDate }),
    customCategoryName: subscription.category === "custom" ? subscription.customCategoryName ?? "" : "",
    customCycleDays,
    endDate,
    updatedAt: new Date().toISOString(),
  };
}

export function loadSubscriptions() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeSubscription);
  } catch {
    return [];
  }
}

export function saveSubscriptions(subscriptions: Subscription[]) {
  localStorage.setItem(storageKey, JSON.stringify(subscriptions, null, 2));
}

export function monthlyEquivalent(subscription: Subscription) {
  if (subscriptionStatus(subscription) !== "active") return 0;
  if (subscription.billingCycle === "monthly") return subscription.price;
  if (subscription.billingCycle === "yearly") return subscription.price / 12;
  return (subscription.price * 30) / Math.max(subscription.customCycleDays, 1);
}

export function toCny(amount: number, currency: CurrencyCode) {
  const unitPerCny = currencyOptions.find((item) => item.value === currency)?.unitPerCny ?? 1;
  return amount / unitPerCny;
}

export function summarize(subscriptions: Subscription[]) {
  const active = subscriptions.filter((item) => subscriptionStatus(item) === "active");
  const monthlyCny = active.reduce((sum, item) => sum + toCny(monthlyEquivalent(item), item.currency), 0);
  return {
    activeCount: active.length,
    monthlyCny,
    annualCny: monthlyCny * 12,
    upcoming: active
      .filter((item) => daysUntil(item.endDate) <= 30)
      .sort((a, b) => parseLocalDate(a.endDate).getTime() - parseLocalDate(b.endDate).getTime()),
  };
}
