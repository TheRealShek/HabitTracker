import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'
import { useUpdateTimeLog, useInsertTimeLog } from '../hooks/useTimeLogs'

const TimeBlockingSchedule = ({ logs, onUpdate, activities: customActivities }) => {
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  
  // React Query mutations
  const updateMutation = useUpdateTimeLog()
  const insertMutation = useInsertTimeLog()

  // Cache processed logs with IST time data for performance
  const processedLogs = useMemo(() => {
    return logs.map(log => {
      const logDate = new Date(log.timestamp)
      // Parse IST hour and minute once per log
      const istHour = parseInt(logDate.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' }))
      const istMinute = parseInt(logDate.toLocaleString('en-US', { minute: '2-digit', timeZone: 'Asia/Kolkata' }))
      return {
        ...log,
        date: logDate,
        istHour,
        istMinute
      }
    })
  }, [logs])

  const activities = customActivities || [
    'Office Work',
    'Personal',
    'Workout',
    'Meditation',
    'Break',
    'Lunch',
    'College time'
  ]

  const handleDoubleClick = (day, slot, activity) => {
    setEditingCell({ day: day.toISOString(), slot: slot.value })
    setEditValue(activity?.activity || '')
  }

  const handleSave = async (day, slot) => {
    const [hours, minutes] = slot.value.split(':').map(Number)
    
    // Find existing activity using cached processed logs
    const activity = processedLogs.find((log) => {
      return (
        isSameDay(log.date, day) &&
        log.istHour === hours &&
        log.istMinute === minutes
      )
    })

    if (activity) {
      // Update existing using React Query mutation
      await updateMutation.mutateAsync({
        id: activity.id,
        activity: editValue || null,
        is_skipped: !editValue
      })
    } else if (editValue) {
      // Insert new using React Query mutation
      const { data: { user } } = await supabase.auth.getUser()
      
      const localDate = new Date(day)
      localDate.setHours(hours, minutes, 0, 0)
      
      await insertMutation.mutateAsync({
        user_id: user.id,
        timestamp: localDate.toISOString(),
        activity: editValue,
        is_skipped: false
      })
    }

    setEditingCell(null)
    setEditValue('')
    if (onUpdate) onUpdate()
  }

  const handleCancel = () => {
    setEditingCell(null)
    setEditValue('')
  }
  // Memoize time slots generation
  const timeSlots = useMemo(() => {
    const slots = []
    // 9 AM to 11:30 PM only
    for (let hour = 9; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const isPM = hour >= 12
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        const ampm = isPM ? 'PM' : 'AM'
        slots.push({
          value: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          display: `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
        })
      }
    }
    return slots
  }, [])
  
  // Memoize days of week
  const daysOfWeek = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [])

  // Calculate daily totals for each activity (excluding Sleep)
  const calculateDailyTotals = (day) => {
    const activityMap = {}
    
    processedLogs.forEach((log) => {
      // Only count logs that match our displayed time slots (9:00-23:30)
      // Must be same day, not skipped, not Sleep, and in valid hour range
      if (
        isSameDay(log.date, day) && 
        log.activity && 
        !log.is_skipped && 
        log.activity !== 'Sleep'
      ) {
        // Check if this time slot exists in our schedule
        const isValidSlot = (log.istHour === 9 && log.istMinute >= 0) || // 9:00 AM onwards
                           (log.istHour > 9 && log.istHour < 23) ||       // 10:00 AM - 10:30 PM
                           (log.istHour === 23 && log.istMinute <= 30)    // Up to 11:30 PM
        
        if (isValidSlot) {
          if (!activityMap[log.activity]) {
            activityMap[log.activity] = 0
          }
          activityMap[log.activity] += 0.5 // 30 minutes
        }
      }
    })

    return activityMap
  }

  const formatHours = (hours) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    
    if (h === 0) return `${m}m`
    if (m === 0) return `${h}h`
    return `${h}h ${m}m`
  }

  const getActivityForSlot = (day, slot) => {
    const [hours, minutes] = slot.value.split(':').map(Number)
    return processedLogs.find((log) => {
      return (
        isSameDay(log.date, day) &&
        log.istHour === hours &&
        log.istMinute === minutes
      )
    })
  }

  const getCellColor = (activity) => {
    if (!activity) return 'bg-background'
    if (activity.is_skipped) return 'bg-red-500/20'
    
    const text = activity.activity?.toLowerCase() || ''
    if (text.includes('office') || text.includes('work')) return 'bg-yellow-500/30'
    if (text.includes('personal')) return 'bg-pink-500/30'
    if (text.includes('workout') || text.includes('exercise')) return 'bg-purple-500/30'
    if (text.includes('meditation')) return 'bg-green-500/30'
    if (text.includes('break')) return 'bg-orange-500/30'
    if (text.includes('lunch') || text.includes('breakfast')) return 'bg-cyan-500/30'
    if (text.includes('college') || text.includes('study')) return 'bg-blue-500/30'
    return 'bg-accent/30'
  }

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-background">
              <th className="px-3 py-3 text-left text-xs font-medium text-text-secondary uppercase border-r border-border sticky left-0 bg-background z-10 min-w-[100px]">
                Time
              </th>
              {daysOfWeek.map((day) => (
                <th
                  key={day.toISOString()}
                  className="px-4 py-3 text-center text-xs font-medium text-text-secondary uppercase border-r border-border min-w-[120px]"
                >
                  <div>{format(day, 'EEE')}</div>
                  <div className="text-text-primary font-bold">{format(day, 'MMM dd')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot) => (
              <tr key={slot.value} className="border-b border-border hover:bg-background/30">
                <td className="px-3 py-3 text-sm text-text-secondary font-mono border-r border-border sticky left-0 bg-surface z-10">
                  {slot.display}
                </td>
                {daysOfWeek.map((day) => {
                  const activity = getActivityForSlot(day, slot)
                  const isEditing = editingCell?.day === day.toISOString() && editingCell?.slot === slot.value
                  
                  return (
                    <td
                      key={`${day.toISOString()}-${slot.value}`}
                      className={`px-2 py-3 text-xs text-center border-r border-border cursor-pointer transition-all hover:ring-2 hover:ring-accent/30 hover:bg-accent/5 ${getCellColor(
                        activity
                      )}`}
                      onDoubleClick={() => handleDoubleClick(day, slot, activity)}
                      title="Double-click to edit"
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-1.5 p-2 bg-background/80 backdrop-blur-sm rounded border border-accent shadow-lg">
                          <select
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="bg-surface text-text-primary border border-accent/50 rounded px-2 py-1 text-xs w-full focus:outline-none focus:ring-2 focus:ring-accent"
                            autoFocus
                          >
                            <option value="">-- Empty --</option>
                            {activities.map((act) => (
                              <option key={act} value={act}>
                                {act}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleSave(day, slot)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {activity ? (
                            activity.is_skipped ? (
                              <span className="text-red-400">❌</span>
                            ) : (
                              <span className="text-text-primary font-medium">
                                {activity.activity}
                              </span>
                            )
                          ) : (
                            ''
                          )}
                        </>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tbody className="border-t-2 border-border">
            <tr className="bg-surface/50">
              <td className="px-3 py-4 text-sm text-text-secondary font-mono border-r border-border sticky left-0 bg-surface/50 z-10">
                <div className="font-semibold">Sleep</div>
                <div className="text-xs">1:00 AM - 9:00 AM</div>
              </td>
              {daysOfWeek.map((day) => (
                <td
                  key={`sleep-${day.toISOString()}`}
                  className="px-2 py-4 text-center border-r border-border bg-gray-700/30"
                >
                  <span className="text-text-primary font-medium">Sleep (8h)</span>
                </td>
              ))}
            </tr>
          </tbody>
          <tfoot className="bg-background border-t-2 border-border">
            <tr>
              <td className="px-3 py-3 text-sm font-semibold text-text-primary border-r border-border sticky left-0 bg-background z-10">
                Daily Total
              </td>
              {daysOfWeek.map((day) => {
                const dailyTotals = calculateDailyTotals(day)
                const totalHours = Object.values(dailyTotals).reduce((sum, h) => sum + h, 0)
                
                return (
                  <td
                    key={`total-${day.toISOString()}`}
                    className="px-2 py-3 border-r border-border"
                  >
                    <div className="text-center">
                      <div className="text-sm font-bold text-text-primary mb-1">
                        {totalHours > 0 ? formatHours(totalHours) : '-'}
                      </div>
                      {totalHours > 0 && (
                        <div className="text-xs text-text-secondary space-y-0.5">
                          {(() => {
                            const sorted = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])
                            const top4 = sorted.slice(0, 4)
                            const rest = sorted.slice(4)
                            const otherTotal = rest.reduce((sum, [_, hours]) => sum + hours, 0)
                            
                            return (
                              <>
                                {top4.map(([activity, hours]) => (
                                  <div key={activity} className="truncate" title={`${activity}: ${formatHours(hours)}`}>
                                    {activity}: {formatHours(hours)}
                                  </div>
                                ))}
                                {otherTotal > 0 && (
                                  <div className="truncate" title={`Other: ${formatHours(otherTotal)}`}>
                                    Other: {formatHours(otherTotal)}
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default TimeBlockingSchedule
