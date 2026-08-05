import { useMemo, useState } from "react";
import { ClipboardList, Plus, SearchX } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { StatsCards } from "@/components/todos/StatsCards";
import { TodoFilters, type PriorityFilter, type StatusFilter } from "@/components/todos/TodoFilters";
import { TodoItemCard } from "@/components/todos/TodoItemCard";
import { TodoFormModal } from "@/components/todos/TodoFormModal";
import { TodoListSkeleton } from "@/components/todos/TodoListSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useTodos } from "@/hooks/useTodos";
import type { TodoResponse } from "@/api/types";

export function TodosPage() {
  const { user } = useAuth();
  const { todos, isLoading, isError } = useTodos();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoResponse | null>(null);

  const filteredTodos = useMemo(() => {
    return todos
      .filter((todo) => {
        if (status === "active" && todo.isCompleted) return false;
        if (status === "completed" && !todo.isCompleted) return false;
        if (priority !== "all" && todo.priority !== priority) return false;
        if (search && !todo.description.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
        if (a.priority !== b.priority) return b.priority - a.priority;
        if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [todos, status, priority, search]);

  const hasActiveFilters = search !== "" || status !== "all" || priority !== "all";

  return (
    <AppShell>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Merhaba, {user?.firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            İşte bugünkü görevlerine genel bakış.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="lg">
          <Plus className="h-4 w-4" />
          Yeni Görev
        </Button>
      </div>

      <div className="mb-8">
        <StatsCards todos={todos} />
      </div>

      <div className="mb-5">
        <TodoFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          priority={priority}
          onPriorityChange={setPriority}
        />
      </div>

      {isLoading ? (
        <TodoListSkeleton />
      ) : isError ? (
        <EmptyState
          icon={SearchX}
          title="Görevler yüklenemedi"
          description="Sunucuya ulaşılamadı. Lütfen bağlantını kontrol edip tekrar dene."
        />
      ) : filteredTodos.length === 0 ? (
        <EmptyState
          icon={hasActiveFilters ? SearchX : ClipboardList}
          title={hasActiveFilters ? "Sonuç bulunamadı" : "Henüz görev yok"}
          description={
            hasActiveFilters
              ? "Filtrelere uyan bir görev bulunamadı. Aramanı veya filtreleri değiştirmeyi dene."
              : "İlk görevini oluşturarak günü organize etmeye başla."
          }
          action={
            !hasActiveFilters && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Görev oluştur
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredTodos.map((todo) => (
            <TodoItemCard key={todo.id} todo={todo} onEdit={setEditingTodo} />
          ))}
        </div>
      )}

      <TodoFormModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      <TodoFormModal isOpen={editingTodo !== null} onClose={() => setEditingTodo(null)} todo={editingTodo} />
    </AppShell>
  );
}
