import { useState, useEffect } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { getDataset, getDatasetStats } from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-card-border rounded-lg p-3 text-xs shadow-lg">
        <p className="text-text-secondary mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-semibold">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span></p>
        ))}
      </div>
    )
  }
  return null
}

const COLUMNS = ['CPU_Utilization', 'Memory_Usage', 'Clock_Speed', 'Ambient_Temperature', 'Voltage', 'Current', 'Temperature']

export default function DatasetExplorer() {
  const [records, setRecords] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [selectedCol, setSelectedCol] = useState('Temperature')

  useEffect(() => {
    setLoading(true)
    getDataset(page, 50, search)
      .then(res => {
        setRecords(res.data.records)
        setTotalPages(res.data.total_pages)
        setTotalRecords(res.data.total_records)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page, search])

  useEffect(() => {
    getDatasetStats().then(res => setStats(res.data)).catch(() => {})
  }, [])

  const handleSearch = e => {
    setSearch(e.target.value)
    setPage(1)
  }

  const descStats = stats?.descriptive_stats || {}
  const colStats = descStats[selectedCol] || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-text-primary font-bold text-xl">Dataset Explorer</h1>
        <p className="text-text-secondary text-sm mt-1">Explore the 6,000-record server CPU telemetry dataset</p>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Records', value: totalRecords.toLocaleString() },
          { label: 'Features', value: '6 Raw + 2 Engineered' },
          { label: 'Missing Values', value: '0' },
          { label: 'Target Column', value: 'Temperature (°C)' },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-text-secondary text-xs">{s.label}</p>
            <p className="text-text-primary font-semibold text-sm mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Distribution chart + col selector */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-text-primary font-semibold text-sm">Feature Distribution</h2>
              <select
                value={selectedCol}
                onChange={e => setSelectedCol(e.target.value)}
                className="input-field w-auto text-xs"
              >
                {COLUMNS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.temperature_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E3251" />
                <XAxis dataKey="bin" tick={{ fill: '#94A3B8', fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Frequency" fill="#06B6D4" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Descriptive stats */}
          <div className="card">
            <h2 className="text-text-primary font-semibold text-sm mb-3">Statistics: {selectedCol}</h2>
            {Object.keys(colStats).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(colStats).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm">
                    <span className="text-text-secondary capitalize">{k}</span>
                    <span className="text-text-primary font-medium">{typeof v === 'number' ? v.toFixed(3) : v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary text-sm">Select a column to view statistics</p>
            )}
          </div>
        </div>
      )}

      {/* Correlation note */}
      <div className="card border-blue-800/40 bg-blue-900/10">
        <h2 className="text-text-primary font-semibold text-sm mb-2">Correlation with Temperature</h2>
        <div className="flex flex-wrap gap-3">
          {stats?.correlation?.Temperature &&
            Object.entries(stats.correlation.Temperature)
              .filter(([k]) => k !== 'Temperature')
              .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
              .map(([k, v]) => (
                <div key={k} className="bg-card border border-card-border rounded-lg px-3 py-1.5">
                  <p className="text-text-secondary text-xs">{k.replace('_', ' ')}</p>
                  <p className={`font-bold text-sm ${Math.abs(v) > 0.3 ? 'text-primary' : 'text-text-secondary'}`}>
                    {v > 0 ? '+' : ''}{v.toFixed(3)}
                  </p>
                </div>
              ))
          }
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="text-text-primary font-semibold text-sm">Dataset Records</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Filter by value…"
              value={search}
              onChange={handleSearch}
              className="input-field pl-9 w-56"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-text-secondary text-sm">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border">
                  {COLUMNS.map(col => (
                    <th key={col} className="text-left text-text-secondary font-medium py-2 pr-5 whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((row, i) => (
                  <tr key={i} className="border-b border-card-border/40 hover:bg-card-border/20 transition-colors">
                    {COLUMNS.map(col => (
                      <td key={col} className={`py-1.5 pr-5 ${col === 'Temperature' ? 'font-semibold text-accent' : 'text-text-primary'}`}>
                        {typeof row[col] === 'number' ? row[col].toFixed(3) : row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-text-secondary text-xs">
            Page {page} of {totalPages} · {totalRecords.toLocaleString()} total records
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-40 flex items-center gap-1 text-xs py-1.5 px-3"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary disabled:opacity-40 flex items-center gap-1 text-xs py-1.5 px-3"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
