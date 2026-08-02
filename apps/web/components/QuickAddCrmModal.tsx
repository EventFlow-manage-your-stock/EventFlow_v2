'use client';

import { useState } from 'react';
import { api } from '../lib/api';
import { Button, Field, inputClass } from './ProductUI';
import { SimpleModal } from './SimpleModal';

type QuickAddCrmModalProps = {
  mode: 'kontrahent' | 'kontakt';
  parentId?: number | string | null; // Wymagane dla kontaktu (id_kontrahenta)
  onClose: () => void;
  onSuccess: (type: 'kontrahent' | 'kontakt', data: any) => void;
};

export function QuickAddCrmModal({ mode, parentId, onClose, onSuccess }: QuickAddCrmModalProps) {
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (mode === 'kontrahent') {
        const payload = { ...form, czy_klient: true, zrodlo_danych: 'recznie' };
        const res = await api.post('/api/crm/kontrahenci', payload);
        onSuccess('kontrahent', res.data);
      } else {
        if (!parentId) throw new Error('Brak ID kontrahenta dla nowego kontaktu.');
        const payload = { ...form, id_kontrahenta: Number(parentId) };
        const res = await api.post('/api/crm/kontakty', payload);
        onSuccess('kontakt', res.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Wystąpił błąd podczas zapisu.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SimpleModal 
      title={mode === 'kontrahent' ? 'Szybkie dodanie klienta' : 'Szybkie dodanie kontaktu'} 
      onClose={onClose}
      className="max-w-xl"
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
        
        {mode === 'kontrahent' ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Nazwa firmy / Klienta *">
                <input className={inputClass} value={form.nazwa || ''} onChange={(e) => setForm({ ...form, nazwa: e.target.value })} required autoFocus />
              </Field>
            </div>
            <Field label="NIP">
              <input className={inputClass} value={form.nip || ''} onChange={(e) => setForm({ ...form, nip: e.target.value })} />
            </Field>
            <Field label="E-mail firmy">
              <input type="email" className={inputClass} value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Telefon">
              <input className={inputClass} value={form.telefon || ''} onChange={(e) => setForm({ ...form, telefon: e.target.value })} />
            </Field>
            <Field label="Miasto">
              <input className={inputClass} value={form.miasto || ''} onChange={(e) => setForm({ ...form, miasto: e.target.value })} />
            </Field>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Imię *">
              <input className={inputClass} value={form.imie || ''} onChange={(e) => setForm({ ...form, imie: e.target.value })} required autoFocus />
            </Field>
            <Field label="Nazwisko">
              <input className={inputClass} value={form.nazwisko || ''} onChange={(e) => setForm({ ...form, nazwisko: e.target.value })} />
            </Field>
            <Field label="Stanowisko">
              <input className={inputClass} value={form.stanowisko || ''} onChange={(e) => setForm({ ...form, stanowisko: e.target.value })} />
            </Field>
            <Field label="Telefon">
              <input className={inputClass} value={form.telefon || ''} onChange={(e) => setForm({ ...form, telefon: e.target.value })} />
            </Field>
            <div className="md:col-span-2">
              <Field label="E-mail służbowy">
                <input type="email" className={inputClass} value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Anuluj</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Zapisywanie...' : 'Dodaj rekord'}</Button>
        </div>
      </form>
    </SimpleModal>
  );
}