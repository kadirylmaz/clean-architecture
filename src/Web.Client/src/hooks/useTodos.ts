import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { todosApi } from "@/api/todos";
import { getApiErrorMessage } from "@/api/client";
import type { CreateTodoRequest, TodoResponse, UpdateTodoRequest } from "@/api/types";
import { useAuth } from "./useAuth";

const todosKey = (userId: string) => ["todos", userId] as const;

export function useTodos() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: todosKey(userId),
    queryFn: () => todosApi.list(userId),
    enabled: Boolean(userId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: todosKey(userId) });

  const createTodo = useMutation({
    mutationFn: (payload: Omit<CreateTodoRequest, "userId">) =>
      todosApi.create({ ...payload, userId }),
    onSuccess: () => {
      toast.success("Görev oluşturuldu");
      void invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Görev oluşturulamadı")),
  });

  const updateTodo = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTodoRequest }) =>
      todosApi.update(id, payload),
    onSuccess: () => {
      toast.success("Görev güncellendi");
      void invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Görev güncellenemedi")),
  });

  const completeTodo = useMutation({
    mutationFn: (id: string) => todosApi.complete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: todosKey(userId) });
      const previous = queryClient.getQueryData<TodoResponse[]>(todosKey(userId));

      queryClient.setQueryData<TodoResponse[]>(todosKey(userId), (current) =>
        current?.map((todo) =>
          todo.id === id ? { ...todo, isCompleted: true, completedAt: new Date().toISOString() } : todo,
        ),
      );

      return { previous };
    },
    onError: (error, _id, context) => {
      queryClient.setQueryData(todosKey(userId), context?.previous);
      toast.error(getApiErrorMessage(error, "Görev tamamlanamadı"));
    },
    onSettled: () => void invalidate(),
  });

  const deleteTodo = useMutation({
    mutationFn: (id: string) => todosApi.remove(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: todosKey(userId) });
      const previous = queryClient.getQueryData<TodoResponse[]>(todosKey(userId));

      queryClient.setQueryData<TodoResponse[]>(todosKey(userId), (current) =>
        current?.filter((todo) => todo.id !== id),
      );

      return { previous };
    },
    onSuccess: () => toast.success("Görev silindi"),
    onError: (error, _id, context) => {
      queryClient.setQueryData(todosKey(userId), context?.previous);
      toast.error(getApiErrorMessage(error, "Görev silinemedi"));
    },
    onSettled: () => void invalidate(),
  });

  const copyTodo = useMutation({
    mutationFn: (todoId: string) => todosApi.copy(todoId, userId),
    onSuccess: () => {
      toast.success("Görev kopyalandı");
      void invalidate();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Görev kopyalanamadı")),
  });

  return {
    todos: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
    createTodo,
    updateTodo,
    completeTodo,
    deleteTodo,
    copyTodo,
  };
}
