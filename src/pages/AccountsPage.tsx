import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { accountMethodOptions, daysUntil, formatMoney, subscriptionStatus } from "../lib/subscriptions";
import type { Subscription, SubscriptionCategory } from "../lib/subscriptions";
import { usePreferences } from "../i18n";
import { loadAccountStore } from "../lib/accountStore";
import { monthlyUnitCny } from "../lib/sorting";
import { accountTimingText, categoryText, serviceLabel } from "../lib/format";
import { PaymentIcon, ServiceIcon } from "../components/icons";
import { cn } from "../lib/utils";

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

export function AccountsPage({
  subscriptions,
  onOpen,
}: {
  subscriptions: Subscription[];
  onOpen: (subscription: Subscription) => void;
}) {
  const { t } = usePreferences();
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
    v === "by-account" ? t("accounts.viewByAccount") : t("accounts.viewByPlatform");

  return (
    <div className="flex flex-col gap-4">
      {/* Summary row + toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">{activeSubscriptions.length}</span>{" "}
            {t("accounts.subscriptionsCount")}
          </span>
          <span>·</span>
          <span>
            <span className="font-semibold text-foreground">{uniqueAccountCount}</span>{" "}
            {t("accounts.accountsCount")}
          </span>
          {unlinkedSubs.length > 0 && (
            <>
              <span>·</span>
              <span className="font-medium text-amber-500">
                {unlinkedSubs.length} {t("accounts.unlinkedCount")}
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
        <AccountsByAccountView methodGroups={methodGroups} unlinkedSubs={unlinkedSubs} onOpen={onOpen} t={t} />
      ) : (
        <AccountsByPlatformView subscriptions={activeSubscriptions} onOpen={onOpen} t={t} />
      )}
    </div>
  );
}

function AccountsByAccountView({
  methodGroups,
  unlinkedSubs,
  onOpen,
  t,
}: {
  methodGroups: MethodGroup[];
  unlinkedSubs: Subscription[];
  onOpen: (s: Subscription) => void;
  t: (k: string) => string;
}) {
  if (methodGroups.length === 0 && unlinkedSubs.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        {t("accounts.noData")}
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
                {group.accounts.length} {t("accounts.accountsCount")} · {group.totalSubs} {t("accounts.subsCount")}
              </span>
            </div>
            {group.monthlyCny > 0 && (
              <span className="text-xs font-semibold text-muted-foreground">
                {formatMoney(group.monthlyCny, "CNY")}/{t("accounts.perMonth")}
              </span>
            )}
          </div>

          {/* Accounts within this method */}
          {group.accounts.map((account, accIdx) => (
            <div key={account.identifier || `__empty__${accIdx}`} className={cn(accIdx > 0 && "border-t border-border")}>
              {/* Account identifier row */}
              <div className="flex items-center gap-3 px-4 py-2.5">
                <div className="flex flex-1 min-w-0 items-center gap-2">
                  <span className="text-sm font-medium truncate">{account.identifier || t("accounts.notSet")}</span>
                  {account.note && (
                    <span className="shrink-0 text-xs text-muted-foreground">· {account.note}</span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {account.subscriptions.length > 0 ? (
                    <>
                      <span>{account.subscriptions.length} {t("accounts.itemUnit")}</span>
                      <span className="font-semibold text-foreground">
                        {formatMoney(account.subscriptions.reduce((s, sub) => s + monthlyUnitCny(sub), 0), "CNY")}
                        /{t("accounts.perMonth")}
                      </span>
                    </>
                  ) : (
                    <span className="italic">{t("accounts.noSubs")}</span>
                  )}
                </div>
              </div>

              {/* Subscriptions for this account */}
              {account.subscriptions.map((sub) => {
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
                        {accountTimingText(days, sub.isAutoRenewEnabled, t)}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatMoney(monthlyUnitCny(sub), "CNY")}/{t("accounts.perMonth")}
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
              {t("accounts.noAccountSet")}
            </span>
            <span className="text-xs text-muted-foreground">
              {unlinkedSubs.length} {t("accounts.missingAccountInfo")}
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
}: {
  subscriptions: Subscription[];
  onOpen: (s: Subscription) => void;
  t: (k: string) => string;
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
        {t("accounts.noData")}
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
              {subs.length} {t("accounts.itemsUnit")}
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
                      {t("accounts.noAccount")}
                    </span>
                  )}
                </div>

                {/* End date + cost */}
                <div className="shrink-0 text-right text-xs">
                  <div className={cn("font-medium", urgent ? "text-amber-500" : "text-muted-foreground")}>
                    {accountTimingText(days, sub.isAutoRenewEnabled, t)}
                  </div>
                  <div className="font-semibold text-foreground">
                    {formatMoney(monthlyUnitCny(sub), "CNY")}/{t("accounts.perMonth")}
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
