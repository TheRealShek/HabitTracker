import React, { useState } from 'react'
import { supabase } from '../supabaseClient'
import { format } from 'date-fns'

const BulkSetModal = ({ onClose, onSuccess }) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Generate time slots from 1:00 PM to 6:00 PM (every 30 minutes)
      const entries = []
      const date = new Date(selectedDate)

      for (let hour = 13; hour < 18; hour++) {
        for (let minute of [0, 30]) {
          const timestamp = new Date(date)
          timestamp.setHours(hour, minute, 0, 0)
          
          entries.push({
            user_id: user.id,
            timestamp: timestamp.toISOString(),
            activity: 'College time',
            is_skipped: false,
          })
        }
      }

      // Add the final 6:00 PM entry
      const finalEntry = new Date(date)
      finalEntry.setHours(18, 0, 0, 0)
      entries.push({
        user_id: user.id,
        timestamp: finalEntry.toISOString(),
        activity: 'College time',
        is_skipped: false,
      })

      const { error: insertError } = await supabase.from('time_logs').insert(entries)

      if (insertError) {
        throw insertError
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create entries')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-surface p-8 rounded-lg shadow-2xl w-full max-w-md border border-border">
        <h2 className="text-2xl font-bold text-text-primary mb-4">
          Set College Time (1-6 PM)
        </h2>
        
        <p className="text-text-secondary mb-6">
          This will create entries for every 30-minute slot from 1:00 PM to 6:00 PM with the activity "College time".
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
            <p className="text-sm text-text-secondary">
              <strong className="text-accent">11 entries</strong> will be created:
            </p>
            <p className="text-xs text-text-secondary mt-2">
              1:00 PM, 1:30 PM, 2:00 PM, 2:30 PM, 3:00 PM, 3:30 PM, 4:00 PM, 4:30 PM, 5:00 PM, 5:30 PM, 6:00 PM
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-accent hover:bg-accent/90 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
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
