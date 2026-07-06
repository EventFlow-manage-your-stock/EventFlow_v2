'use client';

import { useState, useEffect } from 'react'; 
import { 
  Home, CheckSquare, Calendar, CalendarClock, Star, Users, MapPin, 
  Globe, Box, Wrench, UsersRound, Truck, Settings, ChevronDown, 
  Search, Bell, LogOut, Menu, Plus, Moon, Sun, CalendarDays, FileText, 
  AlertTriangle, BarChart3, FileCheck, DollarSign, History, Briefcase, HelpCircle,
  ArrowRight, ArrowLeft, Monitor, Plug, Layers, Paperclip, Server
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useRouter, usePathname } from 'next/navigation';

// Rozbudowana konfiguracja menu, wspierająca obiekty w subItems
const menuConfig = [
  { icon: Home, label: 'Kokpit', isExpandable: false, href: '/dashboard' },
  { icon: CheckSquare, label: 'Zadania', badge: '0', isExpandable: false },
  { icon: Calendar, label: 'Kalendarz', isExpandable: false, href: '/dashboard/calendar' },
  { icon: CalendarClock, label: 'Plan dnia', isExpandable: false },
  { 
    icon: Star, label: 'Wydarzenia', isExpandable: true, 
    subItems: [
      { label: 'Wydarzenia' }, { label: 'Grupy sprzętowe' }, { label: 'Spotkania' }, 
      { label: 'Wydarzenia prywatne' }, { label: 'Wypożyczenia' }, { label: 'Urlopy' }
    ] 
  },
  { 
    icon: Users, label: 'Kontrahenci', isExpandable: true, 
    subItems: [{ label: 'Lista kontrahentów' }, { label: 'Grupy' }] 
  },
  { 
    icon: MapPin, label: 'Miejsca', isExpandable: true, 
    subItems: [{ label: 'Baza miejsc' }] 
  },
  { 
    icon: Globe, label: 'Event Network', badge: '0', isExpandable: true, 
    subItems: [{ label: 'Sieć' }, { label: 'Udostępnione' }] 
  },
  { 
    icon: Box, label: 'Magazyn', isExpandable: true, 
    subItems: [
      { label: 'Magazyn wewnętrzny', href: '/dashboard/warehouse', icon: Home },
      { label: 'Magazyn dostawców', icon: Globe },
      { label: 'Ceny', icon: DollarSign },
      { label: 'Wydanie z magazynu', icon: ArrowRight },
      { label: 'Przyjęcie do magazynu', icon: ArrowLeft },
      { label: 'Niezwrócony sprzęt', icon: ArrowRight },
      { label: 'Modele', icon: Monitor },
      { label: 'Egzemplarze', icon: Plug },
      { label: 'Opakowania', href: '/dashboard/warehouse/packages', icon: Box },
      { label: 'Typy opakowań', icon: Box },
      { label: 'Zestawy', icon: Layers },
      { label: 'Kategorie', icon: ListIcon },
      { label: 'Załączniki modeli', icon: Paperclip },
      { label: 'Baza sprzętu', icon: Server },
    ] 
  },
  { icon: Wrench, label: 'Serwis', badge: '1', isExpandable: true, subItems: [{label: 'W naprawie'}, {label: 'Zlecenia'}] },
  { icon: UsersRound, label: 'Użytkownicy', isExpandable: true, subItems: [{label: 'Lista'}, {label: 'Uprawnienia'}] },
  { icon: Truck, label: 'Flota', isExpandable: true, subItems: [{label: 'Pojazdy'}, {label: 'Rezerwacje'}] },
  { icon: Settings, label: 'Ustawienia', isExpandable: true, subItems: [{label: 'Ogólne'}, {label: 'Słowniki'}] },
  { icon: CalendarDays, label: 'Planowanie', isExpandable: true, subItems: [{label: 'Harmonogram'}] },
  { icon: FileText, label: 'Oferty', isExpandable: false },
  { icon: AlertTriangle, label: 'Wypożyczenia i konflikty', badge: '0', isExpandable: false },
  { icon: BarChart3, label: 'Statystyki', isExpandable: true, subItems: [{label: 'Raporty finansowe'}, {label: 'Magazyn'}] },
  { icon: FileCheck, label: 'Rozliczenia', isExpandable: false },
  { icon: DollarSign, label: 'Finanse', isExpandable: true, subItems: [{label: 'Faktury'}, {label: 'Koszty'}] },
  { icon: History, label: 'Historia', isExpandable: true, subItems: [{label: 'Logi systemowe'}] },
  { icon: Briefcase, label: 'Toolbox', isExpandable: true, subItems: [{label: 'Narzędzia'}] },
];

// Helper icon component
function ListIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Dla dema Magazyn jest otwarty domyślnie, aby było od razu widać zmiany
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false); 
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ 'Magazyn': true });
  
  const [isMounted, setIsMounted] = useState(false);
  
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
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
    <div className={`${isDark ? 'dark' : ''}`}>
      <div className="flex h-screen bg-slate-50 text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-300">
        
        {/* SIDEBAR */}
        <aside 
          className={`${isSidebarOpen ? 'w-[280px]' : 'w-20'} 
          flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-20
          dark:bg-slate-900 dark:border-white/5 shadow-sm`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-100 dark:border-white/5">
            {isSidebarOpen && <span className="text-xl font-bold text-slate-900 dark:text-white tracking-wider">Event<span className="text-blue-500">Flow</span></span>}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 dark:text-slate-400 dark:hover:bg-white/10 transition">
              <Menu size={20} />
            </button>
          </div>

          {isSidebarOpen && (
            <div className="flex shrink-0 items-center gap-3 p-4 border-b border-slate-100 dark:border-white/5">
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
          <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            <ul className="space-y-0.5 px-3 pb-4">
              {menuConfig.map((item) => {
                const isActive = item.href === pathname;

                return (
                  <li key={item.label}>
                    <button 
                      onClick={() => {
                        if (item.isExpandable) toggleMenu(item.label);
                        if (item.href) router.push(item.href);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors 
                      ${isActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-600/10 dark:text-blue-400 font-semibold' : 'hover:bg-slate-50 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800'}`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />
                        {isSidebarOpen && <span>{item.label}</span>}
                      </div>
                      {isSidebarOpen && (
                        <div className="flex items-center gap-2">
                          {item.badge && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">{item.badge}</span>}
                          {item.isExpandable && <ChevronDown size={16} className={`transition-transform duration-200 text-slate-400 ${openMenus[item.label] ? 'rotate-180' : ''}`} />}
                        </div>
                      )}
                    </button>
                    
                    {/* Podmenu */}
                    {isSidebarOpen && item.isExpandable && openMenus[item.label] && (
                      <ul className="mt-1 mb-2 space-y-0.5 pl-4 pr-2 bg-slate-50/50 py-2 rounded-lg border border-slate-100 dark:bg-slate-800/30 dark:border-slate-800/50">
                        {item.subItems?.map((subItem: any) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = subItem.href === pathname;
                          
                          return (
                            <li key={subItem.label}>
                              <button 
                                onClick={() => subItem.href && router.push(subItem.href)}
                                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors
                                  ${isSubActive ? 'bg-blue-100 text-blue-700 font-semibold dark:bg-blue-500/20 dark:text-blue-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'}
                                `}
                              >
                                {SubIcon && <SubIcon size={14} className={isSubActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'} />}
                                {!SubIcon && <div className="w-3.5" />}
                                {subItem.label}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* GŁÓWNA ZAWARTOŚĆ */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <header className="flex h-16 shrink-0 items-center justify-between bg-white px-6 border-b border-slate-200 z-10 dark:bg-slate-900/30 dark:border-white/5">
            <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 transition focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Wpisz co najmniej 3 znaki, aby wyszukać..." 
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
              />
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsDark(!isDark)} 
                className="p-2 text-slate-500 hover:text-blue-600 transition"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="p-2 text-slate-500 hover:text-slate-900 transition"><Bell size={18} /></button>
              <button onClick={handleLogout} className="flex items-center gap-2 p-2 text-sm text-slate-500 hover:text-red-600 transition">
                <LogOut size={16} /> Wyloguj
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50 dark:bg-slate-950">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}