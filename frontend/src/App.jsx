import { useState } from 'react'
import Header from './components/Header.jsx'
import ExploreSelect from './components/modules/ExploreSelect.jsx'
import AddConnect from './components/modules/AddConnect.jsx'
import RateCreate from './components/modules/RateCreate.jsx'
import IdeateRealize from './components/modules/IdeateRealize.jsx'
import TrendDashboard from './components/modules/TrendDashboard.jsx'
import TrendAnalytics from './components/modules/TrendAnalytics.jsx'
import './App.css'

// AddConnect-Page einbauen
import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import AddConnectPage from "@/pages/AddConnectPage";

function Home() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Home</h1>
      <Link className="underline text-blue-600" to="/add">→ Add & Connect</Link>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/add" element={<AddConnectPage />} />
    </Routes>
  );
}

function App() {
  const [activeModule, setActiveModule] = useState('explore')

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'explore':
        return <ExploreSelect />
      case 'add':
        return <AddConnect />
      case 'rate':
        return <RateCreate />
      case 'ideate':
        return <IdeateRealize />
      case 'dashboard':
        return <TrendDashboard />
      case 'analytics':
        return <TrendAnalytics />
      default:
        return <ExploreSelect />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeModule={activeModule} setActiveModule={setActiveModule} />
      <main>
        {renderActiveModule()}
      </main>
    </div>
  )
}

export default App

