'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { api } from '../../../../lib/api';
import { Button, Card, Field, inputClass, PageTitle } from '../../../../components/ProductUI';
import { DataTable } from '../../../../components/DataTable';
import { SimpleModal } from '../../../../components/SimpleModal';

export default function ContactsPage(){
  const router = useRouter();
  const [items,setItems]=useState<any[]>([]); const [kontrahenci,setKontrahenci]=useState<any[]>([]); const [show,setShow]=useState(false); const [form,setForm]=useState<any>({});
  async function load(){const [c,k]=await Promise.all([api.get('/api/crm/kontakty').catch(()=>({data:[]})),api.get('/api/crm/kontrahenci').catch(()=>({data:[]}))]); setItems(c.data||[]); setKontrahenci(k.data||[])}
  useEffect(()=>{load()},[]);
  async function save(e:any){e.preventDefault(); await api.post('/api/crm/kontakty',form); setShow(false); setForm({}); load();}
  return <div className="mx-auto max-w-[1650px] space-y-6"><PageTitle eyebrow="Kontrahenci" title="Kontakty" description="Osoby kontaktowe przypisane do kontrahentów." action={<Button onClick={()=>setShow(true)}><Plus size={16} className="inline"/> Dodaj</Button>}/><Card><DataTable rows={items} onRowClick={(r:any)=>router.push(`/dashboard/crm/contacts/${r.id}`)} columns={[{key:'imie',label:'Imię i nazwisko',value:(r:any)=><b>{[r.imie,r.nazwisko].filter(Boolean).join(' ')||r.nazwa||'-'}</b>},{key:'kontrahent',label:'Kontrahent',value:(r:any)=>r.kontrahent?.nazwa||'-'},{key:'email',label:'E-mail'},{key:'telefon',label:'Telefon'},{key:'stanowisko',label:'Stanowisko'}]}/></Card>{show&&<SimpleModal title="Dodaj kontakt" onClose={()=>setShow(false)}><form onSubmit={save} className="space-y-4"><div className="grid gap-4 md:grid-cols-2"><Field label="Kontrahent"><select className={inputClass} value={form.id_kontrahenta||''} onChange={e=>setForm({...form,id_kontrahenta:e.target.value})}><option value="">Wybierz</option>{kontrahenci.map((k:any)=><option key={k.id} value={k.id}>{k.nazwa}</option>)}</select></Field><Field label="Stanowisko"><input className={inputClass} value={form.stanowisko||''} onChange={e=>setForm({...form,stanowisko:e.target.value})}/></Field><Field label="Imię"><input className={inputClass} value={form.imie||''} onChange={e=>setForm({...form,imie:e.target.value})}/></Field><Field label="Nazwisko"><input className={inputClass} value={form.nazwisko||''} onChange={e=>setForm({...form,nazwisko:e.target.value})}/></Field><Field label="E-mail"><input className={inputClass} value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></Field><Field label="Telefon"><input className={inputClass} value={form.telefon||''} onChange={e=>setForm({...form,telefon:e.target.value})}/></Field></div><div className="flex justify-end gap-2"><Button variant="secondary" onClick={()=>setShow(false)}>Anuluj</Button><Button type="submit">Zapisz</Button></div></form></SimpleModal>}</div>
}
