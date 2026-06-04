import React, { useState } from 'react';
import { Project } from '../types';
import { FolderKanban, Plus, Trash2, Moon, Sun, LayoutDashboard, LogOut, KanbanSquare } from 'lucide-react';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  theme: 'light' | 'dark';
  userEmail?: string;
  onSelectProject: (id: string) => void;
  onAddProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  onToggleTheme: () => void;
  onLogout?: () => void;
}

export function Sidebar({
  projects,
  activeProjectId,
  theme,
  userEmail,
  onSelectProject,
  onAddProject,
  onDeleteProject,
  onToggleTheme,
  onLogout
}: SidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [pressedProjectId, setPressedProjectId] = useState<string | null>(null);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onAddProject(newProjectName.trim());
      setNewProjectName('');
      setIsAdding(false);
    }
  };

  const confirmDeleteProject = () => {
    if (projectToDelete) {
      onDeleteProject(projectToDelete);
      setProjectToDelete(null);
    }
  };

  return (
    <>
      <div className="w-64 flex-shrink-0 border border-white/5 border-b-[6px] border-b-black/50 rounded-2xl bg-[#1A1A1A] shadow-[0_12px_24px_rgba(0,0,0,0.4)] flex flex-col h-full overflow-hidden">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
            <KanbanSquare size={18} className="text-white" />
          </div>
          <h1 className="text-2xl text-white leading-none tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>KanDone</h1>
        </div>

        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Current Projects</h2>
          <button
            onClick={() => setIsAdding(true)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {isAdding && (
          <form onSubmit={handleCreateProject} className="mb-4 px-2">
            <input
              type="text"
              autoFocus
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onBlur={() => !newProjectName.trim() && setIsAdding(false)}
              placeholder="Project name..."
              className="w-full bg-white/5 border border-white/10 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </form>
        )}

        <div className="space-y-3">
          {projects.map((project, index) => {
            const pressedIndex = pressedProjectId ? projects.findIndex(p => p.id === pressedProjectId) : -1;
            const isAbove = pressedIndex !== -1 && index < pressedIndex;
            return (
            <div
              key={project.id}
              style={{
                transform: isAbove ? 'translateY(-6px)' : undefined,
                transition: 'transform 0.1s ease',
              }}
              className={`group flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors border border-white/5 border-b-[6px] ${
                activeProjectId === project.id
                  ? 'bg-indigo-600 text-white border-b-indigo-900 active:border-b-0 active:translate-y-[6px] shadow-sm'
                  : 'bg-[#222] border-b-black/50 text-slate-400 hover:bg-[#2A2A2A] hover:text-white active:border-b-0 active:translate-y-[6px]'
              }`}
              onPointerDown={() => setPressedProjectId(project.id)}
              onPointerUp={() => setPressedProjectId(null)}
              onPointerLeave={() => setPressedProjectId(null)}
              onClick={() => onSelectProject(project.id)}
            >
              <div className="flex items-center gap-3 truncate">
                <div className={`w-2 h-2 rounded-full ${activeProjectId === project.id ? 'bg-white' : 'bg-slate-600'}`}></div>
                <span className="text-sm font-medium truncate">{project.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setProjectToDelete(project.id);
                }}
                className={`p-1.5 rounded-md text-white/50 hover:text-rose-300 hover:bg-white/10 transition-all ${
                  activeProjectId === project.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <Trash2 size={14} />
              </button>
            </div>
            );
          })}
        </div>
      </div>
      
      {onLogout && (
        <div className="mt-auto p-8 pt-4 flex flex-col gap-3">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 bg-[#222] border border-white/5 border-b-[6px] border-b-black/50 hover:bg-[#2A2A2A] hover:text-white active:border-b-0 active:translate-y-[6px] transition-all"
          >
            <LogOut size={16} />
            Logout
          </button>
          {userEmail && (
            <p className="text-[11px] text-zinc-500 text-center truncate px-1">{userEmail}</p>
          )}
        </div>
      )}
    </div>
    
      {/* Delete Project Confirmation Modal */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-[#222] border border-white/5 border-b-[6px] border-b-black/50 rounded-2xl p-6 shadow-none text-center">
            <h3 className="text-xl font-serif italic text-white mb-2">Delete Project</h3>
            <p className="text-slate-400 text-sm mb-8">
              Are you sure you want to delete this project? All tasks within it will be lost.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setProjectToDelete(null)}
                className="px-6 py-3 rounded-xl text-sm font-medium text-slate-300 bg-[#333] hover:bg-[#444] border-b-[4px] border-black/50 active:border-b-0 active:translate-y-[4px] hover:text-white transition-all w-full"
              >
                Keep it
              </button>
              <button
                onClick={confirmDeleteProject}
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
