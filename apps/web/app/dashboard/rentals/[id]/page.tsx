'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Box,
  CheckSquare,
  Copy,
  DollarSign,
  FileArchive,
  FileText,
  History,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Save,
  Trash2,
  Truck,
  Calendar,
  Search
} from 'lucide-react';
import { api } from '../../../../lib/api';
import { Button, Card, Field, inputClass, SearchableSelect } from '../../../../components/ProductUI';
import { DataTable } from '../../../../components/DataTable';
import { OfferDuplicateTargetModal } from '../../../../components/OfferDuplicateTargetModal';
import { googleMapsDirectionsUrl } from '../../../../lib/googleMaps';
import { QuickAddCrmModal } from '../../../../components/QuickAddCrmModal';

// ============================================================================
// GLOBALNE HELPERY WMS (Niezbędne do działania panelu sprzętu)
// ============================================================================

const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'zadania', label: 'Zadania', icon: CheckSquare },
  { id: 'szczegoly', label: 'Szczegóły', icon: FileText },
  { id: 'sprzet', label: 'Sprzęt', icon: Box },
  { id: 'zalaczniki', label: 'Załączniki', icon: FileArchive },
  { id: 'oferty', label: 'Oferty', icon: DollarSign },
  { id: 'flota', label: 'Flota', icon: Truck },
  { id: 'historia', label: 'Historia', icon: History },
];

function toSelect(v: any) { return v === null || v === undefined ? '' : String(v); }
function toDateInput(v: any) { return v ? String(v).slice(0, 16) : ''; }
function numOrNull(v: any) { return v === '' || v === null || v === undefined ? null : Number(v); }
function strOrNull(v: any) { return v === '' || v === null || v === undefined ? null : String(v); }
function money(v: any) { return `${Number(v || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`; }
function dateTime(v: any) { return v ? new Date(v).toLocaleString('pl-PL') : '-'; }
function initials(u: any) { return u?.imie || u?.nazwisko ? `${u?.imie?.[0] || ''}${u?.nazwisko?.[0] || ''}`.toUpperCase() : '?'; }
function numberOrZero(value: any) { const n = Number(value); return Number.isFinite(n) ? n : 0; }
function modelCategoryId(model: any) { return String(model?.kategoria?.id || model?.id_kategorii || model?.kategoria_id || ''); }
function getCategoryParentId(category: any) { return category?.id_rodzica || category?.id_kategorii_glownej || category?.id_kategorii_nadrzednej || category?.parent_id || category?.id_parent || null; }

function flattenCategories(categories: any[]): any[] {
  const result: any[] = [];
  const walk = (items: any[], parent: any = null, level = 0) => {
    for (const item of items || []) {
      const copy = { ...item, parent, level };
      result.push(copy);
      if (item.dzieci?.length) walk(item.dzieci, copy, level + 1);
      if (item.children?.length) walk(item.children, copy, level + 1);
      if (item.podkategorie?.length) walk(item.podkategorie, copy, level + 1);
    }
  };
  walk(categories || []);
  return result;
}

function buildCategoryTree(categories: any[]) {
  const flatInput = flattenCategories(categories || []);
  const byId = new Map<string, any>();
  for (const cat of flatInput) { byId.set(String(cat.id), { ...cat, dzieci: [], _parentId: getCategoryParentId(cat) ? String(getCategoryParentId(cat)) : null }); }
  for (const cat of Array.from(byId.values())) { if (!cat._parentId && cat.parent?.id) cat._parentId = String(cat.parent.id); }
  const roots: any[] = [];
  for (const cat of Array.from(byId.values())) {
    if (cat._parentId && byId.has(cat._parentId)) byId.get(cat._parentId).dzieci.push(cat);
    else roots.push(cat);
  }
  const sortByOrder = (items: any[]) => {
    items.sort((a, b) => numberOrZero(a.kolejnosc) - numberOrZero(b.kolejnosc) || String(a.nazwa || '').localeCompare(String(b.nazwa || ''), 'pl'));
    items.forEach((item) => sortByOrder(item.dzieci || []));
  };
  sortByOrder(roots);
  return { roots, byId };
}

function descendantsOf(categoryId: string, byId: Map<string, any>) {
  const ids = new Set<string>();
  const walk = (id: string) => {
    if (!id || ids.has(id)) return;
    ids.add(id);
    const cat = byId.get(id);
    for (const child of cat?.dzieci || []) walk(String(child.id));
  };
  walk(categoryId);
  return ids;
}

function categoryPath(categoryId: string, byId: Map<string, any>) {
  const parts: string[] = [];
  let current = byId.get(categoryId);
  let guard = 0;
  while (current && guard < 12) {
    parts.unshift(current.nazwa);
    current = current._parentId ? byId.get(String(current._parentId)) : null;
    guard++;
  }
  return parts.join(' / ');
}

function normalizeCode(v: any) {
  return String(v || '').trim().replace(/\s+/g, '').toLowerCase();
}

function getEquipmentCodes(row: any): string[] {
  const egz = row?.egzemplarz || row;
  const model = row?.model || egz?.model || row;
  return [
    row?.kod, row?.kod_kreskowy, row?.barcode, row?.qr_kod, row?.sn, row?.numer_seryjny,
    egz?.kod, egz?.kod_kreskowy, egz?.zewnetrzny_kod_kreskowy, egz?.zewnetrzny_qr_kod, egz?.qr_kod, egz?.sn, egz?.numer_seryjny,
    model?.kod, model?.kod_kreskowy, model?.barcode,
  ].map(normalizeCode).filter(Boolean);
}

function getEquipmentText(row: any): string {
  const egz = row?.egzemplarz || row;
  const model = row?.model || egz?.model || row;
  return [
    row?.nazwa, row?.nazwa_modelu, row?.typ, row?.rodzaj, row?.tryb_ewidencji, row?.kategoria, row?.kategoria_nazwa,
    egz?.nazwa, egz?.numer_egzemplarza, egz?.numer_urzadzenia, egz?.sn, egz?.numer_seryjny,
    model?.nazwa, model?.typ, model?.rodzaj, model?.typ_sprzetu, model?.tryb_ewidencji, model?.kategoria?.nazwa, model?.kategoria?.sciezka
  ].filter(Boolean).map((v) => String(v).toLowerCase()).join(' ');
}

function isRack(row: any): boolean {
  const txt = getEquipmentText(row);
  return txt.includes('rack') || txt.includes('racki') || txt.includes('szafa rack');
}

function isQuantityModel(model: any): boolean {
  const txt = getEquipmentText(model);
  return Boolean(
    model?.rowType === 'ilosciowy_model' || model?.quantityOnly === true ||
    model?.sprzet_ilosciowy === true || model?.czy_ilosciowy === true ||
    model?.tryb_ewidencji === 'ilosciowe' || model?.tryb_ewidencji === 'ilościowe' ||
    model?.typ_ewidencji === 'ilosciowe' || model?.rodzaj_ewidencji === 'ilosciowe' ||
    txt.includes('ilosciow') || txt.includes('ilościow') ||
    model?.ilosc_magazynowa !== undefined || model?.ilość_magazynowa !== undefined
  );
}

function isQuantityOnly(row: any): boolean {
  if (!row) return false;
  return Boolean(row.rowType === 'ilosciowy_model' || row.quantityOnly === true || isQuantityModel(row));
}

function isCase(row: any): boolean {
  if (!row || isRack(row)) return false;
  const txt = getEquipmentText(row);
  const codes = getEquipmentCodes(row);
  return (
    row?.isCase === true || row?.rowType === 'case' || row?.czy_case === true ||
    codes.some((c) => c.startsWith('01')) ||
    txt.includes('case') || txt.includes('opakowan') || txt.includes('skrzyn')
  );
}

function isEquipmentInstance(row: any): boolean {
  const modelType = row?.model?.typ_sprzetu || row?.egzemplarz?.model?.typ_sprzetu || row?.typ_sprzetu;
  const hasInstance = Boolean(row?.id_egzemplarza || row?.egzemplarz || row?.id);
  return hasInstance && !isQuantityModel(row) && (isRack(row) || (modelType !== 'opakowanie' && !isCase(row)));
}

function modelIdOf(row: any) { return row?.id_modelu || row?.model?.id || row?.egzemplarz?.id_modelu || row?.egzemplarz?.model?.id || null; }
function modelNameOf(row: any) { return row?.nazwa_modelu || row?.model?.nazwa || row?.egzemplarz?.model?.nazwa || row?.nazwa || row?.egzemplarz?.nazwa || 'Sprzęt'; }
function modelCategoryIdOf(row: any) { return row?.id_kategorii || row?.model?.id_kategorii || row?.model?.kategoria?.id || row?.egzemplarz?.model?.id_kategorii || row?.egzemplarz?.model?.kategoria?.id || modelCategoryId(row?.model || row); }
function numberOf(row: any) { const egz = row?.egzemplarz || row; return egz?.numer_egzemplarza || egz?.numer_urzadzenia || egz?.sn || egz?.kod_kreskowy || ''; }


// ============================================================================
// KOMPONENT GŁÓWNY (Szczegóły Wynajmu)
// ============================================================================

export default function RentalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';
  
  const [activeTab, setActiveTab] = useState('szczegoly');
  const [item, setItem] = useState<any>(null);
  const [form, setForm] = useState<any>({ data_wydania: '', data_zwrotu_planowana: '' });
  const [dict, setDict] = useState<any>({ statusy: [], statusyMagazynowe: [], statusyKsiegowe: [], kontrahenci: [], kontakty: [], miejsca: [], uzytkownicy: [] });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [offerName, setOfferName] = useState('');
  const [duplicateTarget, setDuplicateTarget] = useState<any>(null);
  const [crmModalMode, setCrmModalMode] = useState<'kontrahent' | 'kontakt' | null>(null);

  async function loadDictionaries() {
    const [statusy, statusyMagazynowe, statusyKsiegowe, kontrahenci, miejsca, uzytkownicy] = await Promise.all([
      api.get('/api/slowniki/statusy-wynajmu').catch(() => ({ data: [] })),
      api.get('/api/slowniki/statusy-magazynowe').catch(() => ({ data: [] })),
      api.get('/api/slowniki/statusy-ksiegowe').catch(() => ({ data: [] })),
      api.get('/api/slowniki/kontrahenci').catch(() => ({ data: [] })),
      api.get('/api/slowniki/miejsca').catch(() => ({ data: [] })),
      api.get('/api/slowniki/uzytkownicy').catch(() => ({ data: [] })),
    ]);
    
    setDict((prev: any) => ({
      ...prev,
      statusy: statusy.data || [],
      statusyMagazynowe: statusyMagazynowe.data || [],
      statusyKsiegowe: statusyKsiegowe.data || [],
      kontrahenci: kontrahenci.data || [],
      miejsca: miejsca.data || [],
      uzytkownicy: uzytkownicy.data || [],
    }));
  }

  async function load() {
    if (isNew) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/wynajmy/${params.id}`);
      const w = res.data;
      setItem(w);
      setOfferName(w?.numer ? `Oferta do wynajmu ${w.numer}` : `Oferta do wynajmu #${w.id}`);
      setForm({
        numer: w.numer || '',
        id_statusu_wynajmu: toSelect(w.id_statusu_wynajmu),
        id_statusu_magazynowego: toSelect(w.id_statusu_magazynowego),
        id_statusu_ksiegowego: toSelect(w.id_statusu_ksiegowego),
        id_oferty: toSelect(w.id_oferty),
        id_managera: toSelect(w.id_managera),
        id_kontrahenta: toSelect(w.id_kontrahenta),
        id_kontaktu: toSelect(w.id_kontaktu),
        id_miejsca: toSelect(w.id_miejsca),
        data_wydania: toDateInput(w.data_wydania),
        data_zwrotu_planowana: toDateInput(w.data_zwrotu_planowana),
        data_zwrotu_rzeczywista: toDateInput(w.data_zwrotu_rzeczywista),
        miejsce_reczne: w.miejsce_reczne || '',
        adres_reczny: w.adres_reczny || '',
        notatki_wewnetrzne: w.notatki_wewnetrzne || '',
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Nie udało się wczytać wynajmu.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (form.id_kontrahenta) {
      api.get(`/api/crm/kontakty?kontrahentId=${form.id_kontrahenta}`)
         .then(res => setDict((prev: any) => ({ ...prev, kontakty: res.data })))
         .catch(() => setDict((prev: any) => ({ ...prev, kontakty: [] })));
    } else {
      setDict((prev: any) => ({ ...prev, kontakty: [] }));
    }
  }, [form.id_kontrahenta]);

  useEffect(() => { loadDictionaries(); load(); }, [params.id]);

  const payload = useMemo(() => ({
    numer: strOrNull(form.numer),
    id_statusu_wynajmu: numOrNull(form.id_statusu_wynajmu),
    id_statusu_magazynowego: numOrNull(form.id_statusu_magazynowego),
    id_statusu_ksiegowego: numOrNull(form.id_statusu_ksiegowego),
    id_oferty: numOrNull(form.id_oferty),
    id_kontrahenta: numOrNull(form.id_kontrahenta),
    id_kontaktu: numOrNull(form.id_kontaktu),
    id_miejsca: numOrNull(form.id_miejsca),
    id_managera: numOrNull(form.id_managera),
    miejsce_reczne: strOrNull(form.miejsce_reczne),
    adres_reczny: strOrNull(form.adres_reczny),
    data_wydania: strOrNull(form.data_wydania),
    data_zwrotu_planowana: strOrNull(form.data_zwrotu_planowana),
    data_zwrotu_rzeczywista: strOrNull(form.data_zwrotu_rzeczywista),
    notatki_wewnetrzne: strOrNull(form.notatki_wewnetrzne),
  }), [form]);

  async function save(e?: any) {
    e?.preventDefault?.();
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        const r = await api.post('/api/wynajmy', payload);
        router.push(`/dashboard/rentals/${r.data.id}`);
      } else {
        await api.put(`/api/wynajmy/${params.id}`, payload);
        await load();
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Nie udało się zapisać wynajmu.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm('Na pewno usunąć to wypożyczenie?')) return;
    await api.delete(`/api/wynajmy/${params.id}`);
    router.push('/dashboard/rentals');
  }

  async function createOffer() {
    if (isNew) return;
    const r = await api.post('/api/oferty', {
      nazwa: offerName || `Oferta - ${form.numer || item?.numer || params.id}`,
      id_wynajmu: Number(params.id),
      id_kontrahenta: numOrNull(form.id_kontrahenta),
    });
    router.push(`/dashboard/offers/${r.data.id}`);
  }

  async function duplicateOffer(offer: any) {
    setDuplicateTarget(offer);
  }

  function handleCrmSuccess(type: 'kontrahent' | 'kontakt', newData: any) {
    if (type === 'kontrahent') {
      setDict((prev: any) => ({ ...prev, kontrahenci: [...prev.kontrahenci, newData] }));
      setForm((prev: any) => ({ ...prev, id_kontrahenta: String(newData.id), id_kontaktu: '' }));
    } else if (type === 'kontakt') {
      setDict((prev: any) => ({ ...prev, kontakty: [...(prev.kontakty || []), newData] }));
      setForm((prev: any) => ({ ...prev, id_kontaktu: String(newData.id) }));
    }
    setCrmModalMode(null);
  }

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-cyan-600" /> <span className="ml-3 font-bold text-slate-500">Ładowanie danych wypożyczenia...</span></div>;

  const offers = item?.oferty || [];
  const legacyOffer = item?.oferta && !offers.some((o: any) => o.id === item.oferta.id) ? [item.oferta] : [];
  const allOffers = [...legacyOffer, ...offers];
  
  const maps = googleMapsDirectionsUrl(form.adres_reczny);
  const currentManager = dict.uzytkownicy.find((u: any) => String(u.id) === String(form.id_managera)) || item?.manager;

  return (
    <div className="mx-auto max-w-[1800px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
          <button onClick={() => router.back()} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 hover:bg-slate-50">
            <ArrowLeft size={16} />Powrót
          </button>
          <span>/</span>
          <Link href="/dashboard/calendar" className="hover:text-cyan-700">Kalendarz</Link>
          <span>/</span>
          <span className="font-black text-slate-900">{isNew ? 'Nowy wynajem' : item?.numer || `Wynajem #${params.id}`}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew && (form.data_wydania || item?.data_wydania) && (
            <Button 
              variant="secondary" 
              onClick={() => {
                const targetDate = form.data_wydania || item?.data_wydania;
                router.push(`/dashboard/calendar?date=${targetDate.slice(0, 10)}`);
              }}
            >
              <Calendar size={16} className="inline mr-1 text-cyan-600" /> Cofnij do daty w kalendarzu
            </Button>
          )}

          {!isNew && <Button variant="danger" onClick={remove}><Trash2 size={16} className="inline mr-1" /> Usuń</Button>}
          <Button onClick={save} disabled={saving}><Save size={16} className="inline mr-1" /> {saving ? 'Zapisywanie...' : 'Zapisz'}</Button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

      {!isNew && (
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Numer" value={item?.numer || `#${item?.id}`} />
          <Metric label="Oferty" value={`${allOffers.length}`} />
          <Metric label="Odbiór" value={`${dateTime(item?.data_wydania)}`} />
          <Metric label="Zwrot" value={`${dateTime(item?.data_zwrotu_planowana)}`} />
        </div>
      )}

      <form onSubmit={save} className="grid gap-5 xl:grid-cols-[1.1fr_.9fr_1.1fr]">
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.25em] text-orange-600">Dane wynajmu</p>
              <h1 className="mt-1 text-2xl font-black text-slate-900">{form.numer || `Wynajem #${params.id}`}</h1>
            </div>
            {item?.status && <span className="rounded-xl px-3 py-2 text-sm font-black text-white" style={{ backgroundColor: item.status.kolor || '#F97316' }}>{item.status.ikona || '●'} {item.status.nazwa}</span>}
            {item?.status_magazynowy && <span className="rounded-xl px-3 py-2 text-sm font-black text-white" style={{ backgroundColor: item.status_magazynowy.kolor || '#0891B2' }}>{item.status_magazynowy.ikona || '📦'} {item.status_magazynowy.nazwa}</span>}
            {item?.status_ksiegowy && <span className="rounded-xl px-3 py-2 text-sm font-black text-white" style={{ backgroundColor: item.status_ksiegowy.kolor || '#22C55E' }}>{item.status_ksiegowy.ikona || '💰'} {item.status_ksiegowy.nazwa}</span>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Numer systemowy"><input className={inputClass} value={form.numer || ''} onChange={(e) => setForm({ ...form, numer: e.target.value })} placeholder="Automatyczny po zapisie" /></Field>
            
            <Field label="Status wynajmu">
              <select className={inputClass} value={form.id_statusu_wynajmu || ''} onChange={(e) => setForm({ ...form, id_statusu_wynajmu: e.target.value })}>
                <option value="">Wybierz</option>
                {dict.statusy.map((s: any) => <option key={s.id} value={s.id}>{s.ikona || '●'} {s.nazwa}</option>)}
              </select>
            </Field>

            <Field label="Wydanie sprzętu"><input type="datetime-local" className={inputClass} value={form.data_wydania || ''} onChange={(e) => setForm({ ...form, data_wydania: e.target.value })} /></Field>
            <Field label="Planowany zwrot"><input type="datetime-local" className={inputClass} value={form.data_zwrotu_planowana || ''} onChange={(e) => setForm({ ...form, data_zwrotu_planowana: e.target.value })} /></Field>
            
            <Field label="Klient">
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    value={form.id_kontrahenta || ''}
                    onChange={(val) => setForm({ ...form, id_kontrahenta: val, id_kontaktu: '' })}
                    options={dict.kontrahenci.map((k: any) => ({ id: k.id, label: k.nazwa }))}
                    placeholder="Wybierz klienta z bazy..."
                  />
                </div>
                <button type="button" onClick={() => setCrmModalMode('kontrahent')} className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-600 hover:bg-slate-100 transition" title="Dodaj nowego klienta"><Plus size={18} /></button>
              </div>
            </Field>
            
            <Field label="Osoba kontaktowa">
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchableSelect
                    disabled={!form.id_kontrahenta}
                    value={form.id_kontaktu || ''}
                    onChange={(val) => setForm({ ...form, id_kontaktu: val })}
                    options={dict.kontakty?.map((k: any) => ({ id: k.id, label: `${k.imie} ${k.nazwisko} ${k.stanowisko ? `(${k.stanowisko})` : ''}` })) || []}
                    placeholder={form.id_kontrahenta ? "Wybierz osobę..." : "Najpierw wybierz klienta"}
                  />
                </div>
                <button type="button" disabled={!form.id_kontrahenta} onClick={() => setCrmModalMode('kontakt')} className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-slate-600 hover:bg-slate-100 transition disabled:opacity-50 disabled:pointer-events-none" title="Dodaj nową osobę kontaktową dla tego klienta"><Plus size={18} /></button>
              </div>
            </Field>

            <Field label="Miejsce docelowe z bazy">
              <select className={inputClass} value={form.id_miejsca || ''} onChange={(e) => setForm({ ...form, id_miejsca: e.target.value })}>
                <option value="">Wpiszę ręcznie</option>
                {dict.miejsca.map((m: any) => <option key={m.id} value={m.id}>{m.nazwa}</option>)}
              </select>
            </Field>
            
             <Field label="Miejsce ręcznie"><input className={inputClass} value={form.miejsce_reczne || ''} onChange={(e) => setForm({ ...form, miejsce_reczne: e.target.value })} /></Field>
          </div>
          
          <div className="grid gap-4 md:grid-cols-1 border-t border-slate-100 pt-4 mt-2">
             <Field label="Adres docelowy / Lokalizacja">
               <div className="flex gap-2">
                 <input className={inputClass} value={form.adres_reczny || ''} onChange={(e) => setForm({ ...form, adres_reczny: e.target.value })} placeholder="Wpisz dokładny adres, np. ul. Długa 1, Poznań" />
                 {maps && <a className="flex items-center justify-center gap-2 rounded-xl bg-cyan-50 px-4 py-2 text-sm font-black text-cyan-700 hover:bg-cyan-100 transition whitespace-nowrap" href={maps} target="_blank" rel="noreferrer"><MapPin size={16} /> Otwórz trasę</a>}
               </div>
             </Field>
             <div className="h-64 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm relative">
               {form.adres_reczny ? (
                 <iframe
                   width="100%"
                   height="100%"
                   style={{ border: 0 }}
                   loading="lazy"
                   allowFullScreen
                   referrerPolicy="no-referrer-when-downgrade"
                   src={`https://maps.google.com/maps?q=${encodeURIComponent(form.adres_reczny)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                 ></iframe>
               ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                   <MapPin size={32} className="mb-2 opacity-30" />
                   <p className="text-sm font-bold opacity-60">Wpisz adres, aby wygenerować podgląd mapy</p>
                 </div>
               )}
             </div>
          </div>

          <Field label="Opis / Notatki"><textarea className={`${inputClass} min-h-24`} value={form.notatki_wewnetrzne || ''} onChange={(e) => setForm({ ...form, notatki_wewnetrzne: e.target.value })} /></Field>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-black text-slate-600">{initials(currentManager)}</div>
            <div>
              <p className="font-black text-slate-900">{currentManager ? `${currentManager.imie || ''} ${currentManager.nazwisko || ''}`.trim() : 'Brak opiekuna'}</p>
              <p className="text-sm font-bold text-slate-400">Opiekun wynajmu</p>
            </div>
          </div>
          <Field label="Opiekun"><select className={inputClass} value={form.id_managera || ''} onChange={(e) => setForm({ ...form, id_managera: e.target.value })}><option value="">Brak</option>{dict.uzytkownicy.map((u: any) => <option key={u.id} value={u.id}>{u.imie} {u.nazwisko}</option>)}</select></Field>
          
          <div className="grid gap-3 md:grid-cols-2">
            <Info label="Zwrot rzeczywisty" value={dateTime(item?.data_zwrotu_rzeczywista)} />
            <Info label="Waga" value="0 kg" />
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-black text-slate-700">Statusy poboczne</p>
            <div className="grid gap-3">
              <Field label="Magazyn"><select className={inputClass} value={form.id_statusu_magazynowego || ''} onChange={(e) => setForm({ ...form, id_statusu_magazynowego: e.target.value })}><option value="">Brak</option>{dict.statusyMagazynowe.map((s: any) => <option key={s.id} value={s.id}>{s.ikona || '📦'} {s.nazwa}</option>)}</select></Field>
              <Field label="Księgowość"><select className={inputClass} value={form.id_statusu_ksiegowego || ''} onChange={(e) => setForm({ ...form, id_statusu_ksiegowego: e.target.value })}><option value="">Brak</option>{dict.statusyKsiegowe.map((s: any) => <option key={s.id} value={s.id}>{s.ikona || '💰'} {s.nazwa}</option>)}</select></Field>
            </div>
          </div>
        </Card>
      </form>

      <Card className="!p-0">
        <div className="flex overflow-x-auto border-b border-slate-100">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex min-w-[110px] flex-col items-center justify-center gap-1.5 border-b-2 px-4 py-3 text-xs font-black transition ${active ? 'border-cyan-600 bg-cyan-50/70 text-cyan-700' : 'border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon size={18} />{tab.label}</button>;
          })}
        </div>
        <div className="p-5">
          {activeTab === 'szczegoly' && <p className="rounded-2xl bg-slate-50 p-6 text-sm font-bold text-slate-500">Szczegóły podstawowe edytujesz w górnym panelu. Zapis zostaje na tej stronie i odświeża dane wynajmu.</p>}
          {activeTab === 'oferty' && <OffersPanel offers={allOffers} mainOfferId={form.id_oferty} setMainOfferId={(id: any) => setForm({ ...form, id_oferty: id })} offerName={offerName} setOfferName={setOfferName} createOffer={createOffer} duplicateOffer={duplicateOffer} />}
          {duplicateTarget && <OfferDuplicateTargetModal offer={duplicateTarget} defaultRentalId={params.id as any} onClose={() => setDuplicateTarget(null)} onDone={(o) => router.push(`/dashboard/offers/${o.id}`)} />}
          
          {activeTab === 'sprzet' && !isNew && <RentalEquipmentPanel rentalId={Number(params.id)} rentalName={form.numer || item?.numer || 'Wynajem'} />}
          
          {!['szczegoly','sprzet','oferty'].includes(activeTab) && <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">Zakładka „{TABS.find((t) => t.id === activeTab)?.label}” jest przygotowana w układzie panelu. Logikę podłączymy etapami, bez usuwania istniejącego kodu.</p>}
        </div>
      </Card>
      
      {/* MODAL SZYBKIEGO DODAWANIA KLIENTA / KONTAKTU */}
      {crmModalMode && (
        <QuickAddCrmModal 
          mode={crmModalMode} 
          parentId={form.id_kontrahenta}
          onClose={() => setCrmModalMode(null)} 
          onSuccess={handleCrmSuccess} 
        />
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-lg font-black text-slate-900">{value}</p></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="font-black text-slate-800">{value}</p></div>;
}

function OffersPanel({ offers, mainOfferId, setMainOfferId, offerName, setOfferName, createOffer, duplicateOffer }: any) {
  return <div className="space-y-4">
    <div className="grid gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 p-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
      <Field label="Oferta główna / zaakceptowana">
        <select className={inputClass} value={mainOfferId || ''} onChange={(e) => setMainOfferId(e.target.value)}>
          <option value="">Brak</option>
          {offers.map((o: any) => <option key={o.id} value={o.id}>{o.numer || `#${o.id}`} · {o.nazwa}</option>)}
        </select>
        <p className="mt-1 text-xs font-bold text-slate-400">Lista pokazuje wyłącznie oferty przypisane do tego wynajmu.</p>
      </Field>
      <Field label="Nazwa nowej oferty"><input className={inputClass} value={offerName} onChange={(e) => setOfferName(e.target.value)} /></Field>
      <Button onClick={createOffer}><Plus size={16} className="inline" /> Dodaj ofertę do wynajmu</Button>
    </div>
    <div className="grid gap-3 lg:grid-cols-2">
      {offers.map((o: any) => <div key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-wider text-slate-400">{o.numer || `Oferta #${o.id}`}</p><h3 className="mt-1 text-lg font-black text-slate-900">{o.nazwa}</h3><p className="text-sm font-bold text-slate-400">{o.status?.nazwa || 'Bez statusu'} · wersji: {o.wersje?.length || 0}</p></div><p className="text-right text-lg font-black text-cyan-700">{money(o.suma_netto)}</p></div><div className="mt-4 flex flex-wrap gap-2"><Link className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white" href={`/dashboard/offers/${o.id}`}>Otwórz</Link><Link className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700" href={`/dashboard/offers/${o.id}/pdf`} target="_blank">PDF</Link><button onClick={() => duplicateOffer(o)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700"><Copy size={15} className="inline" /> Duplikuj</button></div></div>)}
      {offers.length === 0 && <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">Do tego wynajmu nie ma jeszcze ofert.</p>}
    </div>
  </div>;
}


// ============================================================================
// KOMPONENT ZARZĄDZANIA SPRZĘTEM DLA WYNAJMU
// ============================================================================
function RentalEquipmentPanel({ rentalId, rentalName }: { rentalId: number; rentalName: string }) {
  const router = useRouter();
  const [data, setData] = useState<any>({ planowane: [], pozycje_dokumentow: [], kategorie: [], dokumenty: [], podsumowanie: {} });
  const [items, setItems] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [equipmentCategories, setEquipmentCategories] = useState<any[]>([]);
  const [mode, setMode] = useState<'plan' | 'wydanie' | 'przyjecie'>('plan');
  const [showEditor, setShowEditor] = useState(false);
  const [activeRoot, setActiveRoot] = useState<string>('all');
  const [activeSub, setActiveSub] = useState<string>('');
  const [query, setQuery] = useState('');
  const [planQty, setPlanQty] = useState<Record<string, string>>({});
  const [scanCode, setScanCode] = useState('');
  const scanInputRef = useRef<HTMLInputElement | null>(null);
  const [docItems, setDocItems] = useState<any[]>([]);
  const [docForm, setDocForm] = useState<any>({ osoba_odbierajaca: '', podpis_odbierajacego: '', uwagi: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    const [gear, i, m, k] = await Promise.all([
      api.get(`/api/magazyn/wynajmy/${rentalId}/sprzet`).catch(() => ({ data: { planowane: [], pozycje_dokumentow: [], kategorie: [], dokumenty: [], podsumowanie: {} } })),
      api.get('/api/magazyn/wszystkie-egzemplarze').catch(() => ({ data: [] })),
      api.get('/api/magazyn/modele').catch(() => ({ data: [] })),
      api.get('/api/magazyn/kategorie').catch(() => ({ data: [] })),
    ]);

    const gearData = gear.data || { planowane: [], pozycje_dokumentow: [], kategorie: [], dokumenty: [], podsumowanie: {} };
    setData(gearData);
    setItems(i.data || []);
    setModels(m.data || []);
    setEquipmentCategories(k.data || gearData.kategorie || []);

    const nextQty: Record<string, string> = {};
    (gearData.planowane || []).forEach((p: any) => {
      const id = p.id_modelu || p.model?.id;
      if (!id) return;
      nextQty[String(id)] = String(Number(nextQty[String(id)] || 0) + Number(p.ilosc || p.planowana_ilosc || 0));
    });
    setPlanQty(nextQty);
  }

  useEffect(() => { load(); }, [rentalId]);

  const { roots: equipmentCategoryRoots, byId: equipmentCategoryById } = useMemo(() => buildCategoryTree(equipmentCategories), [equipmentCategories]);

  const modelCountByCategory = useMemo(() => {
    const map = new Map<string, number>();
    models.filter((m: any) => m.typ_sprzetu !== 'opakowanie').forEach((m: any) => {
      const id = modelCategoryId(m);
      if (!id) return;
      map.set(id, (map.get(id) || 0) + 1);
    });
    return map;
  }, [models]);

  function totalForEquipmentCategory(categoryId: string) {
    const ids = descendantsOf(categoryId, equipmentCategoryById);
    let total = 0;
    ids.forEach((id) => { total += modelCountByCategory.get(id) || 0; });
    return total;
  }

  const modelById = useMemo(() => {
    const map = new Map<string, any>();
    (models || []).forEach((model: any) => {
      if (model?.id) map.set(String(model.id), model);
    });
    return map;
  }, [models]);

  function isQuantityOnlyModel(model: any) {
    return Boolean(
      model?.sprzet_ilosciowy === true ||
      model?.czy_ilosciowy === true ||
      model?.quantityOnly === true ||
      model?.tryb_ewidencji === 'ilosciowe' ||
      model?.typ_ewidencji === 'ilosciowe' ||
      model?.rodzaj_ewidencji === 'ilosciowe'
    );
  }

  const plannedRows = useMemo(() => {
    const map = new Map<string, any>();
    
    (data.planowane || []).forEach((p: any) => {
      const id = modelIdOf(p);
      if (!id) return;
      const key = String(id);
      if (!map.has(key)) {
        map.set(key, {
          id_modelu: id,
          nazwa: modelNameOf(p),
          kategoria: categoryOf(p, equipmentCategoryById),
          kategoria_id: modelCategoryIdOf(p),
          quantityOnly: false,
          kod: '',
          jednostka: 'szt.',
          plan: 0,
          wydane: 0,
          przyjete: 0,
          scanned: 0,
          egzemplarze_wydane: [],
          egzemplarze_przyjete: [],
        });
      }
      const row = map.get(key);
      row.plan += Number(p.ilosc || p.planowana_ilosc || 0);

      const sourceModel = p.model || modelById.get(String(id)) || p;
      if (isQuantityOnly(p) || isQuantityOnlyModel(sourceModel)) {
        row.quantityOnly = true;
        row.kod = p.kod || p.kod_kreskowy || sourceModel?.kod_kreskowy || sourceModel?.kod || row.kod || '';
        row.jednostka = p.jednostka || sourceModel?.jednostka || row.jednostka || 'szt.';
      }
    });

    (data.pozycje_dokumentow || []).forEach((p: any) => {
      const id = modelIdOf(p);
      if (!id) return;
      const key = String(id);
      if (!map.has(key)) {
        map.set(key, {
          id_modelu: id,
          nazwa: modelNameOf(p),
          kategoria: categoryOf(p, equipmentCategoryById),
          kategoria_id: modelCategoryIdOf(p),
          quantityOnly: false,
          kod: '',
          jednostka: 'szt.',
          plan: 0,
          wydane: 0,
          przyjete: 0,
          scanned: 0,
          egzemplarze_wydane: [],
          egzemplarze_przyjete: [],
        });
      }
      const row = map.get(key);
      const label = numberOf(p) || p.kod || p.nazwa || `#${p.id_egzemplarza || ''}`;
      
      if (p.zrodlo === 'wydanie') {
        row.wydane += Number(p.ilosc || 1);
        if (label) row.egzemplarze_wydane.push(label);
      }
      if (p.zrodlo === 'przyjecie') {
        row.przyjete += Number(p.ilosc || 1);
        if (label) row.egzemplarze_przyjete.push(label);
      }
    });

    docItems.forEach((p: any) => {
      const id = modelIdOf(p);
      if (!id) return;
      const key = String(id);
      if (!map.has(key)) {
        map.set(key, {
          id_modelu: id,
          nazwa: modelNameOf(p),
          kategoria: categoryOf(p, equipmentCategoryById),
          kategoria_id: modelCategoryIdOf(p),
          quantityOnly: false,
          kod: '',
          jednostka: 'szt.',
          plan: 0,
          wydane: 0,
          przyjete: 0,
          scanned: 0,
          egzemplarze_wydane: [],
          egzemplarze_przyjete: [],
        });
      }
      map.get(key).scanned += Number(p.ilosc || 1);
    });

    return Array.from(map.values()).map((row: any) => {
      const model = modelById.get(String(row.id_modelu));
      const quantityOnly = row.quantityOnly || isQuantityOnlyModel(model);
      return {
        ...row,
        quantityOnly,
        kod: row.kod || model?.kod_kreskowy || model?.kod || '',
        jednostka: row.jednostka || model?.jednostka || 'szt.',
      };
    }).sort((a, b) => String(a.kategoria).localeCompare(String(b.kategoria), 'pl') || String(a.nazwa).localeCompare(String(b.nazwa), 'pl'));
  }, [data, docItems, equipmentCategoryById, modelById]);

  const plannedGroups = useMemo(() => {
    const groups = new Map<string, any>();
    plannedRows.forEach((row: any) => {
      if (!groups.has(row.kategoria)) groups.set(row.kategoria, { nazwa: row.kategoria, rows: [], plan: 0, wydane: 0, przyjete: 0, scanned: 0 });
      const group = groups.get(row.kategoria);
      group.rows.push(row);
      group.plan += row.plan;
      group.wydane += row.wydane;
      group.przyjete += row.przyjete;
      group.scanned += row.scanned;
    });
    return Array.from(groups.values());
  }, [plannedRows]);

  function categoryOf(row: any, equipmentCategoryByIdMap: Map<string, any>) {
    const id = modelCategoryIdOf(row);
    if (id && equipmentCategoryByIdMap.has(String(id))) return categoryPath(String(id), equipmentCategoryByIdMap);
    return row?.kategoria || row?.kategoria_nazwa || row?.model?.kategoria?.nazwa || row?.egzemplarz?.model?.kategoria?.nazwa || 'Bez kategorii';
  }

  const activeCategoryIds = useMemo(() => {
    if (activeSub) return descendantsOf(activeSub, equipmentCategoryById);
    if (activeRoot && activeRoot !== 'all') return descendantsOf(activeRoot, equipmentCategoryById);
    return new Set<string>();
  }, [activeRoot, activeSub, equipmentCategoryById]);

  const activeRootObj = useMemo(() => activeRoot && activeRoot !== 'all' ? equipmentCategoryById.get(String(activeRoot)) : null, [activeRoot, equipmentCategoryById]);

  const visibleModels = useMemo(() => {
    const q = query.trim().toLowerCase();
    return models
      .filter((m: any) => m.typ_sprzetu !== 'opakowanie')
      .map((m: any) => {
        const catId = modelCategoryId(m);
        const path = catId ? categoryPath(catId, equipmentCategoryById) : '';
        return { ...m, kategoria_id: catId, kategoria_nazwa: path || m.kategoria_nazwa || m.kategoria?.nazwa || 'Bez kategorii' };
      })
      .filter((m: any) => activeRoot === 'all' || activeCategoryIds.has(String(m.kategoria_id)))
      .filter((m: any) => !q || `${m.nazwa || ''} ${m.kategoria_nazwa || ''}`.toLowerCase().includes(q))
      .sort((a: any, b: any) => String(a.kategoria_nazwa || '').localeCompare(String(b.kategoria_nazwa || ''), 'pl') || String(a.nazwa || '').localeCompare(String(b.nazwa || ''), 'pl'));
  }, [models, activeRoot, activeCategoryIds, query, equipmentCategoryById]);

  function changeQty(model: any, value: string) {
    const qty = Math.max(0, Number(value || 0) || 0);
    setPlanQty((prev) => ({ ...prev, [String(model.id)]: String(qty) }));
  }

  function stepQty(model: any, delta: number) {
    const current = Number(planQty[String(model.id)] || 0) || 0;
    changeQty(model, String(Math.max(0, current + delta)));
  }

  async function savePlan() {
    setError('');
    setNotice('');
    try {
      const pozycje = Object.entries(planQty)
        .map(([id, qty]) => ({ id_modelu: Number(id), ilosc: Number(qty || 0) }))
        .filter((p) => p.id_modelu && p.ilosc > 0);
      
      await api.post(`/api/magazyn/wynajmy/${rentalId}/sprzet`, { replace: true, pozycje });
      
      setShowEditor(false);
      setNotice('Zapisano plan sprzętu wypożyczenia. Wydanie robisz po zeskanowaniu konkretnych egzemplarzy.');
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Nie udało się zapisać planu sprzętu.');
    }
  }

  function caseScanMeta(row: any) {
    if (!row) return null;
    return {
      id: row.id || row.id_egzemplarza,
      nazwa: row.nazwa || row.nazwa_modelu || 'Case',
      kod: row.kod || row.kod_kreskowy || '',
    };
  }

  function normalizeDocumentItem(row: any, source: 'scan' | 'manual' = 'manual') {
    if (isQuantityOnly(row)) {
      return {
        source,
        rowType: 'ilosciowy_model',
        quantityOnly: true,
        id_modelu: row.id_modelu || row.model?.id || row.id,
        id_egzemplarza: null,
        nazwa: row.nazwa_modelu || row.nazwa || row.model?.nazwa || 'Sprzęt ilościowy',
        nazwa_modelu: row.nazwa_modelu || row.nazwa || row.model?.nazwa || 'Sprzęt ilościowy',
        numer_egzemplarza: '',
        kategoria: categoryOf(row, equipmentCategoryById),
        kod: row.kod || row.kod_kreskowy || row.model?.kod_kreskowy || '',
        ilosc: Number(row.ilosc || 1),
        jednostka: row.jednostka || row.model?.jednostka || 'szt.',
        uwagi: row.uwagi || 'Sprzęt ilościowy bez egzemplarzy',
      };
    }
    const egz = row.egzemplarz || row;
    const model = row.model || row.egzemplarz?.model;
    return {
      source,
      rowType: 'egzemplarz',
      id_modelu: row.id_modelu || model?.id || egz.id_modelu,
      id_egzemplarza: row.id_egzemplarza || egz.id,
      nazwa: [model?.nazwa || row.nazwa_modelu || egz.model?.nazwa || row.nazwa, egz.nazwa && egz.nazwa !== model?.nazwa ? egz.nazwa : null, numberOf(row) ? `nr ${numberOf(row)}` : null].filter(Boolean).join(' · '),
      nazwa_modelu: model?.nazwa || row.nazwa_modelu || egz.model?.nazwa || row.nazwa,
      numer_egzemplarza: numberOf(row),
      kategoria: categoryOf(row, equipmentCategoryById),
      kod: row.kod || egz.kod_kreskowy || egz.zewnetrzny_kod_kreskowy || egz.zewnetrzny_qr_kod || egz.qr_kod || egz.sn || '',
      ilosc: 1,
      uwagi: row.uwagi || '',
    };
  }

  function addDocumentItemsBulk(rows: any[], source: 'scan' | 'manual' = 'manual', sourceLabel = '', scannedCase: any = null) {
    const normalized = rows
      .filter((row: any) => isEquipmentInstance(row) && !isCase(row))
      .map((row: any) => {
        const item = normalizeDocumentItem(row, source);
        const meta = scannedCase || row.system_case_scan || row.case_scan || null;
        return meta ? { ...item, system_case_scan: meta, id_zeskanowanego_case: meta.id, nazwa_zeskanowanego_case: meta.nazwa } : item;
      })
      .filter((item: any) => item.id_egzemplarza);
      
    if (!normalized.length) {
      setError('Nie znaleziono aktywnych egzemplarzy sprzętu do dodania na dokument.');
      return;
    }

    setDocItems((prev) => {
      const existingIds = new Set(prev.map((p: any) => Number(p.id_egzemplarza)).filter(Boolean));
      const toAdd: any[] = [];
      for (const item of normalized) {
        const id = Number(item.id_egzemplarza);
        if (!id || existingIds.has(id)) continue;
        existingIds.add(id);
        toAdd.push(item);
      }
      const skipped = normalized.length - toAdd.length;
      if (!toAdd.length) {
        setNotice(sourceLabel ? `${sourceLabel}: wszystkie egzemplarze z tego skanu są na aktualnym dokumencie.` : 'Ten sprzęt jest już zeskanowany na aktualnym dokumencie.');
        return prev;
      }
      setNotice(sourceLabel
        ? `${sourceLabel}: dodano ${toAdd.length} egz. z case${skipped ? `, pominięto duplikaty: ${skipped}` : ''}. Case nie trafia na dokument.`
        : `Dodano ${toAdd.length} egz.${skipped ? `, pominięto duplikaty: ${skipped}` : ''}.`
      );
      return [...prev, ...toAdd];
    });
  }

  function addQuantityDocumentItem(row: any, source: 'scan' | 'manual' = 'scan') {
    const modelId = Number(row.id_modelu || row.model?.id || row.id);
    if (!modelId) {
      setError('Nie udało się rozpoznać modelu ilościowego.');
      return;
    }
    const name = row.nazwa_modelu || row.nazwa || row.model?.nazwa || 'Sprzęt ilościowy';
    const available = Number(row.ilosc_dostepna || row.model?.ilosc_magazynowa || 0);
    const unit = row.jednostka || row.model?.jednostka || 'szt.';

    const answer = window.prompt(`Ile sztuk wydać/przyjąć?\n${name}${available ? `\nDostępnie w magazynie: ${available} ${unit}` : ''}`, '1');
    if (answer === null) {
      setNotice('Anulowano dodawanie sprzętu ilościowego.');
      return;
    }
    const requested = Number(String(answer).replace(',', '.'));
    const suggested = Math.max(0, available ? Math.min(available, requested) : requested);

    if (!Number.isFinite(suggested) || suggested <= 0) {
      setError('Podaj ilość większą od 0.');
      return;
    }

    const item = normalizeDocumentItem({ ...row, id_modelu: modelId, ilosc: suggested, jednostka: unit }, source);
    setDocItems((prev) => {
      const idx = prev.findIndex((p: any) => isQuantityOnly(p) && Number(p.id_modelu) === modelId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ilosc: Number(next[idx].ilosc || 0) + suggested };
        return next;
      }
      return [...prev, item];
    });
    setNotice(`Dodano ${suggested} ${unit} · ${name}.`);
  }

  function quantityRowSelected(row: any) {
    const modelId = Number(row?.id_modelu);
    if (!modelId) return false;
    return docItems.some((p: any) => isQuantityOnly(p) && Number(p.id_modelu) === modelId);
  }

  function toggleQuantityRowWithoutScan(row: any, checked: boolean) {
    setError('');
    setNotice('');
    const modelId = Number(row?.id_modelu);
    if (!modelId) {
      setError('Nie udało się rozpoznać modelu ilościowego.');
      return;
    }

    if (!checked) {
      setDocItems((prev) => prev.filter((p: any) => !(isQuantityOnly(p) && Number(p.id_modelu) === modelId)));
      setNotice(`Usunięto ${row.nazwa || 'sprzęt ilościowy'} z aktualnego dokumentu.`);
      return;
    }

    const amount = missingAfterScan(row);
    if (!Number.isFinite(amount) || amount <= 0) {
      setNotice(`${row.nazwa || 'Ten model'} nie ma już brakujących sztuk do ${mode === 'wydanie' ? 'wydania' : 'przyjęcia'}.`);
      return;
    }

    const model = modelById.get(String(modelId)) || {};
    const unit = row.jednostka || model.jednostka || 'szt.';

    const item = normalizeDocumentItem({
      ...model,
      rowType: 'ilosciowy_model',
      quantityOnly: true,
      id: modelId,
      id_modelu: modelId,
      nazwa: row.nazwa || model.nazwa,
      nazwa_modelu: row.nazwa || model.nazwa,
      kategoria: row.kategoria,
      kod: row.kod || model.kod_kreskowy || model.kod || '',
      ilosc: amount,
      jednostka: unit,
      uwagi: `${mode === 'wydanie' ? 'Wydanie' : 'Przyjęcie'} sprzętu ilościowego bez skanowania`,
    }, 'manual');

    setDocItems((prev) => {
      const withoutThisModel = prev.filter((p: any) => !(isQuantityOnly(p) && Number(p.id_modelu) === modelId));
      return [...withoutThisModel, { ...item, source: 'checkbox' }];
    });
    setNotice(`${mode === 'wydanie' ? 'Dodano do wydania' : 'Dodano do przyjęcia'} ${amount} ${unit} · ${row.nazwa || model.nazwa || 'sprzęt ilościowy'}.`);
  }

  function addDocumentItem(row: any, source: 'scan' | 'manual' = 'manual') {
    setError('');
    setNotice('');

    if (isCase(row)) {
      const contents = (row.contents || row.zawartosc_case || [])
        .filter((child: any) => !isCase(child) && isEquipmentInstance(child));
      
      if (!contents.length) {
        setError('Ten case jest pusty albo nie ma aktywnych egzemplarzy sprzętu w środku. Case nie trafia na dokument.');
        return;
      }
      
      const label = row.nazwa || row.nazwa_modelu || row.kod || `case #${row.id || row.id_egzemplarza || ''}`;
      addDocumentItemsBulk(contents, 'scan', `Zeskanowano case ${label}`, caseScanMeta(row));
      return;
    }

    if (isQuantityOnly(row)) {
      addQuantityDocumentItem(row, source);
      return;
    }

    if (!isEquipmentInstance(row)) {
      setError('Wydanie/przyjęcie działa na egzemplarzach, case rozwija się na zawartość, a sprzęt ilościowy zapisujemy jako model + ilość.');
      return;
    }

    addDocumentItemsBulk([row], source);
  }

  function focusScanInput() {
    scanInputRef.current?.focus();
    scanInputRef.current?.select();
  }

  async function scan() {
    const code = scanCode.trim();
    if (!code) {
      focusScanInput();
      setNotice('Wpisz albo zeskanuj kod w polu tekstowym i naciśnij Enter.');
      return;
    }

    try {
      const response = await api.get(`/api/magazyn/skan?kod=${encodeURIComponent(code)}`);
      addDocumentItem(response.data, 'scan');
      setScanCode('');
      setTimeout(focusScanInput, 0);
    } catch (e: any) {
      setError(e?.response?.data?.message || `Nie znaleziono sprzętu dla kodu: ${code}`);
      setTimeout(focusScanInput, 0);
    }
  }

  async function createDocument(type: 'wydanie' | 'przyjecie') {
    if (!docItems.length) return alert('Najpierw zeskanuj albo wybierz egzemplarze sprzętu.');
    if (type === 'wydanie' && !docForm.osoba_odbierajaca?.trim()) {
      return setError('Przy wydaniu na wynajem wpisz osobę odbierającą sprzęt!');
    }

    setError('');
    try {
      const response = await api.post('/api/magazyn/dokumenty', {
        typ: type,
        id_wynajmu: rentalId,
        osoba_odbierajaca: docForm.osoba_odbierajaca,
        podpis_odbierajacego: docForm.podpis_odbierajacego,
        uwagi: docForm.uwagi || `Dokument ${type === 'wydanie' ? 'wydania' : 'przyjęcia'} dla wynajmu: ${rentalName}`,
        pozycje: docItems.map((p) => ({ ...p, ilosc: Number(p.ilosc || 1), status: type === 'wydanie' ? 'wydany' : 'przyjety' })),
      });
      
      setDocItems([]);
      await load();
      router.push(`/dashboard/warehouse/documents/${response.data.id}`);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Nie udało się wygenerować dokumentu.');
    }
  }

  function countAfterScan(row: any) {
    return mode === 'wydanie' ? row.wydane + row.scanned : row.przyjete + row.scanned;
  }
  function missingAfterScan(row: any) {
    return mode === 'wydanie'
      ? Math.max(0, row.plan - row.wydane - row.scanned)
      : Math.max(0, row.wydane - row.przyjete - row.scanned);
  }

  const plannedTotal = plannedRows.reduce((s, r) => s + r.plan, 0);
  const issuedTotal = plannedRows.reduce((s, r) => s + r.wydane, 0);
  const returnedTotal = plannedRows.reduce((s, r) => s + r.przyjete, 0);

  return <div className="space-y-5">
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-black text-red-700">{error}</div>}
    {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-700">{notice}</div>}

    <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-600">Sprzęt wypożyczenia</p>
          <h3 className="mt-1 text-2xl font-black text-slate-900">Plan sprzętu, wydanie i przyjęcie</h3>
          <p className="mt-1 max-w-3xl text-sm font-bold text-slate-500">Plan edytujesz po modelach i ilościach. Wydanie oraz przyjęcie działa na konkretnych egzemplarzach po skanie.</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:min-w-[420px]">
          <Metric label="Plan" value={`${plannedTotal} szt.`} />
          <Metric label="Wydano" value={`${issuedTotal} szt.`} />
          <Metric label="Przyjęto" value={`${returnedTotal} szt.`} />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {([
            ['plan', 'Lista sprzętu'],
            ['wydanie', 'Wydaj WZ'],
            ['przyjecie', 'Przyjmij PZ'],
          ] as const).map(([m, label]) => <button key={m} type="button" onClick={() => { setMode(m); setQuery(''); setError(''); setNotice(''); setDocItems([]); }} className={`rounded-2xl px-5 py-3 text-sm font-black transition ${mode === m ? 'bg-cyan-600 text-white shadow-sm' : 'border border-slate-200 bg-white text-slate-600 hover:bg-cyan-50'}`}>{label}</button>)}
        </div>
        {mode === 'plan' && <button type="button" onClick={() => setShowEditor((v) => !v)} className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-cyan-700"><Plus size={16} className="inline" /> {showEditor ? 'Zamknij dodawanie' : 'Dodaj / zmień sprzęt'}</button>}
      </div>

      {mode === 'plan' && <div className="grid gap-0 xl:grid-cols-[1fr_520px]">
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-lg font-black text-slate-900">Sprzęt przypisany do wypożyczenia</h4>
              <p className="text-sm font-bold text-slate-500">Podział jak w ofertach: kategoria główna / podkategoria / model.</p>
            </div>
          </div>
          <div className="space-y-4">
            {plannedGroups.map((group: any) => <div key={group.nazwa} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3">
                <div><p className="text-base font-black text-slate-900">{group.nazwa}</p><p className="text-xs font-bold text-slate-400">{group.rows.length} modeli</p></div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 shadow-sm">plan {group.plan} · WZ {group.wydane} · PZ {group.przyjete}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {group.rows.map((row: any) => <div key={row.id_modelu} className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_280px] md:items-center">
                  <div><p className="font-black text-slate-900">{row.nazwa}</p><p className="text-xs font-bold text-slate-400">model · {row.kategoria}</p></div>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-2 text-center text-xs font-black"><span><b className="block text-lg text-slate-900">{row.plan}</b>plan</span><span><b className="block text-lg text-emerald-700">{row.wydane}</b>WZ</span><span><b className="block text-lg text-blue-700">{row.przyjete}</b>PZ</span></div>
                </div>)}
              </div>
            </div>)}
            {!plannedGroups.length && <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">Brak sprzętu przypisanego do wypożyczenia. Kliknij „Dodaj / zmień sprzęt”.</p>}
          </div>
        </div>

        {showEditor && <aside className="border-l border-cyan-100 bg-cyan-50/50 p-5">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-2xl border border-cyan-100 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div><h4 className="text-lg font-black text-slate-900">Dodaj / zmień sprzęt</h4><p className="text-sm font-bold text-slate-500">Wybierz kategorię, potem podkategorię i wpisz ilość przy modelu. Bez koszyka.</p></div>
                <button type="button" onClick={() => setShowEditor(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600">Zamknij</button>
              </div>
              <Field label="Szukaj modelu"><div className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={17}/><input className={`${inputClass} pl-10`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="projektor, monitor, kabel..." /></div></Field>
              <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Kategorie główne</p>
                <div className="flex max-h-[140px] flex-wrap gap-2 overflow-y-auto pr-1">
                  <button type="button" onClick={() => { setActiveRoot('all'); setActiveSub(''); }} className={`rounded-xl px-3 py-2 text-xs font-black ${activeRoot === 'all' ? 'bg-cyan-600 text-white' : 'bg-white text-slate-700 hover:bg-cyan-50'}`}>Wszystkie</button>
                  {equipmentCategoryRoots.map((root: any) => <button key={root.id} type="button" onClick={() => { setActiveRoot(String(root.id)); setActiveSub(''); }} className={`rounded-xl px-3 py-2 text-xs font-black ${activeRoot === String(root.id) ? 'bg-cyan-600 text-white' : 'bg-white text-slate-700 hover:bg-cyan-50'}`}>{root.nazwa} <span className="opacity-60">{totalForEquipmentCategory(String(root.id))}</span></button>)}
                </div>
              </div>
              {activeRootObj?.dzieci?.length > 0 && <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-slate-400">Podkategorie</p>
                <div className="flex max-h-[160px] flex-wrap gap-2 overflow-y-auto pr-1">
                  <button type="button" onClick={() => setActiveSub('')} className={`rounded-xl px-3 py-2 text-xs font-black ${!activeSub ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>Wszystkie w {activeRootObj.nazwa}</button>
                  {activeRootObj.dzieci.map((child: any) => <button key={child.id} type="button" onClick={() => setActiveSub(String(child.id))} className={`rounded-xl px-3 py-2 text-xs font-black ${activeSub === String(child.id) ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>{child.nazwa} <span className="opacity-60">{totalForEquipmentCategory(String(child.id))}</span></button>)}
                </div>
              </div>}
            </div>

            <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
              {visibleModels.map((model: any) => {
                const qty = Number(planQty[String(model.id)] || 0) || 0;
                return <div key={model.id} className={`rounded-2xl border bg-white p-3 shadow-sm transition ${qty > 0 ? 'border-cyan-300 ring-2 ring-cyan-100' : 'border-slate-200'}`}>
                  <div className="flex gap-3">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-xs font-black text-slate-400">
                      {model.zdjecie ? <img src={model.zdjecie} alt="" className="h-full w-full object-cover" /> : 'IMG'}
                    </div>
                    <div className="min-w-0 flex-1"><p className="truncate font-black text-slate-900">{model.nazwa}</p><p className="truncate text-xs font-bold text-slate-400">{model.kategoria_nazwa}</p><p className="mt-1 text-xs font-black text-cyan-700">Dostępne: {model.dostepne ?? model.ilosc_dostepna ?? model.na_stanie ?? 0}</p></div>
                  </div>
                  <div className="mt-3 grid grid-cols-[44px_1fr_44px] gap-2">
                    <button type="button" onClick={() => stepQty(model, -1)} className="rounded-xl border border-slate-200 bg-white text-lg font-black text-slate-700">-</button>
                    <input type="number" min={0} className={`${inputClass} text-center text-lg font-black`} value={planQty[String(model.id)] ?? '0'} onChange={(e) => changeQty(model, e.target.value)} />
                    <button type="button" onClick={() => stepQty(model, 1)} className="rounded-xl bg-cyan-600 text-lg font-black text-white">+</button>
                  </div>
                </div>;
              })}
              {!visibleModels.length && <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm font-bold text-slate-400">Brak modeli w tej kategorii.</p>}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between"><p className="font-black text-slate-900">Po zmianach</p><span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700">{Object.values(planQty).filter((v) => Number(v) > 0).length} modeli</span></div>
              <div className="max-h-[150px] space-y-1 overflow-y-auto pr-1">
                {Object.entries(planQty).filter(([, qty]) => Number(qty) > 0).map(([id, qty]) => {
                  const model = models.find((m: any) => String(m.id) === String(id));
                  return <div key={id} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold"><span className="truncate">{model?.nazwa || `Model #${id}`}</span><b>x{qty}</b></div>;
                })}
              </div>
              <div className="mt-3 flex gap-2"><button type="button" onClick={load} className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-600">Cofnij</button><button type="button" onClick={savePlan} className="flex-1 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-black text-white">Zapisz plan</button></div>
            </div>
          </div>
        </aside>}
      </div>}

      {mode !== 'plan' && <div className="grid gap-0 xl:grid-cols-[1.15fr_.85fr]">
        <div className="p-5">
          <div className="mb-4 rounded-2xl border border-cyan-100 bg-cyan-50 p-4">
            <p className="text-sm font-black text-cyan-900">{mode === 'wydanie' ? 'Skanuj egzemplarze do wydania. Sprzęt ilościowy możesz zaznaczyć checkboxem bez skanowania.' : 'Skanuj zwracane egzemplarze. Sprzęt ilościowy możesz zaznaczyć checkboxem bez skanowania.'}</p>
          </div>
          <div className="space-y-4">
            {plannedGroups.map((group: any) => <div key={group.nazwa} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-slate-50 px-4 py-3"><b className="text-slate-900">{group.nazwa}</b></div>
              <div className="divide-y divide-slate-100">
                {group.rows.map((row: any) => {
                  const after = countAfterScan(row);
                  const missing = missingAfterScan(row);
                  const base = mode === 'wydanie' ? row.plan : row.wydane;
                  const percent = base > 0 ? Math.min(100, Math.round((after / base) * 100)) : 100;
                  return <div key={row.id_modelu} className="px-4 py-3">
                    <div className="grid gap-3 lg:grid-cols-[1fr_280px] lg:items-center">
                      <div>
                        <p className="font-black text-slate-900">{row.nazwa}</p>
                        <p className="text-xs font-bold text-slate-400">{mode === 'wydanie' ? `Plan ${row.plan} · wydano wcześniej ${row.wydane} · skan teraz ${row.scanned}` : `Wydano ${row.wydane} · przyjęto wcześniej ${row.przyjete} · skan teraz ${row.scanned}`}</p>
                        {row.quantityOnly && <label className="mt-3 inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-900 hover:bg-cyan-100">
                          <input
                            type="checkbox"
                            className="h-5 w-5 rounded border-cyan-300 accent-cyan-600"
                            checked={quantityRowSelected(row)}
                            onChange={(e) => toggleQuantityRowWithoutScan(row, e.target.checked)}
                          />
                          <span>{mode === 'wydanie' ? 'Wydaj na sztuki bez skanu' : 'Przyjmij na sztuki bez skanu'}</span>
                          <span className="rounded-full bg-white px-2 py-1 text-cyan-700">{quantityRowSelected(row) ? `${row.scanned} ${row.jednostka || 'szt.'}` : `${missing} ${row.jednostka || 'szt.'}`}</span>
                        </label>}
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <div className="mb-2 flex justify-between text-xs font-black"><span>{mode === 'wydanie' ? 'Wydano po skanie' : 'Przyjęto po skanie'}: {after}/{base}</span><span className={missing ? 'text-orange-600' : 'text-emerald-700'}>{missing ? `brakuje ${missing}` : 'OK'}</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full ${missing ? 'bg-orange-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }} /></div>
                      </div>
                    </div>
                  </div>;
                })}
              </div>
            </div>)}
          </div>
        </div>
        <div className="border-l border-slate-100 bg-slate-50/70 p-5">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-1 text-sm font-bold text-slate-500">Zeskanuj kod sprzętu / QR / S/N</p>
              <div className="flex gap-2">
                <input ref={scanInputRef} className={inputClass} placeholder="SKANUJ KOD..." value={scanCode} onChange={(e) => setScanCode(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); scan(); } }} autoFocus />
                <Button onClick={scan}>Skanuj</Button>
              </div>
            </div>

            {mode === 'wydanie' && (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4">
                <p className="mb-2 text-sm font-black text-orange-900">Dane odbiorcy WZ</p>
                <div className="space-y-3">
                  <Field label="Osoba odbierająca sprzęt *"><input className={inputClass} value={docForm.osoba_odbierajaca || ''} onChange={(e) => setDocForm({ ...docForm, osoba_odbierajaca: e.target.value })} required /></Field>
                  <Field label="Podpis / uwierzytelnienie"><input className={inputClass} value={docForm.podpis_odbierajacego || ''} onChange={(e) => setDocForm({ ...docForm, podpis_odbierajacego: e.target.value })} placeholder="Kowalski lub skan ID..." /></Field>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between"><h4 className="font-black text-slate-900">Skanowane teraz</h4><span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black text-cyan-700">{docItems.length} pozycji</span></div>
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {docItems.map((p: any, idx: number) => <div key={`${p.id_egzemplarza || p.id_modelu}-${idx}`} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><div className="flex justify-between gap-2"><div><p className="text-sm font-black text-slate-900">{p.nazwa}</p><p className="mt-1 text-xs font-bold text-slate-500">{p.kod || p.uwagi || '-'}</p></div><div className="text-right text-sm font-black text-cyan-700">{p.ilosc} szt.</div></div></div>)}
                {!docItems.length && <p className="text-center text-sm font-bold text-slate-400">Brak sprzętu w koszyku dokumentu.</p>}
              </div>
              <Field label="Uwagi do dokumentu"><textarea className={`${inputClass} mt-3`} value={docForm.uwagi || ''} onChange={(e) => setDocForm({ ...docForm, uwagi: e.target.value })} /></Field>
              <div className="mt-3 flex gap-2"><Button variant="secondary" onClick={() => setDocItems([])}>Wyczyść koszyk</Button><button type="button" disabled={!docItems.length} onClick={() => createDocument(mode as 'wydanie' | 'przyjecie')} className="flex-1 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-black text-white hover:bg-cyan-700 disabled:opacity-50">Zapisz {mode === 'wydanie' ? 'Wydanie' : 'Przyjęcie'}</button></div>
            </div>
          </div>
        </div>
      </div>}
    </section>
  </div>;
}