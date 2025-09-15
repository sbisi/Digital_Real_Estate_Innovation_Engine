import { Button } from "@/components/ui/button";
import { Search, Plus, TrendingUp, Lightbulb, Cog, BarChart3, Activity, Menu } from 'lucide-react'
import { useState } from 'react'

const Header = ({ activeModule, setActiveModule }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const modules = [
    { id: 'explore', name: 'Explore & Select', icon: Search, color: 'bg-green-600' },
    { id: 'add', name: 'Add & Connect', icon: Plus, color: 'bg-blue-600' },
    { id: 'rate', name: 'Rate & Create', icon: TrendingUp, color: 'bg-orange-600' },
    { id: 'ideate', name: 'Ideate & Realize', icon: Lightbulb, color: 'bg-purple-600' },
    { id: 'dashboard', name: 'Trend Dashboard', icon: BarChart3, color: 'bg-teal-600' },
    { id: 'analytics', name: 'Trend Analytics', icon: Activity, color: 'bg-pink-600' }
  ]

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-full mx-auto">
        {/* Main header */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          {/* Top row: Title and Logo */}
          <div className="flex justify-between items-center mb-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Digital Real Estate Innovation Engine
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Powered by AI & Data Analytics
              </p>
            </div>
            
            {/* Right: Logo and Settings */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              <img 
                src="/pom-logo.png" 
                alt="pom+ Logo" 
                className="h-10 w-auto"
              />
              <Button variant="ghost" size="sm" className="hidden sm:flex">
                <Cog className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="sm:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Navigation - Desktop - Left aligned under title */}
          <div className="hidden sm:block">
            <nav className="flex justify-start space-x-1">
              {modules.map((module) => {
                const Icon = module.icon
                const isActive = activeModule === module.id
                return (
                  <Button
                    key={module.id}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => setActiveModule(module.id)}
                    className={`flex items-center space-x-2 px-4 py-2 relative ${
                      isActive ? module.color + ' text-white hover:opacity-90' : 'hover:bg-gray-50'
                    }`}
                    size="sm"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{module.name}</span>
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-current rounded-full"></div>
                    )}
                  </Button>
                )
              })}
            </nav>
          </div>
        </div>
        
        {/* Navigation - Mobile */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-gray-50">
            <nav className="px-4 py-2 space-y-1">
              {modules.map((module) => {
                const Icon = module.icon
                const isActive = activeModule === module.id
                return (
                  <Button
                    key={module.id}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => {
                      setActiveModule(module.id)
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full justify-start space-x-3 ${
                      isActive ? module.color + ' text-white' : ''
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{module.name}</span>
                  </Button>
                )
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header

