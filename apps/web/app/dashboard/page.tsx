'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Wrench, Loader2, Settings, Check, LayoutGrid, 
  RotateCcw, Truck, FileText, CheckSquare, Plus, AlertCircle, Clock,
  Users, Box, Activity, Minus, Zap, Sparkles, TrendingUp, Coffee,
  CreditCard, ArchiveRestore
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button, PageTitle } from '../../components/ProductUI';
import { QuickAddCalendarModal } from '../../components/QuickAddCalendarModal';
import { SimpleModal } from '../../components/SimpleModal';

// ============================================================================
// WIDGET REGISTRY (Apple-style, Glassmorphism, zaokrąglenia 28px)
// ============================================================================

const WIDGETS: Record<string, { title: string; colSpan: string; render: (data: any, router: any) => JSX.Element }> = {
  
  // --- GRUPA: SMARTFLOW ---
  'smartflow-insights': {
    title: 'SmartFlow: Asystent AI',
    colSpan: 'md:col-span-2 xl:col-span-2',
    render: (data) => {
      const issues = (data?.fleetAlerts?.length || 0) + (data?.unreturned?.length || 0) + (data?.kpis?.activeService || 0);
      return (
        <div className="h-full flex flex-col justify-center rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-7 text-white relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-transform duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/20 blur-[80px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none"></div>
          <h2 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-400 flex items-center gap-2 relative z-10">
            <Sparkles size={16} /> Podsumowanie dnia
          </h2>
          <p className="text-[15px] font-medium leading-relaxed text-slate-300 relative z-10">
            Masz dzisiaj w planie <b className="text-white">{data?.todaysEvents?.length || 0}</b> wydarzeń. Oczekuje <b className="text-white">{data?.offers?.length || 0}</b> ofert do przeprocesowania oraz <b className="text-white">{data?.eventsToInvoice?.length || 0}</b> wydarzeń do zafakturowania. System wykrył <b className="text-white">{issues}</b> alertów operacyjnych (flota, serwis, zaległe zwroty).
          </p>
        </div>
      );
    }
  },
  'smartflow-inventory': {
    title: 'SmartFlow: Stany magazynowe',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data, router) => {
      const total = data?.smartFlow?.inventory?.total || 0;
      const inService = data?.smartFlow?.inventory?.inService || 0;
      const ok = total - inService;
      const percent = total > 0 ? Math.round((ok / total) * 100) : 100;
      
      return (
        <div className="h-full flex flex-col rounded-[28px] bg-white p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all cursor-pointer" onClick={() => router.push('/dashboard/warehouse/items')}>
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-6">
            <ArchiveRestore size={16} className="text-indigo-500"/> Stan floty sprzętowej
          </h2>
          <div className="flex-1 flex flex-col justify-center">
             <div className="flex items-end gap-3 mb-2">
               <span className="text-5xl font-black text-slate-800 tracking-tighter">{percent}%</span>
               <span className="text-sm font-bold text-slate-500 mb-2">sprawne</span>
             </div>
             <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
               <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${percent}%` }}></div>
             </div>
             <div className="flex justify-between text-xs font-bold text-slate-500">
               <span>Wszystkich: <b className="text-slate-800">{total}</b></span>
               <span>W serwisie: <b className="text-red-500">{inService}</b></span>
             </div>
          </div>
        </div>
      );
    }
  },
  'smartflow-finance': {
    title: 'SmartFlow: Finanse Miesiąca',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data) => (
      <div className="h-full flex flex-col rounded-[28px] bg-white p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 mb-6">
          <TrendingUp size={16} className="text-emerald-500"/> Lejek ofert (30 dni)
        </h2>
        <div className="flex-1 flex flex-col justify-center gap-4">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Zaakceptowane</p>
            <p className="text-2xl font-black text-emerald-600">{Number(data?.smartFlow?.finanse?.accepted || 0).toLocaleString('pl-PL')} zł</p>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">W procesowaniu</p>
            <p className="text-lg font-black text-slate-800">{Number(data?.smartFlow?.finanse?.pending || 0).toLocaleString('pl-PL')} zł</p>
          </div>
        </div>
      </div>
    )
  },

  // --- GRUPA: AKCJE I KONTROLA ---
  'quick-actions': {
    title: 'Centrum Skrótów',
    colSpan: 'md:col-span-2 xl:col-span-2',
    render: (data, router) => (
      <div className="h-full flex flex-col justify-center rounded-[28px] bg-white p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <h2 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <Zap size={16} className="text-cyan-500"/> Szybkie akcje
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Calendar, label: 'Wydarzenie', color: 'text-cyan-600', bg: 'bg-cyan-50', hover: 'hover:bg-cyan-100', href: '/dashboard/events/new' },
            { icon: FileText, label: 'Oferta', color: 'text-blue-600', bg: 'bg-blue-50', hover: 'hover:bg-blue-100', href: '/dashboard/offers/new' },
            { icon: Box, label: 'Wydanie (WZ)', color: 'text-emerald-600', bg: 'bg-emerald-50', hover: 'hover:bg-emerald-100', href: '/dashboard/warehouse/receiving' },
            { icon: Wrench, label: 'Serwis', color: 'text-rose-600', bg: 'bg-rose-50', hover: 'hover:bg-rose-100', href: '/dashboard/service/new' },
          ].map((action, i) => (
            <button key={i} onClick={() => router.push(action.href)} className={`flex flex-col items-center justify-center gap-3 p-4 rounded-[20px] ${action.bg} ${action.hover} transition-colors group border border-transparent`}>
              <action.icon size={26} className={`${action.color} group-hover:scale-110 transition-transform`} strokeWidth={1.5} /> 
              <span className="text-xs font-bold text-slate-700">{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  },

  // --- GRUPA: KPI ---
  'kpi-events': {
    title: 'KPI: Wydarzenia',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data, router) => (
      <div className="relative h-full flex flex-col justify-center p-6 rounded-[28px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] cursor-pointer transition-all" onClick={() => router.push('/dashboard/events')}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Wydarzenia</p>
            <p className="mt-2 text-5xl font-black text-slate-800 tracking-tighter">{data?.kpis?.eventsThisWeek ?? 0}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">w tym tygodniu</p>
          </div>
          <div className="rounded-[20px] bg-cyan-50 p-3 text-cyan-600"><Calendar size={28} strokeWidth={2} /></div>
        </div>
      </div>
    )
  },
  'kpi-service': {
    title: 'KPI: Serwis',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data, router) => (
      <div className="relative h-full flex flex-col justify-center p-6 rounded-[28px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] cursor-pointer transition-all" onClick={() => router.push('/dashboard/service')}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">W naprawie</p>
            <p className="mt-2 text-5xl font-black text-slate-800 tracking-tighter">{data?.kpis?.activeService ?? 0}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">aktywne zgłoszenia</p>
          </div>
          <div className="rounded-[20px] bg-rose-50 p-3 text-rose-500"><Wrench size={28} strokeWidth={2} /></div>
        </div>
      </div>
    )
  },

  // --- GRUPA: OPERACYJNE (LISTY) ---
  'events-today': {
    title: 'Lista: Dzisiejsze Wydarzenia',
    colSpan: 'md:col-span-2 xl:col-span-2',
    render: (data, router) => (
      <div className="h-full flex flex-col p-6 rounded-[28px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <Calendar size={16} className="text-cyan-500"/> Plan na dzisiaj
          </h2>
          <button onClick={() => router.push('/dashboard/calendar')} className="text-[11px] font-black uppercase tracking-wider text-cyan-600 hover:text-cyan-800 transition-colors">Cały Kalendarz</button>
        </div>
        <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {(data?.todaysEvents || []).map((e: any) => (
            <div key={e.id} onClick={() => router.push(`/dashboard/events/${e.id}`)} className="rounded-[20px] bg-slate-50 p-4 hover:bg-cyan-50 cursor-pointer transition-colors group border border-transparent hover:border-cyan-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-800 text-[15px] group-hover:text-cyan-900 transition-colors flex items-center gap-2">
                    <span>{e.statusIcon}</span> {e.title}
                  </p>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">{e.type} · {e.location}</p>
                </div>
                <p className="text-xs font-black tracking-wider text-slate-900 bg-white px-3 py-1.5 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)]">{e.time}</p>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full rounded-full bg-cyan-500 transition-all duration-1000" style={{ width: `${e.progress}%` }} />
              </div>
            </div>
          ))}
          {(!data?.todaysEvents || data.todaysEvents.length === 0) && (
            <div className="h-full flex items-center justify-center rounded-[20px] border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400 bg-slate-50/50">
              Masz czysty grafik. Brak wydarzeń na dzisiaj.
            </div>
          )}
        </div>
      </div>
    )
  },
  'events-to-invoice': {
    title: 'Lista: Do zafakturowania',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data, router) => (
      <div className="h-full flex flex-col p-6 rounded-[28px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-500"/> Zafakturuj
          </h2>
          <button onClick={() => router.push('/dashboard/events')} className="text-[11px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-800 transition-colors">Lista</button>
        </div>
        <div className="space-y-2 flex-1">
          {(data?.eventsToInvoice || []).map((e: any) => (
            <div key={e.id} onClick={() => router.push(`/dashboard/events/${e.id}`)} className="rounded-[16px] border border-slate-100 p-3 hover:border-emerald-200 cursor-pointer transition-colors flex justify-between items-center bg-white hover:shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{e.nazwa}</p>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-0.5">{e.kontrahent?.nazwa || 'Brak klienta'}</p>
              </div>
            </div>
          ))}
          {(!data?.eventsToInvoice || data.eventsToInvoice.length === 0) && (
            <div className="h-full flex items-center justify-center text-sm font-bold text-slate-400 py-4 text-center border border-dashed rounded-[20px] border-slate-200 bg-slate-50/50">Wszystko rozliczone! 🎉</div>
          )}
        </div>
      </div>
    )
  },
  'tasks-todo': {
    title: 'Lista: Moje zadania',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data, router) => (
      <div className="h-full flex flex-col p-6 rounded-[28px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <CheckSquare size={16} className="text-blue-500"/> Moje zadania
          </h2>
          <button onClick={() => router.push('/dashboard/tasks')} className="text-[11px] font-black uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors">Wszystkie</button>
        </div>
        <div className="space-y-2 flex-1">
          {(data?.tasks || []).map((t: any) => (
            <div key={t.id} onClick={() => router.push(`/dashboard/tasks/${t.id}`)} className="rounded-[20px] p-3 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 group">
              <div className="mt-0.5 rounded-md border-2 border-slate-300 w-4 h-4 shrink-0 group-hover:border-blue-400 transition-colors"></div>
              <div>
                <p className="text-sm font-bold text-slate-800 leading-tight group-hover:text-blue-700 transition-colors">{t.tytul}</p>
                <p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-wider">{t.status}</p>
              </div>
            </div>
          ))}
          {(!data?.tasks || data.tasks.length === 0) && (
             <div className="h-full flex items-center justify-center text-sm font-bold text-slate-400 py-4 text-center border border-dashed rounded-[20px] border-slate-200 bg-slate-50/50">Czysta tablica zadań! 🎉</div>
          )}
        </div>
      </div>
    )
  },
  'unreturned-gear': {
    title: 'Lista: Niezwrócony Sprzęt',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data, router) => (
      <div className="h-full flex flex-col p-6 rounded-[28px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
            <Clock size={16} className="text-rose-500"/> Zaległy sprzęt
          </h2>
          <button onClick={() => router.push('/dashboard/warehouse/unreturned')} className="text-[11px] font-black uppercase tracking-wider text-rose-600 hover:text-rose-800 transition-colors">Lista</button>
        </div>
        <div className="space-y-3 flex-1">
          {(data?.unreturned || []).map((u: any) => (
            <div key={u.id} onClick={() => router.push(`/dashboard/rentals/${u.id}`)} className="rounded-[16px] bg-slate-50 p-3 cursor-pointer hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-100">
              <p className="text-sm font-bold text-slate-800">{u.numer || `Wynajem #${u.id}`}</p>
              <p className="text-xs font-bold text-rose-600 mt-1">Po terminie: {new Date(u.data_zwrotu_planowana).toLocaleDateString('pl-PL')}</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate mt-0.5">{u.kontrahent?.nazwa || 'Brak przypisanego klienta'}</p>
            </div>
          ))}
          {(!data?.unreturned || data.unreturned.length === 0) && (
            <div className="h-full flex items-center justify-center text-sm font-bold text-slate-400 py-4 text-center border border-dashed rounded-[20px] border-slate-200 bg-slate-50/50">Wszystko wróciło do bazy.</div>
          )}
        </div>
      </div>
    )
  },
  'fleet-alerts': {
    title: 'Alerty: Flota (OC/Przegląd)',
    colSpan: 'md:col-span-1 xl:col-span-1',
    render: (data, router) => (
      <div className="h-full flex flex-col p-6 rounded-[28px] bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
        <h2 className="mb-5 text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
          <Truck size={16} className="text-indigo-500"/> Status Floty (30 dni)
        </h2>
        <div className="space-y-3 flex-1">
          {(data?.fleetAlerts || []).map((f: any) => {
            const limit = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const isOC = f.data_oc && new Date(f.data_oc) < limit;
            const isPrzeglad = f.data_przegladu && new Date(f.data_przegladu) < limit;
            
            return (
              <div key={f.id} onClick={() => router.push(`/dashboard/fleet/${f.id}`)} className="rounded-[16px] bg-slate-50 p-3 cursor-pointer hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100">
                <p className="text-sm font-black text-slate-800">{f.nazwa} <span className="text-xs font-bold text-slate-400 ml-1">{f.nr_rejestracyjny}</span></p>
                {isOC && <p className="text-xs font-bold text-indigo-600 mt-1 flex items-center gap-1"><AlertCircle size={12}/> Kończy się OC: {new Date(f.data_oc).toLocaleDateString('pl-PL')}</p>}
                {isPrzeglad && <p className="text-xs font-bold text-amber-600 mt-1 flex items-center gap-1"><Clock size={12}/> Kończy się przegląd: {new Date(f.data_przegladu).toLocaleDateString('pl-PL')}</p>}
              </div>
            );
          })}
          {(!data?.fleetAlerts || data.fleetAlerts.length === 0) && (
            <div className="h-full flex items-center justify-center text-sm font-bold text-slate-400 py-4 text-center border border-dashed rounded-[20px] border-slate-200 bg-slate-50/50">Brak pilnych terminów.</div>
          )}
        </div>
      </div>
    )
  }
};

const DEFAULT_LAYOUT = ['smartflow-insights', 'smartflow-inventory', 'smartflow-finance', 'quick-actions', 'events-today', 'events-to-invoice', 'tasks-todo', 'unreturned-gear', 'fleet-alerts'];

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
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  // Dynamiczna dzisiejsza data
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

  // --- LOGIKA DRAG & DROP ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    if (!isEditing) return;
    setDraggedWidget(id);
    e.dataTransfer.effectAllowed = 'move';
    const target = e.currentTarget;
    setTimeout(() => { target.classList.add('opacity-40', 'scale-95'); }, 10);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-40', 'scale-95');
    setDraggedWidget(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetId) return;

    const newLayout = [...layout];
    const draggedIdx = newLayout.indexOf(draggedWidget);
    const targetIdx = newLayout.indexOf(targetId);

    newLayout.splice(draggedIdx, 1);
    newLayout.splice(targetIdx, 0, draggedWidget);
    
    setLayout(newLayout);
    setDraggedWidget(null);
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

  if (isLoading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>;

  const unusedWidgets = Object.keys(WIDGETS).filter(id => !layout.includes(id));

  return (
    <div className="mx-auto max-w-[1500px] space-y-8 pb-20">
      
      {/* ZAKTUALIZOWANE ANIMACJE (BEZ BLURA, DELIKATNY PULS, MIĘKKIE CIENIE) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scale-up-fade {
          0% { opacity: 0; transform: translateY(15px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .widget-enter {
          animation: scale-up-fade 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
          opacity: 0;
        }

        /* Apple-style smooth breathe for edit mode (no jarring jiggle) */
        @keyframes gentle-pulse {
          0% { transform: scale(1); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
          100% { transform: scale(0.98); box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.05); }
        }
        .is-editing-mode {
          animation: gentle-pulse 2.5s ease-in-out infinite alternate;
          cursor: grab;
          position: relative;
          z-index: 10;
          border-radius: 28px;
        }
        .is-editing-mode:active { 
          cursor: grabbing; 
          transform: scale(0.96) !important;
          animation: none;
        }
      `}} />

      {/* NAGŁÓWEK - GREETING */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600 mb-1">{dzisiejszaData}</p>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">
            {isEditing ? "Edytujesz widok" : `Dzień dobry, ${data?.user?.imie}!`}
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
            {isEditing ? "Przeciągnij kafelki, aby zmienić układ. Kliknij minus, aby usunąć. Użyj przycisku Dodaj, aby zobaczyć więcej opcji." : "Oto zbiór najważniejszych informacji i zadań przygotowany na dzisiaj."}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {isEditing ? (
            <>
              <Button variant="secondary" onClick={() => setShowWidgetPicker(true)}>
                <Plus size={16} className="inline mr-1" /> Dodaj widget
              </Button>
              <button onClick={saveLayout} className="bg-slate-900 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-md hover:bg-slate-800 transition-colors">
                Zakończ edycję
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 font-bold text-sm px-5 py-2.5 rounded-full shadow-sm hover:bg-slate-50 transition-colors">
                <Settings size={16} /> Dostosuj
              </button>
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-cyan-600 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-md hover:bg-cyan-700 transition-colors">
                <Plus size={16} /> Szybki wpis
              </button>
            </>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700 widget-enter">
          {errorMsg}
        </div>
      )}

      {/* RENDEROWANIE KAFELKÓW W GRIDZIE */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 auto-rows-min">
        {layout.map((id, index) => {
          const widget = WIDGETS[id];
          if (!widget) return null;

          return (
            <div
              key={id}
              draggable={isEditing}
              onDragStart={(e) => handleDragStart(e, id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, id)}
              className={`
                ${widget.colSpan}
                ${isEditing ? 'is-editing-mode ring-4 ring-slate-100/60 ring-offset-4' : 'widget-enter'}
              `}
              style={{ animationDelay: isEditing ? `${(index % 3) * 0.1}s` : `${index * 0.05}s` }}
            >
              <div className="relative h-full rounded-[28px]">
                {/* Wygładzony overlay edycji z przyciskiem "Minus" w stylu iOS */}
                {isEditing && (
                  <div className="absolute inset-0 z-20 rounded-[28px] bg-slate-50/10">
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeWidget(id); }}
                      className="absolute -top-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-500 shadow-md border-[3px] border-white hover:bg-red-500 hover:text-white transition-colors"
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
          <div className="md:col-span-2 xl:col-span-4 py-24 text-center rounded-[32px] border border-dashed border-slate-300 bg-slate-50/50 widget-enter">
            <LayoutGrid size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-black text-slate-600">Twój obszar roboczy jest pusty.</p>
            <p className="text-sm font-bold text-slate-400 mt-2">Włącz tryb dostosowywania, aby przypiąć kafelki.</p>
          </div>
        )}
      </div>

      {/* WIDGET PICKER MODAL */}
      {showWidgetPicker && (
        <SimpleModal title="Dostępne widgety" onClose={() => setShowWidgetPicker(false)} className="max-w-4xl">
          <div className="grid gap-3 md:grid-cols-2">
            {unusedWidgets.map(id => (
              <div key={`pick-${id}`} className="rounded-[24px] bg-slate-50 p-4 flex items-center justify-between border border-transparent hover:border-slate-200 transition-colors">
                <span className="text-sm font-bold text-slate-800">{WIDGETS[id].title}</span>
                <button 
                  onClick={() => addWidget(id)}
                  className="w-10 h-10 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-sm hover:bg-emerald-500 hover:text-white transition-colors"
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
            <button onClick={() => setShowWidgetPicker(false)} className="bg-slate-900 text-white font-bold text-sm px-8 py-3 rounded-full hover:bg-slate-800 transition-colors shadow-md">Gotowe</button>
          </div>
        </SimpleModal>
      )}

      {showAdd && <QuickAddCalendarModal dict={dict} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}