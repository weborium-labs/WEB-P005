import { Routes, Route } from 'react-router-dom'
import './App.css'
import PublicationsPage from './pages/PublicationsPage'
import GlimpsesPage from './pages/GlimpsesPage'
import LandingPage from './pages/LandingPage'
import Footer from './components/Footer'

function App() {
  return (
    <div>
      <div>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pub" element={<PublicationsPage />} />
          <Route path="/publications" element={<PublicationsPage />} />
          <Route path="/glimpse" element={<GlimpsesPage />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}

export default App