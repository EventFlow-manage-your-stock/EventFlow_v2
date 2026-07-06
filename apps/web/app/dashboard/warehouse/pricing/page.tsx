'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus, Download, Upload, Settings, Heart, Video, Edit2, Save, Loader2 } from 'lucide-react';
import { api } from '../../../../lib/api';
import { useWarehouseStore } from '../../../../store/warehouse.store';

export default function PricingPage() {
  const router = useRouter();
  const { categories, fetchCategories } = useWarehouseStore();
  
  const [models, setModels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  
  // Bufor na modyfikowane ceny (id_modelu -> nowa cena)
  const [editedPrices, setEditedPrices] = useState<Record<number, string>>({});
  
  // Stany dla masowej zmiany cen
  const [massPercent, setMassPercent] = useState<string>('100');
  const [massRounding, setMassRounding] = useState<string>('1');

  useEffect(() => {
    fetchCategories();
    fetchPricing();
  }, [selectedCategory]);

  const fetchPricing = async () => {
    setIsLoading(true);
    try {
      const url = selectedCategory ? `/api/magazyn/cennik?kategoriaId=${selectedCategory}` : `/api/magazyn/cennik`;
      const res = await api.get(url);
      setModels(res.data);
      
      // Wypełniamy bufor początkowymi cenami
      const initialPrices: Record<number, string> = {};
      res.data.forEach((m: any) => {
        initialPrices[m.id] = m.stawki?.[0]?.cena_netto ? String(m.stawki[0].cena_netto) : '';
      });
      setEditedPrices(initialPrices);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceChange = (modelId: number, value: string) => {
    setEditedPrices(prev => ({ ...prev, [modelId]: value }));
  };

  const handleMassChange = () => {
    const percent = parseFloat(massPercent) / 100;
    const decimals = parseInt(massRounding);
    
    if (isNaN(percent) || isNaN(decimals)) return;

    const newPrices = { ...editedPrices };
    models.forEach(m => {
      const currentVal = parseFloat(newPrices[m.id]);
      if (!isNaN(currentVal) && currentVal > 0) {
        const calculated = currentVal * percent;
        newPrices[m.id] = calculated.toFixed(decimals);
      }
    });
    setEditedPrices(newPrices);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updates = Object.keys(editedPrices).map(id => ({
        id_modelu: Number(id),
        cena: editedPrices[Number(id)] === '' ? null : Number(editedPrices[Number(id)])
      }));

      await api.put('/api/magazyn/cennik/masowo', { updates });
      await fetchPricing(); // Przeładuj po zapisie
    } catch (error) {
      console.error('Błąd zapisu cennika', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Płaska lista głównych kategorii do górnego paska
  const mainCategories = categories.filter(c => !c.id_rodzica);

  return (
    <div className="flex h-full flex-col bg-white overflow-y-auto custom-scrollbar">
      {/* BREADCRUMBS */}
      <div className="flex items-center px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center text-sm text-slate-500 gap-2 flex-1">
          <span className="cursor-pointer hover:text-sky-600" onClick={() => router.push('/dashboard')}>Kokpit</span> <ChevronRight size={14} />
          <span className="cursor-pointer hover:text-sky-600" onClick={() => router.push('/dashboard/warehouse')}>Magazyn</span> <ChevronRight size={14} />
          <span className="font-bold text-sky-600 pb-0.5 border-b-2 border-sky-600">Ceny</span>
        </div>
      </div>

      <div className="p-6 max-w-[1600px] w-full mx-auto space-y-5">
        
        {/* UPPER TOOLBAR */}
        <div className="flex flex-wrap gap-3 items-center">
          <button className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 rounded text-sm font-bold hover:bg-emerald-100 transition"><Plus size={16}/> Dodaj grupę cenową</button>
          <button className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded text-sm font-semibold hover:bg-slate-50 transition">Edytuj grupę cenową</button>
          <button className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2 rounded text-sm font-bold hover:bg-emerald-100 transition"><Plus size={16}/> Dodaj stawkę</button>
          <button className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded text-sm font-semibold hover:bg-slate-50 transition">Zarządzaj stawkami</button>
          <button className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded text-sm font-semibold hover:bg-slate-50 transition"><Upload size={16}/> Eksportuj cennik</button>
          <button className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded text-sm font-semibold hover:bg-slate-50 transition">Importuj cennik</button>
        </div>

        {/* GROUPS */}
        <div className="flex items-center gap-4 text-sm font-bold border-b border-slate-200 pb-3">
          <span className="text-slate-500 font-medium">Wybierz grupę cenową:</span>
          <span className="text-slate-800 border-b-2 border-slate-800 pb-1 cursor-pointer">Imprezy w Polsce</span>
          <span className="text-slate-500 hover:text-slate-700 cursor-pointer">Imprezy za Granicą</span>
        </div>

        {/* CATEGORY FILTERS */}
        <div className="flex justify-between items-center bg-white border-b border-slate-200 pb-2">
           <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-slate-600">
             <span 
                className={`cursor-pointer ${!selectedCategory ? 'text-sky-600 border-b-2 border-sky-600' : 'hover:text-slate-800'}`}
                onClick={() => setSelectedCategory(null)}
             >
               Wszystkie
             </span>
             {mainCategories.map(cat => (
               <span 
                 key={cat.id} 
                 className={`cursor-pointer flex items-center gap-1 ${selectedCategory === cat.id ? 'text-sky-600 border-b-2 border-sky-600' : 'hover:text-slate-800'}`}
                 onClick={() => setSelectedCategory(cat.id)}
               >
                 {cat.nazwa}
               </span>
             ))}
             <span className="flex items-center gap-1 cursor-pointer border border-slate-300 rounded px-2 py-0.5 hover:bg-slate-50"><Heart size={14}/> Ulubione</span>
           </div>
           
           <button className="flex items-center gap-2 border border-emerald-500 text-emerald-600 px-4 py-1.5 rounded text-sm font-bold hover:bg-emerald-50 transition shadow-sm bg-white">
             <Video size={16} className="fill-emerald-600" /> Zobacz jak działają opakowania
           </button>
        </div>

        {/* MASS MODIFIER */}
        <div className="flex items-center justify-between bg-slate-50/50 p-4 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>Zmień wszystkie ceny na</span>
            <input type="number" value={massPercent} onChange={e => setMassPercent(e.target.value)} className="w-16 border border-slate-300 rounded px-2 py-1 text-center outline-none focus:border-sky-500" />
            <span>% obecnej zaokrąglając do</span>
            <input type="number" value={massRounding} onChange={e => setMassRounding(e.target.value)} className="w-12 border border-slate-300 rounded px-2 py-1 text-center outline-none focus:border-sky-500" />
            <span>miejsca po przecinku.</span>
            <button onClick={handleMassChange} className="bg-sky-500 text-white font-bold px-4 py-1.5 rounded shadow-sm hover:bg-sky-600 transition ml-2">Zmień</button>
          </div>
          
          <button 
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-2 rounded font-bold shadow-md hover:bg-emerald-600 transition disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16} />} Zapisz zmiany
          </button>
        </div>

        {/* PRICING TABLE */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden pb-10">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
              <tr>
                <th className="p-3">Nazwa sprzętu</th>
                <th className="p-3 w-48 text-right">Podstawowa (PLN) <Edit2 size={12} className="inline text-slate-400"/></th>
                <th className="p-3 w-10 text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={3} className="p-10 text-center text-slate-500"><Loader2 className="animate-spin inline mr-2"/> Ładowanie cennika...</td></tr>
              ) : (
                models.map((model) => (
                  <tr key={model.id} className="hover:bg-sky-50/30 transition group">
                    <td 
                      className="p-3 text-sky-600 cursor-pointer font-medium hover:underline"
                      onClick={() => router.push(`/dashboard/warehouse/models/${model.id}?tab=stawki`)}
                    >
                      {model.nazwa}
                    </td>
                    <td className="p-3 text-right">
                      <input 
                        type="number"
                        step="0.01"
                        value={editedPrices[model.id] !== undefined ? editedPrices[model.id] : ''}
                        onChange={(e) => handlePriceChange(model.id, e.target.value)}
                        className="w-28 px-2 py-1.5 border border-slate-200 rounded text-right outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition shadow-sm"
                      />
                    </td>
                    <td className="p-3 text-center"><input type="checkbox" className="rounded border-slate-300" /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}