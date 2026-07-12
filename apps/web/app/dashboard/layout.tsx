'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, CheckSquare, Home, Users, Box, Wrench, Truck, Settings, FileText, ChevronDown, LogOut, Star, Phone, Tags, Shield, Car, Palmtree, Palette } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';

const menuConfig = [
  { icon: Home, label: 'Kokpit', href: '/dashboard' },
  { icon: CheckSquare, label: 'Zadania', href: '/dashboard/tasks' },
  { icon: Calendar, label: 'Kalendarz', href: '/dashboard/calendar' },
  { icon: Star, label: 'Wydarzenia', children: [
    { label: 'Lista wydarzeń', href: '/dashboard/events', icon: Star },
    { label: 'Wypożyczenia', href: '/dashboard/rentals', icon: Truck },
    { label: 'Urlopy', href: '/dashboard/leaves', icon: Palmtree },
  ]},
  { icon: Users, label: 'Kontrahenci', children: [
    { label: 'Lista kontrahentów', href: '/dashboard/crm', icon: Users },
    { label: 'Kontakty', href: '/dashboard/crm/contacts', icon: Phone },
  ]},
  { icon: Box, label: 'Magazyn', children: [
    { label: 'Magazyn wewnętrzny', href: '/dashboard/warehouse', icon: Box },
    { label: 'Ceny', href: '/dashboard/warehouse/pricing', icon: Tags },
    { label: 'Wydania i przyjęcia', href: '/dashboard/warehouse/receiving', icon: Truck },
    { label: 'Niezwrócony sprzęt', href: '/dashboard/warehouse/unreturned', icon: Truck },
    { label: 'Modele', href: '/dashboard/warehouse/models', icon: Box },
    { label: 'Egzemplarze', href: '/dashboard/warehouse/items', icon: Box },
    { label: 'Opakowania', href: '/dashboard/warehouse/packages', icon: Box },
    { label: 'Kategorie', href: '/dashboard/warehouse/categories', icon: Tags },
  ]},
  { icon: Wrench, label: 'Serwis', children: [
    { label: 'Zgłoszenia', href: '/dashboard/service', icon: Wrench },
    { label: 'Statusy serwisowe', href: '/dashboard/service/statuses', icon: Tags },
  ]},
  { icon: Truck, label: 'Flota', children: [
    { label: 'Pojazdy', href: '/dashboard/fleet', icon: Car },
  ]},
  { icon: FileText, label: 'Oferty', href: '/dashboard/offers' },
  { icon: Settings, label: 'Ustawienia', children: [
    { label: 'Personalizacja systemu', href: '/dashboard/settings', icon: Settings },
    { label: 'Typy wydarzeń', href: '/dashboard/settings/event-types', icon: Palette },
    { label: 'Statusy operacyjne', href: '/dashboard/settings/statuses', icon: Tags },
    { label: 'Uprawnienia', href: '/dashboard/settings/permissions', icon: Shield },
  ]},
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

  // EVENTFLOW_PRODUCT_POLISH_V42:
  // Strony PDF/druku nie mogą dziedziczyć bocznego menu dashboardu,
  // bo przeglądarka drukowała razem z dokumentem również sidebar systemu.
  const isPdfOrPrintPage = pathname?.includes('/pdf');
  if (isPdfOrPrintPage) {
    return <div className="min-h-screen bg-white text-slate-900 print:bg-white">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 w-[292px] overflow-y-auto bg-[#082429] p-4 text-slate-300 shadow-2xl">
        <div className="mb-3 rounded-2xl bg-white/5 p-4">
          <Image src="/eventflow-logo-sidebar.svg" alt="EventFlow" width={220} height={60} priority />
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/15 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/70">Zalogowany jako</p>
            <p className="mt-1 truncate text-sm font-black text-white">{displayName}</p>
            <p className="truncate text-xs font-bold text-slate-400">{role}</p>
          </div>
        </div>
        <nav className="space-y-1">
          {menuConfig.map((item) => {
            const Icon = item.icon;
            const active = item.href === pathname || item.children?.some((c) => c.href === pathname);
            return <div key={item.label}>
              <button onClick={() => item.children ? setOpenMenus((p) => ({...p, [item.label]: !p[item.label]})) : router.push(item.href!)} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm font-black transition ${active ? 'bg-cyan-500 text-white' : 'hover:bg-white/5'}`}>
                <span className="flex items-center gap-3"><Icon size={18}/>{item.label}</span>{item.children && <ChevronDown size={15} className={openMenus[item.label] ? 'rotate-180' : ''}/>} 
              </button>
              {item.children && openMenus[item.label] && <div className="mt-1 space-y-1 pl-5">
                {item.children.map((sub) => { const SIcon = sub.icon; const subActive = sub.href === pathname; return <Link key={sub.href} href={sub.href} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition ${subActive ? 'bg-white/10 text-cyan-200' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><SIcon size={14}/>{sub.label}</Link>; })}
              </div>}
            </div>;
          })}
        </nav>
        <button onClick={() => { logout(); router.push('/login'); }} className="mt-6 flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm font-black text-slate-400 hover:bg-white/5 hover:text-white"><LogOut size={16}/>Wyloguj</button>
      </aside>
      <main className="ml-[292px] min-h-screen flex-1 p-8">{children}</main>
    </div>
  );
}
