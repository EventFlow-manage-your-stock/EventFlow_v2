'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { api } from '../../../lib/api';
import { Button, Card, Field, inputClass, PageTitle } from '../../../components/ProductUI';
import { DataTable } from '../../../components/DataTable';
import { SimpleModal } from '../../../components/SimpleModal';

export default function CrmPage(){
  const router = useRouter();
  const [items,setItems]=useState<any[]>([]);
  const [show,setShow]=useState(false);
  const [form,setForm]=useState<any>({});
  const [loading,setLoading]=useState(true); const [gusLoading,setGusLoading]=useState(false);
  async function load(){setLoading(true); try{const r=await api.get('/api/crm/kontrahenci'); setItems(r.data||[])} finally{setLoading(false)}}
  useEffect(()=>{load()},[]);
  async function fetchGus(){ if(!form.nip) return alert('Wpisz NIP.'); setGusLoading(true); try { const r=await api.get(`/api/gus/${form.nip}`); setForm({...form,...r.data, adres:r.data.adres || r.data.ulica}); } catch(e:any) { alert(e?.response?.data?.message || e?.message || 'Nie udało się pobrać danych z GUS/MF.'); } finally { setGusLoading(false); } }
  async function save(e:any){e.preventDefault(); await api.post('/api/crm/kontrahenci',form); setShow(false); setForm({}); load();}
  return <div className="mx-auto max-w-[1650px] space-y-6"><PageTitle eyebrow="Kontrahenci" title="Lista kontrahentów" description="Lista z wyszukiwaniem, sortowaniem i dodawaniem po kliknięciu Dodaj." action={<Button onClick={()=>setShow(true)}><Plus size={16} className="inline"/> Dodaj</Button>}/><Card>{loading?<p className="p-8 text-center font-bold text-slate-400">Ładowanie...</p>:<DataTable rows={items} onRowClick={(r:any)=>router.push(`/dashboard/crm/${r.id}`)} columns={[{key:'nazwa',label:'Nazwa',value:(r:any)=><b>{r.nazwa}</b>},{key:'nip',label:'NIP'},{key:'regon',label:'REGON'},{key:'email',label:'E-mail'},{key:'telefon',label:'Telefon'},{key:'miasto',label:'Miasto'}]}/>}</Card>{show&&<SimpleModal title="Dodaj kontrahenta" onClose={()=>setShow(false)}><form onSubmit={save} className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Field label="NIP"><div className="flex gap-2"><input className={inputClass} value={form.nip||''} onChange={e=>setForm({...form,nip:e.target.value})}/><Button variant="secondary" onClick={fetchGus} disabled={gusLoading}>{gusLoading ? 'Pobieram...' : 'GUS'}</Button></div></Field><Field label="Nazwa"><input className={inputClass} required value={form.nazwa||''} onChange={e=>setForm({...form,nazwa:e.target.value})}/></Field><Field label="REGON"><input className={inputClass} value={form.regon||''} onChange={e=>setForm({...form,regon:e.target.value})}/></Field><Field label="KRS"><input className={inputClass} value={form.krs||''} onChange={e=>setForm({...form,krs:e.target.value})}/></Field><Field label="E-mail"><input className={inputClass} value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></Field><Field label="Telefon"><input className={inputClass} value={form.telefon||''} onChange={e=>setForm({...form,telefon:e.target.value})}/></Field><Field label="Adres"><input className={inputClass} value={form.ulica||form.adres||''} onChange={e=>setForm({...form,ulica:e.target.value,adres:e.target.value})}/></Field><Field label="Miasto"><input className={inputClass} value={form.miasto||''} onChange={e=>setForm({...form,miasto:e.target.value})}/></Field></div><Field label="Uwagi"><textarea className={inputClass} value={form.uwagi||''} onChange={e=>setForm({...form,uwagi:e.target.value})}/></Field><div className="flex justify-end gap-2"><Button variant="secondary" onClick={()=>setShow(false)}>Anuluj</Button><Button type="submit">Zapisz</Button></div></form></SimpleModal>}</div>
}
