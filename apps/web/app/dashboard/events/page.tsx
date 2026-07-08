'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, Plus, DownloadCloud, Send, ArrowRightLeft, 
  Settings, Filter, ArrowUpDown, Loader2, Calendar as CalendarIcon, 
  Search, X, CheckCircle2
} from 'lucide-react';
import { useEventsStore } from '../../../store/events.store';
import { api } from '../../../lib/api';

export default function EventsListPage() {
  const router = useRouter();
  const { 
    events, clients, managers, filters, isLoading, 
    fetchEvents, fetchDictionaries, setFilter 
  } = useEventsStore();

  const [dateRange, setDateRange] = useState('2026-07-01 - 2026-07-31');
  
  // Stany funkcjonalności interfejsu
  const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
  const [showTotalSum, setShowTotalSum] = useState(false);
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);

  useEffect(() => {
    fetchDictionaries();
    fetchEvents();
  }, []);

  // --- LOGIKA CHECKBOXÓW ---
  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedEvents(events.map((e: any) => e.id));
    else setSelectedEvents([]);
  };

  const handleSelectEvent = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Zapobiega wejściu w event po kliknięciu w checkbox
    setSelectedEvents(prev => 
      prev.includes(id) ? prev.filter(eventId => eventId !== id) : [...prev, id]
    );
  };

  // --- LOGIKA SUMY BUDŻETU ---
  // Liczy budżet albo zaznaczonych, albo wszystkich wyfiltrowanych
  const eventsToCalculate = selectedEvents.length > 0 
    ? events.filter(e => selectedEvents.includes(e.id)) 
    : events;

  const totalSum = eventsToCalculate.reduce((acc, curr) => acc + (Number(curr.budzet_netto) || 0), 0);
  const formattedSum = totalSum.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' });

  // --- LOGIKA RAPORTÓW (GENEROWANIE CSV) ---
  const handleExportCSV = (type: 'finanse' | 'pracownicy') => {
    const dataToExport = selectedEvents.length > 0 ? events.filter(e => selectedEvents.includes(e.id)) : events;
    
    if (dataToExport.length === 0) return alert('Brak danych do eksportu.');

    let csvContent = "";
    
    if (type === 'finanse') {
      csvContent = "ID;Wydarzenie;Klient;Data Start;Data Koniec;Miesiac Ksiegowania;Budzet Netto\n";
      dataToExport.forEach(e => {
        csvContent += `${e.id};"${e.nazwa}";"${e.kontrahent?.nazwa || ''}";${e.data_start ? new Date(e.data_start).toLocaleDateString() : ''};${e.data_koniec ? new Date(e.data_koniec).toLocaleDateString() : ''};${e.miesiac_ksiegowania || ''};${e.budzet_netto || 0}\n`;
      });
    } else {
      csvContent = "ID;Wydarzenie;Manager;Klient;Data Start\n";
      dataToExport.forEach(e => {
        csvContent += `${e.id};"${e.nazwa}";"${e.manager ? e.manager.imie + ' ' + e.manager.nazwisko : ''}";"${e.kontrahent?.nazwa || ''}";${e.data_start ? new Date(e.data_start).toLocaleDateString() : ''}\n`;
      });
    }

    // Użycie BOM (\uFEFF) wymusza w Excelu poprawne czytanie polskich znaków UTF-8
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `raport_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- LOGIKA POWIADOMIEŃ ---
  const handleSendNotifications = async () => {
    if(!confirm('Czy na pewno chcesz wysłać powiadomienia masowe (przypomnienia SMS/Email) do zaangażowanych osób?')) return;
    
    setIsSendingNotifications(true);
    try {
      await api.post('/api/wydarzenia/powiadomienia/masowe');
      alert('Powiadomienia zostały poprawnie zlecone do wysyłki!');
    } catch (error) {
      console.error(error);
      alert('Wystąpił błąd przy wysyłaniu powiadomień.');
    } finally {
      setIsSendingNotifications(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in-up">
      
      {/* BREADCRUMBS & HEADER */}
      <div className="flex items-center text-sm text-slate-500 gap-2 mb-2 mt-4">
        <span className="cursor-pointer hover:text-[#00B5B5] font-semibold" onClick={() => router.push('/dashboard')}>Kokpit</span> 
        <ChevronRight size={14} />
        <span className="font-bold text-[#00B5B5] border-b-2 border-[#00B5B5] pb-0.5">Wydarzenia</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* UPPER TOOLBAR */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => router.push('/dashboard/events/new')}
              className="flex items-center gap-2 bg-[#00B5B5] text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-teal-400 transition"
            >
              <Plus size={16} /> Dodaj
            </button>
            <button onClick={() => handleExportCSV('finanse')} className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
              <DownloadCloud size={16} /> Raport .xls - finanse
            </button>
            <button onClick={() => handleExportCSV('pracownicy')} className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
              <DownloadCloud size={16} /> Raport .xls - pracownicy
            </button>
            <button 
              onClick={handleSendNotifications} 
              disabled={isSendingNotifications}
              className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              {isSendingNotifications ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
              Wyślij wszystkie powiadomienia
            </button>
            <button onClick={() => router.push('/dashboard/warehouse/move')} className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
              <ArrowRightLeft size={16} /> Przenieś sprzęt
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex items-center">
              {/* Odznaka pokazująca liczbę zaznaczonych elementów */}
              <span className={`absolute right-0 top-0 -mt-2 -mr-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 transition-colors ${selectedEvents.length > 0 ? 'bg-[#00B5B5]' : 'bg-amber-500'}`}>
                {selectedEvents.length}
              </span>
              <button 
                onClick={() => setShowTotalSum(!showTotalSum)}
                className="flex items-center gap-2 bg-[#11282D] text-white border border-[#11282D] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition shadow-sm min-w-[120px] justify-center"
              >
                {showTotalSum ? formattedSum : 'Pokaż sumę'} <CheckCircle2 size={16} className={showTotalSum ? 'text-emerald-400' : 'text-[#00B5B5]'} />
              </button>
            </div>
          </div>
        </div>

        {/* DATE & PERIOD SELECTOR ROW */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-600">Wybierz okres:</span>
            <div className="flex items-center gap-2 bg-white border border-slate-300 px-4 py-2 rounded-lg shadow-sm w-[300px]">
              <CalendarIcon size={16} className="text-slate-400" />
              <input 
                type="text" 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full text-sm outline-none text-slate-700 font-medium"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select className="border border-slate-300 rounded-lg text-sm px-4 py-2 outline-none cursor-pointer bg-white text-slate-700 font-bold shadow-sm focus:border-[#00B5B5]">
              <option>2026</option>
              <option>2027</option>
            </select>
            <select className="border border-slate-300 rounded-lg text-sm px-4 py-2 outline-none cursor-pointer bg-white text-slate-700 font-bold shadow-sm focus:border-[#00B5B5] min-w-[120px]">
              <option>Lipiec</option>
              <option>Sierpień</option>
            </select>
            
            <div className="flex items-center ml-2 border border-slate-300 rounded-lg overflow-hidden shadow-sm bg-white">
              <button onClick={() => handleExportCSV('finanse')} className="p-2 text-slate-500 hover:bg-slate-50 border-r border-slate-200 transition" title="Szybki Eksport widoku"><DownloadCloud size={16} /></button>
              <button className="p-2 text-white bg-[#00B5B5] hover:bg-teal-400 border-r border-slate-200 transition" title="Ustawienia tabeli"><Settings size={16} /></button>
              <button onClick={() => alert('W zaawansowanych wersjach to okienko otwiera boczny panel super-filtrów.')} className="p-2 text-slate-500 hover:bg-slate-50 border-r border-slate-200 transition"><Filter size={16} /></button>
              <button className="p-2 text-slate-500 hover:bg-slate-50 transition" title="Zmień sortowanie dat"><ArrowUpDown size={16} /></button>
            </div>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    checked={events.length > 0 && selectedEvents.length === events.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-slate-300 cursor-pointer text-[#00B5B5]" 
                  />
                </th>
                <th className="p-3 w-12 font-bold text-slate-500 text-xs">#</th>
                <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Wydarzenie</th>
                <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Klient</th>
                <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">EventManager</th>
                <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider flex items-center gap-1">Od - do <ArrowUpDown size={12}/></th>
                <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Data księgowania</th>
                <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Dodano</th>
              </tr>
              <tr className="bg-white border-t border-slate-100">
                <th className="p-2"></th>
                <th className="p-2"></th>
                <th className="p-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
                    <input 
                      type="text" 
                      value={filters.search}
                      onChange={(e) => setFilter('search', e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded text-xs font-normal outline-none focus:border-[#00B5B5] focus:ring-1 focus:ring-[#00B5B5] bg-slate-50 focus:bg-white transition" 
                      placeholder="Szukaj..."
                    />
                    {filters.search && <X size={14} className="absolute right-2 top-2 text-slate-400 cursor-pointer hover:text-red-500" onClick={() => setFilter('search', '')} />}
                  </div>
                </th>
                <th className="p-2">
                  <select 
                    value={filters.clientId || ''} 
                    onChange={(e) => setFilter('clientId', e.target.value)} 
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-normal outline-none focus:border-[#00B5B5] bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    <option value="">Wybierz klienta...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id.toString()}>{client.nazwa_skrocona || client.nazwa}</option>
                    ))}
                  </select>
                </th>
                <th className="p-2">
                  <select 
                    value={filters.managerId || ''}
                    onChange={(e) => setFilter('managerId', e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-normal outline-none focus:border-[#00B5B5] bg-slate-50 focus:bg-white cursor-pointer"
                  >
                    <option value="">Wybierz managera...</option>
                    {managers.map(manager => (
                      <option key={manager.id} value={manager.id.toString()}>{manager.imie} {manager.nazwisko}</option>
                    ))}
                  </select>
                </th>
                <th className="p-2"><input type="text" className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-normal bg-slate-50 focus:bg-white outline-none focus:border-[#00B5B5]" /></th>
                <th className="p-2">
                  <input 
                    type="text" 
                    value={filters.miesiacKsiegowania || ''}
                    onChange={(e) => setFilter('miesiacKsiegowania', e.target.value)}
                    placeholder="np. 07.2026"
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-normal bg-slate-50 focus:bg-white outline-none focus:border-[#00B5B5]" 
                  />
                </th>
                <th className="p-2"><input type="text" className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-normal bg-slate-50 focus:bg-white outline-none focus:border-[#00B5B5]" /></th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-slate-400">
                    <Loader2 className="animate-spin w-8 h-8 mx-auto mb-3 text-[#00B5B5]" />
                    Pobieranie bazy wydarzeń...
                  </td>
                </tr>
              ) : events.length > 0 ? (
                events.map((event: any, idx: number) => (
                  <tr 
                    key={event.id} 
                    className={`${selectedEvents.includes(event.id) ? 'bg-[#00B5B5]/5' : 'hover:bg-slate-50'} transition cursor-pointer group`}
                    onClick={() => router.push(`/dashboard/events/${event.id}`)}
                  >
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedEvents.includes(event.id)}
                        onClick={(e) => handleSelectEvent(event.id, e)}
                        onChange={() => {}} // React controlled input requirement bypass
                        className="rounded border-slate-300 cursor-pointer text-[#00B5B5]" 
                      />
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="p-3 font-bold text-sky-600 group-hover:text-[#00B5B5]">{event.nazwa || `Wydarzenie #${event.id}`}</td>
                    <td className="p-3 text-slate-700 font-medium">{event.kontrahent?.nazwa_skrocona || event.kontrahent?.nazwa || '-'}</td>
                    <td className="p-3 text-slate-600">{event.manager ? `${event.manager.imie} ${event.manager.nazwisko}` : '-'}</td>
                    <td className="p-3 text-slate-500 font-mono text-xs">
                      {event.data_start ? new Date(event.data_start).toLocaleDateString() : '-'} <br/>
                      {event.data_koniec ? new Date(event.data_koniec).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-3 text-slate-500">{event.miesiac_ksiegowania || '-'}</td>
                    <td className="p-3 text-slate-400 text-xs font-mono">{new Date(event.data_utworzenia || Date.now()).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 font-medium bg-slate-50/50">
                    Brak wyników do wyświetlenia. Spróbuj zmienić parametry filtrów.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}