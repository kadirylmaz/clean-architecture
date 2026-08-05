import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center dark:bg-slate-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Sayfa bulunamadı</h1>
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Aradığın sayfa taşınmış veya hiç var olmamış olabilir.
      </p>
      <Link to="/">
        <Button>Ana sayfaya dön</Button>
      </Link>
    </div>
  );
}
