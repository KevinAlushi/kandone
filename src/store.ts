import { useState, useEffect, useMemo } from 'react';
import { Project, Task, TaskStatus } from './types';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

const THEME_KEY = 'solo-kanban-theme';

export function useAppStore(user: User | null = null) {
  const [rawProjects, setRawProjects] = useState<any[]>([]);
  const [rawTasks, setRawTasks] = useState<any[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (!user) {
      setRawProjects([]);
      setRawTasks([]);
      setActiveProjectId(null);
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);

    const fetchData = async () => {
      const [projectsRes, tasksRes] = await Promise.all([
        supabase.from('projects').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('tasks').select('*').eq('owner_id', user.id).order('order'),
      ]);
      if (projectsRes.data) setRawProjects(projectsRes.data);
      if (tasksRes.data) setRawTasks(tasksRes.data);
      setIsLoaded(true);
    };

    fetchData();

    const projectsChannel = supabase
      .channel('projects-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'projects', filter: `owner_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') setRawProjects((prev: any[]) => prev.some((p: any) => p.id === payload.new.id) ? prev : [payload.new, ...prev]);
          else if (payload.eventType === 'UPDATE') setRawProjects((prev: any[]) => prev.map((p: any) => p.id === payload.new.id ? payload.new : p));
          else if (payload.eventType === 'DELETE') setRawProjects((prev: any[]) => prev.filter((p: any) => p.id !== payload.old.id));
        }
      )
      .subscribe();

    const tasksChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `owner_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') setRawTasks((prev: any[]) => prev.some((t: any) => t.id === payload.new.id) ? prev : [...prev, payload.new]);
          else if (payload.eventType === 'UPDATE') setRawTasks((prev: any[]) => prev.map((t: any) => t.id === payload.new.id ? payload.new : t));
          else if (payload.eventType === 'DELETE') setRawTasks((prev: any[]) => prev.filter((t: any) => t.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(projectsChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, [user]);

  const projects: Project[] = useMemo(() => {
    return rawProjects.map((p: any) => ({
      id: p.id,
      name: p.name,
      tasks: rawTasks
        .filter((t: any) => t.project_id === p.id)
        .map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          status: t.status as TaskStatus,
          createdAt: t.created_at ? new Date(t.created_at).getTime() : 0,
          order: t.order ?? 0,
        }))
        .sort((a: any, b: any) => a.order - b.order),
    }));
  }, [rawProjects, rawTasks]);

  useEffect(() => {
    setActiveProjectId((current: string | null) => {
      if (!current && projects.length > 0) return projects[0].id;
      if (current && !projects.some(p => p.id === current)) return projects.length > 0 ? projects[0].id : null;
      return current;
    });
  }, [projects]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const addProject = async (name: string) => {
    if (!user) return;
    const tempId = `temp-${Date.now()}`;
    const tempProject = { id: tempId, name, owner_id: user.id, created_at: new Date().toISOString() };
    setRawProjects((prev: any[]) => [tempProject, ...prev]);
    setActiveProjectId(tempId);

    const { data, error } = await supabase
      .from('projects')
      .insert({ name, owner_id: user.id })
      .select()
      .single();

    if (error) {
      setRawProjects((prev: any[]) => prev.filter((p: any) => p.id !== tempId));
      console.error('Error adding project:', error);
      return;
    }
    if (data) {
      setRawProjects((prev: any[]) => prev.map((p: any) => p.id === tempId ? data : p));
      setActiveProjectId((data as any).id);
    }
  };

  const deleteProject = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) console.error('Error deleting project:', error);
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  const addTask = async (title: string, status: TaskStatus = 'todo') => {
    if (!user || !activeProjectId) return;
    const tempId = `temp-${Date.now()}`;
    const tempTask = { id: tempId, title, status, project_id: activeProjectId, owner_id: user.id, created_at: new Date().toISOString(), order: Date.now() };
    setRawTasks((prev: any[]) => [...prev, tempTask]);

    const { data, error } = await supabase.from('tasks').insert({
      title, status, project_id: activeProjectId, owner_id: user.id, order: Date.now(),
    }).select().single();

    if (error) {
      setRawTasks((prev: any[]) => prev.filter((t: any) => t.id !== tempId));
      console.error('Error adding task:', error);
      return;
    }
    if (data) setRawTasks((prev: any[]) => prev.map((t: any) => t.id === tempId ? data : t));
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) return;
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', taskId);
    if (error) console.error('Error updating task:', error);
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    if (error) console.error('Error deleting task:', error);
  };

  const reorderTasks = (projectId: string, newTasks: Task[]) => {
    setRawTasks(prev => {
      const others = prev.filter(t => t.project_id !== projectId);
      const updated = newTasks.map((nt, index) => {
        const existing = prev.find(t => t.id === nt.id);
        return { ...existing, status: nt.status, order: index };
      });
      return [...others, ...updated];
    });
  };

  const persistTaskOrders = async (tasksToUpdate: Task[]) => {
    if (!user) return;
    await Promise.all(
      tasksToUpdate.map((task, index) =>
        supabase.from('tasks').update({
          status: task.status,
          order: index,
          updated_at: new Date().toISOString(),
        }).eq('id', task.id)
      )
    );
  };

  return {
    projects,
    activeProjectId,
    activeProject,
    theme,
    isLoaded,
    isDragging,
    setIsDragging,
    setActiveProjectId,
    toggleTheme,
    addProject,
    deleteProject,
    addTask,
    updateTaskStatus,
    deleteTask,
    reorderTasks,
    persistTaskOrders,
  };
}
