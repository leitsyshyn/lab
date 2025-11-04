"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { ItemGroup } from "../ui/item";
import { TodoItem } from "./todo-item";

interface Todo {
  id: string;
  text: string;
  done: boolean;
  position: number;
}

interface TodoListProps {
  todos: Todo[];
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => Promise<void>;
  onReorder: (todos: Todo[]) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

function SortableTodoItem({
  todo,
  onToggle,
  onDelete,
  onUpdate,
}: {
  todo: Todo;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => Promise<void>;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TodoItem
        id={todo.id}
        text={todo.text}
        done={todo.done}
        onToggle={onToggle}
        onDelete={onDelete}
        onUpdate={onUpdate}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  );
}

export function TodoList({
  todos,
  onToggle,
  onDelete,
  onUpdate,
  onReorder,
  onDragStart,
  onDragEnd: onDragEndCallback,
}: TodoListProps) {
  const [items, setItems] = useState(todos);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    setItems(todos);
  }, [todos]);

  const handleDragStart = (event: DragStartEvent) => {
    onDragStart?.(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    onDragEndCallback?.();

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onReorder(newItems);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No todos yet. Create one to get started!
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <ItemGroup className="gap-4">
          {items.map((todo) => (
            <SortableTodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </ItemGroup>
      </SortableContext>
    </DndContext>
  );
}
