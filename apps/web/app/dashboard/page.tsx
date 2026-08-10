'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Wrench, Loader2, Settings, LayoutGrid, 
  Truck, FileText, CheckSquare, Plus, AlertCircle, Clock,
  Box, Activity, Minus, Zap, Sparkles, TrendingUp,
  CreditCard, ArchiveRestore, ArrowRight, Flag, Filter, Car, ChevronRight, ChevronDown, Search, User, Users, Bell, MessageSquare, File, FilePlus, FileMinus, FileCheck, FileX, FileLock, FileWarning
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button } from '../../components/ProductUI';
import { QuickAddCalendarModal } from '../../components/QuickAddCalendarModal';
import { SimpleModal } from '../../components/SimpleModal';
import { useAuthStore } from '../../store/auth.store';

// ============================================================================
// POMOCNICZE FUNKCJE
// ============================================================================
const formatMoney = (val: any) => `${Number(val || 0).toLocaleString('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} zł`;

const formatTaskTime = (dateStr: string) => {
  if (!dateStr) return 'Brak terminu';
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  const isTomorrow = d.getDate() === tomorrow.getDate() && d.getMonth() === tomorrow.getMonth() && d.getFullYear() === tomorrow.getFullYear();

  const time = d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Dzisiaj, ${time}`;
  if (isTomorrow) return `Jutro, ${time}`;
  return `${d.toLocaleDateString('pl-PL')} ${time}`;
};

// ============================================================================
// WIDGET REGISTRY (Z prawdziwymi danymi z API)
// ============================================================================

const WIDGETS: Record<string, { title: string; colSpan: string; render: (data: any, router: any) => JSX.Element }> = {
  
  // --- GRUPA: KPI ---
  'kpi-events': {
    title: 'KPI: Wydarzenia',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data, router) => (
      <div className="relative h-full flex flex-col justify-between p-6 rounded-[24px] bg-white dark:bg-[#08151a] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md cursor-pointer transition-all group overflow-hidden" onClick={() => router.push('/dashboard/events')}>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Wydarzenia</p>
            <p className="mt-1 text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{data?.kpis?.eventsThisWeek ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-blue-50 dark:bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform"><Calendar size={22} strokeWidth={2.5} /></div>
        </div>
        <p className="mt-4 text-[11px] font-bold text-slate-400 relative z-10 text-center">w tym tygodniu</p>
        
        {/* Wykres fali (Sparkline) */}
        <div className="absolute bottom-2 left-0 w-full h-16 opacity-60 pointer-events-none">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,15 C20,30 40,0 60,15 C80,30 100,10 100,10" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    )
  },
  'kpi-service': {
    title: 'KPI: Serwis',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data, router) => (
      <div className="relative h-full flex flex-col justify-between p-6 rounded-[24px] bg-white dark:bg-[#08151a] border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md cursor-pointer transition-all group overflow-hidden" onClick={() => router.push('/dashboard/service')}>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">W naprawie</p>
            <p className="mt-1 text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{data?.kpis?.activeService ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-purple-50 dark:bg-purple-500/10 p-3 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform"><Wrench size={22} strokeWidth={2.5} /></div>
        </div>
        <p className="mt-4 text-[11px] font-bold text-slate-400 relative z-10 text-center">aktywne zgłoszenia</p>

        <div className="absolute bottom-2 left-0 w-full h-16 opacity-60 pointer-events-none">
          <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,25 C30,5 50,30 70,15 C85,0 100,10 100,10" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    )
  },

  // --- GRUPA: AKCJE I KONTROLA ---
  'quick-actions': {
    title: 'Szybkie akcje',
    colSpan: 'md:col-span-2 xl:col-span-2',
    render: (data, router) => (
      <div className="h-full flex flex-col justify-center rounded-[24px] bg-white dark:bg-[#08151a] p-6 border border-slate-200 dark:border-white/5 shadow-sm">
        <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <Zap size={14} className="text-[#04e0ff]"/> Szybkie akcje
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Calendar, label: 'Wydarzenie', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', href: '/dashboard/events/new' },
            { icon: FileText, label: 'Oferta', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', href: '/dashboard/offers/new' },
            { icon: Box, label: 'Wydanie (WZ)', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', href: '/dashboard/warehouse/receiving' },
            { icon: Wrench, label: 'Serwis', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', href: '/dashboard/service/new' },
          ].map((action, i) => (
            <button key={i} onClick={() => router.push(action.href)} className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-xl ${action.bg} hover:scale-105 transition-transform duration-300 group`}>
              <action.icon size={22} className={`${action.color}`} strokeWidth={2} /> 
              <span className={`text-[11px] font-bold ${action.color}`}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  },

  // --- GRUPA: SMARTFLOW ---
  'smartflow-insights': {
    title: 'Podsumowanie Dnia',
    colSpan: 'md:col-span-2 xl:col-span-2',
    render: (data) => {
      const issues = (data?.fleetAlerts?.length || 0) + (data?.unreturned?.length || 0) + (data?.kpis?.activeService || 0);
      return (
        <div className="h-full flex flex-col justify-center rounded-[24px] bg-[#0c1328] p-7 text-white relative overflow-hidden shadow-lg border border-[#1e293b]">
          <div className="absolute inset-0 opacity-40 pointer-events-none">
            <svg viewBox="0 0 400 200" className="w-full h-full object-cover">
              <path d="M0,100 C150,200 250,0 400,100 L400,200 L0,200 Z" fill="url(#wave-gradient)" />
              <path d="M0,150 C100,50 300,250 400,50 L400,200 L0,200 Z" fill="url(#wave-gradient-2)" />
              <defs>
                <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity="0.1" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          
          <h2 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#04e0ff] flex items-center gap-2 relative z-10">
            <Activity size={14} /> Podsumowanie dnia
          </h2>
          <p className="text-[13px] font-medium leading-relaxed text-slate-300 relative z-10 max-w-sm">
            Masz dzisiaj w planie <b className="text-white">{data?.todaysEvents?.length || 0} wydarzeń</b>. Oczekuje <b className="text-white">{data?.offers?.length || 0} ofert</b> do przeprocesowania oraz <b className="text-white">{data?.eventsToInvoice?.length || 0} wydarzeń</b> do zafakturowania.<br/><br/>System wykrył <b className="text-white">{issues} alertów operacyjnych</b> (flota, serwis, zaległe zwroty).
          </p>
          <div className="mt-5 relative z-10">
            <button className="text-[11px] font-black px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors text-white flex items-center gap-2">
              Zobacz szczegóły <ArrowRight size={14}/>
            </button>
          </div>
        </div>
      );
    }
  },

  'events-today': {
    title: 'Plan na dzisiaj',
    colSpan: 'md:col-span-2 xl:col-span-2',
    render: (data, router) => (
      <div className="h-full flex flex-col p-6 rounded-[24px] bg-white dark:bg-[#08151a] border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <Calendar size={14} className="text-blue-500"/> Plan na dzisiaj
          </h2>
          <button onClick={() => router.push('/dashboard/calendar')} className="text-[10px] font-black tracking-wider text-[#04e0ff] hover:text-cyan-600 transition-colors flex items-center gap-1">
            Cały kalendarz <ArrowRight size={12}/>
          </button>
        </div>
        <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {(data?.todaysEvents || []).map((e: any) => (
            <div key={e.id} className="flex gap-4 relative group cursor-pointer" onClick={() => router.push(`/dashboard/events/${e.id}`)}>
              {/* Oś czasu */}
              <div className="flex flex-col items-center">
                <div className="text-[11px] font-black text-slate-600 dark:text-slate-400 w-10 text-right">{e.time?.split(' - ')[0] || e.time}</div>
              </div>
              <div className="relative w-px bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                <div className="absolute -left-[3.5px] top-1 w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#08151a]" style={{ backgroundColor: e.typeColor || '#3b82f6' }} />
              </div>
              <div className="pb-3 flex-1 min-w-0">
                <p className="font-bold text-slate-800 dark:text-white text-[13px] group-hover:text-blue-600 transition-colors truncate">{e.title}</p>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-500 mt-0.5 truncate">{e.type} · {e.location}</p>
              </div>
            </div>
          ))}
          {(!data?.todaysEvents || data.todaysEvents.length === 0) && (
            <div className="h-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-6 text-center">
              <Calendar size={24} className="text-slate-300 dark:text-slate-600 mb-2"/>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Masz czysty grafik.</p>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">Brak wydarzeń na dzisiaj.</p>
            </div>
          )}
        </div>
        <button onClick={() => router.push('/dashboard/calendar')} className="mt-3 text-[11px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors">
          <Plus size={12}/> Dodaj wydarzenie
        </button>
      </div>
    )
  },

  'smartflow-inventory': {
    title: 'Stan floty sprzętowej',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data, router) => {
      const total = data?.smartFlow?.inventory?.total || 0;
      const inService = data?.smartFlow?.inventory?.inService || 0;
      const ok = total - inService;
      const percent = total > 0 ? Math.round((ok / total) * 100) : 100;
      
      return (
        <div className="h-full flex flex-col rounded-[24px] bg-white dark:bg-[#08151a] p-6 border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => router.push('/dashboard/warehouse/items')}>
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-4">
            <ArchiveRestore size={14} className="text-purple-500"/> Stan floty sprzętowej
          </h2>
          <div className="flex-1 flex flex-col justify-center items-center relative py-4">
             {/* Donut Chart SVG */}
             <svg viewBox="0 0 100 100" className="w-32 h-32 drop-shadow-md">
               <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="12" />
               <circle cx="50" cy="50" r="40" fill="none" stroke="url(#donut-gradient)" strokeWidth="12" strokeDasharray={`${percent * 2.51} 251`} strokeLinecap="round" transform="rotate(-90 50 50)" />
               <text x="50" y="47" textAnchor="middle" dy="6" className="text-[22px] font-black fill-slate-800 dark:fill-white">{percent}%</text>
               <text x="50" y="63" textAnchor="middle" className="text-[8px] font-bold fill-slate-500 dark:fill-slate-400">sprawne</text>
               <defs>
                 <linearGradient id="donut-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" stopColor="#04e0ff" />
                   <stop offset="100%" stopColor="#8b5cf6" />
                 </linearGradient>
               </defs>
             </svg>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-2">
            <span>Wszystkich: <b className="text-slate-800 dark:text-slate-200">{total}</b></span>
            <span>W serwisie: <b className="text-rose-500">{inService}</b></span>
          </div>
        </div>
      );
    }
  },

  'events-to-invoice': {
    title: 'Zafakturuj',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data, router) => (
      <div className="h-full flex flex-col p-6 rounded-[24px] bg-white dark:bg-[#08151a] border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CreditCard size={14} className="text-emerald-500"/> Zafakturuj
          </h2>
          <button onClick={() => router.push('/dashboard/events')} className="text-[10px] font-black tracking-wider text-[#04e0ff] hover:text-cyan-600 transition-colors flex items-center gap-1">
            Lista <ArrowRight size={10} className="inline"/>
          </button>
        </div>
        <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
          {/* Renderujemy rzeczywiste dane z backendu */}
          {(data?.eventsToInvoice || []).map((e: any) => (
            <div key={e.id} onClick={() => router.push(`/dashboard/events/${e.id}`)} className="py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors flex justify-between items-center group border-b border-slate-50 dark:border-slate-800/50 last:border-0">
              <div className="min-w-0 pr-3">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600 transition-colors">{e.nazwa}</p>
                <p className="text-[9px] font-semibold uppercase text-slate-400 mt-0.5 truncate">{e.kontrahent?.nazwa_skrocona || e.kontrahent?.nazwa || 'Brak klienta'}</p>
              </div>
              <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatMoney(e.budzet_netto)}</span>
              <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity ml-1"/>
            </div>
          ))}
          {(!data?.eventsToInvoice || data.eventsToInvoice.length === 0) && (
            <div className="h-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-6 text-center">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Wszystko rozliczone!</p>
            </div>
          )}
        </div>
      </div>
    )
  },

  'fleet-alerts': {
    title: 'Alerty systemowe',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data, router) => {
      // Dynamiczne agregowanie alertów operacyjnych z prawdziwych danych
      const alertsList = [];
      if (data?.fleetAlerts?.length > 0) {
        alertsList.push({ icon: Car, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', title: 'Przeglądy i OC', desc: `Dotyczy ${data.fleetAlerts.length} pojazdów` });
      }
      if (data?.unreturned?.length > 0) {
        alertsList.push({ icon: Truck, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', title: 'Zaległe zwroty sprzętu', desc: `${data.unreturned.length} pozycji po terminie` });
      }
      if (data?.kpis?.activeService > 0) {
        alertsList.push({ icon: Wrench, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-500/10', title: 'Serwis sprzętu', desc: `${data.kpis.activeService} urządzeń w naprawie` });
      }
      if (data?.eventsToInvoice?.length > 0) {
        alertsList.push({ icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10', title: 'Nieopłacone / do faktury', desc: `${data.eventsToInvoice.length} wydarzeń czeka` });
      }

      return (
        <div className="h-full flex flex-col p-6 rounded-[24px] bg-white dark:bg-[#08151a] border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <AlertCircle size={14} className="text-rose-500"/> Alerty Systemowe
            </h2>
            <button className="text-[10px] font-black tracking-wider text-[#04e0ff] hover:text-cyan-600 transition-colors flex items-center gap-1">
              Wszystkie <ArrowRight size={10} className="inline"/>
            </button>
          </div>
          <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
            {alertsList.map((a, i) => (
              <div key={i} className="py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors flex items-center gap-3 group border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                 <div className={`p-1.5 rounded-lg ${a.bg} ${a.color} shrink-0`}><a.icon size={14} strokeWidth={2.5}/></div>
                 <div className="min-w-0 flex-1">
                   <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-[#04e0ff] transition-colors">{a.title}</p>
                   <p className="text-[9px] font-medium text-slate-400 mt-0.5 truncate">{a.desc}</p>
                 </div>
                 <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors"/>
              </div>
            ))}
            {alertsList.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-6 text-center">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Brak pilnych powiadomień.</p>
              </div>
            )}
          </div>
        </div>
      );
    }
  },

  'tasks-todo': {
    title: 'Moje Zadania',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data, router) => (
      <div className="h-full flex flex-col p-6 rounded-[24px] bg-white dark:bg-[#08151a] border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <CheckSquare size={14} className="text-blue-500"/> Moje zadania
          </h2>
          <button onClick={() => router.push('/dashboard/tasks')} className="text-[10px] font-black tracking-wider text-[#04e0ff] hover:text-cyan-600 transition-colors flex items-center gap-1">
            Wszystkie <ArrowRight size={12}/>
          </button>
        </div>
        <div className="space-y-1 flex-1 overflow-y-auto custom-scrollbar pr-1">
          {/* Prawdziwe dane zadań z backendu */}
          {(data?.tasks || []).map((t: any) => (
            <div key={t.id} onClick={() => router.push(`/dashboard/tasks/${t.id}`)} className="py-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors flex items-start gap-3 group border-b border-slate-50 dark:border-slate-800/50 last:border-0">
              <div className="w-3.5 h-3.5 mt-0.5 rounded border border-slate-300 dark:border-slate-600 shrink-0 group-hover:border-blue-500 transition-colors"></div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-snug group-hover:text-[#04e0ff] transition-colors truncate">{t.tytul}</p>
                <p className="text-[9px] font-medium text-slate-400 mt-0.5">{formatTaskTime(t.data_koniec)}</p>
              </div>
              <Flag size={12} className="text-slate-300 dark:text-slate-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"/>
            </div>
          ))}
          {(!data?.tasks || data.tasks.length === 0) && (
            <div className="h-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-white/10 p-6 text-center">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Czysta tablica!</p>
            </div>
          )}
        </div>
        <button onClick={() => router.push('/dashboard/tasks/new')} className="mt-3 text-[11px] font-black text-[#04e0ff] hover:text-cyan-600 flex items-center gap-1.5 transition-colors">
          <Plus size={12}/> Dodaj zadanie
        </button>
      </div>
    )
  },

  'sales-funnel': {
    title: 'Lejek ofert',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data) => {
      const finanse = data?.smartFlow?.finanse || { total: 0, accepted: 0, pending: 0, rejected: 0 };
      
      // Obliczanie proporcji dla pięknego lejka
      const acceptedValue = finanse.accepted || 0;
      const pendingValue = finanse.pending || 0;
      const totalValue = finanse.total || 0;

      return (
        <div className="h-full flex flex-col p-6 rounded-[24px] bg-white dark:bg-[#08151a] border border-slate-200 dark:border-white/5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Filter size={14} className="text-emerald-500"/> Finanse
            </h2>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-md flex items-center gap-1">30 dni <ChevronDown size={10}/></span>
          </div>
          
          <div className="flex-1 flex gap-5 mt-2">
             <div className="w-16 flex flex-col items-center justify-start gap-1 pt-2">
                <div className="w-full h-8 bg-blue-500 rounded-t-sm rounded-b-md" title="Wszystkie otwarte"></div>
                <div className="w-4/5 h-8 bg-purple-500 rounded-md" title="W trakcie analizy"></div>
                <div className="w-3/5 h-8 bg-teal-400 rounded-md" title="Po akceptacji wstępnej"></div>
                <div className="w-2/5 h-8 bg-emerald-500 rounded-t-md rounded-b-sm" title="Finalnie Zaakceptowane"></div>
             </div>
             
             <div className="flex flex-col justify-between py-1.5 shrink-0 text-left">
                <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Nowe / Wysłane</p><p className="text-[13px] font-black text-slate-800 dark:text-white leading-none mt-0.5">{formatMoney(totalValue - pendingValue - acceptedValue)}</p></div>
                <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">W procesowaniu</p><p className="text-[13px] font-black text-slate-800 dark:text-white leading-none mt-0.5">{formatMoney(pendingValue)}</p></div>
                <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Odrzucone</p><p className="text-[13px] font-black text-rose-500 leading-none mt-0.5">{formatMoney(finanse.rejected)}</p></div>
                <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Zaakceptowane</p><p className="text-[13px] font-black text-emerald-500 leading-none mt-0.5">{formatMoney(acceptedValue)}</p></div>
             </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-white/5 flex items-end justify-between">
             <div>
               <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Podsumowanie</p>
               <p className="text-[10px] font-bold text-slate-500 mt-1.5">Łącznie aktywne</p>
               <p className="text-xl font-black text-[#04e0ff] mt-0.5">{formatMoney(totalValue)}</p>
             </div>
          </div>
        </div>
      );
    }
  }
};

const DEFAULT_LAYOUT = [
  'kpi-events', 'kpi-service', 'quick-actions', 
  'events-today', 'smartflow-insights', 
  'smartflow-inventory', 'events-to-invoice', 'fleet-alerts', 'tasks-todo', 'sales-funnel'
];

// ============================================================================
// GŁÓWNY KOMPONENT KOKPITU
// ============================================================================

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [dict, setDict] = useState<any>({ typy: [], statusy: [], kontrahenci: [], miejsca: [], uzytkownicy: [] });
  const [errorMsg, setErrorMsg] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<string[]>(DEFAULT_LAYOUT);
  
  const user = useAuthStore((s) => s.user);

  const dzisiaj = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const dzisiejszaData = dzisiaj.charAt(0).toUpperCase() + dzisiaj.slice(1);

  async function load() {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [summary, typy, statusy, kontrahenci, miejsca, uzytkownicy] = await Promise.all([
        api.get('/api/dashboard/summary').catch(err => ({ data: null, error: err })),
        api.get('/api/slowniki/typy-wydarzen').catch(() => ({ data: [] })),
        api.get('/api/slowniki/statusy-wydarzenia').catch(() => ({ data: [] })),
        api.get('/api/slowniki/kontrahenci').catch(() => ({ data: [] })),
        api.get('/api/slowniki/miejsca').catch(() => ({ data: [] })),
        api.get('/api/slowniki/uzytkownicy').catch(() => ({ data: [] })),
      ]);

      if (!summary.data) {
        setErrorMsg('Błąd połączenia z serwerem. Nie udało się pobrać pełnych danych kokpitu.');
        return;
      }

      setData(summary.data);
      
      if (summary.data.preferences?.layout && Array.isArray(summary.data.preferences.layout)) {
        const validLayout = summary.data.preferences.layout.filter((id: string) => WIDGETS[id]);
        if (validLayout.length > 0) setLayout(validLayout);
      }

      setDict({ typy: typy.data || [], statusy: statusy.data || [], kontrahenci: kontrahenci.data || [], miejsca: miejsca.data || [], uzytkownicy: uzytkownicy.data || [] });
    } catch (err) {
      console.error(err);
      setErrorMsg('Wystąpił nieoczekiwany błąd podczas ładowania kokpitu.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // --- KLASYCZNY, NIEZAWODNY DRAG & DROP ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    if (!isEditing) return;
    e.dataTransfer.setData('widget-id', id);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { e.currentTarget.classList.add('opacity-40', 'scale-95'); }, 0);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditing) return;
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (isEditing) e.currentTarget.classList.add('ring-2', 'ring-[#04e0ff]');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('ring-2', 'ring-[#04e0ff]');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('ring-2', 'ring-[#04e0ff]');
    if (!isEditing) return;
    
    const sourceId = e.dataTransfer.getData('widget-id');
    if (sourceId && sourceId !== targetId) {
      const newLayout = [...layout];
      const srcIdx = newLayout.indexOf(sourceId);
      const tgtIdx = newLayout.indexOf(targetId);
      
      newLayout.splice(srcIdx, 1);
      newLayout.splice(tgtIdx, 0, sourceId);
      
      setLayout(newLayout);
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-40', 'scale-95');
  };

  const saveLayout = async () => {
    setIsEditing(false);
    setShowWidgetPicker(false);
    try {
      await api.post('/api/dashboard/preferences', { layout });
    } catch (e) {
      console.error('Błąd zapisu preferencji', e);
    }
  };

  const removeWidget = (id: string) => setLayout(prev => prev.filter(w => w !== id));
  const addWidget = (id: string) => { if (!layout.includes(id)) setLayout(prev => [...prev, id]); };

  if (isLoading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#04e0ff]" /></div>;

  const unusedWidgets = Object.keys(WIDGETS).filter(id => !layout.includes(id));
  const firstName = user?.imie || 'Admin';

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-20 animate-fade-in-up">
      
      <style dangerouslySetInnerHTML={{ __html: `
        .is-editing-mode {
          animation: gentle-pulse 2.5s ease-in-out infinite alternate;
          cursor: grab;
          position: relative;
          z-index: 10;
        }
        .is-editing-mode:active { 
          cursor: grabbing; 
          transform: scale(0.96) !important;
          animation: none;
        }
        @keyframes gentle-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 rgba(4, 224, 255, 0); }
          100% { transform: scale(0.99); box-shadow: 0 0 20px rgba(4, 224, 255, 0.2); }
        }
      `}} />

      {/* NAGŁÓWEK */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#04e0ff] mb-1">{dzisiejszaData}</p>
          <h1 className="text-[28px] font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            {isEditing ? "Edytujesz widok" : `Dzień dobry, ${firstName}! 👋`}
          </h1>
          <p className="mt-1 max-w-2xl text-xs font-bold text-slate-500 dark:text-slate-400">
            {isEditing ? "Przeciągnij kafelki, aby zmienić układ. Kliknij minus, aby usunąć z widoku." : "Oto zbiór najważniejszych informacji i zadań przygotowany na dzisiaj."}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {isEditing && (
            <>
              <Button variant="secondary" onClick={() => setShowWidgetPicker(true)}>
                <Plus size={16} className="inline mr-1" /> Dodaj widget
              </Button>
              <button onClick={saveLayout} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors">
                Zakończ edycję
              </button>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          {errorMsg}
        </div>
      )}

      {/* GRID KAFELKÓW */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-5 auto-rows-min">
        {layout.map((id) => {
          const widget = WIDGETS[id];
          if (!widget) return null;

          return (
            <div
              key={id}
              draggable={isEditing}
              onDragStart={(e) => handleDragStart(e, id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, id)}
              onDragEnd={handleDragEnd}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              className={`
                ${widget.colSpan} transition-all duration-300
                ${isEditing ? 'is-editing-mode ring-1 ring-slate-200 dark:ring-white/10 rounded-[24px] overflow-hidden' : ''}
              `}
            >
              <div className="relative h-full pointer-events-auto">
                {isEditing && (
                  <div className="absolute inset-0 z-20 rounded-[24px] bg-slate-900/10 dark:bg-black/30 backdrop-blur-[1px]">
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeWidget(id); }}
                      className="absolute top-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg hover:scale-110 transition-transform"
                      title="Usuń widget"
                    >
                      <Minus size={16} strokeWidth={3} />
                    </button>
                  </div>
                )}
                
                {widget.render(data, router)}
              </div>
            </div>
          );
        })}

        {layout.length === 0 && !isEditing && (
          <div className="md:col-span-2 xl:col-span-5 py-24 text-center rounded-[32px] border border-dashed border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
            <LayoutGrid size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-lg font-black text-slate-600 dark:text-slate-300">Twój obszar roboczy jest pusty.</p>
            <p className="text-sm font-bold text-slate-400 mt-2">Włącz tryb edycji, aby przypiąć kafelki.</p>
            <Button className="mt-6" onClick={() => setIsEditing(true)}>Dostosuj Kokpit</Button>
          </div>
        )}
      </div>

      {!isEditing && layout.length > 0 && (
         <div className="flex justify-center pt-8 opacity-50 hover:opacity-100 transition-opacity">
            <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-[#08151a] shadow-sm">
              <Settings size={14} /> Dostosuj układ kokpitu
            </button>
         </div>
      )}

      {showWidgetPicker && (
        <SimpleModal title="Dostępne widgety" onClose={() => setShowWidgetPicker(false)} className="max-w-4xl">
          <div className="grid gap-3 md:grid-cols-2">
            {unusedWidgets.map(id => (
              <div key={`pick-${id}`} className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 flex items-center justify-between border border-transparent hover:border-cyan-500/30 transition-colors">
                <span className="text-sm font-bold text-slate-800 dark:text-white">{WIDGETS[id].title}</span>
                <button 
                  onClick={() => addWidget(id)}
                  className="w-10 h-10 rounded-full bg-white dark:bg-black/20 text-[#04e0ff] flex items-center justify-center shadow-sm hover:bg-gradient-to-r hover:from-[#04e0ff] hover:to-blue-600 hover:text-white transition-colors"
                >
                  <Plus size={18} strokeWidth={2.5} />
                </button>
              </div>
            ))}
            {unusedWidgets.length === 0 && (
              <div className="md:col-span-2 text-center py-10 text-sm font-bold text-slate-400">
                Wszystkie dostępne widgety są już aktywne na Twoim kokpicie.
              </div>
            )}
          </div>
          <div className="mt-8 flex justify-end">
            <Button onClick={() => setShowWidgetPicker(false)}>Zakończ dodawanie</Button>
          </div>
        </SimpleModal>
      )}

      {showAdd && <QuickAddCalendarModal dict={dict} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}