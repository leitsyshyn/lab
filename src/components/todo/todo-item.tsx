"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, GripVertical, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";
import { Field } from "../ui/field";

const editTodoSchema = z.object({
  text: z.string().min(1, "Todo text is required").trim(),
});

type EditTodoFormData = z.infer<typeof editTodoSchema>;

interface TodoItemProps {
  id: string;
  text: string;
  done: boolean;
  onToggle?: (id: string, done: boolean) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, text: string) => Promise<void>;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  className?: string;
}

export function TodoItem({
  id,
  text,
  done,
  onToggle,
  onDelete,
  onUpdate,
  isDragging,
  dragHandleProps,
  className,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);

  const form = useForm<EditTodoFormData>({
    resolver: zodResolver(editTodoSchema),
    defaultValues: {
      text,
    },
  });

  const handleSave = async (data: EditTodoFormData) => {
    if (data.text.trim() === text) {
      setIsEditing(false);
      return;
    }

    if (!onUpdate) return;
    await onUpdate(id, data.text);
    setIsEditing(false);
  };

  const handleCancel = () => {
    form.reset({ text });
    setIsEditing(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <Item
      variant="muted"
      className={cn(
        className,
        { "opacity-50": isDragging },
        "z-9999 pointer-none",
      )}
    >
      <ItemMedia>
        <Button variant="ghost" size="icon" {...dragHandleProps}>
          <GripVertical />
        </Button>
      </ItemMedia>
      <ItemMedia>
        {onToggle && (
          <Checkbox
            id={`todo-${id}`}
            checked={done}
            onCheckedChange={(checked) => onToggle(id, checked as boolean)}
          />
        )}
      </ItemMedia>
      <ItemContent>
        {isEditing ? (
          <form onSubmit={form.handleSubmit(handleSave)}>
            <Controller
              name="text"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  orientation={"horizontal"}
                  className="flex gap-2 items-center"
                >
                  <Input
                    {...field}
                    autoFocus
                    aria-invalid={fieldState.invalid}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        handleCancel();
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    variant="ghost"
                    disabled={form.formState.isSubmitting}
                  >
                    <Check />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={handleCancel}
                  >
                    <X />
                  </Button>
                </Field>
              )}
            />
          </form>
        ) : (
          <ItemTitle
            style={{
              textDecoration: done ? "line-through" : "none",
            }}
          >
            {text}
          </ItemTitle>
        )}
      </ItemContent>
      <ItemActions>
        {!isEditing && onUpdate && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleEdit}
            disabled={done}
          >
            <Pencil />
          </Button>
        )}
        {onDelete && (
          <Button variant="outline" size="icon" onClick={() => onDelete(id)}>
            <Trash2 className="text-destructive" />
          </Button>
        )}
      </ItemActions>
    </Item>
  );
}
