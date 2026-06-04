import React, { useMemo, useState } from 'react';
import { KanbanColumnDef, Task } from '../types';
import { KanbanCard } from './KanbanCard';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  key?: React.Key;
  column: KanbanColumnDef;
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onAddTask: (title: string) => void;
  flashTaskIds?: string[];
}

export function KanbanColumn({ column, tasks, onDeleteTask, onAddTask, flashTaskIds = [] }: KanbanColumnProps) {
  const taskIds = useMemo(() => tasks.map(t => t.id), [tasks]);

  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAdding(false);
    }
  };

  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  });

  return (
    <div className="flex flex-col w-full h-full min-w-0 rounded-2xl border border-white/5 border-b-[6px] border-b-black/50 bg-[#222222] shadow-[0_8px_16px_rgba(0,0,0,0.4)] overflow-hidden">
      <div className={`p-4 flex items-center justify-between backdrop-blur-sm ${column.bgClass}`}>
        <div className="flex items-center gap-3">
          <span className={`text-[11px] uppercase tracking-widest font-bold ${column.colorClass}`}>
            {column.title}
          </span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full bg-black/20 font-medium ${column.colorClass}`}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className={`p-1 rounded-md transition-colors hover:bg-black/20 ${column.colorClass}`}
        >
          <Plus size={16} />
        </button>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto flex flex-col gap-3 p-4 min-h-[150px]"
      >
        {isAdding && (
          <form onSubmit={handleCreateTask} className="w-full">
            <input
              type="text"
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onBlur={() => !newTaskTitle.trim() && setIsAdding(false)}
              placeholder="What needs to be done?"
              className="w-full bg-[#161616] border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner"
            />
          </form>
        )}
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <KanbanCard 
              key={task.id} 
              task={task} 
              onDelete={onDeleteTask} 
              isFlashy={flashTaskIds.includes(task.id)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
