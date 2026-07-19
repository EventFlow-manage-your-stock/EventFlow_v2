'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Shield, Key, Loader2, Trash2 } from 'lucide-react';
import { api } from '../../../../lib/api';
import { Button, Card, Field, inputClass, PageTitle } from '../../../../components/ProductUI';

export default function UserEditorPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const router = useRouter();
  
  const [form, setForm] = useState<any>({ roleIds: [] });
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    Promise.all([
      !isNew ? api.get(`/api/uzytkownicy/${id}`) : Promise.resolve({ data: { roleIds: [] } }),
      api.get('/api/ustawienia/role') // Używamy istniejącego endpointu pobierającego słownik ról
    ]).then(([u, r]) => {
      if (!isNew) {
        setForm({
          ...u.data,
          roleIds: u.data.role?.map((x: any) => String(x.id_roli)) || []
        });
      }
      setRoles(r.data || []);
      setLoading(false);
    }).catch((e) => {
      setError('Błąd wczytywania danych użytkownika.');
      setLoading(false);
    });
  }, [id, isNew]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (isNew) {
        const res = await api.post('/api/uzytkownicy', form);
        router.push(`/dashboard/users/${res.data.id}`);
      } else {
        await api.put(`/api/uzytkownicy/${id}`, form);
        setNotice('Zapisano dane pracownika.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Nie udało się zapisać.');
    } finally {
      setSaving(false);
    }
  }

  async function forcePasswordReset() {
    if (isNew) return;
    try {
      await api.post('/auth/forgot-password', { email: form.email });
      setNotice('Wysłano na adres email link do zresetowania/ustawienia hasła dla tego użytkownika.');
    } catch(e) {
      setError('Nie udało się wysłać linku resetującego.');
    }
  }

  async function remove() {
    if(!confirm('Zablokować i usunąć dostęp tego pracownika?')) return;
    await api.delete(`/api/uzytkownicy/${id}`);
    router.push('/dashboard/users');
  }

  const toggleRole = (roleId: string) => {
    setForm((prev: any) => {
      const current = prev.roleIds || [];
      if (current.includes(roleId)) return { ...prev, roleIds: current.filter((r: string) => r !== roleId) };
      return { ...prev, roleIds: [...current, roleId] };
    });
  };

  if (loading) return <div className="flex h-[50vh] justify-center items-center"><Loader2 className="animate-spin text-cyan-600 w-8 h-8"/></div>;

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-20">
      <PageTitle 
        eyebrow="Użytkownicy" 
        title={isNew ? 'Nowy pracownik' : `${form.imie} ${form.nazwisko}`} 
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => router.back()}><ArrowLeft size={16} className="inline mr-1" /> Powrót</Button>
            {!isNew && <Button variant="danger" onClick={remove}><Trash2 size={16} className="inline mr-1"/> Usuń dostęp</Button>}
            <Button onClick={submit} disabled={saving}><Save size={16} className="inline mr-1" /> {saving ? 'Zapisywanie...' : 'Zapisz pracownika'}</Button>
          </div>
        }
      />

      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-700">{error}</div>}
      {notice && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">{notice}</div>}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <Card>
            <h2 className="text-xl font-black mb-5 text-slate-900">Profil i kontakt</h2>
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Imię"><input className={inputClass} value={form.imie || ''} onChange={e => setForm({...form, imie: e.target.value})} required /></Field>
              <Field label="Nazwisko"><input className={inputClass} value={form.nazwisko || ''} onChange={e => setForm({...form, nazwisko: e.target.value})} required /></Field>
              <Field label="E-mail (Login)"><input type="email" className={inputClass} value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} required /></Field>
              <Field label="Telefon"><input className={inputClass} value={form.telefon || ''} onChange={e => setForm({...form, telefon: e.target.value})} /></Field>
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black mb-5 text-slate-900">Zasoby ludzkie (HR)</h2>
            <div className="grid gap-5">
              <Field label="Stanowisko (tytuł)"><input className={inputClass} value={form.stanowisko || ''} onChange={e => setForm({...form, stanowisko: e.target.value})} placeholder="np. Główny realizator dźwięku, Magazynier" /></Field>
              <Field label="Skille / Umiejętności (oddzielone przecinkiem)">
                <textarea rows={3} className={inputClass} value={form.umiejetnosci || ''} onChange={e => setForm({...form, umiejetnosci: e.target.value})} placeholder="np. Prawo jazdy kat. B, Wózki widłowe, Konfiguracja sieci DANTE..." />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Shield size={24}/></div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Role i Uprawnienia</h2>
                <p className="text-sm font-bold text-slate-400">Podstawa przyszłego modułu ACL</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {roles.map(r => {
                const isActive = (form.roleIds || []).includes(String(r.id));
                return (
                  <label key={r.id} className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${isActive ? 'border-indigo-400 bg-indigo-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <div>
                      <p className={`font-black ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>{r.nazwa}</p>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">{r.opis || 'Brak opisu roli'}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isActive ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                      {isActive && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                    </div>
                    <input type="checkbox" className="hidden" checked={isActive} onChange={() => toggleRole(String(r.id))} />
                  </label>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Key size={24}/></div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Bezpieczeństwo</h2>
                <p className="text-sm font-bold text-slate-400">Dostęp i hasła</p>
              </div>
            </div>

            {isNew ? (
              <div className="space-y-4">
                <Field label="Tymczasowe hasło (opcjonalnie)">
                  <input type="text" className={inputClass} value={form.haslo || ''} onChange={e => setForm({...form, haslo: e.target.value})} placeholder="Zostaw puste, system wygeneruje EventFlow123!" />
                </Field>
                <p className="text-xs font-bold text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  Po utworzeniu pracownika będziesz mógł wysłać mu link e-mail z systemem resetowania hasła, aby ustawił własne.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-600 leading-relaxed">
                  Zamiast ręcznie zmieniać hasło pracownikowi, wyślij mu link przypominający na adres przypisany do profilu ({form.email}).
                </p>
                <button type="button" onClick={forcePasswordReset} className="w-full py-3 rounded-xl border-2 border-slate-900 text-slate-900 font-black text-sm hover:bg-slate-900 hover:text-white transition-colors">
                  Wyślij prośbę o zmianę hasła (E-mail)
                </button>

                <div className="mt-6 pt-4 border-t border-slate-100">
                  <Field label="Albo wpisz nowe hasło ręcznie (wymusi natychmiastową zmianę)">
                    <input type="password" placeholder="••••••••" className={inputClass} value={form.haslo || ''} onChange={e => setForm({...form, haslo: e.target.value})} />
                  </Field>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}