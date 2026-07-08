'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, Plus, Loader2, Search, CheckCircle2, SlidersHorizontal } from 'lucide-react';
import { useServiceStore } from '../../../store/serwis.store';

// Helper do formatowania daty jak na makiecie
const formatRelativeTime = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}`;

  // Ten sam dzień
  if (date.toDateString() === now.toDateString()) {
    return `dzisiaj ${timeString}`;
  }
  
  // Wczoraj
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `wczoraj ${timeString}`;
  }

  // W ciągu ostatniego tygodnia
  if (diffDays > 0 && diffDays < 7) {
    return `${diffDays} dni temu`;
  }

  return date.toLocaleDateString('pl-PL');
};

// Mapowanie klas Tailwind z backendu/bazy (hex na bg/text)
// NAPRAWIONO: Zmiana nazwy na getServiceStatusColor
const getServiceStatusColor = (statusName: string, defaultColor: string) => {
  const name = statusName?.toLowerCase() || '';
  if (name.includes('pilne')) return 'text-red-600 bg-red-50 border-red-100';
  if (name.includes('napraw')) return 'text-amber-600 bg-amber-50 border-amber-100';
  if (name.includes('oczekuje')) return 'text-orange-600 bg-orange-50 border-orange-100';
  if (name.includes('gotow') || name.includes('działa')) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
  return 'text-slate-600 bg-slate-100 border-slate-200';
};

export default function ServicePage() {
  const router = useRouter();
  const { tickets, statuses, fetchTickets, fetchStatuses, isLoading } = useServiceStore();

  // Stany filtrów
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showResolved, setShowResolved] = useState<boolean>(false);

  useEffect(() => {
    fetchStatuses();
    fetchTickets();
  }, []);

  // Filtrowanie zgłoszeń
  const filteredTickets = tickets.filter(ticket => {
    // NAPRAWIONO: Używamy searchTerm zamiast literówki searchParams
    const searchLower = searchTerm.toLowerCase();
    
    // 1. Filtr wyszukiwania (po tytule, nazwie sprzętu, SN)
    const matchesSearch = searchTerm === '' || 
      ticket.tytul?.toLowerCase().includes(searchLower) ||
      ticket.egzemplarz?.nazwa?.toLowerCase().includes(searchLower) ||
      ticket.egzemplarz?.model?.nazwa?.toLowerCase().includes(searchLower) ||
      ticket.egzemplarz?.numer_urzadzenia?.toLowerCase().includes(searchLower) ||
      ticket.egzemplarz?.sn?.toLowerCase().includes(searchLower);

    // 2. Filtr statusu
    const matchesStatus = selectedStatus === '' || ticket.id_statusu_serwisu?.toString() === selectedStatus;

    // 3. Filtr rozwiązanych (czy_rozwiazane bazuje na dacie)
    const isResolved = !!ticket.data_rozwiazania;
    const matchesResolved = showResolved ? isResolved : !isResolved;

    return matchesSearch && matchesStatus && matchesResolved;
  });

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in-up">
      
      {/* HEADER Z OPISEM */}
      <div className="flex items-end justify-between mb-2 mt-2">
        <div>
          <h3 className="text-[11px] font-bold text-[#00B5B5] tracking-widest uppercase mb-1">Serwis</h3>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Zgłoszenia sprzętu</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Prosty moduł serwisowy: kto zgłosił, kiedy, status, kto rozwiązał i opis rozwiązania.
          </p>
        </div>
      </div>

      {/* PASEK FILTRÓW I AKCJI */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Szukaj zgłoszenia lub sprzętu..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:border-[#00B5B5] focus:ring-1 focus:ring-[#00B5B5] outline-none transition" 
            />
          </div>
          
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <SlidersHorizontal size={16} className="text-slate-400" />
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-slate-300 rounded-lg text-sm px-3 py-2 outline-none cursor-pointer bg-white text-slate-600 font-medium focus:border-[#00B5B5] transition"
            >
              <option value="">Wszystkie kolejki</option>
              {statuses.map(s => (
                <option key={s.id} value={s.id}>{s.nazwa}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 ml-2 cursor-pointer group bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-100 transition">
            <input 
              type="checkbox" 
              checked={showResolved} 
              onChange={(e) => setShowResolved(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#00B5B5] focus:ring-[#00B5B5] cursor-pointer" 
            />
            <span className="text-[13px] font-bold text-slate-600 group-hover:text-slate-800 select-none">
              Pokaż rozwiązane / archiwalne
            </span>
          </label>
        </div>

        <button className="flex items-center gap-2 bg-[#11282D] text-white px-5 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition whitespace-nowrap">
          <Plus size={16} /> Nowe zgłoszenie
        </button>
      </div>

      {/* SIATKA ZGŁOSZEŃ */}
      {isLoading ? (
        <div className="p-12 flex justify-center flex-col items-center gap-4 text-slate-400">
          <Loader2 className="animate-spin w-8 h-8 text-[#00B5B5]" />
          <span className="text-sm font-bold">Ładowanie bazy serwisu...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filteredTickets.map((ticket) => {
            const isResolved = !!ticket.data_rozwiazania;
            const sprzet = ticket.egzemplarz;
            const sprzetName = sprzet ? `${sprzet.model?.nazwa} #${sprzet.numer_urzadzenia || sprzet.sn || 'Brak SN'}` : 'Zgłoszenie bez powiązanego sprzętu';
            const reporterName = ticket.zglosil ? `${ticket.zglosil.imie} ${ticket.zglosil.nazwisko?.charAt(0)}.` : 'Nieznany';
            const resolverName = ticket.rozwiazal ? `${ticket.rozwiazal.imie} ${ticket.rozwiazal.nazwisko?.charAt(0)}.` : '-';
            const statusStyle = isResolved ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : getServiceStatusColor(ticket.status?.nazwa, ticket.status?.kolor);

            return (
              <div 
                key={ticket.id}
                onClick={() => router.push(`/dashboard/service/${ticket.id}`)}
                className={`bg-white border-2 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between min-h-[170px] relative overflow-hidden group
                  ${isResolved ? 'border-emerald-100 hover:border-emerald-300' : 'border-slate-100 hover:border-[#00B5B5]/40'}
                `}
              >
                {/* Wstążka dla rozwiązanych */}
                {isResolved && (
                  <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-xl">
                    <div className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider py-1 px-8 shadow-sm transform rotate-45 translate-x-3 translate-y-3 flex justify-center">
                      Gotowe
                    </div>
                  </div>
                )}

                <div className="z-10 pr-8">
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-xl flex items-center justify-center ${isResolved ? 'bg-emerald-100 text-emerald-600' : 'bg-sky-50 text-[#00B5B5]'}`}>
                      {isResolved ? <CheckCircle2 size={16} /> : <Wrench size={16} />}
                    </div>
                    {ticket.status && !isResolved && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusStyle}`}>
                        {ticket.status.nazwa}
                      </span>
                    )}
                  </div>
                  <h3 className={`text-[15px] font-black mb-1 line-clamp-2 ${isResolved ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
                    {ticket.tytul}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 truncate">{sprzetName}</p>
                </div>

                <div className={`rounded-xl p-3 mt-4 text-[11px] font-semibold flex flex-col gap-1 border ${isResolved ? 'bg-emerald-50/50 border-emerald-100/50 text-emerald-800/70' : 'bg-slate-50 border-slate-100/50 text-slate-500'}`}>
                  <div className="flex justify-between">
                    <span>Zgłosił: <span className="font-bold">{reporterName}</span></span>
                    <span>{formatRelativeTime(ticket.data_zgloszenia)}</span>
                  </div>
                  {isResolved && (
                    <div className="flex justify-between pt-1 mt-1 border-t border-emerald-100">
                      <span>Rozwiązał: <span className="font-bold">{resolverName}</span></span>
                      <span>{formatRelativeTime(ticket.data_rozwiazania)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Puste stany */}
      {!isLoading && tickets.length > 0 && filteredTickets.length === 0 && (
        <div className="text-center py-20 text-slate-400 font-semibold bg-white border border-slate-200 rounded-2xl border-dashed">
          Brak zgłoszeń spełniających wybrane kryteria wyszukiwania.
        </div>
      )}

      {!isLoading && tickets.length === 0 && (
        <div className="text-center py-20 text-slate-400 font-semibold bg-white border border-slate-200 rounded-2xl border-dashed">
          Czysto! Brak jakichkolwiek zgłoszeń serwisowych w systemie.
        </div>
      )}
    </div>
  );
}