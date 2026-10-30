import {
  Activity,
  Clock3,
  LayoutDashboard,
  ScanLine,
  ShieldCheck,
  ShieldHalf,
  X,
  Info,
} from 'lucide-react'

const navigation = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'scanner', label: 'Message scanner', icon: ScanLine },
  { id: 'history', label: 'Detection history', icon: Clock3 },
  { id: 'performance', label: 'Model performance', icon: Activity },
  { id: 'about', label: 'About project', icon: Info },
]

export default function Sidebar({ activeView, onNavigate, health, mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && <button className="fixed inset-0 z-40 bg-ink/40 md:hidden" onClick={onClose} aria-label="Close navigation" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-line bg-white px-4 py-5 transition-transform duration-200 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-white shadow-md shadow-brand/20"><ShieldHalf size={21} strokeWidth={2.3} /></span>
            <div>
              <div className="font-display text-[16px] font-extrabold text-ink">SpamShield <span className="text-brand">AI</span></div>
              <div className="mt-0.5 text-[10px] font-bold uppercase text-slate-400">Message security</div>
            </div>
          </div>
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
        </div>

        <div className="mb-2 mt-10 px-3 text-[10px] font-bold uppercase text-slate-400">Workspace</div>
        <nav className="space-y-1" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => {
            const active = activeView === id
            return (
              <button key={id} onClick={() => onNavigate(id)} aria-current={active ? 'page' : undefined}
                className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold transition ${active ? 'bg-[#edf1ff] text-brand' : 'text-slate-500 hover:bg-slate-50 hover:text-ink'}`}>
                <Icon size={17} strokeWidth={active ? 2.3 : 1.9} />
                <span>{label}</span>
                {id === 'history' && <span className="ml-auto rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">Session</span>}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border border-line bg-[#fafbfe] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf1ff] text-brand"><ShieldCheck size={16} /></span>
              <span className={`flex items-center gap-1.5 text-[10px] font-bold ${health?.model_ready ? 'text-emerald-700' : 'text-amber-600'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${health?.model_ready ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                {health?.model_ready ? 'MODEL READY' : health ? 'MODEL OFFLINE' : 'CONNECTING'}
              </span>
            </div>
            <div className="text-xs font-bold text-ink">TF-IDF + Naive Bayes</div>
            <p className="mb-0 mt-1 text-[11px] leading-relaxed text-slate-500">Trained email and SMS classifier</p>
          </div>
          <div className="flex items-center justify-between px-2 text-[10px] text-slate-400">
            <span>SpamShield AI</span><span>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  )
}