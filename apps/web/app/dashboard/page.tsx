'use client';

import { useEffect, useState } from 'react';
import { Calendar, Wrench, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { Button, Card, PageTitle } from '../../components/ProductUI';
import { QuickAddCalendarModal } from '../../components/QuickAddCalendarModal';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [dict, setDict] = useState<any>({ typy: [], statusy: [], kontrahenci: [], miejsca: [], uzytkownicy: [] });

  async function load() {
    setIsLoading(true);
    try {
      const [summary, typy, statusy, kontrahenci, miejsca, uzytkownicy] = await Promise.all([
        api.get('/api/dashboard/summary'),
        api.get('/api/slowniki/typy-wydarzen').catch(() => ({ data: [] })),
        api.get('/api/slowniki/statusy-wydarzenia').catch(() => ({ data: [] })),
        api.get('/api/slowniki/kontrahenci').catch(() => ({ data: [] })),
        api.get('/api/slowniki/miejsca').catch(() => ({ data: [] })),
        api.get('/api/slowniki/uzytkownicy').catch(() => ({ data: [] })),
      ]);
      setData(summary.data);
      setDict({ typy: typy.data || [], statusy: statusy.data || [], kontrahenci: kontrahenci.data || [], miejsca: miejsca.data || [], uzytkownicy: uzytkownicy.data || [] });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (isLoading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <PageTitle
        eyebrow="Kokpit"
        title="Dzisiaj w EventFlow"
        description="Widok skupiony tylko na tym, co operacyjnie ważne: wydarzenia w tym tygodniu oraz aktywne zgłoszenia serwisowe."
        action={<Button onClick={() => setShowAdd(true)}>Dodaj</Button>}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-black text-slate-500">Wydarzenia w tym tygodniu</p><p className="mt-2 text-5xl font-black">{data?.kpis?.eventsThisWeek ?? 0}</p></div>
            <div className="rounded-2xl bg-cyan-50 p-4 text-cyan-600"><Calendar size={30} /></div>
          </div>
        </Card>
        <Card className="relative overflow-hidden cursor-pointer hover:border-cyan-300" onClick={() => router.push('/dashboard/service') as any}>
          <div className="flex items-center justify-between">
            <div><p className="text-sm font-black text-slate-500">Aktualne serwisy</p><p className="mt-2 text-5xl font-black">{data?.kpis?.activeService ?? 0}</p></div>
            <div className="rounded-2xl bg-red-50 p-4 text-red-500"><Wrench size={30} /></div>
          </div>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">Wydarzenia dzisiaj</h2><button onClick={() => router.push('/dashboard/calendar')} className="text-sm font-black text-cyan-600">Kalendarz</button></div>
          <div className="space-y-3">
            {(data?.todaysEvents || []).map((e: any) => <div key={e.id} onClick={() => router.push(`/dashboard/events/${e.id}`)} className="rounded-2xl border border-slate-100 p-4 hover:bg-slate-50 cursor-pointer">
              <div className="flex items-center justify-between"><div><p className="font-black"><span className="mr-2">{e.statusIcon}</span>{e.title}</p><p className="text-sm text-slate-500">{e.type} · {e.location}</p></div><p className="text-sm font-bold text-slate-500">{e.time}</p></div>
              <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-cyan-500" style={{ width: `${e.progress}%` }} /></div>
            </div>)}
            {(!data?.todaysEvents || data.todaysEvents.length === 0) && <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm font-bold text-slate-400">Brak wydarzeń na dziś.</p>}
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-black">Co wymaga uwagi</h2>
          <div className="space-y-3">
            {(data?.alerts || []).map((a: any) => <div key={a.id} className="rounded-2xl border border-amber-100 bg-amber-50 p-4"><p className="text-sm font-bold text-amber-900">{a.message}</p>{a.actionText && <button onClick={() => router.push('/dashboard/service')} className="mt-3 flex items-center gap-1 text-xs font-black text-amber-700">{a.actionText}<ArrowRight size={14} /></button>}</div>)}
            {(!data?.alerts || data.alerts.length === 0) && <p className="text-sm font-bold text-slate-400">Brak pilnych alertów.</p>}
          </div>
        </Card>
      </div>
      {showAdd && <QuickAddCalendarModal dict={dict} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}
