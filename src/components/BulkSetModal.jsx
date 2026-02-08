import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { format } from 'date-fns'
import { useBulkInsertTimeLogs } from '../hooks/useTimeLogs'

const BulkSetModal = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState('college') // 'college' or 'custom'
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState('13:00')
  const [endTime, setEndTime] = useState('18:00')
  const [activity, setActivity] = useState('College time')
  const [activities, setActivities] = useState([])
  const [error, setError] = useState('')
  
  const bulkInsertMutation = useBulkInsertTimeLogs()

  useEffect(() => {
    // Load custom activities from localStorage
    const saved = localStorage.getItem('customActivities')
    if (saved) {
      setActivities(JSON.parse(saved))
    }
  }, [])

  // Calculate how many entries will be created
  const calculateEntryCount = () => {
    if (mode === 'college') return 11
    
    const [startHour, startMin] = startTime.split(':').map(Number)
    const [endHour, endMin] = endTime.split(':').map(Number)
    
    const startMinutes = startHour * 60 + startMin
    const endMinutes = endHour * 60 + endMin
    
    if (endMinutes <= startMinutes) return 0
    
    return Math.floor((endMinutes - startMinutes) / 30) + 1
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Parse the selected date in local timezone to avoid timezone shifts
      const [year, month, day] = selectedDate.split('-').map(Number)
      
      const entries = []

      if (mode === 'college') {
        // Generate time slots from 1:00 PM to 6:00 PM (every 30 minutes)
        for (let hour = 13; hour <= 18; hour++) {
          for (let minute of [0, 30]) {
            if (hour === 18 && minute === 30) break // Stop at 6:00 PM
            
            // Create date in local timezone
            const timestamp = new Date(year, month - 1, day, hour, minute, 0, 0)
            
            entries.push({
              user_id: user.id,
              timestamp: timestamp.toISOString(),
              activity: 'College time',
              is_skipped: false,
            })
          }
        }
      } else {
        // Custom time range
        const [startHour, startMin] = startTime.split(':').map(Number)
        const [endHour, endMin] = endTime.split(':').map(Number)
        
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        
        if (endMinutes <= startMinutes) {
          setError('End time must be after start time')
          return
        }
        
        if (!activity.trim()) {
          setError('Activity name is required')
          return
        }
        
        // Generate entries for every 30 minutes
        for (let minutes = startMinutes; minutes <= endMinutes; minutes += 30) {
          const hour = Math.floor(minutes / 60)
          const min = minutes % 60
          
          // Create date in local timezone using the date constructor
          const timestamp = new Date(year, month - 1, day, hour, min, 0, 0)
          
          entries.push({
            user_id: user.id,
            timestamp: timestamp.toISOString(),
            activity: activity.trim(),
            is_skipped: false,
          })
        }
      }

      if (entries.length === 0) {
        setError('No entries to create')
        return
      }

      await bulkInsertMutation.mutateAsync(entries)

      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create entries')
    }
  }

  const entryCount = calculateEntryCount()

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-surface p-6 sm:p-8 rounded-lg shadow-2xl w-full max-w-md border border-border max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
          Bulk Set Activities
        </h2>
        
        {/* Mode Selection */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('college')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'college'
                ? 'bg-accent text-white'
                : 'bg-background text-text-secondary border border-border hover:bg-border'
            }`}
          >
            College Time
          </button>
          <button
            type="button"
            onClick={() => setMode('custom')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'custom'
                ? 'bg-accent text-white'
                : 'bg-background text-text-secondary border border-border hover:bg-border'
            }`}
          >
            Custom Range
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Selection */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-text-secondary mb-2">
              Select Date
            </label>
            <input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>

          {mode === 'college' ? (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
              <p className="text-sm text-text-secondary">
                Sets <strong className="text-accent">1:00 PM - 6:00 PM</strong> as "College time"
              </p>
              <p className="text-xs text-text-secondary mt-2">
                11 entries: 1:00 PM, 1:30 PM, 2:00 PM, 2:30 PM, 3:00 PM, 3:30 PM, 4:00 PM, 4:30 PM, 5:00 PM, 5:30 PM, 6:00 PM
              </p>
            </div>
          ) : (
            <>
              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-text-secondary mb-2">
                    Start Time
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-text-secondary mb-2">
                    End Time
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                    required
                  />
                </div>
              </div>

              {/* Activity Selection */}
              <div>
                <label htmlFor="activity" className="block text-sm font-medium text-text-secondary mb-2">
                  Activity
                </label>
                <div className="relative">
                  <select
                    id="activity"
                    value={activity}
                    onChange={(e) => setActivity(e.target.value)}
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent appearance-none cursor-pointer pr-10"
                    required
                  >
                    <option value="College time">College time</option>
                    {activities.map((act) => (
                      <option key={act} value={act}>
                        {act}
                      </option>
                    ))}
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary"
                    width="12"
                    height="8"
                    viewBox="0 0 12 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-xs text-text-secondary mt-2">
                  Or type custom activity name directly
                </p>
              </div>

              {/* Entry Count Preview */}
              {entryCount > 0 && (
                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                  <p className="text-sm text-text-secondary">
                    <strong className="text-accent">{entryCount} entries</strong> will be created (every 30 minutes)
                  </p>
                </div>
              )}
            </>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={bulkInsertMutation.isPending || (mode === 'custom' && entryCount === 0)}
              className="flex-1 bg-accent hover:bg-accent/90 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkInsertMutation.isPending ? 'Creating...' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={bulkInsertMutation.isPending}
              className="px-6 bg-background hover:bg-border text-text-secondary font-medium py-2 rounded-lg transition-colors border border-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BulkSetModal
