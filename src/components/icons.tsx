import {
  AU,
  CA,
  CN,
  EU,
  GB,
  HK,
  JP,
  NG,
  SG,
  TR,
  US,
} from "country-flag-icons/react/3x2";
import { ImagePlus } from "lucide-react";
import { iconPath } from "../lib/subscriptions";
import type { Subscription } from "../lib/subscriptions";
import { usePreferences } from "../i18n";
import { cn } from "../lib/utils";

export const flagComponents = { AU, CA, CN, EU, GB, HK, JP, NG, SG, TR, US };

export function PaymentIcon({ path }: { path: string }) {
  return (
    <span
      className="inline-block size-3.5 shrink-0 bg-current opacity-80"
      style={{
        WebkitMask: `url("${path}") center / contain no-repeat`,
        mask: `url("${path}") center / contain no-repeat`,
      }}
    />
  );
}

export function MaskedIcon({ path, className }: { path: string; className?: string }) {
  return (
    <span
      className={cn("inline-block shrink-0 bg-current", className)}
      style={{
        WebkitMask: `url("${path}") center / contain no-repeat`,
        mask: `url("${path}") center / contain no-repeat`,
      }}
    />
  );
}

export function FlagIcon({ countryCode }: { countryCode: string }) {
  const Flag = flagComponents[countryCode as keyof typeof flagComponents];
  if (!Flag) return null;
  return <Flag className="h-3 w-4 shrink-0 overflow-hidden rounded-[2px]" />;
}

export function ServiceIcon({
  subscription,
  size,
  framed = true,
}: {
  subscription: Pick<Subscription, "serviceName" | "iconName" | "iconDataUrl">;
  size: "sm" | "md" | "lg" | "xl";
  framed?: boolean;
}) {
  const sizeClass = {
    sm: "h-9 w-9 rounded-lg",
    md: "h-11 w-11 rounded-xl",
    lg: "h-16 w-16 rounded-2xl",
    xl: "h-24 w-24 rounded-3xl",
  }[size];
  const iconScaleOverrides: Record<string, string> = {
    capcut: "scale-125",
    cloudflare: "scale-125",
    gemini: "scale-110",
    claude: "scale-110",
    chatgpt: "scale-110",
  };
  const iconScaleClass = iconScaleOverrides[subscription.iconName];
  const shouldInvertInDarkMode = subscription.iconName === "chatgpt" || subscription.iconName === "deno";

  if (subscription.iconDataUrl) {
    return (
      <div className={cn("flex shrink-0 items-center justify-center overflow-hidden bg-white", framed ? "border border-zinc-200 p-1" : "p-1", sizeClass)}>
        <img className="h-full w-full object-contain" src={subscription.iconDataUrl} alt="" />
      </div>
    );
  }

  if (subscription.iconName === "custom") {
    return <div className={cn("flex shrink-0 items-center justify-center bg-zinc-200 text-sm font-bold text-zinc-600", sizeClass)}>{subscription.serviceName.slice(0, 1)}</div>;
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        framed ? "border border-zinc-200 bg-white p-2" : "p-1",
        framed && shouldInvertInDarkMode ? "dark:border-zinc-700 dark:bg-zinc-950" : null,
        sizeClass,
      )}
    >
      <img className={cn("h-full w-full object-contain", iconScaleClass, shouldInvertInDarkMode ? "dark:invert" : null)} src={iconPath(subscription.iconName)} alt="" />
    </div>
  );
}

export function IconOptionLabel({ iconPath, label, className }: { iconPath?: string; label: string; className?: string }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5", className)}>
      {iconPath ? <PaymentIcon path={iconPath} /> : null}
      <span className="truncate">{label}</span>
    </span>
  );
}

export function CurrencyLabel({ label, code, className }: { label: string; code: string; className?: string }) {
  const name = label.endsWith(` ${code}`) ? label.slice(0, -code.length - 1) : label;

  return (
    <span className={cn("min-w-0 truncate", className)}>
      {name} <span className="text-muted-foreground">{code}</span>
    </span>
  );
}

export function CustomIconUploadButton({
  subscription,
  onUpload,
}: {
  subscription: Subscription;
  onUpload: (iconDataUrl: string) => void;
}) {
  const { t } = usePreferences();

  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onUpload(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <label className="group relative block cursor-pointer" title={t("editor.uploadIcon")}>
      <input
        className="sr-only"
        type="file"
        accept="image/*"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      {subscription.iconDataUrl ? (
        <ServiceIcon subscription={subscription} size="lg" />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-100 text-zinc-500 transition group-hover:border-zinc-400 group-hover:bg-zinc-200">
          <ImagePlus className="h-5 w-5" />
        </div>
      )}
    </label>
  );
}
