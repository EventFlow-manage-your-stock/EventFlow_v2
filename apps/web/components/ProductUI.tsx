import React from 'react';

export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#0891B2]">{eyebrow}</p>}
        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <div onClick={onClick} className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 ${className}`}>{children}</div>;
}

export function Button({ children, onClick, variant = 'primary', type = 'button', disabled = false }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'danger'; type?: 'button' | 'submit'; disabled?: boolean }) {
  const cls = variant === 'primary'
    ? 'bg-[#0891B2] text-white hover:bg-[#0E7490]'
    : variant === 'danger'
      ? 'border border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
      : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200';
  return <button type={type} disabled={disabled} onClick={onClick} className={`rounded-xl px-4 py-2 text-sm font-black transition disabled:opacity-50 ${cls}`}>{children}</button>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-slate-700 dark:text-slate-300"><span className="mb-1 block">{label}</span>{children}</label>;
}

export const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#0891B2] focus:ring-2 focus:ring-cyan-100 dark:border-white/10 dark:bg-slate-950 dark:text-white';

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-white/10 dark:bg-slate-950"><p className="font-black text-slate-700 dark:text-slate-200">{title}</p>{description && <p className="mt-2 text-sm text-slate-500">{description}</p>}</div>;
}
