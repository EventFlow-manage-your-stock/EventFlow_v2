'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { api } from '../../../lib/api';
import { Button, Card, Field, inputClass, PageTitle } from '../../../components/ProductUI';
import { DataTable } from '../../../components/DataTable';
import { SimpleModal } from '../../../components/SimpleModal';

function d(v: any) { return v ? new Date(v).toLocaleDateString('pl-PL') : '-'; }

export default function RentalsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [dict, setDict] = useState<any>({ kontrahenci: [], statusy: [] });
  const [filters, setFilters] = useState<any>({ kontrahent: '', status: '', od: '', do: '' });
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [r, k, s] = await Promise.all([
        api.get('/api/wynajmy').catch(() => ({ data: [] })),
        api.get('/api/slowniki/kontrahenci').catch(() => ({ data: [] })),
        api.get('/api/slowniki/statusy-wynajmu').catch(() => ({ data: [] })),
      ]);
      setItems(r.data || []);
      setDict({ kontrahenci: k.data || [], statusy: s.data || [] });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((w: any) => {
    if (filters.kontrahent && String(w.id_kontrahenta || w.kontrahent?.id) !== filters.kontrahent) return false;
    if (filters.status && String(w.id_statusu_wynajmu || w.status?.id) !== filters.status) return false;
    const date = w.data_wydania?.slice?.(0, 10);
    if (filters.od && date && date < filters.od) return false;
    if (filters.do && date && date > filters.do) return false;
    return true;
  }), [items, filters]);

  async function save(e: any) {
    e.preventDefault();
    await api.post('/api/wynajmy', form);
    setShow(false);
    setForm({});
    load();
  }

  return <div className="mx-auto max-w-[1650px] space-y-6">
    <PageTitle eyebrow="Wypożyczenia" title="Lista wypożyczeń" description="Wynajem jest osobnym bytem. Wydanie sprzętu do wydarzenia obsługujesz przez WZ/PZ, nie przez moduł wynajmu." action={<Button onClick={() => setShow(true)}><Plus size={16} className="inline" /> Dodaj</Button>} />
    <Card>
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <Field label="Status"><select className={inputClass} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Wszystkie</option>{dict.statusy.map((s: any) => <option key={s.id} value={s.id}>{s.nazwa}</option>)}</select></Field>
        <Field label="Kontrahent"><select className={inputClass} value={filters.kontrahent} onChange={(e) => setFilters({ ...filters, kontrahent: e.target.value })}><option value="">Wszyscy</option>{dict.kontrahenci.map((k: any) => <option key={k.id} value={k.id}>{k.nazwa}</option>)}</select></Field>
        <Field label="Od"><input type="date" className={inputClass} value={filters.od} onChange={(e) => setFilters({ ...filters, od: e.target.value })} /></Field>
        <Field label="Do"><input type="date" className={inputClass} value={filters.do} onChange={(e) => setFilters({ ...filters, do: e.target.value })} /></Field>
      </div>
      {loading ? <p className="p-8 text-center font-bold text-slate-400">Ładowanie...</p> : <DataTable rows={filtered} onRowClick={(r:any)=>router.push(`/dashboard/rentals/${r.id}`)} columns={[{ key: 'numer', label: 'Numer', value: (r: any) => <b>{r.numer || `#${r.id}`}</b> }, { key: 'kontrahent', label: 'Kontrahent', value: (r: any) => r.kontrahent?.nazwa || '-' }, { key: 'status', label: 'Status', value: (r: any) => r.status?.nazwa || '-' }, { key: 'data_wydania', label: 'Wydanie', value: (r: any) => d(r.data_wydania), sortValue: (r: any) => r.data_wydania }, { key: 'data_zwrotu_planowana', label: 'Zwrot planowany', value: (r: any) => d(r.data_zwrotu_planowana) }, { key: 'pozycje', label: 'Pozycji', value: (r: any) => r.pozycje?.length || 0 }]} />}
    </Card>
    {show && <SimpleModal title="Dodaj wypożyczenie" onClose={() => setShow(false)}><form onSubmit={save} className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Field label="Numer"><input className={inputClass} value={form.numer || ''} onChange={(e) => setForm({ ...form, numer: e.target.value })} placeholder="automatyczny, jeśli puste" /></Field><Field label="Kontrahent"><select className={inputClass} value={form.id_kontrahenta || ''} onChange={(e) => setForm({ ...form, id_kontrahenta: e.target.value })}><option value="">Brak</option>{dict.kontrahenci.map((k: any) => <option key={k.id} value={k.id}>{k.nazwa}</option>)}</select></Field><Field label="Status"><select className={inputClass} value={form.id_statusu_wynajmu || ''} onChange={(e) => setForm({ ...form, id_statusu_wynajmu: e.target.value })}><option value="">Domyślny</option>{dict.statusy.map((s: any) => <option key={s.id} value={s.id}>{s.nazwa}</option>)}</select></Field><Field label="Data wydania"><input type="datetime-local" className={inputClass} onChange={(e) => setForm({ ...form, data_wydania: e.target.value })} /></Field><Field label="Planowany zwrot"><input type="datetime-local" className={inputClass} onChange={(e) => setForm({ ...form, data_zwrotu_planowana: e.target.value })} /></Field></div><Field label="Notatki"><textarea className={inputClass} value={form.notatki_wewnetrzne || ''} onChange={(e) => setForm({ ...form, notatki_wewnetrzne: e.target.value })} /></Field><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShow(false)}>Anuluj</Button><Button type="submit">Zapisz</Button></div></form></SimpleModal>}
  </div>;
}
