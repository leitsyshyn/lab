"use client";

import { LiveObject } from "@liveblocks/client";
import { useEffect, useState } from "react";
import {
  useMutation,
  useOthers,
  useSelf,
  useStorage,
  useUpdateMyPresence,
} from "@/lib/liveblocks.todos";
import type { Todo } from "@/types/todo-types";
import { Badge } from "../ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { AddTodoForm } from "./add-todo-form";
import { TodoItem } from "./todo-item";
import { TodoList } from "./todo-list";

function OthersDraggingItems() {
  const others = useOthers();
  const todos = useStorage((root) => root.todos);

  return (
    <>
      {others.map(({ connectionId, presence, info }) => {
        if (!presence.cursor || !presence.isDragging || !presence.draggedItemId)
          return null;

        const draggedTodo = todos?.find(
          (todo) => todo.id === presence.draggedItemId,
        );

        if (!draggedTodo) return null;

        return (
          <div
            key={connectionId}
            className="pointer-events-none fixed z-9999"
            style={{
              left: presence.cursor.x,
              top: presence.cursor.y,
            }}
          >
            <div className="relative">
              <Badge
                variant="secondary"
                style={{ backgroundColor: info?.color }}
              >
                {info?.name || "Someone"}
              </Badge>
              <TodoItem
                key={draggedTodo.id}
                id={draggedTodo.id}
                text={draggedTodo.text}
                done={draggedTodo.done}
                isDragging={true}
              />
            </div>
          </div>
        );
      })}
    </>
  );
}

export function LiveTodoPage() {
  const [items, setItems] = useState<Todo[]>([]);
  const updateMyPresence = useUpdateMyPresence();
  const others = useOthers();
  const self = useSelf();

  const todos = useStorage((root) => root.todos);

  const actualOthers = Array.from(
    new Map(others.map((other) => [other.id, other])).values(),
  ).filter((other) => other.id !== self?.id);

  const toggleTodo = useMutation(({ storage }, id: string, done: boolean) => {
    const todos = storage.get("todos");
    const index = todos.findIndex((todo) => todo.get("id") === id);
    if (index !== -1) {
      todos.get(index)?.set("done", done);
    }
  }, []);

  const deleteTodo = useMutation(({ storage }, id: string) => {
    const todos = storage.get("todos");
    const index = todos.findIndex((todo) => todo.get("id") === id);
    if (index !== -1) {
      todos.delete(index);
    }
  }, []);

  const updateTodo = useMutation(({ storage }, id: string, text: string) => {
    const todos = storage.get("todos");
    const index = todos.findIndex((todo) => todo.get("id") === id);
    if (index !== -1) {
      todos.get(index)?.set("text", text);
    }
  }, []);

  const reorderTodos = useMutation(({ storage }, newTodos: Todo[]) => {
    const todos = storage.get("todos");
    todos.clear();
    for (const todo of newTodos) {
      todos.push(
        new LiveObject({
          id: todo.id,
          text: todo.text,
          done: todo.done,
          position: todo.position,
        }),
      );
    }
  }, []);

  const addTodo = useMutation(({ storage }, text: string) => {
    const todos = storage.get("todos");
    const maxPosition =
      todos.length > 0
        ? Math.max(
            ...todos.map((todo) => {
              const pos = todo.toObject().position;
              return pos;
            }),
          )
        : 0;
    const newTodo = new LiveObject({
      id: crypto.randomUUID(),
      text,
      done: false,
      position: maxPosition + 10,
    });
    todos.push(newTodo);
  }, []);

  useEffect(() => {
    if (todos) {
      const todoArray = todos
        .map((todo) => ({
          id: todo.id,
          text: todo.text,
          done: todo.done,
          position: todo.position,
        }))
        .sort((a, b) => a.position - b.position);
      setItems(todoArray);
    }
  }, [todos]);

  const handlePointerMove = (e: React.PointerEvent) => {
    updateMyPresence({
      cursor: { x: e.clientX, y: e.clientY },
    });
  };

  const handlePointerLeave = () => {
    updateMyPresence({
      cursor: null,
    });
  };

  const handleToggle = (id: string, done: boolean) => {
    toggleTodo(id, done);
  };

  const handleDelete = (id: string) => {
    deleteTodo(id);
  };

  const handleUpdate = async (id: string, text: string) => {
    updateTodo(id, text);
  };

  const handleDragStart = (id: string) => {
    updateMyPresence({
      isDragging: true,
      draggedItemId: id,
    });
  };

  const handleDragEnd = () => {
    updateMyPresence({
      isDragging: false,
      draggedItemId: null,
    });
  };

  const handleReorder = (newTodos: Todo[]) => {
    const todosWithPositions = newTodos.map((todo, index) => ({
      ...todo,
      position: (index + 1) * 10,
    }));
    setItems(todosWithPositions);
    reorderTodos(todosWithPositions);
  };

  const handleAddTodo = async (text: string) => {
    await addTodo(text);
  };

  return (
    <div
      className="relative min-h-screen p-6 container max-w-3xl mx-auto py-8 space-y-6"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <OthersDraggingItems />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between space-x-2">
            <CardTitle>Colaborative Todos</CardTitle>
            {actualOthers.length > 0 && (
              <Badge>
                {actualOthers.length} other user
                {actualOthers.length > 1 ? "s" : ""} online
              </Badge>
            )}
          </div>
          <CardDescription>Manage tasks and stay organized</CardDescription>
        </CardHeader>
        <CardContent>
          <AddTodoForm onSubmit={handleAddTodo} />
        </CardContent>
      </Card>

      <TodoList
        todos={items}
        onToggle={handleToggle}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
        onReorder={handleReorder}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />
    </div>
  );
}
