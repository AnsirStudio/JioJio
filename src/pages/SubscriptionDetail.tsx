import { Edit3, Bell, Pin, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { formatMoney, subscriptionStatus, toCny } from "../lib/subscriptions";
import type { Subscription } from "../lib/subscriptions";
import { usePreferences } from "../i18n";
import { annualUnitCny, monthlyUnitCny } from "../lib/sorting";
import { categoryText, cycleText, formatDisplayDate, localizedAccountOptions, localizedPaymentOptions, localizedReminderOptions, relativeEnd, serviceLabel, statusText } from "../lib/format";
import { PaymentIcon, ServiceIcon } from "../components/icons";
import { cn } from "../lib/utils";

export function SubscriptionDetail({
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
