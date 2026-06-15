import { Check, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { addCycle, normalizeSubscription, parseLocalDate, toISODate } from "../lib/subscriptions";
import type { ReminderDays, Subscription } from "../lib/subscriptions";
import { usePreferences } from "../i18n";
import { loadAccountStore } from "../lib/accountStore";
import {
  currencySymbol,
  customPlanValue,
  inferTemplatePlanValue,
  localizedAccountOptions,
  localizedCategoryOptions,
  localizedCycleOptions,
  localizedPaymentOptions,
  localizedReminderOptions,
  planConfigForTemplateId,
  serviceLabel,
  serviceTemplateFor,
} from "../lib/format";
import { CustomIconUploadButton, ServiceIcon } from "../components/icons";
import { DatePicker, ExchangeCurrencySelect, OptionSelect } from "../components/selects";
import { FieldRow } from "./SettingsPages";

export function Editor({
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
  const accountStore = useMemo(() => loadAccountStore(), []);
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
