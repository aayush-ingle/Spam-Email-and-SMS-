import { useMemo, useState } from 'react'
import { Search, Trash2, Clock3, ShieldAlert, ShieldCheck, ListFilter } from 'lucide-react'

export default function HistoryPanel({ history, onClear }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const filtered = useMemo(() => history.filter((entry) => {
    const matchesQuery = entry.preview.toLowerCase().includes(query.toLowerCase())
    const matchesFilter = filter === 'all' || entry.prediction === filter || entry.messageType === filter
    return matchesQuery && matchesFilter
  }), [history, query, filter])

  function clearHistory() {
    if (history.length && window.confirm('Clear this session’s detection history? This cannot be undone.')) onClear()
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-panel">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line p-5 sm:p-6">
        <div><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-brand"><Clock3 size={13} />Private session log</div><h2 className="mb-0 mt-2 font-display text-xl font-extrabold text-ink">Detection history</h2><p className="mb-0 mt-1 text-xs text-slate-500">Only short previews are held in this browser session.</p></div>
        <button onClick={clearHistory} disabled={!history.length} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-[11px] font-bold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={13} />Clear history</button>
      </div>
      <div className="flex flex-col gap-3 border-b border-line bg-[#fbfcfe] p-4 sm:flex-row sm:items-center sm:px-6">
        <label className="relative min-w-0 flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search message previews" className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-xs text-ink outline-none transition focus:border-brand/50 focus:ring-4 focus:ring-brand/10" /></label>
        <label className="flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-slate-400"><ListFilter size={14} /><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter history" className="bg-transparent text-xs font-semibold text-slate-600 outline-none"><option value="all">All detections</option><option value="spam">Spam</option><option value="ham">Not spam</option><option value="email">Email</option><option value="sms">SMS</option></select></label>
      </div>
      {filtered.length ? <ul className="m-0 divide-y divide-line p-0">
        {filtered.map((entry) => <li key={entry.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${entry.prediction === 'spam' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>{entry.prediction === 'spam' ? <ShieldAlert size={17} /> : <ShieldCheck size={17} />}</span>
          <div className="min-w-0 flex-1"><p className="m-0 break-words text-xs font-semibold leading-relaxed text-ink">{entry.preview}</p><p className="mb-0 mt-1 text-[10px] text-slate-400">{entry.messageType.toUpperCase()} · {new Date(entry.createdAt).toLocaleString()}</p></div>
          <div className="flex items-center gap-2 sm:justify-end"><span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${entry.prediction === 'spam' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-800'}`}>{entry.prediction === 'spam' ? 'SPAM' : 'NOT SPAM'}</span><span className="min-w-12 text-right text-[10px] font-semibold tabular-nums text-slate-500">{(entry.spamProbability * 100).toFixed(1)}%</span></div>
        </li>)}
      </ul> : <div className="px-5 py-16 text-center"><span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-400"><Clock3 size={18} /></span><h3 className="mb-1 mt-4 text-sm font-bold text-ink">{history.length ? 'No matching detections' : 'No detections yet'}</h3><p className="mb-0 text-xs text-slate-500">Analyze a message and its short preview will appear here for this session.</p></div>}
    </section>
  )
}