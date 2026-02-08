import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { format } from 'date-fns'
import { useTimeLogs } from '../hooks/useTimeLogs'
import { useQueryClient } from '@tanstack/react-query'
import { timeLogKeys } from '../hooks/useTimeLogs'
import BulkSetModal from './BulkSetModal'
import TimeBlockingSchedule from './TimeBlockingSchedule'
import ActivitySettingsModal from './ActivitySettingsModal'
import ActivitySummaryTable from './ActivitySummaryTable'
import Statistics from './Statistics'

const Dashboard = ({ onLogout }) => {
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [filterWeek, setFilterWeek] = useState(true)
  const [activities, setActivities] = useState([])
  const [timeRemaining, setTimeRemaining] = useState('')
  
  // Use React Query for data fetching with caching
  const { data: logs = [], isLoading: loading, refetch } = useTimeLogs(filterWeek)
  const queryClient = useQueryClient()

  // Calculate time remaining until next prompt
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date()
      // Get current IST time
      const istHour = parseInt(now.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }))
      const istMinute = parseInt(now.toLocaleString('en-US', { minute: '2-digit', timeZone: 'Asia/Kolkata' }))
      const istSecond = parseInt(now.toLocaleString('en-US', { second: '2-digit', timeZone: 'Asia/Kolkata' }))
      
      // Check if in sleep hours (1 AM - 9 AM IST)
      if (istHour >= 1 && istHour < 9) {
        setTimeRemaining('Sleep Time')
        return
      }

      // Calculate next 30-minute slot
      let nextMinute
      if (istMinute < 30) {
        nextMinute = 30
      } else {
        nextMinute = 0 // Next hour
      }

      // Calculate seconds until next slot
      let minutesLeft, secondsLeft
      if (nextMinute === 30) {
        minutesLeft = 30 - istMinute - 1
        secondsLeft = 60 - istSecond
      } else {
        minutesLeft = 60 - istMinute - 1
        secondsLeft = 60 - istSecond
      }

      if (secondsLeft === 60) {
        secondsLeft = 0
        minutesLeft += 1
      }

      // If we're exactly at 00 or 30 minutes
      if ((istMinute === 0 || istMinute === 30) && istSecond === 0) {
        setTimeRemaining('Ready')
      } else if (minutesLeft === 0 && secondsLeft <= 5) {
        setTimeRemaining('Ready')
      } else {
        setTimeRemaining(`${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`)
      }
    }

    // Initial calculation
    updateTimer()
    
    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Load custom activities from localStorage
    const saved = localStorage.getItem('customActivities')
    if (saved) {
      setActivities(JSON.parse(saved))
    } else {
      setActivities([])
    }
  }, [])

  useEffect(() => {
    // Subscribe to realtime changes and invalidate React Query cache
    const channel = supabase
      .channel('time_logs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_logs',
        },
        () => {
          // Invalidate cache to trigger refetch
          queryClient.invalidateQueries({ queryKey: timeLogKeys.all })
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  // If showing stats, render Statistics component (AFTER all hooks)
  if (showStats) {
    return <Statistics onBack={() => setShowStats(false)} />
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-0 lg:justify-between bg-surface rounded-2xl lg:rounded-full px-3 sm:px-4 py-3 lg:py-2 border border-border shadow-sm">
            {/* Top Row on Mobile: Logo, App Name, Stats Button, Logout */}
            <div className="flex items-center justify-between lg:justify-start gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm sm:text-base font-bold">⏱</span>
                </div>
                <span className="text-sm sm:text-base font-semibold text-text-primary">HabitTracker</span>
                
                {/* Statistics Button */}
                <button
                  onClick={() => setShowStats(true)}
                  className="ml-1 sm:ml-3 p-1.5 hover:bg-accent/10 text-text-secondary hover:text-accent rounded-lg transition-colors"
                  title="View Statistics"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </button>
              </div>
              
              {/* Logout - Mobile */}
              <button
                onClick={onLogout}
                className="lg:hidden px-3 py-1.5 text-xs bg-background hover:bg-accent/10 text-text-secondary hover:text-accent rounded-full transition-all border border-border hover:border-accent/50 font-medium"
              >
                Logout
              </button>
            </div>
            
            {/* Center - Stats (2x2 Grid on Mobile, Horizontal on Desktop) */}
            <div className="grid grid-cols-2 lg:flex gap-2 sm:gap-3 lg:gap-6 items-center">
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <span className="text-xs text-text-secondary">Total:</span>
                <span className="text-xs sm:text-sm font-bold text-text-primary">{logs.length}</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <span className="text-xs text-text-secondary">Logged:</span>
                <span className="text-xs sm:text-sm font-bold text-accent">{logs.filter((l) => !l.is_skipped).length}</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center lg:justify-start">
                <span className="text-xs text-text-secondary">Skipped:</span>
                <span className="text-xs sm:text-sm font-bold text-red-400">{logs.filter((l) => l.is_skipped).length}</span>
              </div>
              <div className="hidden lg:block h-6 w-px bg-border"></div>
              <div className="flex items-center gap-1.5 justify-center lg:justify-start col-span-2 lg:col-span-1">
                <span className="text-xs text-text-secondary">Next Prompt:</span>
                <span className={`text-xs sm:text-sm font-bold font-mono ${timeRemaining === 'Ready' ? 'text-green-400' : 'text-accent'}`}>
                  {timeRemaining}
                </span>
              </div>
            </div>
            
            {/* Right - Logout (Desktop Only) */}
            <button
              onClick={onLogout}
              className="hidden lg:block px-4 py-1.5 text-xs bg-background hover:bg-accent/10 text-text-secondary hover:text-accent rounded-full transition-all border border-border hover:border-accent/50 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Controls */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => refetch()}
              className="p-1.5 bg-surface hover:bg-background text-text-secondary rounded-lg transition-colors border border-border"
              title="Refresh"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-3 py-1.5 text-xs sm:text-sm bg-surface hover:bg-accent/10 text-text-secondary hover:text-accent rounded-lg transition-all border border-border hover:border-accent/50 font-medium whitespace-nowrap"
            >
              + Bulk Set
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-3 py-1.5 text-xs sm:text-sm bg-surface hover:bg-accent/10 text-text-secondary hover:text-accent rounded-lg transition-all border border-border hover:border-accent/50 font-medium flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
              title="Activity Settings"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              <span className="hidden xs:inline">Edit Activities</span>
              <span className="xs:hidden">Activities</span>
            </button>
          </div>
          
          <button
            onClick={() => setFilterWeek(!filterWeek)}
            className={`px-3 py-1.5 text-xs sm:text-sm rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterWeek
                ? 'bg-accent text-white'
                : 'bg-surface text-text-secondary border border-border hover:bg-background'
            }`}
          >
            {filterWeek ? 'This Week' : 'All Time'}
          </button>
        </div>

        {/* Schedule View */}
        {loading ? (
          <div className="bg-surface rounded-lg border border-border p-8 text-center text-text-secondary">
            Loading...
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-surface rounded-lg border border-border p-8 text-center text-text-secondary">
            No activities logged yet. You'll be prompted every 30 minutes.
          </div>
        ) : (
          <TimeBlockingSchedule logs={logs} onUpdate={() => refetch()} activities={activities} />
        )}
      </main>

      {showSettingsModal && (
        <ActivitySettingsModal
          onClose={() => setShowSettingsModal(false)}
          onSave={(updated) => setActivities(updated)}
        />
      )}

      {showBulkModal && (
        <BulkSetModal onClose={() => setShowBulkModal(false)} onSuccess={() => refetch()} />
      )}
    </div>
  )
}

export default Dashboard
