import { useCallback, useEffect, useState } from 'react'
import { Activity, Menu, ScanLine, ShieldCheck, Wifi, WifiOff } from 'lucide-react'
import Sidebar from './components/Sidebar.jsx'
import MessageScanner from './components/MessageScanner.jsx'
import HistoryPanel from './components/HistoryPanel.jsx'
import MetricsPanel from './components/MetricsPanel.jsx'
import AboutPanel from './components/AboutPanel.jsx'
import { analyzeMessage, getHealth, getMetrics } from './services/api.js'

const viewTitles = {
  dashboard: ['Overview', 'Your message security workspace'],
  scanner: ['Message scanner', 'Check a message with the trained NLP model'],
  history: ['Detection history', 'Session-only records from your recent analyses'],
  performance: ['Model performance', 'Evaluation metrics from the saved training run'],
  about: ['About SpamShield AI', 'A local AI message security mini-project'],
}

export default function App() {
  const [activeView, setActiveView] = useState('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [health, setHealth] = useState(null)
  const [healthError, setHealthError] = useState('')
  const [metrics, setMetrics] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  const refreshHealth = useCallback(async () => {
    try {
      const status = await getHealth()
      setHealth(status)
      setHealthError('')
      return status
    } catch (reason) {
      setHealth(null)
      setHealthError(reason.message)
      return null
    }
  }, [])

  useEffect(() => {
    let active = true
    const check = async () => {
      try {
        const status = await getHealth()
        if (active) { setHealth(status); setHealthError('') }
      } catch (reason) {
        if (active) { setHealth(null); setHealthError(reason.message) }
      }
      if (active) window.setTimeout(check, 20_000)
    }
    check()
    getMetrics().then((data) => { if (active) setMetrics(data) }).catch(() => {})
    return () => { active = false }
  }, [])

  const onAnalyze = async ({ message, messageType }) => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const prediction = await analyzeMessage(message, messageType)
      setResult(prediction)
      setHistory((current) => [{
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        preview: message.replace(/\s+/g, ' ').slice(0, 160),
        messageType,
        prediction: prediction.prediction,
        spamProbability: prediction.spam_probability,
        createdAt: new Date().toISOString(),
      }, ...current])
    } catch (reason) {
      setError(reason.message)
    } finally {
      setLoading(false)
    }
  }

  const clearResult = () => { setResult(null); setError('') }
  const navigate = (view) => { setActiveView(view); setMobileOpen(false) }
  const title = viewTitles[activeView]

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Sidebar activeView={activeView} onNavigate={navigate} health={health} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="min-h-screen md:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-[66px] items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur-md sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button className="grid h-9 w-9 place-items-center rounded-lg border border-line text-slate-600 hover:bg-slate-50 md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={18} /></button>
            <div><div className="text-[10px] font-bold uppercase text-slate-400">SpamShield AI</div><div className="mt-0.5 text-xs font-bold text-ink">{title[0]}</div></div>
          </div>
          <div className="flex items-center gap-3">
            <div title={healthError || (health?.model_ready ? 'API and model connected' : 'Model unavailable')} className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-bold sm:inline-flex ${health?.model_ready ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'}`}>
              {healthError ? <WifiOff size={13} /> : <Wifi size={13} />}{health?.model_ready ? 'MODEL CONNECTED' : health ? 'MODEL UNAVAILABLE' : 'CONNECTING'}
            </div>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e8edff] text-brand" aria-hidden="true"><ShieldCheck size={16} /></span>
          </div>
        </header>

        <main className="mx-auto max-w-[1480px] px-4 pb-12 pt-7 sm:px-7 sm:pt-9 lg:px-9">
          {activeView === 'dashboard' && <Dashboard health={health} healthError={healthError} metrics={metrics} onRefresh={refreshHealth} onNavigate={navigate} scannerProps={{ result, loading, error, onAnalyze, onClear: clearResult, onHistory: () => navigate('history') }} />}
          {activeView === 'scanner' && <><PageIntro eyebrow="MESSAGE ANALYSIS" title="Email & SMS spam detection" description="Paste a message and get a prediction from your real TF-IDF and Multinomial Naive Bayes model." /><div className="mt-6 max-w-4xl"><MessageScanner {...{ result, loading, error, onAnalyze, onClear: clearResult }} /></div></>}
          {activeView === 'history' && <><PageIntro eyebrow="SESSION LOG" title="Detection history" description="Search or filter the short previews created during this browser session." /><div className="mt-6"><HistoryPanel history={history} onClear={() => setHistory([])} /></div></>}
          {activeView === 'performance' && <><PageIntro eyebrow="MODEL EVALUATION" title="Performance from the saved model" description="Inspect the actual holdout metrics generated during training. No default or placeholder scores are shown." /><div className="mt-6"><MetricsPanel metrics={metrics} setMetrics={setMetrics} /></div></>}
          {activeView === 'about' && <><PageIntro eyebrow="PROJECT NOTES" title="About SpamShield AI" description="An educational NLP system with a React interface and a local Python model service." /><div className="mt-6"><AboutPanel health={health} metrics={metrics} /></div></>}
        </main>
      </div>
    </div>
  )
}

function Dashboard({ health, healthError, metrics, onRefresh, onNavigate, scannerProps }) {
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="animate-rise max-w-3xl"><div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase text-brand"><span className="h-1.5 w-1.5 rounded-full bg-brand" />AI-powered message security</div><h1 className="m-0 font-display text-2xl font-extrabold text-ink sm:text-[30px]">Email &amp; SMS Spam Detection</h1><p className="mb-0 mt-2 max-w-2xl text-sm leading-6 text-slate-500">Analyze suspicious messages with natural language processing and machine learning, powered by your trained message classifier.</p></div>
        <div className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold ${health?.model_ready ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-amber-100 bg-amber-50 text-amber-800'}`}>
          <span className={`h-2 w-2 rounded-full ${health?.model_ready ? 'bg-emerald-500' : 'bg-amber-400'}`} />{health?.model_ready ? 'Model ready' : health ? 'Model not ready' : 'Connecting to backend'}
          {!health?.model_ready && <button type="button" onClick={onRefresh} className="ml-1 underline decoration-current/40 underline-offset-2">Retry</button>}
        </div>
      </div>
      {healthError && <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">{healthError}</div>}
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <OverviewCard icon={<ScanLine size={16} />} label="Message types" value="Email + SMS" detail="Two labeled training sources" />
        <OverviewCard icon={<Activity size={16} />} label="Classifier" value="TF-IDF + Naive Bayes" detail={health?.model_name || 'Waiting for backend confirmation'} />
        <OverviewCard icon={<ShieldCheck size={16} />} label="Spam recall" value={typeof metrics?.metrics?.recall === 'number' ? `${(metrics.metrics.recall * 100).toFixed(1)}%` : 'Unavailable'} detail="Combined held-out test set" />
      </div>
      <div className="max-w-4xl"><MessageScanner {...scannerProps} /></div>
      <p className="mb-0 mt-5 flex items-center gap-2 text-[11px] leading-relaxed text-slate-500"><ShieldCheck size={14} className="shrink-0 text-slate-400" />Predictions are estimates. Holdout results describe only your supplied datasets and do not guarantee future performance.</p>
    </>
  )
}

function OverviewCard({ icon, label, value, detail }) {
  return <div className="rounded-2xl border border-line bg-white p-4 shadow-panel sm:p-5"><div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase text-slate-400">{label}</span><span className="grid h-7 w-7 place-items-center rounded-lg bg-[#f1f4fc] text-brand">{icon}</span></div><div className="mt-3 truncate font-display text-sm font-extrabold text-ink" title={value}>{value}</div><div className="mt-1 truncate text-[10px] text-slate-500" title={detail}>{detail}</div></div>
}

function PageIntro({ eyebrow, title, description }) {
  return <div className="animate-rise"><div className="mb-2 text-[10px] font-extrabold uppercase text-brand">{eyebrow}</div><h1 className="m-0 font-display text-2xl font-extrabold text-ink sm:text-[28px]">{title}</h1><p className="mb-0 mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p></div>
}