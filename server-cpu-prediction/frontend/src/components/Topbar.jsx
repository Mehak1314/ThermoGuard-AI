import { Wifi, WifiOff, AlertCircle } from 'lucide-react'

export default function Topbar({ backendStatus, modelsLoaded }) {
  return (
    <header className="bg-sidebar border-b border-card-border px-6 py-3 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-text-primary font-semibold text-base leading-tight">
          Server CPU Temperature Prediction
        </h1>
        <p className="text-text-secondary text-xs">Machine Learning — Random Forest · Decision Tree · Linear Regression</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Dataset badge */}
        <div className="flex items-center gap-1.5 bg-green-900/30 border border-green-700/40 px-3 py-1.5 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
          <span className="text-success text-xs font-medium">Dataset Ready</span>
        </div>

        {/* Model status */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium
          ${modelsLoaded
            ? 'bg-blue-900/30 border-blue-700/40 text-primary'
            : 'bg-amber-900/30 border-amber-700/40 text-warning'
          }`}>
          {modelsLoaded
            ? <><span className="w-1.5 h-1.5 rounded-full bg-primary"></span> Models Loaded</>
            : <><AlertCircle size={12} /> Models Not Trained</>
          }
        </div>

        {/* Backend status */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium
          ${backendStatus === 'online'
            ? 'bg-green-900/30 border-green-700/40 text-success'
            : backendStatus === 'offline'
              ? 'bg-red-900/30 border-red-700/40 text-danger'
              : 'bg-card border-card-border text-text-secondary'
          }`}>
          {backendStatus === 'online'
            ? <><Wifi size={12} /> API Online</>
            : backendStatus === 'offline'
              ? <><WifiOff size={12} /> API Offline</>
              : <>Connecting…</>
          }
        </div>
      </div>
    </header>
  )
}
