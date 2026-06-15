import { enUS, zhCN } from "date-fns/locale";
import { ArrowDown, ArrowUp, CalendarIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select";
import { currencyOptions, parseLocalDate, toISODate } from "../lib/subscriptions";
import type { CurrencyCode } from "../lib/subscriptions";
import { usePreferences } from "../i18n";
import type { DetailSubscriptionSort, SortDirection } from "../lib/sorting";
import { currencyDisplayLabel, formatDisplayDate } from "../lib/format";
import { CurrencyLabel, FlagIcon, IconOptionLabel } from "./icons";
import { cn } from "../lib/utils";

export function OptionSelect<TValue extends string>({
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
        <IconOptionLabel iconPath={selectedOption?.iconPath} label={selectedOption?.label ?? ""} />
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" avoidCollisions={false}>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <IconOptionLabel iconPath={option.iconPath} label={option.label} />
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function FilterSelect({
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
        <IconOptionLabel iconPath={selectedOption?.iconPath} label={selectedOption?.label ?? ""} />
      </SelectTrigger>
      <SelectContent className="detail-select-content" position="popper" side="bottom" align="start" avoidCollisions={false}>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <IconOptionLabel iconPath={option.iconPath} label={option.label} />
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function TableHeaderFilterSelect({
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
        <IconOptionLabel
          iconPath={selectedOption?.iconPath}
          label={selectedOption?.label ?? ""}
          className={cn(
            align === "end" ? "justify-end" : align === "center" ? "justify-center" : null,
            compactCenter && "pointer-events-none absolute inset-x-0 justify-center px-3 text-center",
          )}
        />
      </SelectTrigger>
      <SelectContent className="detail-select-content" position="popper" side="bottom" align={contentAlign} avoidCollisions={false}>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <IconOptionLabel iconPath={option.iconPath} label={option.label} />
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function ExchangeCurrencySelect({
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

const detailSortOptions: DetailSubscriptionSort[] = ["endDate", "startDate", "monthlyPrice", "annualPrice"];

export function DetailSortSelect({
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

export function TableHeaderSortButton({
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

export function DatePicker({ value, disabled, onChange }: { value: string; disabled?: boolean; onChange: (value: string) => void }) {
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

export function SubscriptionsPagination({
  page,
  totalPages,
  setPage,
  t,
}: {
  page: number;
  totalPages: number;
  setPage: (updater: number | ((current: number) => number)) => void;
  t: (key: string) => string;
}) {
  if (totalPages <= 1) return null;

  return (
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
            const items: ReactNode[] = [];
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
  );
}
