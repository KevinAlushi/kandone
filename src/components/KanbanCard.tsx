import React, { useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types';
import { Trash2, Check } from 'lucide-react';
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

  const PARTICLE_COLORS = ['#34D399', '#6EE7B7', '#A7F3D0', '#FDE68A', '#86EFAC'];
  const particleData = useMemo(() =>
    isFlashy ? [...Array(20)].map((_, i) => ({
      angle: (i * (360 / 20) + (Math.random() - 0.5) * 15) * (Math.PI / 180),
      distance: 55 + Math.random() * 65,
      size: Math.random() * 5 + 3,
      peakScale: Math.random() * 0.7 + 0.8,
      rotation: (Math.random() - 0.5) * 400,
      delay: Math.random() * 0.1,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
      isCircle: Math.random() > 0.45,
    })) : [],
    [isFlashy] // eslint-disable-line react-hooks/exhaustive-deps
  );

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
            {/* Flash overlay */}
            <motion.div
              initial={{ opacity: 0.55 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="absolute inset-0 rounded-xl bg-emerald-500"
            />

            {/* Expanding pulse rings */}
            {[0, 1, 2].map((ring) => (
              <motion.div
                key={ring}
                initial={{ scale: 0.85, opacity: 0.65 }}
                animate={{ scale: 1.7, opacity: 0 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: ring * 0.12 }}
                className="absolute inset-0 rounded-xl border border-emerald-400"
              />
            ))}

            {/* Particles */}
            {particleData.map((p, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                animate={{
                  x: Math.cos(p.angle) * p.distance,
                  y: Math.sin(p.angle) * p.distance,
                  scale: [0, p.peakScale, 0],
                  opacity: [1, 1, 0],
                  rotate: p.rotation,
                }}
                transition={{ duration: 0.65, ease: "easeOut", delay: p.delay }}
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: p.isCircle ? '50%' : '2px',
                  boxShadow: `0 0 8px ${p.color}90`,
                }}
                className="absolute"
              />
            ))}

            {/* Checkmark circle */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.25, 1], opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ duration: 0.45, times: [0, 0.65, 1], ease: "easeOut" }}
              className="absolute flex items-center justify-center w-11 h-11 rounded-full bg-emerald-500 shadow-[0_0_28px_rgba(16,185,129,0.65)]"
            >
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, duration: 0.25, type: "spring", damping: 12, stiffness: 260 }}
              >
                <Check size={22} strokeWidth={3} className="text-white" />
              </motion.div>
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
