'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { Sun, Moon } from 'lucide-react'; // Dodany import ikon

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Stan dla trybu Dark/Light Mode
  const [isDark, setIsDark] = useState(true); 
  
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        passwordRaw: password,
      });

      setAuth(response.data.access_token, response.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Wystąpił błąd podczas logowania.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Główny wrapper narzucający motyw
    <div className={`${isDark ? 'dark' : ''}`}>
      <div className="relative flex min-h-screen items-center justify-center bg-slate-50 transition-colors duration-500 dark:bg-slate-950">
        
        {/* Tło - Delikatne gradienty w stylu nowoczesnych systemów OS */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
           <div className="absolute -top-1/4 -left-1/4 h-[800px] w-[800px] rounded-full bg-blue-500/10 blur-[120px] transition-opacity dark:bg-blue-600/20"></div>
           <div className="absolute -bottom-1/4 -right-1/4 h-[800px] w-[800px] rounded-full bg-cyan-500/10 blur-[120px] transition-opacity dark:bg-indigo-600/20"></div>
        </div>

        {/* Przełącznik motywu w prawym górnym rogu */}
        <button 
          onClick={() => setIsDark(!isDark)} 
          className="absolute top-8 right-8 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white/50 text-slate-500 shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-white hover:text-slate-900 dark:bg-slate-900/50 dark:text-slate-400 dark:border dark:border-white/5 dark:hover:bg-slate-800 dark:hover:text-amber-400"
          title="Przełącz motyw"
        >
          {isDark ? <Sun size={22} /> : <Moon size={22} />}
        </button>

        {/* Karta Glassmorphism z formularzem */}
        <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white/60 p-10 shadow-2xl backdrop-blur-xl transition-all duration-300 dark:border-white/10 dark:bg-slate-900/60">
          
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Event<span className="text-blue-500">Flow</span>
            </h1>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Wprowadź swoje dane, aby uzyskać dostęp
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block pl-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Adres e-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white/50 p-3.5 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-500/50 dark:focus:bg-black/40"
                placeholder="kontakt@nowafirma.pl"
              />
            </div>

            <div>
              <label className="block pl-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Hasło
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 block w-full rounded-xl border border-slate-200 bg-white/50 p-3.5 text-slate-900 placeholder-slate-400 shadow-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 dark:border-white/10 dark:bg-black/20 dark:text-white dark:placeholder-slate-500 dark:focus:border-blue-500/50 dark:focus:bg-black/40"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 w-full rounded-xl bg-blue-600 p-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50 dark:shadow-none"
            >
              {isLoading ? 'Uwierzytelnianie...' : 'Zaloguj się do systemu'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}