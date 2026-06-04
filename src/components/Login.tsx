import React, { useState } from 'react';
import { loginWithGoogle } from '../lib/supabase';
import { KanbanSquare } from 'lucide-react';

export function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (e: any) {
      setError(e?.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-[#050505] text-slate-200">
      <div className="flex flex-col items-center gap-6 p-10 rounded-3xl border border-white/5 border-b-[6px] border-b-black/50 bg-[#1A1A1A] shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
        <img src="/favicon.svg" className="w-16 h-16" alt="KanDone logo" />
        <div className="text-center">
          <h1 className="text-3xl text-white mb-2" style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>KanDone</h1>
          <p className="text-slate-400 text-sm max-w-[250px]">Manage your projects without the hassle</p>
        </div>
        {error && (
          <p className="text-red-400 text-xs text-center max-w-[260px] bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="mt-4 px-6 py-3 rounded-xl font-medium bg-white text-black hover:bg-slate-200 transition-colors border-b-[3px] border-slate-400 active:border-b-0 active:translate-y-[3px] flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
          ) : (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          )}
          {loading ? 'Redirecting to Google...' : 'Continue with Google'}
        </button>
      </div>
    </div>
  );
}
