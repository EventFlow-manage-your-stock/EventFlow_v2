'use client';

import { useState, useEffect } from 'react';
import { 
  Home, CheckSquare, Calendar, CalendarClock, Star, Users, MapPin, 
  Globe, Box, Wrench, UsersRound, Truck, Settings, ChevronDown, 
  Search, Bell, LogOut, Menu, Plus, Moon, Sun, CalendarDays, FileText, 
  AlertTriangle, BarChart3, FileCheck, DollarSign, History, Briefcase, HelpCircle
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useRouter } from 'next/navigation';

// Konfiguracja pełnego menu ze zrzutów ekranu
const menuConfig = [
  { icon: Home, label: 'Kokpit', isExpandable: false },
  { icon: CheckSquare, label: 'Zadania', badge: '0', isExpandable: false },
  { icon: Calendar, label: 'Kalendarz', isExpandable: false },
  { icon: CalendarClock, label: 'Plan dnia', isExpandable: false },
  { 
    icon: Star, label: 'Wydarzenia', isExpandable: true, 
    subItems: ['Wydarzenia', 'Grupy sprzętowe', 'Spotkania', 'Wydarzenia prywatne', 'Wypożyczenia', 'Urlopy'] 
  },
  { icon: Users, label: 'Kontrahenci', isExpandable: true, subItems: ['Lista kontrahentów', 'Grupy'] },
  { icon: MapPin, label: 'Miejsca', isExpandable: true, subItems: ['Baza miejsc'] },
  { icon: Globe, label: 'Event Network', badge: '0', isExpandable: true, subItems: ['Sieć', 'Udostępnione'] },
  { icon: Box, label: 'Magazyn', isExpandable: true, subItems: ['Stan magazynowy', 'Ruchy', 'Inwentaryzacja'] },
  { icon: Wrench, label: 'Serwis', badge: '1', isExpandable: true, subItems: ['W naprawie', 'Zlecenia'] },
  { icon: UsersRound, label: 'Użytkownicy', isExpandable: true, subItems: ['Lista', 'Uprawnienia'] },
  { icon: Truck, label: 'Flota', isExpandable: true, subItems: ['Pojazdy', 'Rezerwacje'] },
  { icon: Settings, label: 'Ustawienia', isExpandable: true, subItems: ['Ogólne', 'Słowniki'] },
  { icon: CalendarDays, label: 'Planowanie', isExpandable: true, subItems: ['Harmonogram'] },
  { icon: FileText, label: 'Oferty', isExpandable: false },
  { icon: AlertTriangle, label: 'Wypożyczenia i konflikty', badge: '0', isExpandable: false },
  { icon: BarChart3, label: 'Statystyki', isExpandable: true, subItems: ['Raporty finansowe', 'Magazyn'] },
  { icon: FileCheck, label: 'Rozliczenia', isExpandable: false },
  { icon: DollarSign, label: 'Finanse', isExpandable: true, subItems: ['Faktury', 'Koszty'] },
  { icon: History, label: 'Historia', isExpandable: true, subItems: ['Logi systemowe'] },
  { icon: Briefcase, label: 'Toolbox', isExpandable: true, subItems: ['Narzędzia'] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(true); // Stan Dark/Light mode
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Wydarzenia': true // Domyślnie otwarte, żeby pokazać działanie
  });
  
  const [isMounted, setIsMounted] = useState(false);

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    // Jeśli po załadowaniu nie ma użytkownika, wyrzucamy go do logowania
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  if (!isMounted || !user) {
    return <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950"></div>;
  }

  return (
    // Główny wrapper narzucający motyw (klasa .dark aktywuje ciemne warianty Tailwind)
    <div className={`${isDark ? 'dark' : ''}`}>
      <div className="flex h-screen bg-slate-50 text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-300">
        
        {/* SIDEBAR */}
        <aside 
          className={`${isSidebarOpen ? 'w-64' : 'w-20'} 
          flex flex-col bg-white/70 border-r border-slate-200 backdrop-blur-xl transition-all duration-300 z-20
          dark:bg-slate-900/50 dark:border-white/5`}
        >
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-200 dark:border-white/5">
            {isSidebarOpen && <span className="text-xl font-bold text-slate-900 dark:text-white tracking-wider">Event<span className="text-blue-500">Flow</span></span>}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-slate-200/50 text-slate-600 dark:text-slate-400 dark:hover:bg-white/10 transition">
              <Menu size={20} />
            </button>
          </div>

          {/* User Snippet */}
          {isSidebarOpen && (
            <div className="flex shrink-0 items-center gap-3 p-4 border-b border-slate-200 dark:border-white/5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-md">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.email}</span>
                <span className="text-xs text-slate-500">{user?.role}</span>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            <ul className="space-y-1 px-2 pb-4">
              {menuConfig.map((item) => (
                <li key={item.label}>
                  <button 
                    onClick={() => item.isExpandable ? toggleMenu(item.label) : null}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors 
                    ${item.label === 'Kokpit' ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400' : 'hover:bg-slate-100 text-slate-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'}`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className={item.label === 'Wydarzenia' ? 'text-blue-500' : ''} />
                      {isSidebarOpen && <span>{item.label}</span>}
                    </div>
                    {isSidebarOpen && (
                      <div className="flex items-center gap-2">
                        {item.badge && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-white/5">{item.badge}</span>}
                        {item.isExpandable && <ChevronDown size={16} className={`transition-transform duration-200 ${openMenus[item.label] ? 'rotate-180' : ''}`} />}
                      </div>
                    )}
                  </button>
                  
                  {/* Podmenu */}
                  {isSidebarOpen && item.isExpandable && openMenus[item.label] && (
                    <ul className="mt-1 space-y-1 pl-9 pr-2">
                      {item.subItems?.map(subItem => (
                        <li key={subItem}>
                          <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white">
                            {subItem}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Instrukcja na dole sidebar'a */}
          {isSidebarOpen && (
            <div className="shrink-0 p-4 border-t border-slate-200 dark:border-white/5">
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white">
                <HelpCircle size={18} />
                Instrukcja
              </button>
            </div>
          )}
        </aside>

        {/* GŁÓWNA ZAWARTOŚĆ */}
        <main className="flex flex-1 flex-col overflow-hidden">
          
          {/* TOPBAR */}
          <header className="flex h-16 shrink-0 items-center justify-between bg-white/50 px-6 backdrop-blur-md border-b border-slate-200 z-10 dark:bg-slate-900/30 dark:border-white/5">
            {/* Wyszukiwarka */}
            <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 shadow-sm transition focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 dark:border-white/10 dark:bg-black/20 dark:shadow-inner dark:focus-within:border-blue-500/50">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Wpisz co najmniej 3 znaki, aby wyszukać..." 
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none dark:text-white dark:placeholder-slate-500"
              />
            </div>

            {/* Akcje górne */}
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-200 dark:bg-green-500/10 dark:text-green-400 dark:hover:bg-green-500/20">
                <Plus size={16} /> Zobacz jak działa
              </button>
              
              {/* Przełącznik motywu */}
              <button 
                onClick={() => setIsDark(!isDark)} 
                className="p-2 text-slate-500 hover:text-blue-600 transition dark:text-slate-400 dark:hover:text-amber-400"
                title="Zmień motyw"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              
              <button className="p-2 text-slate-500 hover:text-slate-900 transition dark:text-slate-400 dark:hover:text-white"><Bell size={18} /></button>
              <button onClick={handleLogout} className="flex items-center gap-2 p-2 text-sm text-slate-500 hover:text-red-600 transition dark:text-slate-400 dark:hover:text-red-400">
                <LogOut size={16} /> Wyloguj
              </button>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
            {/* Opcjonalny delikatny gradient w tle wzmacniający efekt szkła */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none" />
            <div className="relative z-10 h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}