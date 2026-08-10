'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, CheckSquare, Home, Users, Box, Wrench, Truck, Settings, FileText, Layers, ChevronDown, LogOut, Star, Phone, Tags, Shield, Car, Palmtree, Palette, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { Button } from '../../components/ProductUI';

type MenuItem = {
  icon: any;
  label: string;
  href?: string;
  requiredPermission?: string;
  children?: MenuItem[];
};

// Mapowanie linków do wymaganych uprawnień (ACL z permissions.enum.ts)
const menuConfig: MenuItem[] = [
  { icon: Home, label: 'Kokpit', href: '/dashboard' },
  { icon: CheckSquare, label: 'Zadania', href: '/dashboard/tasks' },
  { icon: Calendar, label: 'Kalendarz', href: '/dashboard/calendar' },
  { icon: Star, label: 'Wydarzenia', requiredPermission: 'events:view', children: [
    { label: 'Lista wydarzeń', href: '/dashboard/events', icon: Star },
    { label: 'Wypożyczenia', href: '/dashboard/rentals', icon: Truck },
    { label: 'Urlopy', href: '/dashboard/leaves', icon: Palmtree },
  ]},
  { icon: Users, label: 'Kontrahenci', requiredPermission: 'crm:view', children: [
    { label: 'Lista kontrahentów', href: '/dashboard/crm', icon: Users },
    { label: 'Kontakty', href: '/dashboard/crm/contacts', icon: Phone },
  ]},
  { icon: Box, label: 'Magazyn', requiredPermission: 'warehouse:view', children: [
    { label: 'Magazyn wewnętrzny', href: '/dashboard/warehouse', icon: Box },
    { label: 'Ceny', href: '/dashboard/warehouse/pricing', icon: Tags, requiredPermission: 'warehouse:manage' }, // Granularność: widoczne tylko dla uprzywilejowanych
    { label: 'Wydania i przyjęcia', href: '/dashboard/warehouse/receiving', icon: Truck },
    { label: 'Niezwrócony sprzęt', href: '/dashboard/warehouse/unreturned', icon: Truck },
    { label: 'Modele', href: '/dashboard/warehouse/models', icon: Box },
    { label: 'Egzemplarze', href: '/dashboard/warehouse/items', icon: Box },
    { label: 'Opakowania', href: '/dashboard/warehouse/packages', icon: Box },
    { label: 'Pakiety Ofertowe', href: '/dashboard/warehouse/bundles', icon: Layers },
    { label: 'Kategorie', href: '/dashboard/warehouse/categories', icon: Tags },
  ]},
  { icon: Wrench, label: 'Serwis', requiredPermission: 'service:view', children: [
    { label: 'Zgłoszenia', href: '/dashboard/service', icon: Wrench },
    { label: 'Statusy serwisowe', href: '/dashboard/service/statuses', icon: Tags, requiredPermission: 'settings:view' }, // Ukryte dla zwykłych serwisantów
  ]},
  { icon: Truck, label: 'Flota', requiredPermission: 'fleet:view', children: [
    { label: 'Pojazdy', href: '/dashboard/fleet', icon: Car },
  ]},
  { icon: FileText, label: 'Oferty', requiredPermission: 'offers:view', href: '/dashboard/offers' },
  { icon: Settings, label: 'Ustawienia', requiredPermission: 'settings:view', children: [
    { label: 'Personalizacja systemu', href: '/dashboard/settings', icon: Settings },
    { label: 'Typy wydarzeń', href: '/dashboard/settings/event-types', icon: Palette },
    { label: 'Statusy operacyjne', href: '/dashboard/settings/statuses', icon: Tags },
    { label: 'Role i Uprawnienia', href: '/dashboard/settings/permissions', icon: Shield, requiredPermission: 'users:manage' }, 
  ]},
  { icon: Users, label: 'Użytkownicy', requiredPermission: 'users:manage', href: '/dashboard/users' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({ Magazyn: true, Wydarzenia: true });
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const displayName = useMemo(() => {
    const u: any = user || {};
    return [u.imie, u.nazwisko].filter(Boolean).join(' ') || u.name || u.email || 'Zalogowany użytkownik';
  }, [user]);

  const role = useMemo(() => {
    const u: any = user || {};
    return u.rola?.nazwa || u.role || u.rola || u.role_name || 'Użytkownik';
  }, [user]);

  useEffect(() => { setIsMounted(true); if (!user) router.push('/login'); }, [user, router]);

  if (!isMounted || !user) return <div className="h-screen bg-slate-50" />;

  const isPdfOrPrintPage = pathname?.includes('/pdf') || pathname?.includes('/labels');
  if (isPdfOrPrintPage) {
    return <div className="min-h-screen bg-white text-slate-900 print:bg-white">{children}</div>;
  }

  // GLOBALNY SYSTEM KONTROLI DOSTĘPU (ACL GUARD)
  const userPermissions = user?.permissions || [];
  
  const hasPermission = (reqPerm?: string) => {
    if (!reqPerm) return true; // Brak wymagań = dostępny dla każdego
    return userPermissions.includes(reqPerm);
  };

  // 1. Dynamiczne filtrowanie zakładek w Menu (kaskadowo)
  const visibleMenu = menuConfig
    .map((item) => {
      if (item.children) {
        // Filtrujemy dzieci - jeśli dziecko nie ma swojego uprawnienia, dziedziczy z rodzica.
        const filteredChildren = item.children.filter((sub) => 
          hasPermission(sub.requiredPermission || item.requiredPermission)
        );
        return { ...item, children: filteredChildren };
      }
      return item;
    })
    .filter((item) => {
      // Ukrywamy rodzica, jeśli ma bezpośredni zakaz
      if (!hasPermission(item.requiredPermission)) return false;
      // Ukrywamy foldery, w których wszystkie dzieci zostały zablokowane
      if (item.children && item.children.length === 0) return false;
      return true;
    });

  // 2. Blokada routingu (Tarcza)
  const getRequiredPermissionForPath = (path: string) => {
    // A. Wyjątki dla pod-zakładek z granularnymi uprawnieniami
    if (path.startsWith('/dashboard/settings/permissions')) return 'users:manage';
    if (path.startsWith('/dashboard/service/statuses')) return 'settings:view';
    if (path.startsWith('/dashboard/warehouse/pricing')) return 'warehouse:manage';

    // B. Główne ścieżki
    if (path.startsWith('/dashboard/events') || path.startsWith('/dashboard/rentals') || path.startsWith('/dashboard/leaves')) return 'events:view';
    if (path.startsWith('/dashboard/crm')) return 'crm:view';
    if (path.startsWith('/dashboard/warehouse')) return 'warehouse:view';
    if (path.startsWith('/dashboard/service')) return 'service:view';
    if (path.startsWith('/dashboard/fleet')) return 'fleet:view';
    if (path.startsWith('/dashboard/offers')) return 'offers:view';
    if (path.startsWith('/dashboard/settings')) return 'settings:view';
    if (path.startsWith('/dashboard/users')) return 'users:manage';
    
    return null; // Główny Kokpit, Kalendarz, Zadania - dostępne dla wszystkich
  };

  const isAllowedToAccessCurrentRoute = hasPermission(getRequiredPermissionForPath(pathname));

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 w-[292px] overflow-y-auto bg-[#082429] p-4 text-slate-300 shadow-2xl custom-scrollbar">
        <div className="mb-3 rounded-2xl bg-white/5 p-4">
          <Image src="/eventflow-logo-sidebar.svg" alt="EventFlow" width={220} height={60} priority />
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">Zalogowany jako</p>
            <p className="mt-1 truncate text-sm font-black text-white">{displayName}</p>
            <p className="truncate text-xs font-bold text-slate-400">{role}</p>
          </div>
        </div>
        <nav className="space-y-1">
          {visibleMenu.map((item) => {
            const Icon = item.icon;
            const active = item.href === pathname || item.children?.some((c) => c.href === pathname);
            return <div key={item.label}>
              <button onClick={() => item.children ? setOpenMenus((p) => ({...p, [item.label]: !p[item.label]})) : router.push(item.href!)} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-black transition ${active ? 'bg-cyan-500 text-white' : 'hover:bg-white/5'}`}>
                <span className="flex items-center gap-3"><Icon size={18}/>{item.label}</span>{item.children && <ChevronDown size={15} className={openMenus[item.label] ? 'rotate-180' : ''}/>} 
              </button>
              {item.children && openMenus[item.label] && <div className="mt-1 space-y-1 pl-5">
                {item.children.map((sub) => { const SIcon = sub.icon; const subActive = sub.href === pathname; return <Link key={sub.href} href={sub.href!} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${subActive ? 'bg-white/10 text-cyan-200' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><SIcon size={14}/>{sub.label}</Link>; })}
              </div>}
            </div>;
          })}
        </nav>
        <button onClick={() => { logout(); router.push('/login'); }} className="mt-6 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm font-black text-slate-400 hover:bg-white/5 hover:text-white"><LogOut size={16}/>Wyloguj</button>
      </aside>

      <main className="ml-[292px] min-h-screen flex-1 p-8">
        {!isAllowedToAccessCurrentRoute ? (
          <div className="flex flex-col items-center justify-center h-[70vh] text-center animate-fade-in-up">
             <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-sm border border-rose-200">
               <ShieldAlert size={48} strokeWidth={2.5}/>
             </div>
             <h2 className="text-3xl font-black text-slate-900 mb-3">Dostęp zabroniony</h2>
             <p className="text-base font-bold text-slate-500 max-w-md mb-8 leading-relaxed">
               Twoje konto, nałożone blokady lub przypisana rola nie posiada wystarczających uprawnień, aby uzyskać dostęp do tego modułu. Jeśli to błąd, skontaktuj się z administratorem.
             </p>
             <Button onClick={() => router.push('/dashboard')}>Wróć na Bezpieczny Kokpit</Button>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}