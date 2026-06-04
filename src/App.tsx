import React, { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { Sidebar } from './components/Sidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { ProjectCharts } from './components/ProjectCharts';
import { Login } from './components/Login';
import { supabase, logout } from './lib/supabase';
import { User } from '@supabase/supabase-js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const store = useAppStore(user);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoaded(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!authLoaded || !store.isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-[#050505]">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex gap-3 p-3 h-screen w-full bg-[#050505] text-slate-200 font-sans overflow-hidden">
      <Sidebar
        projects={store.projects}
        activeProjectId={store.activeProjectId}
        theme={store.theme}
        userEmail={user.email ?? undefined}
        onSelectProject={store.setActiveProjectId}
        onAddProject={store.addProject}
        onDeleteProject={store.deleteProject}
        onToggleTheme={store.toggleTheme}
        onLogout={logout}
      />
      <main className="flex-1 flex flex-col gap-3 min-w-0">
        {store.activeProject ? (
          <>
            <header className="px-8 h-20 rounded-2xl border border-white/5 border-b-[6px] border-b-black/50 bg-[#1A1A1A] shadow-[0_12px_24px_rgba(0,0,0,0.4)] flex items-center justify-center shrink-0">
              <h2 className="text-2xl font-serif italic text-white leading-none">
                Project Board
              </h2>
            </header>
            <div className="flex-1 overflow-hidden p-6 rounded-2xl border border-white/5 border-b-[6px] border-b-black/50 bg-[#1A1A1A] shadow-[0_12px_24px_rgba(0,0,0,0.4)] flex flex-col gap-6">
              <div className="flex-1 overflow-hidden min-h-0">
                <KanbanBoard
                  project={store.activeProject}
                  onUpdateTaskStatus={store.updateTaskStatus}
                  onDeleteTask={store.deleteTask}
                  onAddTask={store.addTask}
                  onReorderTasks={store.reorderTasks}
                  onDragStateChange={store.setIsDragging}
                  onPersistTaskOrders={store.persistTaskOrders}
                />
              </div>
              <div className="h-64 shrink-0 flex gap-6 min-h-0">
                <ProjectCharts project={store.activeProject} isDragging={store.isDragging} />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 rounded-2xl border border-white/5 border-b-[6px] border-b-black/50 bg-[#1A1A1A] shadow-[0_12px_24px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center text-slate-500">
            <p className="text-lg font-medium">No project selected</p>
            <p className="text-sm mt-1">Select a project from the sidebar or create a new one.</p>
          </div>
        )}
      </main>
    </div>
  );
}
