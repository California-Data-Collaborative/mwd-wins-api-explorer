import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/common/Layout'
import { Dashboard } from './pages/Dashboard'
import { AgencyExplorer } from './pages/AgencyExplorer'
import { MeterExplorer } from './pages/MeterExplorer'
import { CapacityCharge } from './pages/CapacityCharge'
import { ApiPlayground } from './pages/ApiPlayground'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/agencies" element={<AgencyExplorer />} />
        <Route path="/meters" element={<MeterExplorer />} />
        <Route path="/capacity-charge" element={<CapacityCharge />} />
        <Route path="/playground" element={<ApiPlayground />} />
        {/* Redirect old interval route to meters */}
        <Route path="/interval" element={<Navigate to="/meters" replace />} />
      </Routes>
    </Layout>
  )
}

export default App
