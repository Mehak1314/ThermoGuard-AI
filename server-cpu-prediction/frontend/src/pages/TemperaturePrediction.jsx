import { useState } from 'react'
import { Thermometer, Cpu, Zap, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { predictTemperature } from '../services/api'

const MODELS = ['Random Forest', 'Decision Tree (Shallow)', 'Linear Regression']

const FIELD_CONFIG = [
  {
    key: 'cpu_utilization', label: 'CPU Utilization', unit: '%',
    min: 10, max: 100, step: 0.5, default: 55,
    description: 'Percentage of CPU processing capacity in use'
  },
  {
    key: 'memory_usage', label: 'Memory Usage', unit: '%',
    min: 20, max: 95, step: 0.5, default: 57,
    description: 'Percentage of RAM capacity in use'
  },
  {
    key: 'clock_speed', label: 'Clock Speed', unit: 'GHz',
    min: 1.5, max: 4.0, step: 0.1, default: 2.75,
    description: 'Active CPU clock frequency'
  },
  {
    key: 'ambient_temperature', label: 'Ambient Temperature', unit: '°C',
    min: 15, max: 40, step: 0.5, default: 27.8,
    description: 'Server chassis / environment intake temperature'
  },
  {
    key: 'voltage', label: 'Core Voltage', unit: 'V',
    min: 0.9, max: 1.5, step: 0.01, default: 1.2,
    description: 'Core operating voltage supplied to CPU'
  },
  {
    key: 'current', label: 'Current Draw', unit: 'A',
    min: 5.0, max: 40.0, step: 0.5, default: 22.5,
    description: 'Electrical current drawn by the processor'
  },
]

function SliderInput({ config, value, onChange, error }) {
  const pct = ((value - config.min) / (config.max - config.min)) * 100
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-text-primary text-sm font-medium">{config.label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            min={config.min}
            max={config.max}
            step={config.step}
            onChange={e => onChange(parseFloat(e.target.value) || config.min)}
            className="input-field w-24 text-center text-sm py-1"
          />
          <span className="text-text-secondary text-xs w-8">{config.unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={config.min}
        max={config.max}
        step={config.step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, #3B82F6 ${pct}%, #1E3251 ${pct}%)` }}
      />
      <div className="flex justify-between text-text-secondary text-xs">
        <span>{config.min} {config.unit}</span>
        <span className="text-text-secondary">{config.description}</span>
        <span>{config.max} {config.unit}</span>
      </div>
      {error && <p className="text-danger text-xs">{error}</p>}
    </div>
  )
}

function ThermalGauge({ temperature }) {
  const max = 200
  const pct = Math.min(100, (temperature / max) * 100)
  const color = temperature < 60 ? '#22C55E' : temperature < 80 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Background arc */}
        <circle cx="100" cy="100" r="80" fill="none" stroke="#1E3251" strokeWidth="14" strokeDasharray="251.2 251.2" strokeDashoffset="-62.8" strokeLinecap="round" transform="rotate(-90 100 100)" />
        {/* Filled arc */}
        <circle cx="100" cy="100" r="80" fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={`${pct * 2.512} ${251.2 - pct * 2.512}`}
          strokeDashoffset="-62.8" strokeLinecap="round" transform="rotate(-90 100 100)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        <text x="100" y="92" textAnchor="middle" fill="#F8FAFC" fontSize="28" fontWeight="700">{temperature.toFixed(1)}</text>
        <text x="100" y="116" textAnchor="middle" fill="#94A3B8" fontSize="14">°C</text>
        <text x="100" y="140" textAnchor="middle" fill={color} fontSize="11" fontWeight="600">
          {temperature < 60 ? 'NORMAL' : temperature < 80 ? 'WARNING' : 'CRITICAL'}
        </text>
      </svg>
    </div>
  )
}

export default function TemperaturePrediction() {
  const defaultValues = Object.fromEntries(FIELD_CONFIG.map(f => [f.key, f.default]))
  const [values, setValues] = useState(defaultValues)
  const [model, setModel] = useState('Random Forest')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})

  const validate = () => {
    const errors = {}
    FIELD_CONFIG.forEach(f => {
      const v = values[f.key]
      if (v === '' || v === undefined || isNaN(v)) errors[f.key] = 'Required'
      else if (v < f.min) errors[f.key] = `Min value: ${f.min} ${f.unit}`
      else if (v > f.max) errors[f.key] = `Max value: ${f.max} ${f.unit}`
    })
    return errors
  }

  const handlePredict = async () => {
    const errors = validate()
    if (Object.keys(errors).length) { setFieldErrors(errors); return }
    setFieldErrors({})
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await predictTemperature({ ...values, model_name: model })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Ensure backend is running and models are trained.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key, val) => {
    setValues(v => ({ ...v, [key]: val }))
    setFieldErrors(e => { const ne = { ...e }; delete ne[key]; return ne })
  }

  const StatusIcon = result
    ? result.thermal_level === 'normal' ? CheckCircle
      : result.thermal_level === 'warning' ? AlertTriangle
        : AlertCircle
    : null

  const statusColor = result
    ? result.thermal_level === 'normal' ? 'text-success'
      : result.thermal_level === 'warning' ? 'text-warning'
        : 'text-danger'
    : ''

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-primary font-bold text-xl">Temperature Prediction</h1>
        <p className="text-text-secondary text-sm mt-1">Enter server hardware telemetry values to predict CPU core temperature</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Input form */}
        <div className="xl:col-span-3 space-y-5">
          {/* Model selector */}
          <div className="card">
            <h2 className="text-text-primary font-semibold text-sm mb-3">Select Model</h2>
            <div className="flex flex-wrap gap-2">
              {MODELS.map(m => (
                <button
                  key={m}
                  onClick={() => setModel(m)}
                  className={`text-sm px-4 py-2 rounded-lg border transition-colors font-medium ${model === m ? 'bg-primary border-primary text-white' : 'border-card-border text-text-secondary hover:border-primary/50 hover:text-text-primary'}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Input sliders */}
          <div className="card space-y-5">
            <h2 className="text-text-primary font-semibold text-sm">Hardware Telemetry Inputs</h2>
            {FIELD_CONFIG.map(f => (
              <SliderInput
                key={f.key}
                config={f}
                value={values[f.key]}
                onChange={v => handleChange(f.key, v)}
                error={fieldErrors[f.key]}
              />
            ))}
          </div>

          {/* Engineered features preview */}
          <div className="card bg-blue-900/10 border-blue-800/40">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-accent" />
              <h2 className="text-text-primary font-semibold text-sm">Engineered Features (Auto-computed)</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-text-secondary text-xs">Power Load (V × A)</p>
                <p className="text-text-primary font-semibold">{(values.voltage * values.current).toFixed(3)} W</p>
              </div>
              <div>
                <p className="text-text-secondary text-xs">Workload (CPU × Mem)</p>
                <p className="text-text-primary font-semibold">{(values.cpu_utilization * values.memory_usage).toFixed(1)}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="card border-danger/40 bg-red-900/10">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="text-danger mt-0.5 shrink-0" />
                <p className="text-danger text-sm">{error}</p>
              </div>
            </div>
          )}

          <button
            onClick={handlePredict}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Predicting…</>
            ) : (
              <><Thermometer size={18} /> Predict CPU Temperature</>
            )}
          </button>
        </div>

        {/* Result panel */}
        <div className="xl:col-span-2 space-y-4">
          <div className="card">
            <h2 className="text-text-primary font-semibold text-sm mb-4">Prediction Result</h2>

            {!result && !loading && (
              <div className="text-center py-10 text-text-secondary">
                <Thermometer size={40} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Set parameters and click predict</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-10 text-text-secondary">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm">Running model…</p>
              </div>
            )}

            {result && (
              <div className="space-y-5">
                <ThermalGauge temperature={result.predicted_temperature} />

                <div className={`flex items-start gap-2 p-3 rounded-lg border ${
                  result.thermal_level === 'normal' ? 'bg-green-900/20 border-green-700/40' :
                  result.thermal_level === 'warning' ? 'bg-amber-900/20 border-amber-700/40' :
                  'bg-red-900/20 border-red-700/40'
                }`}>
                  {StatusIcon && <StatusIcon size={16} className={`${statusColor} mt-0.5 shrink-0`} />}
                  <p className={`${statusColor} text-sm font-medium`}>{result.thermal_status}</p>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Model Used', value: result.model_used },
                    { label: 'Predicted Temperature', value: `${result.predicted_temperature} °C` },
                    { label: 'Power Load', value: `${result.power_load.toFixed(3)} W` },
                    { label: 'Workload Index', value: result.workload.toFixed(1) },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between py-1.5 border-b border-card-border/50">
                      <span className="text-text-secondary text-xs">{item.label}</span>
                      <span className="text-text-primary text-xs font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Thresholds guide */}
          <div className="card">
            <h2 className="text-text-primary font-semibold text-sm mb-3">Thermal Thresholds</h2>
            <div className="space-y-2">
              {[
                { label: 'Normal', range: '< 60°C', color: 'text-success', bg: 'bg-green-900/20 border-green-700/40', desc: 'Standard fan profile' },
                { label: 'Warning', range: '60°C – 80°C', color: 'text-warning', bg: 'bg-amber-900/20 border-amber-700/40', desc: 'Increased fan speed' },
                { label: 'Critical', range: '> 80°C', color: 'text-danger', bg: 'bg-red-900/20 border-red-700/40', desc: 'Thermal throttling risk' },
              ].map(t => (
                <div key={t.label} className={`flex items-center justify-between p-2.5 rounded-lg border ${t.bg}`}>
                  <div>
                    <span className={`font-semibold text-xs ${t.color}`}>{t.label}</span>
                    <span className="text-text-secondary text-xs"> · {t.desc}</span>
                  </div>
                  <span className="text-text-secondary text-xs">{t.range}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="card border-card-border/60 bg-card/50">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-text-secondary mt-0.5 shrink-0" />
              <p className="text-text-secondary text-xs leading-relaxed">
                This is a machine learning estimate based on training data patterns.
                It does not replace hardware safety monitoring, BIOS thermal protection,
                or physical server diagnostics. Dataset temperatures are synthetically generated
                and may exceed physical server T_j Max limits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
