'use client';

import { EntityEditorPage } from '../../../../../components/EntityEditorPage';
import { FileText, CalendarDays, Wrench, Clock, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// WIDOKI ZAKŁADEK (Apple-style / SmartFlow)
// ============================================================================

const renderEventHistory = (record: any) => {
  // Wyłuskujemy unikalne wydarzenia z dokumentów magazynowych (WZ/PZ)
  const eventMap = new Map();
  (record?.pozycje_wydan || []).forEach((p: any) => {
    const ev = p.wydanie?.wydarzenie;
    if (ev && !eventMap.has(ev.id)) {
      eventMap.set(ev.id, ev);
    }
  });
  
  const events = Array.from(eventMap.values()).sort((a: any, b: any) => 
    new Date(b.data_start).getTime() - new Date(a.data_start).getTime()
  );

  if (events.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-200 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-4">
          <CalendarDays size={28} />
        </div>
        <p className="text-sm font-black text-slate-500">Ten egzemplarz nie brał jeszcze udziału w żadnym wydarzeniu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((e: any) => (
        <Link key={e.id} href={`/dashboard/events/${e.id}`} className="block group">
          <div className="flex flex-col md:flex-row md:items-center gap-4 rounded-[24px] border border-slate-100 bg-white p-5 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-cyan-200">
            
            <div className="flex-shrink-0 text-center md:w-28 rounded-2xl bg-slate-50 p-3 group-hover:bg-cyan-50 transition-colors">
              <p className="text-[10px] font-black uppercase text-slate-400">Data Startu</p>
              <p className="text-lg font-black text-slate-800">{new Date(e.data_start).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-cyan-700 transition-colors truncate">
                {e.nazwa}
              </h3>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: e.typ?.kolor || '#06B6D4' }} />
                  {e.typ?.nazwa || 'Wydarzenie'}
                </span>
                <span className="text-xs font-bold text-slate-400 border-l border-slate-200 pl-3">
                  Klient: <span className="text-slate-700">{e.kontrahent?.nazwa || 'Brak'}</span>
                </span>
              </div>
            </div>

            <div className="flex-shrink-0 text-right">
               <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black text-slate-700 bg-slate-100">
                 {e.status?.ikona || '●'} {e.status?.nazwa || 'Status'}
               </span>
            </div>

          </div>
        </Link>
      ))}
    </div>
  );
};

const renderServiceHistory = (record: any) => {
  const services = record?.serwisy || [];

  if (services.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-200 p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-400 mb-4">
          <CheckCircle2 size={28} />
        </div>
        <p className="text-sm font-black text-slate-500">Bezawaryjny sprzęt! Brak zgłoszeń serwisowych w historii.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:to-transparent">
      {services.map((s: any) => {
        const isResolved = !!s.data_rozwiazania;
        
        return (
          <div key={s.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Timeline dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10" style={{ backgroundColor: s.status?.kolor ? `${s.status.kolor}20` : '#f1f5f9', color: s.status?.kolor || '#64748b' }}>
              {isResolved ? <Wrench size={16} /> : <AlertTriangle size={16} />}
            </div>
            
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ backgroundColor: s.status?.kolor || '#cbd5e1', color: '#fff' }}>
                  {s.status?.nazwa || 'Serwis'}
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-slate-400">
                  <Clock size={12}/> {new Date(s.data_zgloszenia).toLocaleDateString('pl-PL')}
                </span>
              </div>
              
              <h4 className="text-base font-black text-slate-900 mb-2">{s.tytul}</h4>
              
              {s.opis && (
                <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-600 border border-slate-100">
                  <span className="block text-[10px] font-black uppercase text-slate-400 mb-1">Opis usterki</span>
                  {s.opis}
                </div>
              )}
              
              {s.rozwiazanie && (
                <div className="mt-3 rounded-2xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800 border border-emerald-100">
                  <span className="block text-[10px] font-black uppercase text-emerald-600 mb-1">Rozwiązanie / Naprawa</span>
                  {s.rozwiazanie}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <User size={14} className="text-slate-300"/> Zgłosił: {s.zglosil?.imie} {s.zglosil?.nazwisko}
                </span>
                {isResolved && (
                  <span className="text-emerald-600">
                    Rozw. {new Date(s.data_rozwiazania).toLocaleDateString('pl-PL')}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};


// ============================================================================
// GŁÓWNY KONFIGURATOR KARTY EGZEMPLARZA
// ============================================================================

export default function ItemEditorPage() {
  return <EntityEditorPage config={{
    moduleLabel: 'Egzemplarze',
    title: 'Karta Egzemplarza',
    listHref: '/dashboard/warehouse/items',
    getEndpoint: (id) => `/api/magazyn/egzemplarze/${id}`,
    updateEndpoint: (id) => `/api/magazyn/egzemplarze/${id}`,
    deleteEndpoint: (id) => `/api/magazyn/egzemplarze/${id}`,
    dictionaries: { id_magazynu: '/api/magazyn/slowniki/magazyny', id_case: '/api/magazyn/slowniki/cases' },
    titleFromRecord: (r) => r.nazwa || r.model?.nazwa || `Egzemplarz #${r.id}`,
    subtitleFromRecord: (r) => [r.model?.nazwa, r.kod_kreskowy].filter(Boolean).join(' · '),
    
    // Zastąpienie domyślnych zakładek (Zostawiamy Szczegóły formularza i dajemy nowe moduły)
    tabs: [
      { id: 'szczegoly', label: 'Dane sprzętu', icon: FileText }, // Bez `render` wygeneruje się domyślny formularz
      { id: 'historia_wydarzen', label: 'Historia wydarzeń', icon: CalendarDays, render: renderEventHistory },
      { id: 'historia_serwisowa', label: 'Historia serwisowa', icon: Wrench, render: renderServiceHistory }
    ],

    fields: [
      { key: 'nazwa', label: 'Nazwa egzemplarza' },
      { key: 'numer_egzemplarza', label: 'Numer egzemplarza' },
      { key: 'numer_urzadzenia', label: 'Numer urządzenia' },
      { key: 'sn', label: 'S/N' },
      { key: 'data_produkcji', label: 'Data produkcji', type: 'date' },
      { key: 'kod_kreskowy', label: 'Kod kreskowy' },
      { key: 'zewnetrzny_kod_kreskowy', label: 'Zewnętrzny kod kreskowy' },
      { key: 'zewnetrzny_qr_kod', label: 'Zewnętrzny QR' },
      { key: 'rozroznij_kod_qr', label: 'Rozróżnij QR i kod', type: 'checkbox' },
      { key: 'status_serwisowy', label: 'Status serwisowy' },
      { key: 'id_magazynu', label: 'Magazyn', type: 'select' },
      { key: 'id_case', label: 'Case / opakowanie', type: 'select', optionLabel: (o:any) => `${o.model?.nazwa || ''} ${o.nazwa || o.numer_urzadzenia || `#${o.id}`}`.trim() },
      { key: 'miejsce_w_mag', label: 'Miejsce w magazynie' },
      { key: 'wartosc', label: 'Wartość', type: 'number' },
      { key: 'cena_zakupu', label: 'Cena zakupu', type: 'number' },
      { key: 'opis', label: 'Uwagi', type: 'textarea' },
    ],
  }} />;
}