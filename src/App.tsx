import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ListChecks,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  daysUntil,
  loadSubscriptions,
  makeCustomSubscription,
  makeSubscriptionFromTemplate,
  normalizeSubscription,
  parseLocalDate,
  saveSubscriptions,
  subscriptionStatus,
} from "./lib/subscriptions";
import type { Subscription } from "./lib/subscriptions";
import { cn } from "./lib/utils";
import {
  PreferencesContext,
  readStoredLanguage,
  readStoredTheme,
  themeStorageKey,
  languageStorageKey,
  translations,
} from "./i18n";
import type { LanguageCode, PreferencesContextValue, ThemePreference } from "./i18n";
import { lockWindowWidth, startWindowDrag } from "./lib/window";
import { categoryText, overviewUpcomingTimingText, relativeEnd, serviceLabel, statusText } from "./lib/format";
import { sortSubscriptions } from "./lib/sorting";
import { MaskedIcon, ServiceIcon } from "./components/icons";
import { AccountsPage } from "./pages/AccountsPage";
import { OverviewDashboard } from "./pages/OverviewDashboard";
import { SettingsPage } from "./pages/SettingsPages";
import type { SettingsTab } from "./pages/SettingsPages";
import { DetailedSubscriptionsPage } from "./pages/DetailedSubscriptionsPage";
import type { DetailDisplayMode } from "./pages/DetailedSubscriptionsPage";
import { SubscriptionDetail } from "./pages/SubscriptionDetail";
import { Editor } from "./pages/Editor";
import { AddSelectPage } from "./pages/AddSelectPage";

type DraftMode = "add" | "edit";
type MainView = "overview" | "detailSubscriptions" | "accounts" | "detail" | "addSelect" | "settings";

export default function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => loadSubscriptions());
  const [selectedId, setSelectedId] = useState<string | null>(() => loadSubscriptions()[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [mainView, setMainView] = useState<MainView>("overview");
  const [previousView, setPreviousView] = useState<MainView>("overview");

  function navigateTo(view: MainView) {
    setPreviousView(mainView);
    setMainView(view);
  }
  const [draft, setDraft] = useState<Subscription | null>(null);
  const [draftMode, setDraftMode] = useState<DraftMode>("add");
  const [templateQuery, setTemplateQuery] = useState("");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("basic");
  const [detailDisplayMode, setDetailDisplayMode] = useState<DetailDisplayMode>("cards");
  const [isSidebarUpcomingOpen, setIsSidebarUpcomingOpen] = useState(false);
  const [language, setLanguage] = useState<LanguageCode>(() => readStoredLanguage());
  const [theme, setTheme] = useState<ThemePreference>(() => readStoredTheme());

  useEffect(() => {
    saveSubscriptions(subscriptions);
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem(languageStorageKey, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(themeStorageKey, theme);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const isDark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    };

    applyTheme();
    if (theme !== "system") return;

    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  useEffect(() => {
    void lockWindowWidth();
  }, []);

  useEffect(() => {
    const preventDevtoolsShortcut = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isInspectorShortcut =
        event.key === "F12" ||
        ((event.metaKey || event.ctrlKey) && event.shiftKey && (key === "i" || key === "j" || key === "c")) ||
        (event.metaKey && event.altKey && key === "i");

      if (isInspectorShortcut) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("keydown", preventDevtoolsShortcut, true);
    return () => window.removeEventListener("keydown", preventDevtoolsShortcut, true);
  }, []);

  const preferences = useMemo<PreferencesContextValue>(
    () => ({
      language,
      setLanguage,
      theme,
      setTheme,
      t: (key) => translations[language][key] ?? key,
    }),
    [language, theme],
  );
  const t = preferences.t;

  const filteredSubscriptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    const pinnedSubscriptions = subscriptions.filter((item) => item.isPinned);
    if (!term) return pinnedSubscriptions;
    return pinnedSubscriptions.filter((item) => {
      return `${item.serviceName} ${serviceLabel(item, t)} ${item.planName} ${categoryText(item.category, item.customCategoryName, t)}`.toLowerCase().includes(term);
    });
  }, [query, subscriptions, t]);

  const selected = subscriptions.find((item) => item.id === selectedId) ?? subscriptions[0] ?? null;
  const sidebarUpcomingSubscriptions = useMemo(() => {
    return subscriptions
      .filter((subscription) => subscriptionStatus(subscription) === "active" && daysUntil(subscription.endDate) >= 0)
      .sort((a, b) => parseLocalDate(a.endDate).getTime() - parseLocalDate(b.endDate).getTime())
      .slice(0, 5);
  }, [subscriptions]);

  function openAdd(subscription: Subscription) {
    setDraft(normalizeSubscription(subscription));
    setDraftMode("add");
    navigateTo("detail");
  }

  function openAddSelect() {
    setDraft(null);
    setTemplateQuery("");
    navigateTo("addSelect");
  }

  function openEdit(subscription: Subscription) {
    setDraft(normalizeSubscription({ ...subscription }));
    setDraftMode("edit");
    navigateTo("detail");
  }

  function saveDraft() {
    if (!draft) return;
    const normalized = normalizeSubscription(draft);
    if (draftMode === "add") {
      setSubscriptions((items) => sortSubscriptions([...items, normalized], language));
      setSelectedId(normalized.id);
    } else {
      setSubscriptions((items) => sortSubscriptions(items.map((item) => (item.id === normalized.id ? normalized : item)), language));
    }
    setDraft(null);
    navigateTo("detail");
  }

  function cancelDraft() {
    setDraft(null);
    setMainView(draftMode === "add" ? "addSelect" : previousView);
  }

  function deleteSubscription(subscription: Subscription) {
    setSubscriptions((items) => {
      const next = items.filter((item) => item.id !== subscription.id);
      if (selectedId === subscription.id) setSelectedId(next[0]?.id ?? null);
      return next;
    });
    setDraft(null);
  }

  function toggleThemeMode() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  function toggleLanguageMode() {
    setLanguage(language === "zh" ? "en" : "zh");
  }

  return (
    <PreferencesContext.Provider value={preferences}>
      <main className="grid h-screen grid-cols-[220px_1fr] bg-background text-foreground">
      <aside className="flex min-h-0 flex-col border-r border-border bg-sidebar">
        <div className="border-b border-border px-3 pb-3 pt-3">
          <div className="relative z-40 mb-3 flex h-7 items-center justify-end">
            <button
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={openAddSelect}
            >
              <Plus className="h-[18px] w-[18px] stroke-[2.5]" />
            </button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <Input
              className="search-input relative z-0 h-7 w-full rounded-full border-transparent bg-zinc-200 pl-8 pr-2 text-left font-normal leading-none text-zinc-700 placeholder:text-zinc-500 focus:border-zinc-300 focus:bg-zinc-100 focus:ring-0"
              placeholder={t("common.search")}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <button
            className={cn(
              "mt-2 flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-bold transition",
              mainView === "overview" && !draft
                ? "bg-zinc-100 text-zinc-900"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            onClick={() => {
              setDraft(null);
              navigateTo("overview");
            }}
          >
            <BarChart3 className="h-3.5 w-3.5 text-current" />
            {t("nav.overview")}
          </button>
          <button
            className={cn(
              "mt-1 flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-bold transition",
              mainView === "detailSubscriptions" && !draft
                ? "bg-zinc-100 text-zinc-900"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            onClick={() => {
              setDraft(null);
              navigateTo("detailSubscriptions");
            }}
          >
            <ListChecks className="h-3.5 w-3.5 text-current" />
            {t("nav.detailSubscriptions")}
          </button>
          <button
            className={cn(
              "mt-1 flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-bold transition",
              mainView === "accounts" && !draft
                ? "bg-zinc-100 text-zinc-900"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            onClick={() => {
              setDraft(null);
              navigateTo("accounts");
            }}
          >
            <UserRound className="h-3.5 w-3.5 text-current" />
            {t("nav.accounts")}
          </button>
          <button
            className="mt-1 flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-bold text-sidebar-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => setIsSidebarUpcomingOpen((open) => !open)}
          >
            {isSidebarUpcomingOpen ? <ChevronDown className="h-3.5 w-3.5 text-current" /> : <ChevronRight className="h-3.5 w-3.5 text-current" />}
            {t("nav.upcoming")}
          </button>
          {isSidebarUpcomingOpen ? (
            <div className="mt-1 flex flex-col gap-1">
              {sidebarUpcomingSubscriptions.length === 0 ? (
                <div className="pl-8 py-1.5 text-[11px] text-muted-foreground">{t("sidebar.noUpcoming")}</div>
              ) : sidebarUpcomingSubscriptions.map((subscription) => {
                const timingText = overviewUpcomingTimingText(daysUntil(subscription.endDate), subscription.isAutoRenewEnabled, language, t);
                return (
                  <button
                    key={subscription.id}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg py-1.5 pl-8 pr-2 text-left transition",
                      mainView === "detail" && selected?.id === subscription.id && !draft
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                    onClick={() => {
                      setSelectedId(subscription.id);
                      setDraft(null);
                      navigateTo("detail");
                    }}
                  >
                    <ServiceIcon subscription={subscription} size="sm" framed={false} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">{serviceLabel(subscription, t)}</div>
                      <div
                        className={cn(
                          "truncate text-[11px]",
                          mainView === "detail" && selected?.id === subscription.id && !draft ? "text-zinc-500" : "text-muted-foreground",
                        )}
                      >
                        {timingText}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-2">
          {filteredSubscriptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">{t("sidebar.noPinned")}</div>
          ) : (
            <div className="space-y-1">
              {filteredSubscriptions.map((subscription) => (
                <button
                  key={subscription.id}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                    mainView === "detail" && selected?.id === subscription.id && !draft
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                  onClick={() => {
                    setSelectedId(subscription.id);
                    setDraft(null);
                    navigateTo("detail");
                  }}
                >
                  <ServiceIcon subscription={subscription} size="sm" framed={false} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{serviceLabel(subscription, t)}</div>
                    <div className={cn(
                      "truncate text-xs",
                      mainView === "detail" && selected?.id === subscription.id && !draft ? "text-zinc-500" : "text-muted-foreground",
                    )}>
                      {statusText(subscriptionStatus(subscription), t)} · {relativeEnd(subscription, t)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="p-2">
          <button
            className={cn(
              "flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-bold transition",
              mainView === "settings" && !draft
                ? "bg-zinc-100 text-zinc-900"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
            onClick={() => {
              setDraft(null);
              navigateTo("settings");
            }}
          >
            <Settings className="h-3.5 w-3.5 text-current" />
            {t("nav.settings")}
          </button>
        </div>
      </aside>

      <section className="flex min-h-0 flex-col overflow-hidden bg-background">
        <div
          className="z-40 flex h-12 shrink-0 items-center justify-between gap-1 border-b border-border bg-background/95 px-3"
          data-tauri-drag-region
          onMouseDown={startWindowDrag}
        >
          {mainView === "addSelect" ? (
            <>
              <Button className="topbar-small-button" variant="secondary" size="xs" onClick={() => { setDraft(null); setMainView(previousView); }}>
                <ArrowLeft data-icon="inline-start" />
                <span className="topbar-button-label">{t("common.back")}</span>
              </Button>
              <Button className="topbar-small-button" size="xs" onClick={() => openAdd(makeCustomSubscription())} title={t("common.custom")}>
                <Plus data-icon="inline-start" />
                <span className="topbar-button-label">{t("common.custom")}</span>
              </Button>
            </>
          ) : draft ? (
            <>
              <Button className="topbar-small-button" variant="secondary" size="xs" onClick={cancelDraft}>
                <ArrowLeft data-icon="inline-start" />
                <span className="topbar-button-label">{t("common.back")}</span>
              </Button>
              <div />
            </>
          ) : mainView === "detail" ? (
            <>
              <Button className="topbar-small-button" variant="secondary" size="xs" onClick={() => setMainView(previousView)}>
                <ArrowLeft data-icon="inline-start" />
                <span className="topbar-button-label">{t("common.back")}</span>
              </Button>
              <QuickPreferenceButtons
                language={language}
                theme={theme}
                t={t}
                onToggleTheme={toggleThemeMode}
                onToggleLanguage={toggleLanguageMode}
              />
            </>
          ) : mainView === "settings" ? (
            <>
              <ToggleGroup
                type="single"
                value={settingsTab}
                onValueChange={(value) => {
                  if (value) setSettingsTab(value as SettingsTab);
                }}
                variant="outline"
                size="sm"
                spacing={0}
              >
                <ToggleGroupItem className="settings-segment-button w-20 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950" value="basic">
                  {t("settings.basic")}
                </ToggleGroupItem>
                <ToggleGroupItem className="settings-segment-button w-20 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950" value="accounts">
                  {t("settings.accounts")}
                </ToggleGroupItem>
                <ToggleGroupItem className="settings-segment-button w-20 data-[state=on]:bg-zinc-200 data-[state=on]:text-zinc-950 dark:data-[state=on]:bg-white dark:data-[state=on]:text-zinc-950" value="exchange">
                  {t("settings.exchange")}
                </ToggleGroupItem>
              </ToggleGroup>
              <QuickPreferenceButtons
                language={language}
                theme={theme}
                t={t}
                onToggleTheme={toggleThemeMode}
                onToggleLanguage={toggleLanguageMode}
              />
            </>
          ) : mainView === "detailSubscriptions" ? (
            <>
              <div className="flex items-center gap-1">
                <Button
                  className={cn("h-8 w-8 rounded-md p-0", detailDisplayMode === "cards" ? "bg-zinc-200 text-foreground dark:bg-zinc-700" : "text-muted-foreground")}
                  variant="ghost"
                  size="icon"
                  title={t("view.cards")}
                  onClick={() => setDetailDisplayMode("cards")}
                >
                  <MaskedIcon path="/other-icons/grid.svg" className="h-[18px] w-[18px]" />
                </Button>
                <Button
                  className={cn("h-8 w-8 rounded-md p-0", detailDisplayMode === "table" ? "bg-zinc-200 text-foreground dark:bg-zinc-700" : "text-muted-foreground")}
                  variant="ghost"
                  size="icon"
                  title={t("view.table")}
                  onClick={() => setDetailDisplayMode("table")}
                >
                  <MaskedIcon path="/other-icons/list.svg" className="h-[19px] w-[19px]" />
                </Button>
              </div>
              <QuickPreferenceButtons
                language={language}
                theme={theme}
                t={t}
                onToggleTheme={toggleThemeMode}
                onToggleLanguage={toggleLanguageMode}
              />
            </>
          ) : (
            <>
              <div />
              <QuickPreferenceButtons
                language={language}
                theme={theme}
                t={t}
                onToggleTheme={toggleThemeMode}
                onToggleLanguage={toggleLanguageMode}
              />
            </>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <div
            className={cn(
              "mx-auto flex w-full flex-col gap-4 px-3 py-4",
              mainView === "detailSubscriptions" && detailDisplayMode === "table" ? "h-full min-h-0 overflow-hidden" : "min-h-full",
            )}
          >
            {mainView === "addSelect" ? (
              <AddSelectPage
                query={templateQuery}
                onQueryChange={setTemplateQuery}
                onPickTemplate={(template) => openAdd(makeSubscriptionFromTemplate(template))}
              />
            ) : draft ? (
              <Editor
                draft={draft}
                onChange={setDraft}
                onCancel={cancelDraft}
                onSave={saveDraft}
                onDelete={draftMode === "edit" ? () => deleteSubscription(draft) : undefined}
              />
            ) : mainView === "settings" ? (
              <SettingsPage activeTab={settingsTab} />
            ) : mainView === "detailSubscriptions" ? (
              <DetailedSubscriptionsPage
                subscriptions={subscriptions}
                displayMode={detailDisplayMode}
                onOpen={(subscription) => {
                  setSelectedId(subscription.id);
                  setMainView("detail");
                }}
                onAdd={openAddSelect}
              />
            ) : mainView === "accounts" ? (
              <AccountsPage
                subscriptions={subscriptions}
                onOpen={(subscription) => {
                  setSelectedId(subscription.id);
                  setMainView("detail");
                }}
              />
            ) : mainView === "detail" && selected ? (
              <SubscriptionDetail
                subscription={selected}
                onEdit={() => openEdit(selected)}
                onChange={(next) => setSubscriptions((items) => sortSubscriptions(items.map((item) => (item.id === next.id ? normalizeSubscription(next) : item)), language))}
              />
            ) : (
              <OverviewDashboard subscriptions={subscriptions} onAdd={openAddSelect} onOpen={(subscription) => {
                setSelectedId(subscription.id);
                setMainView("detail");
              }} />
            )}
          </div>
        </div>
      </section>
    </main>
    </PreferencesContext.Provider>
  );
}

function QuickPreferenceButtons({
  language,
  theme,
  t,
  onToggleTheme,
  onToggleLanguage,
}: {
  language: LanguageCode;
  theme: ThemePreference;
  t: (key: string) => string;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button className="h-7 w-7 rounded-full p-0" variant="ghost" size="icon" title={t("settings.theme")} onClick={onToggleTheme}>
        {theme === "dark" ? <Moon data-icon="inline-start" /> : <Sun data-icon="inline-start" />}
      </Button>
      <Button className="h-7 min-w-8 rounded-full px-2 text-[11px] font-semibold" variant="ghost" size="sm" title={t("settings.language")} onClick={onToggleLanguage}>
        {language === "zh" ? "中" : "EN"}
      </Button>
    </div>
  );
}
