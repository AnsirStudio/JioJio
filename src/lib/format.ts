import {
  accountMethodOptions,
  billingCycleOptions,
  categoryOptions,
  currencyOptions,
  daysUntil,
  formatMoney,
  paymentMethodOptions,
  parseLocalDate,
  subscriptionStatus,
} from "../lib/subscriptions";
import type { CurrencyCode, ServiceTemplate, Subscription } from "../lib/subscriptions";
import { translations } from "../i18n";
import type { LanguageCode } from "../i18n";
import { serviceTemplates } from "../lib/subscriptions";

export const customPlanValue = "custom";
export const templatePlanConfigs = {
  "tencent-video": {
    defaultValue: "VIP",
    options: ["VIP", "SVIP"],
  },
  iqiyi: {
    defaultValue: "黄金VIP",
    options: ["黄金VIP", "白金VIP", "钻石VIP"],
  },
} as const;

export const exchangeRateDate = "2026-06-12";

export function normalizeServiceText(value: string | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function serviceTemplateFor(item: Pick<Subscription, "sourceTemplateId" | "iconName" | "serviceName"> | ServiceTemplate) {
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

export function resolveServiceKey(item: Pick<Subscription, "sourceTemplateId" | "iconName" | "serviceName"> | ServiceTemplate) {
  return serviceTemplateFor(item)?.id ?? item.iconName;
}

export function serviceLabel(item: Pick<Subscription, "sourceTemplateId" | "iconName" | "serviceName"> | ServiceTemplate, t: (key: string) => string) {
  const template = serviceTemplateFor(item);
  const key = template?.id ?? resolveServiceKey(item);
  const translated = t(`service.${key}`);
  return translated.startsWith("service.") ? item.serviceName : translated;
}

export function isBuiltInService(item: Pick<Subscription, "sourceTemplateId" | "iconName" | "serviceName">) {
  return Boolean(serviceTemplateFor(item));
}

export function categoryText(category: Subscription["category"], customCategoryName: string | undefined, t: (key: string) => string) {
  if (category === "custom" && customCategoryName?.trim()) return customCategoryName.trim();
  return t(`category.${category}`);
}

export function cycleText(cycle: Subscription["billingCycle"], t: (key: string) => string) {
  return t(`cycle.${cycle}`);
}

export function statusText(status: ReturnType<typeof subscriptionStatus>, t: (key: string) => string) {
  return t(`status.${status}`);
}

export function formatDisplayDate(value: string, language: LanguageCode) {
  const date = parseLocalDate(value);
  const locale = language === "en" ? "en-US" : "zh-CN";
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(date);
}

export function formatTableEndDate(value: string, language: LanguageCode) {
  const date = parseLocalDate(value);
  const locale = language === "en" ? "en-US" : "zh-CN";
  return {
    date: new Intl.DateTimeFormat(locale, { month: language === "en" ? "short" : "long", day: "numeric" }).format(date),
    year: language === "en" ? new Intl.DateTimeFormat(locale, { year: "numeric" }).format(date) : `${date.getFullYear()}年`,
  };
}

export function currencyDisplayLabel(currency: (typeof currencyOptions)[number], t: (key: string) => string) {
  return `${t(`currency.${currency.value}`)} ${currency.value}`;
}

export function currencySymbol(currency: CurrencyCode) {
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

export function localizedPaymentOptions(t: (key: string) => string) {
  return paymentMethodOptions.map((option) => ({ ...option, label: t(`payment.${option.value}`) }));
}

export function localizedAccountOptions(t: (key: string) => string) {
  return accountMethodOptions.map((option) => ({ ...option, label: t(`account.${option.value}`) }));
}

export function localizedCategoryOptions(t: (key: string) => string) {
  return categoryOptions.map((option) => ({ ...option, label: t(`category.${option.value}`) }));
}

export function localizedCycleOptions(t: (key: string) => string) {
  return billingCycleOptions.map((option) => ({ ...option, label: t(`cycle.${option.value}`) }));
}

export function localizedReminderOptions(t: (key: string) => string): Array<{ value: string; label: string }> {
  return [
    { value: "0", label: t("reminder.sameDay") },
    { value: "1", label: t("reminder.previousDay") },
    { value: "3", label: t("reminder.threeDays") },
    { value: "7", label: t("reminder.sevenDays") },
  ];
}

export function planConfigForTemplateId(templateId?: string) {
  if (!templateId) return undefined;
  return templatePlanConfigs[templateId as keyof typeof templatePlanConfigs];
}

export function inferTemplatePlanValue(planName: string, templateId?: string) {
  const config = planConfigForTemplateId(templateId);
  if (!config) return customPlanValue;
  if (config.options.some((option) => option === planName)) return planName;
  if (planName.trim()) return customPlanValue;
  return config.defaultValue;
}

export function relativeEnd(subscription: Subscription, t: (key: string) => string) {
  const days = daysUntil(subscription.endDate);
  if (days < 0) return `${t("relative.expiredPrefix")} ${Math.abs(days)} ${t("relative.days")}`;
  if (days === 0) return t("relative.today");
  return `${days} ${t("relative.after")}`;
}

export function accountTimingText(days: number, isAutoRenewEnabled: boolean, t: (key: string) => string) {
  const timing = days < 0
    ? t("accounts.expired")
    : days === 0
    ? t("accounts.today")
    : `${days}${t("accounts.daysLater")}`;
  const action = isAutoRenewEnabled ? t("accounts.renews") : t("accounts.expires");
  return `${timing} ${action}`;
}

export function overviewUpcomingTimingText(days: number, isAutoRenewEnabled: boolean, language: LanguageCode, t: (key: string) => string) {
  const action = isAutoRenewEnabled ? t("overview.renewingSuffix") : t("overview.expiringSuffix");
  if (language === "zh") return days === 0 ? `今天${action}` : `${days}天后${action}`;
  return days === 0 ? `Today ${action}` : `${days} ${t("relative.days")} later ${action}`;
}

export function overviewMoneyLabel(amountCny: number) {
  return amountCny === 0 ? "Free" : formatMoney(amountCny, "CNY");
}

export function formatExchangeAmount(amount: number) {
  return new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}
