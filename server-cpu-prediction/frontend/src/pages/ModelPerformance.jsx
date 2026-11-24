import { useState, useEffect } from 'react'
import {
  ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, Cell
} from 'recharts'
import { Trophy, TrendingUp, AlertCircle } from 'lucide-react'
import { getMetrics } from '../services/api'

const COLORS = { 'Random Forest': '#3B82F6', 'Decision Tree (Shallow)': '#F59E0B', 'Linear Regression': '#94A3B8' }

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-card-border rounded-lg p-3 text-xs shadow-lg">
        {label && <p className="text-text-secondary mb-1">{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || p.fill }}>{p.name}: <span className="font-semibold">{typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</span></p>
        ))}
      </div>
    )
  }
  return null
}

function MetricCard({ model, metrics, best }) {
  const color = COLORS[model] || '#3B82F6'
  const isBest = best === model
  return (
    <div className={`card ${isBest ? 'border-blue-600/60 bg-blue-900/10' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-text-primary font-semibold text-sm">{model}</span>
            {isBest && (
              <span className="flex items-center gap-1 bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full border border-primary/30">
                <Trophy size={10} /> Best
              </span>
            )}
          </div>
        </div>
        <div className="w-3 h-3 rounded-full mt-1" style={{ background: color }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Test R²', value: metrics.r2?.toFixed(4) },
          { label: 'RMSE (°C)', value: metrics.rmse?.toFixed(2) },
          { label: 'MSE', value: metrics.mse?.toFixed(2) },
          { label: 'MAPE', value: `${metrics.mape?.toFixed(1)}%` },
          { label: 'CV R² (5-fold)', value: `${metrics.cv_r2_mean?.toFixed(4)} ± ${metrics.cv_r2_std?.toFixed(4)}` },
          { label: 'Train R²', value: metrics.train_r2?.toFixed(4) },
        ].map(m => (
          <div key={m.label}>
            <p className="text-text-secondary text-xs">{m.label}</p>
            <p className="text-text-primary font-semibold text-sm">{m.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ModelPerformance() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedModel, setSelectedModel] = useState('Random Forest')

  useEffect(() => {
    getMetrics()
      .then(res => {
        setData(res.data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Failed to load metrics.')
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-text-secondary text-sm">Loading metrics…</div>
  if (error) return (
    <div className="card max-w-md mx-auto mt-16 text-center">
      <AlertCircle size={28} className="text-warning mx-auto mb-3" />
      <p className="text-text-primary font-semibold">{error}</p>
      <p className="text-text-secondary text-xs mt-2 font-mono bg-bg rounded px-3 py-2">cd backend && python train.py</p>
    </div>
  )

  const metrics = data.model_metrics || {}
  const avp = data.actual_vs_predicted || {}
  const bestModel = Object.entries(metrics).sort((a, b) => b[1].r2 - a[1].r2)[0]?.[0] || 'Random Forest'

  // Comparison bar chart data
  const comparisonData = [
    { metric: 'R²', ...Object.fromEntries(Object.entries(metrics).map(([k, v]) => [k, parseFloat(v.r2?.toFixed(4))])) },
    { metric: 'CV R²', ...Object.fromEntries(Object.entries(metrics).map(([k, v]) => [k, parseFloat(v.cv_r2_mean?.toFixed(4))])) },
  ]

  const rmseData = Object.entries(metrics).map(([k, v]) => ({ model: k, rmse: parseFloat(v.rmse?.toFixed(2)), mape: parseFloat(v.mape?.toFixed(2)) }))

  // Actual vs predicted scatter
  const avpModel = avp[selectedModel] || {}
  const scatterData = (avpModel.actual || []).map((a, i) => ({ actual: parseFloat(a.toFixed(2)), predicted: parseFloat(avpModel.predicted?.[i]?.toFixed(2)) }))

  // Residuals histogram
  const residuals = avpModel.residuals || []
  const residualBins = []
  if (residuals.length) {
    const min = Math.min(...residuals), max = Math.max(...residuals)
    const nBins = 20
    const step = (max - min) / nBins
    for (let i = 0; i < nBins; i++) {
      const lo = min + i * step, hi = lo + step
      residualBins.push({ bin: lo.toFixed(1), count: residuals.filter(r => r >= lo && r < hi).length })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-primary font-bold text-xl">Model Performance</h1>
        <p className="text-text-secondary text-sm mt-1">Evaluation on the 30% held-out test set · 5-fold cross-validation · Train vs Test R² gap</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(metrics).map(([name, m]) => (
          <MetricCard key={name} model={name} metrics={m} best={bestModel} />
        ))}
      </div>

      {/* Comparison charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* R² comparison */}
        <div className="card">
          <h2 className="text-text-primary font-semibold text-sm mb-4">R² Score Comparison</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3251" />
              <XAxis dataKey="metric" tick={{ fill: '#94A3B8', fontSize: 11 }} />
              <YAxis domain={[0, 1]} tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
              {Object.keys(metrics).map(k => (
                <Bar key={k} dataKey={k} fill={COLORS[k]} radius={[3, 3, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RMSE / MAPE comparison */}
        <div className="card">
          <h2 className="text-text-primary font-semibold text-sm mb-4">RMSE & MAPE by Model</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={rmseData} layout="vertical" margin={{ left: 100, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3251" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <YAxis type="category" dataKey="model" tick={{ fill: '#94A3B8', fontSize: 10 }} width={110} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }} />
              <Bar dataKey="rmse" name="RMSE (°C)" fill="#3B82F6" radius={[0, 3, 3, 0]} />
              <Bar dataKey="mape" name="MAPE (%)" fill="#F59E0B" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actual vs Predicted */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-text-primary font-semibold text-sm">Actual vs Predicted Temperature</h2>
          <div className="flex gap-2">
            {Object.keys(metrics).map(m => (
              <button
                key={m}
                onClick={() => setSelectedModel(m)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${selectedModel === m ? 'border-primary bg-blue-900/30 text-primary' : 'border-card-border text-text-secondary hover:border-primary/50'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3251" />
              <XAxis dataKey="actual" name="Actual °C" tick={{ fill: '#94A3B8', fontSize: 10 }} label={{ value: 'Actual Temperature (°C)', position: 'insideBottom', offset: -5, fill: '#94A3B8', fontSize: 10 }} />
              <YAxis dataKey="predicted" name="Predicted °C" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name={selectedModel} data={scatterData} fill={COLORS[selectedModel]} opacity={0.65} r={3} />
              {/* Ideal line approximation via reference */}
              <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 300, y: 300 }]} stroke="#EF4444" strokeDasharray="6 3" strokeWidth={2} label={{ value: 'Ideal', fill: '#EF4444', fontSize: 10 }} ifOverflow="extendDomain" />
            </ScatterChart>
          </ResponsiveContainer>

          {/* Residual distribution */}
          <div>
            <p className="text-text-secondary text-xs mb-3">Residual Distribution ({selectedModel})</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={residualBins}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3251" />
                <XAxis dataKey="bin" tick={{ fill: '#94A3B8', fontSize: 10 }} interval={4} label={{ value: 'Residual (°C)', position: 'insideBottom', offset: -5, fill: '#94A3B8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x="0" stroke="#EF4444" strokeDasharray="4 2" />
                <Bar dataKey="count" name="Frequency" fill={COLORS[selectedModel]} radius={[2, 2, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Overfitting diagnostic */}
      <div className="card">
        <h2 className="text-text-primary font-semibold text-sm mb-3">Overfitting Diagnostic — Train vs Test R²</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border">
                {['Model', 'Train R²', 'Test R²', 'R² Gap', 'Assessment'].map(col => (
                  <th key={col} className="text-left text-text-secondary font-medium text-xs py-2 pr-6">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(metrics).map(([name, m]) => {
                const gap = (m.train_r2 - m.test_r2)
                const assessment = gap < 0.02 ? '✅ Good fit' : gap < 0.05 ? '⚠️ Slight overfit' : '🔴 Overfit'
                return (
                  <tr key={name} className="border-b border-card-border/50 hover:bg-card-border/20">
                    <td className="py-2.5 pr-6 font-medium text-text-primary text-xs">{name}</td>
                    <td className="py-2.5 pr-6 text-text-primary text-xs">{m.train_r2?.toFixed(4)}</td>
                    <td className="py-2.5 pr-6 text-primary font-semibold text-xs">{m.test_r2?.toFixed(4)}</td>
                    <td className="py-2.5 pr-6 text-text-secondary text-xs">{gap.toFixed(4)}</td>
                    <td className="py-2.5 text-xs">{assessment}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 p-3 bg-blue-900/10 border border-blue-800/40 rounded-lg">
          <p className="text-text-secondary text-xs">
            <span className="text-primary font-semibold">Random Forest</span> achieves the best balance — R²={metrics['Random Forest']?.test_r2?.toFixed(4)},
            RMSE={metrics['Random Forest']?.rmse?.toFixed(2)}°C, with a small train/test gap of {((metrics['Random Forest']?.train_r2 || 0) - (metrics['Random Forest']?.test_r2 || 0)).toFixed(4)} indicating good generalization.
            CPU_Utilization is the dominant predictor (~56.8% importance), followed by Ambient_Temperature (~21.9%).
          </p>
        </div>
      </div>
    </div>
  )
}
