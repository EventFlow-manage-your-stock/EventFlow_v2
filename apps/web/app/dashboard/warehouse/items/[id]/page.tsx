'use client';
import { EntityEditorPage } from '../../../../../components/EntityEditorPage';

export default function ItemEditorPage() {
  return <EntityEditorPage config={{
    moduleLabel: 'Egzemplarze',
    title: 'Edycja egzemplarza',
    listHref: '/dashboard/warehouse/items',
    getEndpoint: (id) => `/api/magazyn/egzemplarze/${id}`,
    updateEndpoint: (id) => `/api/magazyn/egzemplarze/${id}`,
    deleteEndpoint: (id) => `/api/magazyn/egzemplarze/${id}`,
    dictionaries: { id_magazynu: '/api/magazyn/slowniki/magazyny', id_case: '/api/magazyn/slowniki/cases' },
    titleFromRecord: (r) => r.nazwa || r.model?.nazwa || `Egzemplarz #${r.id}`,
    subtitleFromRecord: (r) => [r.model?.nazwa, r.kod_kreskowy].filter(Boolean).join(' · '),
    fields: [
      { key: 'nazwa', label: 'Nazwa egzemplarza' },
      { key: 'numer_egzemplarza', label: 'Numer egzemplarza' },
      { key: 'numer_urzadzenia', label: 'Numer urządzenia' },
      { key: 'sn', label: 'S/N' },
      { key: 'data_produkcji', label: 'Data produkcji', type: 'date' },
      { key: 'kod_kreskowy', label: 'Kod kreskowy' },
      { key: 'zewnetrzny_kod_kreskowy', label: 'Zewnętrzny kod kreskowy' },
      { key: 'zewnetrzny_qr_kod', label: 'Zewnętrzny QR' },
      { key: 'rozroznij_kod_qr', label: 'Rozróżnij QR i kod', type: 'checkbox' },
      { key: 'status_serwisowy', label: 'Status serwisowy' },
      { key: 'id_magazynu', label: 'Magazyn', type: 'select' },
      { key: 'id_case', label: 'Case / opakowanie', type: 'select', optionLabel: (o:any) => `${o.model?.nazwa || ''} ${o.nazwa || o.numer_urzadzenia || `#${o.id}`}`.trim() },
      { key: 'miejsce_w_mag', label: 'Miejsce w magazynie' },
      { key: 'wartosc', label: 'Wartość', type: 'number' },
      { key: 'cena_zakupu', label: 'Cena zakupu', type: 'number' },
      { key: 'opis', label: 'Uwagi', type: 'textarea' },
    ],
  }} />;
}
