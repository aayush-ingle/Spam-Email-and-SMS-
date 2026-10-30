import { ArrowUpRight, BookOpenText, Braces, Database, FileText, ShieldCheck } from 'lucide-react'
import { apiDocsUrl } from '../services/api.js'

const details = [
  { icon: BookOpenText, label: 'Text representation', value: 'TF-IDF vectorization' },
  { icon: Braces, label: 'Classifier', value: 'Multinomial Naive Bayes' },
  { icon: Database, label: 'Training sources', value: 'Labeled email and SMS CSVs' },
  { icon: ShieldCheck, label: 'Privacy', value: 'No persistent message storage' },
]

export default function AboutPanel({ health, metrics }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <section className="rounded-2xl border border-line bg-white p-6 shadow-panel sm:p-8">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf1ff] text-brand"><ShieldCheck size={21} /></div>
        <div className="mt-5 text-[10px] font-extrabold uppercase text-brand">Project overview</div>
        <h2 className="mb-0 mt-2 max-w-xl font-display text-2xl font-extrabold leading-tight text-ink">Message security, grounded in a real NLP model.</h2>
        <p className="mb-0 mt-3 max-w-2xl text-sm leading-7 text-slate-600">SpamShield AI is a local demonstration interface for a supervised text classifier. The React client sends message text to a FastAPI service, which applies the saved TF-IDF vocabulary and Multinomial Naive Bayes model.</p>
        <div className="mt-6 flex flex-wrap gap-2"><span className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600">Python · FastAPI</span><span className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600">React · Vite</span><span className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600">TF-IDF · Naive Bayes</span></div>
      </section>
      <section className="rounded-2xl border border-line bg-white p-5 shadow-panel sm:p-6">
        <h3 className="m-0 text-sm font-bold text-ink">System details</h3>
        <div className="mt-4 divide-y divide-line">
          {details.map(({ icon: Icon, label, value }) => <div key={label} className="flex items-center gap-3 py-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-50 text-slate-500"><Icon size={15} /></span><div className="min-w-0"><div className="text-[10px] text-slate-400">{label}</div><div className="mt-0.5 text-xs font-semibold text-ink">{value}</div></div></div>)}
        </div>
        <a href={apiDocsUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold text-brand hover:text-brand-dark">Open local API documentation <ArrowUpRight size={13} /></a>
      </section>
      <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:col-span-2 sm:p-6">
        <div className="flex items-start gap-3"><FileText size={17} className="mt-0.5 shrink-0 text-amber-700" /><div><h3 className="m-0 text-xs font-extrabold text-amber-900">Interpret results with care</h3><p className="mb-0 mt-1 text-xs leading-relaxed text-amber-900/80">Model probabilities are estimates and may be wrong. Holdout metrics describe only the supplied datasets, not future messages or unseen organizations. {metrics?.metrics?.recall !== undefined ? `The current combined spam recall is ${(metrics.metrics.recall * 100).toFixed(1)}%, so some spam was missed during evaluation.` : ''} Do not rely on this demo as the sole security control.</p></div></div>
      </section>
      {!health?.model_ready && <div className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">The model is not currently available. Start the FastAPI backend to enable scanning.</div>}
    </div>
  )
}