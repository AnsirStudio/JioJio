import { accountMethodOptions } from "../lib/subscriptions";

export const accountStorageKey = "jiojio.accounts.v1";

export type AccountEntry = { value: string; note: string };
export type AccountStore = Record<string, AccountEntry[]>;

export function loadAccountStore(): AccountStore {
  try {
    const raw = localStorage.getItem(accountStorageKey);
    if (!raw) {
      const defaults: AccountStore = {};
      for (const method of accountMethodOptions) {
        defaults[method.value] = [];
      }
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    // Migrate old string[] format to AccountEntry[]
    const result: AccountStore = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value)) {
        result[key] = value.map((item) =>
          typeof item === "string" ? { value: item, note: "" } : item
        );
      }
    }
    return result;
  } catch {
    return {};
  }
}

export function saveAccountStore(store: AccountStore) {
  localStorage.setItem(accountStorageKey, JSON.stringify(store, null, 2));
}
