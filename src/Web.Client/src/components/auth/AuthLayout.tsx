import type { ReactNode } from "react";
import { CheckCircle2, ListChecks, ShieldCheck, Sparkles, Zap } from "lucide-react";

const highlights = [
  { icon: ListChecks, text: "Görevlerini önceliğe göre organize et" },
  { icon: Zap, text: "Etiketler ve son tarihlerle hızlı takip" },
  { icon: ShieldCheck, text: "JWT tabanlı güvenli oturum yönetimi" },
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">Flow</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Günlük işlerini akışında tut.
          </h1>
          <p className="mt-4 text-brand-100">
            Flow ile görevlerini oluştur, önceliklendir ve hiçbir son tarihi kaçırma.
          </p>

          <ul className="mt-8 space-y-4">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-brand-50">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-sm text-brand-100">
          <CheckCircle2 className="h-4 w-4" />
          Clean Architecture ile inşa edildi
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm animate-fade-in">{children}</div>
      </div>
    </div>
  );
}
