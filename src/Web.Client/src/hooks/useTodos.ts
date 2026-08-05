import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { todosApi } from "@/api/todos";
import { getApiErrorMessage } from "@/api/client";
import type { CreateTodoRequest, TodoResponse, UpdateTodoRequest } from "@/api/types";
import { useAuth } from "./useAuth";

const todosKey = (scope: string) => ["todos", scope] as const;

/** Pass viewAll to fetch every user's todos — the API only honors this for admins. */
export function useTodos(viewAll = false) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const requestUserId = viewAll ? undefined : userId;
  const scope = viewAll ? "all" : userId;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: todosKey(scope),
    queryFn: () => todosApi.list(requestUserId),
    enabled: Boolean(userId),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["todos"] });

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
    mutationFn: ({ id, notes }: { id: string; notes?: string | null }) => todosApi.complete(id, notes ?? null),
    onMutate: async ({ id }: { id: string; notes?: string | null }) => {
      await queryClient.cancelQueries({ queryKey: todosKey(scope) });
      const previous = queryClient.getQueryData<TodoResponse[]>(todosKey(scope));

      queryClient.setQueryData<TodoResponse[]>(todosKey(scope), (current) =>
        current?.map((todo) =>
          todo.id === id ? { ...todo, isCompleted: true, completedAt: new Date().toISOString() } : todo,
        ),
      );

      return { previous };
    },
    onError: (error, _variables, context) => {
      queryClient.setQueryData(todosKey(scope), context?.previous);
      toast.error(getApiErrorMessage(error, "Görev tamamlanamadı"));
    },
    onSuccess: () => toast.success("Görev tamamlandı"),
    onSettled: () => void invalidate(),
  });

  const deleteTodo = useMutation({
    mutationFn: (id: string) => todosApi.remove(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: todosKey(scope) });
      const previous = queryClient.getQueryData<TodoResponse[]>(todosKey(scope));

      queryClient.setQueryData<TodoResponse[]>(todosKey(scope), (current) =>
        current?.filter((todo) => todo.id !== id),
      );

      return { previous };
    },
    onSuccess: () => toast.success("Görev silindi"),
    onError: (error, _id, context) => {
      queryClient.setQueryData(todosKey(scope), context?.previous);
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
