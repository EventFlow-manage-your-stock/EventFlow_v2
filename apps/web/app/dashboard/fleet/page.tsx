'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { api } from '../../../lib/api';
import { Button, Card, Field, inputClass, PageTitle } from '../../../components/ProductUI';
import { DataTable } from '../../../components/DataTable';
import { SimpleModal } from '../../../components/SimpleModal';

function d(v:any){return v?new Date(v).toLocaleDateString('pl-PL'):'-'}
function num(v:any){return v === '' || v == null ? null : Number(v)}
function payload(form:any){return {...form, przebieg_km:num(form.przebieg_km), rok_produkcji:num(form.rok_produkcji), ladownosc_kg:num(form.ladownosc_kg), objetosc_m3:num(form.objetosc_m3)}}

export default function FleetPage(){
  const router = useRouter();
  const [items,setItems]=useState<any[]>([]); const [show,setShow]=useState(false); const [form,setForm]=useState<any>({}); const [error,setError]=useState('');
  async function load(){const r=await api.get('/api/flota/pojazdy').catch(()=>({data:[]})); setItems(r.data||[])}
  useEffect(()=>{load()},[]);
  const calendar = useMemo(()=>items.flatMap((p:any)=>[
    p.data_przegladu ? {id:`p-${p.id}`, date:p.data_przegladu, title:`Przegląd: ${p.nazwa}`} : null,
    p.data_oc ? {id:`oc-${p.id}`, date:p.data_oc, title:`OC: ${p.nazwa}`} : null,
    ...(p.serwisy_pojazdu||[]).map((s:any)=>({id:`s-${s.id}`, date:s.data_serwisu, title:`Serwis: ${p.nazwa}`})),
    ...(p.przeglady_pojazdu||[]).map((x:any)=>({id:`hist-${x.id}`, date:x.data_przegladu, title:`Przegląd ${x.typ}: ${p.nazwa}`})),
  ].filter(Boolean)),[items]);
  async function save(e:any){e.preventDefault(); setError(''); try{await api.post('/api/flota/pojazdy',payload(form)); setShow(false); setForm({}); load();}catch(err:any){setError(err?.response?.data?.message || err.message || 'Nie udało się zapisać pojazdu.')}}
  async function updateRow(row:any){await api.put(`/api/flota/pojazdy/${row.id}`, payload(row)); await load();}
  return <div className="mx-auto max-w-[1650px] space-y-6"><PageTitle eyebrow="Flota" title="Pojazdy" description="Lista pojazdów z VIN, przebiegiem, przeglądami, OC i kalendarzem dostępności/informacji." action={<Button onClick={()=>setShow(true)}><Plus size={16} className="inline"/> Dodaj</Button>}/><div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]"><Card><DataTable rows={items} onRowClick={(r:any)=>router.push(`/dashboard/fleet/${r.id}`)} onSaveRow={updateRow} columns={[{key:'nazwa',label:'Nazwa',value:(r:any)=><b>{r.nazwa}</b>},{key:'nr_rejestracyjny',label:'Rejestracja'},{key:'vin',label:'VIN'},{key:'przebieg_km',label:'Przebieg',value:(r:any)=>r.przebieg_km?`${r.przebieg_km} km`:'-'},{key:'data_przegladu',label:'Przegląd',value:(r:any)=>d(r.data_przegladu),sortValue:(r:any)=>r.data_przegladu},{key:'data_oc',label:'OC',value:(r:any)=>d(r.data_oc),sortValue:(r:any)=>r.data_oc},{key:'ladownosc_kg',label:'Ładowność'}]}/></Card><Card><h2 className="mb-4 text-lg font-black">Kalendarz floty</h2><div className="space-y-3">{calendar.map((e:any)=><div key={e.id} className="rounded-2xl border border-cyan-100 bg-cyan-50 p-3"><b>{e.title}</b><p className="text-sm text-slate-500">{d(e.date)} · wpis informacyjny, nieedytowalny</p></div>)}{calendar.length===0&&<p className="font-bold text-slate-400">Brak dat przeglądów, OC i serwisów.</p>}</div></Card></div>{show&&<SimpleModal title="Dodaj pojazd" onClose={()=>setShow(false)}>{error&&<div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div>}<form onSubmit={save} className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Field label="Nazwa"><input className={inputClass} required value={form.nazwa||''} onChange={e=>setForm({...form,nazwa:e.target.value})}/></Field><Field label="Nr rejestracyjny"><input className={inputClass} required value={form.nr_rejestracyjny||''} onChange={e=>setForm({...form,nr_rejestracyjny:e.target.value})}/></Field><Field label="VIN"><input className={inputClass} value={form.vin||''} onChange={e=>setForm({...form,vin:e.target.value})}/></Field><Field label="Przebieg km"><input type="number" className={inputClass} value={form.przebieg_km||''} onChange={e=>setForm({...form,przebieg_km:e.target.value})}/></Field><Field label="Marka"><input className={inputClass} value={form.marka||''} onChange={e=>setForm({...form,marka:e.target.value})}/></Field><Field label="Model"><input className={inputClass} value={form.model||''} onChange={e=>setForm({...form,model:e.target.value})}/></Field><Field label="Data przeglądu"><input type="date" className={inputClass} value={form.data_przegladu||''} onChange={e=>setForm({...form,data_przegladu:e.target.value})}/></Field><Field label="Data OC"><input type="date" className={inputClass} value={form.data_oc||''} onChange={e=>setForm({...form,data_oc:e.target.value})}/></Field><Field label="Ładowność kg"><input type="number" step="0.01" className={inputClass} value={form.ladownosc_kg||''} onChange={e=>setForm({...form,ladownosc_kg:e.target.value})}/></Field><Field label="Objętość m3"><input type="number" step="0.01" className={inputClass} value={form.objetosc_m3||''} onChange={e=>setForm({...form,objetosc_m3:e.target.value})}/></Field></div><Field label="Notatki"><textarea className={inputClass} value={form.notatki||''} onChange={e=>setForm({...form,notatki:e.target.value})}/></Field><div className="flex justify-end gap-2"><Button variant="secondary" onClick={()=>setShow(false)}>Anuluj</Button><Button type="submit">Zapisz</Button></div></form></SimpleModal>}</div>
}
