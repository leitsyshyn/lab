"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const addTodoSchema = z.object({
  text: z.string().min(1, "Todo text is required").trim(),
});

type AddTodoFormData = z.infer<typeof addTodoSchema>;

interface AddTodoFormProps {
  onSubmit: (text: string) => Promise<void>;
}

export function AddTodoForm({ onSubmit }: AddTodoFormProps) {
  const form = useForm<AddTodoFormData>({
    resolver: zodResolver(addTodoSchema),
    defaultValues: {
      text: "",
    },
  });

  const onFormSubmit = async (data: AddTodoFormData) => {
    await onSubmit(data.text);
    form.reset();
  };

  return (
    <form id="add-todo-form" onSubmit={form.handleSubmit(onFormSubmit)}>
      <FieldGroup>
        <Controller
          name="text"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} orientation="horizontal">
              <Input
                {...field}
                id="add-todo-text"
                type="text"
                aria-invalid={fieldState.invalid}
                placeholder="What needs to be done?"
                disabled={form.formState.isSubmitting}
              />
              <Button type="submit" disabled={form.formState.isSubmitting}>
                <Plus />
                {form.formState.isSubmitting ? "Adding..." : "Add"}
              </Button>
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
