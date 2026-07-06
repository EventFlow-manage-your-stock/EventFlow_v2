'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, ChevronDown, Plus, Search, Barcode, Video, Edit2, Trash2, Eye, MessageSquare, Loader2
} from 'lucide-react';
import { useWarehouseStore } from '../../../../..//web/store/warehouse.store';

const getStatusColor = (status: string) => {
  if (status === 'Działa' || status === 'Naprawiony') return 'bg-emerald-500';
  if (status?.includes('Wymaga') || status === 'W serwisie') return 'bg-red-500';
  return 'bg-slate-400';
};

export default function PackagesPage() {
  const router = useRouter();
  const { packages, fetchPackages, isLoading } = useWarehouseStore();
  
  // Stan do zarządzania rozwiniętymi wierszami tabeli
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchPackages();
  }, []);

  const toggleRow = (id: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 overflow-y-auto custom-scrollbar">
      
      {/* BREADCRUMBS */}
      <div className="flex items-center px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center text-sm text-slate-500 gap-2 flex-1">
          <span className="cursor-pointer hover:text-sky-600" onClick={() => router.push('/dashboard')}>Kokpit</span> <ChevronRight size={14} />
          <span className="cursor-pointer hover:text-sky-600" onClick={() => router.push('/dashboard/warehouse')}>Magazyn</span> <ChevronRight size={14} />
          <span className="font-bold text-sky-600 pb-0.5 border-b-2 border-sky-600">Opakowania</span>
        </div>
      </div>

      <div className="p-6 max-w-[1600px] w-full mx-auto space-y-4">
        
        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded text-sm font-bold hover:bg-emerald-600 shadow-sm transition">
              <Plus size={16} /> Dodaj
            </button>
            <button className="flex items-center bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded text-sm font-semibold hover:bg-slate-50 shadow-sm transition">
              Usunięte
            </button>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
              <input type="text" className="pl-9 pr-8 py-2 border border-slate-300 rounded text-sm w-64 focus:border-sky-500 outline-none" placeholder="Szukaj..." />
              <XIcon className="absolute right-3 top-2.5 text-red-500 cursor-pointer" size={16} />
            </div>
            <button className="flex items-center gap-2 bg-white border border-slate-300 text-slate-600 px-4 py-2 rounded text-sm font-semibold hover:bg-slate-50 shadow-sm transition">
              <Barcode size={16} /> Skanuj
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select className="border border-slate-300 rounded text-sm px-3 py-2 outline-none cursor-pointer bg-white text-slate-600 font-medium">
              <option>Wszystkie</option>
            </select>
            <select className="border border-slate-300 rounded text-sm px-3 py-2 outline-none cursor-pointer bg-white text-slate-600 font-medium">
              <option>Wybierz typ...</option>
            </select>
            <select className="border border-slate-300 rounded text-sm px-3 py-2 outline-none cursor-pointer bg-white text-slate-600 font-medium">
              <option>Wybierz magazyn...</option>
            </select>
            <select className="border border-slate-300 rounded text-sm px-3 py-2 outline-none cursor-pointer bg-white text-slate-600 font-medium">
              <option>Wybierz kategorię...</option>
            </select>
          </div>
        </div>

        {/* PAGINACJA I PRZYCISK WIDEO */}
        <div className="flex items-center justify-between">
          <div className="flex items-center border border-slate-200 rounded overflow-hidden bg-white text-sm shadow-sm">
            <button className="px-3 py-1.5 hover:bg-slate-50 text-slate-400 border-r border-slate-200">«</button>
            <button className="px-3 py-1.5 hover:bg-slate-50 text-slate-600 border-r border-slate-200 font-bold bg-slate-100">1</button>
            <button className="px-3 py-1.5 hover:bg-slate-50 text-slate-600 border-r border-slate-200">2</button>
            <button className="px-3 py-1.5 hover:bg-slate-50 text-slate-600 border-r border-slate-200">3</button>
            <button className="px-3 py-1.5 hover:bg-slate-50 text-slate-600 border-r border-slate-200">4</button>
            <button className="px-3 py-1.5 hover:bg-slate-50 text-slate-600 border-r border-slate-200">5</button>
            <button className="px-3 py-1.5 hover:bg-slate-50 text-slate-400">»</button>
          </div>

          <button className="flex items-center gap-2 border border-emerald-500 text-emerald-600 px-4 py-2 rounded text-sm font-bold hover:bg-emerald-50 transition shadow-sm bg-white">
            <Video size={16} className="fill-emerald-600" /> Zobacz jak działają opakowania
          </button>
        </div>

        {/* TABELA GŁÓWNA */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-10 flex justify-center items-center text-slate-500 gap-3">
              <Loader2 className="animate-spin" /> Ładowanie opakowań...
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white border-b border-slate-200 text-xs font-bold text-slate-600">
                <tr>
                  <th className="p-3 w-16 text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
                  <th className="p-3 w-10"></th>
                  <th className="p-3">Nazwa</th>
                  <th className="p-3">Nr</th>
                  <th className="p-3">Typ</th>
                  <th className="p-3 text-center">Pojemność</th>
                  <th className="p-3">Numery</th>
                  <th className="p-3">Magazyn</th>
                  <th className="p-3">Kategoria</th>
                  <th className="p-3">Kod kreskowy</th>
                  <th className="p-3">Sprzęt/Model case</th>
                  <th className="p-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {packages.map((pkg) => {
                  const isExpanded = expandedRows.has(pkg.id);
                  const totalWagaWewnetrzna = pkg.zawartosc_case.reduce((acc: number, item: any) => acc + Number(item.waga || item.model?.waga || 0), 0);
                  const totalWaga = Number(pkg.waga || pkg.model?.waga || 0) + totalWagaWewnetrzna;
                  const numery = pkg.zawartosc_case.map((c: any) => c.numer_urzadzenia).filter(Boolean).join('/') + (pkg.zawartosc_case.length > 0 ? '/' : '-');

                  return (
                    <React.Fragment key={`pkg-${pkg.id}`}>
                      {/* WIERSZ GŁÓWNY (CASE) */}
                      <tr className="hover:bg-slate-50 transition border-b border-slate-200">
                        <td className="p-3 text-center"><input type="checkbox" className="rounded border-slate-300" /></td>
                        <td className="p-3 text-center cursor-pointer" onClick={() => toggleRow(pkg.id)}>
                          <div className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 text-slate-500">
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                        </td>
                        <td className="p-3">
                          <div 
                            className="text-sky-500 font-medium cursor-pointer hover:underline"
                            onClick={() => router.push(`/dashboard/warehouse/items/${pkg.id}`)}
                          >
                            {pkg.nazwa || pkg.model?.nazwa}
                          </div>
                          <div className="text-[11px] text-slate-500 flex gap-2 mt-0.5">
                            <span className="font-bold text-emerald-600">{pkg.zawartosc_case.length} szt</span>
                            <span>Waga: {totalWaga.toFixed(1)}kg</span>
                          </div>
                        </td>
                        <td className="p-3 font-bold text-slate-700">{pkg.numer_urzadzenia || '-'}</td>
                        <td className="p-3 text-slate-500">{pkg.model?.nazwa}</td>
                        <td className="p-3 text-center text-slate-600">{pkg.zawartosc_case.length} szt.</td>
                        <td className="p-3 text-slate-500 text-xs">{numery}</td>
                        <td className="p-3 text-slate-600">{pkg.magazyn?.nazwa || 'Główny'}</td>
                        <td className="p-3 text-slate-600">{pkg.model?.kategoria?.nazwa || '-'}</td>
                        <td className="p-3 font-mono text-slate-600">{pkg.kod_kreskowy || '-'}</td>
                        <td className="p-3 text-sky-600 cursor-pointer hover:underline" onClick={() => router.push(`/dashboard/warehouse/models/${pkg.id_modelu}`)}>
                          {pkg.model?.nazwa}
                        </td>
                        <td className="p-3 flex items-center justify-end gap-2 text-slate-400">
                          <Eye size={16} className="cursor-pointer hover:text-sky-500" onClick={() => router.push(`/dashboard/warehouse/items/${pkg.id}`)} />
                          <div 
                            className="w-7 h-7 bg-slate-700 rounded text-white flex items-center justify-center cursor-pointer hover:bg-slate-800 ml-1"
                            onClick={() => router.push(`/dashboard/warehouse/items/${pkg.id}`)}
                          >
                            <Edit2 size={12} />
                          </div>
                          <Trash2 size={16} className="cursor-pointer hover:text-red-500 ml-1" />
                        </td>
                      </tr>

                      {/* ZAGNIEŻDŻONA TABELA (ZAWARTOŚĆ) */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={12} className="p-0 bg-slate-50 border-b-2 border-slate-200">
                            <div className="pl-16 pr-4 py-4">
                              <table className="w-full text-left text-sm whitespace-nowrap bg-white border border-slate-200 shadow-sm rounded">
                                <thead className="bg-slate-100 text-xs font-bold text-slate-600 border-b border-slate-200">
                                  <tr>
                                    <th className="p-2 w-10 text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
                                    <th className="p-2">Nazwa</th>
                                    <th className="p-2">Nr</th>
                                    <th className="p-2">Numer seryjny</th>
                                    <th className="p-2">Magazyn</th>
                                    <th className="p-2">Status serwisowy</th>
                                    <th className="p-2">Kod kreskowy</th>
                                    <th className="p-2 text-center">Uwagi</th>
                                    <th className="p-2 text-right pr-4">Akcje</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {pkg.zawartosc_case.map((item: any) => (
                                    <tr key={`item-${item.id}`} className="hover:bg-slate-50">
                                      <td className="p-2 text-center"><input type="checkbox" className="rounded border-slate-300" /></td>
                                      <td 
                                        className="p-2 text-sky-500 cursor-pointer hover:underline font-medium"
                                        onClick={() => router.push(`/dashboard/warehouse/models/${item.id_modelu}`)}
                                      >
                                        {item.nazwa || item.model?.nazwa}
                                      </td>
                                      <td className="p-2 text-slate-700 font-bold">{item.numer_urzadzenia || '-'}</td>
                                      <td className="p-2 font-mono text-slate-600 flex items-center gap-2">
                                        {item.sn || '-'} <CopyIcon className="text-slate-300 cursor-pointer hover:text-slate-600" />
                                      </td>
                                      <td className="p-2 text-slate-600">{item.magazyn?.nazwa || 'Magazyn główny'}</td>
                                      <td className="p-2">
                                        <span className={`px-2 py-1 rounded text-white text-[11px] font-bold shadow-sm ${getStatusColor(item.status_serwisowy)}`}>
                                          {item.status_serwisowy || 'Działa'}
                                        </span>
                                      </td>
                                      <td className="p-2 font-mono text-slate-600 flex items-center gap-2">
                                        {item.kod_kreskowy || '-'} <CopyIcon className="text-slate-300 cursor-pointer hover:text-slate-600" />
                                      </td>
                                      <td className="p-2 text-center text-slate-400">
                                        {item.opis ? <MessageSquare size={16} className="text-amber-500 mx-auto" title={item.opis} /> : <MessageSquare size={16} className="mx-auto" />}
                                      </td>
                                      <td className="p-2 flex items-center justify-end gap-3 text-slate-600 pr-4">
                                        <XIcon className="cursor-pointer hover:text-red-500 stroke-[3]" size={16} />
                                      </td>
                                    </tr>
                                  ))}
                                  {pkg.zawartosc_case.length === 0 && (
                                    <tr>
                                      <td colSpan={9} className="p-4 text-center text-slate-400 italic">Skrzynia jest pusta.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {packages.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={12} className="p-10 text-center text-slate-500">Brak opakowań w magazynie. Utwórz model z typem "Opakowanie" i dodaj do niego egzemplarze.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// Lokalny helper do ikony kopiowania X (bo X normalnie to krzyżyk z Lucide)
function XIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
}

function CopyIcon(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
}