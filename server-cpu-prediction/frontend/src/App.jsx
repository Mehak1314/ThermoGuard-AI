import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Overview from './pages/Overview'
import DatasetExplorer from './pages/DatasetExplorer'
import ModelPerformance from './pages/ModelPerformance'
import TemperaturePrediction from './pages/TemperaturePrediction'
import AboutProject from './pages/AboutProject'
import { healthCheck } from './services/api'

export default function App() {
  const [page, setPage] = useState('overview')
  const [backendStatus, setBackendStatus] = useState('checking')
  const [modelsLoaded, setModelsLoaded] = useState(false)

  useEffect(() => {
    healthCheck()
      .then(res => {
        setBackendStatus('online')
        setModelsLoaded(res.data.models_loaded)
      })
      .catch(() => setBackendStatus('offline'))
  }, [])

  const renderPage = () => {
    switch (page) {
      case 'overview': return <Overview />
      case 'dataset': return <DatasetExplorer />
      case 'performance': return <ModelPerformance />
      case 'predict': return <TemperaturePrediction />
      case 'about': return <AboutProject />
      default: return <Overview />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar activePage={page} onNavigate={setPage} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar backendStatus={backendStatus} modelsLoaded={modelsLoaded} />
        <main className="flex-1 overflow-y-auto p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}
