export const Priority = {
  Normal: 0,
  Low: 1,
  Medium: 2,
  High: 3,
  Top: 4,
} as const;

export type PriorityValue = (typeof Priority)[keyof typeof Priority];

export interface PriorityOption {
  value: PriorityValue;
  label: string;
}

export const PRIORITY_OPTIONS: PriorityOption[] = [
  { value: Priority.Top, label: "En Yüksek" },
  { value: Priority.High, label: "Yüksek" },
  { value: Priority.Medium, label: "Orta" },
  { value: Priority.Low, label: "Düşük" },
  { value: Priority.Normal, label: "Normal" },
];

export interface TodoResponse {
  id: string;
  userId: string;
  description: string;
  dueDate: string | null;
  labels: string[];
  isCompleted: boolean;
  createdAt: string;
  completedAt: string | null;
  priority: PriorityValue;
  completionNotes: string | null;
  ownerName: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
}

export interface AccessTokensResponse {
  accessToken: string;
  refreshToken: string;
}

export interface CreateTodoRequest {
  userId: string;
  description: string;
  dueDate: string | null;
  labels: string[];
  priority: PriorityValue;
}

export interface UpdateTodoRequest {
  description: string;
}

export interface CompleteTodoRequest {
  notes: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface ApiProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
}
