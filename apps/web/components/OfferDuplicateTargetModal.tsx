'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Field, inputClass } from './ProductUI';
import { SimpleModal } from './SimpleModal';

type Props = {
  offer: any;
  onClose: () => void;
  onDone?: (newOffer: any) => void;
  defaultEventId?: string | number | null;
  defaultRentalId?: string | number | null;
};

// EVENTFLOW_PRODUCT_POLISH_V17:
// Wspólny modal duplikacji oferty. Po kliknięciu Duplikuj system pyta,
// do którego wydarzenia albo wynajmu ma zostać przypisana kopia. Wynajem jest osobny, więc duplikat przypisany do wynajmu nie dostaje id wydarzenia.
export function OfferDuplicateTargetModal({ offer, onClose, onDone, defaultEventId, defaultRentalId }: Props) {
  const [events, setEvents] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [mode, setMode] = useState(defaultRentalId ? 'rental' : 'event');
  const [eventId, setEventId] = useState(defaultEventId ? String(defaultEventId) : offer?.id_wydarzenia ? String(offer.id_wydarzenia) : '');
  const [rentalId, setRentalId] = useState(defaultRentalId ? String(defaultRentalId) : offer?.id_wynajmu ? String(offer.id_wynajmu) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/wydarzenia').catch(() => ({ data: [] })),
      api.get('/api/wynajmy').catch(() => ({ data: [] })),
    ]).then(([e, r]) => {
      setEvents(e.data || []);
      setRentals(r.data || []);
    });
  }, []);

  async function submit(e: any) {
    e.preventDefault();
    setError('');

    const payload: any = {};
    if (mode === 'event') {
      if (!eventId) return setError('Wybierz wydarzenie dla duplikatu oferty.');
      payload.id_wydarzenia = Number(eventId);
      payload.id_wynajmu = null;
    } else {
      if (!rentalId) return setError('Wybierz wynajem/wypożyczenie dla duplikatu oferty.');
      payload.id_wynajmu = Number(rentalId);
      payload.id_wydarzenia = null;
    }

    setSaving(true);
    try {
      const res = await api.post(`/api/oferty/${offer.id}/duplikuj`, payload);
      onDone?.(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Nie udało się zduplikować oferty.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SimpleModal title="Duplikuj ofertę" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">Oferta źródłowa</p>
          <p className="mt-1 text-lg font-black text-slate-900">{offer?.numer || `#${offer?.id}`} · {offer?.nazwa}</p>
          <p className="text-sm font-bold text-slate-500">Duplikat dostanie nowy numer i osobną wersję oferty.</p>
        </div>

        <Field label="Przypisz duplikat do">
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setMode('event')} className={`rounded-2xl border px-4 py-3 text-left text-sm font-black ${mode === 'event' ? 'border-cyan-500 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600'}`}>Wydarzenia</button>
            <button type="button" onClick={() => setMode('rental')} className={`rounded-2xl border px-4 py-3 text-left text-sm font-black ${mode === 'rental' ? 'border-cyan-500 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600'}`}>Wynajmu / wypożyczenia</button>
          </div>
        </Field>

        {mode === 'event' ? (
          <Field label="Wydarzenie docelowe">
            <select className={inputClass} value={eventId} onChange={(e) => setEventId(e.target.value)} required>
              <option value="">Wybierz wydarzenie...</option>
              {events.map((ev: any) => <option key={ev.id} value={ev.id}>{ev.numer ? `${ev.numer} · ` : ''}{ev.nazwa}</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Wynajem / wypożyczenie docelowe">
            <select className={inputClass} value={rentalId} onChange={(e) => setRentalId(e.target.value)} required>
              <option value="">Wybierz wynajem...</option>
              {rentals.map((r: any) => <option key={r.id} value={r.id}>{r.numer || `Wynajem #${r.id}`} · {r.kontrahent?.nazwa || ''}</option>)}
            </select>
          </Field>
        )}

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Anuluj</Button>
          <Button type="submit" disabled={saving}><Copy size={16} className="inline" /> {saving ? 'Duplikuję...' : 'Utwórz duplikat'}</Button>
        </div>
      </form>
    </SimpleModal>
  );
}
