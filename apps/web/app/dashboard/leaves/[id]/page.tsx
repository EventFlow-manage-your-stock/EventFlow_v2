'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { api } from '../../../../lib/api';
import { Button, Card, Field, inputClass } from '../../../../components/ProductUI';

function dateInput(v: any) { return v ? String(v).slice(0, 10) : ''; }

export default function LeaveDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([
        api.get('/api/slowniki/uzytkownicy').catch(() => ({ data: [] })),
        api.get(`/api/urlopy/${params.id}`),
      ]);
      setUsers(u.data || []);
      setForm({
        id_uzytkownika: String(r.data.id_uzytkownika || ''),
        typ: r.data.typ || 'urlop',
        data_od: dateInput(r.data.data_od),
        data_do: dateInput(r.data.data_do),
        opis: r.data.opis || '',
      });
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Nie udało się wczytać nieobecności.');
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [params.id]);

  async function save(e?: any) {
    e?.preventDefault?.();
    setSaving(true); setError('');
    try {
      await api.put(`/api/urlopy/${params.id}`, form);
      await load();
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Nie udało się zapisać nieobecności.');
    } finally { setSaving(false); }
  }

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-cyan-600" /></div>;
  return <div className="mx-auto max-w-4xl space-y-5">
    <div className="flex items-center justify-between gap-3"><button onClick={() => router.back()} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50"><ArrowLeft size={16} /> Powrót</button><div className="flex gap-2"><Button variant="secondary" onClick={() => router.back()}><ArrowLeft size={16} className="inline" /> Powrót</Button><Button onClick={save} disabled={saving}><Save size={16} className="inline" /> {saving ? 'Zapisywanie...' : 'Zapisz'}</Button></div></div>
    {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
    <Card><form onSubmit={save} className="grid gap-4 md:grid-cols-2"><Field label="Osoba"><select className={inputClass} value={form.id_uzytkownika || ''} onChange={(e) => setForm({ ...form, id_uzytkownika: e.target.value })}>{users.map((u) => <option key={u.id} value={u.id}>{u.imie} {u.nazwisko}</option>)}</select></Field><Field label="Typ"><input className={inputClass} value={form.typ || ''} onChange={(e) => setForm({ ...form, typ: e.target.value })} /></Field><Field label="Od"><input type="date" className={inputClass} value={form.data_od || ''} onChange={(e) => setForm({ ...form, data_od: e.target.value })} /></Field><Field label="Do"><input type="date" className={inputClass} value={form.data_do || ''} onChange={(e) => setForm({ ...form, data_do: e.target.value })} /></Field><div className="md:col-span-2"><Field label="Opis"><textarea className={`${inputClass} min-h-24`} value={form.opis || ''} onChange={(e) => setForm({ ...form, opis: e.target.value })} /></Field></div></form></Card>
  </div>;
}
