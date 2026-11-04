import { Routes, Route } from 'react-router-dom'
import './App.css'
import PublicationsPage from './pages/PublicationsPage'
import GlimpsesPage from './pages/GlimpsesPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicationsPage />} />
      <Route path="/publications" element={<PublicationsPage />} />
      <Route path="/glimpse" element={<GlimpsesPage />} />
    </Routes>
  )
}

export default App