import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

const EMERALDS = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0'];
const GOLDS    = ['#FBBF24', '#F59E0B', '#FDE68A'];
const WHITE    = ['rgba(255,255,255,0.92)'];

function buildParticles(count: number) {
  return [...Array(count)].map((_, i) => {
    const type: 'dot' | 'streak' | 'diamond' =
      i % 3 === 0 ? 'streak' : i % 3 === 1 ? 'dot' : 'diamond';

    const angleDeg = i * (360 / count) + (Math.random() - 0.5) * 22;
    const angleRad = angleDeg * (Math.PI / 180);
    const speed    = 80 + Math.random() * 95;

    const roll    = Math.random();
    const palette = roll > 0.6 ? EMERALDS : roll > 0.3 ? GOLDS : WHITE;
    const color   = palette[Math.floor(Math.random() * palette.length)];

    return {
      x: Math.cos(angleRad) * speed,
      y: Math.sin(angleRad) * speed,
      type,
      angleDeg,
      color,
      delay:       Math.random() * 0.1,
      duration:    0.55 + Math.random() * 0.25,
      size: type === 'streak'
        ? { w: 14 + Math.random() * 9, h: 2.5 + Math.random() * 2 }
        : type === 'dot'
        ? { w: 4  + Math.random() * 6, h: 4   + Math.random() * 6 }
        : { w: 7  + Math.random() * 5, h: 7   + Math.random() * 5 },
      initRotate: type === 'streak' ? angleDeg : type === 'diamond' ? 45 : 0,
      spin:        type === 'streak' ? 0 : (Math.random() - 0.5) * 540,
    };
  });
}

export function KanbanCard({ task, onDelete, isFlashy }: KanbanCardProps) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { type: 'Task', task } });

  const cardRef  = useRef<HTMLDivElement | null>(null);
  const [cardRect, setCardRect] = useState<DOMRect | null>(null);

  const setNodeRefCombined = useCallback((el: HTMLDivElement | null) => {
    setNodeRef(el);
    cardRef.current = el;
  }, [setNodeRef]);

  useEffect(() => {
    if (isFlashy && cardRef.current) {
      setCardRect(cardRef.current.getBoundingClientRect());
    } else if (!isFlashy) {
      setCardRect(null);
    }
  }, [isFlashy]);

  const particles = useMemo(() => (isFlashy ? buildParticles(30) : []), [isFlashy]);

  const style = { transition, transform: CSS.Transform.toString(transform) };

  if (isDragging) {
    return (
      <div
        ref={setNodeRefCombined}
        style={style}
        className="group relative p-4 rounded-xl border-2 border-dashed border-indigo-500/50 bg-indigo-500/10 opacity-40 transition-all flex items-start gap-2"
      >
        <div className="flex-1 relative invisible">
          <p className="text-sm font-medium mb-1 text-white">{task.title}</p>
          {task.description && <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>}
        </div>
        <button className="invisible p-1"><Trash2 size={16} /></button>
      </div>
    );
  }

  const ringSize = (cardRect?.width ?? 220) * 1.15;

  return (
    <>
      {/* ── Card ───────────────────────────────────────────────── */}
      <div
        ref={setNodeRefCombined}
        style={style}
        {...attributes}
        {...listeners}
        className={`group relative p-4 rounded-xl border border-b-[4px] transition-all flex items-start gap-2 cursor-grab active:cursor-grabbing touch-none ${
          task.status === 'done'
            ? (isFlashy
                ? 'bg-emerald-950/40 border-emerald-500/50 border-b-emerald-700/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : 'bg-[#121212] border-white/5 border-b-black/80 opacity-60 grayscale')
            : 'bg-[#161616] border-white/10 border-b-black/80 hover:border-indigo-500/50 hover:border-b-indigo-900/50'
        }`}
      >
        {/* Flash overlays — clipped to card, intentionally */}
        <AnimatePresence>
          {isFlashy && task.status === 'done' && (
            <motion.div key="flashes" className="absolute inset-0 pointer-events-none z-10">
              <motion.div
                initial={{ opacity: 0.92 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className="absolute inset-0 rounded-xl bg-white"
              />
              <motion.div
                initial={{ opacity: 0.55 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.09 }}
                className="absolute inset-0 rounded-xl bg-emerald-400"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 relative z-0">
          <p className={`text-sm font-medium mb-1 ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-white'}`}>
            {task.title}
          </p>
          {task.description && <p className="text-xs text-slate-400 line-clamp-2">{task.description}</p>}
        </div>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity p-1 z-20 relative cursor-pointer"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* ── Portal animation — escapes overflow-hidden column ── */}
      {isFlashy && task.status === 'done' && cardRect && createPortal(
        <div
          style={{
            position:      'fixed',
            left:          cardRect.left,
            top:           cardRect.top,
            width:         cardRect.width,
            height:        cardRect.height,
            pointerEvents: 'none',
            zIndex:        9999,
            overflow:      'visible',
          }}
        >
          {/* Shockwave rings — circular, expand freely outward */}
          {[0, 1, 2].map(ring => (
            <motion.div
              key={ring}
              initial={{ scale: 0.28, opacity: 0.8 - ring * 0.18 }}
              animate={{ scale: 1, opacity: 0 }}
              transition={{ duration: 0.65, ease: 'easeOut', delay: ring * 0.13 }}
              style={{
                position:     'absolute',
                left:         '50%',
                top:          '50%',
                width:        ringSize,
                height:       ringSize,
                marginLeft:   -ringSize / 2,
                marginTop:    -ringSize / 2,
                borderRadius: '50%',
                border:       `${1.6 - ring * 0.3}px solid #34D399`,
              }}
            />
          ))}

          {/* Particles — centered on card, burst outward */}
          <div style={{ position: 'absolute', left: '50%', top: '50%' }}>
            {particles.map((p, i) => (
              <motion.div
                key={i}
                initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: p.initRotate }}
                animate={{
                  x:       p.x,
                  y:       p.y,
                  scale:   [0, 1.25, 0],
                  opacity: [1, 1, 0],
                  rotate:  p.type === 'streak' ? p.angleDeg : p.initRotate + p.spin,
                }}
                transition={{ duration: p.duration, ease: 'easeOut', delay: p.delay }}
                style={{
                  position:     'absolute',
                  width:        p.size.w,
                  height:       p.size.h,
                  marginLeft:   -(p.size.w / 2),
                  marginTop:    -(p.size.h / 2),
                  backgroundColor: p.color,
                  borderRadius:    p.type === 'dot' ? '50%' : '2px',
                  boxShadow:       `0 0 7px ${p.color}`,
                }}
              />
            ))}
          </div>

          {/* Checkmark badge — spring pop, then self-drawing tick */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
            {/* Outer wrapper: controls appear/disappear timing */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 1, 0] }}
              transition={{ duration: 1.2, times: [0, 0.1, 0.38, 0.72, 1.0], delay: 0.1 }}
            >
              {/* Inner: spring-physics pop */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 11, stiffness: 290, delay: 0.1 }}
                style={{
                  width:         62,
                  height:        62,
                  borderRadius:  '50%',
                  backgroundColor: '#059669',
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'center',
                  boxShadow: [
                    '0 0 0 5px rgba(16,185,129,0.22)',
                    '0 0 28px rgba(16,185,129,0.9)',
                    '0 0 60px rgba(16,185,129,0.4)',
                    '0 0 90px rgba(16,185,129,0.18)',
                  ].join(', '),
                }}
              >
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <motion.path
                    d="M6 16 L13 23 L26 8"
                    stroke="white"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.32, ease: 'easeOut', delay: 0.34 }}
                  />
                </svg>
              </motion.div>
            </motion.div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
