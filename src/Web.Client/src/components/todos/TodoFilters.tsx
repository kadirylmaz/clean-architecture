import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { PRIORITY_OPTIONS } from "@/api/types";

export type StatusFilter = "all" | "active" | "completed";
export type PriorityFilter = "all" | number;

interface TodoFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  priority: PriorityFilter;
  onPriorityChange: (value: PriorityFilter) => void;
}

export function TodoFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
}: TodoFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <Input
          icon={<Search className="h-4 w-4" />}
          placeholder="Görevlerde ara…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
      <div className="flex gap-3">
        <Select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
          className="min-w-[140px]"
        >
          <option value="all">Tüm görevler</option>
          <option value="active">Devam eden</option>
          <option value="completed">Tamamlanan</option>
        </Select>
        <Select
          value={priority}
          onChange={(event) =>
            onPriorityChange(event.target.value === "all" ? "all" : Number(event.target.value))
          }
          className="min-w-[140px]"
        >
          <option value="all">Tüm öncelikler</option>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
