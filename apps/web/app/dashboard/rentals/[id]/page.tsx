'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, Loader2, Plus, Save, Truck, Calendar } from 'lucide-react';
import { api } from '../../../../lib/api';
import { Button, Card, Field, inputClass } from '../../../../components/ProductUI';
import { OfferDuplicateTargetModal } from '../../../../components/OfferDuplicateTargetModal';

// EVENTFLOW_PRODUCT_POLISH_V8:
// Panel wynajmu dopina zasadę 1:N dla ofert: do jednego wynajmu można mieć kilka ofert/szablonów. Wynajem jest osobnym bytem i nie jest już częścią wydarzenia.

function toSelect(v: any) { return v === null || v === undefined ? '' : String(v); }
function toDateInput(v: any) { return v ? String(v).slice(0, 16) : ''; }
function numOrNull(v: any) { return v === '' || v === null || v === undefined ? null : Number(v); }
function strOrNull(v: any) { return v === '' || v === null || v === undefined ? null : String(v); }
function dateTime(v: any) { return v ? new Date(v).toLocaleString('pl-PL') : '-'; }
function money(v: any) { return `${Number(v || 0).toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`; }

export default function RentalDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';
  const [item, setItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [dict, setDict] = useState<any>({ kontrahenci: [], statusy: [], oferty: [] });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [offerName, setOfferName] = useState('');
  const [duplicateTarget, setDuplicateTarget] = useState<any>(null);

  async function loadDict() {
    const [k, s, o] = await Promise.all([
      api.get('/api/slowniki/kontrahenci').catch(() => ({ data: [] })),
      api.get('/api/slowniki/statusy-wynajmu').catch(() => ({ data: [] })),
      api.get('/api/oferty').catch(() => ({ data: [] })),
    ]);
    setDict({ kontrahenci: k.data || [], statusy: s.data || [], oferty: o.data || [] });
  }

  async function load() {
    if (isNew) return;
    setLoading(true);
    setError('');
    try {
      const r = await api.get(`/api/wynajmy/${params.id}`);
      const w = r.data;
      setItem(w);
      setOfferName(w.numer ? `Oferta do wynajmu ${w.numer}` : `Oferta do wynajmu #${w.id}`);
      setForm({
        numer: w.numer || '',
        id_kontrahenta: toSelect(w.id_kontrahenta),
        id_statusu_wynajmu: toSelect(w.id_statusu_wynajmu),
        id_oferty: toSelect(w.id_oferty),
        data_wydania: toDateInput(w.data_wydania),
        data_zwrotu_planowana: toDateInput(w.data_zwrotu_planowana),
        data_zwrotu_rzeczywista: toDateInput(w.data_zwrotu_rzeczywista),
        notatki_wewnetrzne: w.notatki_wewnetrzne || '',
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Nie udało się wczytać wynajmu.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDict(); load(); }, [params.id]);

  async function save(e?: any) {
    e?.preventDefault?.();
    setSaving(true);
    setError('');
    const payload = {
      numer: strOrNull(form.numer),
      id_kontrahenta: numOrNull(form.id_kontrahenta),
      id_statusu_wynajmu: numOrNull(form.id_statusu_wynajmu),
      id_oferty: numOrNull(form.id_oferty),
      data_wydania: strOrNull(form.data_wydania),
      data_zwrotu_planowana: strOrNull(form.data_zwrotu_planowana),
      data_zwrotu_rzeczywista: strOrNull(form.data_zwrotu_rzeczywista),
      notatki_wewnetrzne: strOrNull(form.notatki_wewnetrzne),
    };
    try {
      if (isNew) {
        const r = await api.post('/api/wynajmy', payload);
        router.push(`/dashboard/rentals/${r.data.id}`);
      } else {
        await api.put(`/api/wynajmy/${params.id}`, payload);
        await load();
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Nie udało się zapisać wynajmu.');
    } finally {
      setSaving(false);
    }
  }

  async function createOffer() {
    const r = await api.post('/api/oferty', {
      nazwa: offerName || `Oferta do wynajmu #${params.id}`,
      id_wynajmu: Number(params.id),
      id_kontrahenta: numOrNull(form.id_kontrahenta),
    });
    router.push(`/dashboard/offers/${r.data.id}`);
  }

  async function duplicateOffer(o: any) {
    setDuplicateTarget(o);
  }

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-cyan-600" /><span className="ml-3 font-bold text-slate-500">Ładowanie wynajmu...</span></div>;

  const offers = item?.oferty || [];
  const legacyOffer = item?.oferta && !offers.some((o: any) => o.id === item.oferta.id) ? [item.oferta] : [];
  const allOffers = [...legacyOffer, ...offers];

  return <div className="mx-auto max-w-[1600px] space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
        <button 
          onClick={() => router.back()} 
          title="Wraca do poprzednio odwiedzonej strony (Historia przeglądarki)"
          className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> Powrót
        </button>
        <span>/</span>
        <Link href="/dashboard/calendar" className="hover:text-cyan-700">Kalendarz</Link>
        <span>/</span>
        <span className="font-black text-slate-900">{isNew ? 'Nowe wypożyczenie' : form.numer || `Wynajem #${params.id}`}</span>
      </div>
      
      <div className="flex flex-wrap gap-2">

        {!isNew && (form.data_wydania || item?.data_wydania) && (
          <Button 
            variant="secondary" 
            onClick={() => {
              const targetDate = form.data_wydania || item?.data_wydania;
              router.push(`/dashboard/calendar?date=${targetDate.slice(0, 10)}`);
            }}
            title="Przenosi do kalendarza, ustawiając go od razu na dacie tego wypożyczenia"
          >
            <Calendar size={16} className="inline mr-1 text-cyan-600" /> Cofnij do daty w kalendarzu
          </Button>
        )}

        <Button onClick={save} disabled={saving}>
          <Save size={16} className="inline mr-1" /> {saving ? 'Zapisywanie...' : 'Zapisz'}
        </Button>
      </div>
    </div>

    {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}

    <div className="grid gap-5 xl:grid-cols-[1fr_.85fr]">
      <Card className="space-y-4">
        <div className="flex items-center gap-3"><div className="rounded-2xl bg-orange-100 p-3 text-orange-700"><Truck /></div><div><p className="text-[11px] font-black uppercase tracking-[0.25em] text-orange-600">Wynajem</p><h1 className="text-2xl font-black text-slate-900">{form.numer || `Wynajem #${params.id}`}</h1></div></div>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <Field label="Numer"><input className={inputClass} value={form.numer || ''} onChange={(e) => setForm({ ...form, numer: e.target.value })} /></Field>
          <Field label="Status"><select className={inputClass} value={form.id_statusu_wynajmu || ''} onChange={(e) => setForm({ ...form, id_statusu_wynajmu: e.target.value })}><option value="">Brak</option>{dict.statusy.map((s: any) => <option key={s.id} value={s.id}>{s.nazwa}</option>)}</select></Field>
          <Field label="Kontrahent"><select className={inputClass} value={form.id_kontrahenta || ''} onChange={(e) => setForm({ ...form, id_kontrahenta: e.target.value })}><option value="">Brak</option>{dict.kontrahenci.map((k: any) => <option key={k.id} value={k.id}>{k.nazwa}</option>)}</select></Field>
          <Field label="Data wydania"><input type="datetime-local" className={inputClass} value={form.data_wydania || ''} onChange={(e) => setForm({ ...form, data_wydania: e.target.value })} /></Field>
          <Field label="Zwrot planowany"><input type="datetime-local" className={inputClass} value={form.data_zwrotu_planowana || ''} onChange={(e) => setForm({ ...form, data_zwrotu_planowana: e.target.value })} /></Field>
          <Field label="Zwrot rzeczywisty"><input type="datetime-local" className={inputClass} value={form.data_zwrotu_rzeczywista || ''} onChange={(e) => setForm({ ...form, data_zwrotu_rzeczywista: e.target.value })} /></Field>
          <Field label="Oferta główna / zaakceptowana"><select className={inputClass} value={form.id_oferty || ''} onChange={(e) => setForm({ ...form, id_oferty: e.target.value })}><option value="">Brak</option>{allOffers.map((o: any) => <option key={o.id} value={o.id}>{o.numer || `#${o.id}`} · {o.nazwa}</option>)}</select><p className="mt-1 text-xs font-bold text-slate-400">Lista pokazuje wyłącznie oferty przypisane do tego wynajmu.</p></Field>
          <div className="md:col-span-2"><Field label="Notatki"><textarea className={`${inputClass} min-h-24`} value={form.notatki_wewnetrzne || ''} onChange={(e) => setForm({ ...form, notatki_wewnetrzne: e.target.value })} /></Field></div>
        </form>
      </Card>

      <Card className="space-y-4">
        <div><p className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-600">Oferty</p><h2 className="text-xl font-black text-slate-900">Oferty przypisane do wynajmu</h2><p className="text-sm font-bold text-slate-400">Do jednego wynajmu możesz mieć wiele ofert roboczych i jedną wskazać jako główną.</p></div>
        <div className="flex gap-2"><input className={inputClass} value={offerName} onChange={(e) => setOfferName(e.target.value)} /><Button onClick={createOffer}><Plus size={16} className="inline" /> Dodaj</Button></div>
        <div className="space-y-2">{allOffers.map((o: any) => <div key={o.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-slate-900">{o.numer || `Oferta #${o.id}`} · {o.nazwa}</p><p className="text-sm font-bold text-slate-400">{o.status?.nazwa || 'Bez statusu'}</p></div><p className="font-black text-cyan-700">{money(o.suma_netto)}</p></div><div className="mt-3 flex flex-wrap gap-2"><Link className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white" href={`/dashboard/offers/${o.id}`}>Otwórz</Link><Link className="rounded-xl border px-4 py-2 text-sm font-black" href={`/dashboard/offers/${o.id}/pdf`} target="_blank">PDF</Link><button className="rounded-xl border px-4 py-2 text-sm font-black" onClick={() => duplicateOffer(o)}><Copy size={14} className="inline" /> Duplikuj</button></div></div>)}{allOffers.length === 0 && <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">Brak ofert przypisanych do tego wynajmu.</p>}</div>
      </Card>
    </div>

    {duplicateTarget && <OfferDuplicateTargetModal offer={duplicateTarget} defaultRentalId={params.id as any} onClose={() => setDuplicateTarget(null)} onDone={(o) => router.push(`/dashboard/offers/${o.id}`)} />}

    <Card><h2 className="mb-3 text-xl font-black text-slate-900">Pozycje wynajmu</h2><div className="space-y-2">{(item?.pozycje || []).map((p: any) => <div key={p.id} className="rounded-2xl border border-slate-200 p-4"><p className="font-black text-slate-900">{p.model?.nazwa || `Model #${p.id_modelu}`}</p><p className="text-sm font-bold text-slate-400">Ilość: {String(p.ilosc || 1)} · Egzemplarz: {p.egzemplarz?.nazwa || '-'}</p></div>)}{!item?.pozycje?.length && <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">Brak pozycji wynajmu.</p>}</div></Card>
  </div>;
}