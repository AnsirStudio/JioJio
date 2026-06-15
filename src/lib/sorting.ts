import { addCycle, parseLocalDate, toCny, toISODate } from "../lib/subscriptions";
import type { Subscription } from "../lib/subscriptions";
import type { LanguageCode } from "../i18n";
import { serviceLabel } from "../lib/format";

export type DetailSubscriptionSort = "endDate" | "startDate" | "monthlyPrice" | "annualPrice";
export type TableSubscriptionSort = "price" | "endDate";
export type SortDirection = "asc" | "desc";

export type DetailedSubscriptionGroup = {
  key: string;
  subscription: Subscription;
  count: number;
  members: Subscription[];
};

export function monthlyUnitCny(subscription: Subscription) {
  const amount = toCny(subscription.price, subscription.currency);
  if (subscription.billingCycle === "yearly") return amount / 12;
  if (subscription.billingCycle === "customDays") return amount * (30 / Math.max(subscription.customCycleDays, 1));
  return amount;
}

export function annualUnitCny(subscription: Subscription) {
  return monthlyUnitCny(subscription) * 12;
}

export function buildMonthlyCostDistribution(subscriptions: Subscription[]) {
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

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function buildMonthlyCashflowTimeline(subscriptions: Subscription[], language: LanguageCode) {
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

export function detailedGroupKey(subscription: Subscription) {
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

export function groupDetailedSubscriptions(subscriptions: Subscription[]): DetailedSubscriptionGroup[] {
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

export function sortDetailedSubscriptions(subscriptions: Subscription[], sort: DetailSubscriptionSort, direction: SortDirection, t: (key: string) => string, language: LanguageCode) {
  const directionMultiplier = direction === "asc" ? 1 : -1;
  const locale = language === "en" ? "en-US" : "zh-CN";

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
    return serviceLabel(a, t).localeCompare(serviceLabel(b, t), locale);
  });
}

export function sortTableSubscriptions(subscriptions: Subscription[], sort: TableSubscriptionSort, direction: SortDirection, t: (key: string) => string, language: LanguageCode) {
  const directionMultiplier = direction === "asc" ? 1 : -1;
  const locale = language === "en" ? "en-US" : "zh-CN";

  return [...subscriptions].sort((a, b) => {
    const diff = sort === "price"
      ? toCny(a.price, a.currency) - toCny(b.price, b.currency)
      : parseLocalDate(a.endDate).getTime() - parseLocalDate(b.endDate).getTime();

    if (diff !== 0) return diff * directionMultiplier;
    return serviceLabel(a, t).localeCompare(serviceLabel(b, t), locale);
  });
}

export function sortSubscriptions(subscriptions: Subscription[], language: LanguageCode) {
  const locale = language === "en" ? "en-US" : "zh-CN";

  return [...subscriptions].sort((a, b) => {
    const dateDiff = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return a.serviceName.localeCompare(b.serviceName, locale);
  });
}
