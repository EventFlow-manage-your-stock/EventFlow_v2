'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  ChevronRight, ArrowLeft, Building2, MapPin, Phone, Mail, 
  CreditCard, Edit2, Trash2, Save, Loader2, X, Plus, Calendar, DollarSign, Settings 
} from 'lucide-react';
import { api } from '../../../../lib/api';

export default function CrmDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = params.id === 'new';

  const [client, setClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isEditMode, setIsEditMode] = useState(isNew || searchParams.get('edit') === 'true');
  const [activeTab, setActiveTab] = useState('kontakty');
  const [projectTab, setProjectTab] = useState('wydarzenia');

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (!isNew) fetchClient();
  }, [params.id]);

  const fetchClient = async () => {
    try {
      const res = await api.get(`/api/crm/kontrahenci/${params.id}`);
      setClient(res.data);
      reset(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = {
        ...data,
        czy_klient: !!data.czy_klient,
        czy_dostawca: !!data.czy_dostawca
      };

      if (isNew) {
        const res = await api.post('/api/crm/kontrahenci', payload);
        router.push(`/dashboard/crm/${res.data.id}`);
      } else {
        await api.put(`/api/crm/kontrahenci/${params.id}`, payload);
        setIsEditMode(false);
        fetchClient();
      }
    } catch (error) {
      console.error(error);
      alert('Błąd zapisu kontrahenta');
    }
  };

  const handleDelete = async () => {
    if (confirm('Czy na pewno usunąć tego kontrahenta?')) {
      await api.delete(`/api/crm/kontrahenci/${params.id}`);
      router.push('/dashboard/crm');
    }
  };

  if (isLoading) return <div className="p-12 flex justify-center text-slate-500"><Loader2 className="animate-spin w-8 h-8"/></div>;

  return (
    <div className="flex h-full flex-col bg-slate-50 overflow-y-auto custom-scrollbar">
      
      {/* BREADCRUMBS & HEADER */}
      <div className="flex items-center px-6 py-4 bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/crm')} className="text-slate-400 hover:text-[#00B5B5] transition">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center text-sm text-slate-500 gap-2">
            <span className="cursor-pointer hover:text-[#00B5B5]" onClick={() => router.push('/dashboard')}>Kokpit</span> <ChevronRight size={14} />
            <span className="cursor-pointer hover:text-[#00B5B5]" onClick={() => router.push('/dashboard/crm')}>Kontrahenci</span> <ChevronRight size={14} />
            <span className="font-bold text-[#00B5B5] border-b-2 border-[#00B5B5] pb-0.5">{isNew ? 'Nowy kontrahent' : client?.nazwa}</span>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-[1600px] w-full mx-auto space-y-6">
        
        {/* UPPER BUTTONS */}
        <div className="flex gap-3 mb-2">
          {!isEditMode ? (
            <button onClick={() => setIsEditMode(true)} className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition shadow-sm">
              <Edit2 size={16} /> Edycja
            </button>
          ) : (
             <button onClick={() => isNew ? router.push('/dashboard/crm') : setIsEditMode(false)} className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 transition shadow-sm">
               <X size={16} /> Anuluj edycję
             </button>
          )}
          {!isNew && (
            <button onClick={handleDelete} className="flex items-center gap-2 px-5 py-2 bg-white border border-red-200 text-red-500 font-bold rounded-lg hover:bg-red-50 transition shadow-sm">
              <Trash2 size={16} /> Usuń
            </button>
          )}
        </div>

        {/* MAIN CARDS */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* LEWA STRONA - DANE FIRMY */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
               {isEditMode ? (
                 <input type="text" {...register('nazwa')} placeholder="Pełna nazwa firmy" className="w-full text-lg font-black text-slate-800 bg-white border border-slate-300 px-3 py-2 rounded outline-none focus:border-[#00B5B5]" />
               ) : (
                 <h2 className="text-lg font-black text-[#00B5B5] flex items-center gap-3 uppercase tracking-wide">
                   {client?.nazwa}
                 </h2>
               )}
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Adres</span>
                  {isEditMode ? (
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" {...register('ulica')} placeholder="Ulica i nr" className="col-span-2 px-3 py-1.5 text-sm border border-slate-300 rounded outline-none focus:border-[#00B5B5]" />
                      <input type="text" {...register('kod_pocztowy')} placeholder="Kod pocztowy" className="px-3 py-1.5 text-sm border border-slate-300 rounded outline-none focus:border-[#00B5B5]" />
                      <input type="text" {...register('miasto')} placeholder="Miasto" className="px-3 py-1.5 text-sm border border-slate-300 rounded outline-none focus:border-[#00B5B5]" />
                    </div>
                  ) : (
                    <span className="text-sm font-medium text-slate-700">{client?.ulica || '-'}, {client?.kod_pocztowy} {client?.miasto}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone size={18} className="text-slate-400" />
                <div className="flex-1">
                   <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Telefon</span>
                   {isEditMode ? <input type="text" {...register('telefon')} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded outline-none focus:border-[#00B5B5]" /> : <span className="text-sm font-medium text-slate-700">{client?.telefon || '-'}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail size={18} className="text-slate-400" />
                <div className="flex-1">
                   <span className="text-xs font-bold text-slate-400 uppercase block mb-1">E-mail</span>
                   {isEditMode ? <input type="email" {...register('email')} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded outline-none focus:border-[#00B5B5]" /> : <span className="text-sm font-medium text-sky-600">{client?.email || '-'}</span>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 size={18} className="text-slate-400" />
                <div className="flex-1">
                   <span className="text-xs font-bold text-slate-400 uppercase block mb-1">NIP</span>
                   {isEditMode ? <input type="text" {...register('nip')} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded outline-none focus:border-[#00B5B5]" /> : <span className="text-sm font-medium text-slate-700 font-mono">{client?.nip || '-'}</span>}
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
                <CreditCard size={18} className="text-slate-400 mt-0.5" />
                <div className="flex-1">
                   <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Nr konta bankowego</span>
                   {isEditMode ? <input type="text" {...register('nr_konta')} placeholder="PL..." className="w-full px-3 py-1.5 text-sm font-mono border border-slate-300 rounded outline-none focus:border-[#00B5B5]" /> : <span className="text-sm font-medium text-slate-700 font-mono">{client?.nr_konta || '-'}</span>}
                </div>
              </div>

              {isEditMode && (
                <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 mt-4">
                   <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 border border-slate-200 rounded">
                     <input type="checkbox" {...register('czy_klient')} className="w-4 h-4 text-[#00B5B5] focus:ring-[#00B5B5]" />
                     <span className="text-sm font-bold text-slate-700">To jest Klient</span>
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-2 border border-slate-200 rounded">
                     <input type="checkbox" {...register('czy_dostawca')} className="w-4 h-4 text-[#00B5B5] focus:ring-[#00B5B5]" />
                     <span className="text-sm font-bold text-slate-700">To jest Dostawca sprzętu</span>
                   </label>
                </div>
              )}

              {isEditMode && (
                <div className="pt-4 flex justify-end">
                  <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} className="flex items-center gap-2 bg-[#00B5B5] text-white px-8 py-2.5 rounded-lg font-bold shadow-md hover:bg-teal-400 transition">
                    {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Zapisz dane
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* PRAWA STRONA - NOTATKI I STATYSTYKI (Placeholder / Przestrzeń z makiety) */}
          <div className="bg-slate-50/50 border border-slate-200 border-dashed rounded-2xl p-6 flex flex-col justify-center items-center text-slate-400">
            <span className="text-sm font-bold">Wolna przestrzeń na dashboard klienta</span>
            <span className="text-xs">Np. podsumowanie finansowe, scoring, notatki wewnętrzne CRM.</span>
          </div>

        </div>

        {/* DOLNA SEKCJA - ZAKŁADKI KONTATKY I PROJEKTY */}
        {!isNew && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6">
            <div className="flex border-b border-slate-200 px-6">
              <button onClick={() => setActiveTab('kontakty')} className={`px-4 py-4 text-sm font-bold transition border-b-2 ${activeTab === 'kontakty' ? 'border-[#00B5B5] text-[#00B5B5]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Kontakty</button>
              <button onClick={() => setActiveTab('projekty')} className={`px-4 py-4 text-sm font-bold transition border-b-2 ${activeTab === 'projekty' ? 'border-[#00B5B5] text-[#00B5B5]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Projekty (Wydarzenia)</button>
            </div>

            <div className="p-6">
              {activeTab === 'kontakty' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <button className="flex items-center gap-2 bg-slate-50 text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-100 transition shadow-sm">
                      <Plus size={16} /> Dodaj kontakt
                    </button>
                    <button className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-2 border border-slate-200 px-3 py-1.5 rounded"><Settings size={14}/> Wyświetl wszystko</button>
                  </div>
                  
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="p-3 w-10">#</th>
                          <th className="p-3">Nazwisko</th>
                          <th className="p-3">Imię</th>
                          <th className="p-3">Telefon</th>
                          <th className="p-3">Adres e-mail</th>
                          <th className="p-3">Stanowisko</th>
                          <th className="p-3 text-right">Akcje</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {client?.kontakty?.map((k: any, idx: number) => (
                          <tr key={k.id} className="hover:bg-slate-50 transition group">
                            <td className="p-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-700">{k.nazwisko}</td>
                            <td className="p-3 text-slate-600">{k.imie}</td>
                            <td className="p-3 font-mono text-slate-600">{k.telefon || '-'}</td>
                            <td className="p-3 text-sky-600 hover:underline cursor-pointer">{k.email || '-'}</td>
                            <td className="p-3 text-slate-500 text-xs">{k.stanowisko || '-'}</td>
                            <td className="p-3 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                               <button className="text-slate-400 hover:text-sky-600"><Edit2 size={16}/></button>
                               <button className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </td>
                          </tr>
                        ))}
                        {(!client?.kontakty || client.kontakty.length === 0) && (
                          <tr><td colSpan={7} className="p-8 text-center text-slate-400">Brak dodanych osób kontaktowych.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'projekty' && (
                <div className="space-y-4">
                  <div className="flex gap-4 border-b border-slate-100 mb-4">
                    <button onClick={() => setProjectTab('wydarzenia')} className={`pb-2 text-sm font-bold ${projectTab === 'wydarzenia' ? 'text-[#00B5B5] border-b-2 border-[#00B5B5]' : 'text-slate-400 hover:text-slate-700'}`}>Wydarzenia</button>
                    <button onClick={() => setProjectTab('wypozyczenia')} className={`pb-2 text-sm font-bold ${projectTab === 'wypozyczenia' ? 'text-[#00B5B5] border-b-2 border-[#00B5B5]' : 'text-slate-400 hover:text-slate-700'}`}>Wypożyczenia</button>
                  </div>

                  {projectTab === 'wydarzenia' && (
                    <div className="overflow-x-auto border border-slate-200 rounded-lg">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                          <tr>
                            <th className="p-3 w-10">#</th>
                            <th className="p-3">Nazwa wydarzenia</th>
                            <th className="p-3">EventManager</th>
                            <th className="p-3">Od - do</th>
                            <th className="p-3 text-right">Wartość (Budżet)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {client?.wydarzenia?.map((w: any, idx: number) => (
                            <tr key={w.id} onClick={() => router.push(`/dashboard/events/${w.id}`)} className="hover:bg-slate-50 transition cursor-pointer">
                              <td className="p-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                              <td className="p-3 font-bold text-sky-600 hover:text-[#00B5B5] transition">{w.nazwa}</td>
                              <td className="p-3 text-slate-600">{w.manager ? `${w.manager.imie} ${w.manager.nazwisko}` : '-'}</td>
                              <td className="p-3 text-slate-500 font-mono text-xs">
                                {w.data_start ? new Date(w.data_start).toLocaleDateString() : '-'} <br/>
                                {w.data_koniec ? new Date(w.data_koniec).toLocaleDateString() : '-'}
                              </td>
                              <td className="p-3 text-right font-bold text-slate-700">{w.budzet_netto ? `${Number(w.budzet_netto).toLocaleString('pl-PL')} zł` : '0,00 zł'}</td>
                            </tr>
                          ))}
                          {(!client?.wydarzenia || client.wydarzenia.length === 0) && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">Ten klient nie ma jeszcze powiązanych wydarzeń.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {projectTab === 'wypozyczenia' && (
                    <div className="p-8 text-center text-slate-400 text-sm border border-slate-200 border-dashed rounded-lg bg-slate-50/50">
                      Moduł wypożyczeń (Dry Hire) w przygotowaniu.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}