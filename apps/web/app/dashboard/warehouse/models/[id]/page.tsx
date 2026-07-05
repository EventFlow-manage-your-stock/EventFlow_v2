'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { 
  ChevronRight, Edit2, Copy, Trash2, X, Image as ImageIcon, 
  Calendar, List, Share2, Printer, MapPin, Grid, Layers, 
  FileArchive, History, Wrench, Info, FileText, MessageSquare, 
  CheckSquare, DollarSign, Globe, Plus, Search, Eye, Barcode, Loader2, // <-- DODANO Barcode i Loader2
  Save
} from 'lucide-react';
import { api } from '../../../../../lib/api';

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

export default function ModelDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';

  const [activeTab, setActiveTab] = useState('egzemplarze');
  const [modelData, setModelData] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(isNew);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [kategorie, setKategorie] = useState<any[]>([]);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    fetchKategorie();
    if (!isNew) {
      fetchModelData();
    }
  }, [params.id]);

  const fetchKategorie = async () => {
    try {
      const res = await api.get('/api/magazyn/kategorie'); // <-- POPRAWKA
      const flattened = res.data.flatMap((kat: any) => [kat, ...(kat.dzieci || [])]);
      setKategorie(flattened);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchModelData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/api/magazyn/modele/${params.id}`); // <-- POPRAWKA
      setModelData(res.data);
      reset(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const cleanNumber = (val: any) => (val === "" || val === undefined || val === null) ? null : Number(val);

      // Zabezpieczenie payloadu - wszystko, co jest w bazie jako Int lub Decimal, parsujemy przez cleanNumber
      const payload = {
        ...data,
        szerokosc: cleanNumber(data.szerokosc),
        glebokosc: cleanNumber(data.glebokosc),
        wysokosc: cleanNumber(data.wysokosc),
        objetosc: cleanNumber(data.objetosc),
        waga: cleanNumber(data.waga),
        pobor_pradu: cleanNumber(data.pobor_pradu),
        id_kategorii: cleanNumber(data.id_kategorii)
      };

      if (isNew) {
        // Tu ścieżka z /api/ jak wymusiłeś wcześniej
        const res = await api.post('/api/magazyn/modele', payload); 
        router.push(`/dashboard/warehouse/models/${res.data.id}`);
      } else {
        await api.put(`/api/magazyn/modele/${params.id}`, payload); 
        setIsEditMode(false);
        fetchModelData();
      }
    } catch (error) {
      console.error('Błąd podczas zapisu formularza:', error);
    }
  };

  const handleDelete = async () => {
    if (confirm('Usunąć ten model sprzętu?')) {
      await api.delete(`/api/magazyn/modele/${params.id}`); // <-- POPRAWKA
      router.push('/dashboard/warehouse');
    }
  };

  const totalStock = modelData?.egzemplarze?.length || 0;
  const inStock = Math.floor(totalStock * 0.8);
  const onEvents = Math.floor(totalStock * 0.1);
  const inRack = totalStock - inStock - onEvents;

  if (isLoading) return <div className="p-8 text-slate-500">Wczytywanie karty modelu...</div>;

  return (
    <div className="flex h-full flex-col bg-white overflow-y-auto custom-scrollbar">
      
      <div className="flex items-center px-6 py-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center text-sm text-slate-500 gap-2 flex-1">
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push('/dashboard')}>Kokpit</span> <ChevronRight size={14} />
          <span className="cursor-pointer hover:text-blue-600" onClick={() => router.push('/dashboard/warehouse')}>Magazyn</span> <ChevronRight size={14} />
          <span className="cursor-pointer hover:text-blue-600">{modelData?.kategoria?.nazwa || 'Kategoria'}</span> <ChevronRight size={14} />
          <span className="font-bold text-slate-800 border-b-2 border-slate-800 pb-0.5">{isNew ? 'Nowy Sprzęt' : modelData?.nazwa}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        
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
               <button type="button" onClick={handleDelete} className="w-10 h-10 rounded-full border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-50 bg-white shadow-sm transition"><Trash2 size={16} /></button>
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
                <input {...register('nazwa', {required: true})} className="text-lg font-bold border border-slate-300 px-2 py-1 rounded w-full outline-none focus:border-blue-500" placeholder="Nazwa sprzętu" />
              ) : (
                <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">{modelData?.nazwa}</h2>
              )}
              
              <div className="text-sm text-slate-600 grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 mt-2">
                <span className="font-semibold text-slate-500">Na stanie:</span>
                <span className="font-bold">{totalStock} szt.</span>
                
                <span className="font-semibold text-slate-500">Typ:</span>
                {isEditMode ? (
                   <select {...register('typ_sprzetu')} className="border border-slate-200 rounded px-1 py-0.5 text-xs outline-none">
                     <option value="sprzet">Sprzęt (Egzemplarzowy)</option>
                     <option value="opakowanie">Opakowanie</option>
                   </select>
                ) : <span>{modelData?.typ_sprzetu === 'sprzet' ? 'Sprzęt (Egzemplarzowy)' : modelData?.typ_sprzetu}</span>}

                <span className="font-semibold text-slate-500">Kategoria:</span>
                {isEditMode ? (
                   <select {...register('id_kategorii')} className="border border-slate-200 rounded px-1 py-0.5 text-xs outline-none">
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
              {isEditMode ? <input {...register('szerokosc')} type="number" step="0.01" className="border border-slate-200 w-24 px-1 rounded text-xs"/> : <span className="font-medium text-slate-800">{modelData?.szerokosc || '0.00'} cm</span>}
              
              <span className="text-right text-slate-500 font-semibold pr-3">Głębokość:</span>
              {isEditMode ? <input {...register('glebokosc')} type="number" step="0.01" className="border border-slate-200 w-24 px-1 rounded text-xs"/> : <span className="font-medium text-slate-800">{modelData?.glebokosc || '0.00'} cm</span>}
              
              <span className="text-right text-slate-500 font-semibold pr-3">Wysokość:</span>
              {isEditMode ? <input {...register('wysokosc')} type="number" step="0.01" className="border border-slate-200 w-24 px-1 rounded text-xs"/> : <span className="font-medium text-slate-800">{modelData?.wysokosc || '0.00'} cm</span>}
              
              <span className="text-right text-slate-500 font-semibold pr-3">Objętość:</span>
              {isEditMode ? <input {...register('objetosc')} type="number" step="0.01" className="border border-slate-200 w-24 px-1 rounded text-xs"/> : <span className="font-medium text-slate-800">{modelData?.objetosc || '0.00'} m³</span>}
              
              <span className="text-right text-slate-500 font-semibold pr-3">Waga[kg]:</span>
              {isEditMode ? <input {...register('waga')} type="number" step="0.01" className="border border-slate-200 w-24 px-1 rounded text-xs"/> : <span className="font-medium text-slate-800">{modelData?.waga || '0.00'} kg</span>}
              
              <span className="text-right text-slate-500 font-semibold pr-3">Pobór prądu [W]:</span>
              {isEditMode ? <input {...register('pobor_pradu')} type="number" step="0.01" className="border border-slate-200 w-24 px-1 rounded text-xs"/> : <span className="font-medium text-slate-800">{modelData?.pobor_pradu || '0.00'} W</span>}
            </div>
          </div>

          <div className="flex-1 min-w-[200px]">
            <h3 className="text-sm font-bold text-slate-700 mb-3 ml-24">Magazyny</h3>
            <div className="grid grid-cols-[140px_1fr] gap-y-1.5 text-sm">
              <span className="text-right text-slate-500 font-semibold pr-3">Magazyn:</span>
              <span className="font-bold text-slate-800 flex items-center gap-1"><span className="bg-slate-700 text-white text-[10px] px-1.5 py-0.5 rounded">1</span> Magazyn</span>
              
              <span className="text-right text-slate-500 font-semibold pr-3">Na eventach:</span>
              <span className="font-bold text-blue-500">{onEvents}szt.</span>
              
              <span className="text-right text-slate-500 font-semibold pr-3">W rackach:</span>
              <span className="font-bold text-blue-500">{inRack}szt.</span>

              <span className="text-right text-slate-500 font-semibold pr-3">W kablarkach:</span>
              <span className="font-bold text-blue-500">0szt.</span>

              <span className="text-right text-slate-500 font-semibold pr-3">Miejsce w mag:</span>
              {isEditMode ? <input {...register('miejsce_w_mag')} className="border border-slate-200 w-24 px-1 rounded text-xs uppercase"/> : <span className="font-bold text-slate-600 uppercase">{modelData?.miejsce_w_mag || '-'}</span>}
            </div>
          </div>

          <div className="flex-1 min-w-[200px] border-l border-slate-200 pl-8">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Znakowanie:</h3>
            <div className="text-sm flex flex-col gap-2">
              <div className="flex items-center gap-2">
                 <span className="text-slate-500 font-semibold">Kod kreskowy:</span>
                 {isEditMode ? <input {...register('kod_kreskowy')} className="border border-slate-200 w-32 px-1 rounded text-xs"/> : <span className="font-mono text-slate-800">{modelData?.kod_kreskowy || '-'}</span>}
                 <Copy size={14} className="text-slate-400 cursor-pointer hover:text-slate-700"/>
              </div>
              <div className="flex items-start gap-2 mt-2">
                 <span className="text-slate-500 font-semibold mt-1">QR code</span>
                 <Copy size={14} className="text-slate-400 cursor-pointer hover:text-slate-700 mt-1"/>
                 <div className="w-20 h-20 bg-slate-100 border border-slate-200 ml-4 p-1">
                   <div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover opacity-50 mix-blend-multiply"></div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="px-4 py-2 border border-slate-300 text-slate-600 font-semibold text-xs rounded shadow-sm hover:bg-slate-50">Zarządzaj tagami</button>
          <div className="w-full h-0"></div>
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-sky-600 font-semibold text-xs rounded shadow-sm hover:bg-sky-50"><Calendar size={14}/> Kalendarz dostępności</button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-emerald-600 font-semibold text-xs rounded shadow-sm hover:bg-emerald-50"><List size={14}/> Arkusz dostępności</button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded shadow-sm hover:bg-slate-50"><Share2 size={14}/> Udostępnij sprzęt w Cross Rental Network</button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded shadow-sm hover:bg-slate-50"><Printer size={14}/> Generuj naklejki QR (A4)</button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded shadow-sm hover:bg-slate-50"><Printer size={14}/> Generuj naklejki QR</button>
          <button type="button" className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-400 font-semibold text-xs rounded shadow-sm cursor-not-allowed"><Layers size={14}/> Organizuj</button>
        </div>

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

        {activeTab === 'egzemplarze' && (
          <div className="mt-6 border border-slate-200 rounded-lg shadow-sm bg-white overflow-hidden">
             <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input type="text" className="pl-8 pr-8 py-2 border border-slate-300 rounded text-sm w-64 focus:border-sky-500 outline-none" placeholder="Szukaj..." />
                    <X size={14} className="absolute right-3 top-2.5 text-red-500 cursor-pointer" />
                  </div>
                  <button type="button" className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded text-xs font-bold hover:bg-slate-800 shadow-sm transition"><Plus size={14}/> Dodaj egzemplarz</button>
                  <button type="button" className="flex items-center gap-2 bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded text-xs font-bold hover:bg-slate-50 shadow-sm transition"><Wrench size={14}/> Wyślij na serwis</button>
                  <button type="button" className="flex items-center gap-2 bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded text-xs font-bold hover:bg-slate-50 shadow-sm transition"><MessageSquare size={14}/> Dodaj uwagi</button>
                  <button type="button" className="flex items-center gap-2 bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded text-xs font-bold hover:bg-slate-50 shadow-sm transition"><FileText size={14}/> Exportuj</button>
                  <button type="button" className="flex items-center gap-2 bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded text-xs font-bold hover:bg-slate-50 shadow-sm transition"><FileText size={14}/> Exportuj Excel</button>
                  <button type="button" className="flex items-center gap-2 bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded text-xs font-bold hover:bg-slate-50 shadow-sm transition"><Barcode size={14}/> Skanuj</button>
                </div>
                <button type="button" className="flex items-center gap-2 bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded text-xs font-bold hover:bg-slate-50 shadow-sm transition"><Trash2 size={14}/> Usuń</button>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-white border-b border-slate-200 text-xs font-bold text-slate-700">
                   <tr>
                     <th className="p-3 w-10"><input type="checkbox" className="rounded border-slate-300" /></th>
                     <th className="p-3">Nazwa</th>
                     <th className="p-3">Numer</th>
                     <th className="p-3">Numer seryjny</th>
                     <th className="p-3">Zróbłowy</th>
                     <th className="p-3">Miejsce w magazynie</th>
                     <th className="p-3">Case</th>
                     <th className="p-3">Status serwisowy</th>
                     <th className="p-3">Kod kreskowy</th>
                     <th className="p-3">Uwagi</th>
                     <th className="p-3 text-right">Akcje</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 bg-white">
                   {modelData?.egzemplarze?.map((egz: any, idx: number) => (
                     <tr key={egz.id} className="hover:bg-sky-50/30 transition">
                        <td className="p-3"><input type="checkbox" className="rounded border-slate-300" /></td>
                        <td className="p-3 text-sky-500 font-medium cursor-pointer">{modelData.nazwa}</td>
                        <td className="p-3 text-slate-600">{idx + 1}</td>
                        <td className="p-3 font-mono text-slate-700 flex items-center gap-2">{egz.sn || '-'} <Copy size={12} className="text-slate-400 cursor-pointer"/></td>
                        <td className="p-3 text-sky-500">{egz.magazyn?.nazwa || 'Magazyn główny'}</td>
                        <td className="p-3 text-slate-600 uppercase">{egz.miejsce_w_mag || modelData.miejsce_w_mag || 'PIETRO'}</td>
                        <td className="p-3 text-slate-400">-</td>
                        <td className="p-3">
                           <span className="bg-emerald-500 text-white px-2 py-1 rounded text-[11px] font-bold shadow-sm">Sprawny</span>
                        </td>
                        <td className="p-3 font-mono text-slate-700 flex items-center gap-2">{egz.kod_kreskowy || '-'} <Copy size={12} className="text-slate-400 cursor-pointer"/></td>
                        <td className="p-3 text-slate-400"><MessageSquare size={16} /></td>
                        <td className="p-3 flex items-center justify-end gap-3 text-slate-400">
                          <Eye size={16} className="cursor-pointer hover:text-sky-500" />
                          <div className="w-6 h-6 bg-slate-700 rounded text-white flex items-center justify-center cursor-pointer hover:bg-slate-800"><Edit2 size={12} /></div>
                          <X size={20} className="cursor-pointer font-bold text-slate-800 hover:text-red-500" />
                        </td>
                     </tr>
                   ))}
                   {(!modelData?.egzemplarze || modelData.egzemplarze.length === 0) && !isNew && (
                     <tr>
                        <td colSpan={11} className="p-6 text-center text-slate-400 text-sm">Brak utworzonych egzemplarzy dla tego modelu.</td>
                     </tr>
                   )}
                   {isNew && (
                     <tr>
                        <td colSpan={11} className="p-6 text-center text-slate-400 text-sm">Zapisz model sprzętu, aby dodać pierwsze egzemplarze.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab !== 'egzemplarze' && (
           <div className="mt-10 text-center text-slate-400 text-sm font-medium">
             Sekcja <span className="uppercase text-slate-600 font-bold">{activeTab}</span> w przygotowaniu.
           </div>
        )}

        {isEditMode && (
          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-200">
            <button type="button" onClick={() => {setIsEditMode(false); reset(modelData);}} className="px-6 py-2 border border-slate-300 rounded shadow-sm text-sm font-bold text-slate-600 hover:bg-slate-50 transition">Anuluj</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-emerald-500 text-white px-8 py-2 rounded shadow-md text-sm font-bold hover:bg-emerald-600 transition disabled:opacity-50">
              {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}
              Zapisz model
            </button>
          </div>
        )}
      </form>
    </div>
  );
}