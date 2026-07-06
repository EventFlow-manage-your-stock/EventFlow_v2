'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Loader2, Bold, Italic, Strikethrough, Link as LinkIcon, List, ListOrdered, Calendar as CalendarIcon } from 'lucide-react';
import { api } from '../lib/api';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  modelId: number;
  modelName: string;
  initialData?: any | null; 
}

export default function ItemModal({ isOpen, onClose, onSuccess, modelId, modelName, initialData }: ItemModalProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [magazyny, setMagazyny] = useState<any[]>([]);
  const isEdit = !!initialData;

  useEffect(() => {
    if (isOpen) {
      fetchMagazyny();
      if (initialData) {
        reset({
          ...initialData,
          data_produkcji: initialData.data_produkcji ? initialData.data_produkcji.split('T')[0] : '',
        });
      } else {
        reset({
          nazwa: modelName,
          status_serwisowy: 'Działa',
          pakowany_pojedynczo: false
        });
      }
    }
  }, [isOpen, initialData, modelName]);

  const fetchMagazyny = async () => {
    try {
      const res = await api.get('/api/magazyn/slowniki/magazyny');
      setMagazyny(res.data);
    } catch (error) {
      console.error('Błąd pobierania magazynów:', error);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      if (isEdit) {
        await api.put(`/api/magazyn/egzemplarze/${initialData.id}`, data);
      } else {
        await api.post(`/api/magazyn/modele/${modelId}/egzemplarze`, data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Błąd zapisu egzemplarza:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/30 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-[850px] bg-white shadow-2xl flex flex-col rounded-xl overflow-hidden z-10 animate-fade-in-up">
        {/* HEADER MODALA */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-white">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? 'Edycja egzemplarza' : 'Dodaj nowy egzemplarz'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
            
            {/* KOLUMNA LEWA */}
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Model</label>
                <input
                  disabled
                  value={modelName}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-500 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Nazwa</label>
                <input
                  type="text"
                  {...register('nazwa')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Numer urządzenia</label>
                <input
                  type="text"
                  {...register('numer_urzadzenia')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm bg-blue-50/50"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Numer seryjny (SN)</label>
                <input
                  type="text"
                  {...register('sn')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm font-mono bg-blue-50/50"
                />
              </div>

              <div className="relative">
                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Data produkcji</label>
                <input
                  type="date"
                  {...register('data_produkcji')}
                  className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm text-slate-700 bg-white"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Magazyn</label>
                <select
                  {...register('id_magazynu')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm bg-white cursor-pointer"
                >
                  <option value="">Wybierz...</option>
                  {magazyny.map(m => <option key={m.id} value={m.id}>{m.nazwa}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Miejsce w magazynie</label>
                <input
                  type="text"
                  {...register('miejsce_w_mag')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm bg-blue-50/50 uppercase"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Opis (Notatki usterkowe)</label>
                <div className="border border-slate-300 rounded-md overflow-hidden bg-white">
                  <div className="flex items-center gap-1 p-2 border-b border-slate-200">
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-500"><Bold size={14}/></button>
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-500"><Italic size={14}/></button>
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-500"><Strikethrough size={14}/></button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-500"><List size={14}/></button>
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-500"><ListOrdered size={14}/></button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-500"><LinkIcon size={14}/></button>
                  </div>
                  <textarea
                    {...register('opis')}
                    rows={4}
                    placeholder="Brak kabla zasilającego"
                    className="w-full p-3 text-sm outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* KOLUMNA PRAWA */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 bg-slate-100/50 px-3 py-3 rounded-md border border-slate-200">
                <input
                  type="checkbox"
                  id="pakowany"
                  {...register('pakowany_pojedynczo')}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="pakowany" className="text-[13px] font-bold text-slate-700 cursor-pointer select-none">
                  Pakowany pojedynczo
                </label>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Cena zakupu [PLN]</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('cena_zakupu')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Status Serwisowy (Kondycja)</label>
                <select
                  {...register('status_serwisowy')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm bg-white cursor-pointer font-medium"
                >
                  <option value="Działa" className="text-slate-800">Działa</option>
                  <option value="Wymaga serwisu (działa)" className="text-slate-800">Wymaga serwisu (działa)</option>
                  <option value="Wymaga serwisu (nie działa)" className="text-slate-800">Wymaga serwisu (nie działa)</option>
                  <option value="W serwisie" className="text-slate-800">W serwisie</option>
                  <option value="Naprawiony" className="text-slate-800">Naprawiony</option>
                </select>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Przypisz do zbiorczego Case'a</label>
                <select
                  {...register('id_case')}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-slate-50 opacity-60 cursor-not-allowed"
                  disabled
                >
                  <option value="">Wybierz skrzynię/case...</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[13px] font-bold text-slate-600 mb-1.5">Zewnętrzny Kod Kreskowy / QR</label>
                <input
                  type="text"
                  {...register('kod_kreskowy')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm font-mono bg-blue-50/50"
                />
              </div>

              {/* SYMULACJA KODU QR */}
              <div className="pt-6 flex justify-end">
                <div className="w-32 h-32 bg-white border border-slate-200 p-2 shadow-sm rounded-lg">
                  <div className="w-full h-full bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover opacity-80 mix-blend-multiply"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-[13px] font-bold text-emerald-600 border border-emerald-500 rounded bg-white hover:bg-emerald-50 transition shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz egzemplarz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}