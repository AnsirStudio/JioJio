import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { categoryOptions, makeSubscriptionFromTemplate, serviceTemplates } from "../lib/subscriptions";
import type { ServiceTemplate, SubscriptionCategory } from "../lib/subscriptions";
import { usePreferences } from "../i18n";
import { categoryText, serviceLabel } from "../lib/format";
import { ServiceIcon } from "../components/icons";
import { SubscriptionsPagination } from "../components/selects";
import { cn } from "../lib/utils";

export function AddSelectPage({
  query,
  onQueryChange,
  onPickTemplate,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  onPickTemplate: (template: ServiceTemplate) => void;
}) {
  const { t } = usePreferences();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const filteredTemplates = serviceTemplates.filter((template) => {
    const term = query.trim().toLowerCase();
    const matchesQuery = !term || `${template.serviceName} ${serviceLabel(template, t)} ${categoryText(template.category, undefined, t)}`.toLowerCase().includes(term);
    const matchesCategory = categoryFilter === "all" || template.category === categoryFilter;
    return matchesQuery && matchesCategory;
  });
  const [page, setPage] = useState(1);
  const pageSize = 48;
  const totalPages = Math.max(Math.ceil(filteredTemplates.length / pageSize), 1);
  const visibleTemplates = filteredTemplates.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1);
  }, [query, categoryFilter]);

  return (
    <div className="flex min-h-[calc(100vh-160px)] flex-1 flex-col">
      <div className="pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            className="h-8 w-full rounded-full border-transparent bg-zinc-100 pl-8 pr-3 text-left text-[11px] font-normal text-zinc-700 placeholder:text-[11px] placeholder:text-zinc-500 focus:border-zinc-200 focus:bg-white focus:ring-0"
            placeholder={t("add.searchPlatform")}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[{ value: "all", label: t("add.allCategories") }, ...categoryOptions].map((option) => (
            <button
              key={option.value}
              className={cn(
                "category-filter-button rounded-full px-3 py-1.5 font-semibold transition",
                categoryFilter === option.value
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
              )}
              onClick={() => setCategoryFilter(option.value)}
            >
              {option.value === "all" ? t("add.allCategories") : categoryText(option.value as SubscriptionCategory, undefined, t)}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto pb-4">
        {filteredTemplates.length === 0 ? (
          <Card className="flex min-h-[260px] items-center justify-center p-8 text-center text-sm text-zinc-500">{t("add.noResults")}</Card>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {visibleTemplates.map((template) => {
              const subscription = makeSubscriptionFromTemplate(template);
              return (
                <button
                  key={template.id}
                  className="flex min-h-[64px] items-center gap-2 rounded-2xl border border-border bg-card py-2 pl-3 pr-2 text-left transition hover:bg-muted"
                  onClick={() => onPickTemplate(template)}
                >
                  <ServiceIcon subscription={subscription} size="sm" framed={false} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-card-foreground">{serviceLabel(template, t)}</div>
                    <div className="mt-0.5 truncate text-[10px] text-zinc-500">{categoryText(template.category, undefined, t)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <SubscriptionsPagination page={page} totalPages={totalPages} setPage={setPage} t={t} />
    </div>
  );
}
