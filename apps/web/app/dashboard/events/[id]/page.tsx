'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  ChevronRight, Save, Trash2, CalendarDays, MapPin, 
  Battery, Weight, Box, Eye, Plus, MessageSquare, 
  CheckSquare, FileText, Truck, Wrench, FileArchive, 
  Users, History, Clock, DollarSign, Bell, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { api } from '../../../../lib/api'; // POPRAWIONY IMPORT NAZWANY

const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'zadania', label: 'Zadania', icon: CheckSquare },
  { id: 'szczegoly', label: 'Szczegóły', icon: FileText },
  { id: 'sprzet', label: 'Sprzęt', icon: Box },
  { id: 'sprzet_zew', label: 'Sprzęt zewnętrzny', icon: Wrench },
  { id: 'zalaczniki', label: 'Załączniki', icon: FileArchive },
  { id: 'oferty', label: 'Oferty', icon: DollarSign },
  { id: 'ekipa', label: 'Ekipa', icon: Users },
  { id: 'flota', label: 'Flota', icon: Truck },
  { id: 'historia_przebiegow', label: 'Historia przebiegów', icon: History },
  { id: 'powiadomienia', label: 'Powiadomienia', icon: Bell },
  { id: 'godziny_pracy', label: 'Godziny pracy', icon: Clock },
  { id: 'finanse', label: 'Finanse', icon: DollarSign },
  { id: 'historia', label: 'Historia', icon: History },
];

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';

  const [activeTab, setActiveTab] = useState('szczegoly');
  const [eventData, setEventData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  const [statusyWydarzen, setStatusyWydarzen] = useState([]);
  const [statusyMagazynowe, setStatusyMagazynowe] = useState([]);
  const [statusyKsiegowe, setStatusyKsiegowe] = useState([]);
  const [kontrahenci, setKontrahenci] = useState([]);
  const [miejsca, setMiejsca] = useState([]);
  const [pracownicy, setPracownicy] = useState([]);
  
  const [isLoading, setIsLoading] = useState(!isNew);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    fetchDictionaries();
    if (!isNew) {
      fetchEventData();
    }
  }, [params.id]);

  const fetchDictionaries = async () => {
    try {
      const [stWyd, stMag, stKsieg, ktRes, mjRes, userRes] = await Promise.all([
        api.get('/api/slowniki/statusy-wydarzenia'),
        api.get('/api/slowniki/statusy-magazynowe'),
        api.get('/api/slowniki/statusy-ksiegowe'),
        api.get('/api/slowniki/kontrahenci'),
        api.get('/api/slowniki/miejsca'),
        api.get('/api/slowniki/uzytkownicy'),
      ]);
      setStatusyWydarzen(stWyd.data);
      setStatusyMagazynowe(stMag.data);
      setStatusyKsiegowe(stKsieg.data);
      setKontrahenci(ktRes.data);
      setMiejsca(mjRes.data);
      setPracownicy(userRes.data);
    } catch (error) {
      console.error('Błąd pobierania słowników:', error);
    }
  };

  const fetchEventData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/wydarzenia/${params.id}`);
      setEventData(res.data);
      setHistory(res.data.historia || []);
      
      reset({
        nazwa: res.data.nazwa,
        data_start: res.data.data_start ? format(new Date(res.data.data_start), "yyyy-MM-dd'T'HH:mm") : '',
        data_koniec: res.data.data_koniec ? format(new Date(res.data.data_koniec), "yyyy-MM-dd'T'HH:mm") : '',
        miesiac_ksiegowania: res.data.miesiac_ksiegowania || '',
        id_statusu_wydarzenia: res.data.id_statusu_wydarzenia || '',
        id_statusu_magazynowego: res.data.id_statusu_magazynowego || '',
        id_statusu_ksiegowego: res.data.id_statusu_ksiegowego || '',
        id_kontrahenta: res.data.id_kontrahenta || '',
        id_miejsca: res.data.id_miejsca || '',
        id_managera: res.data.id_managera || '',
        uwagi: res.data.uwagi || '',
      });
    } catch (error) {
      console.error('Błąd pobierania wydarzenia:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const cleanNumber = (val: any) => (val === "" || val === undefined || val === null) ? null : Number(val);

      const payload = {
        nazwa: data.nazwa,
        uwagi: data.uwagi || null,
        miesiac_ksiegowania: data.miesiac_ksiegowania || null,
        data_start: data.data_start ? new Date(data.data_start).toISOString() : null,
        data_koniec: data.data_koniec ? new Date(data.data_koniec).toISOString() : null,
        id_statusu_wydarzenia: cleanNumber(data.id_statusu_wydarzenia),
        id_statusu_magazynowego: cleanNumber(data.id_statusu_magazynowego),
        id_statusu_ksiegowego: cleanNumber(data.id_statusu_ksiegowego),
        id_kontrahenta: cleanNumber(data.id_kontrahenta),
        id_miejsca: cleanNumber(data.id_miejsca),
        id_managera: cleanNumber(data.id_managera),
      };

      if (isNew) {
        const res = await api.post('/api/wydarzenia', payload);
        router.push(`/dashboard/events/${res.data.id}`);
      } else {
        await api.put(`/api/wydarzenia/${params.id}`, payload);
        fetchEventData(); 
      }
    } catch (error) {
      console.error('Błąd zapisu:', error);
    }
  };

  const handleDelete = async () => {
    if (confirm('Czy na pewno chcesz usunąć to wydarzenie?')) {
      try {
        await api.delete(`/api/wydarzenia/${params.id}`);
        router.push('/dashboard/calendar');
      } catch (error) {
        console.error('Błąd usuwania:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mr-2" /> Ładowanie danych wydarzenia...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-slate-50 relative overflow-y-auto">
      
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center text-sm text-slate-500 gap-2">
          <span className="cursor-pointer hover:text-blue-600 transition" onClick={() => router.push('/dashboard')}>Kokpit</span>
          <ChevronRight size={14} />
          <span className="cursor-pointer hover:text-blue-600 transition" onClick={() => router.push('/dashboard/calendar')}>Wydarzenia</span>
          <ChevronRight size={14} />
          <span className="font-semibold text-slate-800">
            {isNew ? 'Nowe Wydarzenie' : eventData?.nazwa}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {!isNew && (
            <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition">
              <Trash2 size={16} /> Usuń
            </button>
          )}
          <button 
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
          </button>
        </div>
      </div>

      <form className="flex-1 p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        <div className="xl:col-span-4 bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-5">
          <div>
            <div className="flex justify-between items-start mb-2">
              <input 
                {...register('nazwa', { required: true })} 
                placeholder="Podaj tytuł wydarzenia"
                className="text-xl font-bold text-slate-800 border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none w-full bg-transparent transition"
              />
              {!isNew && (
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded whitespace-nowrap ml-4">
                  {eventData?.numer}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-2">
              <CalendarDays size={16} />
              <input type="datetime-local" {...register('data_start')} className="outline-none bg-transparent hover:bg-slate-50 rounded p-1 cursor-pointer" />
              <span>-</span>
              <input type="datetime-local" {...register('data_koniec')} className="outline-none bg-transparent hover:bg-slate-50 rounded p-1 cursor-pointer" />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="text-xs text-slate-400 font-semibold uppercase mb-1 block">Miesiąc księgowania</label>
            <input {...register('miesiac_ksiegowania')} placeholder="np. 07.2026" className="w-full text-sm border border-slate-200 rounded p-2 focus:border-blue-500 outline-none hover:bg-slate-50 transition" />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="text-xs text-slate-400 font-semibold uppercase mb-1 flex items-center justify-between">
              Klient <Eye size={14} className="text-blue-500 cursor-pointer hover:text-blue-700"/>
            </label>
            <select {...register('id_kontrahenta')} className="w-full text-sm font-medium text-blue-600 outline-none border border-slate-200 rounded p-2 focus:border-blue-500 cursor-pointer">
              <option value="">Wybierz klienta...</option>
              {kontrahenci.map((k: any) => <option key={k.id} value={k.id}>{k.nazwa}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase mb-1 block">Uwagi ogólne</label>
            <textarea {...register('uwagi')} rows={3} className="w-full text-sm border border-slate-200 rounded p-2 focus:border-blue-500 outline-none resize-none hover:bg-slate-50 transition" placeholder="Wprowadź uwagi dla tego wydarzenia..."></textarea>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <label className="text-xs text-slate-400 font-semibold uppercase mb-1 flex items-center gap-1">
              <MapPin size={14}/> Dojazd (Miejsce wydarzenia)
            </label>
            <select {...register('id_miejsca')} className="w-full text-sm text-slate-700 outline-none border border-slate-200 rounded p-2 focus:border-blue-500 cursor-pointer">
              <option value="">Wybierz miejsce...</option>
              {miejsca.map((m: any) => <option key={m.id} value={m.id}>{m.nazwa}</option>)}
            </select>
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-500 uppercase">Status:</span>
              <select {...register('id_statusu_wydarzenia')} className="text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded p-1 outline-none cursor-pointer">
                <option value="">Wybierz...</option>
                {statusyWydarzen.map((s: any) => <option key={s.id} value={s.id}>{s.nazwa}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => setActiveTab('historia')} className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 hover:bg-emerald-100 transition">
              <History size={14} /> Historia
            </button>
          </div>

          <div className="border-t border-slate-100 pt-4">
             <label className="text-xs text-slate-400 font-semibold uppercase mb-3 block">Boczne etapy:</label>
             <div className="flex flex-col gap-3">
               <div className="flex items-center justify-between">
                 <span className="text-sm text-slate-600 font-medium">Magazyn:</span>
                 <select {...register('id_statusu_magazynowego')} className="text-sm border border-slate-200 rounded p-1 w-2/3 outline-none cursor-pointer">
                   <option value="">Status magazynowy...</option>
                   {statusyMagazynowe.map((s: any) => <option key={s.id} value={s.id}>{s.nazwa}</option>)}
                 </select>
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-sm text-slate-600 font-medium">Księgowość:</span>
                 <select {...register('id_statusu_ksiegowego')} className="text-sm border border-slate-200 rounded p-1 w-2/3 outline-none cursor-pointer">
                   <option value="">Status fakturowania...</option>
                   {statusyKsiegowe.map((s: any) => <option key={s.id} value={s.id}>{s.nazwa}</option>)}
                 </select>
               </div>
             </div>
          </div>
          
          {!isNew && eventData?.tworca && (
            <div className="border-t border-slate-100 pt-4 flex flex-col items-end text-xs text-slate-400">
               <span>Wydarzenie utworzone przez:</span>
               <span className="font-semibold text-slate-600">{eventData.tworca.imie} {eventData.tworca.nazwisko}</span>
            </div>
          )}
        </div>

        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
             <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-4">
               <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400 border border-slate-200">
                 {eventData?.manager ? eventData.manager.imie[0] + eventData.manager.nazwisko[0] : '?'}
               </div>
               <div className="flex-1">
                 <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">EventManager (Kierownik)</label>
                 <select {...register('id_managera')} className="w-full text-sm font-semibold text-slate-800 outline-none border-b border-slate-200 pb-1 focus:border-blue-500 bg-transparent cursor-pointer">
                    <option value="">Brak przypisanego kierownika</option>
                    {pracownicy.map((p: any) => <option key={p.id} value={p.id}>{p.imie} {p.nazwisko}</option>)}
                 </select>
               </div>
             </div>
             
             <div className="space-y-5">
                <div className="flex items-center justify-between text-sm text-slate-600 border-b border-dashed border-slate-100 pb-2">
                  <div className="flex items-center gap-2"><Weight size={16} className="text-emerald-500"/> Waga sprzętu:</div>
                  <div className="font-semibold">0 kg <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded ml-2">Status: Ok</span></div>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600 border-b border-dashed border-slate-100 pb-2">
                  <div className="flex items-center gap-2"><Box size={16} className="text-emerald-500"/> Objętość sprzętu:</div>
                  <div className="font-semibold">0.0 m³ <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded ml-2">Status: Ok</span></div>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600 border-b border-dashed border-slate-100 pb-2">
                  <div className="flex items-center gap-2"><Battery size={16} className="text-slate-400"/> Pobór prądu sprzętu:</div>
                  <div className="font-semibold">0 W</div>
                </div>
             </div>
          </div>
        </div>

        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[160px]">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Ekipa</h3>
            {eventData?.ekipa?.length > 0 ? (
               <div className="flex flex-col gap-2">
                 {eventData.ekipa.map((pracownik: any) => (
                   <div key={pracownik.id} className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 font-medium">
                     {pracownik.uzytkownik?.imie} {pracownik.uzytkownik?.nazwisko} <span className="text-[11px] text-slate-400 ml-1 font-normal uppercase">[{pracownik.rola_w_wydarzeniu}]</span>
                   </div>
                 ))}
               </div>
            ) : (
               <div className="text-sm text-slate-400 text-center mt-6">Brak zdefiniowanych osób do obsługi tego wydarzenia.</div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-400 uppercase">Harmonogram</h3>
              <button type="button" className="text-xs font-medium text-emerald-600 flex items-center gap-1 hover:bg-emerald-50 px-2 py-1 rounded transition border border-transparent hover:border-emerald-200">
                <Plus size={14} /> Dodaj etap
              </button>
            </div>
            
            {eventData?.etapy?.length > 0 ? (
               <div className="space-y-3">
                 {eventData.etapy.map((etap: any) => (
                   <div key={etap.id} className="border border-slate-100 rounded-lg p-3 text-sm text-slate-600 flex items-center justify-between bg-slate-50 hover:shadow-sm transition cursor-grab">
                      <div>
                        <span className="font-bold">{etap.nazwa}</span>
                      </div>
                      <div className="font-medium text-[11px] text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded">
                        {format(new Date(etap.data_start), "dd.MM HH:mm")} {'>'} {format(new Date(etap.data_koniec), "dd.MM HH:mm")}
                      </div>
                   </div>
                 ))}
               </div>
            ) : (
              <div className="border border-dashed border-slate-200 rounded-lg p-6 text-sm text-slate-400 flex flex-col items-center justify-center bg-slate-50/50 mt-4 text-center">
                 <span>Brak zdefiniowanych etapów zlecenia. <br/>Możesz je dodać u góry.</span>
              </div>
            )}
          </div>
        </div>
      </form>

      <div className="bg-white border-t border-slate-200 shadow-sm z-10 relative">
        <div className="flex overflow-x-auto custom-scrollbar px-6">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-1.5 min-w-[105px] py-3 border-b-2 transition-colors ${
                  isActive ? 'border-blue-600 text-blue-600 bg-blue-50/30' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-50 p-6 min-h-[300px]">
         {activeTab === 'szczegoly' && (
           <div className="text-center text-slate-400 mt-10 text-sm">Wybierz szczegółowe sekcje do edycji z górnego formularza. Zapisz zmiany zielonym przyciskiem na górnej listwie.</div>
         )}
         
         {activeTab === 'historia' && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 max-w-5xl mx-auto">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><History size={20} className="text-blue-500"/> Historia modyfikacji (Audyt)</h3>
              {history.length > 0 ? (
                <div className="space-y-6">
                  {history.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start border-b border-slate-50 pb-4">
                      <div className="bg-slate-100 text-slate-500 p-2 rounded-lg mt-1 border border-slate-200 shadow-sm">
                        <History size={16} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded border border-slate-100">
                          <p className="text-sm font-bold text-slate-700">
                            {item.akcja} <span className="font-normal text-slate-400 mx-1">dokonana przez</span> <span className="text-blue-600">{item.uzytkownik ? `${item.uzytkownik.imie} ${item.uzytkownik.nazwisko}` : 'System'}</span>
                          </p>
                          <span className="text-xs font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">{format(new Date(item.data_utworzenia), 'dd MMMM yyyy, HH:mm', { locale: pl })}</span>
                        </div>
                        {item.nowa_wartosc && (
                           <pre className="text-[11px] font-mono bg-slate-800 p-4 mt-3 rounded-lg border border-slate-700 text-emerald-400 max-w-4xl overflow-x-auto whitespace-pre-wrap shadow-inner">
                             {JSON.stringify(JSON.parse(item.nowa_wartosc), null, 2)}
                           </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-slate-200 rounded-lg p-8 text-center bg-slate-50">
                   <History size={32} className="mx-auto text-slate-300 mb-2"/>
                   <p className="text-sm font-medium text-slate-500">Brak zarejestrowanych modyfikacji w historii dla tego wydarzenia.</p>
                </div>
              )}
           </div>
         )}

         {activeTab !== 'historia' && activeTab !== 'szczegoly' && (
           <div className="text-center text-slate-400 mt-10 flex flex-col items-center justify-center gap-2">
             <Box size={32} className="text-slate-200" />
             <span className="text-sm">Zakładka <span className="font-bold uppercase text-slate-600">{activeTab}</span> znajduje się w fazie projektowania.</span>
           </div>
         )}
      </div>
    </div>
  );
}