'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ChevronRight, Wrench, Save, Loader2, Info, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { api } from '../../../../lib/api';
import { useServiceStore } from '../../../../store/serwis.store';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { statuses, fetchStatuses } = useServiceStore();
  
  const [ticket, setTicket] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { register, handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = useForm();
  const isResolvedWatcher = watch('czy_rozwiazane');

  useEffect(() => {
    fetchStatuses();
    fetchTicket();
  }, [params.id]);

  // Automatyczne ustawienie statusu sprzętu na 'Naprawiony', jeśli rozwiązano zgłoszenie
  useEffect(() => {
    if (isResolvedWatcher) {
      setValue('status_serwisowy_sprzetu', 'Naprawiony');
    }
  }, [isResolvedWatcher, setValue]);

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/api/serwis/${params.id}`);
      setTicket(res.data);
      reset({
        tytul: res.data.tytul,
        opis: res.data.opis,
        rozwiazanie: res.data.rozwiazanie,
        id_statusu_serwisu: res.data.id_statusu_serwisu,
        czy_rozwiazane: !!res.data.data_rozwiazania,
        status_serwisowy_sprzetu: res.data.egzemplarz?.status_serwisowy || 'Działa' // Załadowanie obecnego statusu egzemplarza do formularza
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      await api.put(`/api/serwis/${params.id}`, data);
      await fetchTicket();
      router.push('/dashboard/service');
    } catch (error) {
      console.error('Błąd zapisu', error);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center text-slate-500"><Loader2 className="animate-spin w-8 h-8"/></div>;
  if (!ticket) return <div className="p-8 text-red-500 font-bold">Nie znaleziono zgłoszenia</div>;

  const sprzet = ticket.egzemplarz;

  return (
    <div className="flex h-full flex-col bg-slate-50 overflow-y-auto custom-scrollbar">
      
      {/* BREADCRUMBS */}
      <div className="flex items-center px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.push('/dashboard/service')} className="mr-4 text-slate-400 hover:text-sky-600 transition">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center text-sm text-slate-500 gap-2 flex-1">
          <span className="cursor-pointer hover:text-sky-600" onClick={() => router.push('/dashboard')}>Kokpit</span> <ChevronRight size={14} />
          <span className="cursor-pointer hover:text-sky-600" onClick={() => router.push('/dashboard/service')}>Serwis</span> <ChevronRight size={14} />
          <span className="font-bold text-sky-600 pb-0.5 border-b-2 border-sky-600">{ticket.tytul}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 max-w-6xl mx-auto w-full space-y-6">
        
        {/* NAGŁÓWEK */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row justify-between lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-sky-50 text-sky-500 flex justify-center items-center rounded-2xl">
              <Wrench size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 mb-1">Zgłoszenie #{ticket.id}</h1>
              <p className="text-sm font-semibold text-slate-400">
                Utworzono: {new Date(ticket.data_zgloszenia).toLocaleString('pl-PL')}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
             <button type="button" onClick={() => router.push('/dashboard/service')} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition shadow-sm">
               Anuluj
             </button>
             <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-8 py-2.5 bg-[#00B5B5] text-white font-bold rounded-lg hover:bg-teal-400 transition shadow-md disabled:opacity-50">
               {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Zapisz zgłoszenie
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEWA KOLUMNA: INFORMACJE O ZGŁOSZENIU I SPRZĘCIE */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                <Info size={16} className="text-sky-500"/> Urządzenie
              </h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Model</p>
                  <p className="font-semibold text-slate-700 cursor-pointer hover:text-sky-600 transition" onClick={() => router.push(`/dashboard/warehouse/models/${sprzet?.id_modelu}`)}>
                    {sprzet?.model?.nazwa || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Numer boczny / SN</p>
                  <p className="font-mono font-bold text-slate-800">{sprzet?.numer_urzadzenia || sprzet?.sn || '-'}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">Obecny status sprzętu</label>
                  <select 
                    {...register('status_serwisowy_sprzetu')} 
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg focus:border-sky-500 outline-none text-sm bg-white cursor-pointer font-bold shadow-sm"
                  >
                    <option value="Działa" className="text-emerald-600">Działa</option>
                    <option value="Wymaga serwisu (działa)" className="text-amber-600">Wymaga serwisu (działa)</option>
                    <option value="Wymaga serwisu (nie działa)" className="text-red-600">Wymaga serwisu (nie działa)</option>
                    <option value="W serwisie" className="text-sky-600">W serwisie</option>
                    <option value="Naprawiony" className="text-emerald-600">Naprawiony</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
               <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                Osoby
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Zgłaszający</p>
                  <p className="font-semibold text-slate-700">{ticket.zglosil?.imie} {ticket.zglosil?.nazwisko}</p>
                </div>
                {ticket.rozwiazal && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Rozwiązał</p>
                    <p className="font-semibold text-emerald-600">{ticket.rozwiazal?.imie} {ticket.rozwiazal?.nazwisko}</p>
                    <p className="text-xs text-slate-500">{new Date(ticket.data_rozwiazania).toLocaleString('pl-PL')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PRAWA KOLUMNA: EDYCJA SERWISU */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full">
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Tytuł usterki</label>
                  <input type="text" {...register('tytul')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-sky-500 outline-none text-sm font-bold text-slate-800 bg-slate-50 focus:bg-white transition" />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Szczegółowy opis zjawiska</label>
                  <textarea {...register('opis')} rows={4} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:border-sky-500 outline-none text-sm bg-slate-50 focus:bg-white transition resize-none"></textarea>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Status zlecenia</label>
                    <select {...register('id_statusu_serwisu')} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:border-sky-500 outline-none text-sm bg-white font-medium cursor-pointer">
                      <option value="">Wybierz...</option>
                      {statuses.map(s => <option key={s.id} value={s.id}>{s.nazwa}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col justify-end pb-1">
                    <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 border border-slate-200 p-2.5 rounded-lg hover:bg-emerald-50 transition">
                      <div className="relative flex items-center">
                        <input type="checkbox" {...register('czy_rozwiazane')} className="w-5 h-5 opacity-0 absolute cursor-pointer z-10" />
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isResolvedWatcher ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 bg-white'}`}>
                          {isResolvedWatcher && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                      </div>
                      <span className="text-[13px] font-bold text-slate-700 group-hover:text-emerald-700 select-none">Zgłoszenie rozwiązane</span>
                    </label>
                  </div>
                </div>

                <div className={`pt-2 transition-all duration-300 ${isResolvedWatcher ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                  <label className="block text-[13px] font-bold text-emerald-700 mb-1.5">Opis naprawy / Rozwiązanie (Widoczne w historii)</label>
                  <textarea 
                    {...register('rozwiazanie')} 
                    rows={4} 
                    placeholder={isResolvedWatcher ? "Opisz co zostało wymienione lub zrobione..." : "Najpierw zaznacz jako rozwiązane"}
                    className="w-full px-4 py-3 border border-emerald-200 rounded-lg focus:border-emerald-500 outline-none text-sm bg-emerald-50/30 transition resize-none"
                    disabled={!isResolvedWatcher}
                  ></textarea>
                </div>

              </div>

            </div>
          </div>

        </div>
      </form>
    </div>
  );
}