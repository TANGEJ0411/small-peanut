import { Routes, Route } from 'react-router-dom'
import { DarkModeProvider } from './context/DarkModeContext'
import NavBar from './components/NavBar'
import BottomTabBar from './components/BottomTabBar'
import HomePage from './pages/HomePage'
import RecordsPage from './pages/RecordsPage'
import DiaperPage from './pages/DiaperPage'
import BreastMilkPage from './pages/BreastMilkPage'
import SleepPage from './pages/SleepPage'
import GrowthPage from './pages/GrowthPage'
import StatusTagPage from './pages/StatusTagPage'
import AnalysisPage from './pages/AnalysisPage'
import HealthPage from './pages/HealthPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <DarkModeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <NavBar />
        <main className="max-w-lg mx-auto px-4 pt-4 pb-28">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/records/breast-milk" element={<BreastMilkPage />} />
            <Route path="/records/sleep" element={<SleepPage />} />
            <Route path="/records/diapers" element={<DiaperPage />} />
            <Route path="/records/growth" element={<GrowthPage />} />
            <Route path="/records/tags" element={<StatusTagPage />} />
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/health" element={<HealthPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <BottomTabBar />
      </div>
    </DarkModeProvider>
  )
}
