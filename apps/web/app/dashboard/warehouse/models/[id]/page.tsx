'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  ChevronRight, Edit2, Copy, Trash2, X, Image as ImageIcon, 
  Calendar, List, Share2, Printer, MapPin, Grid, Layers, 
  FileArchive, History, Wrench, Info, FileText, MessageSquare, 
  CheckSquare, DollarSign, Globe, Plus, Search, Barcode, Loader2, Save
} from 'lucide-react';
import { api } from '../../../../../lib/api';
import ItemModal from '../../../../../components/ItemModal';

const TABS = [
  { id: 'egzemplarze', label: 'Egzemplarze', icon: Grid },
  { id: 'powiazane', label: 'Powiązane', icon: Layers },
  { id: 'zamienniki', label: 'Zamienniki', icon: ArrowRightLeftIcon },
  { id: 'opakowania', label: 'Opakowania', icon: BoxIcon },
  { id: 'historia', label: 'Historia', icon: History },
  { id: 'serwis', label: 'Serwis', icon: Wrench },
  { id: 'informacje', label: 'Informacje', icon: Info },
  { id: 'zalaczniki', label: 'Załączniki', icon: FileArchive },
  { id: 'uwagi', label: 'Uwagi', icon: MessageSquare },
  { id: 'notatki', label: 'Notatki', icon: FileText },
  { id: 'zadania', label: 'Zadania', icon: CheckSquare },
  { id: 'stawki', label: 'Stawki', icon: DollarSign },
  { id: 'tlumaczenia', label: 'Tłumaczenia', icon: Globe },
];

function ArrowRightLeftIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>; }
function BoxIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>; }

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'Działa': return 'bg-emerald-500 text-white';
    case 'Wymaga serwisu (działa)': return 'bg-amber-500 text-white';
    case 'Wymaga serwisu (nie działa)': return 'bg-red-500 text-white';
    case 'W serwisie': return 'bg-sky-500 text-white';
    case 'Naprawiony': return 'bg-indigo-500 text-white';
    default: return 'bg-slate-400 text-white';
  }
};

const getServiceStatusColor = (statusName: string, defaultColor: string) => {
  const name = statusName?.toLowerCase() || '';
  if (name.includes('pilne')) return 'text-red-500 bg-red-50';
  if (name.includes('napraw')) return 'text-amber-500 bg-amber-50';
  if (name.includes('gotow')) return 'text-emerald-500 bg-emerald-50';
  return defaultColor ? `text-[${defaultColor}] bg-slate-50` : 'text-slate-500 bg-slate-100';
};

export default function ModelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = params.id === 'new';

  const defaultTab = searchParams.get('tab') || 'egzemplarze';
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  const [modelData, setModelData] = useState<any>(null);
  const [kategorie, setKategorie] = useState<any[]>([]);
  const [serwisy, setSerwisy] = useState<any[]>([]); // Stan dla zgłoszeń serwisowych

  const [isLoading, setIsLoading] = useState(!isNew);
  const [isLoadingSerwisy, setIsLoadingSerwisy] = useState(false);
  const [isEditMode, setIsEditMode] = useState(isNew);

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  // Inicjalne pobieranie danych modelu i kategorii
  useEffect(() => {
    fetchKategorie();
    if (!isNew) {
      fetchModelData();
    }
  }, [params.id]);

  // Leniwe (lazy) pobieranie zgłoszeń serwisowych po wejściu w odpowiednią zakładkę
  useEffect(() => {
    if (!isNew && activeTab === 'serwis' && serwisy.length === 0) {
      fetchSerwisy();
    }
  }, [activeTab, isNew]);

  const fetchKategorie = async () => {
    try {
      const res = await api.get('/api/magazyn/kategorie');
      const flattened = res.data.flatMap((kat: any) => [kat, ...(kat.dzieci || [])]);
      setKategorie(flattened);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchModelData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/magazyn/modele/${params.id}`);
      setModelData(res.data);
      reset(res.data);
      setSelectedItems([]); 
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Nowa funkcja pobierająca zgłoszenia dla tego konkretnego modelu sprzętu
  const fetchSerwisy = async () => {
    setIsLoadingSerwisy(true);
    try {
      const res = await api.get(`/api/serwis/model/${params.id}`);
      setSerwisy(res.data);
    } catch (error) {
      console.error('Błąd pobierania serwisów:', error);
    } finally {
      setIsLoadingSerwisy(false);
    }
  };

  const onSubmitModel = async (data: any) => {
    try {
      if (isNew) {
        const res = await api.post('/api/magazyn/modele', data);
        router.push(`/dashboard/warehouse/models/${res.data.id}`);
      } else {
        await api.put(`/api/magazyn/modele/${params.id}`, data);
        setIsEditMode(false);
        fetchModelData();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteModel = async () => {
    if (confirm('Usunąć ten model sprzętu?')) {
      await api.delete(`/api/magazyn/modele/${params.id}`);
      router.push('/dashboard/warehouse');
    }
  };

  const handleOpenNewItemModal = () => {
    if (isNew) return alert("Najpierw zapisz model główny!");
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleDeleteItem = async (itemId: number) => {
    if (confirm('Usunąć ten egzemplarz na stałe?')) {
      try {
        await api.delete(`/api/magazyn/egzemplarze/${itemId}`);
        fetchModelData();
      } catch (error) {
        console.error("Błąd usuwania egzemplarza", error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return alert("Wybierz co najmniej jeden egzemplarz.");
    if (confirm(`Czy na pewno chcesz usunąć zaznaczone egzemplarze (${selectedItems.length})?`)) {
      try {
        await Promise.all(selectedItems.map(id => api.delete(`/api/magazyn/egzemplarze/${id}`)));
        fetchModelData();
      } catch (error) {
        console.error("Błąd masowego usuwania", error);
      }
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(modelData?.egzemplarze.map((e: any) => e.id) || []);
    } else {
      setSelectedItems([]);
    }
  };

  const toggleSelect = (id: number) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(prev => prev.filter(item => item !== id));
    } else {
      setSelectedItems(prev => [...prev, id]);
    }
  };

  const totalStock = modelData?.egzemplarze?.length || 0;
  const inStock = modelData?.egzemplarze?.filter((e:any) => e.status_serwisowy === 'Działa' || e.status_serwisowy === 'Naprawiony').length || 0;
  const inService = modelData?.egzemplarze?.filter((e:any) => e.status_serwisowy?.includes('Wymaga') || e.status_serwisowy === 'W serwisie').length || 0;

  if (isLoading) return <div className="p-8 flex items-center justify-center gap-3 text-slate-500"><Loader2 className="animate-spin" /> Wczytywanie karty modelu...</div>;

  return (
    <div className="flex h-full flex-col bg-white overflow-y-auto custom-scrollbar">
      
      <ItemModal 
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSuccess={() => {
          fetchModelData();
          if (activeTab === 'serwis') fetchSerwisy(); // Odśwież serwisy po ewentualnym wygenerowaniu zgłoszenia
        }}
        modelId={modelData?.id}
        modelName={modelData?.nazwa}
        initialData={editingItem}
      />

      <div className="flex items-center px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center text-sm text-slate-500 gap-2 flex-1">
          <span className="cursor-pointer hover:text-sky-600" onClick={() => router.push('/dashboard')}>Kokpit</span> <ChevronRight size={14} />
          <span className="cursor-pointer hover:text-sky-600" onClick={() => router.push('/dashboard/warehouse')}>Magazyn</span> <ChevronRight size={14} />
          <span className="cursor-pointer hover:text-sky-600">{modelData?.kategoria?.nazwa || 'Kategoria'}</span> <ChevronRight size={14} />
          <span className="font-bold text-slate-800 border-b-2 border-slate-800 pb-0.5">{isNew ? 'Nowy Sprzęt' : modelData?.nazwa}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmitModel)} className="p-6">
        
        {/* UPPER CARD */}
        <div className="relative border border-slate-200 rounded-xl p-6 bg-slate-50/50 shadow-sm flex flex-col lg:flex-row gap-8">
          
          <div className="absolute top-4 right-4 flex gap-2">
            {!isEditMode && (
              <button type="button" onClick={() => setIsEditMode(true)} className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 bg-white shadow-sm transition"><Edit2 size={16} /></button>
            )}
            {!isNew && (
               <button type="button" className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 bg-white shadow-sm transition"><Copy size={16} /></button>
            )}
            {isEditMode && !isNew && (
              <button type="button" onClick={() => setIsEditMode(false)} className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-slate-100 bg-white shadow-sm transition"><X size={16} /></button>
            )}
            {!isNew && (
               <button type="button" onClick={handleDeleteModel} className="w-10 h-10 rounded-full border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50 bg-white shadow-sm transition"><Trash2 size={16} /></button>
            )}
          </div>

          <div className="flex gap-6 min-w-[300px]">
            <div className="w-32 h-32 bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col items-center justify-center text-slate-300 relative overflow-hidden">
               {modelData?.zdjecie ? (
                  <img src={modelData.zdjecie} alt="Product" className="w-full h-full object-cover" />
               ) : (
                  <ImageIcon size={40} strokeWidth={1} />
               )}
            </div>
            <div className="flex flex-col gap-1.5 mt-2">
              {isEditMode ? (
                <input {...register('nazwa', {required: true})} className="text-lg font-bold border border-slate-300 px-2 py-1 rounded w-full outline-none focus:border-sky-500" placeholder="Nazwa sprzętu" />
              ) : (
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">{modelData?.nazwa}</h2>
              )}
              
              <div className="text-sm text-slate-600 grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 mt-2">
                <span className="font-semibold text-slate-500">Na stanie:</span>
                <span className="font-bold">{totalStock} szt.</span>
                
                <span className="font-semibold text-slate-500">Typ:</span>
                {isEditMode ? (
                   <select {...register('typ_sprzetu')} className="border border-slate-200 rounded px-1 py-0.5 text-xs outline-none focus:border-sky-500">
                     <option value="sprzet">Sprzęt (Egzemplarzowy)</option>
                     <option value="opakowanie">Opakowanie</option>
                   </select>
                ) : <span>{modelData?.typ_sprzetu === 'sprzet' ? 'Sprzęt (Egzemplarzowy)' : modelData?.typ_sprzetu}</span>}

                <span className="font-semibold text-slate-500">Kategoria:</span>
                {isEditMode ? (
                   <select {...register('id_kategorii')} className="border border-slate-200 rounded px-1 py-0.5 text-xs outline-none focus:border-sky-500">
                     <option value="">Wybierz...</option>
                     {kategorie.map(k => <option key={k.id} value={k.id}>{k.nazwa}</option>)}
                   </select>
                ) : <span>{modelData?.kategoria?.nazwa}</span>}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[250px]">
            <h3 className="text-sm font-bold text-slate-700 mb-3 ml-20">Wymiary [cm]</h3>
            <div className="grid grid-cols-[120px_1fr] gap-y-1.5 text-sm">
              <span className="text-right text-slate-500 font-semibold pr-3">Szerokość:</span>
              {isEditMode ? <input {...register('szerokosc')} type="number" step="0.01" className="border border-slate-200 w-24 px-1 rounded text-xs focus:border-sky-500 outline-none"/> : <span className="font-medium text-slate-800">{modelData?.szerokosc || '0.00'} cm</span>}
              
              <span className="text-right text-slate-500 font-semibold pr-3">Głębokość:</span>
              {isEditMode ? <input {...register('glebokosc')} type="number" step="0.01" className="border border-slate-200 w-24 px-1 rounded text-xs focus:border-sky-500 outline-none"/> : <span className="font-medium text-slate-800">{modelData?.glebokosc || '0.00'} cm</span>}
              
              <span className="text-right text-slate-500 font-semibold pr-3">Wysokość:</span>
              {isEditMode ? <input {...register('wysokosc')} type="number" step="0.01" className="border border-slate-200 w-24 px-1 rounded text-xs focus:border-sky-500 outline-none"/> : <span className="font-medium text-slate-800">{modelData?.wysokosc || '0.00'} cm</span>}
              
              <span className="text-right text-slate-500 font-semibold pr-3">Waga[kg]:</span>
              {isEditMode ? <input {...register('waga')} type="number" step="0.01" className="border border-slate-200 w-24 px-1 rounded text-xs focus:border-sky-500 outline-none"/> : <span className="font-medium text-slate-800">{modelData?.waga || '0.00'} kg</span>}
              
              <span className="text-right text-slate-500 font-semibold pr-3">Pobór prądu [W]:</span>
              {isEditMode ? <input {...register('pobor_pradu')} type="number" step="0.01" className="border border-slate-200 w-24 px-1 rounded text-xs focus:border-sky-500 outline-none"/> : <span className="font-medium text-slate-800">{modelData?.pobor_pradu || '0.00'} W</span>}
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <h3 className="text-sm font-bold text-slate-700 mb-3 ml-24">Magazyny</h3>
            <div className="grid grid-cols-[140px_1fr] gap-y-1.5 text-sm">
              <span className="text-right text-slate-500 font-semibold pr-3">W magazynie (Dostępne):</span>
              <span className="font-bold text-emerald-600">{inStock} szt.</span>
              
              <span className="text-right text-slate-500 font-semibold pr-3">Wymaga uwagi/serwis:</span>
              <span className="font-bold text-red-500">{inService} szt.</span>

              <span className="text-right text-slate-500 font-semibold pr-3">Miejsce w mag:</span>
              {isEditMode ? <input {...register('miejsce_w_mag')} className="border border-slate-200 w-24 px-1 rounded text-xs uppercase focus:border-sky-500 outline-none"/> : <span className="font-bold text-slate-600 uppercase">{modelData?.miejsce_w_mag || '-'}</span>}
            </div>
          </div>

          <div className="flex-1 min-w-[200px] border-l border-slate-200 pl-8">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Znakowanie:</h3>
            <div className="text-sm flex flex-col gap-2">
              <div className="flex items-center gap-2">
                 <span className="text-slate-500 font-semibold">Kod kreskowy:</span>
                 {isEditMode ? <input {...register('kod_kreskowy')} className="border border-slate-200 w-32 px-1 rounded text-xs focus:border-sky-500 outline-none"/> : <span className="font-mono text-slate-800">{modelData?.kod_kreskowy || '-'}</span>}
              </div>
            </div>
          </div>
        </div>

        {isEditMode && (
          <div className="mt-6 flex justify-end gap-3 pb-6 border-b border-slate-200">
            <button type="button" onClick={() => {setIsEditMode(false); reset(modelData);}} className="px-6 py-2 border border-slate-300 rounded shadow-sm text-sm font-bold text-slate-600 hover:bg-slate-50 transition">Anuluj</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-[#00B5B5] text-white px-8 py-2 rounded shadow-md text-sm font-bold hover:bg-teal-400 transition disabled:opacity-50">
              {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
              Zapisz model
            </button>
          </div>
        )}

        {/* UTILITIES / ACTION BAR */}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="px-4 py-2 border border-slate-300 text-slate-600 font-semibold text-xs rounded shadow-sm hover:bg-slate-50">Zarządzaj tagami</button>
          <div className="w-full h-0"></div>
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-sky-600 font-semibold text-xs rounded shadow-sm hover:bg-sky-50"><Calendar size={14}/> Kalendarz dostępności</button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-emerald-600 font-semibold text-xs rounded shadow-sm hover:bg-emerald-50"><List size={14}/> Arkusz dostępności</button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded shadow-sm hover:bg-slate-50"><Share2 size={14}/> Udostępnij w Cross Rental</button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded shadow-sm hover:bg-slate-50"><Printer size={14}/> Generuj naklejki QR (A4)</button>
        </div>

        {/* TABS */}
        <div className="mt-8 border-b border-slate-200">
           <div className="flex overflow-x-auto custom-scrollbar">
             {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button 
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 min-w-[90px] px-2 py-3 border-b-2 transition-colors ${isActive ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                  >
                    <Icon size={18} className={isActive ? 'text-sky-500' : 'text-slate-400'}/>
                    <span className="text-[11px] font-bold">{tab.label}</span>
                  </button>
                )
             })}
           </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* ZAWARTOŚĆ ZAKŁADKI: EGZEMPLARZE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'egzemplarze' && (
          <div className="mt-6 border border-slate-200 rounded-lg shadow-sm bg-white overflow-hidden">
             <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input type="text" className="pl-8 pr-8 py-2 border border-slate-300 rounded text-sm w-64 focus:border-sky-500 outline-none" placeholder="Szukaj egzemplarza..." />
                  </div>
                  
                  <button type="button" onClick={handleOpenNewItemModal} className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded text-xs font-bold hover:bg-slate-800 shadow-sm transition">
                    <Plus size={14}/> Dodaj egzemplarz
                  </button>
                  
                  <button type="button" className="flex items-center gap-2 bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded text-xs font-bold hover:bg-slate-50 shadow-sm transition"><Wrench size={14}/> Wyślij na serwis</button>
                  <button type="button" className="flex items-center gap-2 bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded text-xs font-bold hover:bg-slate-50 shadow-sm transition"><Barcode size={14}/> Skanuj</button>
                </div>

                {selectedItems.length > 0 && (
                  <button type="button" onClick={handleBulkDelete} className="flex items-center gap-2 bg-white border border-red-300 text-red-600 px-4 py-2 rounded text-xs font-bold hover:bg-red-50 shadow-sm transition">
                    <Trash2 size={14}/> Usuń zaznaczone ({selectedItems.length})
                  </button>
                )}
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-white border-b border-slate-200 text-xs font-bold text-slate-700">
                   <tr>
                     <th className="p-3 w-10">
                       <input 
                         type="checkbox" 
                         className="rounded border-slate-300 cursor-pointer text-sky-600" 
                         checked={modelData?.egzemplarze?.length > 0 && selectedItems.length === modelData?.egzemplarze?.length}
                         onChange={(e) => toggleSelectAll(e.target.checked)}
                       />
                     </th>
                     <th className="p-3">Nazwa</th>
                     <th className="p-3">Numer urz.</th>
                     <th className="p-3">Numer seryjny (SN)</th>
                     <th className="p-3">Magazyn docelowy</th>
                     <th className="p-3">Miejsce w mag.</th>
                     <th className="p-3">Case</th>
                     <th className="p-3">Status serwisowy</th>
                     <th className="p-3">Kod kreskowy</th>
                     <th className="p-3">Uwagi</th>
                     <th className="p-3 text-right">Akcje</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 bg-white">
                   {modelData?.egzemplarze?.map((egz: any) => (
                     <tr key={egz.id} className={`${selectedItems.includes(egz.id) ? 'bg-sky-50/50' : 'hover:bg-slate-50'} transition`}>
                        <td className="p-3">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 cursor-pointer text-sky-600"
                            checked={selectedItems.includes(egz.id)}
                            onChange={() => toggleSelect(egz.id)}
                          />
                        </td>
                        <td className="p-3 text-sky-500 font-medium cursor-pointer" onClick={() => handleEditItem(egz)}>
                          {egz.nazwa || modelData.nazwa}
                        </td>
                        <td className="p-3 text-slate-600 font-bold">{egz.numer_urzadzenia || '-'}</td>
                        <td className="p-3 font-mono text-slate-700">{egz.sn || '-'}</td>
                        <td className="p-3 text-sky-600">{egz.magazyn?.nazwa || 'Luzem'}</td>
                        <td className="p-3 text-slate-600 uppercase">{egz.miejsce_w_mag || modelData.miejsce_w_mag || '-'}</td>
                        
                        <td className="p-3">
                          {modelData.typ_sprzetu === 'opakowanie' ? (
                            <span 
                              onClick={() => router.push(`/dashboard/warehouse/items/${egz.id}`)}
                              className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 cursor-pointer hover:bg-emerald-100 transition"
                            >
                              Zawiera: {egz._count?.zawartosc_case || 0} szt.
                            </span>
                          ) : (
                            egz.case ? (
                              <span 
                                onClick={() => router.push(`/dashboard/warehouse/items/${egz.case.id}`)}
                                className="text-sky-600 font-semibold text-xs border border-sky-200 bg-sky-50 px-2 py-1 rounded cursor-pointer hover:bg-sky-100 transition" 
                                title="Kliknij, aby otworzyć Case"
                              >
                                {egz.case.numer_urzadzenia ? `[#${egz.case.numer_urzadzenia}] ` : ''} 
                                {egz.case.nazwa || 'Case'}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )
                          )}
                        </td>

                        <td className="p-3">
                           <span className={`px-2 py-1 rounded text-[11px] font-bold shadow-sm ${getStatusConfig(egz.status_serwisowy)}`}>
                             {egz.status_serwisowy}
                           </span>
                        </td>
                        <td className="p-3 font-mono text-slate-500">{egz.kod_kreskowy || '-'}</td>
                        <td className="p-3 text-slate-400">
                          {egz.opis ? <MessageSquare size={16} className="text-amber-500" title={egz.opis} /> : '-'}
                        </td>
                        <td className="p-3 flex items-center justify-end gap-3 text-slate-400">
                          <div onClick={() => handleEditItem(egz)} className="w-6 h-6 bg-slate-700 rounded text-white flex items-center justify-center cursor-pointer hover:bg-slate-800">
                            <Edit2 size={12} />
                          </div>
                          <Trash2 size={16} className="cursor-pointer hover:text-red-500" onClick={() => handleDeleteItem(egz.id)} />
                        </td>
                     </tr>
                   ))}
                   {(!modelData?.egzemplarze || modelData.egzemplarze.length === 0) && !isNew && (
                     <tr>
                        <td colSpan={11} className="p-6 text-center text-slate-400 text-sm">Brak utworzonych egzemplarzy dla tego modelu. Kliknij "Dodaj egzemplarz" powyżej.</td>
                     </tr>
                   )}
                   {isNew && (
                     <tr>
                        <td colSpan={11} className="p-6 text-center text-slate-400 text-sm">Najpierw zapisz model sprzętu (górny przycisk Zapisz), aby móc do niego dodać fizyczne egzemplarze.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ZAWARTOŚĆ ZAKŁADKI: STAWKI */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'stawki' && (
          <div className="mt-6 border border-slate-200 rounded-lg shadow-sm bg-white overflow-hidden p-6">
            <h3 className="text-[15px] font-bold text-slate-800 mb-4">Stawki Cennika</h3>
            
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-5 gap-4 items-end">
                 <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">Nazwa stawki</label>
                   <input id="new_nazwa" type="text" defaultValue="Podstawowa (PLN)" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-sky-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">Cena netto</label>
                   <input id="new_cena" type="number" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-sky-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">Koszt</label>
                   <input id="new_koszt" type="number" step="0.01" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-sky-500 outline-none" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-600 mb-1">Nazwa kosztu</label>
                   <input id="new_nazwak" type="text" className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:border-sky-500 outline-none" />
                 </div>
                 <div className="flex items-center h-full pb-2">
                   <input id="new_mnoz" type="checkbox" className="w-4 h-4 rounded border-slate-300 text-sky-600 cursor-pointer mr-2" />
                   <label className="text-xs font-semibold text-slate-700 cursor-pointer select-none">Mnóż koszt przez przelicznik</label>
                 </div>
              </div>
              <div className="mt-4">
                 <button 
                   type="button"
                   onClick={async () => {
                     const payload = {
                       nazwa_stawki: (document.getElementById('new_nazwa') as HTMLInputElement).value,
                       cena_netto: (document.getElementById('new_cena') as HTMLInputElement).value,
                       koszt: (document.getElementById('new_koszt') as HTMLInputElement).value,
                       nazwa_kosztu: (document.getElementById('new_nazwak') as HTMLInputElement).value,
                       mnoz_koszt: (document.getElementById('new_mnoz') as HTMLInputElement).checked
                     };
                     await api.post(`/api/magazyn/modele/${modelData.id}/stawki`, payload);
                     fetchModelData(); 
                   }}
                   className="border border-[#00B5B5] text-[#00B5B5] font-bold px-6 py-2 rounded text-sm hover:bg-sky-50 transition shadow-sm"
                 >
                   Dodaj stawkę
                 </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                   <tr>
                     <th className="p-3 w-10"></th>
                     <th className="p-3">Nazwa stawki</th>
                     <th className="p-3">Cena</th>
                     <th className="p-3">Koszt</th>
                     <th className="p-3">Nazwa kosztu</th>
                     <th className="p-3 text-center">Mnóż koszt</th>
                     <th className="p-3 text-right">Akcje</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {modelData?.stawki?.map((cena: any) => (
                     <tr key={cena.id} className="hover:bg-slate-50 transition">
                       <td className="p-3"><List size={16} className="text-slate-300 cursor-move"/></td>
                       <td className="p-3 font-semibold text-slate-700">{cena.nazwa_stawki}</td>
                       <td className="p-3 font-mono text-slate-800">{cena.cena_netto || '0.00'} PLN</td>
                       <td className="p-3 text-slate-500">{cena.koszt ? `${cena.koszt} PLN` : '-'}</td>
                       <td className="p-3 text-slate-500">{cena.nazwa_kosztu || '-'}</td>
                       <td className="p-3 text-center">
                         <input type="checkbox" checked={cena.mnoz_koszt} readOnly className="rounded border-slate-300 text-sky-600" />
                       </td>
                       <td className="p-3 flex justify-end gap-2 text-slate-400">
                         <button type="button" onClick={async () => {
                           if(confirm('Usunąć tę stawkę?')) {
                             await api.delete(`/api/magazyn/stawki/${cena.id}`);
                             fetchModelData();
                           }
                         }} className="hover:text-red-500 p-1 rounded transition"><Trash2 size={16}/></button>
                       </td>
                     </tr>
                   ))}
                   {(!modelData?.stawki || modelData.stawki.length === 0) && (
                     <tr><td colSpan={7} className="p-6 text-center text-slate-400 text-sm">Brak zdefiniowanych stawek. Utwórz pierwszą powyżej.</td></tr>
                   )}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* ZAWARTOŚĆ ZAKŁADKI: SERWIS */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'serwis' && (
          <div className="mt-6 border border-slate-200 rounded-lg shadow-sm bg-white overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
               <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                 <Wrench size={18} className="text-sky-500"/> Zgłoszenia serwisowe sprzętu: {modelData?.nazwa}
               </h3>
               <button type="button" onClick={() => router.push('/dashboard/service')} className="text-xs font-bold text-sky-600 border border-sky-200 px-3 py-1.5 rounded hover:bg-sky-50 transition">
                 Zarządzaj całym serwisem
               </button>
            </div>

            {isLoadingSerwisy ? (
              <div className="flex justify-center p-8 text-slate-400"><Loader2 className="animate-spin w-6 h-6"/></div>
            ) : (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700">
                     <tr>
                       <th className="p-3">Data zgłoszenia</th>
                       <th className="p-3">Sprzęt (Nr/SN)</th>
                       <th className="p-3">Zgłaszający</th>
                       <th className="p-3">Tytuł usterki</th>
                       <th className="p-3">Status serwisu</th>
                       <th className="p-3 text-right">Akcje</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                     {serwisy.map(s => {
                       const statusStyle = getServiceStatusColor(s.status?.nazwa, s.status?.kolor);
                       return (
                         <tr 
                          key={s.id} 
                          className="hover:bg-sky-50/30 transition cursor-pointer" 
                          onClick={() => router.push(`/dashboard/service/${s.id}`)}
                         >
                           <td className="p-3 text-slate-500">{new Date(s.data_zgloszenia).toLocaleDateString('pl-PL')}</td>
                           <td className="p-3 font-mono text-slate-700 font-bold">{s.egzemplarz?.numer_urzadzenia || s.egzemplarz?.sn || '-'}</td>
                           <td className="p-3 text-slate-600">{s.zglosil?.imie} {s.zglosil?.nazwisko?.charAt(0)}.</td>
                           <td className="p-3 text-sky-600 font-medium">{s.tytul}</td>
                           <td className="p-3">
                             <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${statusStyle}`}>
                               {s.status?.nazwa || 'Nowe'}
                             </span>
                           </td>
                           <td className="p-3 text-right">
                             <ChevronRight size={16} className="inline text-slate-400"/>
                           </td>
                         </tr>
                       );
                     })}
                     {serwisy.length === 0 && (
                       <tr><td colSpan={6} className="p-6 text-center text-slate-400 text-sm">Brak zgłoszeń serwisowych dla tego modelu. Oby tak dalej!</td></tr>
                     )}
                   </tbody>
                 </table>
              </div>
            )}
          </div>
        )}

        {/* Domyślny fallback dla pustych tabów na dole */}
        {activeTab !== 'egzemplarze' && activeTab !== 'stawki' && activeTab !== 'serwis' && (
           <div className="mt-10 text-center text-slate-400 text-sm font-medium">
             Sekcja <span className="uppercase text-slate-600 font-bold">{activeTab}</span> w przygotowaniu.
           </div>
        )}

      </form>
    </div>
  );
}