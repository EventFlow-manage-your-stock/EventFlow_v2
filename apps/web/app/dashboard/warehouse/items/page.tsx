'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Plus, Trash2, Loader2, Eye, Edit2, X, Settings, Filter, ArrowUpDown } from 'lucide-react';
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
import { useItemsStore } from '../../../../store/items.store';

export default function ItemsListPage() {
  const router = useRouter();
  const { items, filters, isLoading, fetchItems, setFilter, deleteItem } = useItemsStore();
  
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedItems(items.map((i: any) => i.id));
    else setSelectedItems([]);
  };

  const handleSelectItem = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedItems(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Czy na pewno chcesz usunąć ten egzemplarz z magazynu?')) {
      await deleteItem(id);
      setSelectedItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-fade-in-up">
      
      {/* BREADCRUMBS */}
      <div className="flex items-center text-sm text-slate-500 gap-2 mb-2 mt-4">
        <span className="cursor-pointer hover:text-[#00B5B5] font-semibold" onClick={() => router.push('/dashboard')}>Kokpit</span> 
        <ChevronRight size={14} />
        <span className="cursor-pointer hover:text-[#00B5B5] font-semibold" onClick={() => router.push('/dashboard/warehouse')}>Magazyn</span> 
        <ChevronRight size={14} />
        <span className="font-bold text-[#00B5B5] border-b-2 border-[#00B5B5] pb-0.5">Egzemplarze</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* UPPER TOOLBAR */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => alert('Przejdź do konkretnego modelu, aby dodać egzemplarz. (Zgodnie z logiką systemu)')}
              className="flex items-center gap-2 bg-[#8bc34a] text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-green-500 transition"
            >
              <Plus size={16} /> Dodaj
            </button>
            <button className="flex items-center gap-2 bg-white text-red-500 border border-red-200 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition shadow-sm">
              <Trash2 size={16} /> Lista usuniętych
            </button>
          </div>

          <div className="flex items-center gap-2 border border-slate-300 rounded-lg overflow-hidden shadow-sm bg-white">
            <button className="p-2 text-slate-500 hover:bg-slate-50 border-r border-slate-200 transition"><Settings size={16} /></button>
            <button className="p-2 text-slate-500 hover:bg-slate-50 border-r border-slate-200 transition"><Filter size={16} /></button>
            <button className="p-2 text-slate-500 hover:bg-slate-50 transition"><ArrowUpDown size={16} /></button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto min-h-[500px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white border-b border-slate-200">
              <tr>
                <th className="p-3 w-10 text-center"><input type="checkbox" onChange={(e) => handleSelectAll(e.target.checked)} checked={items.length > 0 && selectedItems.length === items.length} className="rounded border-slate-300 cursor-pointer text-[#00B5B5]" /></th>
                <th className="p-3 w-12 font-bold text-slate-400 text-xs">#</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Nazwa (Egzemplarz)</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Nazwa modelu</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Kategoria</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Kod RFID</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Numer urządzenia</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Data produkcji</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Kod QR</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">BarCode</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider">Wydaj z magazynu</th>
                <th className="p-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Akcje</th>
              </tr>
              <tr className="bg-slate-50/50 border-t border-slate-100">
                <th className="p-2 border-b border-slate-200"></th>
                <th className="p-2 border-b border-slate-200"></th>
                <th className="p-2 border-b border-slate-200">
                  <div className="relative">
                    <input type="text" value={filters.searchItem} onChange={(e) => setFilter('searchItem', e.target.value)} className="w-full pl-3 pr-8 py-1.5 border border-slate-300 rounded text-xs outline-none focus:border-[#00B5B5]" placeholder="Szukaj egzemplarza..." />
                    {filters.searchItem && <X size={14} className="absolute right-2 top-2 text-slate-400 cursor-pointer hover:text-red-500" onClick={() => setFilter('searchItem', '')} />}
                  </div>
                </th>
                <th className="p-2 border-b border-slate-200">
                  <div className="relative">
                    <input type="text" value={filters.searchModel} onChange={(e) => setFilter('searchModel', e.target.value)} className="w-full pl-3 pr-8 py-1.5 border border-slate-300 rounded text-xs outline-none focus:border-[#00B5B5]" placeholder="Szukaj modelu..." />
                    {filters.searchModel && <X size={14} className="absolute right-2 top-2 text-slate-400 cursor-pointer hover:text-red-500" onClick={() => setFilter('searchModel', '')} />}
                  </div>
                </th>
                <th className="p-2 border-b border-slate-200">
                  <div className="relative">
                    <input type="text" value={filters.searchCategory} onChange={(e) => setFilter('searchCategory', e.target.value)} className="w-full pl-3 pr-8 py-1.5 border border-slate-300 rounded text-xs outline-none focus:border-[#00B5B5]" placeholder="Szukaj kategorii..." />
                    {filters.searchCategory && <X size={14} className="absolute right-2 top-2 text-slate-400 cursor-pointer hover:text-red-500" onClick={() => setFilter('searchCategory', '')} />}
                  </div>
                </th>
                <th className="p-2 border-b border-slate-200" colSpan={7}></th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="p-16 text-center text-slate-400">
                    <Loader2 className="animate-spin w-8 h-8 mx-auto mb-3 text-[#00B5B5]" />
                    Pobieranie bazy egzemplarzy...
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item: any, idx: number) => {
                  const modelName = item.model?.nazwa || 'Nieznany model';
                  // BEZPIECZNY FALLBACK DLA NAZWY - zapobiega wyglądowi "jak lista modeli"
                  const itemName = item.nazwa || `${modelName} - Egzemplarz #${item.numer_urzadzenia || item.id}`;
                  const categoryName = item.model?.kategoria?.nazwa || 'Brak kategorii';
                  
                  const qrValue = item.qr_kod || item.kod_kreskowy || item.sn || `EV-ITEM-${item.id}`;
                  const barValue = item.kod_kreskowy || item.sn || `EV${item.id}`;

                  return (
                    <tr 
                      key={item.id} 
                      className={`${selectedItems.includes(item.id) ? 'bg-sky-50/40' : 'hover:bg-slate-50'} transition group`}
                    >
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedItems.includes(item.id)}
                          onClick={(e) => handleSelectItem(item.id, e)}
                          onChange={() => {}} 
                          className="rounded border-slate-300 cursor-pointer text-[#00B5B5]" 
                        />
                      </td>
                      <td className="p-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                      <td className="p-3 font-bold text-sky-500">
                         <span className="cursor-pointer hover:text-[#00B5B5] transition" onClick={() => router.push(`/dashboard/warehouse/models/${item.id_modelu}`)}>
                           {itemName}
                         </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{modelName}</td>
                      <td className="p-3 text-slate-500">{categoryName}</td>
                      
                      <td className="p-3 text-center text-slate-400">-</td>
                      <td className="p-3 text-center font-bold text-slate-700 font-mono">{item.numer_urzadzenia || '-'}</td>
                      <td className="p-3 text-center text-slate-500 font-mono text-xs">{item.data_produkcji ? new Date(item.data_produkcji).toLocaleDateString() : '-'}</td>
                      
                      <td className="p-3 text-center bg-white p-2">
                        <div className="flex justify-center">
                          <QRCode value={qrValue} size={64} level="L" />
                        </div>
                      </td>
                      <td className="p-3 text-center bg-white">
                        <div className="flex justify-center scale-75 origin-center">
                          <Barcode value={barValue} width={1.5} height={40} fontSize={12} margin={0} background="transparent" />
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-col gap-1 text-xs">
                          <button onClick={() => alert('Moduł Wydawania w przygotowaniu')} className="text-sky-600 font-bold hover:underline text-left">Wydaj sprzęt</button>
                          <button onClick={() => alert('Moduł Przyjmowania w przygotowaniu')} className="text-sky-500 hover:underline text-left">Przyjmij sprzęt</button>
                        </div>
                      </td>
                      
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1 opacity-100">
                          <button onClick={() => router.push(`/dashboard/warehouse/models/${item.id_modelu}`)} className="p-1.5 text-slate-400 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 border border-transparent hover:border-sky-200 rounded transition"><Eye size={16}/></button>
                          <button onClick={() => router.push(`/dashboard/warehouse/models/${item.id_modelu}`)} className="p-1.5 text-slate-400 hover:text-amber-600 bg-slate-100 hover:bg-amber-50 border border-transparent hover:border-amber-200 rounded transition"><Edit2 size={16}/></button>
                          <button onClick={(e) => handleDelete(item.id, e)} className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-100 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition"><X size={16}/></button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={12} className="p-12 text-center text-slate-400 font-medium bg-slate-50/50">
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