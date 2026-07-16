'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, UserCircle2, Calendar, GripVertical, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, PageTitle } from '../../../components/ProductUI';
import { useZapytaniaStore } from '../../../store/zapytania.store';

const COLUMNS = [
  { id: 'nowe', title: 'Nowe', bg: 'bg-slate-50', header: 'bg-slate-200 text-slate-700', border: 'border-slate-200' },
  { id: 'w_wycenie', title: 'W trakcie wyceny', bg: 'bg-amber-50/50', header: 'bg-amber-100 text-amber-700', border: 'border-amber-200' },
  { id: 'wyslana', title: 'Wycena wysłana', bg: 'bg-blue-50/50', header: 'bg-blue-100 text-blue-700', border: 'border-blue-200' },
  { id: 'zaakceptowane', title: 'Zaakceptowane', bg: 'bg-emerald-50/50', header: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200' },
  { id: 'odrzucone', title: 'Odrzucone', bg: 'bg-red-50/50', header: 'bg-red-100 text-red-700', border: 'border-red-200' },
];

export default function ZapytaniaKanbanPage() {
  const router = useRouter();
  const { items, isLoading, fetchItems, updateStatus } = useZapytaniaStore();
  const [draggedId, setDraggedId] = useState<number | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.setData('text/plain', id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (!isNaN(id)) {
      updateStatus(id, statusId);
    }
    setDraggedId(null);
  };

  if (isLoading && items.length === 0) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-cyan-600">
        <Inbox size={48} className="animate-bounce opacity-50" />
        <span className="font-bold text-slate-500">Ładowanie tablicy...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-100px)] max-w-[1900px] flex-col space-y-6 animate-fade-in-up">
      <div className="flex-shrink-0">
        <PageTitle
          eyebrow="Sprzedaż"
          title="Zapytania Ofertowe"
          description="Zarządzaj nowymi leadami. Przeciągaj eleganckie kafelki między kolumnami, aby zmienić ich etap obsługi."
          action={<Button onClick={() => router.push('/dashboard/zapytania/new')}><Plus size={16} className="inline mr-1" /> Dodaj zapytanie</Button>}
        />
      </div>

      <div className="flex-1 flex gap-5 overflow-x-auto pb-6 custom-scrollbar px-1">
        {COLUMNS.map((col) => {
          const columnItems = items.filter(item => item.status === col.id);
          
          return (
            <div 
              key={col.id} 
              className={`flex-shrink-0 w-[340px] flex flex-col rounded-3xl border shadow-sm transition-colors duration-300 ${col.bg} ${col.border}`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* HEADER KOLUMNY */}
              <div className={`m-2 rounded-2xl px-5 py-3.5 flex items-center justify-between shadow-sm ${col.header}`}>
                <h3 className="font-black text-sm tracking-tight">{col.title}</h3>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-white/60 shadow-sm">{columnItems.length}</span>
              </div>
              
              {/* KARTY W KOLUMNIE */}
              <div className="flex-1 p-3 overflow-y-auto custom-scrollbar space-y-3">
                <AnimatePresence>
                  {columnItems.map((item) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: draggedId === item.id ? 0.5 : 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      key={item.id}
                      draggable
                      onDragStart={(e: any) => handleDragStart(e, item.id)}
                      onDragEnd={() => setDraggedId(null)}
                      onClick={() => router.push(`/dashboard/zapytania/${item.id}`)}
                      className={`group relative bg-white p-5 rounded-2xl border shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-cyan-300 ${draggedId === item.id ? 'border-cyan-400 shadow-xl ring-2 ring-cyan-100 z-50' : 'border-slate-200'}`}
                    >
                      {/* Boczny pasek statusu kafelka */}
                      <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-md ${col.header.split(' ')[0]}`} />

                      <div className="flex items-start justify-between mb-3">
                        <div className="flex gap-2 items-center text-xs font-bold text-slate-400">
                          <GripVertical size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 -ml-1" />
                          <span className="text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-100">#{item.id}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                          <Calendar size={12} />
                          {new Date(item.data_utworzenia).toLocaleDateString('pl-PL')}
                        </div>
                      </div>
                      
                      <h4 className="font-black text-slate-900 leading-tight mb-2 group-hover:text-cyan-700 transition-colors">
                        {item.tytul}
                      </h4>
                      
                      <div className="mb-4 text-xs font-semibold text-slate-500 truncate">
                        {item.kontrahent?.nazwa || item.kontrahent_reczny || 'Brak powiązanego klienta'}
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                        {item.tworca?.avatar ? (
                          <img src={item.tworca.avatar} alt="avatar" className="w-6 h-6 rounded-full object-cover ring-2 ring-white shadow-sm" />
                        ) : (
                          <UserCircle2 size={24} className="text-slate-300" />
                        )}
                        <span className="text-[11px] font-bold text-slate-600">
                          {item.tworca?.imie} {item.tworca?.nazwisko?.charAt(0)}.
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {columnItems.length === 0 && (
                  <div className="h-24 rounded-2xl border-2 border-dashed border-slate-200/60 flex items-center justify-center text-xs font-bold text-slate-400">
                    Przeciągnij tutaj
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}