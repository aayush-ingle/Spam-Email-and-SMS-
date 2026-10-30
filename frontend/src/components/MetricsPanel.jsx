import { useEffect, useState } from 'react'
import { Activity, AlertCircle, BarChart3, Database, LoaderCircle } from 'lucide-react'
import { getMetrics } from '../services/api.js'

const sections = [
  { id: 'combined', label: 'Combined', key: 'metrics' },
  { id: 'email', label: 'Email', key: 'email' },
  { id: 'sms', label: 'SMS', key: 'sms' },
]

export default function MetricsPanel({ metrics, setMetrics }) {
  const [active, setActive] = useState('combined')
  const [loading, setLoading] = useState(!metrics)
  const [error, setError] = useState('')

  useEffect(() => {
    if (metrics) return
    let alive = true
    getMetrics().then((data) => { if (alive) setMetrics(data) }).catch((reason) => { if (alive) setError(reason.message) }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [metrics, setMetrics])

  if (loading) return <PanelState icon={<LoaderCircle className="animate-spin" size={19} />} title="Loading evaluation" text="Fetching metrics from the trained model." />
  if (error) return <PanelState icon={<AlertCircle size={19} />} title="Metrics unavailable" text={error} />
  if (!metrics) return <PanelState icon={<BarChart3 size={19} />} title="No evaluation data" text="No metrics are stored in the model artifact." />

  const selected = sections.find((section) => section.id === active)
  const data = selected.id === 'combined' ? metrics.metrics : metrics.source_metrics?.[selected.id]
  if (!data) return <PanelState icon={<BarChart3 size={19} />} title={`${selected.label} metrics unavailable`} text="The backend did not provide evaluation metrics for this source." />
  const labels = data.confusion_matrix_labels || ['ham', 'spam']
  const matrix = data.confusion_matrix

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-panel sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase text-brand"><Activity size={13} />Evaluation</div><h2 className="mb-0 mt-2 font-display text-xl font-extrabold text-ink">Model performance</h2><p className="mb-0 mt-1 text-xs text-slate-500">Actual holdout results returned by the training artifact.</p></div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10px] font-bold text-emerald-700"><Database size={12} />LIVE MODEL DATA</span>
        </div>
        <div className="mt-5 inline-flex rounded-xl border border-line bg-slate-50 p-1" role="tablist" aria-label="Metric dataset">
          {sections.map((section) => <button key={section.id} type="button" role="tab" aria-selected={active === section.id} onClick={() => setActive(section.id)} className={`rounded-lg px-3 py-2 text-xs font-bold transition ${active === section.id ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-ink'}`}>{section.label}</button>)}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          ['Accuracy', data.accuracy], ['Precision · spam', data.precision], ['Recall · spam', data.recall], ['F1-score · spam', data.f1_score],
        ].map(([label, value]) => <div key={label} className="rounded-2xl border border-line bg-white p-4 shadow-panel sm:p-5"><div className="text-[11px] font-semibold text-slate-500">{label}</div><div className="mt-2 font-display text-2xl font-extrabold tabular-nums text-ink">{typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : '—'}</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{ width: `${typeof value === 'number' ? Math.max(0, Math.min(100, value * 100)) : 0}%` }} /></div></div>)}
      </div>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-panel sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3"><div><h3 className="m-0 text-sm font-bold text-ink">Confusion matrix</h3><p className="mb-0 mt-1 text-[11px] text-slate-500">Rows are actual labels; columns are predicted.</p></div><span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">{data.test_samples ?? '—'} test messages</span></div>
        {Array.isArray(matrix) && matrix.length === 2 ? <div className="overflow-x-auto"><div className="mx-auto grid min-w-[300px] max-w-[420px] grid-cols-[72px_1fr_1fr] gap-2 text-center text-xs">
          <span /><span className="pb-1 font-bold text-slate-500">Predicted {labels[0]}</span><span className="pb-1 font-bold text-slate-500">Predicted {labels[1]}</span>
          <span className="self-center text-left font-bold text-slate-500">Actual {labels[0]}</span><MatrixCell value={matrix[0]?.[0]} tone="good" /><MatrixCell value={matrix[0]?.[1]} tone="miss" />
          <span className="self-center text-left font-bold text-slate-500">Actual {labels[1]}</span><MatrixCell value={matrix[1]?.[0]} tone="miss" /><MatrixCell value={matrix[1]?.[1]} tone="good" />
        </div></div> : <p className="text-xs text-slate-500">Confusion matrix unavailable.</p>}
      </section>
      <p className="m-0 text-[11px] leading-relaxed text-slate-500">{metrics.evaluation_note || 'Metrics reflect only the evaluation samples used during training.'} These scores do not guarantee performance on future messages. Spam probabilities may not be calibrated.</p>
    </div>
  )
}

function MatrixCell({ value, tone }) {
  return <div className={`grid min-h-20 place-items-center rounded-xl border font-display text-2xl font-extrabold tabular-nums ${tone === 'good' ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-rose-100 bg-rose-50 text-rose-700'}`}>{typeof value === 'number' ? value.toLocaleString() : '—'}</div>
}

function PanelState({ icon, title, text }) {
  return <div className="rounded-2xl border border-line bg-white px-6 py-14 text-center shadow-panel"><span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500">{icon}</span><h2 className="mb-1 mt-4 text-sm font-bold text-ink">{title}</h2><p className="mx-auto mb-0 max-w-md text-xs leading-relaxed text-slate-500">{text}</p></div>
}