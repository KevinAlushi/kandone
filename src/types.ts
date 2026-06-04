export type TaskStatus = 'todo' | 'working' | 'done' | 'stuck';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt?: number;
  order?: number;
}

export interface Project {
  id: string;
  name: string;
  tasks: Task[];
}

export interface KanbanColumnDef {
  id: TaskStatus;
  title: string;
  colorClass: string;
  bgClass: string;
}

export const KANBAN_COLUMNS: KanbanColumnDef[] = [
  { id: 'todo', title: 'To Do', colorClass: 'text-white', bgClass: 'bg-blue-600 border-b-[4px] border-b-blue-900 shadow-sm' },
  { id: 'working', title: 'Working On', colorClass: 'text-orange-950', bgClass: 'bg-orange-400 border-b-[4px] border-b-orange-700 shadow-sm' },
  { id: 'done', title: 'Done', colorClass: 'text-white', bgClass: 'bg-emerald-600 border-b-[4px] border-b-emerald-900 shadow-sm' },
  { id: 'stuck', title: 'Stuck', colorClass: 'text-white', bgClass: 'bg-rose-600 border-b-[4px] border-b-rose-900 shadow-sm' },
];
