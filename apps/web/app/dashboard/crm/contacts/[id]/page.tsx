'use client';
import { EntityEditorPage, defaultTabs } from '../../../../../components/EntityEditorPage';

export default function ContactEditorPage() {
  return <EntityEditorPage config={{
    moduleLabel: 'Kontakty',
    title: 'Edycja kontaktu',
    listHref: '/dashboard/crm/contacts',
    getEndpoint: (id) => `/api/crm/kontakty/${id}`,
    updateEndpoint: (id) => `/api/crm/kontakty/${id}`,
    deleteEndpoint: (id) => `/api/crm/kontakty/${id}`,
    dictionaries: { id_kontrahenta: '/api/crm/kontrahenci' },
    tabs: defaultTabs.crm,
    titleFromRecord: (r) => [r.imie, r.nazwisko].filter(Boolean).join(' ') || r.email || `Kontakt #${r.id}`,
    subtitleFromRecord: (r) => r.kontrahent?.nazwa || r.stanowisko || '',
    fields: [
      { key: 'id_kontrahenta', label: 'Kontrahent', type: 'select' },
      { key: 'imie', label: 'Imię' },
      { key: 'nazwisko', label: 'Nazwisko' },
      { key: 'stanowisko', label: 'Stanowisko' },
      { key: 'email', label: 'E-mail' },
      { key: 'telefon', label: 'Telefon' },
      { key: 'telefon_2', label: 'Telefon 2' },
      { key: 'glowny', label: 'Kontakt główny', type: 'checkbox' },
      { key: 'notatki_wewnetrzne', label: 'Notatki', type: 'textarea' },
    ],
  }} />;
}
