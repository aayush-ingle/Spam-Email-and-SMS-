import { useState } from 'react'
import { Check, Clipboard, Eraser, FileText, LoaderCircle, Mail, MessageSquareText, ScanLine, Sparkles } from 'lucide-react'
import ResultCard from './ResultCard.jsx'

const examples = [
  { label: 'Email spam', type: 'email', message: 'Subject: Claim your prize now. Click here to receive your reward.' },
  { label: 'SMS spam', type: 'sms', message: 'WIN a free prize now! Call 09000000000 to claim your reward.' },
  { label: 'SMS ham', type: 'sms', message: 'Hi, are we still meeting for lunch at 12:30?' },
]

export default function MessageScanner({ result, loading, error, onAnalyze, onClear, onHistory }) {
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('email')
  const [copied, setCopied] = useState(false)

  async function copyMessage() {
    if (!message.trim()) return
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  function clearMessage() {
    setMessage('')
    onClear()
  }

  function chooseExample(example) {
    setMessageType(example.type)
    setMessage(example.message)
  }

  function submit(event) {
    event.preventDefault()
    if (!message.trim() || loading) return
    onAnalyze({ message: message.trim(), messageType })
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf1ff] text-brand"><ScanLine size={18} /></span>
            <div><h2 className="m-0 text-sm font-bold text-ink">Message scanner</h2><p className="m-0 mt-0.5 text-[11px] text-slate-500">Inspect a message with the trained model</p></div>
          </div>
          <div className="inline-flex rounded-xl border border-line bg-slate-50 p-1" role="group" aria-label="Message type">
            {[['email', Mail, 'Email'], ['sms', MessageSquareText, 'SMS']].map(([type, Icon, label]) => (
              <button key={type} type="button" onClick={() => setMessageType(type)} aria-pressed={messageType === type}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${messageType === type ? 'bg-white text-brand shadow-sm' : 'text-slate-500 hover:text-ink'}`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="p-5 sm:p-6">
          <label htmlFor="message-input" className="mb-2 block text-xs font-bold text-ink">Message content</label>
          <div className="rounded-xl border border-line bg-[#fbfcfe] transition focus-within:border-brand/50 focus-within:ring-4 focus-within:ring-brand/10">
            <textarea id="message-input" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={20000}
              placeholder={messageType === 'email' ? 'Paste an email including its subject and body…' : 'Paste or type an SMS message…'}
              className="min-h-[180px] w-full resize-y border-0 bg-transparent px-4 py-4 text-sm leading-6 text-ink outline-none placeholder:text-slate-400 focus:ring-0 sm:min-h-[210px]" />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5">
              <span className="text-[10px] tabular-nums text-slate-400">{message.length.toLocaleString()} / 20,000 characters</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={copyMessage} disabled={!message.trim()} title="Copy message" aria-label="Copy message" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-white hover:text-ink disabled:cursor-not-allowed disabled:opacity-40">
                  {copied ? <Check size={13} /> : <Clipboard size={13} />}{copied ? 'Copied' : 'Copy'}
                </button>
                <button type="button" onClick={clearMessage} title="Clear message" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-white hover:text-rose-600">
                  <Eraser size={13} />Clear
                </button>
              </div>
            </div>
          </div>
          {error && <div role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs leading-relaxed text-rose-700">{error}</div>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="m-0 flex items-center gap-1.5 text-[11px] text-slate-500"><ShieldCheckIcon />Your message is analyzed in memory and not saved by this app.</p>
            <button type="submit" disabled={!message.trim() || loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-xs font-bold text-white shadow-md shadow-brand/15 transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <><LoaderCircle size={15} className="animate-spin" />Analyzing…</> : <><Sparkles size={15} />Analyze message</>}
            </button>
          </div>
        </form>
      </section>

      {loading && <div className="animate-pulse rounded-2xl border border-line bg-white p-5 text-xs text-slate-500"><div className="mb-3 flex items-center gap-2 font-semibold text-brand"><LoaderCircle size={15} className="animate-spin" />Running the trained NLP pipeline</div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 animate-pulse rounded-full bg-brand/50" /></div></div>}
      <ResultCard result={result} />

      <section className="rounded-2xl border border-line bg-white px-5 py-4 shadow-panel sm:px-6">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold text-ink"><FileText size={15} className="text-slate-400" />Try a sample</div>
        <div className="flex flex-wrap gap-2">
          {examples.map((example) => <button key={example.label} type="button" onClick={() => chooseExample(example)} className="rounded-full border border-line bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:border-brand/30 hover:bg-[#f7f8ff] hover:text-brand">{example.label}</button>)}
        </div>
        <p className="mb-0 mt-3 text-[10px] text-slate-400">Sample text fills the scanner. Select Analyze to request a real model prediction.</p>
      </section>
      {onHistory && result && <button type="button" onClick={onHistory} className="text-xs font-semibold text-brand hover:text-brand-dark">View this session's detection history</button>}
    </div>
  )
}

function ShieldCheckIcon() {
  return <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
}