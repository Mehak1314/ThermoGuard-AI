import { Cpu, LayoutDashboard, Database, BarChart3, Thermometer, Info } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'dataset', label: 'Dataset Explorer', icon: Database },
  { id: 'performance', label: 'Model Performance', icon: BarChart3 },
  { id: 'predict', label: 'Temperature Prediction', icon: Thermometer },
  { id: 'about', label: 'About Project', icon: Info },
]

export default function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="w-60 bg-sidebar border-r border-card-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-card-border flex items-center gap-3">
        <div className="w-9 h-9 bg-primary/20 border border-primary/30 rounded-lg flex items-center justify-center">
          <Cpu size={18} className="text-primary" />
        </div>
        <div>
          <div className="text-text-primary font-semibold text-sm leading-tight">CPU Thermal</div>
          <div className="text-text-secondary text-xs">Monitor & Predict</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        <p className="text-text-secondary text-xs font-medium uppercase tracking-wider px-3 mb-2">Navigation</p>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`nav-item w-full text-left ${activePage === id ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-card-border">
        <p className="text-text-secondary text-xs">ML Project v1.0</p>
        <p className="text-text-secondary text-xs">6,000 Records · 3 Models</p>
      </div>
    </aside>
  )
}
