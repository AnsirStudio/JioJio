import { BarChart3, Bell, CalendarDays, CircleDollarSign, Clock3, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { categoryOptions, daysUntil, formatMoney, parseLocalDate, subscriptionStatus, toCny } from "../lib/subscriptions";
import type { Subscription } from "../lib/subscriptions";
import { usePreferences } from "../i18n";
import { buildMonthlyCashflowTimeline, buildMonthlyCostDistribution, monthlyUnitCny } from "../lib/sorting";
import { categoryText, formatDisplayDate, formatPercent, cycleText, overviewMoneyLabel, overviewUpcomingTimingText, serviceLabel } from "../lib/format";
import { ServiceIcon } from "../components/icons";
import { EmptyDetail } from "./EmptyDetail";
import { cn } from "../lib/utils";

export function OverviewDashboard({
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
