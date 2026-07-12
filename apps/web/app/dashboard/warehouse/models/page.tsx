'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, ImageIcon, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '../../../../lib/api';
import { Button, Card, Field, inputClass, PageTitle } from '../../../../components/ProductUI';
import { SimpleModal } from '../../../../components/SimpleModal';

function money(value: any) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? `${n.toFixed(2)} PLN` : '-';
}

function countValue(value: any) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function isQuantityModel(form: any) {
  return form?.sprzet_ilosciowy === true || form?.tryb_ewidencji === 'ilosciowe';
}

function normalizeModelPayload(form: any) {
  const quantity = isQuantityModel(form);
  return {
    ...form,
    sprzet_ilosciowy: quantity,
    tryb_ewidencji: quantity ? 'ilosciowe' : 'egzemplarze',
    ilosc_magazynowa: quantity ? Number(form.ilosc_magazynowa || 0) : 0,
    jednostka: form.jednostka || 'szt.',
    kod_kreskowy: quantity ? (form.kod_kreskowy || '') : '',
  };
}

export default function ModelsPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [view, setView] = useState<'sprzet' | 'opakowanie' | 'wszystkie'>('sprzet');
  const [categoryId, setCategoryId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [show, setShow] = useState(false);
  const [form, setForm] = useState<any>({ typ_sprzetu: 'sprzet', tryb_ewidencji: 'egzemplarze', sprzet_ilosciowy: false, ilosc_magazynowa: 0, jednostka: 'szt.', kod_kreskowy: '' });
  const [preview, setPreview] = useState<string>('');

  async function load() {
    const [m, k] = await Promise.all([
      api.get('/api/magazyn/modele'),
      api.get('/api/magazyn/kategorie/plasko').catch(() => api.get('/api/magazyn/kategorie').catch(() => ({ data: [] }))),
    ]);
    setItems(m.data || []);
    setCategories(k.data || []);
  }

  useEffect(() => { load(); }, []);

  async function save(e: any) {
    e.preventDefault();
    if (isQuantityModel(form) && !String(form.kod_kreskowy || '').trim()) {
      alert('Sprzęt ilościowy musi mieć kod kreskowy modelu. Ten kod skanujesz przy WZ/PZ, a system zapyta o liczbę sztuk.');
      return;
    }
    await api.post('/api/magazyn/modele', normalizeModelPayload(form));
    setShow(false);
    setPreview('');
    setForm({ typ_sprzetu: view === 'opakowanie' ? 'opakowanie' : 'sprzet', tryb_ewidencji: 'egzemplarze', sprzet_ilosciowy: false, ilosc_magazynowa: 0, jednostka: 'szt.', kod_kreskowy: '' });
    load();
  }

  function openAdd() {
    const type = view === 'opakowanie' ? 'opakowanie' : 'sprzet';
    setPreview('');
    setForm({ typ_sprzetu: type, widoczny_w_mag: true, widoczny_w_ofercie: true, tryb_ewidencji: 'egzemplarze', sprzet_ilosciowy: false, ilosc_magazynowa: 0, jednostka: 'szt.', kod_kreskowy: '' });
    setShow(true);
  }

  async function onPhoto(file?: File | null) {
    if (!file) return;
    const dataUrl = await readImageAsDataUrl(file);
    setPreview(dataUrl);
    setForm((current: any) => ({ ...current, zdjecie: dataUrl }));
  }

  async function removeModel(model: any) {
    if (!confirm(`Usunąć model "${model.nazwa}"?\n\nModel zostanie ukryty, a nie fizycznie skasowany z bazy.`)) return;
    await api.delete(`/api/magazyn/modele/${model.id}`);
    load();
  }

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .filter((x: any) => view === 'wszystkie' || x.typ_sprzetu === view)
      .filter((x: any) => !categoryId || String(x.id_kategorii || x.kategoria?.id || '') === categoryId)
      .filter((x: any) => {
        if (!query) return true;
        return [x.nazwa, x.producent, x.kategoria?.nazwa, x.kategoria_nazwa, x.miejsce_w_mag, x.uwagi]
          .filter(Boolean)
          .some((v: any) => String(v).toLowerCase().includes(query));
      });
  }, [items, view, categoryId, search]);

  return (
    <div className="mx-auto max-w-[1900px] space-y-5">
      <PageTitle
        eyebrow="Magazyn"
        title="Modele"
        description="Widok modeli sprzętu w stylu operacyjnej listy: zdjęcie, stan, dostępność, cena i szybka edycja. Kody modelu pokazujemy tylko przy sprzęcie ilościowym; zwykły sprzęt ma kody na egzemplarzach."
        action={<Button onClick={openAdd}><Plus size={16} className="inline" /> Dodaj model</Button>}
      />

      <Card className="!p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setView('sprzet')} className={`rounded-xl px-4 py-2 text-sm font-black ${view === 'sprzet' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Sprzęt</button>
          <button onClick={() => setView('opakowanie')} className={`rounded-xl px-4 py-2 text-sm font-black ${view === 'opakowanie' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Opakowania</button>
          <button onClick={() => setView('wszystkie')} className={`rounded-xl px-4 py-2 text-sm font-black ${view === 'wszystkie' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Wszystkie</button>

          <div className="ml-auto flex min-w-[320px] flex-1 flex-wrap items-center justify-end gap-2">
            <div className="relative min-w-[260px] flex-1 max-w-[430px]">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input className={`${inputClass} pl-9`} value={search} onChange={e => setSearch(e.target.value)} placeholder="Szukaj modelu, kategorii, producenta albo kodu modelu ilościowego..." />
            </div>
            <select className={`${inputClass} max-w-[260px]`} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">Wszystkie kategorie</option>
              {categories.map((k: any) => <option key={k.id} value={k.id}>{k.nazwa}</option>)}
            </select>
          </div>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1650px] w-full border-separate border-spacing-y-1 text-left text-xs">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-3">Kod modelu</th>
                <th className="px-3 py-3">Zdjęcie</th>
                <th className="px-3 py-3">Nazwa</th>
                <th className="px-3 py-3">Typ</th>
                <th className="px-3 py-3">Kategoria</th>
                <th className="px-3 py-3">Na stanie</th>
                <th className="px-3 py-3">Dostępnych</th>
                <th className="px-3 py-3">Rezerwacje</th>
                <th className="px-3 py-3">Cena</th>
                <th className="px-3 py-3">Uwagi</th>
                <th className="px-3 py-3">Magazyn</th>
                <th className="px-3 py-3 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any, index: number) => {
                const quantityModel = r.tryb_ewidencji === 'ilosciowe' || r.sprzet_ilosciowy;
                const total = quantityModel ? countValue(r.ilosc_magazynowa ?? r.stan?.total) : countValue(r._count?.egzemplarze ?? r.stan?.total);
                const available = quantityModel ? total : countValue(r.dostepnych ?? r.stan?.magazyn);
                const service = quantityModel ? 0 : countValue(r.stan?.serwis);
                const reserved = Math.max(0, total - available - service);
                return (
                  <tr key={r.id} className="group rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:bg-cyan-50/40 hover:ring-cyan-200">
                    <td className="whitespace-nowrap rounded-l-2xl px-3 py-2 font-mono text-[11px]">
                      {quantityModel ? (
                        r.kod_kreskowy ? <span className="text-slate-700">{r.kod_kreskowy}</span> : <span className="font-black text-red-600">BRAK KODU</span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => router.push(`/dashboard/warehouse/models/${r.id}`)} className="h-14 w-20 overflow-hidden rounded-lg border bg-slate-50">
                        {r.zdjecie ? <img src={r.zdjecie} alt={r.nazwa} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-300"><ImageIcon size={20} /></div>}
                      </button>
                    </td>
                    <td className="min-w-[300px] px-3 py-2">
                      <button onClick={() => router.push(`/dashboard/warehouse/models/${r.id}`)} className="text-left font-black text-cyan-700 hover:underline">{r.nazwa}</button>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">📅 kalendarz</span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 font-bold text-slate-700">
                      {r.typ_sprzetu === 'opakowanie' ? 'Opakowanie' : (quantityModel ? 'Sprzęt ilościowy' : 'Sprzęt z egzemplarzami')}
                      {quantityModel && <div className="mt-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">na sztuki · {r.jednostka || 'szt.'}</div>}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{r.kategoria?.nazwa || r.kategoria_nazwa || '-'}</td>
                    <td className="px-3 py-2">
                      <div className="font-black text-slate-800">{total}</div>
                      <div className="text-[10px] font-bold text-slate-500">POZNAŃ</div>
                      {service > 0 && <div className="mt-1 inline-flex rounded bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-700">W serwisie: {service}</div>}
                    </td>
                    <td className="px-3 py-2 font-black text-slate-700">{available}</td>
                    <td className="px-3 py-2"><span className="rounded bg-emerald-500 px-2 py-1 text-xs font-black text-white">{reserved}</span></td>
                    <td className="px-3 py-2 text-slate-700"><span className="font-bold">Podstawowa:</span>{money(r.cena_podstawowa || r.wartosc_domyslna_egzemplarza || r.wartosc)}</td>
                    <td className="max-w-[210px] px-3 py-2 text-slate-500">{r.uwagi || '-'}</td>
                    <td className="px-3 py-2 text-slate-600">{r.miejsce_w_mag || '-'}</td>
                    <td className="rounded-r-2xl px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <button title="Podgląd" onClick={() => router.push(`/dashboard/warehouse/models/${r.id}`)} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-cyan-700"><Eye size={16} /></button>
                        <button title="Edytuj" onClick={() => router.push(`/dashboard/warehouse/models/${r.id}?edit=1`)} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-cyan-700"><Pencil size={16} /></button>
                        <button title="Usuń" onClick={() => removeModel(r)} className="rounded-lg p-2 text-slate-500 hover:bg-white hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={12} className="p-10 text-center font-bold text-slate-400">Brak modeli dla wybranych filtrów.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {show && <SimpleModal title="Dodaj model" onClose={() => setShow(false)}>
        <form onSubmit={save} className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
            <div className="space-y-3">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border bg-slate-50">
                {preview || form.zdjecie ? <img src={preview || form.zdjecie} alt="Podgląd" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-300"><ImageIcon size={48} /></div>}
              </div>
              <input type="file" accept="image/*" onChange={e => onPhoto(e.target.files?.[0])} className="block w-full text-xs font-bold text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-cyan-600 file:px-3 file:py-2 file:font-black file:text-white" />
              <p className="text-xs font-bold text-slate-400">Zdjęcie zapisujemy przy modelu i pokazujemy w magazynie, ofertach oraz przy wyborze sprzętu.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nazwa modelu"><input className={inputClass} required value={form.nazwa || ''} onChange={e => setForm({ ...form, nazwa: e.target.value })} /></Field>
              <Field label="Kategoria"><select className={inputClass} value={form.id_kategorii || ''} onChange={e => setForm({ ...form, id_kategorii: e.target.value })}><option value="">Brak</option>{categories.map((k: any) => <option key={k.id} value={k.id}>{k.nazwa}</option>)}</select></Field>
              <Field label="Producent"><input className={inputClass} value={form.producent || ''} onChange={e => setForm({ ...form, producent: e.target.value })} /></Field>
              <Field label="Typ"><select className={inputClass} value={form.typ_sprzetu || 'sprzet'} onChange={e => setForm({ ...form, typ_sprzetu: e.target.value })}><option value="sprzet">Sprzęt</option><option value="opakowanie">Opakowanie</option><option value="zestaw">Zestaw</option></select></Field>
              <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <label className="flex cursor-pointer items-start gap-3 text-sm font-black text-slate-800">
                  <input type="checkbox" className="mt-1 h-4 w-4" checked={isQuantityModel(form)} onChange={e => setForm({ ...form, sprzet_ilosciowy: e.target.checked, tryb_ewidencji: e.target.checked ? 'ilosciowe' : 'egzemplarze', ilosc_magazynowa: e.target.checked ? (form.ilosc_magazynowa || 0) : 0, kod_kreskowy: e.target.checked ? form.kod_kreskowy : '' })} />
                  <span>
                    Sprzęt ilościowy
                    <span className="mt-1 block text-xs font-bold text-slate-500">Zaznacz dla rzeczy wydawanych na sztuki bez osobnych numerów/SN, np. balast 25 kg x 90. Odznaczone = fizyczne egzemplarze z własnym numerem i numerem seryjnym.</span>
                  </span>
                </label>
              </div>
              {isQuantityModel(form) && <>
                <Field label="Stan ilościowy"><input type="number" step="1" min="0" className={inputClass} value={form.ilosc_magazynowa ?? 0} onChange={e => setForm({ ...form, ilosc_magazynowa: e.target.value })} /></Field>
                <Field label="Jednostka"><input className={inputClass} value={form.jednostka || 'szt.'} onChange={e => setForm({ ...form, jednostka: e.target.value })} /></Field>
                <div className="md:col-span-2">
                  <Field label="Kod kreskowy modelu — wymagany dla sprzętu ilościowego"><input required={isQuantityModel(form)} className={inputClass} value={form.kod_kreskowy || ''} onChange={e => setForm({ ...form, kod_kreskowy: e.target.value })} placeholder="Np. kod z etykiety balastu / kabla / drobnicy" /></Field>
                  <p className="mt-1 text-xs font-bold text-amber-700">Kod jest widoczny tylko przy sprzęcie ilościowym i służy do szybkiego wydania/przyjęcia na sztuki.</p>
                </div>
              </>}
              <Field label="Cena podstawowa / wartość domyślna"><input type="number" step="0.01" className={inputClass} value={form.wartosc_domyslna_egzemplarza || ''} onChange={e => setForm({ ...form, wartosc_domyslna_egzemplarza: e.target.value, wartosc: e.target.value })} /></Field>
              <Field label="Miejsce w magazynie"><input className={inputClass} value={form.miejsce_w_mag || ''} onChange={e => setForm({ ...form, miejsce_w_mag: e.target.value })} /></Field>
              <Field label="Szerokość"><input type="number" step="0.01" className={inputClass} value={form.szerokosc || ''} onChange={e => setForm({ ...form, szerokosc: e.target.value })} /></Field>
              <Field label="Wysokość"><input type="number" step="0.01" className={inputClass} value={form.wysokosc || ''} onChange={e => setForm({ ...form, wysokosc: e.target.value })} /></Field>
              <Field label="Głębokość"><input type="number" step="0.01" className={inputClass} value={form.glebokosc || ''} onChange={e => setForm({ ...form, glebokosc: e.target.value })} /></Field>
              <Field label="Waga"><input type="number" step="0.01" className={inputClass} value={form.waga || ''} onChange={e => setForm({ ...form, waga: e.target.value })} /></Field>
            </div>
          </div>
          <Field label="Opis / uwagi"><textarea className={inputClass} value={form.opis || ''} onChange={e => setForm({ ...form, opis: e.target.value })} /></Field>
          <div className="rounded-2xl bg-cyan-50 p-3 text-sm font-bold text-cyan-800">Dla sprzętu z egzemplarzami kod kreskowy/QR należy do egzemplarzy. Kod modelu pokazuje się tylko przy sprzęcie ilościowym, bo wtedy skan oznacza pobranie określonej liczby sztuk.</div>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShow(false)}>Anuluj</Button><Button type="submit">Zapisz model</Button></div>
        </form>
      </SimpleModal>}
    </div>
  );
}
