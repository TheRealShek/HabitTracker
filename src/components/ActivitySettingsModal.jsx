import React, { useState, useEffect } from 'react'

const ActivitySettingsModal = ({ onClose, onSave }) => {
  const [activities, setActivities] = useState([])
  const [newActivity, setNewActivity] = useState('')

  useEffect(() => {
    // Load activities from localStorage
    const saved = localStorage.getItem('customActivities')
    if (saved) {
      setActivities(JSON.parse(saved))
    } else {
      // Default activities
      setActivities([
        'Office Work',
        'Personal',
        'Workout',
        'Meditation',
        'Break',
        'Lunch',
        'College time'
      ])
    }
  }, [])

  const handleAdd = () => {
    if (newActivity.trim() && !activities.includes(newActivity.trim())) {
      const updated = [...activities, newActivity.trim()]
      setActivities(updated)
      setNewActivity('')
    }
  }

  const handleRemove = (activity) => {
    setActivities(activities.filter((a) => a !== activity))
  }

  const handleSave = () => {
    localStorage.setItem('customActivities', JSON.stringify(activities))
    onSave(activities)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg border border-border shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-text-primary mb-4">Activity Settings</h2>
        
        <div className="mb-4">
          <label className="text-sm text-text-secondary mb-2 block">Add New Activity</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="e.g., Reading"
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-sm text-text-secondary mb-2 block">Current Activities</label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity}
                className="flex items-center justify-between bg-background px-3 py-2 rounded-lg border border-border"
              >
                <span className="text-text-primary">{activity}</span>
                <button
                  onClick={() => handleRemove(activity)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface hover:bg-background text-text-secondary border border-border rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActivitySettingsModal
