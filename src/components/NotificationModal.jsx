import React, { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const NotificationModal = ({ timestamp, onClose }) => {
  const [activity, setActivity] = useState('')
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes in seconds

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
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('time_logs').insert([
      {
        user_id: user.id,
        timestamp: timestamp.toISOString(),
        activity: activity.trim(),
        is_skipped: false,
      },
    ])

    setLoading(false)
    onClose()
  }

  const handleSkip = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('time_logs').insert([
      {
        user_id: user.id,
        timestamp: timestamp.toISOString(),
        activity: null,
        is_skipped: true,
      },
    ])

    onClose()
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-surface p-8 rounded-lg shadow-2xl w-full max-w-md border border-border">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-text-primary">
            What did you do?
          </h2>
          <div className={`text-lg font-mono ${timeLeft <= 30 ? 'text-red-400' : 'text-accent'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <p className="text-text-secondary mb-6">
          Log your activity for the last 30 minutes
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <textarea
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="Enter your activity..."
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              rows="4"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !activity.trim()}
              className="flex-1 bg-accent hover:bg-accent/90 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              disabled={loading}
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
