import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/Input";
import { useTodos } from "@/hooks/useTodos";

interface CompleteTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
  todoId: string | null;
  todoDescription?: string;
}

export function CompleteTodoModal({ isOpen, onClose, todoId, todoDescription }: CompleteTodoModalProps) {
  const { completeTodo } = useTodos();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNotes("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!todoId) return;

    try {
      await completeTodo.mutateAsync({ id: todoId, notes: notes.trim() || null });
      onClose();
    } catch {
      // toast handled centrally by the mutation hook
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Görevi tamamla"
      description={todoDescription ? `"${todoDescription}" görevini tamamlanmış olarak işaretleyeceksin.` : undefined}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
        className="space-y-4"
      >
        <TextArea
          label="Not (opsiyonel)"
          placeholder="Bu görevle ilgili eklemek istediğin bir not var mı?"
          rows={4}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          hint="Bu alan zorunlu değildir, boş bırakabilirsin."
          autoFocus
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button type="submit" isLoading={completeTodo.isPending}>
            <CheckCircle2 className="h-4 w-4" />
            Tamamlandı olarak işaretle
          </Button>
        </div>
      </form>
    </Modal>
  );
}
