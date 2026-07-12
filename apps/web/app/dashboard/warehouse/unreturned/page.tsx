'use client';
import { useEffect, useState } from 'react';
import { api } from '../../../../lib/api';
import { PageTitle, Card } from '../../../../components/ProductUI';
export default function UnreturnedPage(){const [items,setItems]=useState<any[]>([]); useEffect(()=>{api.get('/api/wynajmy').then(r=>setItems(r.data.filter((w:any)=>!w.data_zwrotu_rzeczywista))).catch(console.error)},[]); return <div><PageTitle eyebrow="Magazyn" title="Niezwrócony sprzęt" description="Lista wynajmów bez rzeczywistej daty zwrotu."/><Card>{items.map((w:any)=><div key={w.id} className="border-b p-3"><b>{w.numer||`Wynajem #${w.id}`}</b><p className="text-sm text-slate-500">{w.kontrahent?.nazwa||'-'} · planowany zwrot: {w.data_zwrotu_planowana?new Date(w.data_zwrotu_planowana).toLocaleString('pl-PL'):'-'}</p></div>)}</Card></div>}
