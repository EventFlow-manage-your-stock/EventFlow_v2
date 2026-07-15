'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { api } from '../../../../lib/api';
import { Card, Field, inputClass, PageTitle } from '../../../../components/ProductUI';
import { DataTable } from '../../../../components/DataTable';

// Funkcja pomocnicza do czytelnego formatowania dat
function formatDate(dateString: any) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('pl-PL', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

export default function UnreturnedPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stan nałożonych filtrów
  const [filters, setFilters] = useState({
    search: '',
    kontrahent: '',
    od: '',
    do: ''
  });

  async function load() {
    setLoading(true);
    try {
      const [rentalsRes, clientsRes] = await Promise.all([
        api.get('/api/wynajmy').catch(() => ({ data: [] })),
        api.get('/api/slowniki/kontrahenci').catch(() => ({ data: [] }))
      ]);
      
      // Zachowujemy pierwotną logikę – pokazujemy tylko wynajmy bez rzeczywistej daty zwrotu
      setItems((rentalsRes.data || []).filter((w: any) => !w.data_zwrotu_rzeczywista));
      setClients(clientsRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filteredItems = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    
    return items.filter((w: any) => {
      // Filtr Kontrahenta
      if (filters.kontrahent && String(w.id_kontrahenta || w.kontrahent?.id) !== filters.kontrahent) {
        return false;
      }

      // Filtr dat od-do na podstawie planowanego zwrotu
      const planDate = w.data_zwrotu_planowana?.slice?.(0, 10);
      if (filters.od && planDate && planDate < filters.od) return false;
      if (filters.do && planDate && planDate > filters.do) return false;

      // Wyszukiwarka tekstowa (Numer wynajmu lub nazwa klienta)
      if (query) {
        const haystack = `${w.numer || ''} ${w.kontrahent?.nazwa || ''}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      return true;
    });
  }, [items, filters]);

  return (
    <div className="mx-auto max-w-[1650px] space-y-6 animate-fade-in-up">
      <PageTitle
        eyebrow="Magazyn"
        title="Niezwrócony sprzęt"
        description="Lista wynajmów bez odnotowanej rzeczywistej daty zwrotu. Filtruj według kontrahenta, wyszukuj po numerze i kontroluj opóźnienia."
      />

      <Card className="!p-4 border-slate-200 shadow-sm">
        {/* Panel filtrów */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Field label="Wyszukaj">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  className={`${inputClass} pl-9`}
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Szukaj po numerze wynajmu lub nazwie klienta..."
                />
              </div>
            </Field>
          </div>

          <Field label="Kontrahent">
            <select
              className={inputClass}
              value={filters.kontrahent}
              onChange={(e) => setFilters({ ...filters, kontrahent: e.target.value })}
            >
              <option value="">Wszyscy</option>
              {clients.map((k: any) => (
                <option key={k.id} value={k.id}>{k.nazwa}</option>
              ))}
            </select>
          </Field>

          <Field label="Planowany zwrot (Od)">
            <input
              type="date"
              className={inputClass}
              value={filters.od}
              onChange={(e) => setFilters({ ...filters, od: e.target.value })}
            />
          </Field>

          <Field label="Planowany zwrot (Do)">
            <input
              type="date"
              className={inputClass}
              value={filters.do}
              onChange={(e) => setFilters({ ...filters, do: e.target.value })}
            />
          </Field>
        </div>

        {/* Tabela wyników */}
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
          </div>
        ) : (
          <DataTable
            rows={filteredItems}
            onRowClick={(r: any) => router.push(`/dashboard/rentals/${r.id}`)}
            columns={[
              {
                key: 'numer',
                label: 'Numer wynajmu',
                value: (r: any) => <b className="text-cyan-700">{r.numer || `#${r.id}`}</b>
              },
              {
                key: 'kontrahent',
                label: 'Kontrahent',
                value: (r: any) => r.kontrahent?.nazwa || '-'
              },
              {
                key: 'status',
                label: 'Status',
                value: (r: any) => r.status?.nazwa ? (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                    {r.status.nazwa}
                  </span>
                ) : '-'
              },
              {
                key: 'data_wydania',
                label: 'Data wydania',
                value: (r: any) => formatDate(r.data_wydania),
                sortValue: (r: any) => r.data_wydania
              },
              {
                key: 'data_zwrotu_planowana',
                label: 'Planowany zwrot',
                value: (r: any) => {
                  const isOverdue = r.data_zwrotu_planowana && new Date(r.data_zwrotu_planowana) < new Date();
                  return (
                    <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-slate-700'}`}>
                      {formatDate(r.data_zwrotu_planowana)}
                      {isOverdue && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase text-red-700 shadow-sm">Opóźnienie</span>}
                    </span>
                  );
                },
                sortValue: (r: any) => r.data_zwrotu_planowana
              },
              {
                key: 'pozycje',
                label: 'Liczba pozycji',
                value: (r: any) => <span className="font-black text-slate-500">{r.pozycje?.length || 0} szt.</span>
              }
            ]}
            empty="Brak niezwróconego sprzętu spełniającego kryteria."
          />
        )}
      </Card>
    </div>
  );
}