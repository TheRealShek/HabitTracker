import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useInsertTimeLog } from '../hooks/useTimeLogs'

const NotificationModal = ({ timestamp, onClose }) => {
  const [activity, setActivity] = useState('')
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes in seconds
  const [activities, setActivities] = useState([])
  
  const insertMutation = useInsertTimeLog()

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
    // Countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSkip()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { data: { user } } = await supabase.auth.getUser()

    await insertMutation.mutateAsync({
      user_id: user.id,
      timestamp: timestamp.toISOString(),
      activity: activity.trim(),
      is_skipped: false,
    })

    onClose()
  }

  const handleSkip = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    await insertMutation.mutateAsync({
      user_id: user.id,
      timestamp: timestamp.toISOString(),
      activity: null,
      is_skipped: true,
    })

    onClose()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-3 sm:px-4">
      <div className="bg-surface p-4 sm:p-8 rounded-lg shadow-2xl w-full max-w-md border border-border">
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-text-primary">
            What did you do?
          </h2>
          <div className={`text-base sm:text-lg font-mono ${timeLeft <= 30 ? 'text-red-400' : 'text-accent'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <p className="text-text-secondary mb-4 sm:mb-6 text-sm sm:text-base">
          Log your activity for the last 30 minutes
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div>
            <label className="text-xs sm:text-sm text-text-secondary mb-2 block font-medium">Select or type activity</label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent mb-3 appearance-none cursor-pointer hover:bg-surface transition-colors shadow-sm"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23B5B8BD' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 1rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '3rem'
              }}
              autoFocus
            >
              <option value="" className="bg-background text-text-secondary">-- Select Activity --</option>
              {activities.length === 0 && (
                <option value="" disabled className="bg-background text-text-secondary italic">No activities - Add via Edit Activities</option>
              )}
              {activities.map((act) => (
                <option key={act} value={act} className="bg-background text-text-primary py-2">
                  {act}
                </option>
              ))}
            </select>
            
            <textarea
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="Or type a custom activity..."
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none hover:bg-surface transition-colors shadow-sm"
              rows="3"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={insertMutation.isPending || !activity.trim()}
              className="flex-1 bg-accent hover:bg-accent/90 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {insertMutation.isPending ? 'Saving...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={insertMutation.isPending}
              className="px-6 bg-background hover:bg-border text-text-secondary font-medium py-2 rounded-lg transition-colors border border-border disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-text-secondary text-center">
          This will be marked as ❌ if not submitted within {formatTime(timeLeft)}
        </div>
      </div>
    </div>
  )
}

export default NotificationModal
