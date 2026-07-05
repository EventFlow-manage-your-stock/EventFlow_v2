'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Loader2 } from 'lucide-react';
import {api}  from '../lib/api';

interface DictionaryItem {
  id: string; // Zakładam użycie UUID/CUID w Prisma
  nazwa: string;
}

interface EventFormValues {
  nazwa_wydarzenia: string;
  data_rozpoczecia: string;
  data_zakonczenia: string;
  id_statusu_wydarzenia: string;
  id_kontrahenta: string;
  id_miejsca: string;
}

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void; // Wywoływane, by wykonać refetch w kalendarzu
}

export function EventForm({ isOpen, onClose, onSuccess }: EventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EventFormValues>();

  const [statusy, setStatusy] = useState<DictionaryItem[]>([]);
  const [kontrahenci, setKontrahenci] = useState<DictionaryItem[]>([]);
  const [miejsca, setMiejsca] = useState<DictionaryItem[]>([]);
  const [isLoadingDicts, setIsLoadingDicts] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchDictionaries();
    } else {
      reset(); 
    }
  }, [isOpen, reset]);

  const fetchDictionaries = async () => {
    setIsLoadingDicts(true);
    try {
      const [statusyRes, kontrahenciRes, miejscaRes] = await Promise.all([
        api.get<DictionaryItem[]>('/api/slowniki/statusy-wydarzenia'),
        api.get<DictionaryItem[]>('/api/slowniki/kontrahenci'),
        api.get<DictionaryItem[]>('/api/slowniki/miejsca'),
      ]);
      setStatusy(statusyRes.data);
      setKontrahenci(kontrahenciRes.data);
      setMiejsca(miejscaRes.data);
    } catch (error) {
      console.error('Błąd pobierania słowników:', error);
      // Opcjonalnie: Dodaj integrację z toast notifications, jeśli używasz np. sonner/react-hot-toast
    } finally {
      setIsLoadingDicts(false);
    }
  };

  const onSubmit = async (data: EventFormValues) => {
    try {
      await api.post('/api/wydarzenia', data);
      if (onSuccess) {
        onSuccess(); 
      }
      onClose();
    } catch (error) {
      console.error('Błąd zapisu wydarzenia:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Tło - overlay uderzające w estetykę bg-slate-900/20 */}
      <div
        className="absolute inset-0 bg-slate-900/20 transition-opacity backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Wysuwany panel boczny */}
      <div className="relative w-full max-w-md h-full bg-white shadow-xl flex flex-col animate-slide-in-right z-10">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Nowe Wydarzenie</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 p-6 space-y-6">
            {isLoadingDicts ? (
              <div className="flex items-center justify-center h-full min-h-[300px]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            ) : (
              <>
                {/* Nazwa wydarzenia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nazwa wydarzenia
                  </label>
                  <input
                    type="text"
                    {...register('nazwa_wydarzenia', { required: 'To pole jest wymagane' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Wprowadź nazwę..."
                  />
                  {errors.nazwa_wydarzenia && (
                    <p className="mt-1 text-sm text-red-600">{errors.nazwa_wydarzenia.message}</p>
                  )}
                </div>

                {/* Harmonogram (Daty) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data rozpoczęcia
                    </label>
                    <input
                      type="datetime-local"
                      {...register('data_rozpoczecia', { required: 'Wymagane' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                    />
                    {errors.data_rozpoczecia && (
                      <p className="mt-1 text-sm text-red-600">{errors.data_rozpoczecia.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data zakończenia
                    </label>
                    <input
                      type="datetime-local"
                      {...register('data_zakonczenia', { required: 'Wymagane' })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
                    />
                    {errors.data_zakonczenia && (
                      <p className="mt-1 text-sm text-red-600">{errors.data_zakonczenia.message}</p>
                    )}
                  </div>
                </div>

                {/* Relacja: Status Wydarzenia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status wydarzenia
                  </label>
                  <select
                    {...register('id_statusu_wydarzenia', { required: 'Wybierz status' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                  >
                    <option value="">Wybierz status...</option>
                    {statusy.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nazwa}
                      </option>
                    ))}
                  </select>
                  {errors.id_statusu_wydarzenia && (
                    <p className="mt-1 text-sm text-red-600">{errors.id_statusu_wydarzenia.message}</p>
                  )}
                </div>

                {/* Relacja: Kontrahent */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kontrahent
                  </label>
                  <select
                    {...register('id_kontrahenta', { required: 'Wybierz kontrahenta' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                  >
                    <option value="">Wybierz kontrahenta...</option>
                    {kontrahenci.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.nazwa}
                      </option>
                    ))}
                  </select>
                  {errors.id_kontrahenta && (
                    <p className="mt-1 text-sm text-red-600">{errors.id_kontrahenta.message}</p>
                  )}
                </div>

                {/* Relacja: Miejsce */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Miejsce
                  </label>
                  <select
                    {...register('id_miejsca', { required: 'Wybierz miejsce' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
                  >
                    <option value="">Wybierz miejsce...</option>
                    {miejsca.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nazwa}
                      </option>
                    ))}
                  </select>
                  {errors.id_miejsca && (
                    <p className="mt-1 text-sm text-red-600">{errors.id_miejsca.message}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Stopka formularza */}
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingDicts}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}