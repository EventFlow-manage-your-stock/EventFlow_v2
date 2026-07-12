'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Barcode from 'react-barcode';
import QRCode from 'react-qr-code';
import { api } from '../../../../lib/api';

function labelTitle(item: any) {
  const model = item.model?.nazwa || item.model_nazwa || '';
  const name = item.nazwa || model || `Egzemplarz #${item.id}`;
  const nr = item.numer_egzemplarza || item.numer_urzadzenia;
  return nr ? `${name} (${nr})` : name;
}
function labelCode(item: any, type: string) {
  return type === 'qr'
    ? item.zewnetrzny_qr_kod || item.qr_kod || item.zewnetrzny_kod_kreskowy || item.kod_kreskowy || `EF-${item.id}`
    : item.zewnetrzny_kod_kreskowy || item.kod_kreskowy || item.zewnetrzny_qr_kod || item.qr_kod || `EF-${item.id}`;
}

export default function LabelsPage() {
  const params = useSearchParams();
  const type = params.get('type') || 'qr';
  const ids = (params.get('ids') || '').split(',').filter(Boolean).map(Number);
  const modelId = params.get('modelId');
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => { api.get('/api/magazyn/wszystkie-egzemplarze').then(r => setItems(r.data || [])).catch(() => setItems([])); }, []);
  const data = useMemo(() => items.filter((i: any) => ids.length ? ids.includes(i.id) : modelId ? String(i.id_modelu) === String(modelId) : true), [items, ids.join(','), modelId]);

  return (
    <div className="min-h-screen bg-white text-black">
      <style>{`
        @page { size: A4; margin: 8mm; }
        @media print { .no-print{display:none!important} body{background:white} .label{break-inside:avoid; page-break-inside:avoid} }
      `}</style>
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b bg-white p-4 shadow-sm">
        <h1 className="text-xl font-black">Etykiety EventFlow - {type === 'qr' ? 'QR' : 'kody kreskowe'}</h1>
        <button onClick={() => window.print()} className="rounded-lg bg-cyan-600 px-4 py-2 font-bold text-white">Drukuj / zapisz jako PDF</button>
      </div>
      <div className="mx-auto w-[190mm]">
        {data.map((item: any) => {
          const code = labelCode(item, type);
          return (
            <section key={item.id} className="label flex min-h-[42mm] flex-col items-center justify-center border-b border-slate-300 py-6 text-center">
              <h2 className="mb-4 text-[20px] font-black uppercase tracking-wide">{labelTitle(item)}</h2>
              {type === 'qr' ? <QRCode value={code} size={120} /> : <Barcode value={code} width={1.9} height={82} fontSize={12} margin={0} />}
              <p className="mt-1 text-[10px] font-black tracking-wider">{code}</p>
            </section>
          );
        })}
        {data.length === 0 && <p className="p-12 text-center font-bold text-slate-400">Brak egzemplarzy do wygenerowania etykiet.</p>}
      </div>
    </div>
  );
}
