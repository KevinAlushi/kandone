import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KanbanCardProps {
  key?: React.Key;
  task: Task;
  onDelete: (id: string) => void;
  isFlashy?: boolean;
}

export function KanbanCard({ task, onDelete, isFlashy }: KanbanCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="group relative p-4 rounded-xl border-2 border-dashed border-indigo-500/50 bg-indigo-500/10 opacity-40 transition-all flex items-start gap-2"
      >
        <div className="flex-1 relative invisible">
          <p className="text-sm font-medium mb-1 text-white">
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
          )}
        </div>
        <button className="invisible p-1">
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative p-4 rounded-xl border border-b-[4px] transition-all flex items-start gap-2 cursor-grab active:cursor-grabbing touch-none ${
        task.status === 'done'
          ? (isFlashy && task.status === 'done' ? 'bg-emerald-950/40 border-emerald-500/50 border-b-emerald-700/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-[#121212] border-white/5 border-b-black/80 opacity-60 grayscale')
          : 'bg-[#161616] border-white/10 border-b-black/80 hover:border-indigo-500/50 hover:border-b-indigo-900/50'
      }`}
    >
      <AnimatePresence>
        {isFlashy && task.status === 'done' && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center overflow-visible"
          >
             <motion.div 
               initial={{ opacity: 0.8, backgroundColor: '#10B981' }}
               animate={{ opacity: 0 }}
               transition={{ duration: 0.6, ease: "easeOut" }}
               className="absolute inset-0 rounded-xl"
             />

             <motion.div 
               initial={{ scale: 1, opacity: 1, borderWidth: '0px' }}
               animate={{ scale: 1.05, opacity: 0, borderWidth: '6px' }}
               transition={{ duration: 0.5, ease: "easeOut" }}
               className="absolute inset-0 rounded-xl border-emerald-400"
             />
             
             {[...Array(12)].map((_, i) => {
                const angle = (i * 30) * (Math.PI / 180);
                const distance = 80 + Math.random() * 40;
                return (
                  <motion.div
                    key={i}
                    initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                    animate={{ 
                      x: Math.cos(angle) * distance, 
                      y: Math.sin(angle) * distance,
                      scale: [0, Math.random() * 1 + 0.5, 0],
                      opacity: [1, 1, 0],
                      rotate: Math.random() * 180
                    }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: Math.random() * 0.1 }}
                    className="absolute w-2 h-2 bg-emerald-400 rounded-sm shadow-[0_0_12px_rgba(52,211,153,0.8)]"
                  />
                );
             })}
             
             <motion.div
                initial={{ scale: 2.5, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: -5 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.5, 
                  type: "spring", 
                  damping: 10, 
                  stiffness: 150 
                }}
                className="absolute px-3 py-1 border-4 border-emerald-400 text-emerald-400 font-black italic tracking-widest text-xl uppercase rounded-lg shadow-[0_0_20px_rgba(52,211,153,0.4)] backdrop-blur-sm bg-black/40"
             >
               DONE
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 relative z-0">
        <p className={`text-sm font-medium mb-1 ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-white'}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>
        )}
      </div>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity p-1 z-20 relative cursor-pointer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
