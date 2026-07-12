'use client';
import { EntityEditorPage, defaultTabs } from '../../../../components/EntityEditorPage';

export default function ContractorEditorPage() {
  return <EntityEditorPage config={{
    moduleLabel: 'Kontrahenci',
    title: 'Edycja kontrahenta',
    listHref: '/dashboard/crm',
    getEndpoint: (id) => `/api/crm/kontrahenci/${id}`,
    updateEndpoint: (id) => `/api/crm/kontrahenci/${id}`,
    deleteEndpoint: (id) => `/api/crm/kontrahenci/${id}`,
    tabs: defaultTabs.crm,
    titleFromRecord: (r) => r.nazwa || `Kontrahent #${r.id}`,
    subtitleFromRecord: (r) => [r.nip ? `NIP ${r.nip}` : null, r.email].filter(Boolean).join(' · '),
    fields: [
      { key: 'nazwa', label: 'Nazwa' },
      { key: 'nazwa_skrocona', label: 'Nazwa skrócona' },
      { key: 'nip', label: 'NIP' },
      { key: 'regon', label: 'REGON' },
      { key: 'krs', label: 'KRS' },
      { key: 'kraj', label: 'Kraj' },
      { key: 'miasto', label: 'Miasto' },
      { key: 'kod_pocztowy', label: 'Kod pocztowy' },
      { key: 'ulica', label: 'Adres / ulica', colSpan: 'full' },
      { key: 'email', label: 'E-mail' },
      { key: 'telefon', label: 'Telefon' },
      { key: 'nr_konta', label: 'Numer konta' },
      { key: 'czy_klient', label: 'Klient', type: 'checkbox' },
      { key: 'czy_dostawca', label: 'Dostawca', type: 'checkbox' },
      { key: 'uwagi', label: 'Uwagi', type: 'textarea' },
    ],
  }} />;
}
