'use client';

import { useState, useEffect } from 'react'; 
import { 
  Home, CheckSquare, Calendar, CalendarClock, Star, Users, MapPin, 
  Globe, Box, Wrench, UsersRound, Truck, Settings, ChevronDown, 
  Search, Bell, LogOut, Menu, Plus, Moon, Sun, CalendarDays, FileText, 
  AlertTriangle, BarChart3, FileCheck, DollarSign, History, Briefcase,
  ArrowRight, ArrowLeft, Monitor, Plug, Layers, Paperclip, Server, Building2, CheckCircle2, Coffee, Palmtree, List
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';

// Istniejąca konfiguracja menu (nietknięta)
const menuConfig = [
  { icon: Home, label: 'Kokpit', isExpandable: false, href: '/dashboard' },
  { icon: CheckSquare, label: 'Zadania', badge: '0', isExpandable: false, href: '/dashboard/tasks' },
  { icon: Calendar, label: 'Kalendarz', isExpandable: false, href: '/dashboard/calendar' },
  { icon: CalendarClock, label: 'Plan dnia', isExpandable: false },
  { 
    icon: Star, label: 'Wydarzenia', isExpandable: true, 
    subItems: [
      { label: 'Wydarzenia', href: '/dashboard/events', icon: Star },
      { label: 'Grupy sprzętowe', icon: Star }, 
      { label: 'Spotkania', icon: Coffee }, 
      { label: 'Wydarzenia prywatne', icon: Star }, 
      { label: 'Wypożyczenia', icon: List }, 
      { label: 'Urlopy', icon: Palmtree }
    ] 
  },
  { 
    icon: Users, label: 'Kontrahenci', isExpandable: true, 
    subItems: 
    [
      { label: 'Lista kontrahentów', href: '/dashboard/crm', icon: Users }, 
      { label: 'Grupy' }
    ] 
  },
  { 
    icon: MapPin, label: 'Miejsca', isExpandable: true, 
    subItems: [{ label: 'Baza miejsc' }] 
  },
  // { 
  //   icon: Globe, label: 'Event Network', badge: '0', isExpandable: true, 
  //   subItems: [{ label: 'Sieć' }, { label: 'Udostępnione' }] 
  // },
  { 
    icon: Box, label: 'Magazyn', isExpandable: true, 
    subItems: [
      { label: 'Magazyn wewnętrzny', icon: Home, href: '/dashboard/warehouse' },
      { label: 'Magazyn dostawców', icon: Globe },
      { label: 'Ceny', icon: DollarSign, href: '/dashboard/warehouse/pricing' },
      { label: 'Wydanie z magazynu', icon: ArrowRight },
      { label: 'Przyjęcie do magazynu', icon: ArrowLeft },
      { label: 'Niezwrócony sprzęt', icon: ArrowRight },
      { label: 'Modele', icon: Monitor, href: '/dashboard/warehouse/models' },
      { label: 'Egzemplarze', icon: Plug, href: '/dashboard/warehouse/items' },
      { label: 'Opakowania', icon: Box, href: '/dashboard/warehouse/packages' },
      { label: 'Typy opakowań', icon: Box },
      { label: 'Zestawy', icon: Layers },
      { label: 'Kategorie', icon: ListIcon },
      { label: 'Załączniki modeli', icon: Paperclip },
      { label: 'Baza sprzętu', icon: Server },
    ] 
  },
  { 
    icon: Wrench, label: 'Serwis', badge: '1', isExpandable: true, 
    subItems: 
      [
        {label: 'W naprawie', href: '/dashboard/service', icon: Wrench}, 
        {label: 'Statusy serwisowe', icon: CheckCircle2},
      ] 
  },
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
  // { icon: Briefcase, label: 'Toolbox', isExpandable: true, subItems: [{label: 'Narzędzia'}] },
];

function ListIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false); 
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ 'Magazyn': false });
  const [isMounted, setIsMounted] = useState(false);
  
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    if (!user) router.push('/login');
  }, [user, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  if (!isMounted || !user) return <div className="h-screen w-screen bg-[#F4F7F9]"></div>;

  return (
    <div className={`${isDark ? 'dark' : ''}`}>
      <div className="flex h-screen bg-[#F4F7F9] text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-300 font-sans">
        
        {/* SIDEBAR - Ciemny motyw z projektu */}
        <aside 
          className={`${isSidebarOpen ? 'w-[260px]' : 'w-20'} 
          flex flex-col bg-[#11282D] text-slate-300 transition-all duration-300 z-20 shadow-xl`}
        >
          {/* Logo Section */}
          <div className="flex h-20 shrink-0 items-center justify-between px-6 border-b border-white/5">
            {isSidebarOpen ? (
              // Tu załaduje się logo z pliku /public/logo-light.svg
              <div className="flex items-center gap-2">
                 {/* Zastąp ten div własnym <Image src="/logo-light.svg" alt="EventFlow" width={140} height={40} /> */}
                 <Image src="/eventflow_logo_dark.svg" alt="EventFlow" width={270} height={100} />
              </div>
            ) : (
              <Image src="/eventflow_mark.svg" alt="EventFlow" width={60} height={40} />
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 overflow-y-auto py-6 custom-scrollbar-dark">
            <ul className="space-y-1.5 px-4">
              {menuConfig.map((item) => {
                const isActive = item.href === pathname || (item.isExpandable && item.subItems?.some(s => s.href === pathname));

                return (
                  <li key={item.label}>
                    <button 
                      onClick={() => {
                        if (item.isExpandable) toggleMenu(item.label);
                        if (item.href) router.push(item.href);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-[13px] transition-all duration-200 
                      ${isActive ? 'bg-[#00B5B5] text-white font-bold shadow-md shadow-teal-900/20' : 'hover:bg-white/5 text-slate-400 hover:text-white font-medium'}`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                        {isSidebarOpen && <span>{item.label}</span>}
                      </div>
                      {isSidebarOpen && (
                        <div className="flex items-center gap-2">
                          {item.badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'}`}>{item.badge}</span>}
                          {item.isExpandable && <ChevronDown size={14} className={`transition-transform duration-200 opacity-70 ${openMenus[item.label] ? 'rotate-180' : ''}`} />}
                        </div>
                      )}
                    </button>
                    
                    {/* Podmenu */}
                    {isSidebarOpen && item.isExpandable && openMenus[item.label] && (
                      <ul className="mt-1.5 mb-3 space-y-1 pl-4 pr-1">
                        {item.subItems?.map((subItem: any) => {
                          const SubIcon = subItem.icon;
                          const isSubActive = subItem.href === pathname;
                          
                          return (
                            <li key={subItem.label}>
                              <button 
                                onClick={() => subItem.href && router.push(subItem.href)}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors
                                  ${isSubActive ? 'text-[#00B5B5] font-bold bg-white/5' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
                                `}
                              >
                                {SubIcon && <SubIcon size={14} className={isSubActive ? 'text-[#00B5B5]' : 'text-slate-500'} />}
                                {!SubIcon && <div className="w-[14px]" />}
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

          {/* User Profile at bottom */}
          {isSidebarOpen && (
            <div className="shrink-0 p-4 border-t border-white/5 bg-[#0D1F23]">
              <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition cursor-pointer border border-white/5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#00B5B5] to-teal-400 font-bold text-white shadow-md">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex flex-col overflow-hidden flex-1">
                  <span className="truncate text-xs font-bold text-white">{user?.email || 'Użytkownik'}</span>
                  <span className="text-[10px] text-slate-400 truncate flex items-center gap-1"><Building2 size={10}/> {user?.role || 'Firma sp z.o.o.'}</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* GŁÓWNA ZAWARTOŚĆ */}
        <main className="flex flex-1 flex-col overflow-hidden">
          
          {/* HEADER GÓRNY */}
          <header className="flex h-20 shrink-0 items-center justify-between bg-transparent px-8 z-10">
            <div className="flex items-center gap-4 w-full max-w-xl">
               <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-full hover:bg-white text-slate-500 shadow-sm bg-white/50 backdrop-blur-sm transition border border-slate-200/50">
                <Menu size={18} />
              </button>
              <div className="flex w-full items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-sm transition focus-within:border-[#00B5B5] focus-within:ring-1 focus-within:ring-[#00B5B5]">
                <Search size={18} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Szukaj eventu, sprzętu, kontrahenta, oferty..." 
                  className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none font-medium"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setIsDark(!isDark)} className="p-2.5 rounded-full text-slate-500 hover:text-[#00B5B5] hover:bg-white shadow-sm bg-white/50 border border-slate-200/50 transition">
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className="relative p-2.5 rounded-full text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm bg-white/50 border border-slate-200/50 transition">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="w-px h-8 bg-slate-200 mx-1"></div>
              <button className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-600 hover:text-[#00B5B5] shadow-sm transition">
                <Plus size={20} />
              </button>
              <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#11282D] text-white text-sm font-bold shadow-md hover:bg-slate-800 transition">
                Wyloguj
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}