'use client';

export const defaultTabs = [
  { id: 'dane', key: 'dane', label: 'Dane' },
  { id: 'notatki', key: 'notatki', label: 'Notatki' },
  { id: 'historia', key: 'historia', label: 'Historia' },
];



import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, History, Loader2, Save, Trash2, FileText, Box } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Card, Field, inputClass } from './ProductUI';

export type EntityField = {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'checkbox' | 'color' | 'select';
  readonly?: boolean;
  options?: any[];
  optionLabel?: (row: any) => string;
  optionValue?: (row: any) => string | number;
  placeholder?: string;
  colSpan?: 'full';
};

export type EntityEditorConfig = {
  moduleLabel: string;
  title: string;
  listHref: string;
  getEndpoint: (id: string) => string;
  updateEndpoint: (id: string) => string;
  createEndpoint?: string; // Dodano obsługę tworzenia
  deleteEndpoint?: (id: string) => string;
  fields: EntityField[];
  tabs?: { id: string; label: string; icon?: any; render?: (record: any) => any }[];
  dictionaries?: Record<string, string>;
  afterSave?: (record: any) => void;
  normalizePayload?: (form: any) => any;
  titleFromRecord?: (record: any) => string;
  subtitleFromRecord?: (record: any) => string;
};

function toInputValue(value: any, type?: EntityField['type']) {
  if (value === null || value === undefined) return '';
  if (type === 'date') return String(value).slice(0, 10);
  if (type === 'datetime') {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return String(value).slice(0, 16);
  }
  return value;
}

function formatValue(value: any) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Tak' : 'Nie';
  if (typeof value === 'object') {
    if (value.nazwa) return value.nazwa;
    if (value.numer) return value.numer;
    if (value.imie || value.nazwisko) return `${value.imie || ''} ${value.nazwisko || ''}`.trim();
    return JSON.stringify(value);
  }
  return String(value);
}

function cleanPayload(form: any, fields: EntityField[]) {
  const payload: any = {};
  for (const field of fields) {
    if (field.readonly) continue;
    const raw = form[field.key];
    if (field.type === 'number') payload[field.key] = raw === '' || raw === null || raw === undefined ? null : Number(raw);
    else if (field.type === 'checkbox') payload[field.key] = !!raw;
    else payload[field.key] = raw === '' ? null : raw;
  }
  return payload;
}

function initials(record: any) {
  const source = record?.nazwa || record?.tytul || record?.numer || record?.email || 'EF';
  return String(source).split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase();
}

const DEFAULT_TABS = [
  { id: 'szczegoly', label: 'Szczegóły', icon: FileText },
  { id: 'powiazania', label: 'Powiązania', icon: Box },
  { id: 'historia', label: 'Historia', icon: History },
];

export function EntityEditorPage({ config }: { config: EntityEditorConfig }) {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const isNew = id === 'new'; // Zabezpieczenie przed pobieraniem "new"

  const [record, setRecord] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [dict, setDict] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('szczegoly');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const dictEntries = Object.entries(config.dictionaries || {});
      const promises: Promise<any>[] = [];
      
      // Jeśli to nowy rekord, nie pobieramy z bazy - przekazujemy puste dane
      if (!isNew) promises.push(api.get(config.getEndpoint(id)));
      else promises.push(Promise.resolve({ data: {} }));

      dictEntries.forEach(([, endpoint]) => promises.push(api.get(endpoint).catch(() => ({ data: [] }))));

      const [main, ...dictionaryResponses] = await Promise.all(promises);

      const rec = isNew ? null : main.data;
      setRecord(rec);

      const nextForm: any = {};
      for (const field of config.fields) {
        nextForm[field.key] = isNew ? '' : toInputValue(rec?.[field.key], field.type);
      }
      setForm(nextForm);
      setDict(Object.fromEntries(dictEntries.map(([key], index) => [key, dictionaryResponses[index]?.data || []])));
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Nie udało się wczytać rekordu.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const fields = useMemo(() => config.fields.map((field) => {
    if (field.options) return field;
    const options = dict[field.key];
    return options ? { ...field, options } : field;
  }), [config.fields, dict]);

  async function submit(e?: any) {
    e?.preventDefault?.();
    setSaving(true);
    setError('');
    try {
      const payload = config.normalizePayload ? config.normalizePayload(form) : cleanPayload(form, fields);
      
      let res;
      if (isNew && config.createEndpoint) {
        res = await api.post(config.createEndpoint, payload);
        router.push(config.listHref); // Po utworzeniu wracamy do listy
        return;
      } else {
        res = await api.put(config.updateEndpoint(id), payload);
      }
      
      setRecord(res.data || { ...record, ...payload });
      config.afterSave?.(res.data);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Nie udało się zapisać zmian.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!config.deleteEndpoint) return;
    if (!confirm('Na pewno usunąć ten rekord?')) return;
    await api.delete(config.deleteEndpoint(id));
    router.push(config.listHref);
  }

  const tabs = config.tabs?.length ? config.tabs : DEFAULT_TABS;
  const title = isNew ? `Nowy rekord: ${config.moduleLabel}` : (record ? (config.titleFromRecord?.(record) || record.nazwa || record.tytul || record.numer || `#${record.id}`) : config.title);
  const subtitle = isNew ? 'Wypełnij poniższe pola' : (record ? (config.subtitleFromRecord?.(record) || `ID ${record.id}`) : '');

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="animate-spin text-cyan-600" /> <span className="ml-3 font-bold text-slate-500">Ładowanie modułu edycji...</span></div>;

  return (
    <div className="mx-auto max-w-[1800px] space-y-5 animate-fade-in-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
          <button onClick={() => router.push(config.listHref)} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 hover:bg-slate-50"><ArrowLeft size={16} /> Powrót</button>
          <span>/</span>
          <Link href={config.listHref} className="hover:text-cyan-700">{config.moduleLabel}</Link>
          <span>/</span>
          <span className="font-black text-slate-900">{title}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => router.push(config.listHref)}><ArrowLeft size={16} className="inline" /> Powrót</Button>
          {!isNew && config.deleteEndpoint && <Button variant="danger" onClick={remove}><Trash2 size={16} className="inline" /> Usuń</Button>}
          <Button onClick={submit} disabled={saving}><Save size={16} className="inline" /> {saving ? 'Zapisywanie...' : 'Zapisz'}</Button>
        </div>
      </div>
      
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
      
      {!isNew && (
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Numer / ID" value={record?.numer || `#${record?.id}`} />
          <Metric label="Status" value={formatValue(record?.status || record?.status_serwisowy || record?.aktywny)} />
          <Metric label="Utworzono" value={record?.data_utworzenia ? new Date(record.data_utworzenia).toLocaleString('pl-PL') : '-'} />
          <Metric label="Zmieniono" value={record?.data_aktualizacji ? new Date(record.data_aktualizacji).toLocaleString('pl-PL') : '-'} />
        </div>
      )}

      <form onSubmit={submit} className={`grid gap-5 ${isNew ? 'xl:grid-cols-1' : 'xl:grid-cols-[1.25fr_.75fr]'}`}>
        <Card className="space-y-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-600">{isNew ? 'Dodawanie' : 'Moduł edycji'}</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">{title}</h1>
            {subtitle && <p className="mt-1 text-sm font-bold text-slate-400">{subtitle}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => {
              const value = form[field.key] ?? '';
              const disabled = field.readonly;
              return (
                <div key={field.key} className={field.colSpan === 'full' || field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <Field label={field.label}>
                    {field.type === 'textarea' ? (
                      <textarea className={`${inputClass} min-h-28`} disabled={disabled} placeholder={field.placeholder} value={value} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} />
                    ) : field.type === 'select' ? (
                      <select className={inputClass} disabled={disabled} value={value} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}>
                        <option value="">Brak / wybierz</option>
                        {(field.options || []).map((option: any) => <option key={field.optionValue ? field.optionValue(option) : option.id} value={field.optionValue ? field.optionValue(option) : option.id}>{field.optionLabel ? field.optionLabel(option) : option.nazwa || option.numer || option.email || `#${option.id}`}</option>)}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <label className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-black"><input type="checkbox" disabled={disabled} checked={!!value} onChange={(e) => setForm({ ...form, [field.key]: e.target.checked })} /> Tak</label>
                    ) : (
                      <input type={field.type === 'datetime' ? 'datetime-local' : field.type || 'text'} className={inputClass} disabled={disabled} placeholder={field.placeholder} value={value} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} />
                    )}
                  </Field>
                </div>
              );
            })}
          </div>
          {isNew && (
            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={saving}><Save size={16} className="inline" /> {saving ? 'Tworzenie...' : 'Utwórz rekord'}</Button>
            </div>
          )}
        </Card>
        
        {!isNew && (
          <Card className="space-y-4 h-max">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-100 text-lg font-black text-cyan-700">{initials(record)}</div>
              <div>
                <p className="font-black text-slate-900">{title}</p>
                <p className="text-sm font-bold text-slate-400">{config.moduleLabel}</p>
              </div>
            </div>
            <div className="grid gap-3">
              <Info label="ID rekordu" value={`#${record?.id}`} />
              <Info label="Aktywny" value={record?.aktywny === false ? 'Nie' : 'Tak'} />
            </div>
          </Card>
        )}
      </form>
      
      {!isNew && (
        <Card className="!p-0">
          <div className="flex overflow-x-auto border-b border-slate-100">
            {tabs.map((tab) => {
              const Icon = tab.icon || FileText;
              const active = activeTab === tab.id;
              return <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex min-w-[120px] flex-col items-center justify-center gap-1.5 border-b-2 px-4 py-3 text-sm font-black transition ${active ? 'border-cyan-600 bg-cyan-50/50 text-cyan-700' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}><Icon size={18} />{tab.label}</button>;
            })}
          </div>
          <div className="p-5">
            {tabs.find((t) => t.id === activeTab)?.render ? tabs.find((t) => t.id === activeTab)?.render?.(record) : <DefaultTab id={activeTab} record={record} />}
          </div>
        </Card>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 truncate text-lg font-black text-slate-900">{formatValue(value)}</p></div>;
}
function Info({ label, value }: { label: string; value: any }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3"><p className="text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-slate-800">{formatValue(value)}</p></div>;
}
function DefaultTab({ id, record }: { id: string; record: any }) {
  if (id === 'historia') return <p className="font-bold text-slate-500">Historia zmian będzie rozwijana w kolejnym kroku. Rekord: #{record?.id}</p>;
  if (id === 'powiazania') return <pre className="max-h-[420px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs font-semibold text-slate-100">{JSON.stringify(record, null, 2)}</pre>;
  return <p className="font-bold text-slate-500">Edytuj dane w formularzu powyżej i zapisz zmiany górnym przyciskiem.</p>;
}