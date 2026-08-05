import { AlertCircle, CheckCircle2, Circle, ListTodo, type LucideIcon } from "lucide-react";
import type { TodoResponse } from "@/api/types";
import { isOverdue } from "@/lib/date";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
}

function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-50">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export function StatsCards({ todos }: { todos: TodoResponse[] }) {
  const total = todos.length;
  const completed = todos.filter((todo) => todo.isCompleted).length;
  const pending = total - completed;
  const overdue = todos.filter((todo) => isOverdue(todo.dueDate, todo.isCompleted)).length;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Toplam görev"
        value={total}
        icon={ListTodo}
        accent="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
      />
      <StatCard
        label="Devam eden"
        value={pending}
        icon={Circle}
        accent="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
      />
      <StatCard
        label="Tamamlanan"
        value={completed}
        icon={CheckCircle2}
        accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
      />
      <StatCard
        label="Gecikmiş"
        value={overdue}
        icon={AlertCircle}
        accent="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
      />
    </div>
  );
}
