'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus, DownloadCloud, Search, CheckCircle2, Building2, Loader2, Edit2, Trash2 } from 'lucide-react';
import { useCrmStore } from '../../../store/crm.store';
import { api } from '../../../lib/api';

export default function CrmListPage() {
  const router = useRouter();
  const { clients, fetchClients, isLoading } = useCrmStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchClients(searchTerm);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Czy na pewno chcesz przenieść kontrahenta do archiwum?')) {
      await api.delete(`/api/crm/kontrahenci/${id}`);
      fetchClients(searchTerm);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in-up">
      
      {/* BREADCRUMBS */}
      <div className="flex items-center text-sm text-slate-500 gap-2 mb-2 mt-4">
        <span className="cursor-pointer hover:text-[#00B5B5] font-semibold" onClick={() => router.push('/dashboard')}>Kokpit</span> 
        <ChevronRight size={14} />
        <span className="font-bold text-[#00B5B5] border-b-2 border-[#00B5B5] pb-0.5">Kontrahenci</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* UPPER TOOLBAR */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => router.push('/dashboard/crm/new')}
              className="flex items-center gap-2 bg-[#00B5B5] text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-teal-400 transition"
            >
              <Plus size={16} /> Dodaj
            </button>
            <button className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
              <DownloadCloud size={16} /> Import
            </button>
          </div>
          <div className="text-sm font-bold text-slate-400">
            Liczba wyników: {clients.length}
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center"><input type="checkbox" className="rounded border-slate-300 cursor-pointer text-[#00B5B5]" /></th>
                <th className="p-3 w-12 font-bold text-slate-500 text-xs">#</th>
                <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Logo / Nazwa firmy</th>
                <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Miasto / Adres</th>
                <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Telefon</th>
                <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">NIP</th>
                <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider">E-mail</th>
                <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Klient</th>
                <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Dostawca</th>
                <th className="p-3 font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Akcje</th>
              </tr>
              <tr className="bg-white border-t border-slate-100">
                <th className="p-2"></th>
                <th className="p-2"></th>
                <th className="p-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 border border-slate-300 rounded text-xs font-normal outline-none focus:border-[#00B5B5] bg-slate-50 focus:bg-white transition" 
                      placeholder="Szukaj po nazwie, NIP lub e-mail..."
                    />
                  </div>
                </th>
                <th className="p-2" colSpan={7}></th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="p-16 text-center text-slate-400">
                    <Loader2 className="animate-spin w-8 h-8 mx-auto mb-3 text-[#00B5B5]" />
                    Pobieranie bazy kontrahentów...
                  </td>
                </tr>
              ) : clients.length > 0 ? (
                clients.map((client, idx) => (
                  <tr 
                    key={client.id} 
                    className="hover:bg-sky-50/50 transition cursor-pointer group"
                    onClick={() => router.push(`/dashboard/crm/${client.id}`)}
                  >
                    <td className="p-3 text-center"><input type="checkbox" className="rounded border-slate-300 text-[#00B5B5]" onClick={e => e.stopPropagation()} /></td>
                    <td className="p-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"><Building2 size={16}/></div>
                        <span className="font-bold text-sky-600 group-hover:text-[#00B5B5] transition">{client.nazwa}</span>
                      </div>
                    </td>
                    <td className="p-3 text-slate-600">
                      <div className="font-medium text-slate-800">{client.miasto || '-'}</div>
                      <div className="text-xs text-slate-400">{client.ulica || ''} {client.kod_pocztowy || ''}</div>
                    </td>
                    <td className="p-3 text-slate-600 font-mono text-xs">{client.telefon || '-'}</td>
                    <td className="p-3 text-slate-700 font-mono font-semibold">{client.nip || '-'}</td>
                    <td className="p-3 text-slate-600">{client.email || '-'}</td>
                    <td className="p-3 text-center">{client.czy_klient ? <span className="text-emerald-500 font-bold">Tak</span> : '-'}</td>
                    <td className="p-3 text-center">{client.czy_dostawca ? <span className="text-blue-500 font-bold">Tak</span> : '-'}</td>
                    <td className="p-3 flex items-center justify-end gap-2 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => {e.stopPropagation(); router.push(`/dashboard/crm/${client.id}?edit=true`);}} className="p-1.5 hover:text-[#00B5B5] hover:bg-sky-50 rounded"><Edit2 size={16}/></button>
                      <button onClick={(e) => handleDelete(client.id, e)} className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400 font-medium bg-slate-50/50">
                    Brak wyników do wyświetlenia. Spróbuj zmienić parametry wyszukiwania.
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