import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePreferences } from "../i18n";

export function EmptyDetail({ onAdd }: { onAdd: () => void }) {
  const { t } = usePreferences();

  return (
    <Card className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-200">
        <Plus className="h-7 w-7 text-zinc-600" />
      </div>
      <div className="text-xl font-bold">{t("empty.title")}</div>
      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">{t("empty.description")}</p>
      <Button className="mt-5" onClick={onAdd}>
        {t("empty.add")}
      </Button>
    </Card>
  );
}
