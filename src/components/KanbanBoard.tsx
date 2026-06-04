import React, { useState, useRef, useCallback } from 'react';
import { Project, KANBAN_COLUMNS, Task, TaskStatus } from '../types';
import { KanbanColumn } from './KanbanColumn';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  closestCorners,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanCard } from './KanbanCard';
import { X } from 'lucide-react';

interface KanbanBoardProps {
  project: Project;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (title: string, status: TaskStatus) => void;
  onReorderTasks: (projectId: string, tasks: Task[]) => void;
  onDragStateChange: (isDragging: boolean) => void;
  onPersistTaskOrders: (tasks: Task[]) => void;
}

export function KanbanBoard({ project, onUpdateTaskStatus, onDeleteTask, onAddTask, onReorderTasks, onDragStateChange, onPersistTaskOrders }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [flashTaskIds, setFlashTaskIds] = useState<string[]>([]);
  const dragStartStatusRef = useRef<TaskStatus | null>(null);

  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // Use closestCenter for task-to-task precision (matches verticalListSortingStrategy)
    const closestCenterCollisions = closestCenter(args);
    const taskCollision = closestCenterCollisions.find(
      c => c.data?.current?.type === 'Task'
    );
    if (taskCollision) return [taskCollision];

    // Fall back to pointerWithin for empty-column drops
    const pointerCollisions = pointerWithin(args);
    const columnCollision = pointerCollisions.find(
      c => c.data?.current?.type === 'Column'
    );
    if (columnCollision) return [columnCollision];

    return rectIntersection(args);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { data } = active;
    
    // Clear flash if this task was flashing
    setFlashTaskIds(prev => prev.filter(id => id !== active.id));
    
    if (data.current?.type === 'Task') {
      setActiveTask(data.current.task);
      dragStartStatusRef.current = data.current.task.status;
      onDragStateChange(true);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    const activeTask = project.tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    const activeContainer = activeTask.status;
    const overContainer = isOverTask
      ? project.tasks.find(t => t.id === overId)?.status
      : isOverColumn ? (over.id as TaskStatus) : null;

    if (!overContainer || activeContainer === overContainer) {
      return;
    }

    // Moving to a different column
    const activeItems = project.tasks.filter(t => t.status === activeContainer);
    const overItems = project.tasks.filter(t => t.status === overContainer);

    let newIndex;
    if (isOverTask) {
      const overIndex = overItems.findIndex(t => t.id === overId);
      const isBelowOverItem =
        over &&
        active.rect.current.translated &&
        active.rect.current.translated.top + active.rect.current.translated.height / 2 >
        over.rect.top + over.rect.height / 2;
      const modifier = isBelowOverItem ? 1 : 0;
      newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length;
    } else {
      newIndex = overItems.length;
    }

    const taskToMove = { ...activeTask, status: overContainer };
    overItems.splice(newIndex, 0, taskToMove);

    const reorderedColumns = KANBAN_COLUMNS.map(col => {
      if (col.id === activeContainer) {
        return activeItems.filter(t => t.id !== activeId);
      }
      if (col.id === overContainer) {
        return overItems;
      }
      return project.tasks.filter(t => t.status === col.id);
    });

    onReorderTasks(project.id, reorderedColumns.flat());
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    onDragStateChange(false);
    setActiveTask(null);

    if (!over) {
      dragStartStatusRef.current = null;
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    const activeTask = project.tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    const overContainer = isOverTask
      ? project.tasks.find(t => t.id === overId)?.status
      : isOverColumn ? (over.id as TaskStatus) : null;

    if (overContainer === 'done' && dragStartStatusRef.current !== 'done') {
      const activeIdStr = activeId as string;
      setFlashTaskIds(prev => [...prev, activeIdStr]);
      setTimeout(() => {
        setFlashTaskIds(prev => prev.filter(id => id !== activeIdStr));
      }, 1500);
    }

    dragStartStatusRef.current = null;

    let finalTasks = [...project.tasks];

    if (activeId !== overId && isOverTask && overContainer === activeTask.status) {
      const columnTasks = project.tasks.filter(t => t.status === activeTask.status);
      const oldIndex = columnTasks.findIndex(t => t.id === activeId);
      const newIndex = columnTasks.findIndex(t => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedColumnTasks = arrayMove(columnTasks, oldIndex, newIndex);

        const reorderedColumns = KANBAN_COLUMNS.map(col => {
          if (col.id === activeTask.status) {
            return reorderedColumnTasks;
          }
          return project.tasks.filter(t => t.status === col.id);
        });

        finalTasks = reorderedColumns.flat();
        onReorderTasks(project.id, finalTasks);
      }
    }

    // Always persist final states, even if activeId === overId (because handleDragOver might have changed the status)
    onPersistTaskOrders(finalTasks);
  };

  const handleDeleteRequest = (taskId: string) => {
    setTaskToDelete(taskId);
  };

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      onDeleteTask(taskToDelete);
      setTaskToDelete(null);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-x-auto overflow-y-hidden h-full min-h-0 pb-2">
        <div className="grid grid-cols-4 gap-6 h-full min-w-[800px] w-full">
          <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={() => { setActiveTask(null); onDragStateChange(false); }}
          >
            {KANBAN_COLUMNS.map((col) => {
              const columnTasks = project.tasks.filter((t) => t.status === col.id);
              return (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  tasks={columnTasks}
                  onDeleteTask={handleDeleteRequest}
                  onAddTask={(title: string) => onAddTask(title, col.id as TaskStatus)}
                  flashTaskIds={flashTaskIds}
                />
              );
            })}

            <DragOverlay>
              {activeTask && <KanbanCard task={activeTask} onDelete={() => {}} />}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-[#222] border border-white/5 border-b-[6px] border-b-black/50 rounded-2xl p-6 shadow-none text-center">
            <h3 className="text-xl font-serif italic text-white mb-2">Delete Task</h3>
            <p className="text-slate-400 text-sm mb-8">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setTaskToDelete(null)}
                className="px-6 py-3 rounded-xl text-sm font-medium text-slate-300 bg-[#333] hover:bg-[#444] border-b-[4px] border-black/50 active:border-b-0 active:translate-y-[4px] hover:text-white transition-all w-full"
              >
                Keep it
              </button>
              <button
                onClick={confirmDeleteTask}
                className="px-6 py-3 rounded-xl text-sm font-medium bg-rose-600 text-white hover:bg-rose-500 border-b-[4px] border-rose-900 active:border-b-0 active:translate-y-[4px] transition-all w-full"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
