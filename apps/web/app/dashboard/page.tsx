'use client';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      
      {/* Kolumna lewa */}
      <div className="xl:col-span-2 flex flex-col gap-6">
        <Widget title="Dzisiaj" />
        <Widget title="Najbliższe wydarzenia" />
        <Widget title="Najbliższe wydarzenia Twojego działu" />
      </div>

      {/* Kolumna prawa */}
      <div className="flex flex-col gap-6">
        <Widget title="Aktualności" className="min-h-[300px]" />
        
        <Widget title="Status">
          <ul className="mt-2 space-y-1">
            <StatusItem label="Koszty niezaksięgowane" count={3} color="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" />
            <StatusItem label="Faktury przeterminowane" count={0} color="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400" />
            <StatusItem label="Sprzęt na serwisie" count={1} color="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" />
          </ul>
        </Widget>
      </div>

    </div>
  );
}

// Zaktualizowany Widżet
function Widget({ title, children, className = "" }: { title: string, children?: React.ReactNode, className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md 
    dark:border-white/5 dark:bg-slate-900/50 dark:shadow-lg dark:backdrop-blur-sm dark:hover:border-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-white tracking-wide">{title}</h2>
        <div className="flex gap-1">
          <button className="h-2 w-2 rounded-full bg-slate-300 hover:bg-slate-400 transition dark:bg-slate-600 dark:hover:bg-slate-400" />
          <button className="h-2 w-2 rounded-full bg-slate-300 hover:bg-slate-400 transition dark:bg-slate-600 dark:hover:bg-slate-400" />
        </div>
      </div>
      
      {children || (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500 
        dark:border-white/5 dark:border-solid dark:bg-black/20">
          Brak wyników.
        </div>
      )}
    </div>
  );
}

// Zaktualizowany Element Statusu
function StatusItem({ label, count, color }: { label: string, count: number, color: string }) {
  return (
    <li className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 transition cursor-pointer dark:hover:bg-white/5">
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <span className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${color}`}>
        {count}
      </span>
    </li>
  );
}