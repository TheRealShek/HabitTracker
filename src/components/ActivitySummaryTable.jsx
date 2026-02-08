import React from 'react'

const ActivitySummaryTable = ({ logs }) => {
  // Calculate total time for each activity (each log = 30 minutes)
  const calculateActivityTotals = () => {
    const activityMap = {}

    logs.forEach((log) => {
      if (log.activity && !log.is_skipped) {
        if (!activityMap[log.activity]) {
          activityMap[log.activity] = 0
        }
        activityMap[log.activity] += 0.5 // Each entry is 30 minutes = 0.5 hours
      }
    })

    // Sort by total time descending
    return Object.entries(activityMap)
      .map(([activity, hours]) => ({ activity, hours }))
      .sort((a, b) => b.hours - a.hours)
  }

  const formatHours = (hours) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const getActivityColor = (activity) => {
    const text = activity?.toLowerCase() || ''
    if (text.includes('office') || text.includes('work')) return 'bg-yellow-500'
    if (text.includes('personal')) return 'bg-pink-500'
    if (text.includes('workout') || text.includes('exercise')) return 'bg-purple-500'
    if (text.includes('meditation')) return 'bg-green-500'
    if (text.includes('break')) return 'bg-orange-500'
    if (text.includes('lunch') || text.includes('breakfast')) return 'bg-cyan-500'
    if (text.includes('college') || text.includes('study')) return 'bg-blue-500'
    return 'bg-accent'
  }

  const activityTotals = calculateActivityTotals()
  const totalHours = activityTotals.reduce((sum, item) => sum + item.hours, 0)

  if (activityTotals.length === 0) {
    return null
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-text-primary mb-3">Activity Summary</h3>
      <div className="bg-surface rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-background">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase border-b border-border">
                Activity
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase border-b border-border">
                Time Spent
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-text-secondary uppercase border-b border-border">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody>
            {activityTotals.map((item, index) => {
              const percentage = ((item.hours / totalHours) * 100).toFixed(1)
              return (
                <tr
                  key={item.activity}
                  className={`border-b border-border ${
                    index % 2 === 0 ? 'bg-surface' : 'bg-background'
                  } hover:bg-accent/5 transition-colors`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getActivityColor(item.activity)}`}></div>
                      <span className="text-text-primary font-medium">{item.activity}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-text-primary font-mono font-semibold">
                    {formatHours(item.hours)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 h-2 bg-background rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getActivityColor(item.activity)}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-text-secondary text-sm font-medium w-12 text-right">
                        {percentage}%
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
            <tr className="bg-background font-bold">
              <td className="px-4 py-3 text-text-primary border-t-2 border-border">Total</td>
              <td className="px-4 py-3 text-right text-text-primary font-mono border-t-2 border-border">
                {formatHours(totalHours)}
              </td>
              <td className="px-4 py-3 text-right text-text-primary border-t-2 border-border">
                100%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ActivitySummaryTable
