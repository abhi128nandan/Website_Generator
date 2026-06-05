import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 blur-[120px] rounded-full mix-blend-screen" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-rose-600/20 blur-[120px] rounded-full mix-blend-screen" />
            
            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-sm font-medium mb-8 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                frontend-app
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300 mb-6 tracking-tight">
                BasicCalcApp
              </h1>
              <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                A next-generation platform featuring Perform addition, subtraction, multiplication, and division operations, Support decimal number calculations, Handle clear (C) and backspace operations and more.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {arch && arch.pages && arch.pages.length > 0 ? (
                  <Link to={arch.pages[0].route} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all hover:shadow-[0_0_40px_8px_rgba(79,70,229,0.3)] hover:-translate-y-1">
                    Launch Dashboard
                  </Link>
                ) : null}
                <button className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold transition-all backdrop-blur-sm">
                  Documentation
                </button>
              </div>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
