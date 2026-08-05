import { apiClient } from "./client";
import type { CompleteTodoRequest, CreateTodoRequest, TodoResponse, UpdateTodoRequest } from "./types";

export const todosApi = {
  /** Omit userId to fetch every user's todos (admin-only; enforced server-side). */
  list: async (userId?: string): Promise<TodoResponse[]> => {
    const { data } = await apiClient.get<TodoResponse[]>("/todos", { params: { userId } });
    return data;
  },

  getById: async (id: string): Promise<TodoResponse> => {
    const { data } = await apiClient.get<TodoResponse>(`/todos/${id}`);
    return data;
  },

  create: async (payload: CreateTodoRequest): Promise<string> => {
    const { data } = await apiClient.post<string>("/todos", payload);
    return data;
  },

  update: async (id: string, payload: UpdateTodoRequest): Promise<void> => {
    await apiClient.put(`/todos/${id}`, payload);
  },

  complete: async (id: string, notes: string | null = null): Promise<void> => {
    const payload: CompleteTodoRequest = { notes };
    await apiClient.put(`/todos/${id}/complete`, payload);
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/todos/${id}`);
  },

  copy: async (todoId: string, userId: string): Promise<string> => {
    const { data } = await apiClient.post<string>(`/todos/${todoId}/copy`, { userId, todoId });
    return data;
  },
};
