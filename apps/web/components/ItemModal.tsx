'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Loader2, Bold, Italic, Strikethrough, Link, List, ListOrdered } from 'lucide-react';
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
      // Czyszczenie payloadu przed wysłaniem na serwer
      const cleanNumber = (val: any) => (val === "" || val === undefined || val === null) ? null : Number(val);
      const cleanString = (val: any) => (val === "" || val === undefined || val === null) ? null : String(val);

      const payload = {
        ...data,
        id_magazynu: cleanNumber(data.id_magazynu),
        id_case: cleanNumber(data.id_case),
        cena_zakupu: cleanNumber(data.cena_zakupu),
        data_produkcji: cleanString(data.data_produkcji),
        pakowany_pojedynczo: !!data.pakowany_pojedynczo,
        nazwa: cleanString(data.nazwa),
        numer_urzadzenia: cleanString(data.numer_urzadzenia),
        sn: cleanString(data.sn),
        miejsce_w_mag: cleanString(data.miejsce_w_mag),
        opis: cleanString(data.opis),
        status_serwisowy: cleanString(data.status_serwisowy),
        kod_kreskowy: cleanString(data.kod_kreskowy),
      };

      if (isEdit) {
        await api.put(`/api/magazyn/egzemplarze/${initialData.id}`, payload);
      } else {
        await api.post(`/api/magazyn/modele/${modelId}/egzemplarze`, payload);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Błąd zapisu egzemplarza:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-4xl bg-white shadow-2xl flex flex-col rounded-xl overflow-hidden z-10 animate-fade-in-up">
        {/* HEADER MODALA */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? 'Edycja egzemplarza' : 'Dodaj nowy egzemplarz'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* KOLUMNA LEWA */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Model</label>
                <div className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm text-slate-500 cursor-not-allowed">
                  {modelName}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Nazwa</label>
                <input
                  type="text"
                  {...register('nazwa')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Numer urządzenia</label>
                <input
                  type="text"
                  {...register('numer_urzadzenia')}
                  placeholder="np. 4"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Numer seryjny (SN)</label>
                <input
                  type="text"
                  {...register('sn')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Data produkcji</label>
                <input
                  type="date"
                  {...register('data_produkcji')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm transition text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Magazyn</label>
                <select
                  {...register('id_magazynu')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm transition bg-white"
                >
                  <option value="">Wybierz...</option>
                  {magazyny.map(m => <option key={m.id} value={m.id}>{m.nazwa}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Miejsce w magazynie</label>
                <input
                  type="text"
                  {...register('miejsce_w_mag')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm transition uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Opis (Notatki usterkowe)</label>
                <div className="border border-slate-300 rounded-md overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition bg-white">
                  <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50">
                    <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-500"><Bold size={14}/></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-500"><Italic size={14}/></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-500"><Strikethrough size={14}/></button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-500"><List size={14}/></button>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-500"><ListOrdered size={14}/></button>
                    <div className="w-px h-4 bg-slate-300 mx-1"></div>
                    <button type="button" className="p-1 hover:bg-slate-200 rounded text-slate-500"><Link size={14}/></button>
                  </div>
                  <textarea
                    {...register('opis')}
                    rows={4}
                    className="w-full p-3 text-sm outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* KOLUMNA PRAWA */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 bg-slate-100 p-3 rounded-md border border-slate-200">
                <input
                  type="checkbox"
                  id="pakowany"
                  {...register('pakowany_pojedynczo')}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="pakowany" className="text-sm font-semibold text-slate-700 cursor-pointer select-none">
                  Pakowany pojedynczo
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Cena zakupu [PLN]</label>
                <input
                  type="number"
                  step="0.01"
                  {...register('cena_zakupu')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Status Serwisowy (Kondycja)</label>
                <select
                  {...register('status_serwisowy')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm font-medium transition bg-white cursor-pointer"
                >
                  <option value="Działa" className="text-emerald-600 font-bold">Działa</option>
                  <option value="Wymaga serwisu (działa)" className="text-amber-500 font-bold">Wymaga serwisu (działa)</option>
                  <option value="Wymaga serwisu (nie działa)" className="text-red-500 font-bold">Wymaga serwisu (nie działa)</option>
                  <option value="W serwisie" className="text-blue-500 font-bold">W serwisie</option>
                  <option value="Naprawiony" className="text-indigo-500 font-bold">Naprawiony</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Przypisz do zbiorczego Case'a</label>
                <select
                  {...register('id_case')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm transition bg-white opacity-50 cursor-not-allowed"
                  disabled
                >
                  <option value="">Wybierz skrzynię/case...</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Zewnętrzny Kod Kreskowy / QR</label>
                <input
                  type="text"
                  {...register('kod_kreskowy')}
                  placeholder="Zeskanuj czytnikiem..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-blue-500 outline-none text-sm transition font-mono bg-blue-50/50"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-start pt-6 mt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center min-w-[120px] gap-2 px-6 py-2.5 text-sm font-bold text-emerald-600 border border-emerald-500 rounded-md hover:bg-emerald-50 transition shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? 'Zapisz zmiany' : 'Zapisz egzemplarz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}