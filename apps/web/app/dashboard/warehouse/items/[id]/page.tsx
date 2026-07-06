'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronRight, Edit2, X as XIcon, PackageOpen, Plus, QrCode, MessageSquare, Loader2, ArrowLeft } from 'lucide-react';
import { api } from '../../../../../lib/api';

export default function ItemDetailsPage() {
  const params = useParams();
  const router = useRouter();
  
  const [item, setItem] = useState<any>(null);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [itemRes, availableRes] = await Promise.all([
        api.get(`/api/magazyn/egzemplarze/${params.id}`),
        api.get(`/api/magazyn/slowniki/dostepne-do-case/${params.id}`)
      ]);
      setItem(itemRes.data);
      setAvailableItems(availableRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (itemIds: number[], action: 'add' | 'remove') => {
    if (itemIds.length === 0) return;
    if (action === 'remove' && itemIds.length > 1 && !confirm('Na pewno chcesz rozpakować cały case?')) return;
    
    setIsProcessing(true);
    try {
      await api.post(`/api/magazyn/egzemplarze/${params.id}/zawartosc`, { itemIds, action });
      await fetchData();
      setSelectedToAdd('');
    } catch (error) {
      console.error('Błąd operacji na case', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickAdd = () => {
    if (!selectedToAdd) return;
    handleAction([Number(selectedToAdd)], 'add');
  };

  const getStatusColor = (status: string) => {
    if (status === 'Działa' || status === 'Naprawiony') return 'bg-emerald-500';
    if (status?.includes('Wymaga') || status === 'W serwisie') return 'bg-red-500';
    return 'bg-slate-400';
  };

  if (isLoading) return <div className="p-8 flex items-center gap-3 text-slate-500"><Loader2 className="animate-spin" /> Ładowanie zawartości...</div>;
  if (!item) return <div className="p-8 text-red-500">Nie znaleziono opakowania.</div>;

  const totalWaga = Number(item.waga || 0) + item.zawartosc_case.reduce((sum: number, el: any) => sum + Number(el.waga || el.model?.waga || 0), 0);
  const totalWartosc = item.zawartosc_case.reduce((sum: number, el: any) => sum + Number(el.cena_zakupu || 0), 0);

  return (
    <div className="flex h-full flex-col bg-slate-50 overflow-y-auto custom-scrollbar">
      
      {/* BREADCRUMBS */}
      <div className="flex items-center px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center text-sm text-slate-500 gap-2 flex-1">
          <span className="cursor-pointer hover:text-sky-600" onClick={() => router.push('/dashboard')}>Kokpit</span> <ChevronRight size={14} />
          <span className="cursor-pointer hover:text-sky-600" onClick={() => router.push('/dashboard/warehouse')}>Opakowania</span> <ChevronRight size={14} />
          <span className="cursor-pointer hover:text-sky-600" onClick={() => router.push(`/dashboard/warehouse/models/${item.id_modelu}`)}>{item.model?.nazwa}</span> <ChevronRight size={14} />
          <span className="font-bold text-sky-600 pb-0.5">{item.nazwa} {item.numer_urzadzenia ? `(zestaw ${item.numer_urzadzenia})` : ''}</span>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* NAGŁÓWEK SZCZEGÓŁÓW (Wzorowany na zdjęciu) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative">
          <div className="absolute top-6 right-6 flex gap-2">
            <button className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"><Edit2 size={16}/></button>
            <button className="w-10 h-10 rounded-full border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50 transition"><XIcon size={16}/></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h2 className="text-sm font-bold text-slate-800 mb-2">{item.nazwa} {item.numer_urzadzenia ? `(zestaw ${item.numer_urzadzenia})` : ''}</h2>
              <div className="text-sm text-slate-600 space-y-1">
                <p>Zawartość: <span className="font-bold text-emerald-600">{item.zawartosc_case.length} szt.</span></p>
                <p>Numery wew.: <span className="text-slate-500">{item.zawartosc_case.map((c: any) => c.numer_urzadzenia || '-').join('/')}</span></p>
                <p>Opis: <span className="text-slate-500">{item.opis || '-'}</span></p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-2">Wymiary [cm]</h3>
              <div className="grid grid-cols-[100px_1fr] gap-1 text-sm text-slate-600">
                <span className="text-right font-semibold pr-2">Szerokość:</span> <span>{item.szerokosc || item.model?.szerokosc || '-'} cm</span>
                <span className="text-right font-semibold pr-2">Wysokość:</span> <span>{item.wysokosc || item.model?.wysokosc || '-'} cm</span>
                <span className="text-right font-semibold pr-2">Głębokość:</span> <span>{item.glebokosc || item.model?.glebokosc || '-'} cm</span>
                <span className="text-right font-semibold pr-2">Waga netto:</span> <span>{item.waga || item.model?.waga || '0'} kg</span>
                <span className="text-right font-bold text-slate-800 pr-2">Z zawartością:</span> <span className="font-bold">{totalWaga.toFixed(2)} kg</span>
                <span className="text-right font-bold text-slate-800 pr-2">Wartość:</span> <span className="font-bold">{totalWartosc.toFixed(2)} PLN</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-2">Magazyny</h3>
              <p className="text-sm text-slate-600"><span className="font-semibold">Magazyn: </span>{item.magazyn?.nazwa || 'Główny'}</p>
              <p className="text-sm text-slate-600"><span className="font-semibold">Miejsce: </span><span className="uppercase">{item.miejsce_w_mag || item.model?.miejsce_w_mag || '-'}</span></p>
            </div>

            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-slate-700 mb-2">Znakowanie:</h3>
              <p className="text-sm text-slate-600 mb-2"><span className="font-semibold">Kod: </span><span className="font-mono">{item.kod_kreskowy || '-'}</span></p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-600">QR code</span>
                <div className="w-16 h-16 bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover opacity-70"></div>
              </div>
            </div>
          </div>
        </div>

        {/* TOOLBAR ZARZĄDZANIA ZAWARTOŚCIĄ */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-300 rounded overflow-hidden shadow-sm">
            <span className="px-3 text-xs font-bold text-slate-600 bg-slate-50 border-r border-slate-200 py-2.5">Szybkie dodawanie:</span>
            <select 
              className="w-64 text-sm outline-none px-3 py-2 cursor-pointer bg-white"
              value={selectedToAdd}
              onChange={(e) => setSelectedToAdd(e.target.value)}
            >
              <option value="">Wybierz egzemplarz z magazynu...</option>
              {availableItems.map(av => (
                <option key={av.id} value={av.id}>
                  {av.model.nazwa} {av.numer_urzadzenia ? `[#${av.numer_urzadzenia}]` : ''} {av.sn ? `(SN: ${av.sn})` : ''}
                </option>
              ))}
            </select>
            <button 
              onClick={handleQuickAdd}
              disabled={!selectedToAdd || isProcessing}
              className="px-4 py-2.5 bg-sky-50 text-sky-600 hover:bg-sky-100 transition border-l border-slate-200 disabled:opacity-50"
            >
              <Plus size={16} />
            </button>
          </div>

          <button 
            onClick={() => handleAction(item.zawartosc_case.map((c:any) => c.id), 'remove')}
            disabled={item.zawartosc_case.length === 0 || isProcessing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
          >
            <PackageOpen size={16} className="text-slate-400"/> Rozpakuj wszystko
          </button>
        </div>

        {/* TABELA ZAWARTOŚCI */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600">
              <tr>
                <th className="p-3 w-10"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="p-3">Nazwa modelu</th>
                <th className="p-3">Nr</th>
                <th className="p-3">Numer seryjny</th>
                <th className="p-3">Magazyn fizyczny</th>
                <th className="p-3">Status serwisowy</th>
                <th className="p-3">Kod kreskowy</th>
                <th className="p-3">Uwagi</th>
                <th className="p-3 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {item.zawartosc_case.map((zaw: any) => (
                <tr key={zaw.id} className="hover:bg-slate-50 transition">
                  <td className="p-3"><input type="checkbox" className="rounded border-slate-300" /></td>
                  <td className="p-3 text-sky-600 font-medium cursor-pointer" onClick={() => router.push(`/dashboard/warehouse/models/${zaw.id_modelu}`)}>
                    {zaw.nazwa || zaw.model?.nazwa}
                  </td>
                  <td className="p-3 font-bold text-slate-700">{zaw.numer_urzadzenia || '-'}</td>
                  <td className="p-3 font-mono text-slate-600">{zaw.sn || '-'}</td>
                  <td className="p-3">{zaw.magazyn?.nazwa || 'Luzem'}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-white text-[11px] font-bold shadow-sm ${getStatusColor(zaw.status_serwisowy)}`}>
                      {zaw.status_serwisowy}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-500">{zaw.kod_kreskowy || '-'}</td>
                  <td className="p-3 text-slate-400">
                    {zaw.opis ? <MessageSquare size={16} className="text-amber-500" title={zaw.opis} /> : <MessageSquare size={16} />}
                  </td>
                  <td className="p-3 flex items-center justify-end">
                    <button 
                      onClick={() => handleAction([zaw.id], 'remove')}
                      disabled={isProcessing}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                      title="Wyjmij ze skrzyni"
                    >
                      <XIcon size={18} className="stroke-[3]" />
                    </button>
                  </td>
                </tr>
              ))}
              {item.zawartosc_case.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    Skrzynia jest pusta. Użyj opcji "Szybkie dodawanie" powyżej.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* DUMMY HISTORIA */}
        <div className="pt-4">
          <h3 className="text-sm font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Historia zmian</h3>
          <p className="text-xs text-slate-500 italic">Brak zapisanych logów historycznych (moduł w przygotowaniu).</p>
        </div>

      </div>
    </div>
  );
}