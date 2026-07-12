'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { api } from '../lib/api';
import { googleMapsDirectionsUrl } from '../lib/googleMaps';
import { Button, Field, inputClass } from './ProductUI';
import { SimpleModal } from './SimpleModal';

function dt(date: Date) {
  return date.toISOString().slice(0, 16);
}

export type QuickAddDictionaries = {
  typy?: any[];
  statusy?: any[];
  kontrahenci?: any[];
  miejsca?: any[];
  uzytkownicy?: any[];
};

export function QuickAddCalendarModal({
  dict,
  onClose,
  onSaved,
}: {
  dict: QuickAddDictionaries;
  onClose: () => void;
  onSaved: () => void;
}) {
  // EVENTFLOW_PRODUCT_POLISH_V5:
  // Jeden wspólny modal dla Kokpitu i Kalendarza. Dzięki temu przycisk Dodaj
  // w kokpicie robi dokładnie to samo, co Dodaj w kalendarzu, bez przechodzenia na /calendar.
  const [form, setForm] = useState<any>({
    typ: 'wydarzenie',
    data_start: dt(new Date()),
    data_koniec: dt(new Date(Date.now() + 3600000)),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: any) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post('/api/kalendarz/szybkie-dodanie', form);
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Nie udało się zapisać wpisu.');
    } finally {
      setSaving(false);
    }
  }

  const maps = googleMapsDirectionsUrl(form.adres_reczny);
  const typ = form.typ;

  return (
    <SimpleModal title="Dodaj do kalendarza" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Co dodajesz?">
            <select className={inputClass} value={form.typ} onChange={(e) => setForm({ ...form, typ: e.target.value })}>
              <option value="wydarzenie">Wydarzenie</option>
              <option value="wypozyczenie">Wypożyczenie</option>
              <option value="spotkanie">Spotkanie</option>
              <option value="prywatne">Wydarzenie prywatne</option>
              <option value="urlop">Urlop</option>
            </select>
          </Field>
          <Field label={typ === 'urlop' ? 'Nazwa / opis urlopu' : 'Nazwa'}>
            <input className={inputClass} value={form.nazwa || ''} onChange={(e) => setForm({ ...form, nazwa: e.target.value })} required={typ !== 'urlop'} />
          </Field>
          <Field label="Start">
            <input type="datetime-local" className={inputClass} value={form.data_start} onChange={(e) => setForm({ ...form, data_start: e.target.value })} />
          </Field>
          <Field label="Koniec">
            <input type="datetime-local" className={inputClass} value={form.data_koniec} onChange={(e) => setForm({ ...form, data_koniec: e.target.value })} />
          </Field>

          {typ === 'urlop' ? (
            <>
              <Field label="Pracownik">
                <select className={inputClass} value={form.id_uzytkownika || ''} onChange={(e) => setForm({ ...form, id_uzytkownika: e.target.value })}>
                  <option value="">Ja / użytkownik zalogowany</option>
                  {(dict.uzytkownicy || []).map((u: any) => <option key={u.id} value={u.id}>{u.imie} {u.nazwisko}</option>)}
                </select>
              </Field>
              <Field label="Rodzaj nieobecności">
                <input className={inputClass} value={form.rodzaj || 'urlop'} onChange={(e) => setForm({ ...form, rodzaj: e.target.value })} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Typ wydarzenia">
                <select className={inputClass} value={form.id_typu_wydarzenia || ''} onChange={(e) => setForm({ ...form, id_typu_wydarzenia: e.target.value })}>
                  <option value="">Wybierz</option>
                  {(dict.typy || []).map((t: any) => <option key={t.id} value={t.id}>{t.nazwa}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className={inputClass} value={form.id_statusu_wydarzenia || ''} onChange={(e) => setForm({ ...form, id_statusu_wydarzenia: e.target.value })}>
                  <option value="">Wybierz</option>
                  {(dict.statusy || []).map((s: any) => <option key={s.id} value={s.id}>{s.ikona || '●'} {s.nazwa}</option>)}
                </select>
              </Field>
              <Field label="Klient">
                <select className={inputClass} value={form.id_kontrahenta || ''} onChange={(e) => setForm({ ...form, id_kontrahenta: e.target.value })}>
                  <option value="">Brak</option>
                  {(dict.kontrahenci || []).map((k: any) => <option key={k.id} value={k.id}>{k.nazwa}</option>)}
                </select>
              </Field>
              <Field label="Miejsce z bazy">
                <select className={inputClass} value={form.id_miejsca || ''} onChange={(e) => setForm({ ...form, id_miejsca: e.target.value })}>
                  <option value="">Dodam ręcznie</option>
                  {(dict.miejsca || []).map((m: any) => <option key={m.id} value={m.id}>{m.nazwa}</option>)}
                </select>
              </Field>
              <Field label="Miejsce ręcznie">
                <input className={inputClass} value={form.miejsce_reczne || ''} onChange={(e) => setForm({ ...form, miejsce_reczne: e.target.value })} />
              </Field>
              <Field label="Adres / Google Maps">
                <input className={inputClass} value={form.adres_reczny || ''} onChange={(e) => setForm({ ...form, adres_reczny: e.target.value })} />
                {maps && <a className="mt-2 inline-flex items-center gap-1 text-xs font-black text-cyan-700" href={maps} target="_blank" rel="noreferrer"><MapPin size={13} /> Sprawdź trasę w Google Maps</a>}
              </Field>
            </>
          )}
        </div>
        <Field label="Opis">
          <textarea className={inputClass} value={form.opis || ''} onChange={(e) => setForm({ ...form, opis: e.target.value })} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Anuluj</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Zapisuję...' : 'Zapisz'}</Button>
        </div>
      </form>
    </SimpleModal>
  );
}
