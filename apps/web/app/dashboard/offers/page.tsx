'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Plus } from 'lucide-react';
import { api } from '../../../lib/api';
import { Button, Card, Field, inputClass, PageTitle } from '../../../components/ProductUI';
import { DataTable } from '../../../components/DataTable';
import { SimpleModal } from '../../../components/SimpleModal';
import { OfferDuplicateTargetModal } from '../../../components/OfferDuplicateTargetModal';

// EVENTFLOW_PRODUCT_POLISH_V17:
// Lista ofert dalej pokazuje wszystkie oferty, ale duplikacja zawsze pyta użytkownika,
// do którego wydarzenia albo wynajmu przypisać nową kopię.
export default function OffersPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [kontrahenci, setKontrahenci] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  async function load() {
    const [o, e, w, k] = await Promise.all([
      api.get('/api/oferty').catch(() => ({ data: [] })),
      api.get('/api/wydarzenia').catch(() => ({ data: [] })),
      api.get('/api/wynajmy').catch(() => ({ data: [] })),
      api.get('/api/slowniki/kontrahenci').catch(() => ({ data: [] })),
    ]);
    setItems(o.data || []);
    setEvents(e.data || []);
    setRentals(w.data || []);
    setKontrahenci(k.data || []);
  }

  useEffect(() => { load(); }, []);

  async function save(e: any) {
    e.preventDefault();
    const r = await api.post('/api/oferty', form);
    setShow(false);
    router.push(`/dashboard/offers/${r.data.id}`);
  }

  return (
    <div className="mx-auto max-w-[1650px] space-y-6">
      <PageTitle
        eyebrow="Oferty"
        title="Lista ofert"
        description="Oferty mogą być przypisane do wydarzenia albo bezpośrednio do wynajmu. Jeden event/wynajem może mieć wiele ofert."
        action={<Button onClick={() => setShow(true)}><Plus size={16} className="inline" /> Dodaj</Button>}
      />

      <Card>
        <DataTable
          rows={items}
          onRowClick={(r: any) => router.push(`/dashboard/offers/${r.id}`)}
          columns={[
            { key: 'numer', label: 'Numer', value: (r: any) => <b>{r.numer || `#${r.id}`}</b> },
            { key: 'nazwa', label: 'Nazwa' },
            { key: 'wydarzenie', label: 'Wydarzenie', value: (r: any) => r.wydarzenie?.nazwa || '-' },
            { key: 'wynajem', label: 'Wynajem', value: (r: any) => r.wynajem?.numer || (r.id_wynajmu ? `#${r.id_wynajmu}` : '-') },
            { key: 'kontrahent', label: 'Klient', value: (r: any) => r.kontrahent?.nazwa || '-' },
            { key: 'status', label: 'Status', value: (r: any) => r.status?.nazwa || '-' },
            { key: 'suma_netto', label: 'Netto', value: (r: any) => `${Number(r.suma_netto || 0).toLocaleString('pl-PL')} zł` },
            { key: 'akcje', label: 'Akcje', value: (r: any) => <button onClick={(e) => { e.stopPropagation(); setDuplicateTarget(r); }} className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-black"><Copy size={13} /> Duplikuj</button> },
          ]}
        />
      </Card>

      {show && (
        <SimpleModal title="Dodaj ofertę" onClose={() => setShow(false)}>
          <form onSubmit={save} className="space-y-4">
            <Field label="Wydarzenie">
              <select className={inputClass} value={form.id_wydarzenia || ''} onChange={(e) => { const ev = events.find((x: any) => String(x.id) === e.target.value); setForm({ ...form, id_wydarzenia: e.target.value, id_wynajmu: '', nazwa: form.nazwa || ev?.nazwa, id_kontrahenta: form.id_kontrahenta || ev?.id_kontrahenta }); }}>
                <option value="">Brak / wybierz wynajem poniżej</option>
                {events.map((e: any) => <option key={e.id} value={e.id}>{e.numer ? `${e.numer} · ` : ''}{e.nazwa}</option>)}
              </select>
            </Field>
            <Field label="Wynajem">
              <select className={inputClass} value={form.id_wynajmu || ''} onChange={(e) => { const w = rentals.find((x: any) => String(x.id) === e.target.value); setForm({ ...form, id_wynajmu: e.target.value, id_wydarzenia: '', nazwa: form.nazwa || `Oferta ${w?.numer || ''}`, id_kontrahenta: form.id_kontrahenta || w?.id_kontrahenta }); }}>
                <option value="">Brak</option>
                {rentals.map((w: any) => <option key={w.id} value={w.id}>{w.numer || `Wynajem #${w.id}`} · {w.kontrahent?.nazwa || ''}</option>)}
              </select>
              <p className="mt-1 text-xs font-bold text-slate-400">Wynajem jest osobnym bytem i może mieć wiele ofert roboczych. Nie łączymy go automatycznie z wydarzeniem.</p>
            </Field>
            <Field label="Skopiuj dane z innej oferty / szablon">
              <select className={inputClass} value={form.id_oferty_szablonu || ''} onChange={(e) => { const src = items.find((x: any) => String(x.id) === e.target.value); setForm({ ...form, id_oferty_szablonu: e.target.value, nazwa: form.nazwa || src?.nazwa, budzet_netto: form.budzet_netto || src?.budzet_netto }); }}>
                <option value="">Nie kopiuj — czysta oferta</option>
                {items.map((o: any) => <option key={o.id} value={o.id}>{o.numer || `#${o.id}`} · {o.nazwa}</option>)}
              </select>
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nazwa oferty"><input className={inputClass} required value={form.nazwa || ''} onChange={(e) => setForm({ ...form, nazwa: e.target.value })} /></Field>
              <Field label="Kontrahent"><select className={inputClass} value={form.id_kontrahenta || ''} onChange={(e) => setForm({ ...form, id_kontrahenta: e.target.value })}><option value="">Brak</option>{kontrahenci.map((k: any) => <option key={k.id} value={k.id}>{k.nazwa}</option>)}</select></Field>
              <Field label="Budżet netto"><input type="number" step="0.01" className={inputClass} value={form.budzet_netto || ''} onChange={(e) => setForm({ ...form, budzet_netto: e.target.value })} /></Field>
              <Field label="Termin płatności dni"><input type="number" className={inputClass} value={form.termin_platnosci_dni || 14} onChange={(e) => setForm({ ...form, termin_platnosci_dni: e.target.value })} /></Field>
            </div>
            <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShow(false)}>Anuluj</Button><Button type="submit">Utwórz ofertę</Button></div>
          </form>
        </SimpleModal>
      )}

      {duplicateTarget && <OfferDuplicateTargetModal offer={duplicateTarget} onClose={() => setDuplicateTarget(null)} onDone={(o) => router.push(`/dashboard/offers/${o.id}`)} />}
    </div>
  );
}
