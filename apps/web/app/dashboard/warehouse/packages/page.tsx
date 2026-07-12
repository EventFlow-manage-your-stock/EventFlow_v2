'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Plus } from 'lucide-react';
import { api } from '../../../../lib/api';
import { Button, Card, Field, inputClass, PageTitle } from '../../../../components/ProductUI';
import { DataTable } from '../../../../components/DataTable';
import { SimpleModal } from '../../../../components/SimpleModal';

export default function PackagesPage() {
  const router = useRouter();
  const [view, setView] = useState<'egzemplarze' | 'typy'>('egzemplarze');
  const [items, setItems] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [magazyny, setMagazyny] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({ rozroznij_kod_qr: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [p, m, mag] = await Promise.all([
        api.get('/api/magazyn/opakowania').catch(() => ({ data: [] })),
        api.get('/api/magazyn/modele').catch(() => ({ data: [] })),
        api.get('/api/magazyn/slowniki/magazyny').catch(() => ({ data: [] })),
      ]);
      setItems(p.data || []);
      setModels((m.data || []).filter((x: any) => x.typ_sprzetu === 'opakowanie'));
      setMagazyny(mag.data || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function updateBarcode(value: string) {
    setForm((prev: any) => ({ ...prev, kod_kreskowy: value, zewnetrzny_kod_kreskowy: value, zewnetrzny_qr_kod: prev.rozroznij_kod_qr ? prev.zewnetrzny_qr_kod : value, qr_kod: prev.rozroznij_kod_qr ? prev.qr_kod : value }));
  }
  async function save(e: any) {
    e.preventDefault(); setError('');
    try {
      const payload = { ...form, zewnetrzny_qr_kod: form.rozroznij_kod_qr ? form.zewnetrzny_qr_kod : (form.kod_kreskowy || form.zewnetrzny_kod_kreskowy), qr_kod: form.rozroznij_kod_qr ? form.zewnetrzny_qr_kod : (form.kod_kreskowy || form.zewnetrzny_kod_kreskowy) };
      await api.post('/api/magazyn/opakowania', payload);
      setShow(false); setForm({ rozroznij_kod_qr: false }); load();
    } catch (err: any) { setError(err?.response?.data?.message || err.message || 'Nie udało się dodać opakowania.'); }
  }

  const modelRows = useMemo(() => models.map((m: any) => ({ ...m, egzemplarzy: items.filter((i: any) => String(i.id_modelu) === String(m.id)).length })), [models, items]);

  return <div className="mx-auto max-w-[1650px] space-y-6">
    <PageTitle eyebrow="Magazyn" title="Opakowania" description="Przełączaj widok między typami opakowań a fizycznymi egzemplarzami/case’ami. W podglądzie case widać sprzęt znajdujący się wewnątrz." action={<Button onClick={() => setShow(true)}><Plus size={16} className="inline" /> Dodaj</Button>} />
    <Card className="!p-4"><div className="flex flex-wrap gap-2"><button onClick={() => setView('egzemplarze')} className={`rounded-xl px-4 py-2 text-sm font-black ${view === 'egzemplarze' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Egzemplarze opakowań</button><button onClick={() => setView('typy')} className={`rounded-xl px-4 py-2 text-sm font-black ${view === 'typy' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Typy opakowań</button></div></Card>
    <Card>{loading ? <p className="p-8 text-center font-bold text-slate-400">Ładowanie...</p> : view === 'egzemplarze' ? <DataTable rows={items} onRowClick={(r:any)=>router.push(`/dashboard/warehouse/packages/${r.id}`)} columns={[{ key: 'nazwa', label: 'Nazwa', value: (r: any) => <b>{r.nazwa || r.model?.nazwa}</b> }, { key: 'model', label: 'Typ opakowania', value: (r: any) => r.model?.nazwa || '-' }, { key: 'numer_egzemplarza', label: 'Nr', value: (r: any) => r.numer_egzemplarza || r.numer_urzadzenia || '-' }, { key: 'magazyn', label: 'Magazyn', value: (r: any) => r.magazyn?.nazwa || '-' }, { key: 'kod_kreskowy', label: 'Kod kreskowy' }, { key: 'zawartosc', label: 'Zawartość case', value: (r: any) => <span><b>{r.zawartosc_case?.length || 0} szt.</b>{r.zawartosc_case?.length ? <span className="ml-2 text-xs text-slate-500">{r.zawartosc_case.slice(0, 3).map((x: any) => x.nazwa || x.model?.nazwa).join(', ')}{r.zawartosc_case.length > 3 ? '…' : ''}</span> : null}</span> }, { key: 'status_serwisowy', label: 'Status' }]} /> : <DataTable rows={modelRows} onRowClick={(r:any)=>router.push(`/dashboard/warehouse/models/${r.id}`)} columns={[{ key: 'nazwa', label: 'Typ opakowania', value: (r:any)=><b>{r.nazwa}</b> }, { key: 'kategoria', label: 'Kategoria', value: (r:any)=>r.kategoria?.nazwa || '-' }, { key: 'egzemplarzy', label: 'Egzemplarzy' }, { key: 'wartosc', label: 'Wartość domyślna', value: (r:any)=>r.wartosc_domyslna_egzemplarza || r.wartosc || '-' }]} />}</Card>
    {show && <SimpleModal title="Dodaj opakowanie" onClose={() => setShow(false)}>{error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}<form onSubmit={save} className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Field label="Istniejący typ opakowania"><select className={inputClass} value={form.id_modelu || ''} onChange={(e) => setForm({ ...form, id_modelu: e.target.value })}><option value="">Utwórz nowy typ</option>{models.map((m: any) => <option key={m.id} value={m.id}>{m.nazwa}</option>)}</select></Field><Field label="Nazwa typu, jeśli nowy"><input className={inputClass} value={form.nazwa_modelu || ''} onChange={(e) => setForm({ ...form, nazwa_modelu: e.target.value })}/></Field><Field label="Nazwa egzemplarza / case"><input className={inputClass} value={form.nazwa || ''} onChange={(e) => setForm({ ...form, nazwa: e.target.value })}/></Field><Field label="Numer egzemplarza"><input className={inputClass} value={form.numer_egzemplarza || ''} onChange={(e) => setForm({ ...form, numer_egzemplarza: e.target.value, numer_urzadzenia: e.target.value })}/></Field><Field label="Magazyn"><select className={inputClass} value={form.id_magazynu || ''} onChange={(e) => setForm({ ...form, id_magazynu: e.target.value })}><option value="">Brak</option>{magazyny.map((m: any) => <option key={m.id} value={m.id}>{m.nazwa}</option>)}</select></Field><Field label="Kod kreskowy / QR"><input className={inputClass} value={form.kod_kreskowy || ''} onChange={(e) => updateBarcode(e.target.value)}/></Field></div><label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={!!form.rozroznij_kod_qr} onChange={(e) => setForm({ ...form, rozroznij_kod_qr: e.target.checked, zewnetrzny_qr_kod: e.target.checked ? form.zewnetrzny_qr_kod : form.kod_kreskowy })}/> Rozróżnij QR i kod kreskowy</label>{form.rozroznij_kod_qr && <Field label="Zewnętrzny QR"><input className={inputClass} value={form.zewnetrzny_qr_kod || ''} onChange={(e) => setForm({ ...form, zewnetrzny_qr_kod: e.target.value, qr_kod: e.target.value })}/></Field>}<div className="rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-500">Wartość case jest ukryta w formularzu. Możesz ją edytować później w szczegółach opakowania.</div><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShow(false)}>Anuluj</Button><Button type="submit">Zapisz</Button></div></form></SimpleModal>}
  </div>;
}
