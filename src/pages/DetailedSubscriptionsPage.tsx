import { ArrowDown, ArrowUp, Bell, Pin, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "../lib/subscriptions";
import type { Subscription } from "../lib/subscriptions";
import { usePreferences } from "../i18n";
import {
  groupDetailedSubscriptions,
  sortDetailedSubscriptions,
  sortTableSubscriptions,
} from "../lib/sorting";
import type { DetailedSubscriptionGroup, DetailSubscriptionSort, SortDirection, TableSubscriptionSort } from "../lib/sorting";
import {
  categoryText,
  cycleText,
  formatDisplayDate,
  formatTableEndDate,
  localizedCategoryOptions,
  localizedCycleOptions,
  localizedPaymentOptions,
  serviceLabel,
} from "../lib/format";
import { PaymentIcon, ServiceIcon } from "../components/icons";
import { DetailSortSelect, FilterSelect, SubscriptionsPagination, TableHeaderFilterSelect, TableHeaderSortButton } from "../components/selects";
import { EmptyDetail } from "./EmptyDetail";
import { cn } from "../lib/utils";

export type DetailDisplayMode = "cards" | "table";

export function DetailedSubscriptionsPage({
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

    return displayMode === "table" ? sortTableSubscriptions(filtered, tableSort, tableDirection, t, language) : sortDetailedSubscriptions(filtered, sort, direction, t, language);
  }, [autoRenewFilter, categoryFilter, cycleFilter, detailQuery, direction, displayMode, language, paymentFilter, paymentOptions, reminderFilter, sort, subscriptions, t, tableDirection, tableSort]);
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

      <SubscriptionsPagination page={page} totalPages={totalPages} setPage={setPage} t={t} />
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
