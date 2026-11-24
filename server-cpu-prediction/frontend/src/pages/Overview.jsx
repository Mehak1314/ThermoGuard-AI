import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Thermometer, Cpu, MemoryStick, Activity, AlertCircle } from 'lucide-react'
import { getMetrics, getDatasetStats } from '../services/api'

function StatCard({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-secondary text-xs font-medium uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center`} style={{ background: `${color}18` }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-text-primary">{value}</span>
        {unit && <span className="text-text-secondary text-sm">{unit}</span>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-card-border rounded-lg p-3 text-xs shadow-lg">
        <p className="text-text-secondary mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-semibold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span></p>
        ))}
      </div>
    )
  }
  return null
}

export default function Overview() {
  const [metrics, setMetrics] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getMetrics(), getDatasetStats()])
      .then(([metricsRes, statsRes]) => {
        setMetrics(metricsRes.data)
        setStats(statsRes.data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.response?.data?.detail || 'Failed to load data. Make sure models are trained.')
        setLoading(false)
      })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-text-secondary">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p>Loading dashboard…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center card max-w-md">
        <AlertCircle size={32} className="text-warning mx-auto mb-3" />
        <p className="text-text-primary font-semibold mb-1">Backend not ready</p>
        <p className="text-text-secondary text-sm">{error}</p>
        <p className="text-text-secondary text-xs mt-3 font-mono bg-bg rounded px-3 py-2">cd backend && python train.py</p>
      </div>
    </div>
  )

  const ds = metrics.dataset_stats
  const rfMetrics = metrics.model_metrics?.['Random Forest'] || {}

  // Recent records from API (we'll show a sample)
  const recentData = stats.cpu_vs_temperature?.slice(0, 10).map((d, i) => ({
    id: i + 1,
    cpu: d.cpu.toFixed(1),
    temp: d.temp.toFixed(1),
    status: d.temp < 60 ? 'normal' : d.temp < 80 ? 'warning' : 'critical'
  })) || []

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Activity} label="Total Records" value={ds.total_records?.toLocaleString()} color="#3B82F6" />
        <StatCard icon={Thermometer} label="Avg CPU Temp" value={ds.avg_temperature?.toFixed(1)} unit="°C" color="#06B6D4" />
        <StatCard icon={Thermometer} label="Max CPU Temp" value={ds.max_temperature?.toFixed(1)} unit="°C" color="#EF4444" />
        <StatCard icon={Cpu} label="Avg CPU Util" value={ds.avg_cpu_utilization?.toFixed(1)} unit="%" color="#22C55E" />
      </div>

      {/* Best Model Banner */}
      <div className="card border-blue-800/50 bg-blue-900/10">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-text-secondary text-xs uppercase tracking-wider font-medium mb-1">Best Performing Model</p>
            <p className="text-text-primary font-bold text-lg">Random Forest Regressor</p>
            <p className="text-text-secondary text-sm">300 estimators · max_depth=8 · 5-fold CV R² = {rfMetrics.cv_r2_mean?.toFixed(4)}</p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{(rfMetrics.r2 * 100)?.toFixed(1)}%</p>
              <p className="text-text-secondary text-xs">R² Score</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{rfMetrics.rmse?.toFixed(2)}°C</p>
              <p className="text-text-secondary text-xs">RMSE</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{rfMetrics.mape?.toFixed(1)}%</p>
              <p className="text-text-secondary text-xs">MAPE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Temperature Distribution */}
        <div className="card">
          <h2 className="text-text-primary font-semibold text-sm mb-4">Temperature Distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats.temperature_distribution}>
              <defs>
                <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3251" />
              <XAxis dataKey="bin" tick={{ fill: '#94A3B8', fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" name="Records" stroke="#3B82F6" fill="url(#tempGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* CPU Utilization vs Temperature */}
        <div className="card">
          <h2 className="text-text-primary font-semibold text-sm mb-4">CPU Utilization vs Temperature</h2>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3251" />
              <XAxis dataKey="cpu" name="CPU %" tick={{ fill: '#94A3B8', fontSize: 10 }} label={{ value: 'CPU Util (%)', position: 'insideBottom', offset: -5, fill: '#94A3B8', fontSize: 10 }} />
              <YAxis dataKey="temp" name="Temp °C" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="CPU vs Temp" data={stats.cpu_vs_temperature} fill="#06B6D4" opacity={0.6} r={3} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Memory Usage vs Temperature */}
        <div className="card">
          <h2 className="text-text-primary font-semibold text-sm mb-4">Memory Usage vs Temperature</h2>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3251" />
              <XAxis dataKey="memory" name="Memory %" tick={{ fill: '#94A3B8', fontSize: 10 }} label={{ value: 'Memory Usage (%)', position: 'insideBottom', offset: -5, fill: '#94A3B8', fontSize: 10 }} />
              <YAxis dataKey="temp" name="Temp °C" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Memory vs Temp" data={stats.memory_vs_temperature} fill="#22C55E" opacity={0.6} r={3} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Feature Importance */}
        <div className="card">
          <h2 className="text-text-primary font-semibold text-sm mb-4">Feature Importance (Random Forest)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={Object.entries(metrics.feature_importance || {})
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => ({ feature: k.replace('_', ' '), importance: parseFloat((v * 100).toFixed(2)) }))}
              layout="vertical"
              margin={{ left: 60, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3251" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94A3B8', fontSize: 10 }} unit="%" />
              <YAxis type="category" dataKey="feature" tick={{ fill: '#94A3B8', fontSize: 10 }} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="importance" name="Importance %" fill="#3B82F6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent records */}
      <div className="card">
        <h2 className="text-text-primary font-semibold text-sm mb-4">Sample Dataset Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border">
                {['#', 'CPU Util (%)', 'Temperature (°C)', 'Status'].map(col => (
                  <th key={col} className="text-left text-text-secondary font-medium text-xs py-2 pr-4">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentData.map(row => (
                <tr key={row.id} className="border-b border-card-border/50 hover:bg-card-border/20 transition-colors">
                  <td className="py-2 pr-4 text-text-secondary">{row.id}</td>
                  <td className="py-2 pr-4 text-text-primary">{row.cpu}%</td>
                  <td className="py-2 pr-4 text-text-primary">{row.temp}°C</td>
                  <td className="py-2 pr-4">
                    <span className={`badge-${row.status}`}>
                      {row.status === 'normal' ? '✅ Normal' : row.status === 'warning' ? '⚠️ Warning' : '🔴 Critical'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
