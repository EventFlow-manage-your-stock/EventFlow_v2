'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api } from '../../../../lib/api';
import { Button, Card, Field, inputClass, PageTitle } from '../../../../components/ProductUI';

export default function PricingPage() {
  const [models, setModels] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [editedPrices, setEditedPrices] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (selectedCategory) qs.set('kategoriaId', selectedCategory);
      if (search) qs.set('search', search);
      const [c, m] = await Promise.all([
        api.get('/api/magazyn/kategorie').catch(() => ({ data: [] })),
        api.get(`/api/magazyn/cennik${qs.toString() ? `?${qs}` : ''}`).catch(() => ({ data: [] })),
      ]);
      setCategories(c.data || []);
      setModels(m.data || []);
      const prices: Record<number, string> = {};
      (m.data || []).forEach((model: any) => { prices[model.id] = model.stawki?.[0]?.cena_netto != null ? String(model.stawki[0].cena_netto) : ''; });
      setEditedPrices(prices);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [selectedCategory]);

  async function saveAll() {
    setSaving(true);
    try {
      const updates = Object.entries(editedPrices).map(([id, cena]) => ({ id_modelu: Number(id), cena: cena === '' ? null : Number(cena) }));
      await api.put('/api/magazyn/cennik/masowo', { updates });
      await load();
      alert('Ceny zapisane.');
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || 'Nie udało się zapisać cen.');
    } finally { setSaving(false); }
  }

  return <div className="mx-auto max-w-[1650px] space-y-6">
    <PageTitle eyebrow="Magazyn" title="Ceny" description="Ceny modeli sprzętu oparte o tabelę ceny_modeli. Możesz filtrować i zapisywać masowo." action={<Button onClick={saveAll} disabled={saving}><Save size={16} className="inline" /> {saving ? 'Zapisuję...' : 'Zapisz zmiany'}</Button>} />
    <Card>
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <Field label="Kategoria"><select className={inputClass} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}><option value="">Wszystkie</option>{categories.map((c: any) => <option key={c.id} value={c.id}>{c.nazwa}</option>)}</select></Field>
        <Field label="Szukaj"><input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') load(); }} placeholder="Nazwa modelu" /></Field>
        <div className="flex items-end"><Button variant="secondary" onClick={load}>Filtruj</Button></div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[850px] text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3 text-left">Model</th><th className="p-3 text-left">Kategoria</th><th className="p-3 text-right">Cena podstawowa netto</th><th className="p-3 text-right">Koszt</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={4} className="p-8 text-center font-bold text-slate-400">Ładowanie...</td></tr> : models.map((m: any) => <tr key={m.id}><td className="p-3 font-black text-cyan-700">{m.nazwa}</td><td className="p-3">{m.kategoria?.nazwa || '-'}</td><td className="p-3 text-right"><input type="number" step="0.01" className={`${inputClass} ml-auto max-w-[160px] text-right`} value={editedPrices[m.id] ?? ''} onChange={(e) => setEditedPrices({ ...editedPrices, [m.id]: e.target.value })} /></td><td className="p-3 text-right">{m.stawki?.[0]?.koszt ?? '-'}</td></tr>)}
            {!loading && models.length === 0 && <tr><td colSpan={4} className="p-8 text-center font-bold text-slate-400">Brak modeli do wyceny.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
  </div>;
}
