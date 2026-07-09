'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, Plus, DownloadCloud, RefreshCw, Trash2, 
  FileText, Table, Settings, Loader2, Eye, Edit2, X, Search 
} from 'lucide-react';
import { useModelsStore } from '../../../../store/models.store';

export default function ModelsListPage() {
  const router = useRouter();
  const { 
    models, categories, filters, isLoading, 
    fetchModels, fetchCategories, setFilter, deleteModel 
  } = useModelsStore();

  const [selectedModels, setSelectedModels] = useState<number[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchModels();
  }, []);

  // --- LOGIKA CHECKBOXÓW ---
  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedModels(models.map((m: any) => m.id));
    else setSelectedModels([]);
  };

  const handleSelectModel = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedModels(prev => 
      prev.includes(id) ? prev.filter(modelId => modelId !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Czy na pewno chcesz usunąć ten model sprzętu? Zostanie przeniesiony do archiwum usuniętych.')) {
      await deleteModel(id);
      setSelectedModels(prev => prev.filter(modelId => modelId !== id));
    }
  };

  // --- LOGIKA EKSPORTU (CSV / EXCEL) ---
  const handleExportExcel = () => {
    const dataToExport = selectedModels.length > 0 ? models.filter(m => selectedModels.includes(m.id)) : models;
    
    if (dataToExport.length === 0) return alert('Brak danych do eksportu.');

    let csvContent = "ID;Nazwa;Sztuk na stanie;Widoczny w magazynie;Widoczny w ofercie;Kategoria\n";
    dataToExport.forEach(m => {
      const stock = m._count?.egzemplarze || 0;
      const widMag = m.widoczny_w_mag ? 'TAK' : 'NIE';
      const widOfer = m.widoczny_w_ofercie ? 'TAK' : 'NIE';
      const kat = m.kategoria?.nazwa || 'Brak kategorii';
      
      csvContent += `${m.id};"${m.nazwa}";${stock};"${widMag}";"${widOfer}";"${kat}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `modele_sprzetu_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in-up">
      
      {/* BREADCRUMBS & HEADER */}
      <div className="flex items-center text-sm text-slate-500 gap-2 mb-2 mt-4">
        <span className="cursor-pointer hover:text-[#00B5B5] font-semibold" onClick={() => router.push('/dashboard')}>Kokpit</span> 
        <ChevronRight size={14} />
        <span className="cursor-pointer hover:text-[#00B5B5] font-semibold" onClick={() => router.push('/dashboard/warehouse')}>Magazyn</span> 
        <ChevronRight size={14} />
        <span className="font-bold text-[#00B5B5] border-b-2 border-[#00B5B5] pb-0.5">Modele</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* UPPER TOOLBAR (Zgodnie ze zdjęciem) */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => router.push('/dashboard/warehouse/models/new')}
              className="flex items-center gap-2 bg-[#8bc34a] text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-green-500 transition"
            >
              <Plus size={16} /> Dodaj
            </button>
            <button className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
              <DownloadCloud size={16} /> Import
            </button>
            <button onClick={fetchModels} className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
              <RefreshCw size={16} /> Aktualizuj
            </button>
            <button onClick={() => alert("Widok usuniętych modeli w przygotowaniu.")} className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition shadow-sm">
              <Trash2 size={16} /> Lista usuniętych
            </button>
            <button className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
              <FileText size={16} className="text-emerald-700" /> PDF - cały magazyn
            </button>
            <button onClick={handleExportExcel} className="flex items-center gap-2 bg-white text-slate-600 border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition shadow-sm">
              <Table size={16} className="text-sky-600" /> Excel
            </button>
          </div>

          <div className="flex items-center gap-2 border border-slate-300 rounded-lg overflow-hidden shadow-sm bg-white">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 border-r border-slate-200 transition">
              <Settings size={16} /> Wyświetl wszystko
            </button>
            <button className="p-2 text-white bg-[#8bc34a] hover:bg-green-500 transition px-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-slate-200">
              {/* Główny wiersz nagłówków */}
              <tr>
                <th className="p-3 w-10 text-center"><input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} checked={models.length > 0 && selectedModels.length === models.length} className="rounded border-slate-300 cursor-pointer text-[#00B5B5]" /></th>
                <th className="p-3 w-12 font-bold text-slate-400 text-xs">#</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Nazwa</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Data produkcji</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Sztuk na stanie</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Widoczny w magazynie</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Widoczny w ofercie</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Kategoria</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Akcje</th>
              </tr>
              {/* Wiersz z inputami filtrów */}
              <tr className="bg-slate-50/50 border-t border-slate-100">
                <th className="p-2 border-b border-slate-200"></th>
                <th className="p-2 border-b border-slate-200"></th>
                <th className="p-2 border-b border-slate-200 min-w-[300px]">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={filters.search}
                      onChange={(e) => setFilter('search', e.target.value)}
                      className="w-full pl-3 pr-8 py-1.5 border border-slate-300 rounded text-xs font-normal outline-none focus:border-[#00B5B5] bg-white transition shadow-inner" 
                      placeholder="Wpisz aby wyszukać..."
                    />
                    {filters.search && <X size={14} className="absolute right-2 top-2 text-slate-400 cursor-pointer hover:text-red-500" onClick={() => setFilter('search', '')} />}
                  </div>
                </th>
                <th className="p-2 border-b border-slate-200"><input type="text" disabled className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-normal bg-slate-100 cursor-not-allowed outline-none" /></th>
                <th className="p-2 border-b border-slate-200"><input type="text" disabled className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-normal bg-slate-100 cursor-not-allowed outline-none" /></th>
                <th className="p-2 border-b border-slate-200">
                  <select 
                    value={filters.widocznyWMag} 
                    onChange={(e) => setFilter('widocznyWMag', e.target.value)} 
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-normal outline-none focus:border-[#00B5B5] bg-white cursor-pointer shadow-inner"
                  >
                    <option value="">Widoczność</option>
                    <option value="TAK">TAK</option>
                    <option value="NIE">NIE</option>
                  </select>
                </th>
                <th className="p-2 border-b border-slate-200">
                  <select 
                    value={filters.widocznyWOfercie} 
                    onChange={(e) => setFilter('widocznyWOfercie', e.target.value)} 
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-normal outline-none focus:border-[#00B5B5] bg-white cursor-pointer shadow-inner"
                  >
                    <option value="">Widoczność</option>
                    <option value="TAK">TAK</option>
                    <option value="NIE">NIE</option>
                  </select>
                </th>
                <th className="p-2 border-b border-slate-200 min-w-[200px]">
                  <select 
                    value={filters.kategoriaId} 
                    onChange={(e) => setFilter('kategoriaId', e.target.value)} 
                    className="w-full px-2 py-1.5 border border-slate-300 rounded text-xs font-normal outline-none focus:border-[#00B5B5] bg-white cursor-pointer shadow-inner"
                  >
                    <option value="">Kategoria</option>
                    {categories.map((kat: any) => <option key={kat.id} value={kat.id}>{kat.nazwa}</option>)}
                  </select>
                </th>
                <th className="p-2 border-b border-slate-200"></th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-16 text-center text-slate-400">
                    <Loader2 className="animate-spin w-8 h-8 mx-auto mb-3 text-[#00B5B5]" />
                    Pobieranie bazy modeli...
                  </td>
                </tr>
              ) : models.length > 0 ? (
                models.map((model: any, idx: number) => (
                  <tr 
                    key={model.id} 
                    className={`${selectedModels.includes(model.id) ? 'bg-sky-50/40' : 'hover:bg-slate-50'} transition cursor-pointer group`}
                    onClick={() => router.push(`/dashboard/warehouse/models/${model.id}`)}
                  >
                    <td className="p-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedModels.includes(model.id)}
                        onClick={(e) => handleSelectModel(model.id, e)}
                        onChange={() => {}} 
                        className="rounded border-slate-300 cursor-pointer text-[#00B5B5]" 
                      />
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="p-3 text-sky-500 font-medium hover:text-[#00B5B5] transition">{model.nazwa}</td>
                    <td className="p-3 text-center text-slate-500 font-mono text-xs">-</td>
                    <td className="p-3 text-center text-slate-700 font-mono font-bold">{model._count?.egzemplarze || 0}</td>
                    <td className="p-3 text-center text-slate-600 font-medium">{model.widoczny_w_mag ? 'TAK' : 'NIE'}</td>
                    <td className="p-3 text-center text-slate-600 font-medium">{model.widoczny_w_ofercie ? 'TAK' : 'NIE'}</td>
                    <td className="p-3 text-slate-600">{model.kategoria?.nazwa || '-'}</td>
                    
                    <td className="p-3 text-right flex justify-end gap-1 opacity-100 transition-opacity">
                      <button onClick={(e) => {e.stopPropagation(); router.push(`/dashboard/warehouse/models/${model.id}`);}} className="p-1.5 text-slate-400 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 border border-transparent hover:border-sky-200 rounded transition"><Eye size={16}/></button>
                      <button onClick={(e) => {e.stopPropagation(); router.push(`/dashboard/warehouse/models/${model.id}?edit=true`);}} className="p-1.5 text-slate-400 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded transition"><Edit2 size={16}/></button>
                      <button onClick={(e) => handleDelete(model.id, e)} className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition"><X size={16}/></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 font-medium bg-slate-50/50">
                    Brak wyników do wyświetlenia.
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