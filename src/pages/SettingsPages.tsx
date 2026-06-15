import { Check, Copy, Edit3, Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { accountMethodOptions, currencyOptions } from "../lib/subscriptions";
import type { CurrencyCode } from "../lib/subscriptions";
import { usePreferences } from "../i18n";
import type { LanguageCode, ThemePreference } from "../i18n";
import { loadAccountStore, saveAccountStore } from "../lib/accountStore";
import type { AccountEntry, AccountStore } from "../lib/accountStore";
import { currencyDisplayLabel, exchangeRateDate, formatExchangeAmount } from "../lib/format";
import { CurrencyLabel, FlagIcon, PaymentIcon } from "../components/icons";
import { ExchangeCurrencySelect } from "../components/selects";
import { cn } from "../lib/utils";

export type SettingsTab = "basic" | "accounts" | "exchange";

export function SettingsPage({ activeTab }: { activeTab: SettingsTab }) {
  if (activeTab === "exchange") return <ExchangeSettings />;
  if (activeTab === "accounts") return <AccountSettings />;
  return <BasicSettings />;
}

export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-h-12 grid-cols-[140px_1fr] items-center gap-4 border-b border-border last:border-b-0">
      <div className="text-sm font-semibold text-muted-foreground">{label}</div>
      <div className="flex justify-end">{children}</div>
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

function parseDecimalTextInput(value: string) {
  return value
    .replace(/。/g, ".")
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1")
    .replace(/^(\d*\.?\d{0,2}).*$/, "$1");
}

function AccountSettings() {
  const { t } = usePreferences();
  const [store, setStore] = useState<AccountStore>(loadAccountStore);
  const [addingMethod, setAddingMethod] = useState<string | null>(null);
  const [addValue, setAddValue] = useState("");
  const [addNote, setAddNote] = useState("");
  const [editingKey, setEditingKey] = useState<{ method: string; index: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editNote, setEditNote] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const allMethods = accountMethodOptions;
  const noNoteLabel = t("account.noNote");
  const notePlaceholder = t("account.notePlaceholder");

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
                        title={isCopied ? t("common.copied") : t("common.copy")}
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
