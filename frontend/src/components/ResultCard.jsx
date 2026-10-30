import { AlertTriangle, Check, ShieldAlert, ShieldCheck } from 'lucide-react'

export default function ResultCard({ result }) {
  if (!result) return null
  const isSpam = result.prediction === 'spam'
  const percent = Math.max(0, Math.min(100, result.spam_probability * 100))

  return (
    <section className={`animate-rise overflow-hidden rounded-2xl border ${isSpam ? 'border-rose-200 bg-[#fffafa]' : 'border-emerald-200 bg-[#fbfefc]'}`} aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
        <div className="flex min-w-0 items-start gap-3.5">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${isSpam ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
            {isSpam ? <ShieldAlert size={22} /> : <ShieldCheck size={22} />}
          </span>
          <div>
            <div className={`text-[10px] font-extrabold uppercase ${isSpam ? 'text-rose-600' : 'text-emerald-700'}`}>Analysis complete</div>
            <h3 className={`mt-1 font-display text-xl font-extrabold ${isSpam ? 'text-rose-700' : 'text-emerald-800'}`}>{isSpam ? 'Spam detected' : 'Not spam'}</h3>
            <p className="mt-1 max-w-lg text-xs leading-relaxed text-slate-600">
              {isSpam ? 'This message matches patterns the model learned from spam examples.' : 'The model classified this message as ham based on its learned text patterns.'}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${isSpam ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'}`}>
          {isSpam ? <AlertTriangle size={12} /> : <Check size={12} />}{isSpam ? 'SPAM' : 'NOT SPAM'}
        </span>
      </div>
      <div className="border-t border-black/5 bg-white/75 px-5 py-4 sm:px-6">
        <div className="mb-2 flex items-center justify-between gap-4 text-xs">
          <span className="font-semibold text-ink">Estimated spam probability</span>
          <span className="font-display font-extrabold tabular-nums text-ink">{percent.toFixed(1)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="meter" aria-label="Estimated spam probability" aria-valuemin="0" aria-valuemax="100" aria-valuenow={percent}>
          <div className={`h-full rounded-full transition-all duration-700 ${isSpam ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }} />
        </div>
        <p className="mb-0 mt-3 flex items-start gap-2 text-[11px] leading-relaxed text-slate-500"><ShieldCheck size={13} className="mt-0.5 shrink-0" />{result.disclaimer || 'Predictions are estimates and may be incorrect.'}</p>
      </div>
    </section>
  )
}