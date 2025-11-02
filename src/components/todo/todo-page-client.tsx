"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  createTodo,
  deleteTodo,
  reorderTodos,
  toggleTodo,
  updateTodoText,
} from "@/actions/todo-actions";
import { AddTodoForm } from "@/components/todo/add-todo-form";
import { TodoList } from "@/components/todo/todo-list";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface Todo {
  id: string;
  text: string;
  done: boolean;
  position: number;
}

interface TodoPageClientProps {
  initialTodos: Todo[];
  listId: string;
}

export function TodoPageClient({ initialTodos, listId }: TodoPageClientProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);

  const handleCreateTodo = async (text: string) => {
    const tempId = `temp-${Date.now()}`;
    const optimisticTodo = {
      id: tempId,
      text,
      done: false,
      position:
        todos.length > 0 ? Math.max(...todos.map((t) => t.position)) + 10 : 10,
    };

    setTodos([...todos, optimisticTodo]);

    try {
      const newTodo = await createTodo(listId, text);
      setTodos((currentTodos) =>
        currentTodos.map((t) => (t.id === tempId ? newTodo : t)),
      );
      toast.success("Todo created!");
    } catch (error) {
      setTodos((currentTodos) => currentTodos.filter((t) => t.id !== tempId));
      toast.error("Failed to create todo");
      console.error(error);
    }
  };

  const handleToggle = async (id: string, done: boolean) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, done } : todo)));

    try {
      await toggleTodo(id, done);
    } catch (error) {
      setTodos(
        todos.map((todo) => (todo.id === id ? { ...todo, done: !done } : todo)),
      );
      toast.error("Failed to update todo");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    const deletedTodo = todos.find((todo) => todo.id === id);
    setTodos(todos.filter((todo) => todo.id !== id));

    try {
      await deleteTodo(id);
      toast.success("Todo deleted!");
    } catch (error) {
      if (deletedTodo) {
        setTodos([...todos, deletedTodo]);
      }
      toast.error("Failed to delete todo");
      console.error(error);
    }
  };

  const handleUpdate = async (id: string, text: string) => {
    const previousTodos = todos;
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, text } : todo)));

    try {
      await updateTodoText(id, text);
    } catch (error) {
      setTodos(previousTodos);
      toast.error("Failed to update todo");
      console.error(error);
    }
  };

  const handleReorder = async (reorderedTodos: Todo[]) => {
    const previousTodos = todos;

    setTodos(reorderedTodos);

    const updates = reorderedTodos.map((todo, index) => ({
      id: todo.id,
      position: (index + 1) * 10,
    }));

    try {
      await reorderTodos(listId, updates);
    } catch (error) {
      setTodos(previousTodos);
      toast.error("Failed to reorder todos");
      console.error(error);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Todos</CardTitle>
          <CardDescription>
            Manage your tasks and stay organized
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddTodoForm onSubmit={handleCreateTodo} />
        </CardContent>
      </Card>

      <TodoList
        todos={todos}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onReorder={handleReorder}
      />
    </div>
  );
}
