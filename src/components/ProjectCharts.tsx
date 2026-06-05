import React, { useMemo, useState, useEffect } from 'react';
import { Project, KANBAN_COLUMNS } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

interface ProjectChartsProps {
  project: Project;
  isDragging?: boolean;
}

const ISLAND_CLASS = "flex-1 overflow-hidden p-4 rounded-2xl border border-white/5 border-b-[6px] border-b-black/50 bg-[#222222] shadow-[0_8px_16px_rgba(0,0,0,0.4)] flex flex-col";

const CHART_COLORS: Record<string, string> = {
  'todo': '#2563EB',
  'working': '#FB923C',
  'done': '#10B981',
  'stuck': '#E11D48',
};

const Bar3D = (props: any) => {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;

  const borderH = 5;

  return (
    <g>
      {/* Full-height dark rect provides the bottom border (same rx so it looks seamless) */}
      <rect x={x} y={y} width={width} height={height} fill="rgba(0,0,0,0.55)" rx={4} ry={4} />
      {/* Colored face sits on top, leaving the bottom borderH exposed */}
      <rect x={x} y={y} width={width} height={Math.max(height - borderH, 0)} fill={fill} rx={4} ry={4} />
    </g>
  );
};

export function ProjectCharts({ project, isDragging }: ProjectChartsProps) {
  const [stableProject, setStableProject] = useState(project);

  useEffect(() => {
    if (!isDragging) {
      setStableProject(project);
    }
  }, [project, isDragging]);

  const data = useMemo(() => {
    const counts = stableProject.tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return KANBAN_COLUMNS.map(c => ({
      name: c.title,
      value: counts[c.id] || 0,
      color: CHART_COLORS[c.id] || '#8884d8'
    }));
  }, [stableProject.tasks]);

  const totalTasks = stableProject.tasks.length;

  return (
    <>
      <div className={ISLAND_CLASS}>
        <h3 className="text-sm font-semibold text-white mb-2 ml-2">Task Distribution</h3>
        <div className="flex-1 min-h-0 flex flex-row gap-2">
          <div className="flex flex-col justify-center gap-2.5 pl-1">
            {KANBAN_COLUMNS.map(col => (
              <div key={col.id} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[col.id] }} />
                <span className="text-[11px] text-slate-400 whitespace-nowrap">{col.title}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 relative pointer-events-none">
            {totalTasks === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">No tasks yet</div>
            ) : (
              <div className="absolute inset-0" style={{ filter: "drop-shadow(0px 8px 0px rgba(0,0,0,0.6)) drop-shadow(0px 14px 16px rgba(0,0,0,0.4))" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      dataKey="value"
                      strokeWidth={0}
                      activeShape={null}
                      style={{ outline: "none" }}
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={ISLAND_CLASS}>
        <h3 className="text-sm font-semibold text-white mb-2 ml-2">Tasks by Status</h3>
        <div className="flex-1 min-h-0 relative pointer-events-none">
          {totalTasks === 0 ? (
             <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">No tasks yet</div>
          ) : (
            <div className="absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 14, right: 16, left: -20, bottom: 12 }} barCategoryGap="30%">
                  <CartesianGrid horizontal={true} vertical={false} stroke="rgba(255,255,255,0.07)" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 12, dy: 10 }} />
                  <YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Bar
                    dataKey="value"
                    maxBarSize={38}
                    activeBar={false}
                    shape={<Bar3D />}
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
