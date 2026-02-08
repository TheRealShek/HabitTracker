import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import BulkSetModal from './BulkSetModal'
import TimeBlockingSchedule from './TimeBlockingSchedule'

const Dashboard = ({ onLogout }) => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [filterWeek, setFilterWeek] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })

    if (filterWeek) {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 })
      const end = endOfWeek(new Date(), { weekStartsOn: 1 })
      query = query.gte('timestamp', start.toISOString()).lte('timestamp', end.toISOString())
    }

    const { data, error } = await query

    if (!error && data) {
      setLogs(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLogs()

    // Subscribe to realtime changes
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
          fetchLogs()
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [filterWeek])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between bg-surface rounded-full px-4 py-2 border border-border shadow-sm">
            {/* Left - Logo and App Name */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <span className="text-white text-base font-bold">⏱</span>
              </div>
              <span className="text-base font-semibold text-text-primary">HabitTracker</span>
            </div>
            
            {/* Center - Stats */}
            <div className="flex gap-6 items-center">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-secondary">Total:</span>
                <span className="text-sm font-bold text-text-primary">{logs.length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-secondary">Logged:</span>
                <span className="text-sm font-bold text-accent">{logs.filter((l) => !l.is_skipped).length}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-text-secondary">Skipped:</span>
                <span className="text-sm font-bold text-red-400">{logs.filter((l) => l.is_skipped).length}</span>
              </div>
            </div>
            
            {/* Right - Logout */}
            <button
              onClick={onLogout}
              className="px-4 py-1.5 text-xs bg-background hover:bg-accent/10 text-text-secondary hover:text-accent rounded-full transition-all border border-border hover:border-accent/50 font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Controls */}
        <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-2 items-center">
            <button
              onClick={fetchLogs}
              className="p-1.5 bg-surface hover:bg-background text-text-secondary rounded-lg transition-colors border border-border"
              title="Refresh"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-3 py-1.5 text-sm bg-surface hover:bg-accent/10 text-text-secondary hover:text-accent rounded-lg transition-all border border-border hover:border-accent/50 font-medium"
            >
              + Bulk Set
            </button>
          </div>
          
          <button
            onClick={() => setFilterWeek(!filterWeek)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
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
          <TimeBlockingSchedule logs={logs} />
        )}
      </main>

      {showBulkModal && (
        <BulkSetModal onClose={() => setShowBulkModal(false)} onSuccess={fetchLogs} />
      )}
    </div>
  )
}

export default Dashboard
