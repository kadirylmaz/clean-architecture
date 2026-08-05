export function TodoListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-start gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800"
        >
          <div className="h-6 w-6 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="flex gap-2">
              <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
